"use server";

import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/src/lib/prisma";
import { LeadMode } from "@/src/lib/leadMode";
import { getRequestUserId } from "@/src/lib/session";

export interface ProposalResult {
  success: boolean;
  text?: string;
  error?: string;
}

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

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

export async function generateProposal(leadId: string): Promise<ProposalResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error:
        "GEMINI_API_KEY не налаштовано. Додайте ключ у .env та перезапустіть сервер.",
    };
  }

  if (!leadId) {
    return { success: false, error: "Missing lead id" };
  }

  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      include: { audit: true },
    });

    if (!lead) {
      return { success: false, error: "Лід не знайдено" };
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
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
            maxOutputTokens: 800,
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
  input: BeatProposalInput
): Promise<ProposalResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error:
        "GEMINI_API_KEY не налаштовано. Додайте ключ у .env та перезапустіть сервер.",
    };
  }

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
            systemInstruction: BEAT_SYSTEM_INSTRUCTION,
            temperature: 0.85,
            maxOutputTokens: 600,
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
