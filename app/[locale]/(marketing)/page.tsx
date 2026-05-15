import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/src/i18n/navigation";
import FluxLeadsJsonLd from "@/src/components/seo/FluxLeadsJsonLd";
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
  const t = await getTranslations("MarketingHome");
  const loc = locale === "en" ? "en" : "uk";
  const canonicalUrl = `${getEnvSiteHref().replace(/\/$/, "")}/${loc}`;

  return (
    <>
      <FluxLeadsJsonLd locale={loc} canonicalUrl={canonicalUrl} />

      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24 lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[#6a00ff]">
              NeoFlux Software
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t("heroH1")}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-400">
              {t("heroSub")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-lg bg-[#6a00ff] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#5a00d9]"
              >
                {t("heroCta")}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center rounded-lg border border-white/15 px-6 text-sm font-semibold text-white transition-colors hover:border-[#6a00ff]/50 hover:text-white"
              >
                {t("heroSecondary")}
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="rounded-2xl border border-white/10 bg-[#13141c] p-8">
              <Image
                src="/logo-mark.svg"
                alt={t("heroImageAlt")}
                width={280}
                height={280}
                priority
                className="h-auto w-full max-w-[280px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-b border-white/10 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            {t("featuresH2")}
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            <FeatureCard title={t("featureSearchH3")} body={t("featureSearchP")} />
            <FeatureCard title={t("featureAuditH3")} body={t("featureAuditP")} />
            <FeatureCard title={t("featureScoreH3")} body={t("featureScoreP")} />
            <FeatureCard title={t("featureCrmH3")} body={t("featureCrmP")} />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white">{t("faqH2")}</h2>
          <dl className="mt-8 space-y-6">
            <FaqItem q={t("faq1Q")} a={t("faq1A")} />
            <FaqItem q={t("faq2Q")} a={t("faq2A")} />
            <FaqItem q={t("faq3Q")} a={t("faq3A")} />
          </dl>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">{t("ctaH2")}</h2>
          <p className="mt-4 text-zinc-400">{t("ctaP")}</p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-11 items-center rounded-lg bg-[#6a00ff] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#5a00d9]"
          >
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#13141c] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{body}</p>
    </article>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <dt className="font-semibold text-white">{q}</dt>
      <dd className="mt-2 text-sm leading-relaxed text-zinc-400">{a}</dd>
    </div>
  );
}
