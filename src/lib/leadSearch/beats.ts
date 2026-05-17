import { GoogleGenAI } from "@google/genai";
import { CHANNEL_ORDER } from "@/src/lib/channels";
import { actionError } from "@/src/lib/i18n/actionErrors";
import { requireGeminiKey } from "@/src/lib/gemini";
import { prisma } from "@/src/lib/prisma";
import {
  getLeadLimitStatus,
  getPlanForUser,
} from "@/src/lib/subscription";
import type {
  BeatProspect,
  ProspectContacts,
} from "@/src/lib/beatProspects";

const SEARCH_MODEL = "gemini-2.5-flash";
const MAX_RESULTS = 8;

export interface CoreBeatSearchInput {
  userId: string;
  query: string;
  region?: string | null;
  /** Дозволити пропустити перевірку ліміту (для cron — він робить власну). */
  skipLimitCheck?: boolean;
}

export interface CoreBeatSearchResult {
  success: boolean;
  prospects: BeatProspect[];
  error?: string;
  errorCode?: "LIMIT_REACHED" | "USER_NOT_FOUND";
}

/**
 * Чистий пошук BEAT-перспектив (артистів) через Gemini з Google Search
 * grounding. БЕЗ збереження в БД — поверне масив `BeatProspect`. Виклик-сайт
 * (UI або cron-handler) сам вирішує що з цим робити: показати в drawer чи
 * створити Lead-и.
 */
export async function coreSearchBeatProspects(
  input: CoreBeatSearchInput,
): Promise<CoreBeatSearchResult> {
  const { userId, query, region = null, skipLimitCheck = false } = input;

  const trimmed = query.trim();
  if (!trimmed) {
    return {
      success: false,
      prospects: [],
      error: await actionError("searchPromptRequired"),
    };
  }

  if (!skipLimitCheck) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, leadsProcessedCount: true, planResetDate: true },
    });
    if (!user) {
      return {
        success: false,
        prospects: [],
        errorCode: "USER_NOT_FOUND",
        error: await actionError("userNotFound"),
      };
    }
    const limitStatus = getLeadLimitStatus(user);
    if (!limitStatus.allowed) {
      const plan = getPlanForUser(user);
      return {
        success: false,
        prospects: [],
        errorCode: "LIMIT_REACHED",
        error: await actionError("limitReached", {
          plan: plan.name,
          used: limitStatus.used,
          limit: plan.leadsPerMonth,
        }),
      };
    }
  }

  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (err) {
    return {
      success: false,
      prospects: [],
      error: (err as Error).message,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildSearchPrompt(trimmed, region);

    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return {
        success: false,
        prospects: [],
        error: await actionError("beatSearchNoData"),
      };
    }

    const prospects = parseProspects(text);
    if (prospects.length === 0) {
      return {
        success: false,
        prospects: [],
        error: await actionError("beatSearchEmpty"),
      };
    }
    return { success: true, prospects };
  } catch (error) {
    console.error("coreSearchBeatProspects error:", error);
    return {
      success: false,
      prospects: [],
      error:
        error instanceof Error
          ? error.message
          : await actionError("genericFailed"),
    };
  }
}

