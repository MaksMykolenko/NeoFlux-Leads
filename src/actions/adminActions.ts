"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { checkAdminAccess, normalizeRole, type Role } from "@/src/lib/admin";
import { PLANS, type PlanId } from "@/src/lib/subscription";

export interface AdminUserRow {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: Role;
  plan: PlanId;
  leadsCount: number;
  leadsProcessedCount: number;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface FetchAdminUsersResult {
  success: boolean;
  users?: AdminUserRow[];
  error?: string;
}

/**
 * Список усіх юзерів з агрегованою статистикою (кількість лідів, остання сесія).
 * Зашитий ліміт 200 — більш ніж достатньо для першої версії панелі.
 */
export async function fetchAdminUsers(): Promise<FetchAdminUsersResult> {
  const access = await checkAdminAccess();
  if (!access.ok) return { success: false, error: access.error };

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        _count: { select: { leads: true } },
        sessions: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        },
      },
    });

    const rows: AdminUserRow[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      role: normalizeRole(u.role),
      plan: normalizePlan(u.plan),
      leadsCount: u._count.leads,
      leadsProcessedCount: u.leadsProcessedCount,
      createdAt: u.createdAt,
      lastLoginAt: u.sessions[0]?.createdAt ?? null,
    }));

    return { success: true, users: rows };
  } catch (error) {
    console.error("fetchAdminUsers error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "DB error",
    };
  }
}

export interface UpdateUserPlanResult {
  success: boolean;
  error?: string;
}

export async function updateUserPlan(
  targetUserId: string,
  newPlan: string,
): Promise<UpdateUserPlanResult> {
  const access = await checkAdminAccess();
  if (!access.ok) return { success: false, error: access.error };

  if (!isPlanId(newPlan)) {
    return { success: false, error: `Невалідний план: ${newPlan}` };
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { plan: true },
    });
    if (!target) return { success: false, error: "Користувача не знайдено" };

    if (target.plan === newPlan) return { success: true };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUserId },
        // Скидаємо лічильник при апгрейді/даунгрейді — інакше юзер може миттєво
        // вичерпати новий ліміт через старий counter.
        data: {
          plan: newPlan,
          leadsProcessedCount: 0,
          planResetDate: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "USER_PLAN_CHANGED",
          adminId: access.user.id,
          targetUserId,
          metadata: { from: target.plan, to: newPlan },
        },
      }),
    ]);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("updateUserPlan error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "DB error",
    };
  }
}

export interface UpdateUserRoleResult {
  success: boolean;
  error?: string;
}

/**
 * Зміна ролі — лише OWNER. Не дозволяємо OWNER зняти власну роль (інакше може
 * залишитись без єдиного OWNER у системі).
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: string,
): Promise<UpdateUserRoleResult> {
  const access = await checkAdminAccess();
  if (!access.ok) return { success: false, error: access.error };

  if (access.role !== "OWNER") {
    return { success: false, error: "Лише OWNER може змінювати ролі" };
  }

  const normalized = normalizeRole(newRole);
  if (newRole.toUpperCase() !== normalized) {
    return { success: false, error: `Невалідна роль: ${newRole}` };
  }

  if (targetUserId === access.user.id && normalized !== "OWNER") {
    return { success: false, error: "Не можна зняти роль OWNER з самого себе" };
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    });
    if (!target) return { success: false, error: "Користувача не знайдено" };

    if (normalizeRole(target.role) === normalized) return { success: true };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUserId },
        data: { role: normalized },
      }),
      prisma.auditLog.create({
        data: {
          action: "USER_ROLE_CHANGED",
          adminId: access.user.id,
          targetUserId,
          metadata: { from: normalizeRole(target.role), to: normalized },
        },
      }),
    ]);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("updateUserRole error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "DB error",
    };
  }
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number; // юзери з сесією за останні 30 днів
  totalLeads: number;
  planDistribution: Record<PlanId, number>;
  /** Симульований MRR — сума цін планів з ненульовою ціною. */
  monthlyRevenueUsd: number;
}

export interface PlatformStatsResult {
  success: boolean;
  stats?: PlatformStats;
  error?: string;
}

export async function getPlatformStats(): Promise<PlatformStatsResult> {
  const access = await checkAdminAccess();
  if (!access.ok) return { success: false, error: access.error };

  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalLeads, planRows, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.lead.count({ where: { userId: { not: null } } }),
      prisma.user.groupBy({
        by: ["plan"],
        _count: { plan: true },
      }),
      prisma.session
        .findMany({
          where: { createdAt: { gte: since } },
          distinct: ["userId"],
          select: { userId: true },
        })
        .then((rows) => rows.length),
    ]);

    const planDistribution: Record<PlanId, number> = {
      STARTER: 0,
      PRO: 0,
      AGENCY: 0,
    };
    for (const row of planRows) {
      const id = normalizePlan(row.plan);
      planDistribution[id] = row._count.plan;
    }

    const monthlyRevenueUsd =
      planDistribution.PRO * PLANS.PRO.priceUsd +
      planDistribution.AGENCY * PLANS.AGENCY.priceUsd;

    return {
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalLeads,
        planDistribution,
        monthlyRevenueUsd,
      },
    };
  } catch (error) {
    console.error("getPlatformStats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "DB error",
    };
  }
}

function normalizePlan(plan: string | null | undefined): PlanId {
  const upper = (plan ?? "STARTER").toUpperCase();
  if (upper === "PRO" || upper === "AGENCY") return upper;
  return "STARTER";
}

function isPlanId(value: string): value is PlanId {
  return value === "STARTER" || value === "PRO" || value === "AGENCY";
}
