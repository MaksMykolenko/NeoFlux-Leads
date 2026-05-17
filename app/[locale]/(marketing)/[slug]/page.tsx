import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import {
  getHreflangMap,
  isMarketingLocale,
} from "@/src/lib/seo/localizedPaths";
import { buildPageMetadata } from "@/src/lib/seo/metadata";
import {
  getStaticMarketingPage,
  getStaticMarketingParams,
} from "@/src/lib/marketing/staticPages";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return getStaticMarketingParams();
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getStaticMarketingPage(locale, slug);
  if (!page) return {};

  const pathname = `/${slug}`;
  const hreflangMap = isMarketingLocale(locale)
    ? getHreflangMap(locale, pathname)
    : undefined;

  return buildPageMetadata({
    locale,
    pathname,
    title: page.title,
    description: page.description,
    ogImagePath: "/logo-mark.svg",
    hreflangMap,
  });
}

export default async function StaticMarketingPage({
  params,
}: {
  params: Params;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const page = getStaticMarketingPage(locale, slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-[#b580ff]">
        {page.eyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-white text-balance sm:text-5xl">
        {page.h1}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-zinc-400">
        {page.intro}
      </p>

      <div className="mt-12 space-y-5">
        {page.sections.map((section) => (
          <section
            key={section.title}
            className="rounded-lg border border-white/10 bg-[#11121a] p-6"
          >
            <h2 className="text-xl font-semibold text-white">
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      {page.cta && (
        <Link
          href="/login"
          className="mt-10 inline-flex h-11 items-center rounded-lg bg-[#6a00ff] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#5a00d9]"
        >
          {page.cta}
        </Link>
      )}
    </article>
  );
}
