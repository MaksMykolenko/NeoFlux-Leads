import type { NextRequest } from "next/server";

/**
 * Public origin (scheme + host) for absolute redirects from Route Handlers
 * (OAuth callback, logout). Avoids sending users to *.vercel.app or an
 * internal host when `req.url` does not reflect the custom domain.
 */
export function getPublicAppOrigin(req: NextRequest): string {
  for (const key of ["NEXT_PUBLIC_SITE_URL", "APP_URL"] as const) {
    const raw = process.env[key]?.trim();
    if (raw) {
      try {
        return new URL(raw).origin;
      } catch {
        // ignore invalid URL
      }
    }
  }

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
