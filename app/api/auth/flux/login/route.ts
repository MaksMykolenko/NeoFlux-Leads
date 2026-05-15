import { NextResponse, type NextRequest } from "next/server";
import {
  buildAuthorizeUrl,
  generateState,
  getFluxConfig,
  signState,
} from "@/src/lib/fluxAuth";
import { hasLocale } from "next-intl";
import { routing } from "@/src/i18n/routing";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "neoflux_oauth_state";
const LOCALE_COOKIE = "neoflux_oauth_locale";
const STATE_TTL_SECONDS = 60 * 5;

export async function GET(req: NextRequest) {
  const status = getFluxConfig();
  if (!status.ok) {
    return NextResponse.json(
      {
        error: "flux_not_configured",
        missing: status.missing,
        message:
          "Flux ID не налаштований. Заповніть змінні середовища FLUX_* у .env.",
      },
      { status: 503 },
    );
  }

  const requestedLocale = req.nextUrl.searchParams.get("locale");
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  const state = generateState();
  const signed = signState(state, status.config.oauthStateSecret);
  const authorizeUrl = buildAuthorizeUrl(status.config, state);

  const response = NextResponse.redirect(authorizeUrl, 302);
  response.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/flux",
    maxAge: STATE_TTL_SECONDS,
  });
  response.cookies.set(STATE_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/flux",
    maxAge: STATE_TTL_SECONDS,
  });
  return response;
}
