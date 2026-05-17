"use server";

import {
  coreSearchUniversalLeads,
  type CoreUniversalSearchResult,
} from "@/src/lib/leadSearch/universal";
import { getRequestUserId } from "@/src/lib/session";

export interface UniversalSearchResult {
  success: boolean;
  /** Скільки записів реально записано / оновлено в CRM */
  saved?: number;
  skipped?: number;
  limitReached?: boolean;
  error?: string;
  errorCode?: "LIMIT_REACHED" | "PROMPT_TOO_LONG";
}

interface SearchUniversalLeadsOptions {
  region?: string | null;
}

export async function searchUniversalLeads(
  prompt: string,
  options: SearchUniversalLeadsOptions = {},
): Promise<UniversalSearchResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const core = await coreSearchUniversalLeads({
    userId,
    prompt,
    region: options.region ?? null,
  });
  return toActionResult(core);
}

function toActionResult(
  core: CoreUniversalSearchResult,
): UniversalSearchResult {
  return {
    success: core.success,
    saved: core.saved,
    skipped: core.skipped,
    limitReached: core.limitReached,
    error: core.error,
    errorCode:
      core.errorCode === "LIMIT_REACHED"
        ? "LIMIT_REACHED"
        : core.errorCode === "PROMPT_TOO_LONG"
          ? "PROMPT_TOO_LONG"
          : undefined,
  };
}
