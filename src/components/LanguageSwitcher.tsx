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
      className="inline-flex h-8 items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 p-0.5"
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
  locale: "uk" | "en";
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      locale={locale}
      className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded px-2 text-[11px] font-medium uppercase tracking-wider transition ${
        active
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-900"
      }`}
    >
      {label}
    </Link>
  );
}
