"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { getRequestUserId } from "@/src/lib/session";
import { sendUserEmail } from "@/src/lib/mailer";

export interface SaveMessageResult {
  success: boolean;
  error?: string;
  errorCode?: "NO_SMTP" | "NO_EMAIL" | "SEND_FAILED";
  messageId?: string;
}

export async function saveGeneratedMessage(
  leadId: string,
  subject: string,
  body: string
): Promise<SaveMessageResult> {
  if (!leadId) {
    return { success: false, error: "Missing lead id" };
  }

  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const trimmedSubject = subject?.trim() ?? "";
  const trimmedBody = body?.trim() ?? "";

  if (!trimmedSubject) {
    return { success: false, error: "Тема листа обов'язкова" };
  }
  if (!trimmedBody) {
    return { success: false, error: "Текст листа не може бути порожнім" };
  }

  try {
    const message = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({
        where: { id: leadId, userId },
        select: { id: true },
      });
      if (!lead) {
        throw new Error("Лід не знайдено");
      }

      const created = await tx.message.create({
        data: {
          leadId,
          subject: trimmedSubject,
          body: trimmedBody,
        },
      });

      // Bump status to "Contacted". Prisma's `@updatedAt` directive on the
      // Lead model takes care of refreshing `updatedAt` automatically as
      // long as the update has at least one field — which `status` is.
      await tx.lead.update({
        where: { id: leadId },
        data: { status: "Contacted" },
      });

      return created;
    });

    revalidatePath(`/leads/${leadId}`);
    return { success: true, messageId: message.id };
  } catch (error) {
    console.error("saveGeneratedMessage error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Реальна відправка листа через BYOSMTP юзера + збереження в `Message`.
 * Незалежно від результату, ми створюємо запис у БД (з `deliveryStatus`
 * SENT/FAILED + errorLog), щоб юзер мав повну історію спроб.
 */
export async function sendAndSaveEmail(
  leadId: string,
  subject: string,
  body: string,
): Promise<SaveMessageResult> {
  if (!leadId) {
    return { success: false, error: "Missing lead id" };
  }

  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const trimmedSubject = subject?.trim() ?? "";
  const trimmedBody = body?.trim() ?? "";

  if (!trimmedSubject) {
    return { success: false, error: "Тема листа обов'язкова" };
  }
  if (!trimmedBody) {
    return { success: false, error: "Текст листа не може бути порожнім" };
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId },
    select: { id: true, email: true },
  });
  if (!lead) {
    return { success: false, error: "Лід не знайдено" };
  }
  if (!lead.email) {
    return {
      success: false,
      errorCode: "NO_EMAIL",
      error: "У ліда немає email — додайте його перед відправкою.",
    };
  }

  const sendResult = await sendUserEmail(
    userId,
    lead.email,
    trimmedSubject,
    trimmedBody,
  );

  // Запис у `Message` створюємо в обох випадках — це аудит-лог реальних спроб.
  try {
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          leadId,
          subject: trimmedSubject,
          body: trimmedBody,
          deliveryStatus: sendResult.success ? "SENT" : "FAILED",
          errorLog: sendResult.success ? null : sendResult.error,
        },
      });

      if (sendResult.success) {
        await tx.lead.update({
          where: { id: leadId },
          data: { status: "Contacted" },
        });
      }

      return created;
    });

    revalidatePath(`/leads/${leadId}`);

    if (sendResult.success) {
      return { success: true, messageId: message.id };
    }

    return {
      success: false,
      messageId: message.id,
      errorCode:
        "code" in sendResult && sendResult.code === "NO_SMTP"
          ? "NO_SMTP"
          : "SEND_FAILED",
      error: sendResult.error,
    };
  } catch (error) {
    console.error("sendAndSaveEmail persistence error:", error);
    return {
      success: false,
      errorCode: "SEND_FAILED",
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
