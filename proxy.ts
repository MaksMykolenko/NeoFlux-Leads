import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "neoflux_session";
const LOGIN_PATH = "/login";

/**
 * Edge-level guard: redirects unauthenticated visitors to /login and bounces
 * already-logged-in users away from /login back to home.
 *
 * This is a lightweight check — only the cookie's presence is verified here.
 * The DB-backed validity check happens inside server components via
 * `requireUser()` / `getCurrentUser()`. That two-layer approach keeps cold
 * navigation snappy while preventing forged cookies from rendering data.
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

  if (hasSession && pathname === LOGIN_PATH) {
    return NextResponse.redirect(new URL("/", req.url));
  }

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
