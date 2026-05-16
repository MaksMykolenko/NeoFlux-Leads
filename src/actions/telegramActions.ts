"use server";

import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { encrypt } from "@/src/lib/crypto";
import { prisma } from "@/src/lib/prisma";
import { getRequestUserId } from "@/src/lib/session";
import {
  sendAuthCode,
  verifyAuthCode,
} from "@/src/lib/telegram/userbot";

const PHONE_RE = /^\+?[0-9\s\-()]{6,32}$/;

function sanitizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!PHONE_RE.test(trimmed)) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (!digits.startsWith("+")) return `+${digits.replace(/^\+?/, "")}`;
  return digits;
}

export interface TelegramStatus {
  connected: boolean;
  phone: string | null;
  dailyCount: number;
  isActive: boolean;
}

export async function getTelegramStatus(): Promise<TelegramStatus> {
  const userId = await getRequestUserId();
  if (!userId) return { connected: false, phone: null, dailyCount: 0, isActive: false };

  const session = await prisma.telegramSession.findUnique({
    where: { userId },
    select: { phone: true, isActive: true, dailyCount: true },
  });

  if (!session) {
    return { connected: false, phone: null, dailyCount: 0, isActive: false };
  }

  return {
    connected: true,
    phone: session.phone,
    dailyCount: session.dailyCount,
    isActive: session.isActive,
  };
}

export interface StartTelegramAuthResult {
  success: boolean;
  phoneCodeHash?: string;
  phone?: string;
  isCodeViaApp?: boolean;
  error?: string;
}

export async function startTelegramAuth(
  phoneInput: string,
): Promise<StartTelegramAuthResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const phone = sanitizePhone(phoneInput);
  if (!phone) {
    return { success: false, error: "Невалідний номер телефону" };
  }

  try {
    const res = await sendAuthCode(phone);
    if (!res.success || !res.phoneCodeHash) {
      return {
        success: false,
        error: res.error ?? "Не вдалося надіслати код",
      };
    }
    return {
      success: true,
      phoneCodeHash: res.phoneCodeHash,
      phone,
      isCodeViaApp: res.isCodeViaApp ?? false,
    };
  } catch (err) {
    console.error("startTelegramAuth error", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "sendAuthCode failed",
    };
  }
}

export interface ConfirmTelegramAuthResult {
  success: boolean;
  needsPassword?: boolean;
  error?: string;
  errorCode?: "NO_PENDING" | "BAD_CODE" | "PASSWORD_REQUIRED" | "BAD_PASSWORD";
}

export async function confirmTelegramAuth(
  phoneInput: string,
  phoneCodeHash: string,
  code: string,
  password?: string,
): Promise<ConfirmTelegramAuthResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const phone = sanitizePhone(phoneInput);
  if (!phone) return { success: false, error: "Невалідний номер телефону" };
  if (!phoneCodeHash) return { success: false, error: "Missing phoneCodeHash" };
  if (!code.trim()) return { success: false, error: "Введіть код з Telegram" };

  try {
    const res = await verifyAuthCode(phone, phoneCodeHash, code, password);
    if (!res.success || !res.sessionString) {
      return {
        success: false,
        needsPassword: res.needsPassword,
        errorCode: res.errorCode,
        error: res.error ?? "Не вдалося завершити авторизацію",
      };
    }

    const encrypted = encrypt(res.sessionString);

    await prisma.telegramSession.upsert({
      where: { userId },
      create: {
        userId,
        phone,
        sessionKey: encrypted,
        isActive: true,
        dailyCount: 0,
        lastReset: new Date(),
      },
      update: {
        phone,
        sessionKey: encrypted,
        isActive: true,
      },
    });

    await revalidateLocalizedPath("/settings");
    return { success: true };
  } catch (err) {
    console.error("confirmTelegramAuth error", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "verifyAuthCode failed",
    };
  }
}

export interface DisconnectTelegramResult {
  success: boolean;
  error?: string;
}

export async function disconnectTelegramSession(): Promise<DisconnectTelegramResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  try {
    await prisma.telegramSession.deleteMany({ where: { userId } });
    await revalidateLocalizedPath("/settings");
    return { success: true };
  } catch (err) {
    console.error("disconnectTelegramSession error", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Disconnect failed",
    };
  }
}
