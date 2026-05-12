"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import type { Plan } from "@/src/lib/subscription";
import type { LeadLimitStatus } from "@/src/lib/subscription";

interface UsageMeterProps {
  status: LeadLimitStatus;
  plan: Plan;
}

export default function UsageMeter({ status, plan }: UsageMeterProps) {
  const t = useTranslations("UsageMeter");

  if (status.unlimited) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-emerald-900 dark:text-emerald-200">
            {plan.name}
          </span>
          <span className="text-emerald-700 dark:text-emerald-300">
            — {t("unlimited")}
          </span>
        </div>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((status.used / status.limit) * 100));
  const danger = percent >= 95;
  const warn = !danger && percent >= 75;

  const barColor = danger
    ? "bg-red-500"
    : warn
      ? "bg-amber-500"
      : "bg-purple-500 dark:bg-flux-purple";
  const trackColor = danger
    ? "border-red-200 bg-red-50/60 dark:border-red-500/30 dark:bg-red-500/10"
    : warn
      ? "border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10"
      : "border-zinc-200 bg-white dark:border-flux-border dark:bg-flux-card";

  return (
    <div className={`rounded-xl border px-4 py-3 ${trackColor}`}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="min-w-0">
          <span className="font-semibold text-zinc-900 dark:text-flux-text">
            {plan.name}
          </span>
          <span className="text-zinc-600 dark:text-flux-muted">
            {" "}
            —{" "}
            {t("remaining", {
              remaining: status.remaining,
              limit: status.limit,
              used: status.used,
            })}
          </span>
        </div>
        <Link
          href="/pricing"
          className="text-xs font-semibold text-purple-600 transition-colors hover:text-purple-700 hover:underline dark:text-flux-purple-soft dark:hover:text-white"
        >
          {t("upgradeCta")} →
        </Link>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-flux-border-strong">
        <div
          className={`h-full rounded-full transition-all duration-200 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
