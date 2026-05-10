import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "@/src/lib/prisma";

/**
 * Bring-Your-Own-SMTP мейлер. Юзер заводить свої SMTP-креди в /settings,
 * а ми використовуємо їх для відправки. Кожне повідомлення йде з watermark-ом
 * — це безкоштовний канал залучення нових юзерів.
 */

const WATERMARK_TEXT =
  "---\nSent via NeoFlux Lead Engine — Automate your cold outreach.\nhttps://neo-flux-leads-m752.vercel.app";

const WATERMARK_HTML = `<hr style="margin:24px 0 8px;border:none;border-top:1px solid #e5e7eb" />
<p style="font:12px/1.5 -apple-system,BlinkMacSystemFont,Inter,sans-serif;color:#9ca3af;margin:0">
  Sent via <a href="https://neo-flux-leads-m752.vercel.app" style="color:#6366f1;text-decoration:none">NeoFlux Lead Engine</a>
  — Automate your cold outreach.
</p>`;

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

  // SMTPS over 465 потребує `secure: true` (TLS handshake at connect).
  // 587 / 25 / 2525 — STARTTLS, secure: false + автоматичний upgrade.
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const finalText = `${bodyText.trim()}\n\n${WATERMARK_TEXT}`;
  const finalHtml = `${escapeHtml(bodyText.trim()).replace(/\n/g, "<br />")}${WATERMARK_HTML}`;

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
