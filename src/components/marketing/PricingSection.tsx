import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import {
  PLAN_ORDER,
  PLANS,
  getPlanForUser,
} from "@/src/lib/subscription";
import { getCurrentUser } from "@/src/lib/session";
import UpgradeButton from "@/src/components/UpgradeButton";

export default async function PricingSection({
  locale,
}: {
  locale: string;
}) {
  const t = await getTranslations("Pricing");
  const user = await getCurrentUser();
  const currentPlan = user ? getPlanForUser(user) : null;

  return (
    <>
      <header className="text-center">
        {currentPlan && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6a00ff]/30 bg-[#6a00ff]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#b580ff]">
            {t("current")} {currentPlan.name}
          </span>
        )}
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-zinc-400">{t("subtitle")}</p>
      </header>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const isCurrent = currentPlan?.id === id;
          const isPro = plan.id === "PRO";
          const unlimited = !Number.isFinite(plan.leadsPerMonth);
          const formatted = unlimited
            ? t("unlimitedWord")
            : String(plan.leadsPerMonth);
          const perMonthSuffix = unlimited ? "" : t("perMonthSuffix");

          return (
            <article
              key={id}
              className={`flex flex-col rounded-2xl border bg-[#13141c] p-8 ${
                isPro
                  ? "border-[#6a00ff]/40"
                  : "border-white/10"
              }`}
            >
              <h2 className="text-xl font-bold text-white">{plan.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">{plan.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">
                  {plan.priceUsd === 0 ? "$0" : `$${plan.priceUsd}`}
                </span>
                <span className="text-zinc-500">{t("perMonth")}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                {plan.description}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-zinc-300">
                <li>
                  {t("leadsLine", { formatted, perMonthSuffix })}
                </li>
                {plan.highlights.slice(1).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <div className="mt-8">
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-default rounded-lg border border-white/10 py-3 text-sm text-zinc-500"
                  >
                    {t("currentPlan")}
                  </button>
                ) : plan.stripePriceId && user ? (
                  <UpgradeButton
                    priceId={plan.stripePriceId}
                    locale={locale}
                    label={t("upgradeNow")}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-[#6a00ff] py-3 text-sm font-semibold text-white hover:bg-[#5a00d9]"
                  />
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-[#6a00ff] py-3 text-sm font-semibold text-white hover:bg-[#5a00d9]"
                  >
                    {t("upgradeNow")}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-12 text-center text-xs text-zinc-500">{t("paymentNote")}</p>
    </>
  );
}
