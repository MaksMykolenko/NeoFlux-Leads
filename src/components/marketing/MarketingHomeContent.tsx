import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";

export default async function MarketingHomeContent() {
  const t = await getTranslations("MarketingHome");
  const auditIssues = [
    t("exampleIssue1"),
    t("exampleIssue2"),
    t("exampleIssue3"),
    t("exampleIssue4"),
  ];
  const snapshots = [
    {
      title: t("workflowLeadSearchTitle"),
      body: t("workflowLeadSearchBody"),
      variant: "search" as const,
    },
    {
      title: t("workflowAuditTitle"),
      body: t("workflowAuditBody"),
      variant: "audit" as const,
    },
    {
      title: t("workflowEmailTitle"),
      body: t("workflowEmailBody"),
      variant: "email" as const,
    },
    {
      title: t("workflowCrmTitle"),
      body: t("workflowCrmBody"),
      variant: "crm" as const,
    },
  ];
  const scoreItems = [
    t("scoreItem1"),
    t("scoreItem2"),
    t("scoreItem3"),
    t("scoreItem4"),
    t("scoreItem5"),
    t("scoreItem6"),
  ];
  const builtFor = [
    t("builtFor1"),
    t("builtFor2"),
    t("builtFor3"),
    t("builtFor4"),
    t("builtFor5"),
  ];
  const notFor = [
    t("notFor1"),
    t("notFor2"),
    t("notFor3"),
    t("notFor4"),
  ];
  const trustItems = [
    t("trustItem1"),
    t("trustItem2"),
    t("trustItem3"),
    t("trustItem4"),
    t("trustItem5"),
  ];
  const faqs = [
    ["faq1Q", "faq1A"],
    ["faq2Q", "faq2A"],
    ["faq3Q", "faq3A"],
    ["faq4Q", "faq4A"],
    ["faq5Q", "faq5A"],
    ["faq6Q", "faq6A"],
    ["faq7Q", "faq7A"],
    ["faq8Q", "faq8A"],
    ["faq9Q", "faq9A"],
    ["faq10Q", "faq10A"],
    ["faq11Q", "faq11A"],
  ] as const;

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
            <div
              aria-label={t("heroImageAlt")}
              className="relative w-full max-w-[440px] overflow-hidden rounded-lg border border-white/10 bg-[#101118] shadow-2xl shadow-black/40"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo-mark.svg"
                    alt=""
                    width={28}
                    height={28}
                    priority
                    className="h-7 w-7"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {t("exampleBusiness")}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {t("exampleScoreLabel")} 78/100
                    </div>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  Qualified
                </span>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {t("exampleIssuesLabel")}
                  </div>
                  <div className="mt-4 space-y-2">
                    {auditIssues.slice(0, 3).map((issue) => (
                      <div
                        key={issue}
                        className="flex items-center gap-2 text-sm text-zinc-300"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#0b0c10] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {t("workflowEmailTitle")}
                    </span>
                    <span className="text-xs text-[#b580ff]">AI draft</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-3/4 rounded-full bg-white/20" />
                    <div className="h-2 w-full rounded-full bg-white/10" />
                    <div className="h-2 w-11/12 rounded-full bg-white/10" />
                    <div className="h-2 w-2/3 rounded-full bg-white/10" />
                  </div>
                </div>
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

      <section className="border-y border-white/5 bg-[#08080c] py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
              {t("exampleEyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
              {t("exampleH2")}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
              {t("exampleIntro")}
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#11121a] p-5 shadow-2xl shadow-black/30 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t("exampleBusinessLabel")}
                </div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {t("exampleBusiness")}
                </div>
              </div>
              <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-left sm:text-right">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                  {t("exampleScoreLabel")}
                </div>
                <div className="mt-1 text-3xl font-bold text-emerald-200">
                  78/100
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {t("exampleIssuesLabel")}
                </h3>
                <ul className="mt-4 space-y-3">
                  {auditIssues.map((issue) => (
                    <li key={issue} className="flex gap-3 text-sm text-zinc-300">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0b0c10] p-4">
                <h3 className="text-sm font-semibold text-white">
                  {t("exampleEmailLabel")}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                  {t("exampleEmail")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#b580ff]">
              {t("workflowEyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
              {t("workflowH2")}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {snapshots.map((snapshot) => (
              <ProductSnapshot
                key={snapshot.variant}
                title={snapshot.title}
                body={snapshot.body}
                variant={snapshot.variant}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#0d0e14] py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-300">
              {t("scoreEyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
              {t("scoreH2")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-400">
              {t("scoreIntro")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {scoreItems.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm font-medium text-zinc-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#b580ff]">
              {t("audienceEyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
              {t("audienceH2")}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Checklist title={t("builtForTitle")} items={builtFor} tone="positive" />
            <Checklist title={t("notForTitle")} items={notFor} tone="negative" />
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#08080c] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
              {t("emailCompareEyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
              {t("emailCompareH2")}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <EmailExample title={t("genericEmailTitle")} body={t("genericEmailBody")} muted />
            <EmailExample title={t("fluxEmailTitle")} body={t("fluxEmailBody")} />
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#b580ff]">
              {t("trustEyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
              {t("trustH2")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-400">
              {t("trustP")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-zinc-200"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#08080c] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
            {t("faqH2")}
          </h2>
          <dl className="mt-12 space-y-4">
            {faqs.map(([q, a]) => (
              <FaqItem key={q} q={t(q)} a={t(a)} />
            ))}
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
              className="mt-10 inline-flex h-12 items-center rounded-xl bg-[#6a00ff] px-8 text-sm font-bold text-white transition-colors hover:bg-[#5a00d9]"
            >
              {t("ctaButton")}
            </Link>
            <p className="mt-4 text-xs text-zinc-500">{t("ctaFluxId")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, body, icon }: { title: string; body: string; icon: ReactNode }) {
  return (
    <article className="group relative overflow-hidden rounded-lg border border-white/5 bg-[#13141c]/60 p-8 transition-colors hover:border-white/10 hover:bg-[#13141c]">
      <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#6a00ff] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[#b580ff]">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">{body}</p>
    </article>
  );
}

function ProductSnapshot({
  title,
  body,
  variant,
}: {
  title: string;
  body: string;
  variant: "search" | "audit" | "email" | "crm";
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#11121a] p-4">
      <MiniScreen variant={variant} />
      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
    </article>
  );
}

function MiniScreen({ variant }: { variant: "search" | "audit" | "email" | "crm" }) {
  if (variant === "search") {
    return (
      <div className="h-44 rounded-lg border border-white/10 bg-[#0b0c10] p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-white/10 px-3 py-2 text-xs text-zinc-400">dentists</div>
          <div className="rounded-md bg-white/10 px-3 py-2 text-xs text-zinc-400">Warsaw</div>
        </div>
        <div className="mt-4 space-y-2">
          {[82, 78, 64].map((score) => (
            <div key={score} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="h-2 w-24 rounded-full bg-white/20" />
              <span className="text-xs font-semibold text-emerald-300">{score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "audit") {
    return (
      <div className="h-44 rounded-lg border border-white/10 bg-[#0b0c10] p-3">
        <div className="mb-4 h-2 w-28 rounded-full bg-white/20" />
        <div className="grid grid-cols-2 gap-2">
          {["SSL", "Mobile", "SEO", "Perf"].map((item, index) => (
            <div key={item} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-zinc-500">{item}</div>
              <div className={`mt-3 h-2 rounded-full ${index === 0 ? "bg-emerald-300" : "bg-amber-300"}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "email") {
    return (
      <div className="h-44 rounded-lg border border-white/10 bg-[#0b0c10] p-3">
        <div className="rounded-md bg-[#6a00ff]/20 px-3 py-2 text-xs font-semibold text-[#d7c0ff]">
          Personalized draft
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 w-10/12 rounded-full bg-white/20" />
          <div className="h-2 w-full rounded-full bg-white/10" />
          <div className="h-2 w-11/12 rounded-full bg-white/10" />
          <div className="h-2 w-8/12 rounded-full bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-44 rounded-lg border border-white/10 bg-[#0b0c10] p-3">
      <div className="grid h-full grid-cols-3 gap-2">
        {["New", "Contacted", "Won"].map((stage, index) => (
          <div key={stage} className="rounded-md border border-white/10 bg-white/[0.03] p-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {stage}
            </div>
            <div className={`mt-3 h-12 rounded-md ${index === 2 ? "bg-emerald-300/20" : "bg-white/10"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Checklist({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  const dot = tone === "positive" ? "bg-emerald-300" : "bg-amber-300";
  return (
    <div className="rounded-lg border border-white/10 bg-[#11121a] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm text-zinc-300">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmailExample({
  title,
  body,
  muted = false,
}: {
  title: string;
  body: string;
  muted?: boolean;
}) {
  return (
    <article
      className={`rounded-lg border p-6 ${
        muted
          ? "border-white/10 bg-white/[0.02]"
          : "border-emerald-300/20 bg-emerald-300/[0.04]"
      }`}
    >
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-zinc-300">{body}</p>
    </article>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-white/5 bg-[#13141c]/40 p-6 transition-colors hover:border-white/10 hover:bg-[#13141c] sm:p-8">
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
