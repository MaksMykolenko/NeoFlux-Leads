import { GoogleGenAI } from "@google/genai";
import type { Prisma } from "@prisma/client";
import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { actionError } from "@/src/lib/i18n/actionErrors";
import { requireGeminiKey } from "@/src/lib/gemini";
import { LeadMode } from "@/src/lib/leadMode";
import { consumeLeadSlot } from "@/src/lib/leadSlotMath";
import { prisma } from "@/src/lib/prisma";
import { calculateLeadScore } from "@/src/lib/scoring";
import {
  getLeadLimitStatus,
  getPlanForUser,
  incrementLeadsProcessedInTx,
  withUserLeadLimitLock,
} from "@/src/lib/subscription";
import { MAX_UNIVERSAL_PROMPT_CHARS } from "@/src/lib/universalSearchConstants";

const MODEL = "gemini-2.5-flash";
const MAX_RESULTS = 12;

export interface CoreUniversalSearchInput {
  userId: string;
  prompt: string;
  region?: string | null;
  /** Лейбл для `Lead.source`. UI default — "Universal AI". */
  source?: string;
  /** Якщо задано — присвоюється `Lead.pipelineStatus` (для Автопілота). */
  pipelineStatus?: string;
  /** Якщо false — пропустити revalidatePath (cron не має UI-кешу). */
  revalidate?: boolean;
}

export interface CoreUniversalSearchResult {
  success: boolean;
  saved?: number;
  skipped?: number;
  limitReached?: boolean;
  error?: string;
  errorCode?: "LIMIT_REACHED" | "PROMPT_TOO_LONG" | "USER_NOT_FOUND";
}

/**
 * Чистий пошук + збереження UNIVERSAL-лідів через Gemini з Google Search
 * grounding. Без cookie-залежностей. Дедуплікація per-(userId, mode,
 * companyName) — find-or-update / create.
 */
export async function coreSearchUniversalLeads(
  input: CoreUniversalSearchInput,
): Promise<CoreUniversalSearchResult> {
  const {
    userId,
    prompt,
    region = null,
    source = "Universal AI",
    pipelineStatus,
    revalidate = true,
  } = input;

  const trimmed = prompt.trim();
  if (!trimmed) {
    return { success: false, error: await actionError("searchPromptRequired") };
  }
  if (trimmed.length > MAX_UNIVERSAL_PROMPT_CHARS) {
    return {
      success: false,
      errorCode: "PROMPT_TOO_LONG",
      error: await actionError("searchPromptTooLong", {
        max: MAX_UNIVERSAL_PROMPT_CHARS,
      }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, leadsProcessedCount: true, planResetDate: true },
  });
  if (!user) {
    return {
      success: false,
      errorCode: "USER_NOT_FOUND",
      error: await actionError("userNotFound"),
    };
  }

  const limitStatus = getLeadLimitStatus(user);
  if (!limitStatus.allowed) {
    const plan = getPlanForUser(user);
    return {
      success: false,
      errorCode: "LIMIT_REACHED",
      error: await actionError("limitReached", {
        plan: plan.name,
        used: limitStatus.used,
        limit: plan.leadsPerMonth,
      }),
    };
  }

  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildUserPrompt(trimmed, region),
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.35,
        maxOutputTokens: 6144,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return { success: false, error: await actionError("beatSearchNoData") };
    }

    const items = parseLeadArray(text);
    if (items.length === 0) {
      return {
        success: false,
        error: await actionError("universalParseFailed"),
      };
    }

    const saveResult = await withUserLeadLimitLock(userId, async (tx) => {
      const lockedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { plan: true, leadsProcessedCount: true, planResetDate: true },
      });
      if (!lockedUser) {
        return {
          success: false as const,
          saved: 0,
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
          saved: 0,
          skipped: 0,
          errorCode: "LIMIT_REACHED" as const,
          error: await actionError("limitReached", {
            plan: plan.name,
            used: lockedLimit.used,
            limit: plan.leadsPerMonth,
          }),
        };
      }

      let written = 0;
      let newLeadCount = 0;
      let skipped = 0;
      let limitReached = false;
      let remaining = lockedLimit.unlimited
        ? Number.POSITIVE_INFINITY
        : lockedLimit.remaining;

      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        if (!item || typeof item !== "object") continue;
        const rec = item as Record<string, unknown>;
        const name =
          typeof rec.name === "string"
            ? rec.name.trim()
            : typeof rec.companyName === "string"
              ? rec.companyName.trim()
              : "";
        if (!name) continue;

        const description =
          typeof rec.description === "string" ? rec.description.trim() : "";
        const website =
          typeof rec.website === "string" && rec.website.trim()
            ? rec.website.trim()
            : null;
        const email =
          typeof rec.email === "string" && rec.email.trim()
            ? rec.email.trim()
            : null;

        let socialJson = sanitizeSocialLinks(rec.socialLinks);
        const vacancyUrl = pickVacancyUrl(rec);
        if (vacancyUrl) {
          const base =
            typeof socialJson === "object" &&
            socialJson !== null &&
            !Array.isArray(socialJson)
              ? { ...(socialJson as Record<string, string>) }
              : {};
          base.vacancy = vacancyUrl;
          socialJson = base;
        }

        const notes = mergeNotes(description, vacancyUrl);
        const score = calculateLeadScore({ website, email }, null);
        const companyName = name.slice(0, 500);

        const existing = await tx.lead.findFirst({
          where: { userId, mode: LeadMode.UNIVERSAL, companyName },
          select: { id: true },
        });

        const payload: Prisma.LeadUncheckedUpdateInput = {
          notes,
          website,
          email,
          ...(socialJson !== undefined ? { socialLinks: socialJson } : {}),
          score,
          source,
        };

        if (existing) {
          await tx.lead.update({
            where: { id: existing.id },
            data: payload,
          });
          written++;
          continue;
        }

        const slot = consumeLeadSlot(remaining);
        if (!slot.allowed) {
          skipped += countPotentialLeadItems(items, index);
          limitReached = true;
          break;
        }

        await tx.lead.create({
          data: {
            userId,
            mode: LeadMode.UNIVERSAL,
            companyName,
            ...payload,
            ...(pipelineStatus ? { pipelineStatus } : {}),
          } as Prisma.LeadUncheckedCreateInput,
        });
        written++;
        newLeadCount++;
        remaining = slot.remaining;
      }

      if (newLeadCount > 0) {
        await incrementLeadsProcessedInTx(tx, userId, newLeadCount);
      }

      return {
        success: true as const,
        saved: written,
        skipped,
        limitReached,
      };
    });

    if (!saveResult.success) return saveResult;

    const { saved: written, skipped, limitReached } = saveResult;

    if (written === 0) {
      return {
        success: false,
        error: await actionError("universalNoValidRows"),
      };
    }

    if (revalidate) {
      await revalidateLocalizedPath("/dashboard");
    }
    return { success: true, saved: written, skipped, limitReached };
  } catch (error) {
    console.error("coreSearchUniversalLeads error:", error);
    let msg =
      error instanceof Error
        ? error.message
        : await actionError("genericFailed");
    const low = msg.toLowerCase();
    if (
      low.includes("timeout") ||
      low.includes("deadline") ||
      low.includes("aborted") ||
      low.includes("504")
    ) {
      msg = await actionError("universalTimeout");
    }
    return { success: false, error: msg };
  }
}

