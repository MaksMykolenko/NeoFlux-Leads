import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";

/**
 * Глобальний футер у стилі Flux ID:
 * — 4 колонки (brand + 2 nav + соц),
 * — внизу одне центроване copyright-посилання,
 * — links на hover отримують flux-purple-hover + paddingLeft,
 * — соц-іконки: круглі 40×40, hover → bg flux-purple-hover + translateY(-3px),
 * — типографія: h3 (brand) bold, h4 (col titles) uppercase tracking-wider.
 *
 * Light/dark: світла оболонка — м'які zinc-тони; dark — Flux ID точно
 * (#888 для тексту, #fff для заголовків, hover #832bff).
 */
export default async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="mt-auto w-full pt-12 text-zinc-500 dark:text-flux-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-8 md:flex-row md:flex-wrap md:justify-between md:gap-8">
        {/* ─── Brand col ─── */}
        <div className="flex min-w-[200px] flex-1 flex-col gap-2.5 md:max-w-[320px]">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {t("brandName").replace("Leads", "")}
            <span className="text-purple-600 dark:text-flux-purple">Leads</span>
          </h3>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-500">
            {t("tagline")}
          </p>
        </div>

        {/* ─── Projects col ─── */}
        <FooterColumn title={t("projectsTitle")}>
          <FooterExternalLink href="https://fluxid.fluxmarketplace.store">
            {t("linkFluxId")}
          </FooterExternalLink>
          <FooterExternalLink href="https://fluxmarketplace.store">
            {t("linkMarketplace")}
          </FooterExternalLink>
          <FooterExternalLink href="https://social.fluxmarketplace.store">
            {t("linkSocial")}
          </FooterExternalLink>
          <span className="inline-flex w-fit cursor-default items-center gap-1.5 text-sm text-zinc-400 opacity-60 dark:text-zinc-600">
            {t("linkFluxPay")}
            <span className="rounded bg-purple-600 px-1 py-0.5 text-[9px] font-bold tracking-wider text-white dark:bg-flux-purple">
              {t("badgeSoon")}
            </span>
          </span>
        </FooterColumn>

        {/* ─── Account col ─── */}
        <FooterColumn title={t("accountTitle")}>
          <FooterLocaleLink href="/pricing">{t("linkPricing")}</FooterLocaleLink>
          <FooterLocaleLink href="/settings">
            {t("linkSettings")}
          </FooterLocaleLink>
          <FooterLocaleLink href="/login">{t("linkLogin")}</FooterLocaleLink>
          <FooterLocaleLink href="/privacy">
            {t("linkPolicy")}
          </FooterLocaleLink>
          <FooterLocaleLink href="/terms">{t("linkTerms")}</FooterLocaleLink>
          <FooterLocaleLink href="/cookies">{t("linkCookies")}</FooterLocaleLink>
          <FooterLocaleLink href="/acceptable-use">
            {t("linkAcceptableUse")}
          </FooterLocaleLink>
        </FooterColumn>

        {/* ─── Social col ─── */}
        <FooterColumn title={t("companyTitle")}>
          <div className="mt-1 flex gap-3">
            <SocialIcon
              href="https://t.me/neofluxsoftware"
              label={t("socialTelegram")}
            >
              <TelegramIcon />
            </SocialIcon>
            <SocialIcon
              href="https://www.youtube.com/@NeoFluxSoftware"
              label={t("socialYoutube")}
            >
              <YouTubeIcon />
            </SocialIcon>
            <SocialIcon
              href="https://www.tiktok.com/@neoflux.software"
              label={t("socialTiktok")}
            >
              <TikTokIcon />
            </SocialIcon>
          </div>
        </FooterColumn>
      </div>

      {/* ─── Bottom bar ─── */}
      <div className="px-6 pb-6 text-center text-sm">
        <a
          href="https://maksmykolenko.github.io/NeoFlux-Software/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 transition-colors hover:text-purple-600 dark:text-zinc-600 dark:hover:text-flux-purple-hover"
        >
          © 2026 NeoFlux Software. {t("rightsReserved")}
        </a>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-[160px] flex-1 flex-col gap-2.5">
      <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
        {title}
      </h4>
      {children}
    </div>
  );
}

/**
 * Внутрішнє посилання через next-intl router (зберігає locale).
 * На hover: колір flux-purple-hover + зсув на 5px вправо (як у Flux ID).
 */
function FooterLocaleLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="w-fit text-sm text-zinc-500 transition-all duration-300 hover:translate-x-1 hover:text-purple-600 dark:text-zinc-500 dark:hover:text-flux-purple-hover"
    >
      {children}
    </Link>
  );
}

function FooterExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-fit text-sm text-zinc-500 transition-all duration-300 hover:translate-x-1 hover:text-purple-600 dark:text-zinc-500 dark:hover:text-flux-purple-hover"
    >
      {children}
    </a>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 transition-all duration-300 hover:-translate-y-1 hover:bg-purple-600 hover:text-white dark:bg-[#1e1e1e] dark:text-white dark:hover:bg-flux-purple-hover"
    >
      {children}
    </a>
  );
}

// ─── Brand icons (inline SVG — не залежимо від font-awesome) ───────────

function TelegramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0Zm5.066 8.078c.213.005.42.084.586.232.115.103.19.245.213.4.024.18-.005.36-.038.486-.302 1.587-1.604 7.61-2.097 9.992-.208 1.012-.616 1.349-1.012 1.387-.86.078-1.515-.572-2.347-1.117-1.305-.852-2.043-1.382-3.31-2.215-1.464-.965-.515-1.495.32-2.36.218-.224 4.011-3.679 4.085-3.99.009-.04.018-.182-.07-.258-.087-.075-.213-.05-.305-.029-.13.029-2.211 1.405-6.245 4.13-.591.405-1.126.602-1.606.591-.529-.011-1.547-.299-2.304-.545-.927-.302-1.664-.46-1.601-.97.034-.265.4-.539 1.103-.821 4.328-1.886 7.215-3.13 8.66-3.733 4.122-1.717 4.978-2.014 5.535-2.025h.043Z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.4a8.16 8.16 0 0 0 4.77 1.52V6.49a4.85 4.85 0 0 1-1.84-.79Z" />
    </svg>
  );
}
