"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/src/i18n/navigation";
import {
  localizedHref,
  isMarketingLocale,
  type MarketingLocale,
} from "@/src/lib/seo/localizedPaths";

/**
 * Компактний segmented control UK / EN / PL. Активний сегмент — pill з
 * фіолетовим текстом і білим фоном.
 *
 * Linkування з урахуванням локалізованих slug:
 *   /en/find-web-design-clients   →  /uk/yak-znajty-klientiv-na-sajty
 *   /en/find-web-design-clients   →  /pl/jak-znalezc-klientow-na-strony-internetowe
 *
 * Якщо поточний шлях не має сібла у цільовій локалі (single-locale page),
 * перемикач веде на home у тій локалі — щоб ніколи не приземлити юзера на
 * 404. Маппінг централізовано в `@/src/lib/seo/localizedPaths`.
 */
export default function LanguageSwitcher() {
  const localeRaw = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LanguageSwitcher");

  const locale: MarketingLocale = isMarketingLocale(localeRaw)
    ? localeRaw
    : "uk";

  const targets: MarketingLocale[] = ["uk", "en", "pl"];

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="inline-flex h-8 items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-flux-border dark:bg-flux-card"
    >
      {targets.map((target) => (
        <LangLink
          key={target}
          href={localizedHref(locale, pathname, target)}
          locale={target}
          active={locale === target}
          label={t(target)}
        />
      ))}
    </div>
  );
}

function LangLink({
  href,
  locale,
  active,
  label,
}: {
  href: string;
  locale: MarketingLocale;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      locale={locale}
      className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded px-2 text-[11px] font-medium uppercase tracking-wider transition-all duration-200 ${
        active
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      }`}
    >
      {label}
    </Link>
  );
}
