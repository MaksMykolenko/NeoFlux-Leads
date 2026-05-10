import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Конфіг для Flux ID OAuth 2.0 (Authorization Code flow).
 *
 * Flux ID — це власний identity provider в екосистемі Flux. Він виставляє
 * стандартні OAuth ендпойнти: /oauth/authorize.php, /oauth/token.php,
 * /oauth/userinfo.php. Клієнт реєструється через
 * `php oauth/register_client.php "<name>" "<redirect_uri>"`.
 */
export type FluxConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  /** Підпис стейт-cookie. Має бути ≥ 32 байт ентропії. */
  oauthStateSecret: string;
};

export type FluxConfigStatus =
  | { ok: true; config: FluxConfig }
  | { ok: false; missing: string[] };

const REQUIRED_VARS = [
  "FLUX_ID_BASE_URL",
  "FLUX_CLIENT_ID",
  "FLUX_CLIENT_SECRET",
  "FLUX_REDIRECT_URI",
  "FLUX_OAUTH_STATE_SECRET",
] as const;

export function getFluxConfig(): FluxConfigStatus {
  const missing: string[] = [];
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]?.trim()) missing.push(key);
  }
  if (missing.length > 0) return { ok: false, missing };

  return {
    ok: true,
    config: {
      baseUrl: process.env.FLUX_ID_BASE_URL!.replace(/\/+$/, ""),
      clientId: process.env.FLUX_CLIENT_ID!,
      clientSecret: process.env.FLUX_CLIENT_SECRET!,
      redirectUri: process.env.FLUX_REDIRECT_URI!,
      oauthStateSecret: process.env.FLUX_OAUTH_STATE_SECRET!,
    },
  };
}

/** Bytes → URL-safe base64 без padding. */
function base64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateState(): string {
  return base64Url(randomBytes(24));
}

/**
 * Підписує state HMAC-SHA256 секретом сервера. Cookie зберігає `state.signature`,
 * а query-string при редиректі — лише `state`. Це не дає зловмиснику підставити
 * чужий state, бо в нього нема секрету для підпису.
 */
export function signState(state: string, secret: string): string {
  const sig = createHmac("sha256", secret).update(state).digest();
  return `${state}.${base64Url(sig)}`;
}

export function verifyState(signed: string, expected: string, secret: string): boolean {
  if (!signed.includes(".")) return false;
  const [state, sigB64] = signed.split(".", 2);
  if (state !== expected) return false;
  const expectedSig = createHmac("sha256", secret).update(state).digest();
  let providedSig: Buffer;
  try {
    const padded = sigB64.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (padded.length % 4)) % 4;
    providedSig = Buffer.from(padded + "=".repeat(padLen), "base64");
  } catch {
    return false;
  }
  if (providedSig.length !== expectedSig.length) return false;
  return timingSafeEqual(providedSig, expectedSig);
}

export function buildAuthorizeUrl(config: FluxConfig, state: string, scope = "profile email"): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope,
    state,
  });
  return `${config.baseUrl}/oauth/authorize.php?${params.toString()}`;
}

export type FluxTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

export async function exchangeCodeForToken(
  config: FluxConfig,
  code: string,
): Promise<FluxTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const res = await fetch(`${config.baseUrl}/oauth/token.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || typeof json !== "object" || !("access_token" in json)) {
    const description =
      json && typeof json === "object" && "error_description" in json
        ? String((json as Record<string, unknown>).error_description)
        : `HTTP ${res.status}`;
    throw new Error(`Flux ID token exchange failed: ${description}`);
  }
  return json as FluxTokenResponse;
}

/**
 * userinfo повертає `sub` (int), `username`, `display_name`, `avatar`, `email`,
 * `role`, `account_type` — залежно від granted scope.
 */
export type FluxUserInfo = {
  sub: number;
  username?: string;
  display_name?: string | null;
  avatar?: string | null;
  email?: string | null;
  role?: string;
  account_type?: string;
};

export async function fetchUserInfo(
  config: FluxConfig,
  accessToken: string,
): Promise<FluxUserInfo> {
  const res = await fetch(`${config.baseUrl}/oauth/userinfo.php`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || typeof json !== "object" || !("sub" in json)) {
    throw new Error(`Flux ID userinfo failed: HTTP ${res.status}`);
  }
  return json as FluxUserInfo;
}
