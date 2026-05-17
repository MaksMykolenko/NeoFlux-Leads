import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { actionError } from "@/src/lib/i18n/actionErrors";
import { requireGeminiKey } from "@/src/lib/gemini";
import { searchLocalBusinessesViaGemini } from "@/src/lib/geminiLocalBusinessSearch";
import { prisma } from "@/src/lib/prisma";
import { calculateLocalLeadScore } from "@/src/lib/scoring";
import {
  getLeadLimitStatus,
  getPlanForUser,
  incrementLeadsProcessedInTx,
  withUserLeadLimitLock,
} from "@/src/lib/subscription";

export interface CoreLocalSearchInput {
  userId: string;
  query: string;
  city: string;
  region?: string | null;
  /** User's offer for this search, e.g. "website redesign". */
  service?: string | null;
  /** Preferred outreach language for the campaign. */
  language?: string | null;
  /** Лейбл джерела для `Lead.source`. UI default — "Web search (AI)". */
  source?: string;
  /** Якщо задано — присвоюється `Lead.pipelineStatus` (для Автопілота). */
  pipelineStatus?: string;
  /** Якщо false — пропустити revalidatePath (cron не має UI-кешу). */
  revalidate?: boolean;
}

export interface CoreLocalSearchResult {
  success: boolean;
  count: number;
  skipped?: number;
  noMatches?: boolean;
  error?: string;
  errorCode?: "LIMIT_REACHED" | "USER_NOT_FOUND";
  limit?: number;
  used?: number;
}

/**
 * Чистий пошук + збереження LOCAL-лідів. Без cookie-залежностей — використовує
 * лише `userId`. Викликається з server actions (після перевірки сесії) та з
 * cron-завдань (`step-1-search`).
 */
export async function coreSearchAndSaveLeads(
  input: CoreLocalSearchInput,
): Promise<CoreLocalSearchResult> {
  const {
    userId,
    query,
    city,
    region = null,
    service = null,
    language = null,
    source = "Web search (AI)",
    pipelineStatus,
    revalidate = true,
  } = input;

  const trimmedQuery = query.trim();
  const trimmedCity = city.trim();
  const trimmedService = service?.trim() || null;
  const trimmedLanguage = language?.trim() || null;
  if (!trimmedQuery || !trimmedCity) {
    return {
      success: false,
      count: 0,
      error: await actionError("queryCityRequired"),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, leadsProcessedCount: true, planResetDate: true },
  });
  if (!user) {
    return {
      success: false,
      count: 0,
      errorCode: "USER_NOT_FOUND",
      error: await actionError("userNotFound"),
    };
  }

  // Pre-flight UX check — return a friendly LIMIT_REACHED before we spend a
  // Gemini call. The real, race-safe enforcement happens via
  // `tryClaimLeadSlots` after we know how many leads the AI returned.
  const limitStatus = getLeadLimitStatus(user);
  if (!limitStatus.allowed) {
    const plan = getPlanForUser(user);
    return {
      success: false,
      count: 0,
      errorCode: "LIMIT_REACHED",
      limit: plan.leadsPerMonth,
      used: limitStatus.used,
      error: await actionError("limitReached", {
        plan: plan.name,
        used: limitStatus.used,
        limit: plan.leadsPerMonth,
      }),
    };
  }

  const apiKey = requireGeminiKey();
  const scrapedLeads = await searchLocalBusinessesViaGemini(
    trimmedQuery,
    trimmedCity,
    apiKey,
    region,
    { service: trimmedService, language: trimmedLanguage },
  );

  if (scrapedLeads.length === 0) {
    return { success: true, count: 0, skipped: 0, noMatches: true };
  }

  const saveResult = await withUserLeadLimitLock(userId, async (tx) => {
    const lockedUser = await tx.user.findUnique({
      where: { id: userId },
      select: { plan: true, leadsProcessedCount: true, planResetDate: true },
    });
    if (!lockedUser) {
      return {
        success: false as const,
        count: 0,
        skipped: 0,
        errorCode: "USER_NOT_FOUND" as const,
        error: await actionError("userNotFound"),
      };
    }

    const lockedLimit = getLeadLimitStatus(lockedUser);
    if (!lockedLimit.allowed) {
      const plan = getPlanForUser(lockedUser);
      return {
        success: false as const,
        count: 0,
        skipped: 0,
        errorCode: "LIMIT_REACHED" as const,
        limit: plan.leadsPerMonth,
        used: lockedLimit.used,
        error: await actionError("limitReached", {
          plan: plan.name,
          used: lockedLimit.used,
          limit: plan.leadsPerMonth,
        }),
      };
    }

    let savedCount = 0;
    let skippedCount = 0;
    let remaining = lockedLimit.unlimited
      ? Number.POSITIVE_INFINITY
      : lockedLimit.remaining;

    for (const lead of scrapedLeads) {
      try {
        const existing = await tx.lead.findFirst({
          where: {
            userId,
            OR: [
              ...(lead.website ? [{ website: lead.website }] : []),
              { companyName: lead.companyName, city: trimmedCity },
            ],
          },
          select: { id: true },
        });

        if (existing) {
          await tx.lead.update({
            where: { id: existing.id },
            data: { updatedAt: new Date() },
          });
          skippedCount++;
          continue;
        }

        if (remaining <= 0) {
          skippedCount++;
          continue;
        }

        const initialScore = calculateLocalLeadScore({
          website: lead.website,
          hasOnlineBooking: lead.hasOnlineBooking,
          painPoints: lead.painPoints,
        });

        await tx.lead.create({
          data: {
            userId,
            companyName: lead.companyName,
            website: lead.website,
            phone: lead.phone,
            city: trimmedCity,
            category: trimmedQuery,
            source: lead.sourceUrl ? `Google Search: ${lead.sourceUrl}` : source,
            notes: buildSearchContextNotes(trimmedService, trimmedLanguage),
            painPoints: lead.painPoints,
            hasOnlineBooking: lead.hasOnlineBooking,
            score: initialScore,
            ...(pipelineStatus ? { pipelineStatus } : {}),
          },
        });
        savedCount++;
        remaining -= 1;
      } catch (dbError) {
        console.error(`Failed to process lead "${lead.companyName}":`, dbError);
      }
    }

    if (savedCount > 0) {
      await incrementLeadsProcessedInTx(tx, userId, savedCount);
    }

    return {
      success: true as const,
      count: savedCount,
      skipped: skippedCount,
    };
  });

  if (!saveResult.success) return saveResult;

  const { count: savedCount, skipped: skippedCount } = saveResult;

  if (savedCount > 0 && revalidate) {
    await revalidateLocalizedPath("/");
  }

  return {
    success: true,
    count: savedCount,
    skipped: skippedCount,
  };
}

function buildSearchContextNotes(
  service: string | null,
  language: string | null,
): string | undefined {
  const rows = [
    service ? `Offer: ${service}` : null,
    language ? `Language: ${language}` : null,
  ].filter(Boolean);
  return rows.length > 0 ? rows.join("\n") : undefined;
}
