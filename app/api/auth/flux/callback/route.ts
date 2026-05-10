import { NextResponse, type NextRequest } from "next/server";
import {
  exchangeCodeForToken,
  fetchUserInfo,
  getFluxConfig,
  verifyState,
} from "@/src/lib/fluxAuth";
import { prisma } from "@/src/lib/prisma";
import { buildSessionCookie, createSession } from "@/src/lib/session";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "neoflux_oauth_state";

function errorRedirect(req: NextRequest, code: string, detail?: string): NextResponse {
  const url = new URL("/login", req.url);
  url.searchParams.set("auth_error", code);
  if (detail) url.searchParams.set("auth_error_detail", detail);
  const res = NextResponse.redirect(url, 302);
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/flux" });
  return res;
}

export async function GET(req: NextRequest) {
  const status = getFluxConfig();
  if (!status.ok) {
    return errorRedirect(req, "not_configured", status.missing.join(","));
  }
  const config = status.config;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return errorRedirect(req, oauthError, url.searchParams.get("error_description") ?? undefined);
  }
  if (!code || !state) {
    return errorRedirect(req, "missing_code_or_state");
  }

  const signedStateCookie = req.cookies.get(STATE_COOKIE)?.value ?? "";
  if (!signedStateCookie || !verifyState(signedStateCookie, state, config.oauthStateSecret)) {
    return errorRedirect(req, "state_mismatch");
  }

  let token;
  try {
    token = await exchangeCodeForToken(config, code);
  } catch (err) {
    console.error("[flux callback] token exchange", err);
    return errorRedirect(req, "token_exchange_failed");
  }

  let userInfo;
  try {
    userInfo = await fetchUserInfo(config, token.access_token);
  } catch (err) {
    console.error("[flux callback] userinfo", err);
    return errorRedirect(req, "userinfo_failed");
  }

  const fluxUserId = Number(userInfo.sub);
  if (!Number.isFinite(fluxUserId) || fluxUserId <= 0) {
    return errorRedirect(req, "invalid_subject");
  }

  let user;
  try {
    user = await prisma.user.upsert({
      where: { fluxUserId },
      create: {
        fluxUserId,
        email: userInfo.email ?? null,
        username: userInfo.username ?? null,
        displayName: userInfo.display_name ?? null,
        avatarUrl: userInfo.avatar ?? null,
        role: userInfo.role ?? "user",
        accountType: userInfo.account_type ?? null,
      },
      update: {
        email: userInfo.email ?? null,
        username: userInfo.username ?? null,
        displayName: userInfo.display_name ?? null,
        avatarUrl: userInfo.avatar ?? null,
        role: userInfo.role ?? "user",
        accountType: userInfo.account_type ?? null,
      },
    });
  } catch (err) {
    console.error("[flux callback] user upsert", err);
    return errorRedirect(req, "db_failure");
  }

  const userAgent = req.headers.get("user-agent");
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip");

  const { token: sessionToken } = await createSession({
    userId: user.id,
    userAgent,
    ip,
  });

  const home = new URL("/", req.url);
  const response = NextResponse.redirect(home, 302);

  const cookie = buildSessionCookie(sessionToken);
  response.cookies.set(cookie);
  response.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/flux" });

  return response;
}
