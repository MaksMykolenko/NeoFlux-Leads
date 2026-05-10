"use server";

import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { prisma } from "@/src/lib/prisma";
import { isLeadStatus } from "@/src/lib/leadStatus";
import { getRequestUserId } from "@/src/lib/session";

export interface UpdateStatusResult {
  success: boolean;
  error?: string;
}

export async function updateLeadStatus(
  leadId: string,
  newStatus: string
): Promise<UpdateStatusResult> {
  if (!leadId) {
    return { success: false, error: "Missing lead id" };
  }

  if (!isLeadStatus(newStatus)) {
    return { success: false, error: `Невалідний статус: ${newStatus}` };
  }

  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  try {
    // updateMany замість update — щоб where міг включати userId фільтр.
    // Якщо лід належить іншому юзеру, count=0 → повертаємо not found.
    const result = await prisma.lead.updateMany({
      where: { id: leadId, userId },
      data: { status: newStatus },
    });

    if (result.count === 0) {
      return { success: false, error: "Лід не знайдено" };
    }

    await revalidateLocalizedPath(`/leads/${leadId}`);
    return { success: true };
  } catch (error) {
    console.error("updateLeadStatus error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
