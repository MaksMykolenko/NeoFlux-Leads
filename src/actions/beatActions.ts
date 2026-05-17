"use server";

import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { LeadMode } from "@/src/lib/leadMode";
import {
  type BeatProspect,
  type ProspectContacts,
} from "@/src/lib/beatProspects";
import { CHANNEL_ORDER, type ChannelKey } from "@/src/lib/channels";
import {
  coreSearchBeatProspects,
  type CoreBeatSearchResult,
} from "@/src/lib/leadSearch/beats";
import { sendUserEmail } from "@/src/lib/mailer";
import { calculateArtistScore } from "@/src/lib/scoring";
import { getRequestUserId } from "@/src/lib/session";
import {
  getLeadLimitStatus,
  getPlanForUser,
  incrementLeadsProcessed,
} from "@/src/lib/subscription";
import { validateBeatEmailAudioFile } from "@/src/lib/beatAttachmentRules";

export interface ArtistSearchResult {
  success: boolean;
  prospects: BeatProspect[];
  error?: string;
  errorCode?: "LIMIT_REACHED";
}

export async function searchBeatProspects(
  query: string,
  options: { region?: string | null } = {},
): Promise<ArtistSearchResult> {
  const userId = await getRequestUserId();
  if (!userId) {
    return { success: false, prospects: [], error: "Не авторизовано" };
  }
  const core = await coreSearchBeatProspects({
    userId,
    query,
    region: options.region ?? null,
  });
  return toArtistSearchResult(core);
}

function toArtistSearchResult(core: CoreBeatSearchResult): ArtistSearchResult {
  return {
    success: core.success,
    prospects: core.prospects,
    error: core.error,
    errorCode: core.errorCode === "LIMIT_REACHED" ? "LIMIT_REACHED" : undefined,
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
  const audioValidated = validateBeatEmailAudioFile(formData.get("audio"));
  if (!audioValidated.ok) {
    const { reason, error } = audioValidated;
    const errorCode =
      reason === "FILE_TOO_LARGE"
        ? "FILE_TOO_LARGE"
        : reason === "INVALID_FILE_TYPE"
          ? "INVALID_FILE_TYPE"
          : "NO_FILE";
    return { success: false, errorCode, error };
  }
  const audioEntry = audioValidated.file;
  const declaredMime = audioEntry.type?.toLowerCase() ?? "";

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
