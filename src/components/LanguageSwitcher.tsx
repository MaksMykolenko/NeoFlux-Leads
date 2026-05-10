"use client";

import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/src/i18n/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LanguageSwitcher");

  return (
    <div
      className="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-1 py-0.5 text-[11px]"
      title={t("label")}
    >
      <Link
        href={pathname}
        locale="uk"
        className={`rounded px-1.5 py-0.5 transition ${
          locale === "uk"
            ? "bg-white font-semibold text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        {t("uk")}
      </Link>
      <span className="text-gray-300 select-none">|</span>
      <Link
        href={pathname}
        locale="en"
        className={`rounded px-1.5 py-0.5 transition ${
          locale === "en"
            ? "bg-white font-semibold text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        {t("en")}
      </Link>
    </div>
  );
}
