import "server-only";
import nodemailer from "nodemailer";
import { decrypt } from "@/src/lib/crypto";
import { prisma } from "@/src/lib/prisma";

/**
 * Bring-Your-Own-SMTP мейлер. Юзер заводить свої SMTP-креди в /settings,
 * а ми використовуємо їх для відправки. Кожне повідомлення йде з watermark-ом
 * — це безкоштовний канал залучення нових юзерів.
 */

function publicSiteHref(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* fall through */
    }
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function watermarkText(): string {
  const href = publicSiteHref();
  return `---\nSent via Flux Leads — Automate your cold outreach.\n${href}`;
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function watermarkHtml(): string {
  const href = publicSiteHref();
  return `<hr style="margin:24px 0 8px;border:none;border-top:1px solid #e5e7eb" />
<p style="font:12px/1.5 -apple-system,BlinkMacSystemFont,Inter,sans-serif;color:#9ca3af;margin:0">
  Sent via <a href="${escapeAttr(href)}" style="color:#6a00ff;text-decoration:none;font-weight:600">Flux Leads</a>
  — Automate your cold outreach.
</p>`;
}

export type SendEmailResult =
  | { success: true; messageId: string }
  | { success: false; error: string; code?: "NO_SMTP" };

export async function sendUserEmail(
  userId: string,
  to: string,
  subject: string,
  bodyText: string,
): Promise<SendEmailResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPass: true,
      fromEmail: true,
      fromName: true,
    },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const { smtpHost, smtpPort, smtpUser, smtpPass, fromEmail, fromName } = user;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail) {
    return {
      success: false,
      code: "NO_SMTP",
      error: "Please configure SMTP in Settings",
    };
  }

  let plaintextPass: string;
  try {
    plaintextPass = decrypt(smtpPass);
  } catch (err) {
    console.error(`[mailer] decrypt smtpPass failed for user=${userId}`, err);
    return {
      success: false,
      error:
        "Не вдалося розшифрувати SMTP пароль. Заново збережіть налаштування у /settings.",
    };
  }

  // SMTPS over 465 потребує `secure: true` (TLS handshake at connect).
  // 587 / 25 / 2525 — STARTTLS, secure: false + автоматичний upgrade.
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: plaintextPass },
  });

  const finalText = `${bodyText.trim()}\n\n${watermarkText()}`;
  const finalHtml = `${escapeHtml(bodyText.trim()).replace(/\n/g, "<br />")}${watermarkHtml()}`;

  try {
    const info = await transporter.sendMail({
      from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
      to,
      subject,
      text: finalText,
      html: finalHtml,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const error =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[mailer] sendUserEmail failed for user=${userId}`, err);
    return { success: false, error };
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
