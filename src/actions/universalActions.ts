"use server";

import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { GoogleGenAI } from "@google/genai";
import type { Prisma } from "@prisma/client";
import { requireGeminiKey } from "@/src/lib/gemini";
import { prisma } from "@/src/lib/prisma";
import { LeadMode } from "@/src/lib/leadMode";
import { calculateLeadScore } from "@/src/lib/scoring";
import { getRequestUserId } from "@/src/lib/session";
import {
  getLeadLimitStatus,
  getPlanForUser,
  incrementLeadsProcessed,
} from "@/src/lib/subscription";
import { MAX_UNIVERSAL_PROMPT_CHARS } from "@/src/lib/universalSearchConstants";

const MODEL = "gemini-2.5-flash";
const MAX_RESULTS = 12;

export interface UniversalSearchResult {
  success: boolean;
  /** Скільки записів реально записано / оновлено в CRM */
  saved?: number;
  error?: string;
  errorCode?: "LIMIT_REACHED" | "PROMPT_TOO_LONG";
}

function buildUserPrompt(
  userRequest: string,
  region: string | null,
): string {
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
    .replace(/^\uFEFF/, "")
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
  /** Захист від гігантських відповідей, які ламають парсер / пам’ять. */
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

/**
 * Універсальний пошук лідів: Gemini + Google Search grounding, збереження в
 * `Lead` з mode=UNIVERSAL. Дедуп по (userId, mode, companyName) через
 * findFirst + create/update (аналог upsert без окремого унікального індексу).
 */
interface SearchUniversalLeadsOptions {
  region?: string | null;
}

export async function searchUniversalLeads(
  prompt: string,
  options: SearchUniversalLeadsOptions = {},
): Promise<UniversalSearchResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, leadsProcessedCount: true, planResetDate: true },
  });
  if (!user) return { success: false, error: "Користувача не знайдено" };

  const limitStatus = getLeadLimitStatus(user);
  if (!limitStatus.allowed) {
    const plan = getPlanForUser(user);
    return {
      success: false,
      errorCode: "LIMIT_REACHED",
      error: `Ліміт плану ${plan.name} вичерпано (${limitStatus.used}/${plan.leadsPerMonth}). Оновіть тариф на /pricing.`,
    };
  }

  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }

  const trimmed = prompt.trim();
  if (!trimmed) {
    return { success: false, error: "Введіть запит для пошуку" };
  }
  if (trimmed.length > MAX_UNIVERSAL_PROMPT_CHARS) {
    return {
      success: false,
      errorCode: "PROMPT_TOO_LONG",
      error: `Запис занадто довгий — максимум ${MAX_UNIVERSAL_PROMPT_CHARS} символів. Спробуйте коротший або розбийте запит.`,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildUserPrompt(trimmed, options.region ?? null),
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.35,
        maxOutputTokens: 6144,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return { success: false, error: "AI не повернув даних. Спробуйте ще раз." };
    }

    const items = parseLeadArray(text);
    if (items.length === 0) {
      return {
        success: false,
        error:
          "Не вдалося розпарсити відповідь AI або масив порожній. Спростіть або скорочено сформулюйте запит і спробуйте знову.",
      };
    }

    let written = 0;
    let newLeadCount = 0;

    for (const item of items) {
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
          typeof socialJson === "object" && socialJson !== null && !Array.isArray(socialJson)
            ? { ...(socialJson as Record<string, string>) }
            : {};
        base.vacancy = vacancyUrl;
        socialJson = base;
      }

      const notes = mergeNotes(description, vacancyUrl);

      const score = calculateLeadScore({ website, email }, null);

      const companyName = name.slice(0, 500);

      const existing = await prisma.lead.findFirst({
        where: {
          userId,
          mode: LeadMode.UNIVERSAL,
          companyName,
        },
        select: { id: true },
      });

      const payload = {
        notes,
        website,
        email,
        ...(socialJson !== undefined ? { socialLinks: socialJson } : {}),
        score,
        source: "Universal AI",
      };

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: payload,
        });
        written++;
      } else {
        await prisma.lead.create({
          data: {
            userId,
            mode: LeadMode.UNIVERSAL,
            companyName,
            ...payload,
          },
        });
        written++;
        newLeadCount++;
      }
    }

    if (written === 0) {
      return {
        success: false,
        error:
          "AI не повернув жодного валідного запису з полем name. Спробуйте переформулювати запит.",
      };
    }

    if (newLeadCount > 0) {
      await incrementLeadsProcessed(userId, newLeadCount);
    }

    await revalidateLocalizedPath("/dashboard");
    return { success: true, saved: written };
  } catch (error) {
    console.error("searchUniversalLeads error:", error);
    let msg =
      error instanceof Error
        ? error.message
        : "Невідома помилка під час універсального пошуку";
    const low = msg.toLowerCase();
    if (
      low.includes("timeout") ||
      low.includes("deadline") ||
      low.includes("aborted") ||
      low.includes("504")
    ) {
      msg =
        "Час очікування вичерпано (складний пошук займає довше). Скоростіть запит, обмежте кількість джерел або спробуйте ще раз.";
    }
    return { success: false, error: msg };
  }
}
