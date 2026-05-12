import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { decrypt } from "@/src/lib/crypto";
import { prisma } from "@/src/lib/prisma";

/**
 * Гібридний мейлер з двома режимами:
 *
 * 1. PLATFORM (usePlatformSmtp=true) — листи летять через центральний
 *    PLATFORM_SMTP_* акк платформи. Юзер не вводить SMTP-креди, але мусить
 *    задати fromEmail — він підставляється в Reply-To, щоб відповіді клієнтів
 *    приходили йому в інбокс. Дешево й просто; всі юзери ділять одну SMTP
 *    репутацію і ліміти, тож для масовості краще Розширений.
 *
 * 2. CUSTOM (BYOSMTP, usePlatformSmtp=false) — юзер сам підключає свій SMTP
 *    (Gmail App Password, Hostinger, SES…). Креди шифровані AES-256-GCM у БД.
 *    Кожен юзер на своїх лімітах/репутації провайдера.
 *
 * Жорсткі таймаути потрібні для serverless: дефолтні 60-секундні чекання
 * nodemailer-а зʼїдять весь execution-budget Vercel-функції при хоч одному
 * "висячому" з'єднанні.
 */

const SMTP_TIMEOUTS = {
  connectionTimeout: 10_000,
  greetingTimeout: 5_000,
  socketTimeout: 15_000,
} as const;

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
  | {
      success: false;
      error: string;
      code?: "NO_SMTP" | "PLATFORM_NOT_CONFIGURED";
    };

interface UserMailRow {
  usePlatformSmtp: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  fromEmail: string | null;
  fromName: string | null;
}

/**
 * Зчитує PLATFORM_SMTP_* env. Кидає, якщо хоч одна змінна відсутня — це
 * налаштування адміна, не юзера, тож юзер не може його виправити в /settings.
 */
function loadPlatformSmtpConfig(): {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
} {
  const host = process.env.PLATFORM_SMTP_HOST?.trim();
  const portRaw = process.env.PLATFORM_SMTP_PORT?.trim();
  const user = process.env.PLATFORM_SMTP_USER?.trim();
  const pass = process.env.PLATFORM_SMTP_PASS;
  const fromEmail = process.env.PLATFORM_SMTP_FROM_EMAIL?.trim();

  const missing: string[] = [];
  if (!host) missing.push("PLATFORM_SMTP_HOST");
  if (!portRaw) missing.push("PLATFORM_SMTP_PORT");
  if (!user) missing.push("PLATFORM_SMTP_USER");
  if (!pass) missing.push("PLATFORM_SMTP_PASS");
  if (!fromEmail) missing.push("PLATFORM_SMTP_FROM_EMAIL");

  if (missing.length > 0) {
    throw new PlatformSmtpConfigError(
      `Платформений SMTP не сконфігуровано на сервері: відсутні ${missing.join(", ")}. Зверніться до адміна або переключіть юзера в Розширений режим.`,
    );
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new PlatformSmtpConfigError(
      `PLATFORM_SMTP_PORT="${portRaw}" не є валідним портом (1-65535).`,
    );
  }

  return { host: host!, port, user: user!, pass: pass!, fromEmail: fromEmail! };
}

class PlatformSmtpConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlatformSmtpConfigError";
  }
}

function buildPlatformTransporter(): {
  transporter: Transporter;
  fromEmail: string;
} {
  const cfg = loadPlatformSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
    ...SMTP_TIMEOUTS,
  });
  return { transporter, fromEmail: cfg.fromEmail };
}

function buildCustomTransporter(user: UserMailRow): Transporter {
  if (
    !user.smtpHost ||
    !user.smtpPort ||
    !user.smtpUser ||
    !user.smtpPass
  ) {
    // Цю гілку викликаючий код має відсікти раніше через NO_SMTP, але
    // tightenим типи: якщо нас дійшло до сюди — це bug.
    throw new Error("Custom SMTP fields missing despite usePlatformSmtp=false");
  }

  const plaintextPass = decrypt(user.smtpPass);

  // SMTPS over 465 → secure:true (TLS handshake at connect).
  // 587/25/2525 → secure:false + автоматичний STARTTLS upgrade.
  return nodemailer.createTransport({
    host: user.smtpHost,
    port: user.smtpPort,
    secure: user.smtpPort === 465,
    auth: { user: user.smtpUser, pass: plaintextPass },
    ...SMTP_TIMEOUTS,
  });
}

export async function sendUserEmail(
  userId: string,
  to: string,
  subject: string,
  bodyText: string,
): Promise<SendEmailResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      usePlatformSmtp: true,
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

  const finalText = `${bodyText.trim()}\n\n${watermarkText()}`;
  const finalHtml = `${escapeHtml(bodyText.trim()).replace(/\n/g, "<br />")}${watermarkHtml()}`;

  // ───── PLATFORM MODE ─────
  if (user.usePlatformSmtp) {
    if (!user.fromEmail) {
      return {
        success: false,
        code: "NO_SMTP",
        error:
          "Вкажіть свій email у Settings — він буде використаний як Reply-To для відповідей клієнтів.",
      };
    }

    let transporter: Transporter;
    let platformFromEmail: string;
    try {
      const built = buildPlatformTransporter();
      transporter = built.transporter;
      platformFromEmail = built.fromEmail;
    } catch (err) {
      console.error("[mailer] platform SMTP config invalid", err);
      if (err instanceof PlatformSmtpConfigError) {
        return {
          success: false,
          code: "PLATFORM_NOT_CONFIGURED",
          error: err.message,
        };
      }
      const error = err instanceof Error ? err.message : String(err);
      return { success: false, error };
    }

    const displayName = user.fromName?.trim() || "NeoFlux User";
    try {
      const info = await transporter.sendMail({
        from: `"${escapeFromName(displayName)}" <${platformFromEmail}>`,
        replyTo: user.fromEmail,
        to,
        subject,
        text: finalText,
        html: finalHtml,
      });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      const error =
        err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error(
        `[mailer] platform sendMail failed for user=${userId}`,
        err,
      );
      return { success: false, error };
    } finally {
      transporter.close();
    }
  }

  // ───── CUSTOM MODE (BYOSMTP) ─────
  if (
    !user.smtpHost ||
    !user.smtpPort ||
    !user.smtpUser ||
    !user.smtpPass ||
    !user.fromEmail
  ) {
    return {
      success: false,
      code: "NO_SMTP",
      error: "Please configure SMTP in Settings",
    };
  }

  let transporter: Transporter;
  try {
    transporter = buildCustomTransporter(user);
  } catch (err) {
    console.error(`[mailer] decrypt smtpPass failed for user=${userId}`, err);
    return {
      success: false,
      error:
        "Не вдалося розшифрувати SMTP пароль. Заново збережіть налаштування у /settings.",
    };
  }

  const displayName = user.fromName?.trim();
  try {
    const info = await transporter.sendMail({
      from: displayName
        ? `"${escapeFromName(displayName)}" <${user.fromEmail}>`
        : user.fromEmail,
      to,
      subject,
      text: finalText,
      html: finalHtml,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const error =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[mailer] custom sendMail failed for user=${userId}`, err);
    return { success: false, error };
  } finally {
    transporter.close();
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

/**
 * Прибирає лапки/керівні символи з display name, щоб не зламати RFC-5322
 * mailbox-формат "Name" <email@host>.
 */
function escapeFromName(name: string): string {
  return name.replace(/["\\\r\n]/g, "").trim();
}
