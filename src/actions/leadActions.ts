"use server";

import { prisma } from "@/src/lib/prisma";
import { calculateLeadScore } from "@/src/lib/scoring";
import { getRequestUserId } from "@/src/lib/session";

export interface LeadActionResult {
  success: boolean;
  count: number;
  skipped?: number;
  error?: string;
}

export async function searchAndSaveLeads(
  query: string,
  city: string
): Promise<LeadActionResult> {
  try {
    const userId = await getRequestUserId();
    if (!userId) {
      return { success: false, count: 0, error: "Не авторизовано" };
    }

    if (!query.trim() || !city.trim()) {
      return {
        success: false,
        count: 0,
        error: "Query and city are required",
      };
    }

    const { scrapeGoogleMaps } = await import(
      "@/src/modules/scraper/googleMapsScraper"
    );
    const scrapedLeads = await scrapeGoogleMaps(query, city);

    if (scrapedLeads.length === 0) {
      return {
        success: true,
        count: 0,
        skipped: 0,
      };
    }

    let savedCount = 0;
    let skippedCount = 0;

    for (const lead of scrapedLeads) {
      try {
        // Dedup is per-user: один і той самий бізнес може існувати в БД у
        // декількох юзерів незалежно один від одного. Дедуплікуємо лише в
        // межах поточного userId.
        const existing = await prisma.lead.findFirst({
          where: {
            userId,
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

        // Initial Opportunity Score from data we have at scrape time.
        // No audit yet, so SSL/mobile penalties don't apply; landing-platform
        // bonus does (e.g. Instagram-only listings get an immediate boost).
        const initialScore = calculateLeadScore(
          { website: lead.website, email: null },
          null
        );

        await prisma.lead.create({
          data: {
            userId,
            companyName: lead.companyName,
            website: lead.website,
            phone: lead.phone,
            city,
            category: query,
            source: "Google Maps",
            score: initialScore,
          },
        });
        savedCount++;
      } catch (dbError) {
        console.error(`Failed to process lead "${lead.companyName}":`, dbError);
      }
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
