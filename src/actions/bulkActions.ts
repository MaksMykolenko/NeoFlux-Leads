"use server";

import pLimit from "p-limit";
import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { prisma } from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/session";
import { checkSubscription } from "@/src/lib/subscription";
import { isLeadStatus } from "@/src/lib/leadStatus";
import { runAuditForLead } from "@/src/actions/auditActions";

const MAX_BULK_SIZE = 100;

// Playwright важкий — одночасно більш ніж ~5 сесій з'їдають CPU/RAM
// на serverless instance і починаються timeout-и. 5 — компроміс між
// швидкістю і стабільністю.
const AUDIT_CONCURRENCY = 5;

export interface BulkAuditResult {
  success: boolean;
  error?: string;
  errorCode?: "PLAN_REQUIRED";
  /** Скільки лідів реально пропустили через аудит. */
  attempted?: number;
  succeeded?: number;
  failed?: number;
  skipped?: number; // без сайту або не належить юзеру
}

/**
 * Масовий аудит лідів. Уся партія тримається на Promise.allSettled — щоб
 * один зламаний сайт не валив ціле задання. Перед запуском:
 * - перевіряємо план (websiteAudit потребує Pro+)
 * - звужуємо leadIds до тих, що належать юзеру і мають website (deduplicate)
 */
export async function bulkRunAudit(leadIds: string[]): Promise<BulkAuditResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизовано" };

  if (!checkSubscription(user, "websiteAudit")) {
    return {
      success: false,
      errorCode: "PLAN_REQUIRED",
      error: "Масовий аудит доступний на плані Pro і вище.",
    };
  }

  const ids = sanitizeIds(leadIds);
  if (ids.length === 0) return { success: false, error: "Не вибрано жодного ліда" };

  // Лиш ліди юзера + з website. Інше — skip.
  const eligible = await prisma.lead.findMany({
    where: { id: { in: ids }, userId: user.id, website: { not: null } },
    select: { id: true },
  });

  const skipped = ids.length - eligible.length;

  const limit = pLimit(AUDIT_CONCURRENCY);
  const settled = await Promise.allSettled(
    eligible.map((l) => limit(() => runAuditForLead(l.id))),
  );

  let succeeded = 0;
  let failed = 0;
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value.success) succeeded++;
    else failed++;
  }

  await revalidateLocalizedPath("/");
  return {
    success: failed === 0,
    attempted: eligible.length,
    succeeded,
    failed,
    skipped,
  };
}

export interface BulkStatusResult {
  success: boolean;
  error?: string;
  count?: number;
}

export async function bulkUpdateStatus(
  leadIds: string[],
  newStatus: string,
): Promise<BulkStatusResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизовано" };

  if (!isLeadStatus(newStatus)) {
    return { success: false, error: `Невалідний статус: ${newStatus}` };
  }

  const ids = sanitizeIds(leadIds);
  if (ids.length === 0) return { success: false, error: "Не вибрано жодного ліда" };

  try {
    const result = await prisma.lead.updateMany({
      where: { id: { in: ids }, userId: user.id },
      data: { status: newStatus },
    });
    await revalidateLocalizedPath("/");
    return { success: true, count: result.count };
  } catch (err) {
    console.error("bulkUpdateStatus error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "DB error",
    };
  }
}

export interface BulkDeleteResult {
  success: boolean;
  error?: string;
  count?: number;
}

export async function bulkDeleteLeads(
  leadIds: string[],
): Promise<BulkDeleteResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизовано" };

  const ids = sanitizeIds(leadIds);
  if (ids.length === 0) return { success: false, error: "Не вибрано жодного ліда" };

  try {
    // Cascade delete: Audit (1:1) і Message (1:N) обидві мають
    // onDelete: Cascade, тож БД сама прибере дочірні рядки.
    const result = await prisma.lead.deleteMany({
      where: { id: { in: ids }, userId: user.id },
    });
    await revalidateLocalizedPath("/");
    return { success: true, count: result.count };
  } catch (err) {
    console.error("bulkDeleteLeads error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "DB error",
    };
  }
}

function sanitizeIds(input: string[]): string[] {
  if (!Array.isArray(input)) return [];
  const cleaned = Array.from(
    new Set(input.filter((s) => typeof s === "string" && s.trim().length > 0)),
  );
  return cleaned.slice(0, MAX_BULK_SIZE);
}
