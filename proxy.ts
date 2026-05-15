import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./src/i18n/routing";
import { isPublicPathname, stripLocalePrefix } from "./src/lib/seo/publicPaths";
import { SESSION_COOKIE } from "./src/lib/session";

const handleI18n = createIntlMiddleware(routing);

function isLoginPath(stripped: string): boolean {
  return stripped === "/login" || stripped.startsWith("/login?");
}

export default function proxy(request: NextRequest) {
  const response = handleI18n(request);

  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  const pathname = request.nextUrl.pathname;
  const stripped = stripLocalePrefix(pathname);
  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;

  if (isPublicPathname(stripped) || isLoginPath(stripped)) {
    return response;
  }

  if (!hasSession) {
    const locale =
      routing.locales.find(
        (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
      ) ?? routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.search = request.nextUrl.search;
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
