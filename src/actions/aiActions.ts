"use server";

import { GoogleGenAI } from "@google/genai";
import { getLocale } from "next-intl/server";
import { actionError } from "@/src/lib/i18n/actionErrors";
import { outputLanguageFromLocale } from "@/src/lib/i18n/outputLanguage";
import { requireGeminiKey } from "@/src/lib/gemini";
import { prisma } from "@/src/lib/prisma";
import { LeadMode } from "@/src/lib/leadMode";
import { getCurrentUser } from "@/src/lib/session";
import { checkSubscription } from "@/src/lib/subscription";

export interface ProposalResult {
  success: boolean;
  text?: string;
  error?: string;
}

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

const DEFAULT_OUTPUT_LANGUAGE = "Ukrainian";

function withOutputLanguage(
  baseInstruction: string,
  language: string | null | undefined,
): string {
  const lang = (language?.trim() || DEFAULT_OUTPUT_LANGUAGE).trim();
  return `${baseInstruction}\n\nCRITICAL: The entire generated message MUST be written exclusively in ${lang}, maintaining a native and professional B2B tone.`;
}

const SYSTEM_INSTRUCTION = `Ти B2B-продажник веб-розробки в українській digital-агенції NeoFlux.
Пишеш короткі (5–7 речень), персоналізовані холодні листи українською мовою.

Тон: професійний, дружній, по-партнерськи, без шаблонів типу "Сподіваюсь, у вас все добре".
Без емодзі. Без markdown. Без HTML. Без preamble. Без заголовка "Subject:".

Структура:
1) Персоналізоване вітання, де згадай нішу та/або місто компанії.
2) Конкретна спостережена проблема — посилайся на реальні знахідки з аудиту, а не загальні слова.
3) 1–2 речення про те, як саме NeoFlux вирішує цю проблему (швидкий редизайн / новий лендінг / оптимізація).
4) Запрошення на короткий 15-хвилинний дзвінок цього тижня.
5) Підпис "З повагою, команда NeoFlux".

Виведи ВИКЛЮЧНО текст листа — без вступу від себе, без "ось ваш лист", без \`\`\` блоків.`;

// Спрощений промпт для безкоштовного плану STARTER. Коротший, без посилань
// на дані аудиту (бо аудит на STARTER заблокований), без структурованих
// блоків. Це робить вихід менш персоналізованим, ніж на Pro/Agency.
const SYSTEM_INSTRUCTION_STARTER = `Ти B2B-продажник веб-розробки в українській digital-агенції NeoFlux.
Пишеш короткий (3–4 речення) шаблонний холодний лист українською.

Без емодзі. Без markdown. Без preamble. Без "Subject:".
Згадай назву компанії і запропонуй коротку зустріч. Підпис: "З повагою, NeoFlux".

Виведи ВИКЛЮЧНО текст листа.`;

const BEAT_SYSTEM_INSTRUCTION = `Ти український біт-продюсер під брендом NeoFlux.
Пишеш короткі (5–8 речень), персоналізовані холодні DM-повідомлення артистам, кому хочеш продати свій біт.

Тон: дружній, peer-to-peer (продюсер-артисту), без формальностей. Зверайся на "ти".
Без емодзі. Без markdown. Без HTML. Без preamble. Без заголовка "Subject:".

Структура:
1) Коротке привітання по імені/нікнейму.
2) Згадай конкретну платформу (SoundCloud / YouTube / Instagram), жанр і чому саме його звучання тебе зачепило (1 речення).
3) Скажи, що скинув йому конкретний біт — обовʼязково назви файл, BPM/тональність/жанр якщо їх дано.
4) Поясни, чому цей біт пасує під його флоу (1 речення).
5) Назви ціну на lease (якщо дано) і запропонуй прислати trackouts якщо зайде.
6) Заклич до простої відповіді — навіть "не моє" допоможе.
7) Підпис "— NeoFlux".

Виведи ВИКЛЮЧНО текст повідомлення — без \`\`\` блоків, без коментарів від себе.`;

