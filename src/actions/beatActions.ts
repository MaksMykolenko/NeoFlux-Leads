"use server";

import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { GoogleGenAI } from "@google/genai";
import { Prisma } from "@prisma/client";
import { requireGeminiKey } from "@/src/lib/gemini";
import { prisma } from "@/src/lib/prisma";
import { LeadMode } from "@/src/lib/leadMode";
import {
  type BeatProspect,
  type ProspectContacts,
} from "@/src/lib/beatProspects";
import { CHANNEL_ORDER, type ChannelKey } from "@/src/lib/channels";
import { sendUserEmail } from "@/src/lib/mailer";
import { calculateArtistScore } from "@/src/lib/scoring";
import { getCurrentUser, getRequestUserId } from "@/src/lib/session";
import {
  getLeadLimitStatus,
  getPlanForUser,
  incrementLeadsProcessed,
} from "@/src/lib/subscription";

const SEARCH_MODEL = "gemini-2.5-flash";
const MAX_RESULTS = 8;

export interface ArtistSearchResult {
  success: boolean;
  prospects: BeatProspect[];
  error?: string;
  errorCode?: "LIMIT_REACHED";
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
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, prospects: [], error: "Не авторизовано" };
  }

  const limitStatus = getLeadLimitStatus(user);
  if (!limitStatus.allowed) {
    const plan = getPlanForUser(user);
    return {
      success: false,
      prospects: [],
      errorCode: "LIMIT_REACHED",
      error: `Ліміт плану ${plan.name} вичерпано (${limitStatus.used}/${plan.leadsPerMonth}). Оновіть тариф на /pricing.`,
    };
  }

  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (err) {
    return { success: false, prospects: [], error: (err as Error).message };
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

  // Legacy `email` at top-level → fold into contacts so the UI is unified.
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
  channels: ChannelKey[];
}

export interface SendBeatMessageResult {
  success: boolean;
  leadId?: string;
  error?: string;
  errorCode?: "LIMIT_REACHED";
}

/**
 * Persist a beats outreach: upsert the artist as a Lead (mode=BEATS), append
 * a Message with optional demo metadata as JSON attachment, bump status to
 * "Contacted", recompute the artist Opportunity Score.
 *
 * NOTE: this persists outreach in CRM (not a full multi-channel auto-send).
 * Email through BYOSMTP is configured under /settings, not on the beats tab.
 */
export async function sendBeatMessage(
  input: SendBeatMessageInput
): Promise<SendBeatMessageResult> {
  const { artist, subject, body, demo, channels } = input;

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

  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

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

    const socialLinks: Prisma.InputJsonValue | undefined = artist.contacts
      ? sanitizeContactsForJson(artist.contacts)
      : undefined;

    const cleanChannels = Array.from(
      new Set(
        (channels ?? []).filter((c): c is ChannelKey =>
          CHANNEL_ORDER.includes(c as ChannelKey)
        )
      )
    );

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.lead.findFirst({
        where: { userId, mode: LeadMode.BEATS, companyName: artist.handle },
        select: { id: true },
      });

      // Якщо створюємо НОВИЙ лід — ще раз перевіряємо ліміт у транзакції,
      // щоб уникнути race condition (юзер міг зробити паралельний запит).
      if (!existing) {
        const fresh = await tx.user.findUnique({
          where: { id: userId },
          select: { plan: true, leadsProcessedCount: true, planResetDate: true },
        });
        if (fresh) {
          const status = getLeadLimitStatus(fresh);
          if (!status.allowed) {
            const plan = getPlanForUser(fresh);
            throw new Error(
              `LIMIT_REACHED:Ліміт плану ${plan.name} вичерпано (${status.used}/${plan.leadsPerMonth}).`
            );
          }
        }
      }

      const leadData = {
        status: "Contacted",
        realName: artist.realName,
        category: artist.genre,
        source: artist.platform,
        website: artist.profileUrl,
        email: artist.email,
        followers: artist.followers,
        lookingForType: artist.lookingForType,
        score,
      };

      const lead = existing
        ? await tx.lead.update({
            where: { id: existing.id },
            data: socialLinks !== undefined ? { ...leadData, socialLinks } : leadData,
            select: { id: true },
          })
        : await tx.lead.create({
            data: {
              userId,
              mode: LeadMode.BEATS,
              companyName: artist.handle,
              ...leadData,
              ...(socialLinks !== undefined ? { socialLinks } : {}),
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
      if (cleanChannels.length > 0) {
        messageData.channels = cleanChannels as Prisma.InputJsonValue;
      }
      await tx.message.create({ data: messageData });

      return { lead, isNew: !existing };
    });

    if (result.isNew) {
      await incrementLeadsProcessed(userId, 1);
    }

    await revalidateLocalizedPath("/");
    await revalidateLocalizedPath(`/leads/${result.lead.id}`);

    return { success: true, leadId: result.lead.id };
  } catch (error) {
    console.error("sendBeatMessage error:", error);
    if (error instanceof Error && error.message.startsWith("LIMIT_REACHED:")) {
      return {
        success: false,
        errorCode: "LIMIT_REACHED",
        error: error.message.replace("LIMIT_REACHED:", ""),
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Не вдалось зберегти лід",
    };
  }
}

function sanitizeContactsForJson(
  contacts: ProspectContacts
): Prisma.InputJsonValue {
  const out: Record<string, string> = {};
  for (const key of CHANNEL_ORDER) {
    const v = contacts[key];
    if (typeof v === "string" && v.trim()) {
      out[key] = v.trim();
    }
  }
  return out;
}

// ============================================================================
// sendBeatViaEmail — реальна відправка email з MP3-вкладенням через SMTP юзера.
// ============================================================================

// 15MB у next.config.ts; тут ставимо нижчий поріг (10MB), щоб залишити запас
// під FormData overhead і встигнути повернути зрозумілу помилку до того, як
// її кине runtime.
const MAX_BEAT_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_AUDIO_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/flac",
  "audio/x-flac",
  "audio/ogg",
]);
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface SendBeatViaEmailResult {
  success: boolean;
  leadId?: string;
  messageId?: string;
  error?: string;
  errorCode?:
    | "LIMIT_REACHED"
    | "NO_EMAIL"
    | "INVALID_EMAIL"
    | "NO_FILE"
    | "FILE_TOO_LARGE"
    | "INVALID_FILE_TYPE"
    | "INVALID_PAYLOAD"
    | "NO_SMTP"
    | "PLATFORM_NOT_CONFIGURED"
    | "SEND_FAILED";
}

