"use client";

import { useState, useTransition } from "react";
import {
  type AdminUserRow,
  updateUserPlan,
  updateUserRole,
} from "@/src/actions/adminActions";
import { PLAN_ORDER, PLANS, type PlanId } from "@/src/lib/subscription";
import type { Role } from "@/src/lib/admin";

const ROLES: Role[] = ["USER", "ADMIN", "OWNER"];

interface AdminUsersTableProps {
  users: AdminUserRow[];
  /** Поточна роль адміна, що дивиться сторінку. Лише OWNER бачить dropdown ролей. */
  viewerRole: Role;
  /** ID поточного адміна — щоб не дозволити йому самому себе понизити в ролі. */
  viewerId: string;
}

export default function AdminUsersTable({
  users,
  viewerRole,
  viewerId,
}: AdminUsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 dark:border-flux-border dark:bg-flux-card dark:text-zinc-400">
        Користувачів ще немає.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-flux-border dark:bg-flux-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50 dark:border-flux-border dark:bg-flux-card-2/50">
              <Th>Користувач</Th>
              <Th>Роль</Th>
              <Th>План</Th>
              <Th align="right">Ліди</Th>
              <Th align="right">Викор.</Th>
              <Th>Останній вхід</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                viewerRole={viewerRole}
                viewerId={viewerId}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  user,
  viewerRole,
  viewerId,
}: {
  user: AdminUserRow;
  viewerRole: Role;
  viewerId: string;
}) {
  const [plan, setPlan] = useState<PlanId>(user.plan);
  const [role, setRole] = useState<Role>(user.role);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSelf = user.id === viewerId;
  const canEditRole = viewerRole === "OWNER" && !isSelf;

  function handlePlanChange(next: PlanId) {
    if (next === plan) return;
    const previous = plan;
    setPlan(next);
    setError(null);

    startTransition(async () => {
      const result = await updateUserPlan(user.id, next);
      if (!result.success) {
        setPlan(previous);
        setError(result.error ?? "Не вдалося");
      }
    });
  }

  function handleRoleChange(next: Role) {
    if (next === role) return;
    const previous = role;
    setRole(next);
    setError(null);

    startTransition(async () => {
      const result = await updateUserRole(user.id, next);
      if (!result.success) {
        setRole(previous);
        setError(result.error ?? "Не вдалося");
      }
    });
  }

  return (
    <tr className={isPending ? "opacity-60" : undefined}>
      <Td>
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
            />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700 dark:bg-flux-purple-tint dark:text-flux-purple-soft">
              {(user.displayName || user.username || user.email || "?")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
              {user.displayName || user.username || "—"}
            </div>
            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {user.email ?? "немає email"}
            </div>
          </div>
        </div>
        {error && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</div>}
      </Td>

      <Td>
        {canEditRole ? (
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            disabled={isPending}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60 dark:border-flux-border dark:bg-flux-card dark:text-zinc-300"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <RoleBadge role={role} />
        )}
      </Td>

      <Td>
        <select
          value={plan}
          onChange={(e) => handlePlanChange(e.target.value as PlanId)}
          disabled={isPending}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60 dark:border-flux-border dark:bg-flux-card dark:text-zinc-300"
        >
          {PLAN_ORDER.map((id) => (
            <option key={id} value={id}>
              {PLANS[id].name}
            </option>
          ))}
        </select>
      </Td>

      <Td align="right">
        <span className="tabular-nums">{user.leadsCount}</span>
      </Td>

      <Td align="right">
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
          {user.leadsProcessedCount}
          {Number.isFinite(PLANS[plan].leadsPerMonth) && (
            <span className="text-zinc-300 dark:text-zinc-600">
              {" "}
              / {PLANS[plan].leadsPerMonth}
            </span>
          )}
        </span>
      </Td>

      <Td>
        {user.lastLoginAt ? (
          <span className="text-zinc-500 dark:text-zinc-400">{formatDate(user.lastLoginAt)}</span>
        ) : (
          <span className="text-zinc-300 dark:text-zinc-600">—</span>
        )}
      </Td>
    </tr>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const cls =
    role === "OWNER"
      ? "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30"
      : role === "ADMIN"
      ? "bg-purple-100 text-purple-800 ring-purple-200 dark:bg-flux-purple-tint dark:text-flux-purple-soft dark:ring-flux-purple-ring"
      : "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-flux-card-2 dark:text-zinc-300 dark:ring-flux-border-strong";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {role}
    </span>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-4 py-3 align-top ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

const DATE_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(date: Date | string): string {
  return DATE_FORMATTER.format(new Date(date));
}
