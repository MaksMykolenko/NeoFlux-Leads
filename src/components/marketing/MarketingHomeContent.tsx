import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";

export default async function MarketingHomeContent() {
  const t = await getTranslations("MarketingHome");

  return (
    <div className="bg-[#0a0a0f] text-white">
      <section className="relative overflow-hidden border-b border-white/5 pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-[#b580ff]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6a00ff]" />
              {t("heroBadge")}
            </div>
            <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                {t("heroH1")}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400 text-balance">
              {t("heroSub")}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex h-12 items-center rounded-xl bg-[#6a00ff] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#5a00d9]"
              >
                {t("heroCta")}
              </Link>
              <Link
                href="/#features"
                className="inline-flex h-12 items-center rounded-xl border border-white/10 bg-white/[0.02] px-8 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/5"
              >
                {t("heroSecondary")}
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[300px] rounded-3xl border border-white/10 bg-gradient-to-b from-[#13141c] to-[#0a0a0f] p-3">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-[#0b0c10]">
                <Image
                  src="/logo-mark.svg"
                  alt={t("heroImageAlt")}
                  width={200}
                  height={200}
                  priority
                  className="h-auto w-[55%] max-w-[200px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#b580ff]">
              {t("featuresEyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
              {t("featuresH2")}
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:gap-8">
            <FeatureCard title={t("featureSearchH3")} body={t("featureSearchP")} icon={<SearchIcon />} />
            <FeatureCard title={t("featureAuditH3")} body={t("featureAuditP")} icon={<AuditIcon />} />
            <FeatureCard title={t("featureScoreH3")} body={t("featureScoreP")} icon={<ScoreIcon />} />
            <FeatureCard title={t("featureCrmH3")} body={t("featureCrmP")} icon={<CrmIcon />} />
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-[#08080c] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
            {t("faqH2")}
          </h2>
          <dl className="mt-12 space-y-4">
            <FaqItem q={t("faq1Q")} a={t("faq1A")} />
            <FaqItem q={t("faq2Q")} a={t("faq2A")} />
            <FaqItem q={t("faq3Q")} a={t("faq3A")} />
          </dl>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-[#13141c] px-6 py-14 text-center sm:px-12 sm:py-20">
            <h2 className="text-3xl font-bold text-white text-balance sm:text-4xl">
              {t("ctaH2")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-400 text-balance">
              {t("ctaP")}
            </p>
            <Link
              href="/login"
              className="mt-10 inline-flex h-12 items-center rounded-xl bg-white px-8 text-sm font-bold text-[#0a0a0f] transition-colors hover:bg-zinc-200"
            >
              {t("ctaButton")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, body, icon }: { title: string; body: string; icon: ReactNode }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#13141c]/60 p-8 transition-colors hover:border-white/10 hover:bg-[#13141c]">
      <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#6a00ff] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#b580ff]">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">{body}</p>
    </article>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#13141c]/40 p-6 transition-colors hover:border-white/10 hover:bg-[#13141c] sm:p-8">
      <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-[#6a00ff] opacity-0 transition-opacity group-hover:opacity-100" />
      <dt className="text-lg font-semibold text-white">{q}</dt>
      <dd className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">{a}</dd>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}

function ScoreIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20v-6M6 20V10M18 20V4" />
    </svg>
  );
}

function CrmIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
