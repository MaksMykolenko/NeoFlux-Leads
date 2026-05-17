import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import {
  isMarketingLocale,
  localizedHref,
  type MarketingLocale,
} from "@/src/lib/seo/localizedPaths";
import { marketingPageMetadata } from "@/src/lib/seo/pageMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return marketingPageMetadata("webAgencies", locale);
}

export default async function WebAgenciesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale === "pl") redirect("/pl/solutions/agencje-webowe");
  setRequestLocale(locale);
  const t = await getTranslations("WebAgencies");

  return <WebAgenciesContent t={t} locale={locale} />;
}

export function WebAgenciesContent({
  t,
  locale,
}: {
  t: (key: string) => string;
  locale: string;
}) {
  const loc: MarketingLocale = isMarketingLocale(locale) ? locale : "uk";
  // Use the EN slug as the canonical key — `localizedHref` will translate it
  // to the right locale-specific URL (or fall back to home for single-locale
  // pages like the EN-only audit tool).
  const hrefFindClients = localizedHref(
    "en",
    "/find-web-design-clients",
    loc,
  );
  const hrefLeadGen = localizedHref(
    "en",
    "/lead-generation-for-web-agencies",
    loc,
  );
  // Audit tool is EN-only — hide on UK/PL to avoid a "→ home" tease.
  const showAuditToolLink = loc === "en";
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {t("h1")}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-400">
          {t("intro")}
        </p>
      </header>

      <section aria-labelledby="pain">
        <h2
          id="pain"
          className="mt-14 text-2xl font-bold text-white"
        >
          {t("h2Pain")}
        </h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-zinc-400">
          <li>{t("pain1")}</li>
          <li>{t("pain2")}</li>
          <li>{t("pain3")}</li>
        </ul>
      </section>

      <section aria-labelledby="how">
        <h2
          id="how"
          className="mt-14 text-2xl font-bold text-white"
        >
          {t("h2How")}
        </h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-zinc-400">
          <li>{t("step1")}</li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
          <li>{t("step4")}</li>
          <li>{t("step5")}</li>
        </ol>
      </section>

      <section aria-labelledby="example">
        <h2
          id="example"
          className="mt-14 text-2xl font-bold text-white"
        >
          {t("h2Example")}
        </h2>
        <p className="mt-4 leading-relaxed text-zinc-400">{t("exampleBody")}</p>
      </section>

      <section aria-labelledby="manual">
        <h2
          id="manual"
          className="mt-14 text-2xl font-bold text-white"
        >
          {t("h2Manual")}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Manual
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {t("manualTime")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {t("manualTimeBody")}
            </p>
          </div>
          <div className="rounded-xl border border-flux-purple/40 bg-flux-purple/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-flux-purple-soft">
              Flux Leads
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {t("fluxTime")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {t("fluxTimeBody")}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="who-for">
        <h2
          id="who-for"
          className="mt-14 text-2xl font-bold text-white"
        >
          {t("h2WhoFor")}
        </h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-zinc-400">
          <li>{t("whoFor1")}</li>
          <li>{t("whoFor2")}</li>
          <li>{t("whoFor3")}</li>
          <li>{t("whoFor4")}</li>
        </ul>
      </section>

      <section aria-labelledby="issues">
        <h2
          id="issues"
          className="mt-14 text-2xl font-bold text-white"
        >
          {t("h2Issues")}
        </h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-zinc-400">
          <li>{t("issue1")}</li>
          <li>{t("issue2")}</li>
          <li>{t("issue3")}</li>
          <li>{t("issue4")}</li>
          <li>{t("issue5")}</li>
          <li>{t("issue6")}</li>
          <li>{t("issue7")}</li>
        </ul>
      </section>

      <section aria-labelledby="before-after">
        <h2
          id="before-after"
          className="mt-14 text-2xl font-bold text-white"
        >
          {t("h2BeforeAfter")}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("beforeTitle")}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {t("beforeBody")}
            </p>
          </div>
          <div className="rounded-xl border border-flux-purple/40 bg-flux-purple/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-flux-purple-soft">
              {t("afterTitle")}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
              {t("afterBody")}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq">
        <h2
          id="faq"
          className="mt-14 text-2xl font-bold text-white"
        >
          {t("h2Faq")}
        </h2>
        <dl className="mt-4 space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <dt className="text-base font-semibold text-white">
                {t(`faqQ${i}`)}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-zinc-400">
                {t(`faqA${i}`)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16 rounded-2xl border border-flux-purple/30 bg-flux-purple/10 p-8 text-center">
        <h2 className="text-2xl font-bold text-white">{t("ctaTitle")}</h2>
        <p className="mt-3 text-sm text-zinc-300">{t("ctaBody")}</p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-flux-purple px-8 text-sm font-semibold text-white transition-colors hover:bg-flux-purple-hover"
        >
          {t("cta")}
        </Link>
      </section>

      <nav
        aria-label={t("relatedHeading")}
        className="mt-16 border-t border-zinc-800 pt-8"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("relatedHeading")}
        </p>
        <ul className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
          <li>
            <Link
              href="/pricing"
              className="hover:text-flux-purple-soft hover:underline"
            >
              {t("relatedPricing")}
            </Link>
          </li>
          <li>
            <Link
              href={hrefFindClients}
              className="hover:text-flux-purple-soft hover:underline"
            >
              {t("relatedFindClients")}
            </Link>
          </li>
          <li>
            <Link
              href={hrefLeadGen}
              className="hover:text-flux-purple-soft hover:underline"
            >
              {t("relatedLeadGen")}
            </Link>
          </li>
          {showAuditToolLink && (
            <li>
              <Link
                href="/local-business-website-audit-tool"
                className="hover:text-flux-purple-soft hover:underline"
              >
                {t("relatedAuditTool")}
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </article>
  );
}