function countPotentialLeadItems(items: unknown[], startIndex: number): number {
  let count = 0;
  for (let i = startIndex; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const name =
      typeof rec.name === "string"
        ? rec.name.trim()
        : typeof rec.companyName === "string"
          ? rec.companyName.trim()
          : "";
    if (name) count++;
  }
  return count;
}

function buildUserPrompt(userRequest: string, region: string | null): string {
  const systemBlock = `Ти — експерт з OSINT та пошуку лідів. Використай Google Search, щоб знайти компанії або людей за запитом користувача. Поверни результат ВИКЛЮЧНО у форматі JSON-масиву. Кожен об'єкт має містити:
- name або companyName — назва;
- description — короткий опис згідно з запитом (1–3 речення);
- website — офіційний сайт компанії (URL), якщо є;
- email — лише якщо знайдено в публічних джерелах;
- vacancyUrl — пряме посилання на оголошення про роботу / вакансію (якщо користувач просив вакансії), або null якщо немає підтвердженого URL;
- socialLinks — об'єкт з будь-якими іншими корисними посиланнями (linkedin, telegram, instagram тощо), значення лише строки URL.`;

  const regionLine =
    region && region.trim()
      ? `\nFocus search exclusively on entities located in or targeting: ${JSON.stringify(
          region.trim(),
        )}.`
      : "";

  return `${systemBlock}${regionLine}

Запит користувача: """${userRequest}"""

Вимоги:
- Поверни щонайбільше ${MAX_RESULTS} релевантних сутностей.
- Тільки реальні публічні дані — не вигадуй URL чи email.
- Якщо нічого не знайдено — поверни [].
- Без markdown, без пояснень до або після масиву — лише сирий JSON-масив.
- Посилання лише HTTPS з реальних джерел.`;
}

function stripJsonFences(raw: string): string {
  let cleaned = raw
    .replace(/^﻿/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }
  return cleaned;
}

function parseLeadArray(raw: string): unknown[] {
  const cleaned = stripJsonFences(raw);
  if (cleaned.length > 500_000) {
    console.warn("[universal] truncated JSON slice for parse");
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }
  return Array.isArray(parsed) ? parsed : [];
}

function pickVacancyUrl(rec: Record<string, unknown>): string | null {
  const keys = [
    "vacancyUrl",
    "vacancy_url",
    "jobUrl",
    "job_url",
    "vacancy",
    "careersUrl",
  ];
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim().startsWith("http")) {
      return v.trim().slice(0, 2048);
    }
  }
  return null;
}

function sanitizeSocialLinks(raw: unknown): Prisma.InputJsonValue | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const src = raw as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(src)) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!t || t.toLowerCase() === "null") continue;
    const key = k.replace(/[^\w.-]/g, "").slice(0, 64);
    if (!key) continue;
    out[key] = t.slice(0, 2048);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function mergeNotes(description: string, vacancyUrl: string | null): string | null {
  const desc = description.trim().slice(0, 7000);
  const parts: string[] = [];
  if (desc) parts.push(desc);
  if (vacancyUrl) parts.push(`Вакансія / job posting: ${vacancyUrl}`);
  const combined = parts.join("\n\n").trim();
  if (!combined) return null;
  return combined.slice(0, 8000);
}
