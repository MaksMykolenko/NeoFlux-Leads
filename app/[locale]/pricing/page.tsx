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
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-cyan-50 py-12 dark:from-zinc-950 dark:to-zinc-900 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-all duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
            {t("subtitle")}
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("current")}{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {currentPlan.name}
            </span>
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

        <p className="mt-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
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

  // Картки: чіткі лінії + малий радіус. Glow тільки у dark mode на платних.
  const cardClasses = [
    "relative flex flex-col rounded-md border bg-white p-8 transition-all duration-200 dark:bg-zinc-900",
    isPro
      ? "border-cyan-200 shadow-lg ring-2 ring-cyan-500 dark:border-cyan-500/40 dark:shadow-[0_0_15px_rgba(0,176,255,0.15)] lg:scale-[1.02]"
      : isAgency
        ? "border-zinc-200 shadow-md dark:border-zinc-800 dark:shadow-[0_0_15px_rgba(0,176,255,0.08)]"
        : "border-zinc-200 shadow-sm dark:border-zinc-800",
  ].join(" ");

  const upgradeClasses = `inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
    isPaid
      ? "bg-cyan-500 text-white shadow-sm hover:bg-cyan-600 dark:hover:bg-cyan-400"
      : "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
  }`;

  return (
    <div className={cardClasses}>
      {isPro && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow">
          {t("popular")}
        </span>
      )}

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {plan.name}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {plan.tagline}
        </p>
      </div>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {formatPrice(plan.priceUsd)}
        </span>
        <span className="text-base text-zinc-500 dark:text-zinc-400">
          {t("perMonth")}
        </span>
      </div>

      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
        {plan.description}
      </p>

      <ul className="mt-6 space-y-3 text-sm">
        <li className="flex items-start gap-2">
          <CheckIcon />
          <span className="text-zinc-700 dark:text-zinc-300">
            {t("leadsLine", { formatted, perMonthSuffix })}
          </span>
        </li>
        {plan.highlights.slice(1).map((h) => (
          <li key={h} className="flex items-start gap-2">
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
            className="inline-flex w-full cursor-default items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
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
            className="inline-flex w-full cursor-default items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
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
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-500"
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
