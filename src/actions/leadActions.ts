"use server";

import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { requireGeminiKey } from "@/src/lib/gemini";
import { searchLocalBusinessesViaGemini } from "@/src/lib/geminiLocalBusinessSearch";
import { prisma } from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/session";
import {
  getLeadLimitStatus,
  getPlanForUser,
  incrementLeadsProcessed,
} from "@/src/lib/subscription";

function calculateLocalLeadScore(input: {
  website: string | null;
  hasOnlineBooking: boolean;
  painPoints: string[];
}): number {
  let score = 50;
  if (!input.website) score += 15;
  if (!input.hasOnlineBooking) score += 20;
  if (input.painPoints.length > 0) score += 30;
  return Math.max(0, Math.min(100, score));
}

export interface LeadActionResult {
  success: boolean;
  count: number;
  skipped?: number;
  /** True when the search returned no businesses (distinct from all-duplicates). */
  noMatches?: boolean;
  error?: string;
  /** Машиночитаний код помилки, e.g. "LIMIT_REACHED". */
  errorCode?: "LIMIT_REACHED";
  limit?: number;
  used?: number;
}

export async function searchAndSaveLeads(
  query: string,
  city: string
): Promise<LeadActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, count: 0, error: "Не авторизовано" };
    }

    if (!query.trim() || !city.trim()) {
      return {
        success: false,
        count: 0,
        error: "Query and city are required",
      };
    }

    // Перевірка ліміту до дорогого AI-запиту.
    const limitStatus = getLeadLimitStatus(user);
    if (!limitStatus.allowed) {
      const plan = getPlanForUser(user);
      return {
        success: false,
        count: 0,
        errorCode: "LIMIT_REACHED",
        limit: plan.leadsPerMonth,
        used: limitStatus.used,
        error: `Ліміт плану ${plan.name} вичерпано (${limitStatus.used}/${plan.leadsPerMonth}). Оновіть тариф на /pricing.`,
      };
    }

    const apiKey = requireGeminiKey();

    const scrapedLeads = await searchLocalBusinessesViaGemini(
      query,
      city,
      apiKey,
    );

    if (scrapedLeads.length === 0) {
      return {
        success: true,
        count: 0,
        skipped: 0,
        noMatches: true,
      };
    }

    let savedCount = 0;
    let skippedCount = 0;
    let remaining = limitStatus.unlimited
      ? Number.POSITIVE_INFINITY
      : limitStatus.remaining;

    for (const lead of scrapedLeads) {
      try {
        // Dedup is per-user: один і той самий бізнес може існувати в БД у
        // декількох юзерів незалежно один від одного. Дедуплікуємо лише в
        // межах поточного userId.
        const existing = await prisma.lead.findFirst({
          where: {
            userId: user.id,
            OR: [
              ...(lead.website ? [{ website: lead.website }] : []),
              { companyName: lead.companyName, city },
            ],
          },
          select: { id: true },
        });

        if (existing) {
          await prisma.lead.update({
            where: { id: existing.id },
            data: { updatedAt: new Date() },
          });
          skippedCount++;
          continue;
        }

        // Якщо ліміт вичерпано під час збереження — пропускаємо решту.
        if (remaining <= 0) {
          skippedCount++;
          continue;
        }

        const initialScore = calculateLocalLeadScore({
          website: lead.website,
          hasOnlineBooking: lead.hasOnlineBooking,
          painPoints: lead.painPoints,
        });

        await prisma.lead.create({
          data: {
            userId: user.id,
            companyName: lead.companyName,
            website: lead.website,
            phone: lead.phone,
            city,
            category: query,
            source: "Web search (AI)",
            painPoints: lead.painPoints,
            hasOnlineBooking: lead.hasOnlineBooking,
            score: initialScore,
          },
        });
        savedCount++;
        remaining -= 1;
      } catch (dbError) {
        console.error(`Failed to process lead "${lead.companyName}":`, dbError);
      }
    }

    if (savedCount > 0) {
      await incrementLeadsProcessed(user.id, savedCount);
      await revalidateLocalizedPath("/");
    }

    return {
      success: true,
      count: savedCount,
      skipped: skippedCount,
    };
  } catch (error) {
    console.error("searchAndSaveLeads error:", error);
    return {
      success: false,
      count: 0,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
