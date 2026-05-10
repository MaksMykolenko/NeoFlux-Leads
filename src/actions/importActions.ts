"use server";

import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { prisma } from "@/src/lib/prisma";
import { LeadMode } from "@/src/lib/leadMode";
import { calculateLeadScore } from "@/src/lib/scoring";
import { getCurrentUser } from "@/src/lib/session";
import {
  getLeadLimitStatus,
  getPlanForUser,
  incrementLeadsProcessed,
} from "@/src/lib/subscription";

export interface ImportLeadInput {
  companyName?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface ImportLeadsResult {
  success: boolean;
  error?: string;
  errorCode?: "LIMIT_REACHED";
  imported?: number;
  skipped?: number;
  attempted?: number;
}

const MAX_IMPORT = 500;

/**
 * Bulk-import з CSV. Очікувана форма — масив об’єктів з полями
 * companyName/website/email/phone/notes. Ліди прив’язуються до поточного
 * userId, mode = UNIVERSAL (universal pipeline — без аудиту й без BEATS-полів).
 *
 * Логіка:
 * - перевіряємо ліміт плану перед імпортом (як у scraper-і)
 * - дедуплікація per-user: same website OR same companyName → skip
 * - createMany з skipDuplicates: false (перевіряємо самі для коректних метрик)
 * - інкрементуємо leadsProcessedCount на кількість РЕАЛЬНО доданих
 */
export async function importLeads(
  rows: ImportLeadInput[],
): Promise<ImportLeadsResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизовано" };

  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: false, error: "Файл порожній" };
  }

  const cleaned = rows
    .map(normalizeRow)
    .filter((r): r is NormalizedRow => r !== null)
    .slice(0, MAX_IMPORT);

  if (cleaned.length === 0) {
    return {
      success: false,
      error: "Не знайдено валідних рядків (потрібна хоч одна колонка з даними)",
    };
  }

  // Ліміт плану
  const limitStatus = getLeadLimitStatus(user);
  if (!limitStatus.allowed) {
    const plan = getPlanForUser(user);
    return {
      success: false,
      errorCode: "LIMIT_REACHED",
      error: `Ліміт плану ${plan.name} вичерпано (${limitStatus.used}/${plan.leadsPerMonth}). Оновіть тариф на /pricing.`,
    };
  }

  // Скільки ще можна додати
  let remaining = limitStatus.unlimited
    ? Number.POSITIVE_INFINITY
    : limitStatus.remaining;

  // Дедуплікація: тягнемо існуючі website + companyName юзера однією
  // вибіркою, далі фільтруємо in-memory (швидше, ніж N findFirst).
  const existing = await prisma.lead.findMany({
    where: { userId: user.id },
    select: { companyName: true, website: true },
  });
  const existingNames = new Set(
    existing
      .map((e) => e.companyName.toLowerCase().trim())
      .filter((n) => n.length > 0),
  );
  const existingSites = new Set(
    existing
      .map((e) => e.website?.toLowerCase().trim())
      .filter((s): s is string => !!s),
  );

  const toCreate: NormalizedRow[] = [];
  let skipped = 0;
  for (const row of cleaned) {
    const name = row.companyName.toLowerCase();
    const site = row.website?.toLowerCase() ?? null;
    if (
      existingNames.has(name) ||
      (site && existingSites.has(site))
    ) {
      skipped++;
      continue;
    }
    if (remaining <= 0) {
      skipped++;
      continue;
    }
    toCreate.push(row);
    existingNames.add(name);
    if (site) existingSites.add(site);
    remaining -= 1;
  }

  if (toCreate.length === 0) {
    return {
      success: true,
      imported: 0,
      skipped,
      attempted: cleaned.length,
    };
  }

  try {
    const data = toCreate.map((row) => {
      const score = calculateLeadScore(
        { website: row.website, email: row.email },
        null,
      );
      return {
        userId: user.id,
        mode: LeadMode.UNIVERSAL,
        companyName: row.companyName,
        website: row.website,
        email: row.email,
        phone: row.phone,
        notes: row.notes,
        source: "CSV Import",
        score,
      };
    });

    const result = await prisma.lead.createMany({ data });
    await incrementLeadsProcessed(user.id, result.count);
    await revalidateLocalizedPath("/");

    return {
      success: true,
      imported: result.count,
      skipped,
      attempted: cleaned.length,
    };
  } catch (error) {
    console.error("importLeads error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "DB error",
    };
  }
}

interface NormalizedRow {
  companyName: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

function normalizeRow(row: ImportLeadInput): NormalizedRow | null {
  const companyName = clean(row.companyName);
  if (!companyName) return null;
  return {
    companyName,
    website: cleanUrl(row.website),
    email: cleanEmail(row.email),
    phone: clean(row.phone),
    notes: cleanText(row.notes, 2000),
  };
}

function clean(v: string | null | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

function cleanText(v: string | null | undefined, max: number): string | null {
  const t = clean(v);
  if (!t) return null;
  return t.slice(0, max);
}

function cleanEmail(v: string | null | undefined): string | null {
  const t = clean(v).toLowerCase();
  if (!t) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : null;
}

function cleanUrl(v: string | null | undefined): string | null {
  let t = clean(v);
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) t = `https://${t}`;
  try {
    new URL(t);
    return t;
  } catch {
    return null;
  }
}
