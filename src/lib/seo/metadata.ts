import type { Metadata } from "next";
import { routing } from "@/src/i18n/routing";
import {
  getHreflangMap,
  isMarketingLocale,
  type MarketingLocale,
} from "@/src/lib/seo/localizedPaths";
import { getEnvSiteHref } from "@/src/lib/siteOrigin";

export function resolveMetadataBase(): URL {
  return new URL(getEnvSiteHref());
}

/**
 * Build the Next.js `alternates` block (canonical + hreflang languages +
 * x-default) for a page.
 *
 * If `hreflangMap` is provided it overrides the default same-slug-across-locales
 * behavior — required for SEO landings where each locale has its own slug. If
 * omitted (legacy callers), the function falls back to looking up the route in
 * the central `localizedPaths` registry; for unregistered routes the same path
 * is used across all locales.
 */
export function localeAlternates(
  pathname: string,
  locale: string,
  hreflangMap?: Partial<Record<MarketingLocale, string>>,
): NonNullable<Metadata["alternates"]> {
  const map = (() => {
    if (hreflangMap && Object.keys(hreflangMap).length > 0) return hreflangMap;
    if (isMarketingLocale(locale)) {
      return getHreflangMap(locale, pathname);
    }
    // Unknown locale → use same slug for all configured locales.
    return Object.fromEntries(
      routing.locales.map((loc) => [loc, pathname]),
    ) as Partial<Record<MarketingLocale, string>>;
  })();

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    const path = map[loc];
    if (!path) continue;
    languages[loc] = path === "/" ? `/${loc}` : `/${loc}${path}`;
  }

  // x-default → English version if present, otherwise current locale.
  const xDefaultPath = map.en ?? map[locale as MarketingLocale] ?? pathname;
  languages["x-default"] =
    xDefaultPath === "/" ? "/en" : `/en${xDefaultPath}`;

  const canonicalPath = map[locale as MarketingLocale] ?? pathname;
  const canonical =
    canonicalPath === "/" ? `/${locale}` : `/${locale}${canonicalPath}`;

  return { canonical, languages };
}

export function buildPageMetadata({
  locale,
  pathname,
  title,
  description,
  ogImagePath = "/logo-mark.svg",
  hreflangMap,
}: {
  locale: string;
  pathname: string;
  title: string;
  description: string;
  ogImagePath?: string;
  hreflangMap?: Partial<Record<MarketingLocale, string>>;
}): Metadata {
  const alternates = localeAlternates(pathname, locale, hreflangMap);

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : locale === "pl" ? "pl_PL" : "uk_UA",
      url: alternates.canonical as string,
      siteName: "Flux Leads",
      title,
      description,
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImagePath],
    },
    robots: { index: true, follow: true },
  };
}
