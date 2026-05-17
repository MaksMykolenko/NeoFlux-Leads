import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { marketingPageMetadata } from "@/src/lib/seo/pageMetadata";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {t("h1")}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-zinc-400">{t("intro")}</p>

      <h2 className="mt-14 text-2xl font-bold text-white">{t("h2Pain")}</h2>
      <ul className="mt-4 list-inside list-disc space-y-2 text-zinc-400">
        <li>{t("pain1")}</li>
        <li>{t("pain2")}</li>
        <li>{t("pain3")}</li>
      </ul>

      <h2 className="mt-14 text-2xl font-bold text-white">{t("h2How")}</h2>
      <ol className="mt-4 list-inside list-decimal space-y-2 text-zinc-400">
        <li>{t("step1")}</li>
        <li>{t("step2")}</li>
        <li>{t("step3")}</li>
        <li>{t("step4")}</li>
      </ol>

      <Link
        href="/login"
        className="mt-12 inline-flex h-11 items-center rounded-lg bg-[#6a00ff] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#5a00d9]"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
