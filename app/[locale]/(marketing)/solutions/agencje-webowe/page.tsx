import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { marketingPageMetadata } from "@/src/lib/seo/pageMetadata";
import { WebAgenciesContent } from "../web-agencies/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "pl") notFound();
  return marketingPageMetadata("webAgencies", locale);
}

export default async function PolishWebAgenciesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "pl") notFound();
  setRequestLocale(locale);
  const t = await getTranslations("WebAgencies");
  return <WebAgenciesContent t={t} locale={locale} />;
}
