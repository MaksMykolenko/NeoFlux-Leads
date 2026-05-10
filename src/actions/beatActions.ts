"use server";

import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { LeadMode } from "@/src/lib/leadMode";
import { type BeatProspect } from "@/src/lib/beatProspects";
import { calculateArtistScore } from "@/src/lib/scoring";

const SEARCH_MODEL = "gemini-2.5-flash";
const MAX_RESULTS = 8;

export interface ArtistSearchResult {
  success: boolean;
  prospects: BeatProspect[];
  error?: string;
}

/**
 * Discover real-world artist prospects via Gemini with Google Search
 * grounding. Each request performs a live web search and asks the model to
 * shape the findings into a strict JSON contract that we then validate and
 * normalize. There is no seed list — if Gemini can't find anything, the
 * caller gets an empty array with a clear error message.
 */
export async function searchBeatProspects(
  query: string
): Promise<ArtistSearchResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      prospects: [],
      error:
        "Не налаштовано GEMINI_API_KEY. Додайте ключ у .env та перезапустіть сервер.",
    };
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return {
      success: false,
      prospects: [],
      error: "Введіть жанр, платформу або @нік для пошуку",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = buildSearchPrompt(trimmed);

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
        error: "AI не повернув даних. Спробуйте ще раз або змініть запит.",
      };
    }

    const prospects = parseProspects(text);
    if (prospects.length === 0) {
      return {
        success: false,
        prospects: [],
        error:
          "Не знайдено артистів за цим запитом. Спробуйте інший жанр або ключове слово.",
      };
    }

    return { success: true, prospects };
  } catch (error) {
    console.error("searchBeatProspects error:", error);
    return {
      success: false,
      prospects: [],
      error:
        error instanceof Error
          ? error.message
          : "Невідома помилка під час пошуку",
    };
  }
}

function buildSearchPrompt(query: string): string {
  return `Знайди до ${MAX_RESULTS} реальних активних артистів/виконавців, що відповідають цьому опису: "${query}".

Шукай через Google їхні публічні профілі на SoundCloud, YouTube, Instagram, BeatStars, Spotify, TikTok тощо. Пріоритезуй тих, хто:
- Активно випускає музику (релізи за останні 6-12 місяців)
- Шукає інструментали/біти або співпрацю з продюсерами (підказки в bio: "type beat", "looking for beats", "submit beats", "DMs open for beats", "open to collabs")
- Має публічні контакти (email або відкритий DM)

Поверни ВИКЛЮЧНО валідний JSON-масив без markdown-блоків, без коментарів, без пояснень. Кожен елемент мусить мати точно такі поля:
[
  {
    "handle": "@нік або сценічний нік без @",
    "realName": "реальне імʼя або сценічне імʼя",
    "genre": "жанр / напрямок (1-3 слова)",
    "platform": "SoundCloud" | "YouTube" | "Instagram" | "BeatStars" | "Spotify" | "TikTok",
    "followers": число фоловерів/підписників (0 якщо невідомо),
    "email": "контактний email або null",
    "lookingForType": true якщо явно шукає біти/type beats у bio чи постах, інакше false,
    "profileUrl": "повний https URL профілю на платформі"
  }
]

ВАЖЛИВО:
- Тільки реальні існуючі артисти — НЕ вигадуй імена, нікнейми чи URL.
- Якщо нічого не знайдено — поверни порожній масив [].
- Не додавай жодного тексту до або після JSON.`;
}

function parseProspects(raw: string): BeatProspect[] {
  // Strip markdown code fences in case the model wraps despite instructions.
  let cleaned = raw
    .replace(/^\uFEFF/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  // If the model added prose around the JSON, salvage the array body.
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

  const email =
    typeof x.email === "string" && x.email.trim() && x.email !== "null"
      ? x.email.trim()
      : null;

  const profileUrl =
    typeof x.profileUrl === "string" && x.profileUrl.trim()
      ? x.profileUrl.trim()
      : null;

  return {
    handle,
    realName,
    genre: typeof x.genre === "string" ? x.genre.trim() : "",
    platform,
    followers,
    email,
    lookingForType: Boolean(x.lookingForType),
    profileUrl,
  };
}

export interface DemoMeta {
  name: string;
  bytes: number;
  bpm?: string | null;
  keySig?: string | null;
  genre?: string | null;
  price?: string | null;
}

export interface SendBeatMessageInput {
  artist: BeatProspect;
  subject: string;
  body: string;
  demo: DemoMeta | null;
}

export interface SendBeatMessageResult {
  success: boolean;
  leadId?: string;
  error?: string;
}

/**
 * Persist a beats outreach: upsert the artist as a Lead (mode=BEATS), append
 * a Message with optional demo metadata as JSON attachment, bump status to
 * "Contacted", recompute the artist Opportunity Score.
 *
 * NOTE: this does NOT actually send an email — the SMTP form on the client is
 * UX-only for now. The "send" verb here means "log into CRM as outreach".
 */
export async function sendBeatMessage(
  input: SendBeatMessageInput
): Promise<SendBeatMessageResult> {
  const { artist, subject, body, demo } = input;

  if (!artist?.handle) {
    return { success: false, error: "Missing artist data" };
  }
  const trimmedSubject = subject?.trim();
  const trimmedBody = body?.trim();
  if (!trimmedSubject) {
    return { success: false, error: "Тема не може бути порожньою" };
  }
  if (!trimmedBody) {
    return { success: false, error: "Текст повідомлення не може бути порожнім" };
  }

  try {
    const score = calculateArtistScore({
      email: artist.email,
      followers: artist.followers,
      lookingForType: artist.lookingForType,
    });

    const attachment: Prisma.InputJsonValue | undefined = demo
      ? {
          name: demo.name,
          bytes: demo.bytes,
          bpm: demo.bpm ?? null,
          keySig: demo.keySig ?? null,
          genre: demo.genre ?? null,
          price: demo.price ?? null,
        }
      : undefined;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.lead.findFirst({
        where: { mode: LeadMode.BEATS, companyName: artist.handle },
        select: { id: true },
      });

      const lead = existing
        ? await tx.lead.update({
            where: { id: existing.id },
            data: {
              status: "Contacted",
              realName: artist.realName,
              category: artist.genre,
              source: artist.platform,
              website: artist.profileUrl,
              email: artist.email,
              followers: artist.followers,
              lookingForType: artist.lookingForType,
              score,
            },
            select: { id: true },
          })
        : await tx.lead.create({
            data: {
              mode: LeadMode.BEATS,
              companyName: artist.handle,
              realName: artist.realName,
              category: artist.genre,
              source: artist.platform,
              website: artist.profileUrl,
              email: artist.email,
              followers: artist.followers,
              lookingForType: artist.lookingForType,
              status: "Contacted",
              score,
            },
            select: { id: true },
          });

      const messageData: Prisma.MessageUncheckedCreateInput = {
        leadId: lead.id,
        subject: trimmedSubject,
        body: trimmedBody,
      };
      if (attachment !== undefined) {
        messageData.attachment = attachment;
      }
      await tx.message.create({ data: messageData });

      return lead;
    });

    revalidatePath("/");
    revalidatePath(`/leads/${result.id}`);

    return { success: true, leadId: result.id };
  } catch (error) {
    console.error("sendBeatMessage error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Не вдалось зберегти лід",
    };
  }
}
