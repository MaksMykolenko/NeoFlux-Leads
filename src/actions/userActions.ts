"use server";

import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { prisma } from "@/src/lib/prisma";
import { getRequestUserId } from "@/src/lib/session";

export interface SmtpSettingsInput {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

export interface SaveSmtpResult {
  success: boolean;
  error?: string;
}

const PASSWORD_PLACEHOLDER = "••••••••";

/**
 * Зберігає SMTP-налаштування юзера. Якщо `smtpPass` приходить як placeholder
 * (юзер не міняв пароль на формі) — лишаємо існуючий, не перезаписуємо.
 */
export async function saveSmtpSettings(
  data: SmtpSettingsInput,
): Promise<SaveSmtpResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const host = data.smtpHost.trim();
  const port = Number(data.smtpPort);
  const user = data.smtpUser.trim();
  const pass = data.smtpPass;
  const fromEmail = data.fromEmail.trim();
  const fromName = data.fromName.trim();

  if (!host) return { success: false, error: "Host обов'язковий" };
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    return { success: false, error: "Невалідний port (1-65535)" };
  }
  if (!user) return { success: false, error: "Username обов'язковий" };
  if (!fromEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromEmail)) {
    return { success: false, error: "Невалідний From Email" };
  }

  try {
    const updateData: {
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      fromEmail: string;
      fromName: string | null;
      smtpPass?: string;
    } = {
      smtpHost: host,
      smtpPort: port,
      smtpUser: user,
      fromEmail,
      fromName: fromName || null,
    };

    // Не перезаписуємо пароль, якщо юзер просто зберіг форму без зміни поля.
    if (pass && pass !== PASSWORD_PLACEHOLDER) {
      updateData.smtpPass = pass;
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
