"use server";

import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { encrypt } from "@/src/lib/crypto";
import { prisma } from "@/src/lib/prisma";
import { getRequestUserId } from "@/src/lib/session";

export interface SmtpSettingsInput {
  /**
   * true  → Простий режим: листи через PLATFORM_SMTP_*; replyTo = fromEmail юзера.
   * false → Розширений режим: BYOSMTP через host/port/user/pass нижче.
   */
  usePlatformSmtp: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  /** Якщо приходить як PASSWORD_PLACEHOLDER ("••••••••") — пароль не перезаписуємо. */
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

export interface SaveSmtpResult {
  success: boolean;
  error?: string;
}

const PASSWORD_PLACEHOLDER = "••••••••";
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Зберігає налаштування пошти юзера.
 *
 * Дві гілки валідації:
 *   - Простий режим (usePlatformSmtp=true): потрібен лише валідний fromEmail
 *     (як reply-to). fromName опційний. Поля host/port/user/pass можуть бути
 *     порожні — їх не валідуємо.
 *   - Розширений режим (false): host обов'язковий, port у валідному діапазоні,
 *     user обов'язковий, fromEmail валідний.
 *
 * Пароль перезаписується тільки якщо приходить НЕ як placeholder ("••••••••")
 * — це дозволяє юзеру оновити host/port не торкаючись пароля.
 */
export async function saveSmtpSettings(
  data: SmtpSettingsInput,
): Promise<SaveSmtpResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const usePlatformSmtp = Boolean(data.usePlatformSmtp);
  const host = data.smtpHost.trim();
  const port = Number(data.smtpPort);
  const user = data.smtpUser.trim();
  const pass = data.smtpPass;
  const fromEmail = data.fromEmail.trim();
  const fromName = data.fromName.trim();

  // From Email обов'язковий у будь-якому режимі: у Простому це reply-to для
  // відповідей від клієнтів; у Розширеному — адреса в заголовку From:.
  if (!fromEmail || !EMAIL_REGEX.test(fromEmail)) {
    return { success: false, error: "Невалідний From Email" };
  }

  if (!usePlatformSmtp) {
    if (!host) return { success: false, error: "Host обов'язковий" };
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      return { success: false, error: "Невалідний port (1-65535)" };
    }
    if (!user) return { success: false, error: "Username обов'язковий" };
  }

  try {
    const updateData: {
      usePlatformSmtp: boolean;
      fromEmail: string;
      fromName: string | null;
      smtpHost?: string | null;
      smtpPort?: number | null;
      smtpUser?: string | null;
      smtpPass?: string;
    } = {
      usePlatformSmtp,
      fromEmail,
      fromName: fromName || null,
    };

    if (!usePlatformSmtp) {
      updateData.smtpHost = host;
      updateData.smtpPort = port;
      updateData.smtpUser = user;
      // Не перезаписуємо пароль, якщо юзер просто зберіг форму без зміни поля.
      if (pass && pass !== PASSWORD_PLACEHOLDER) {
        updateData.smtpPass = encrypt(pass);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await revalidateLocalizedPath("/settings");
    return { success: true };
  } catch (error) {
    console.error("saveSmtpSettings error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Не вдалось зберегти",
    };
  }
}
