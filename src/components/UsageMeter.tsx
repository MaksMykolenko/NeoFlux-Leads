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
      <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-emerald-900">{plan.name}</span>
          <span className="text-emerald-700">— {t("unlimited")}</span>
        </div>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((status.used / status.limit) * 100));
  const danger = percent >= 95;
  const warn = !danger && percent >= 75;

  const barColor = danger ? "bg-red-500" : warn ? "bg-amber-500" : "bg-purple-500";
  const trackColor = danger
    ? "border-red-200 bg-red-50/60"
    : warn
      ? "border-amber-200 bg-amber-50/60"
      : "border-gray-200 bg-white";

  return (
    <div className={`rounded-lg border px-4 py-2.5 ${trackColor}`}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="min-w-0">
          <span className="font-medium text-gray-900">{plan.name}</span>
          <span className="text-gray-600">
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
          className="text-xs font-medium text-purple-700 hover:text-purple-900 hover:underline"
        >
          {t("upgradeCta")} →
        </Link>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
