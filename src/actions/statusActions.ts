"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { isLeadStatus } from "@/src/lib/leadStatus";

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

  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: newStatus },
    });

    revalidatePath(`/leads/${leadId}`);
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
