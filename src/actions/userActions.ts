"use server";

import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { encrypt } from "@/src/lib/crypto";
import { sendUserEmail } from "@/src/lib/mailer";
import { prisma } from "@/src/lib/prisma";
import { validateBeatEmailAudioFile } from "@/src/lib/beatAttachmentRules";
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

export interface SendTestEmailResult {
  success: boolean;
  error?: string;
  /** "NO_SMTP" | "PLATFORM_NOT_CONFIGURED" — пробрасуємо з mailer для UX-хінтів. */
  code?: string;
  messageId?: string;
}

/**
 * Надсилає тестовий лист на вказану адресу, використовуючи поточні **збережені**
 * налаштування юзера (платформа або BYOSMTP — те, що активне у БД).
 *
 * НЕ використовує локальні значення форми: ціль тесту — перевірити, що саме
 * та конфігурація, з якою юзер реально слатиме листи, працює end-to-end.
 * Якщо юзер не зберіг налаштування — повертаємо помилку з кодом NO_SMTP, щоб
 * на UI підказати "спочатку збережіть".
 */
export async function sendTestEmail(
  to: string,
): Promise<SendTestEmailResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const target = (to ?? "").trim();
  if (!target || !EMAIL_REGEX.test(target)) {
    return { success: false, error: "Невалідний email одержувача" };
  }

  const subject = "Flux Leads — тестовий лист";
  const body = [
    "Привіт!",
    "",
    "Якщо ти бачиш цей лист — налаштування пошти у Flux Leads працюють.",
    "Якщо ти у Простому режимі — натисни Reply і перевір, що відповідь приходить тобі в інбокс.",
    "Якщо у Розширеному (власний SMTP) — переконайся, що лист не потрапив у Спам.",
    "",
    "— Flux Leads",
  ].join("\n");

  const result = await sendUserEmail(userId, target, subject, body);

  if (result.success) {
    return { success: true, messageId: result.messageId };
  }
  return { success: false, error: result.error, code: result.code };
}

/**
 * Тестовий лист **із аудіо-вкладенням** — той самий шлях, що `sendBeatViaEmail`
 * (sendUserEmail + attachments), без створення ліда в CRM.
 */
export async function sendTestEmailWithAttachment(
  formData: FormData,
): Promise<SendTestEmailResult> {
  const userId = await getRequestUserId();
  if (!userId) return { success: false, error: "Не авторизовано" };

  const toRaw = formData.get("to");
  if (typeof toRaw !== "string" || !toRaw.trim()) {
    return { success: false, error: "Відсутній email одержувача" };
  }
  const target = toRaw.trim();
  if (!EMAIL_REGEX.test(target)) {
    return { success: false, error: "Невалідний email одержувача" };
  }

  const validated = validateBeatEmailAudioFile(formData.get("audio"));
  if (!validated.ok) {
    return {
      success: false,
      error: validated.error,
      code: validated.reason,
    };
  }
  const audioEntry = validated.file;
  const declaredMime = audioEntry.type?.toLowerCase() ?? "";

  const subject = "[TEST] Flux Leads — лист з аудіо-вкладенням";
  const body = [
    "Привіт!",
    "",
    "Це тестовий лист із прикріпленим файлом — той самий шлях відправки, що й кнопка «Надіслати на Email» у режимі «Біти» (вкладення не зберігається в базі даних).",
    "Перевірте відкриття файлу в поштовому клієнті та папку «Спам», якщо потрібно.",
    "",
    `Файл: ${audioEntry.name} (~${Math.max(1, Math.round(audioEntry.size / 1024))} KB)`,
    "",
    "— Flux Leads",
  ].join("\n");

  const buffer = Buffer.from(await audioEntry.arrayBuffer());
  const result = await sendUserEmail(userId, target, subject, body, {
    attachments: [
      {
        filename: audioEntry.name || "test-beat.mp3",
        content: buffer,
        contentType: declaredMime || "audio/mpeg",
      },
    ],
  });

  if (result.success) {
    return { success: true, messageId: result.messageId };
  }
  return { success: false, error: result.error, code: result.code };
}
