import type { MetadataRoute } from "next";
import { routing } from "@/src/i18n/routing";
import {
  findRouteGroup,
  isMarketingLocale,
  type MarketingLocale,
} from "@/src/lib/seo/localizedPaths";
import {
  LOCALIZED_SITEMAP_PATHNAMES,
  SITEMAP_PATHNAMES,
} from "@/src/lib/seo/publicPaths";
import { getEnvSiteHref } from "@/src/lib/siteOrigin";

const PRIORITY: Record<string, number> = {
  "/": 1,
  "/pricing": 0.9,
  "/solutions/web-agencies": 0.85,
  "/solutions/agencje-webowe": 0.85,
};

const CHANGE_FREQ: Record<string, MetadataRoute.Sitemap[0]["changeFrequency"]> =
  {
    "/": "weekly",
    "/pricing": "monthly",
    "/solutions/web-agencies": "monthly",
    "/solutions/agencje-webowe": "monthly",
  };

function fullUrl(base: string, locale: MarketingLocale, path: string): string {
  if (path === "/") return `${base}/${locale}`;
  return `${base}/${locale}${path}`;
}

/**
 * Build hreflang alternates for a localized URL. Uses the central route-group
 * registry, so we never emit a hreflang pointing at a 404 (e.g. it does not
 * emit /uk/find-web-design-clients — that slug does not exist; instead it
 * emits /uk/yak-znajty-klientiv-na-sajty).
 *
 * For single-locale pages (no siblings in other locales) returns only the
 * current locale entry.
 */
function alternatesFor(
  base: string,
  locale: MarketingLocale,
  path: string,
): MetadataRoute.Sitemap[0]["alternates"] {
  const group = findRouteGroup(locale, path);
  const languages: Record<string, string> = {};

  if (group) {
    for (const loc of routing.locales) {
      languages[loc] = fullUrl(base, loc, group[loc]);
    }
    languages["x-default"] = fullUrl(base, "en", group.en);
  } else {
    languages[locale] = fullUrl(base, locale, path);
    languages["x-default"] = fullUrl(base, locale, path);
  }

  return { languages };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getEnvSiteHref().replace(/\/$/, "");
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // Shared routes (same slug across locales) — emit one entry per locale,
  // each with full hreflang to all locale siblings.
  for (const locale of routing.locales) {
    if (!isMarketingLocale(locale)) continue;
    for (const pathname of SITEMAP_PATHNAMES) {
      entries.push({
        url: fullUrl(base, locale, pathname),
        lastModified: now,
        changeFrequency: CHANGE_FREQ[pathname] ?? "monthly",
        priority: PRIORITY[pathname] ?? 0.8,
        alternates: alternatesFor(base, locale, pathname),
      });
    }
  }

  // Locale-specific routes — emit each, with hreflang resolved from the
  // central route-group registry (no broken alternates).
  for (const { locale, pathname } of LOCALIZED_SITEMAP_PATHNAMES) {
    if (!isMarketingLocale(locale)) continue;
    entries.push({
      url: fullUrl(base, locale, pathname),
      lastModified: now,
      changeFrequency: CHANGE_FREQ[pathname] ?? "monthly",
      priority: PRIORITY[pathname] ?? 0.75,
      alternates: alternatesFor(base, locale, pathname),
    });
  }

  return entries;
}
