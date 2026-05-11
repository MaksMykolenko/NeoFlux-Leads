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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
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
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-gray-600">{t("subtitle")}</p>
          <p className="mt-2 text-sm text-gray-500">
            {t("current")}{" "}
            <span className="font-medium text-gray-900">{currentPlan.name}</span>
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
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

        <p className="mt-12 text-center text-xs text-gray-500">
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
  const unlimited = !Number.isFinite(plan.leadsPerMonth);
  const formatted = unlimited ? t("unlimitedWord") : String(plan.leadsPerMonth);
  const perMonthSuffix = unlimited ? "" : t("perMonthSuffix");
  const upgradeClasses = `inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition ${
    isPro
      ? "bg-purple-600 text-white hover:bg-purple-700"
      : "bg-gray-900 text-white hover:bg-gray-800"
  }`;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition ${
        isPro
          ? "border-purple-200 ring-2 ring-purple-500 lg:scale-[1.02]"
          : "border-gray-200"
      }`}
    >
      {isPro && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow">
          {t("popular")}
        </span>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
        <p className="mt-1 text-sm text-gray-500">{plan.tagline}</p>
      </div>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-5xl font-semibold tracking-tight text-gray-900">
          {formatPrice(plan.priceUsd)}
        </span>
        <span className="text-base text-gray-500">{t("perMonth")}</span>
      </div>

      <p className="mt-4 text-sm text-gray-600">{plan.description}</p>

      <ul className="mt-6 space-y-3 text-sm">
        <li className="flex items-start gap-2">
          <CheckIcon />
          <span className="text-gray-700">
            {t("leadsLine", { formatted, perMonthSuffix })}
          </span>
        </li>
        {plan.highlights.slice(1).map((h) => (
          <li key={h} className="flex items-start gap-2">
            <CheckIcon />
            <span className="text-gray-700">{h}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        {isCurrent ? (
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-default items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-500"
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
            className="inline-flex w-full cursor-default items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-500"
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
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
