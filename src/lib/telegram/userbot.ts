import "server-only";
import { cookies } from "next/headers";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { computeCheck } from "telegram/Password";
import { decrypt, encrypt } from "@/src/lib/crypto";

/**
 * Telegram MTProto userbot service (GramJS).
 *
 * Vercel-friendly стратегія: серверлес-функції живуть 10–60s, тому ми
 * НЕ тримаємо клієнт у пам'яті між запитами. Кожен виклик:
 *   1) створює client з відновленої StringSession
 *   2) connect()
 *   3) виконує операцію
 *   4) disconnect()
 *
 * 2-кроковий auth flow (sendCode → signIn) між двома HTTP-запитами:
 *   - між кроками GramJS клієнт мав би залишатися живим у пам'яті, але на
 *     serverless це не працює. Натомість після `sendCode` ми зберігаємо
 *     внутрішній sessionString клієнта в short-lived encrypted cookie
 *     `flux_tg_pending` (TTL 10 хв). На verify-кроці клієнт відновлюється
 *     з того cookie і робить signIn.
 *
 * Після успішного verifyAuthCode caller (server action) повинен:
 *   - зашифрувати фінальний sessionString і записати в TelegramSession.sessionKey
 *   - очистити будь-який старий запис цього юзера
 */

const PENDING_COOKIE = "flux_tg_pending";
const PENDING_TTL_SECONDS = 10 * 60;
const HUMAN_DELAY_MIN_MS = 2000;
const HUMAN_DELAY_MAX_MS = 5000;

export interface TelegramCreds {
  apiId: number;
  apiHash: string;
}

function buildClient(
  creds: TelegramCreds,
  sessionString: string,
): TelegramClient {
  return new TelegramClient(
    new StringSession(sessionString),
    creds.apiId,
    creds.apiHash,
    {
      connectionRetries: 3,
      useWSS: false,
      requestRetries: 2,
    },
  );
}

async function setPendingCookie(sessionString: string): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: PENDING_COOKIE,
    value: encrypt(sessionString),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_TTL_SECONDS,
  });
}

async function readPendingCookie(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    return decrypt(raw);
  } catch (err) {
    console.error("[telegram/userbot] failed to decrypt pending cookie", err);
    return null;
  }
}

async function clearPendingCookie(): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: PENDING_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function humanDelayMs(): number {
  const span = HUMAN_DELAY_MAX_MS - HUMAN_DELAY_MIN_MS;
  return HUMAN_DELAY_MIN_MS + Math.floor(Math.random() * (span + 1));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SendAuthCodeResult {
  success: boolean;
  phoneCodeHash?: string;
  isCodeViaApp?: boolean;
  error?: string;
}

/**
 * Крок 1 auth: ініціює видачу SMS/in-app коду на номер.
 * Returns phoneCodeHash, який треба передати у `verifyAuthCode`.
 */
export async function sendAuthCode(
  creds: TelegramCreds,
  phone: string,
): Promise<SendAuthCodeResult> {
  const cleaned = phone.trim();
  if (!cleaned) {
    return { success: false, error: "Phone number is required" };
  }

  let client: TelegramClient | null = null;
  try {
    client = buildClient(creds, "");
    await client.connect();

    const result = await client.sendCode(
      { apiId: creds.apiId, apiHash: creds.apiHash },
      cleaned,
    );

    const sessionString = client.session.save() as unknown as string;
    if (sessionString) {
      await setPendingCookie(sessionString);
    }

    return {
      success: true,
      phoneCodeHash: result.phoneCodeHash,
      isCodeViaApp: result.isCodeViaApp,
    };
  } catch (err) {
    console.error("[telegram/userbot] sendAuthCode failed", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "sendCode failed",
    };
  } finally {
    if (client) {
      try {
        await client.disconnect();
      } catch {
        /* ignore */
      }
    }
  }
}

export interface VerifyAuthCodeResult {
  success: boolean;
  sessionString?: string;
  needsPassword?: boolean;
  error?: string;
  errorCode?: "NO_PENDING" | "BAD_CODE" | "PASSWORD_REQUIRED" | "BAD_PASSWORD";
}

/**
 * Крок 2 auth: завершує вхід.
 * - Передайте `password`, якщо у юзера ввімкнено 2FA. Якщо 2FA треба, але
 *   `password` не передано — повертаємо `needsPassword: true`, щоб UI попросив.
 * - При успіху повертає фінальний `sessionString`, який caller шифрує і кладе
 *   в TelegramSession.sessionKey.
 */
export async function verifyAuthCode(
  creds: TelegramCreds,
  phone: string,
  phoneCodeHash: string,
  code: string,
  password?: string,
): Promise<VerifyAuthCodeResult> {
  const cleanedPhone = phone.trim();
  const cleanedCode = code.trim();
  if (!cleanedPhone || !phoneCodeHash || !cleanedCode) {
    return {
      success: false,
      error: "phone, phoneCodeHash and code are required",
    };
  }

  const pending = await readPendingCookie();
  if (!pending) {
    return {
      success: false,
      errorCode: "NO_PENDING",
      error:
        "Auth session expired or missing. Restart the flow with sendAuthCode().",
    };
  }

  let client: TelegramClient | null = null;
  try {
    client = buildClient(creds, pending);
    await client.connect();

    try {
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: cleanedPhone,
          phoneCodeHash,
          phoneCode: cleanedCode,
        }),
      );
    } catch (signInErr) {
      const msg = signInErr instanceof Error ? signInErr.message : String(signInErr);
      if (msg.includes("SESSION_PASSWORD_NEEDED")) {
        if (!password) {
          return {
            success: false,
            needsPassword: true,
            errorCode: "PASSWORD_REQUIRED",
            error: "Two-factor password required",
          };
        }
        try {
          const passwordInfo = await client.invoke(new Api.account.GetPassword());
          const passwordCheck = await computeCheck(passwordInfo, password);
          await client.invoke(
            new Api.auth.CheckPassword({ password: passwordCheck }),
          );
        } catch (pwErr) {
          console.error("[telegram/userbot] 2FA password check failed", pwErr);
          return {
            success: false,
            errorCode: "BAD_PASSWORD",
            error: pwErr instanceof Error ? pwErr.message : "Bad 2FA password",
          };
        }
      } else {
        console.error("[telegram/userbot] signIn failed", signInErr);
        return {
          success: false,
          errorCode: "BAD_CODE",
          error: msg,
        };
      }
    }

    const sessionString = client.session.save() as unknown as string;
    await clearPendingCookie();

    return { success: true, sessionString };
  } catch (err) {
    console.error("[telegram/userbot] verifyAuthCode failed", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "verifyAuthCode failed",
    };
  } finally {
    if (client) {
      try {
        await client.disconnect();
      } catch {
        /* ignore */
      }
    }
  }
}

