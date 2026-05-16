"use server";

import { LeadMode } from "@prisma/client";
import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { prisma } from "@/src/lib/prisma";
import { getRequestUserId } from "@/src/lib/session";

const SUPPORTED_LANGUAGES = ["English", "Ukrainian", "Polish", "German"] as const;
const SUPPORTED_CHANNELS = ["email", "telegram"] as const;
type SupportedChannel = (typeof SUPPORTED_CHANNELS)[number];

function isMode(value: unknown): value is LeadMode {
  return (
    value === LeadMode.LOCAL ||
    value === LeadMode.BEATS ||
    value === LeadMode.UNIVERSAL
  );
}

function sanitizeChannels(input: unknown): SupportedChannel[] {
  if (!Array.isArray(input)) return [];
  const set = new Set<SupportedChannel>();
  for (const v of input) {
    if (typeof v !== "string") continue;
    const norm = v.toLowerCase().trim();
    if (SUPPORTED_CHANNELS.includes(norm as SupportedChannel)) {
      set.add(norm as SupportedChannel);
    }
  }
  return Array.from(set);
}

function sanitizeLanguage(input: unknown): string {
  if (typeof input !== "string") return "English";
  const trimmed = input.trim();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(trimmed)
    ? trimmed
    : "English";
}

export interface AutopilotConfigInput {
  mode: LeadMode;
  searchQuery: string;
  targetRegion: string | null;
  outputLanguage: string;
  channels: string[];
  maxLeadsPerDay: number;
  isActive: boolean;
}

export interface AutopilotConfigRow {
  id: string;
  mode: LeadMode;
  searchQuery: string;
  targetRegion: string | null;
  outputLanguage: string;
  channels: string[];
  maxLeadsPerDay: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function listAutopilotConfigs(): Promise<AutopilotConfigRow[]> {
  const userId = await getRequestUserId();
  if (!userId) return [];
  return prisma.autopilotConfig.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      mode: true,
      searchQuery: true,
      targetRegion: true,
      outputLanguage: true,
      channels: true,
      maxLeadsPerDay: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export interface AutopilotMutationResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function upsertAutopilotConfig(
  input: AutopilotConfigInput,
): Promise<AutopilotMutationResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  if (!isMode(input.mode)) {
    return { success: false, error: `Невалідний mode: ${String(input.mode)}` };
  }
  const searchQuery = input.searchQuery?.trim();
  if (!searchQuery) {
    return { success: false, error: "Пошуковий запит обов'язковий" };
  }
  const targetRegion =
    typeof input.targetRegion === "string" && input.targetRegion.trim()
      ? input.targetRegion.trim().slice(0, 120)
      : null;
  const outputLanguage = sanitizeLanguage(input.outputLanguage);
  const channels = sanitizeChannels(input.channels);
  const maxLeadsPerDay = Number.isFinite(input.maxLeadsPerDay)
    ? Math.min(500, Math.max(1, Math.floor(input.maxLeadsPerDay)))
    : 10;
  const isActive = !!input.isActive;

  if (isActive && channels.length === 0) {
    return {
      success: false,
      error: "Активному автопілоту потрібен хоча б один канал доставки.",
    };
  }

  if (channels.includes("telegram")) {
    const tg = await prisma.telegramSession.findUnique({
      where: { userId },
      select: { isActive: true },
    });
    if (!tg?.isActive) {
      return {
        success: false,
        error:
          "Канал «Telegram» вимагає активного підключення у Settings → Telegram.",
      };
    }
  }

  try {
    const existing = await prisma.autopilotConfig.findFirst({
      where: { userId, mode: input.mode },
      select: { id: true },
    });

    if (existing) {
      const updated = await prisma.autopilotConfig.update({
        where: { id: existing.id },
        data: {
          searchQuery: searchQuery.slice(0, 500),
          targetRegion,
          outputLanguage,
          channels,
          maxLeadsPerDay,
          isActive,
        },
        select: { id: true },
      });
      await revalidateLocalizedPath("/dashboard/autopilot");
      return { success: true, id: updated.id };
    }

    const created = await prisma.autopilotConfig.create({
      data: {
        userId,
        mode: input.mode,
        searchQuery: searchQuery.slice(0, 500),
        targetRegion,
        outputLanguage,
        channels,
        maxLeadsPerDay,
        isActive,
      },
      select: { id: true },
    });
    await revalidateLocalizedPath("/dashboard/autopilot");
    return { success: true, id: created.id };
  } catch (err) {
    console.error("upsertAutopilotConfig error", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "DB error",
    };
  }
}

export async function toggleAutopilotConfig(
  id: string,
  isActive: boolean,
): Promise<AutopilotMutationResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };
  if (!id) return { success: false, error: "Missing config id" };

  try {
    const result = await prisma.autopilotConfig.updateMany({
      where: { id, userId },
      data: { isActive: !!isActive },
    });
    if (result.count === 0) {
      return { success: false, error: "Конфіг не знайдено" };
    }
    await revalidateLocalizedPath("/dashboard/autopilot");
    return { success: true, id };
  } catch (err) {
    console.error("toggleAutopilotConfig error", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "DB error",
    };
  }
}

export async function deleteAutopilotConfig(
  id: string,
): Promise<AutopilotMutationResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };
  if (!id) return { success: false, error: "Missing config id" };

  try {
    const result = await prisma.autopilotConfig.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0) {
      return { success: false, error: "Конфіг не знайдено" };
    }
    await revalidateLocalizedPath("/dashboard/autopilot");
    return { success: true, id };
  } catch (err) {
    console.error("deleteAutopilotConfig error", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "DB error",
    };
  }
}
