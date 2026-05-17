"use server";

import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { decrypt, encrypt } from "@/src/lib/crypto";
import { prisma } from "@/src/lib/prisma";
import { getRequestUserId } from "@/src/lib/session";
import {
  sendAuthCode,
  verifyAuthCode,
  type TelegramCreds,
} from "@/src/lib/telegram/userbot";

const PHONE_RE = /^\+?[0-9\s\-()]{6,32}$/;
const API_HASH_RE = /^[a-f0-9]{32}$/i;

function sanitizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!PHONE_RE.test(trimmed)) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (!digits.startsWith("+")) return `+${digits.replace(/^\+?/, "")}`;
  return digits;
}

async function loadCreds(userId: string): Promise<TelegramCreds | null> {
  const session = await prisma.telegramSession.findUnique({
    where: { userId },
    select: { apiId: true, apiHash: true },
  });
  if (!session) return null;
  try {
    return { apiId: session.apiId, apiHash: decrypt(session.apiHash) };
  } catch (err) {
    console.error("[telegramActions] decrypt apiHash failed", err);
    return null;
  }
}

export interface TelegramStatus {
  /** API ключі збережені — можна стартувати phone-flow */
  hasCredentials: boolean;
  /** Auth завершено — можна слати повідомлення */
  connected: boolean;
  phone: string | null;
  apiId: number | null;
  dailyCount: number;
  isActive: boolean;
}

export async function getTelegramStatus(): Promise<TelegramStatus> {
  const userId = await getRequestUserId();
  if (!userId) {
    return {
      hasCredentials: false,
      connected: false,
      phone: null,
      apiId: null,
      dailyCount: 0,
      isActive: false,
    };
  }

  const session = await prisma.telegramSession.findUnique({
    where: { userId },
    select: {
      apiId: true,
      phone: true,
      sessionKey: true,
      isActive: true,
      dailyCount: true,
    },
  });

  if (!session) {
    return {
      hasCredentials: false,
      connected: false,
      phone: null,
      apiId: null,
      dailyCount: 0,
      isActive: false,
    };
  }

  return {
    hasCredentials: true,
    connected: !!session.sessionKey && session.isActive,
    phone: session.phone,
    apiId: session.apiId,
    dailyCount: session.dailyCount,
    isActive: session.isActive,
  };
}

export interface SaveCredentialsResult {
  success: boolean;
  error?: string;
}

/**
 * Зберігає API ключі юзера (Telegram App credentials з my.telegram.org/apps).
 * apiHash шифрується AES-256-GCM перед записом. Якщо ключі змінились — старі
 * `phone`/`sessionKey` обнуляються, бо вони прив'язані до конкретного App.
 */
export async function saveTelegramApiCredentials(
  apiIdRaw: string,
  apiHashRaw: string,
): Promise<SaveCredentialsResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const apiIdTrim = apiIdRaw.trim();
  const apiHashTrim = apiHashRaw.trim().toLowerCase();

  const apiId = Number.parseInt(apiIdTrim, 10);
  if (!Number.isFinite(apiId) || apiId <= 0) {
    return {
      success: false,
      error: "API_ID має бути додатним числом (наприклад 12345678).",
    };
  }
  if (!API_HASH_RE.test(apiHashTrim)) {
    return {
      success: false,
      error: "API_HASH має бути hex-рядком 32 символи (a-f, 0-9).",
    };
  }

  try {
    const encryptedHash = encrypt(apiHashTrim);
    const existing = await prisma.telegramSession.findUnique({
      where: { userId },
      select: { apiId: true },
    });

    if (existing) {
      const credsChanged = existing.apiId !== apiId;
      await prisma.telegramSession.update({
        where: { userId },
        data: {
          apiId,
          apiHash: encryptedHash,
          // якщо змінили App — стара сесія невалідна, інакше зберігаємо
          ...(credsChanged
            ? {
                phone: null,
                sessionKey: null,
                isActive: false,
                dailyCount: 0,
              }
            : {}),
        },
      });
    } else {
      await prisma.telegramSession.create({
        data: {
          userId,
          apiId,
          apiHash: encryptedHash,
          isActive: false,
        },
      });
    }

    await revalidateLocalizedPath("/settings");
    return { success: true };
  } catch (err) {
    console.error("saveTelegramApiCredentials error", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Не вдалося зберегти ключі",
    };
  }
}

export interface StartTelegramAuthResult {
  success: boolean;
  phoneCodeHash?: string;
  phone?: string;
  isCodeViaApp?: boolean;
  error?: string;
  errorCode?: "NO_CREDENTIALS";
}

export async function startTelegramAuth(
  phoneInput: string,
): Promise<StartTelegramAuthResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const creds = await loadCreds(userId);
  if (!creds) {
    return {
      success: false,
      errorCode: "NO_CREDENTIALS",
      error: "Спочатку збережіть Telegram API ключі (Step 1).",
    };
  }

  const phone = sanitizePhone(phoneInput);
  if (!phone) {
    return { success: false, error: "Невалідний номер телефону" };
  }

  try {
    const res = await sendAuthCode(creds, phone);
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
  errorCode?:
    | "NO_CREDENTIALS"
    | "NO_PENDING"
    | "BAD_CODE"
    | "PASSWORD_REQUIRED"
    | "BAD_PASSWORD";
}

export async function confirmTelegramAuth(
  phoneInput: string,
  phoneCodeHash: string,
  code: string,
  password?: string,
): Promise<ConfirmTelegramAuthResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const creds = await loadCreds(userId);
  if (!creds) {
    return {
      success: false,
      errorCode: "NO_CREDENTIALS",
      error: "Не знайдено збережених API ключів.",
    };
  }

  const phone = sanitizePhone(phoneInput);
  if (!phone) return { success: false, error: "Невалідний номер телефону" };
  if (!phoneCodeHash) return { success: false, error: "Missing phoneCodeHash" };
  if (!code.trim()) return { success: false, error: "Введіть код з Telegram" };

  try {
    const res = await verifyAuthCode(creds, phone, phoneCodeHash, code, password);
    if (!res.success || !res.sessionString) {
      return {
        success: false,
        needsPassword: res.needsPassword,
        errorCode: res.errorCode,
        error: res.error ?? "Не вдалося завершити авторизацію",
      };
    }

    const encryptedSession = encrypt(res.sessionString);

    await prisma.telegramSession.update({
      where: { userId },
      data: {
        phone,
        sessionKey: encryptedSession,
        isActive: true,
        dailyCount: 0,
        lastReset: new Date(),
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

/**
 * Видаляє ВЕСЬ TelegramSession-рядок: і ключі, і сесію. Юзер мусить
 * ввести API_ID/API_HASH знову з нуля. Якщо потрібен м'якший варіант —
 * можна додати окремий action "logout (keep credentials)" пізніше.
 */
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