function buildIssuesList(input: {
  hasAudit: boolean;
  hasSSL: boolean | null;
  mobileFriendly: boolean | null;
  rawIssues: string[];
  hasWebsite: boolean;
}): string[] {
  const issues: string[] = [];

  if (!input.hasWebsite) {
    issues.push("у компанії немає повноцінного сайту");
    return issues;
  }

  if (input.hasAudit) {
    if (input.hasSSL === false) issues.push("на сайті відсутній SSL-сертифікат");
    if (input.mobileFriendly === false)
      issues.push("сайт не адаптований під мобільні пристрої");
    for (const raw of input.rawIssues) {
      if (raw && !issues.includes(raw)) issues.push(raw);
    }
  }

  return issues;
}

export async function generateProposal(
  leadId: string,
  options: { language?: string | null } = {},
): Promise<ProposalResult> {
  const locale = await getLocale();
  const language =
    options.language ?? outputLanguageFromLocale(locale);
  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }

  if (!leadId) {
    return { success: false, error: await actionError("missingLeadId") };
  }

  const user = await getCurrentUser();
  if (!user) return { success: false, error: await actionError("unauthorized") };
  const advancedAi = checkSubscription(user, "advancedAi");

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: user.id },
      include: { audit: true },
    });

    if (!lead) {
      return { success: false, error: await actionError("leadNotFound") };
    }

    // BEATS-mode leads use a peer-to-peer producer→artist tone instead of the
    // local-business sales pitch. We don't have a demo on the detail page, so
    // the prompt asks for a follow-up DM rather than a "here's the file" DM.
    if (lead.mode === LeadMode.BEATS) {
      return generateBeatProposal({
        artist: {
          handle: lead.companyName,
          realName: lead.realName ?? lead.companyName,
          genre: lead.category ?? "music",
          platform: lead.source ?? "Platform",
          followers: lead.followers,
        },
        demo: null,
      });
    }

    if (lead.mode === LeadMode.UNIVERSAL) {
      const userPrompt = [
        "Контекст ліда (універсальний AI-пошук):",
        `- Назва / особа: ${lead.companyName}`,
        lead.notes ? `- Опис з пошуку: ${lead.notes}` : null,
        `- Сайт: ${lead.website ?? "не вказано"}`,
        `- Email: ${lead.email ?? "не вказано"}`,
        `- Джерело: ${lead.source ?? "Universal AI"}`,
        "",
        `Write a short B2B cold email in ${language}: reference the activity description, propose web/digital value, and invite a brief meeting.`,
      ]
        .filter(Boolean)
        .join("\n");

      const ai = new GoogleGenAI({ apiKey });
      let lastError: unknown;
      for (const model of MODELS) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction: withOutputLanguage(
                advancedAi ? SYSTEM_INSTRUCTION : SYSTEM_INSTRUCTION_STARTER,
                language,
              ),
              temperature: advancedAi ? 0.7 : 0.5,
              maxOutputTokens: advancedAi ? 800 : 300,
            },
          });
          const text = response.text?.trim();
          if (!text) return { success: false, error: await actionError("aiNoText") };
          return { success: true, text };
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("503") && !msg.includes("UNAVAILABLE") && !msg.includes("high demand")) {
            break;
          }
          console.warn(`[AI] ${model} unavailable, trying next...`);
        }
      }
      console.error("generateProposal universal error:", lastError);
      return {
        success: false,
        error:
          lastError instanceof Error
            ? lastError.message
            : "Помилка генерації для універсального ліда",
      };
    }

    const issues = buildIssuesList({
      hasAudit: !!lead.audit,
      hasSSL: lead.audit?.hasSSL ?? null,
      mobileFriendly: lead.audit?.mobileFriendly ?? null,
      rawIssues: lead.audit?.issues ?? [],
      hasWebsite: !!lead.website,
    });

    const userPrompt = [
      "Контекст ліда:",
      `- Компанія: ${lead.companyName}`,
      `- Ніша / категорія: ${lead.category ?? "не вказано"}`,
      `- Місто: ${lead.city ?? "не вказано"}`,
      `- Сайт: ${lead.website ?? "відсутній"}`,
      `- Opportunity Score: ${lead.score}/100`,
      lead.audit?.performanceScore != null
        ? `- Performance Score сайту: ${lead.audit.performanceScore}/100`
        : null,
      `- Знайдені «болі»: ${
        issues.length ? issues.join("; ") : "явних технічних проблем не виявлено"
      }`,
      "",
      "Напиши холодний лист українською, який природно тисне на зазначені болі (якщо вони є). Якщо болей нема — зосередься на потенціалі росту трафіку та конверсій.",
    ]
      .filter(Boolean)
      .join("\n");

    const ai = new GoogleGenAI({ apiKey });

    let lastError: unknown;
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: withOutputLanguage(
              advancedAi ? SYSTEM_INSTRUCTION : SYSTEM_INSTRUCTION_STARTER,
              language,
            ),
            temperature: advancedAi ? 0.7 : 0.5,
            maxOutputTokens: advancedAi ? 800 : 300,
          },
        });

        const text = response.text?.trim();
        if (!text) return { success: false, error: "AI не повернув тексту" };
        return { success: true, text };
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("503") && !msg.includes("UNAVAILABLE") && !msg.includes("high demand")) {
          break;
        }
        console.warn(`[AI] ${model} unavailable, trying next...`);
      }
    }

    console.error("generateProposal error:", lastError);
    return {
      success: false,
      error:
        lastError instanceof Error
          ? lastError.message
          : "An unexpected error occurred while generating proposal",
    };
  } catch (error) {
    console.error("generateProposal error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while generating proposal",
    };
  }
}

