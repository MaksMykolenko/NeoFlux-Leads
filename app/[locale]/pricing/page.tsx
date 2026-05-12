import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { requireUser } from "@/src/lib/session";
import {
  PLAN_ORDER,
  PLANS,
  getPlanForUser,
  type Plan,
} from "@/src/lib/subscription";
import UpgradeButton from "@/src/components/UpgradeButton";

export const dynamic = "force-dynamic";

type PricingT = Awaited<ReturnType<typeof getTranslations<"Pricing">>>;

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Pricing" });

  const user = await requireUser();
  const currentPlan = getPlanForUser(user);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-zinc-50 to-purple-50 py-12 dark:bg-flux-bg dark:bg-none sm:py-16">
      {/* Радіальне світіння в dark mode — як Flux ID hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(106,0,255,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-all duration-200 hover:text-zinc-900 dark:text-flux-muted dark:hover:text-flux-text"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
              clipRule="evenodd"
            />
          </svg>
          {t("back")}
        </Link>

        <header className="mt-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:border-flux-purple/30 dark:bg-flux-purple-tint dark:text-flux-purple-soft">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500 dark:bg-flux-purple" />
            {t("current")} {currentPlan.name}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 dark:text-flux-text sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-flux-muted">
            {t("subtitle")}
          </p>
        </header>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_ORDER.map((id) => (
            <PlanCard
              key={id}
              plan={PLANS[id]}
              isCurrent={id === currentPlan.id}
              locale={locale}
              t={t}
            />
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-zinc-500 dark:text-flux-muted">
          {t("paymentNote")}
        </p>
      </div>
    </main>
  );
}

function formatPrice(value: number): string {
  if (value === 0) return "$0";
  return `$${value}`;
}

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  locale: string;
  t: PricingT;
}

function PlanCard({ plan, isCurrent, locale, t }: PlanCardProps) {
  const isPro = plan.id === "PRO";
  const isAgency = plan.id === "AGENCY";
  const isPaid = isPro || isAgency;
  const unlimited = !Number.isFinite(plan.leadsPerMonth);
  const formatted = unlimited ? t("unlimitedWord") : String(plan.leadsPerMonth);
  const perMonthSuffix = unlimited ? "" : t("perMonthSuffix");

  // Картки у Flux ID-стилі: великий радіус (20px), субт-бордер з покращенням
  // на hover до flux-purple + glow. PRO має шкалу + ring + найбільший glow.
  const cardClasses = [
    "group relative flex flex-col rounded-2xl border bg-white p-8 transition-all duration-300 dark:bg-flux-card hover:-translate-y-1",
    isPro
      ? "border-purple-200 shadow-[0_0_30px_-5px_rgba(168,85,247,0.35)] ring-2 ring-purple-500 dark:border-flux-purple/40 dark:ring-flux-purple dark:shadow-[0_10px_40px_rgba(106,0,255,0.25)] lg:scale-[1.04]"
      : isAgency
        ? "border-zinc-200 shadow-md dark:border-flux-border dark:hover:border-flux-purple/30 dark:hover:shadow-[0_10px_30px_rgba(106,0,255,0.12)]"
        : "border-zinc-200 shadow-sm dark:border-flux-border dark:hover:border-flux-border-strong",
  ].join(" ");

  // CTA: насичений #6a00ff (Flux ID brand) у dark, purple-600 у light.
  const upgradeClasses = `inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold tracking-tight transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-flux-purple dark:focus-visible:ring-offset-flux-card ${
    isPaid
      ? "bg-purple-600 text-white shadow-[0_4px_20px_rgba(168,85,247,0.4)] hover:bg-purple-700 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(168,85,247,0.55)] dark:bg-flux-purple dark:shadow-[0_4px_20px_rgba(106,0,255,0.4)] dark:hover:bg-flux-purple-hover dark:hover:shadow-[0_6px_24px_rgba(106,0,255,0.55)]"
      : "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-flux-card-2 dark:text-flux-text dark:hover:bg-flux-card"
  }`;

  return (
    <div className={cardClasses}>
      {isPro && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md dark:bg-flux-purple dark:shadow-[0_4px_15px_rgba(106,0,255,0.6)]">
          {t("popular")}
        </span>
      )}

      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-flux-text">
          {plan.name}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-flux-muted">
          {plan.tagline}
        </p>
      </div>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-flux-text">
          {formatPrice(plan.priceUsd)}
        </span>
        <span className="text-base text-zinc-500 dark:text-flux-muted">
          {t("perMonth")}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-flux-muted">
        {plan.description}
      </p>

      <ul className="mt-6 space-y-3 text-sm">
        <li className="flex items-start gap-2.5">
          <CheckIcon />
          <span className="text-zinc-700 dark:text-zinc-300">
            {t("leadsLine", { formatted, perMonthSuffix })}
          </span>
        </li>
        {plan.highlights.slice(1).map((h) => (
          <li key={h} className="flex items-start gap-2.5">
            <CheckIcon />
            <span className="text-zinc-700 dark:text-zinc-300">{h}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        {isCurrent ? (
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-default items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-500 dark:border-flux-border dark:bg-flux-bg dark:text-flux-muted"
          >
            {t("currentPlan")}
          </button>
        ) : plan.stripePriceId ? (
          <UpgradeButton
            priceId={plan.stripePriceId}
            locale={locale}
            label={t("upgradeNow")}
            className={upgradeClasses}
          />
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-default items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-500 dark:border-flux-border dark:bg-flux-bg dark:text-flux-muted"
          >
            {t("currentPlan")}
          </button>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500 dark:text-flux-purple-soft"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
