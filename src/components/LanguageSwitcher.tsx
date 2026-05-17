"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/src/i18n/navigation";

/**
 * Компактний segmented control UK / EN. Без декорацій, узгоджується по
 * висоті з іншими хедер-кнопками (h-8). Активний сегмент — pill з
 * фіолетовим текстом і білим фоном.
 */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LanguageSwitcher");

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="inline-flex h-8 items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-flux-border dark:bg-flux-card"
    >
      <LangLink
        href={pathname}
        locale="uk"
        active={locale === "uk"}
        label={t("uk")}
      />
      <LangLink
        href={pathname}
        locale="en"
        active={locale === "en"}
        label={t("en")}
      />
      <LangLink
        href={pathname}
        locale="pl"
        active={locale === "pl"}
        label={t("pl")}
      />
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
  locale: "uk" | "en" | "pl";
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
