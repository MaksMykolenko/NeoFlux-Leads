"use server";

import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/src/lib/prisma";

export interface ProposalResult {
  success: boolean;
  text?: string;
  error?: string;
}

const MODEL = "gemini-2.5-flash";

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

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { audit: true },
    });

    if (!lead) {
      return { success: false, error: "Лід не знайдено" };
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

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return { success: false, error: "AI не повернув тексту" };
    }

    return { success: true, text };
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
