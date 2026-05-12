import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  fetchAdminUsers,
  getPlatformStats,
} from "@/src/actions/adminActions";
import { requireAdmin, normalizeRole } from "@/src/lib/admin";
import { PLANS, type PlanId } from "@/src/lib/subscription";
import AdminUsersTable from "@/src/components/AdminUsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminUsers");

  const viewer = await requireAdmin();
  const viewerRole = normalizeRole(viewer.role);

  const [usersResult, statsResult] = await Promise.all([
    fetchAdminUsers(),
    getPlatformStats(),
  ]);

  const users = usersResult.success && usersResult.users ? usersResult.users : [];
  const stats = statsResult.success && statsResult.stats ? statsResult.stats : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
      </header>

      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("statTotalUsers")}
            value={stats.totalUsers.toLocaleString()}
            hint={t("statActiveHint", { count: stats.activeUsers })}
          />
          <StatCard
            label={t("statActiveScrapers")}
            value={stats.activeUsers.toLocaleString()}
            hint={t("statActiveScrapersHint")}
          />
          <StatCard
            label={t("statLeads")}
            value={stats.totalLeads.toLocaleString()}
            hint={t("statLeadsHint")}
          />
          <StatCard
            label={t("statRevenue")}
            value={`$${stats.monthlyRevenueUsd.toLocaleString()}`}
            hint={t("statRevenueHint")}
            accent
          />
        </div>
      )}

      {stats && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard
            label={t("statNew24h")}
            value={stats.newUsers24h.toLocaleString()}
            hint={t("statNew24hHint")}
          />
          <StatCard
            label={t("statNew7d")}
            value={stats.newUsers7d.toLocaleString()}
            hint={t("statNew7dHint")}
          />
          <StatCard
            label={t("statNew30d")}
            value={stats.newUsers30d.toLocaleString()}
            hint={t("statNew30dHint")}
          />
        </div>
      )}

      {stats && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(Object.keys(stats.planDistribution) as PlanId[]).map((id) => (
            <PlanDistributionCard
              key={id}
              planName={PLANS[id].name}
              count={stats.planDistribution[id]}
              total={stats.totalUsers}
              accentClass={planAccent(id)}
            />
          ))}
        </div>
      )}

      <div className="mt-8">
        <AdminUsersTable
          users={users}
          viewerRole={viewerRole}
          viewerId={viewer.id}
        />
      </div>

      {!usersResult.success && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t("loadUsersErr", { message: usersResult.error ?? "" })}
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-md border bg-white p-5 shadow-sm transition-colors dark:bg-zinc-900 ${
        accent
          ? "border-purple-200 ring-1 ring-purple-100 dark:border-purple-500/40 dark:ring-purple-500/20"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-semibold tracking-tight ${
          accent
            ? "text-purple-600 dark:text-purple-400"
            : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>
      )}
    </div>
  );
}

function PlanDistributionCard({
  planName,
  count,
  total,
  accentClass,
}: {
  planName: string;
  count: number;
  total: number;
  accentClass: string;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{planName}</span>
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
          {count} ({percent}%)
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${accentClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function planAccent(plan: PlanId): string {
  switch (plan) {
    case "PRO":
      return "bg-purple-500";
    case "AGENCY":
      return "bg-amber-500";
    default:
      return "bg-zinc-400";
  }
}
