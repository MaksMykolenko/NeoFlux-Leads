import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "neoflux_session";
const LOGIN_PATH = "/login";

/**
 * Edge-level guard: visitors without a session cookie are sent to /login.
 *
 * We intentionally do NOT redirect /login → / when a cookie exists: the
 * cookie is only a hint here; validity is checked in `getCurrentUser()` via
 * Prisma. A stale or forged non-empty cookie would otherwise ping-pong with
 * `requireUser()` redirecting to /login (ERR_TOO_MANY_REDIRECTS).
 *
 * Logged-in users on /login are bounced to / by `app/login/page.tsx` after a
 * real session lookup.
 *
 * `/admin/*` gets the same cookie-presence gate here (so unauthenticated
 * traffic can't even reach the layout), and a real RBAC check runs in
 * `app/admin/layout.tsx` via `requireAdmin()`. The role lookup needs Prisma,
 * which can't run on the edge — so role enforcement is deliberately a
 * server-component concern.
 */
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = !!req.cookies.get(SESSION_COOKIE)?.value;

  if (!hasSession && pathname !== LOGIN_PATH) {
    const loginUrl = new URL(LOGIN_PATH, req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on every page except: API routes (auth flow handles itself),
    // Next.js internals, and the favicon.
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
};