interface BeatEmailPayload {
  artist: BeatProspect;
  subject: string;
  body: string;
  demo: {
    name: string;
    bytes: number;
    bpm: string | null;
    keySig: string | null;
    genre: string | null;
    price: string | null;
  };
  /** Інші канали, які юзер встиг відкрити вручну (Instagram/Telegram/…). */
  channels: ChannelKey[];
}

/**
 * Відправляє лист з MP3-вкладенням артисту-перспективі **і** одночасно
 * фіксує outreach у CRM (так само як `sendBeatMessage`):
 *   - upsert `Lead` (mode=BEATS, companyName=handle)
 *   - create `Message` з `attachment` JSON (meta) і `deliveryStatus`=SENT/FAILED
 *   - bump status у "Contacted" при успіху
 *   - +1 у `leadsProcessedCount` якщо лід новий
 *
 * Аудіо НЕ зберігається у БД (тільки meta) — це cold-outreach attachment, він
 * пішов один раз і живе у вихідних/інбоксі. Якщо колись треба буде повторно
 * слати з того самого файлу — інтегруємо S3.
 */
export async function sendBeatViaEmail(
  formData: FormData,
): Promise<SendBeatViaEmailResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  // ───── читаємо і валідуємо вхід ─────
  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string" || !rawPayload) {
    return {
      success: false,
      errorCode: "INVALID_PAYLOAD",
      error: "Відсутній payload",
    };
  }

  let payload: BeatEmailPayload;
  try {
    payload = JSON.parse(rawPayload) as BeatEmailPayload;
  } catch {
    return {
      success: false,
      errorCode: "INVALID_PAYLOAD",
      error: "Невалідний JSON у payload",
    };
  }

  const artist = payload.artist;
  if (!artist?.handle) {
    return {
      success: false,
      errorCode: "INVALID_PAYLOAD",
      error: "Відсутні дані артиста",
    };
  }

  const subject = (payload.subject ?? "").trim();
  const body = (payload.body ?? "").trim();
  if (!subject) {
    return { success: false, error: "Тема не може бути порожньою" };
  }
  if (!body) {
    return { success: false, error: "Текст повідомлення не може бути порожнім" };
  }

  // email беремо з артиста (АІ-результат) або з contacts.email
  const email =
    (artist.email && artist.email.trim()) ||
    (artist.contacts?.email && artist.contacts.email.trim()) ||
    null;
  if (!email || !EMAIL_REGEX.test(email)) {
    return {
      success: false,
      errorCode: "NO_EMAIL",
      error: "У артиста немає валідного email — оберіть інший канал.",
    };
  }

  // ───── читаємо файл ─────
  const audioEntry = formData.get("audio");
  if (!(audioEntry instanceof File)) {
    return {
      success: false,
      errorCode: "NO_FILE",
      error: "Не передано аудіо-файл",
    };
  }
  if (audioEntry.size > MAX_BEAT_FILE_BYTES) {
    const mb = (MAX_BEAT_FILE_BYTES / 1024 / 1024).toFixed(0);
    return {
      success: false,
      errorCode: "FILE_TOO_LARGE",
      error: `Файл завеликий — максимум ${mb}MB.`,
    };
  }
  const declaredMime = audioEntry.type?.toLowerCase() ?? "";
  if (declaredMime && !ALLOWED_AUDIO_MIME.has(declaredMime)) {
    return {
      success: false,
      errorCode: "INVALID_FILE_TYPE",
      error: `Тип файлу не підтримується (${declaredMime}). Очікую MP3/WAV/M4A/FLAC/OGG.`,
    };
  }

  // ───── ліміт лідів — перевіряємо до відправки SMTP-сесії, щоб не палити квоту ─────
  const limitUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, leadsProcessedCount: true, planResetDate: true },
  });
  if (!limitUser) {
    return { success: false, error: "Юзера не знайдено" };
  }
  const limitStatus = getLeadLimitStatus(limitUser);
  // ліміт перевіряємо лише якщо потенційно створюємо НОВИЙ лід; для існуючого
  // ліда (повторний send тому ж артисту) це не споживає квоту.
  const existing = await prisma.lead.findFirst({
    where: { userId, mode: LeadMode.BEATS, companyName: artist.handle },
    select: { id: true },
  });
  if (!existing && !limitStatus.allowed) {
    const plan = getPlanForUser(limitUser);
    return {
      success: false,
      errorCode: "LIMIT_REACHED",
      error: `Ліміт плану ${plan.name} вичерпано (${limitStatus.used}/${plan.leadsPerMonth}).`,
    };
  }

  // ───── відправка через SMTP ─────
  const buffer = Buffer.from(await audioEntry.arrayBuffer());
  const sendResult = await sendUserEmail(userId, email, subject, body, {
    attachments: [
      {
        filename: audioEntry.name || payload.demo?.name || "beat.mp3",
        content: buffer,
        contentType: declaredMime || "audio/mpeg",
      },
    ],
  });

  // ───── персистимо outreach незалежно від результату SMTP ─────
  try {
    const score = calculateArtistScore({
      email,
      followers: artist.followers,
      lookingForType: artist.lookingForType,
    });

    const cleanChannels = Array.from(
      new Set(
        [
          ...((payload.channels ?? []).filter((c): c is ChannelKey =>
            CHANNEL_ORDER.includes(c as ChannelKey),
          ) as ChannelKey[]),
          // Email піде до channels лише при успішній відправці — щоб у history
          // не лишалось "надіслано через Email", якщо SMTP впав.
          ...(sendResult.success ? (["email"] as ChannelKey[]) : []),
        ],
      ),
    );

    const attachment: Prisma.InputJsonValue = {
      name: payload.demo?.name ?? audioEntry.name,
      bytes: audioEntry.size,
      bpm: payload.demo?.bpm ?? null,
      keySig: payload.demo?.keySig ?? null,
      genre: payload.demo?.genre ?? null,
      price: payload.demo?.price ?? null,
    };

    const socialLinks: Prisma.InputJsonValue | undefined = artist.contacts
      ? sanitizeContactsForJson(artist.contacts)
      : undefined;

    const persisted = await prisma.$transaction(async (tx) => {
      const leadData = {
        status: sendResult.success ? "Contacted" : "New",
        realName: artist.realName,
        category: artist.genre,
        source: artist.platform,
        website: artist.profileUrl,
        email,
        followers: artist.followers,
        lookingForType: artist.lookingForType,
        score,
      };

      const lead = existing
        ? await tx.lead.update({
            where: { id: existing.id },
            data: socialLinks !== undefined ? { ...leadData, socialLinks } : leadData,
            select: { id: true },
          })
        : await tx.lead.create({
            data: {
              userId,
              mode: LeadMode.BEATS,
              companyName: artist.handle,
              ...leadData,
              ...(socialLinks !== undefined ? { socialLinks } : {}),
            },
            select: { id: true },
          });

      const messageData: Prisma.MessageUncheckedCreateInput = {
        leadId: lead.id,
        subject,
        body,
        attachment,
        deliveryStatus: sendResult.success ? "SENT" : "FAILED",
        errorLog: sendResult.success ? null : sendResult.error,
      };
      if (cleanChannels.length > 0) {
        messageData.channels = cleanChannels as Prisma.InputJsonValue;
      }
      const message = await tx.message.create({ data: messageData });

      return { lead, message, isNew: !existing };
    });

    if (persisted.isNew) {
      await incrementLeadsProcessed(userId, 1);
    }

    await revalidateLocalizedPath("/");
    await revalidateLocalizedPath(`/leads/${persisted.lead.id}`);

    if (sendResult.success) {
      return {
        success: true,
        leadId: persisted.lead.id,
        messageId: persisted.message.id,
      };
    }
    return {
      success: false,
      leadId: persisted.lead.id,
      messageId: persisted.message.id,
      errorCode:
        "code" in sendResult && sendResult.code === "NO_SMTP"
          ? "NO_SMTP"
          : "code" in sendResult && sendResult.code === "PLATFORM_NOT_CONFIGURED"
            ? "PLATFORM_NOT_CONFIGURED"
            : "SEND_FAILED",
      error: sendResult.error,
    };
  } catch (error) {
    console.error("sendBeatViaEmail persistence error:", error);
    return {
      success: false,
      errorCode: "SEND_FAILED",
      error:
        error instanceof Error ? error.message : "Не вдалося зберегти outreach",
    };
  }
}
