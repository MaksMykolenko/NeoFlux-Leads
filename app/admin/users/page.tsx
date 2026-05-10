import {
  fetchAdminUsers,
  getPlatformStats,
} from "@/src/actions/adminActions";
import { requireAdmin, normalizeRole } from "@/src/lib/admin";
import { PLANS, type PlanId } from "@/src/lib/subscription";
import AdminUsersTable from "@/src/components/AdminUsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Користувачі
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Зміни плану застосовуються миттєво. Лічильник лідів скидається на 0
          при зміні плану.
        </p>
      </header>

      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Всього юзерів"
            value={stats.totalUsers.toLocaleString()}
            hint={`${stats.activeUsers} активних за 30д`}
          />
          <StatCard
            label="Активні скрапери"
            value={stats.activeUsers.toLocaleString()}
            hint="входили за останні 30 днів"
          />
          <StatCard
            label="Лідів у системі"
            value={stats.totalLeads.toLocaleString()}
            hint="усі юзери разом"
          />
          <StatCard
            label="Revenue / міс"
            value={`$${stats.monthlyRevenueUsd.toLocaleString()}`}
            hint="симульовано з PRO+AGENCY"
            accent
          />
        </div>
      )}

      {stats && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Нові акаунти за 24 год"
            value={stats.newUsers24h.toLocaleString()}
            hint="за датою створення запису User (Flux ID)"
          />
          <StatCard
            label="Нові за 7 днів"
            value={stats.newUsers7d.toLocaleString()}
            hint="останні 7 діб"
          />
          <StatCard
            label="Нові за 30 днів"
            value={stats.newUsers30d.toLocaleString()}
            hint="останні 30 діб"
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
          Не вдалося завантажити користувачів: {usersResult.error}
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
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        accent ? "border-indigo-200 ring-1 ring-indigo-100" : "border-gray-200"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-semibold tracking-tight ${
          accent ? "text-indigo-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-gray-700">{planName}</span>
        <span className="tabular-nums text-gray-500">
          {count} ({percent}%)
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
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
      return "bg-indigo-500";
    case "AGENCY":
      return "bg-amber-500";
    default:
      return "bg-gray-400";
  }
}