export interface BeatProposalInput {
  artist: {
    handle: string;
    realName: string;
    genre: string;
    platform: string;
    followers?: number | null;
  };
  demo?: {
    name: string;
    bpm?: string | null;
    keySig?: string | null;
    genre?: string | null;
    price?: string | null;
  } | null;
}

export async function generateBeatProposal(
  input: BeatProposalInput,
  options: { language?: string | null } = {},
): Promise<ProposalResult> {
  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }

  const language = options.language ?? DEFAULT_OUTPUT_LANGUAGE;
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизовано" };
  const advancedAi = checkSubscription(user, "advancedAi");

  const { artist, demo } = input;
  if (!artist?.handle) {
    return { success: false, error: "Missing artist data" };
  }

  try {
    const demoFacts = demo
      ? [
          `- Файл: ${demo.name}`,
          demo.bpm ? `- BPM: ${demo.bpm}` : null,
          demo.keySig ? `- Тональність: ${demo.keySig}` : null,
          demo.genre ? `- Жанр біта: ${demo.genre}` : null,
          demo.price ? `- Ціна за lease: $${demo.price}` : null,
        ].filter(Boolean)
      : ["- Файл біта поки не прикріплений — пиши узагальнено"];

    const userPrompt = [
      "Контекст артиста:",
      `- Нік: ${artist.handle}`,
      `- Реальне імʼя: ${artist.realName}`,
      `- Жанр / напрямок: ${artist.genre}`,
      `- Платформа: ${artist.platform}`,
      artist.followers != null
        ? `- Аудиторія: ~${artist.followers} фоловерів`
        : null,
      "",
      "Контекст біта:",
      ...demoFacts,
      "",
      "Напиши ОДНЕ повідомлення для DM/email цього артиста українською. Зроби його коротким, по-людськи. Згадай платформу і жанр, конкретно файл біта, чому він підходить артисту.",
    ]
      .filter(Boolean)
      .join("\n");

    const ai = new GoogleGenAI({ apiKey });

    let lastError: unknown;
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: withOutputLanguage(
              advancedAi ? BEAT_SYSTEM_INSTRUCTION : SYSTEM_INSTRUCTION_STARTER,
              language,
            ),
            temperature: advancedAi ? 0.85 : 0.5,
            maxOutputTokens: advancedAi ? 600 : 250,
          },
        });

        const text = response.text?.trim();
        if (!text) return { success: false, error: "AI не повернув тексту" };
        return { success: true, text };
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("503") && !msg.includes("UNAVAILABLE") && !msg.includes("high demand")) {
          break;
        }
        console.warn(`[AI] ${model} unavailable, trying next...`);
      }
    }

    console.error("generateBeatProposal error:", lastError);
    return {
      success: false,
      error:
        lastError instanceof Error
          ? lastError.message
          : "An unexpected error occurred while generating proposal",
    };
  } catch (error) {
    console.error("generateBeatProposal error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while generating proposal",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// AI Re-writer — швидке редагування тону вже згенерованого листа.
// ─────────────────────────────────────────────────────────────────────────

export type RewriteInstruction = "shorter" | "friendlier" | "formal";

const REWRITE_RULES: Record<RewriteInstruction, string> = {
  shorter:
    "Скороти текст до 3-4 коротких речень. Прибери преамбулу і повтори, залиш тільки суть і call-to-action.",
  friendlier:
    "Зроби тон дружнім, по-людськи, на рівні peer-to-peer. Без панібратства й емодзі — просто менш формально.",
  formal:
    "Підвищи формальність. Звертайся на «Ви», структуровано, з чіткою діловою лексикою. Без сленгу.",
};

const REWRITE_SYSTEM = `Ти редактор холодних B2B-листів. Перепиши вхідний текст за заданим правилом.
ЗБЕРЕЖИ: фактичні згадки про компанію, місто, нішу, конкретні знахідки з аудиту, посилання, ціни.
ЗМІНИ: тільки тон/довжину/формальність відповідно до інструкції.
Без емодзі. Без markdown. Без преамбули від себе. Виведи ВИКЛЮЧНО переписаний текст.`;

export async function rewriteProposal(
  currentText: string,
  instruction: RewriteInstruction,
  options: { language?: string | null } = {},
): Promise<ProposalResult> {
  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }

  const language = options.language ?? DEFAULT_OUTPUT_LANGUAGE;
  const trimmed = currentText?.trim();
  if (!trimmed) return { success: false, error: "Текст порожній" };

  const rule = REWRITE_RULES[instruction];
  if (!rule) {
    return { success: false, error: `Невалідна інструкція: ${instruction}` };
  }

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизовано" };

  const userPrompt = `Правило: ${rule}\n\nТекст:\n${trimmed}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    let lastError: unknown;
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: withOutputLanguage(REWRITE_SYSTEM, language),
            temperature: 0.6,
            maxOutputTokens: 800,
          },
        });
        const text = response.text?.trim();
        if (!text) return { success: false, error: "AI не повернув тексту" };
        return { success: true, text };
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (
          !msg.includes("503") &&
          !msg.includes("UNAVAILABLE") &&
          !msg.includes("high demand")
        ) {
          break;
        }
        console.warn(`[AI rewrite] ${model} unavailable, trying next...`);
      }
    }
    return {
      success: false,
      error:
        lastError instanceof Error ? lastError.message : "Failed to rewrite",
    };
  } catch (error) {
    console.error("rewriteProposal error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to rewrite",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Email sequence — 3-step ланцюжок (Pitch → Follow-up → Break-up)
// ─────────────────────────────────────────────────────────────────────────

export interface SequenceStep {
  step: 1 | 2 | 3;
  label: "Pitch" | "Follow-up" | "Break-up";
  subject: string;
  body: string;
}

export interface SequenceResult {
  success: boolean;
  steps?: SequenceStep[];
  error?: string;
}

const SEQUENCE_SYSTEM = `Ти B2B-продажник веб-розробки агенції NeoFlux.
Створюєш ланцюжок із 3 листів українською для холодного outreach.

Лист 1 — Pitch (перший дотик): представляє цінність, згадує конкретну знахідку.
Лист 2 — Follow-up (через 4 дні після Pitch): нагадування + новий ракурс або кейс.
Лист 3 — Break-up (через 7 днів): «останній лист», прощання + soft CTA.

Стиль: професійний, дружній, без шаблонів. Без емодзі. Без markdown.

ВАЖЛИВО: виведи ВИКЛЮЧНО валідний JSON-масив, без markdown-блоків, без коментарів.
Точна структура:
[
  { "step": 1, "subject": "...", "body": "..." },
  { "step": 2, "subject": "...", "body": "..." },
  { "step": 3, "subject": "...", "body": "..." }
]`;

const STEP_LABELS = ["Pitch", "Follow-up", "Break-up"] as const;

export async function generateSequence(
  leadId: string,
  options: { language?: string | null } = {},
): Promise<SequenceResult> {
  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
  if (!leadId) return { success: false, error: "Missing lead id" };

  const language = options.language ?? DEFAULT_OUTPUT_LANGUAGE;
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизовано" };

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: user.id },
      include: { audit: true },
    });
    if (!lead) return { success: false, error: "Лід не знайдено" };

    const issues: string[] = [];
    if (lead.audit) {
      if (lead.audit.hasSSL === false) issues.push("відсутній SSL");
      if (lead.audit.mobileFriendly === false)
        issues.push("сайт не mobile-friendly");
      for (const i of lead.audit.issues)
        if (i && !issues.includes(i)) issues.push(i);
    }

    const userPrompt = [
      "Контекст ліда:",
      `- Компанія: ${lead.companyName}`,
      `- Ніша: ${lead.category ?? "не вказано"}`,
      `- Місто: ${lead.city ?? "не вказано"}`,
      `- Сайт: ${lead.website ?? "відсутній"}`,
      `- Opportunity Score: ${lead.score}/100`,
      `- Знайдені «болі»: ${issues.length ? issues.join("; ") : "явних не виявлено"}`,
      "",
      "Згенеруй 3-step sequence у форматі JSON, як вказано в системному промпті.",
    ].join("\n");

    const ai = new GoogleGenAI({ apiKey });
    let lastError: unknown;
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: withOutputLanguage(SEQUENCE_SYSTEM, language),
            temperature: 0.7,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
          },
        });
        const raw = response.text?.trim();
        if (!raw) return { success: false, error: "AI не повернув тексту" };
        const steps = parseSequence(raw);
        if (!steps) {
          return {
            success: false,
            error: "AI повернув невалідний JSON. Спробуйте ще раз.",
          };
        }
        return { success: true, steps };
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (
          !msg.includes("503") &&
          !msg.includes("UNAVAILABLE") &&
          !msg.includes("high demand")
        ) {
          break;
        }
        console.warn(`[AI sequence] ${model} unavailable, trying next...`);
      }
    }
    return {
      success: false,
      error:
        lastError instanceof Error
          ? lastError.message
          : "Failed to generate sequence",
    };
  } catch (error) {
    console.error("generateSequence error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate sequence",
    };
  }
}

function parseSequence(raw: string): SequenceStep[] | null {
  let cleaned = raw
    .replace(/^﻿/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const first = cleaned.indexOf("[");
  const last = cleaned.lastIndexOf("]");
  if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  const out: SequenceStep[] = [];
  for (let i = 0; i < Math.min(parsed.length, 3); i++) {
    const item = parsed[i];
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const subject = typeof obj.subject === "string" ? obj.subject.trim() : "";
    const body = typeof obj.body === "string" ? obj.body.trim() : "";
    if (!subject || !body) continue;
    const step = (i + 1) as 1 | 2 | 3;
    out.push({ step, label: STEP_LABELS[i], subject, body });
  }
  return out.length === 3 ? out : null;
}
