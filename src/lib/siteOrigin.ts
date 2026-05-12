import type { NextRequest } from "next/server";

/**
 * Env keys, з яких ми готові читати канонічний site URL — пріоритет зверху вниз:
 *   1. NEXT_PUBLIC_SITE_URL — основна змінна; рекомендоване ім'я.
 *   2. APP_URL — легасі-аліас.
 *   3. NEXT_PUBLIC_BASE_URL — історично жила тільки для Stripe (success_url),
 *      але семантично = SITE_URL. Беремо як fallback, щоб юзери, які заповнили
 *      лише її, не отримували localhost-посилань у листах і OG-метаданих.
 */
const SITE_ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "APP_URL",
  "NEXT_PUBLIC_BASE_URL",
] as const;

/** Перший непорожній валідний URL з env-чейну, або null. */
function envSiteHref(): string | null {
  for (const key of SITE_ENV_KEYS) {
    const raw = process.env[key]?.trim();
    if (raw) {
      try {
        return new URL(raw).origin;
      } catch {
        // невалідний URL — пробуємо наступний ключ
      }
    }
  }
  return null;
}

/**
 * Чистий env-резолвер — для контекстів без `NextRequest` (мейлер, OG-метадата).
 * Має додатковий fallback на `VERCEL_URL` (автоматично виставляється білдом
 * Vercel) і, в останню чергу, на `http://localhost:3000` для dev.
 *
 * Якщо ти бачиш "http://localhost:3000" у листі або OG-теґах прода — це означає,
 * що жодна з SITE_ENV_KEYS не заповнена.
 */
export function getEnvSiteHref(): string {
  const fromEnv = envSiteHref();
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * Public origin (scheme + host) for absolute redirects from Route Handlers
 * (OAuth callback, logout). Avoids sending users to *.vercel.app or an
 * internal host when `req.url` does not reflect the custom domain.
 *
 * Відрізняється від `getEnvSiteHref()` тим, що при відсутньому env-валюї
 * не падає у `VERCEL_URL` (може бути технічний preview-домен), а читає
 * `x-forwarded-*` заголовки — це реальний домен, на який юзер прийшов.
 */
export function getPublicAppOrigin(req: NextRequest): string {
  const fromEnv = envSiteHref();
  if (fromEnv) return fromEnv;

  const forwardedProto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
  const forwardedHost =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    req.headers.get("host")?.trim();

  if (forwardedHost) {
    const https = forwardedProto !== "http";
    return `${https ? "https" : "http"}://${forwardedHost}`;
  }

  try {
    return new URL(req.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}
