import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";

export default async function MarketingFooter() {
  const t = await getTranslations("Marketing");

  return (
    <footer className="border-t border-white/10 bg-[#0b0c10] text-zinc-500">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between lg:px-8">
        <div className="max-w-sm">
          <p className="text-lg font-semibold text-white">
            Flux <span className="text-[#6a00ff]">Leads</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed">{t("footerTagline")}</p>
        </div>
        <div className="flex flex-wrap gap-8 text-sm">
          <div className="flex flex-col">
            <p className="mb-3 font-semibold uppercase tracking-wider text-zinc-300">
              {t("footerProduct")}
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/pricing" className="hover:text-white">
                  {t("navPricing")}
                </Link>
              </li>
              <li>
                <Link href="/solutions/web-agencies" className="hover:text-white">
                  {t("navWebAgencies")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  {t("ctaLogin")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col">
            <p className="mb-3 font-semibold uppercase tracking-wider text-zinc-300">
              {t("footerCompany")}
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://neoflux.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  NeoFlux Software
                </a>
              </li>
              <li>
                <a
                  href="https://maksmykolenko.github.io/NeoFlux-Software/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {t("footerPolicy")}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-xs sm:px-6">
        © 2026 NeoFlux Software. {t("footerRights")}
      </div>
    </footer>
  );
}
