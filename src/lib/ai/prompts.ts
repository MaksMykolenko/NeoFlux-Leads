import "server-only";
import { GoogleGenAI } from "@google/genai";

export const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

export const DEFAULT_OUTPUT_LANGUAGE = "Ukrainian";

export const SYSTEM_INSTRUCTION_FULL = `Ти B2B-продажник веб-розробки в українській digital-агенції NeoFlux.
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

export const SYSTEM_INSTRUCTION_STARTER = `Ти B2B-продажник веб-розробки в українській digital-агенції NeoFlux.
Пишеш короткий (3–4 речення) шаблонний холодний лист українською.

Без емодзі. Без markdown. Без preamble. Без "Subject:".
Згадай назву компанії і запропонуй коротку зустріч. Підпис: "З повагою, NeoFlux".

Виведи ВИКЛЮЧНО текст листа.`;

export const BEAT_SYSTEM_INSTRUCTION = `Ти український біт-продюсер під брендом NeoFlux.
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

export function withOutputLanguage(
  base: string,
  language: string | null | undefined,
): string {
  const lang = (language?.trim() || DEFAULT_OUTPUT_LANGUAGE).trim();
  return `${base}\n\nCRITICAL: The entire generated message MUST be written exclusively in ${lang}, maintaining a native and professional B2B tone.`;
}

export interface LocalPromptLead {
  companyName: string;
  category: string | null;
  city: string | null;
  website: string | null;
  email: string | null;
  score: number;
  audit?: {
    hasSSL: boolean;
    mobileFriendly: boolean;
    performanceScore: number | null;
    issues: string[];
  } | null;
}

function buildLocalIssuesList(lead: LocalPromptLead): string[] {
  const issues: string[] = [];
  if (!lead.website) {
    issues.push("у компанії немає повноцінного сайту");
    return issues;
  }
  if (lead.audit) {
    if (lead.audit.hasSSL === false) issues.push("на сайті відсутній SSL-сертифікат");
    if (lead.audit.mobileFriendly === false)
      issues.push("сайт не адаптований під мобільні пристрої");
    for (const raw of lead.audit.issues) {
      if (raw && !issues.includes(raw)) issues.push(raw);
    }
  }
  return issues;
}

export function buildLocalUserPrompt(lead: LocalPromptLead): string {
  const issues = buildLocalIssuesList(lead);
  return [
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
    "Напиши холодний лист, який природно тисне на зазначені болі (якщо вони є). Якщо болей нема — зосередься на потенціалі росту трафіку та конверсій.",
  ]
    .filter(Boolean)
    .join("\n");
}

export interface UniversalPromptLead {
  companyName: string;
  notes: string | null;
  website: string | null;
  email: string | null;
  source: string | null;
}

export function buildUniversalUserPrompt(lead: UniversalPromptLead): string {
  return [
    "Контекст ліда (універсальний AI-пошук):",
    `- Назва / особа: ${lead.companyName}`,
    lead.notes ? `- Опис з пошуку: ${lead.notes}` : null,
    `- Сайт: ${lead.website ?? "не вказано"}`,
    `- Email: ${lead.email ?? "не вказано"}`,
    `- Джерело: ${lead.source ?? "Universal AI"}`,
    "",
    "Напиши короткий B2B-холодний лист: звернись до опису діяльності, запропонуй цінність веб-розробки / digital і запроси на коротку зустріч.",
  ]
    .filter(Boolean)
    .join("\n");
}

export interface BeatPromptArtist {
  handle: string;
  realName: string;
  genre: string;
  platform: string;
  followers?: number | null;
}

export interface BeatPromptDemo {
  name: string;
  bpm?: string | null;
  keySig?: string | null;
  genre?: string | null;
  price?: string | null;
}

export function buildBeatUserPrompt(
  artist: BeatPromptArtist,
  demo: BeatPromptDemo | null,
): string {
  const demoFacts = demo
    ? [
        `- Файл: ${demo.name}`,
        demo.bpm ? `- BPM: ${demo.bpm}` : null,
        demo.keySig ? `- Тональність: ${demo.keySig}` : null,
        demo.genre ? `- Жанр біта: ${demo.genre}` : null,
        demo.price ? `- Ціна за lease: $${demo.price}` : null,
      ].filter(Boolean)
    : ["- Файл біта поки не прикріплений — пиши узагальнено"];

  return [
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
    "Напиши ОДНЕ повідомлення для DM/email цього артиста. Зроби його коротким, по-людськи. Згадай платформу і жанр, конкретно файл біта, чому він підходить артисту.",
  ]
    .filter(Boolean)
    .join("\n");
}

export interface GenerateTextOptions {
  systemInstruction: string;
  userPrompt: string;
  apiKey: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateTextResult {
  success: boolean;
  text?: string;
  error?: string;
}

export async function generateTextWithFallback(
  options: GenerateTextOptions,
): Promise<GenerateTextResult> {
  const ai = new GoogleGenAI({ apiKey: options.apiKey });
  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.userPrompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxOutputTokens ?? 800,
        },
      });
      const text = response.text?.trim();
      if (!text) {
        return { success: false, error: "AI не повернув тексту" };
      }
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
      console.warn(`[ai/prompts] ${model} unavailable, trying next…`);
    }
  }
  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : "Generation failed",
  };
}
