import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import FluxLeadsJsonLd from "@/src/components/seo/FluxLeadsJsonLd";
import MarketingHomeContent from "@/src/components/marketing/MarketingHomeContent";
import { marketingPageMetadata } from "@/src/lib/seo/pageMetadata";
import { getEnvSiteHref } from "@/src/lib/siteOrigin";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return marketingPageMetadata("home", locale);
}

export default async function MarketingHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale === "en" || locale === "pl" ? locale : "uk";
  const canonicalUrl = `${getEnvSiteHref().replace(/\/$/, "")}/${loc}`;

  return (
    <>
      <FluxLeadsJsonLd locale={loc} canonicalUrl={canonicalUrl} />
      <MarketingHomeContent />
    </>
  );
}
