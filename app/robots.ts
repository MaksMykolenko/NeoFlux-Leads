import type { MetadataRoute } from "next";
import { routing } from "@/src/i18n/routing";
import { getEnvSiteHref } from "@/src/lib/siteOrigin";

export default function robots(): MetadataRoute.Robots {
  const base = getEnvSiteHref().replace(/\/$/, "");

  const disallow = [
    "/api/",
    ...routing.locales.flatMap((loc) => [
      `/${loc}/dashboard`,
      `/${loc}/dashboard/`,
      `/${loc}/leads/`,
      `/${loc}/settings`,
      `/${loc}/settings/`,
      `/${loc}/admin`,
      `/${loc}/admin/`,
      `/${loc}/login`,
    ]),
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
