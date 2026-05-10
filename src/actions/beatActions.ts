"use server";

import { revalidatePath } from "next/cache";
import { LeadMode, Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  BEAT_PROSPECTS,
  searchProspects,
  type BeatProspect,
} from "@/src/lib/beatProspects";
import { calculateArtistScore } from "@/src/lib/scoring";

export interface ArtistSearchResult {
  success: boolean;
  prospects: BeatProspect[];
  error?: string;
}

export async function searchBeatProspects(
  query: string
): Promise<ArtistSearchResult> {
  try {
    const prospects = searchProspects(query ?? "");
    return { success: true, prospects };
  } catch (error) {
    console.error("searchBeatProspects error:", error);
    return {
      success: false,
      prospects: BEAT_PROSPECTS,
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
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