export type SendTelegramMessageResult =
  | { success: true; messageId: number }
  | { success: false; error: string; code?: "FLOOD_WAIT" | "USERNAME_INVALID" | "OTHER" };

/**
 * Надсилає повідомлення на @username через MTProto userbot.
 *
 * - sessionString повинен бути уже розшифрованим (caller робить decrypt
 *   на TelegramSession.sessionKey перед викликом).
 * - username — без `@`, з ним або як invite hash; GramJS resolveу обидва.
 * - Перед фактичним send робимо рандомну затримку 2–5 с, щоб імітувати
 *   людську поведінку і знизити ризик FLOOD_WAIT / ban.
 */
export async function sendTelegramMessage(
  creds: TelegramCreds,
  sessionString: string,
  username: string,
  message: string,
): Promise<SendTelegramMessageResult> {
  const cleanedUser = username.trim().replace(/^@/, "");
  const cleanedMsg = message.trim();
  if (!sessionString) {
    return { success: false, error: "Missing sessionString", code: "OTHER" };
  }
  if (!cleanedUser) {
    return { success: false, error: "Empty username", code: "USERNAME_INVALID" };
  }
  if (!cleanedMsg) {
    return { success: false, error: "Empty message", code: "OTHER" };
  }

  let client: TelegramClient | null = null;
  try {
    client = buildClient(creds, sessionString);
    await client.connect();

    await sleep(humanDelayMs());

    const sent = await client.sendMessage(cleanedUser, { message: cleanedMsg });
    const messageId =
      typeof sent.id === "number" ? sent.id : Number(sent.id ?? 0);

    return { success: true, messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[telegram/userbot] sendMessage failed for @${cleanedUser}`, err);

    let code: "FLOOD_WAIT" | "USERNAME_INVALID" | "OTHER" = "OTHER";
    if (msg.includes("FLOOD_WAIT")) code = "FLOOD_WAIT";
    else if (
      msg.includes("USERNAME_INVALID") ||
      msg.includes("USERNAME_NOT_OCCUPIED")
    ) {
      code = "USERNAME_INVALID";
    }

    return { success: false, error: msg, code };
  } finally {
    if (client) {
      try {
        await client.disconnect();
      } catch {
        /* ignore */
      }
    }
  }
}
