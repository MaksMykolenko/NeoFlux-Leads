import type { MetadataRoute } from "next";
import { routing } from "@/src/i18n/routing";
import {
  LOCALIZED_SITEMAP_PATHNAMES,
  SITEMAP_PATHNAMES,
} from "@/src/lib/seo/publicPaths";
import { getEnvSiteHref } from "@/src/lib/siteOrigin";

const PRIORITY: Record<string, number> = {
  "/": 1,
  "/pricing": 0.9,
  "/solutions/web-agencies": 0.85,
};

const CHANGE_FREQ: Record<string, MetadataRoute.Sitemap[0]["changeFrequency"]> =
  {
    "/": "weekly",
    "/pricing": "monthly",
    "/solutions/web-agencies": "monthly",
  };

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getEnvSiteHref().replace(/\/$/, "");
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const pathname of SITEMAP_PATHNAMES) {
      const path = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
      entries.push({
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: CHANGE_FREQ[pathname] ?? "monthly",
        priority: PRIORITY[pathname] ?? 0.8,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((loc) => [
              loc,
              `${base}${pathname === "/" ? `/${loc}` : `/${loc}${pathname}`}`,
            ]),
          ),
        },
      });
    }
  }

  for (const { locale, pathname } of LOCALIZED_SITEMAP_PATHNAMES) {
    entries.push({
      url: `${base}/${locale}${pathname}`,
      lastModified: now,
      changeFrequency: CHANGE_FREQ[pathname] ?? "monthly",
      priority: PRIORITY[pathname] ?? 0.75,
    });
  }

  return entries;
}
