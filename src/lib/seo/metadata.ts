import type { Metadata } from "next";
import { routing } from "@/src/i18n/routing";
import { getEnvSiteHref } from "@/src/lib/siteOrigin";

export function resolveMetadataBase(): URL {
  return new URL(getEnvSiteHref());
}

type Locale = (typeof routing.locales)[number];

export function localeAlternates(
  pathname: string,
  locale: string,
): NonNullable<Metadata["alternates"]> {
  const path = pathname === "/" ? "" : pathname;
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `/${loc}${path}`;
  }
  return {
    canonical: `/${locale}${path}`,
    languages,
  };
}

export function buildPageMetadata({
  locale,
  pathname,
  title,
  description,
  ogImagePath = "/og/default.png",
}: {
  locale: string;
  pathname: string;
  title: string;
  description: string;
  ogImagePath?: string;
}): Metadata {
  const path = pathname === "/" ? "" : pathname;
  const pagePath = `/${locale}${path}`;

  return {
    title,
    description,
    alternates: localeAlternates(pathname, locale),
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "uk_UA",
      url: pagePath,
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
