"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";

interface BrandMarkProps {
  className?: string;
  /** Якщо задано — логотип веде на головну панель (`/`). */
  href?: string;
  id?: string;
}

export default function BrandMark({
  className = "h-8 w-8",
  href,
  id,
}: BrandMarkProps) {
  const t = useTranslations("BrandMark");

  // Flux ID brand: solid #6a00ff з glow під логотипом. Літера N — біла.
  // У dark mode додаємо box-shadow через class на обгортці; для inline-svg
  // (без href) glow може накладатись батьком.
  const svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="Flux Leads"
      className={href ? "h-full w-full" : className}
    >
      <rect x="4" y="4" width="56" height="56" rx="14" fill="#6a00ff" />
      <path d="M19 47V17h6l13 17V17h6v30h-6L25 30v17z" fill="#ffffff" />
    </svg>
  );

  if (href) {
    return (
      <Link
        id={id}
        href={href}
        className={`inline-flex shrink-0 rounded-xl shadow-[0_0_15px_rgba(106,0,255,0.5)] transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flux-purple focus-visible:ring-offset-2 dark:focus-visible:ring-offset-flux-bg ${className}`}
        aria-label={t("homeAria")}
      >
        {svg}
      </Link>
    );
  }

  return svg;
}
