"use server";

import { createHash } from "node:crypto";
import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { prisma } from "@/src/lib/prisma";
import { isReplyStatus } from "@/src/lib/replyStatus";
import { getRequestUserId } from "@/src/lib/session";
import {
  markMessageDeliveryResult,
  sendUserEmail,
} from "@/src/lib/mailer";

export interface SaveMessageResult {
  success: boolean;
  error?: string;
  errorCode?:
    | "NO_SMTP"
    | "NO_EMAIL"
    | "SEND_FAILED"
    | "DO_NOT_CONTACT"
    | "ALREADY_SENT"
    | "SEND_IN_FLIGHT";
  messageId?: string;
}

export interface UpdateReplyStatusResult {
  success: boolean;
  error?: string;
}

/**
 * Юзер вручну позначає, що відповів/зацікавився/баунснувся. Доступ контролюємо
 * через JOIN на Lead.userId — Message напряму не має userId, тож фільтр
 * `lead: { userId }` потрібний щоб чужий messageId не дав доступу.
 */
export async function updateReplyStatus(
  messageId: string,
  newStatus: string,
): Promise<UpdateReplyStatusResult> {
  if (!messageId) return { success: false, error: "Missing message id" };
  if (!isReplyStatus(newStatus)) {
    return { success: false, error: `Невалідний статус: ${newStatus}` };
  }

  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  try {
    const result = await prisma.message.updateMany({
      where: { id: messageId, lead: { userId } },
      data: { replyStatus: newStatus },
    });

    if (result.count === 0) {
      return { success: false, error: "Повідомлення не знайдено" };
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { leadId: true },
    });
    if (message) {
      await revalidateLocalizedPath(`/leads/${message.leadId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("updateReplyStatus error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "DB error",
    };
  }
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

    await revalidateLocalizedPath(`/leads/${leadId}`);
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

  const claim = await claimLeadEmailMessage({
    userId,
    leadId,
    subject: trimmedSubject,
    body: trimmedBody,
  });
  if (!claim.success) return claim;

  const sendResult = await sendUserEmail(
    userId,
    claim.email,
    trimmedSubject,
    trimmedBody,
  );
  await markMessageDeliveryResult(claim.messageId, sendResult);

  try {
    if (sendResult.success) {
      await prisma.lead.updateMany({
        where: { id: leadId, userId, status: { not: "Do not contact" } },
        data: { status: "Contacted" },
      });
    }

    await revalidateLocalizedPath(`/leads/${leadId}`);

    if (sendResult.success) {
      return { success: true, messageId: claim.messageId };
    }

    return {
      success: false,
      messageId: claim.messageId,
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

type LeadEmailMessageClaim =
  | { success: true; messageId: string; email: string }
  | (Omit<SaveMessageResult, "success"> & { success: false });

async function claimLeadEmailMessage({
  userId,
  leadId,
  subject,
  body,
}: {
  userId: string;
  leadId: string;
  subject: string;
  body: string;
}): Promise<LeadEmailMessageClaim> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT pg_advisory_xact_lock(${messageSendLockKey(
        userId,
        leadId,
        subject,
        body,
      )}::bigint)`,
    );

    const lead = await tx.lead.findFirst({
      where: { id: leadId, userId },
      select: { id: true, email: true, status: true },
    });
    if (!lead) {
      return { success: false, error: "Лід не знайдено" };
    }
    if (lead.status === "Do not contact") {
      return {
        success: false,
        errorCode: "DO_NOT_CONTACT",
        error: "Лід позначений як Do not contact — відправку заблоковано.",
      };
    }
    if (!lead.email) {
      return {
        success: false,
        errorCode: "NO_EMAIL",
        error: "У ліда немає email — додайте його перед відправкою.",
      };
    }

    const existing = await tx.message.findFirst({
      where: {
        leadId,
        subject,
        body,
        deliveryStatus: { in: ["SENDING", "SENT", "FAILED"] },
      },
      orderBy: { sentAt: "desc" },
      select: { id: true, deliveryStatus: true },
    });

    if (existing?.deliveryStatus === "SENT") {
      return {
        success: false,
        messageId: existing.id,
        errorCode: "ALREADY_SENT",
        error: "Цей лист уже був надісланий.",
      };
    }
    if (existing?.deliveryStatus === "SENDING") {
      return {
        success: false,
        messageId: existing.id,
        errorCode: "SEND_IN_FLIGHT",
        error: "Відправка цього листа вже виконується.",
      };
    }
    if (existing?.deliveryStatus === "FAILED") {
      const claim = await tx.message.updateMany({
        where: { id: existing.id, deliveryStatus: "FAILED" },
        data: { deliveryStatus: "SENDING" },
      });
      if (claim.count === 0) {
        return {
          success: false,
          messageId: existing.id,
          errorCode: "SEND_IN_FLIGHT",
          error: "Відправка цього листа вже виконується.",
        };
      }
      return { success: true, messageId: existing.id, email: lead.email };
    }

    const created = await tx.message.create({
      data: {
        leadId,
        subject,
        body,
        deliveryStatus: "SENDING",
      },
      select: { id: true },
    });

    return { success: true, messageId: created.id, email: lead.email };
  });
}

function messageSendLockKey(
  userId: string,
  leadId: string,
  subject: string,
  body: string,
): string {
  const hash = createHash("sha256")
    .update(`${userId}\0${leadId}\0${subject}\0${body}`)
    .digest();
  const key = hash.readBigInt64BE(0) & BigInt("0x7fffffffffffffff");
  return key.toString();
}
