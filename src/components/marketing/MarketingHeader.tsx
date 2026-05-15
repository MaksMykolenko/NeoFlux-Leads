import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import BrandMark from "@/src/components/BrandMark";
import LanguageSwitcher from "@/src/components/LanguageSwitcher";
import { getCurrentUser } from "@/src/lib/session";

export default async function MarketingHeader() {
  const t = await getTranslations("Marketing");
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0c10]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 text-white transition-opacity hover:opacity-90"
        >
          <BrandMark href="/" className="h-9 w-9" />
          <span className="hidden text-base font-semibold tracking-tight sm:inline">
            {t("productName")}
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 text-sm font-medium text-zinc-400 md:flex"
          aria-label={t("navAria")}
        >
          <Link href="/#features" className="transition-colors hover:text-white">
            {t("navFeatures")}
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-white">
            {t("navPricing")}
          </Link>
          <Link
            href="/solutions/web-agencies"
            className="transition-colors hover:text-white"
          >
            {t("navWebAgencies")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center rounded-lg bg-[#6a00ff] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#5a00d9]"
            >
              {t("ctaDashboard")}
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg bg-[#6a00ff] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#5a00d9]"
            >
              {t("ctaLogin")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
