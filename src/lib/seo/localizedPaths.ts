import { routing } from "@/src/i18n/routing";

export type MarketingLocale = (typeof routing.locales)[number];

/**
 * Central mapping of marketing routes that have **different slugs per locale**
 * AND routes that share the same slug across locales. Each row represents one
 * logical page; the values are the path AFTER the locale prefix (with leading
 * "/"). LanguageSwitcher, hreflang generator, and sitemap all consume this.
 *
 * If you add a new SEO landing in one locale only, put it in
 * `SINGLE_LOCALE_ROUTES` instead — the language switcher will then fall back
 * to home for the missing locales (rather than producing a 404).
 */
export const ROUTE_GROUPS: ReadonlyArray<Record<MarketingLocale, string>> = [
  // Shared paths — same slug across locales
  { en: "/", uk: "/", pl: "/" },
  { en: "/pricing", uk: "/pricing", pl: "/pricing" },
  { en: "/privacy", uk: "/privacy", pl: "/privacy" },
  { en: "/terms", uk: "/terms", pl: "/terms" },
  { en: "/cookies", uk: "/cookies", pl: "/cookies" },
  { en: "/acceptable-use", uk: "/acceptable-use", pl: "/acceptable-use" },
  { en: "/login", uk: "/login", pl: "/login" },

  // Solutions — PL has its own slug
  {
    en: "/solutions/web-agencies",
    uk: "/solutions/web-agencies",
    pl: "/solutions/agencje-webowe",
  },

  // SEO landing: "find web design clients"
  {
    en: "/find-web-design-clients",
    uk: "/yak-znajty-klientiv-na-sajty",
    pl: "/jak-znalezc-klientow-na-strony-internetowe",
  },

  // SEO landing: "lead generation for web agencies"
  {
    en: "/lead-generation-for-web-agencies",
    uk: "/lidogeneratsiya-dlya-veb-studiy",
    pl: "/pozyskiwanie-klientow-dla-agencji-webowych",
  },
] as const;

/**
 * Pages that exist only in one locale. The language switcher routes other
 * locales to home (not to a 404). hreflang for these pages includes only the
 * locale they exist in, so search engines don't follow dead alternates.
 */
export const SINGLE_LOCALE_ROUTES: Record<MarketingLocale, readonly string[]> =
  {
    en: ["/local-business-website-audit-tool", "/cold-email-for-web-agencies"],
    uk: [],
    pl: [],
  } as const;

function normalize(path: string): string {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.replace(/\/+$/, "");
}

/**
 * Find the route group that contains `path` for the given `locale`.
 * Returns null if the path is not registered.
 */
export function findRouteGroup(
  locale: MarketingLocale,
  path: string,
): Record<MarketingLocale, string> | null {
  const target = normalize(path);
  for (const group of ROUTE_GROUPS) {
    if (group[locale] === target) return { ...group };
  }
  return null;
}

/**
 * Localized URL for the same logical page in `target` locale.
 * Handles three cases:
 *   - shared slug (e.g. /pricing) → returns same path with new locale
 *   - localized slug (e.g. /find-web-design-clients ↔ /yak-znajty-klientiv-na-sajty)
 *   - single-locale page → returns "/" (home) in the target locale, so the
 *     switcher never produces a 404.
 */
export function localizedHref(
  currentLocale: MarketingLocale,
  currentPath: string,
  targetLocale: MarketingLocale,
): string {
  const path = normalize(currentPath);
  const group = findRouteGroup(currentLocale, path);
  if (group) return group[targetLocale];

  if (SINGLE_LOCALE_ROUTES[currentLocale]?.includes(path)) {
    return targetLocale === currentLocale ? path : "/";
  }

  return path;
}

/**
 * Hreflang map for a page at `path` in `locale`. The result is suitable for
 * Next.js Metadata `alternates.languages`.
 *
 * - Routes with siblings in all locales → full 3-locale map.
 * - Single-locale routes → returns only the current locale.
 */
export function getHreflangMap(
  locale: MarketingLocale,
  path: string,
): Partial<Record<MarketingLocale, string>> {
  const group = findRouteGroup(locale, path);
  if (group) {
    return { ...group };
  }
  return { [locale]: normalize(path) };
}

/**
 * x-default URL — points to the English version when available, otherwise the
 * current locale. Used by metadata + sitemap.
 */
export function getXDefaultHref(
  locale: MarketingLocale,
  path: string,
): string {
  const group = findRouteGroup(locale, path);
  if (group) return group.en;
  return normalize(path);
}

export function isMarketingLocale(value: string): value is MarketingLocale {
  return (routing.locales as readonly string[]).includes(value);
}
