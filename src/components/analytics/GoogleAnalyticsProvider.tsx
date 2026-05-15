import { GoogleAnalytics } from "@next/third-parties/google";

/** Public GA4 measurement ID (safe to expose in the client bundle). */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-TYSXT9QGEC";

/**
 * GA4 via `@next/third-parties` — loads gtag with `next/script` (default
 * `afterInteractive`), without blocking LCP.
 */
export default function GoogleAnalyticsProvider() {
  if (!GA_MEASUREMENT_ID) return null;
  return <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
