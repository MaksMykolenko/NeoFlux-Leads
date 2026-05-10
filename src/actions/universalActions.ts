"use server";

import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { LeadMode } from "@/src/lib/leadMode";
import { calculateLeadScore } from "@/src/lib/scoring";
import { getRequestUserId } from "@/src/lib/session";
import {
  getLeadLimitStatus,
  getPlanForUser,
  incrementLeadsProcessed,
} from "@/src/lib/subscription";

const MODEL = "gemini-2.5-flash";
const MAX_RESULTS = 12;

export interface UniversalSearchResult {
  success: boolean;
  /** Скільки записів реально записано / оновлено в CRM */
  saved?: number;
  error?: string;
  errorCode?: "LIMIT_REACHED";
}

function buildUserPrompt(userRequest: string): string {
  const systemBlock = `Ти — експерт з OSINT та пошуку лідів. Використай Google Search, щоб знайти компанії або людей за запитом користувача. Поверни результат ВИКЛЮЧНО у форматі JSON-масиву. Кожен об'єкт має містити: name (назва або ім'я), description (чим займаються, 1-2 речення), website (якщо є), email (якщо знайдено), та socialLinks (об'єкт з будь-якими знайденими соцмережами, наприклад, linkedin, twitter, instagram).`;

  return `${systemBlock}

Запит користувача: """${userRequest}"""

Вимоги:
- Поверни щонайбільше ${MAX_RESULTS} релевантних сутностей.
- Тільки реальні публічні дані — не вигадуй URL чи email.
- Якщо нічого не знайдено — поверни [].
- Без markdown, без пояснень до або після масиву — лише сирий JSON-масив.`;
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
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }
  return Array.isArray(parsed) ? parsed : [];
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

/**
 * Універсальний пошук лідів: Gemini + Google Search grounding, збереження в
 * `Lead` з mode=UNIVERSAL. Дедуп по (userId, mode, companyName) через
 * findFirst + create/update (аналог upsert без окремого унікального індексу).
 */
export async function searchUniversalLeads(
  prompt: string,
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error:
        "Не налаштовано GEMINI_API_KEY. Додайте ключ у .env та перезапустіть сервер.",
    };
  }

  const trimmed = prompt.trim();
  if (!trimmed) {
    return { success: false, error: "Введіть запит для пошуку" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildUserPrompt(trimmed),
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.35,
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
          "Не вдалося розпарсити відповідь AI або масив порожній. Спробуйте інший запит.",
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
      const socialJson = sanitizeSocialLinks(rec.socialLinks);

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
        notes: description ? description.slice(0, 8000) : null,
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

    revalidatePath("/");
    return { success: true, saved: written };
  } catch (error) {
    console.error("searchUniversalLeads error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Невідома помилка під час універсального пошуку",
    };
  }
}
