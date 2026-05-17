"use server";

import {
  coreSearchAndSaveLeads,
  type CoreLocalSearchResult,
} from "@/src/lib/leadSearch/local";
import { getCurrentUser } from "@/src/lib/session";

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
  city: string,
  region: string | null = null,
  context?: { service?: string | null; language?: string | null },
): Promise<LeadActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, count: 0, error: "Не авторизовано" };
    }

    const result = await coreSearchAndSaveLeads({
      userId: user.id,
      query,
      city,
      region,
      service: context?.service,
      language: context?.language,
    });
    return toActionResult(result);
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

function toActionResult(core: CoreLocalSearchResult): LeadActionResult {
  return {
    success: core.success,
    count: core.count,
    skipped: core.skipped,
    noMatches: core.noMatches,
    error: core.error,
    errorCode: core.errorCode === "LIMIT_REACHED" ? "LIMIT_REACHED" : undefined,
    limit: core.limit,
    used: core.used,
  };
}
