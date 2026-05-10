"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { getRequestUserId } from "@/src/lib/session";

export interface SaveMessageResult {
  success: boolean;
  error?: string;
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
