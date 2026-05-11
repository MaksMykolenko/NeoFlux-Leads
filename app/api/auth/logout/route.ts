import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  buildClearedSessionCookie,
  destroySessionByToken,
} from "@/src/lib/session";
import { routing } from "@/src/i18n/routing";
import { getPublicAppOrigin } from "@/src/lib/siteOrigin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await destroySessionByToken(token);
    } catch (err) {
      console.error("[logout]", err);
    }
  }

  const login = new URL(`/${routing.defaultLocale}/login`, getPublicAppOrigin(req));
  const response = NextResponse.redirect(login, 303);
  response.cookies.set(buildClearedSessionCookie());
  return response;
}