function buildSearchPrompt(query: string, region: string | null): string {
  const regionLine =
    region && region.trim()
      ? `\nFocus search exclusively on entities located in or targeting: ${JSON.stringify(
          region.trim(),
        )}.\n`
      : "";
  return `Знайди до ${MAX_RESULTS} реальних активних артистів/виконавців, що відповідають цьому опису: "${query}".${regionLine}

Шукай через Google їхні публічні профілі на SoundCloud, YouTube, Instagram, BeatStars, Spotify, TikTok, X (Twitter) тощо. Пріоритезуй тих, хто:
- Активно випускає музику (релізи за останні 6-12 місяців)
- Шукає інструментали/біти або співпрацю з продюсерами (підказки в bio: "type beat", "looking for beats", "submit beats", "DMs open for beats", "open to collabs")
- Має публічні контакти

ДЛЯ КОЖНОГО АРТИСТА збери МАКСИМУМ контактних каналів. Дивись у bio, link-in-bio (Linktree, beacons.ai), у YouTube About, в описах SoundCloud-треків, у пінованих твітах — там часто перелічені email, Telegram, Discord тощо.

Поверни ВИКЛЮЧНО валідний JSON-масив без markdown-блоків, без коментарів. Кожен елемент мусить мати точно такі поля:
[
  {
    "handle": "@нік або сценічний нік без @",
    "realName": "реальне імʼя або сценічне імʼя",
    "genre": "жанр / напрямок (1-3 слова)",
    "platform": "SoundCloud" | "YouTube" | "Instagram" | "BeatStars" | "Spotify" | "TikTok" | "Twitter",
    "followers": число фоловерів/підписників на основній платформі (0 якщо невідомо),
    "lookingForType": true якщо явно шукає біти/type beats у bio чи постах, інакше false,
    "profileUrl": "повний https URL основного профілю",
    "contacts": {
      "email": "email або null",
      "phone": "номер телефону у E.164 або null",
      "website": "URL особистого сайту або null",
      "instagram": "instagram-нікнейм без @ або повний URL, або null",
      "soundcloud": "soundcloud-нікнейм або повний URL, або null",
      "youtube": "youtube-handle (наприклад @kosmo) або URL каналу, або null",
      "tiktok": "tiktok-нікнейм без @ або URL, або null",
      "twitter": "X/Twitter-нікнейм без @ або URL, або null",
      "spotify": "URL артиста на Spotify або null",
      "beatstars": "URL профілю на BeatStars або null",
      "telegram": "telegram-нікнейм без @ (напр. luna_beats) або URL t.me/..., або null",
      "discord": "discord-юзернейм (нова система, напр. luna.beats) або null",
      "whatsapp": "номер у E.164 (напр. +380501234567) або null"
    }
  }
]

ВАЖЛИВО:
- Тільки реальні існуючі артисти — НЕ вигадуй імена, нікнейми чи контакти.
- Якщо канал не знайдено в публічних джерелах — постав null, НЕ ВИГАДУЙ.
- Якщо нічого не знайдено — поверни порожній масив [].
- Не додавай жодного тексту до або після JSON.`;
}

function parseProspects(raw: string): BeatProspect[] {
  let cleaned = raw
    .replace(/^﻿/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map(normalizeProspect)
    .filter((p): p is BeatProspect => p !== null)
    .slice(0, MAX_RESULTS);
}

function normalizeProspect(x: Record<string, unknown>): BeatProspect | null {
  const handle = typeof x.handle === "string" ? x.handle.trim() : "";
  const realName = typeof x.realName === "string" ? x.realName.trim() : "";
  if (!handle || !realName) return null;

  const platform =
    typeof x.platform === "string" && x.platform.trim()
      ? x.platform.trim()
      : "Web";

  const followers =
    typeof x.followers === "number" && Number.isFinite(x.followers)
      ? Math.max(0, Math.round(x.followers))
      : 0;

  const profileUrl =
    typeof x.profileUrl === "string" && x.profileUrl.trim()
      ? x.profileUrl.trim()
      : null;

  const contactsRaw =
    x.contacts && typeof x.contacts === "object"
      ? (x.contacts as Record<string, unknown>)
      : {};

  const contacts: ProspectContacts = {};
  for (const key of CHANNEL_ORDER) {
    const raw = contactsRaw[key];
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed && trimmed.toLowerCase() !== "null") {
        contacts[key] = trimmed;
      }
    }
  }

  if (!contacts.email && typeof x.email === "string") {
    const e = x.email.trim();
    if (e && e.toLowerCase() !== "null") contacts.email = e;
  }

  return {
    handle,
    realName,
    genre: typeof x.genre === "string" ? x.genre.trim() : "",
    platform,
    followers,
    email: contacts.email ?? null,
    lookingForType: Boolean(x.lookingForType),
    profileUrl,
    contacts,
  };
}
