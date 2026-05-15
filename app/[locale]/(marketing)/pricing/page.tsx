import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import PricingSection from "@/src/components/marketing/PricingSection";
import { marketingPageMetadata } from "@/src/lib/seo/pageMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return marketingPageMetadata("pricing", locale);
}

export default async function MarketingPricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <PricingSection locale={locale} />
    </div>
  );
}
