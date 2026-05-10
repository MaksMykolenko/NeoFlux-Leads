import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  buildClearedSessionCookie,
  destroySessionByToken,
} from "@/src/lib/session";

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

  const home = new URL("/", req.url);
  const response = NextResponse.redirect(home, 303);
  response.cookies.set(buildClearedSessionCookie());
  return response;
}
