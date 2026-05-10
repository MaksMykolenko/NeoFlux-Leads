import { getLocale } from "next-intl/server";
import type { User } from "@prisma/client";
import { redirect } from "@/src/i18n/navigation";
import { getCurrentUser, requireUser } from "@/src/lib/session";

export type Role = "USER" | "ADMIN" | "OWNER";

/**
 * Безпечно нормалізує `role` з БД до canonical значення.
 * Старі рядки можуть бути lowercase ("user"/"admin") після міграції з ранньої
 * версії схеми — підтягуємо до uppercase.
 */
export function normalizeRole(role: string | null | undefined): Role {
  if (!role) return "USER";
  const upper = role.toUpperCase();
  if (upper === "ADMIN" || upper === "OWNER") return upper;
  return "USER";
}

export function isAdmin(user: { role: string } | null | undefined): boolean {
  if (!user) return false;
  const r = normalizeRole(user.role);
  return r === "ADMIN" || r === "OWNER";
}

export function isOwner(user: { role: string } | null | undefined): boolean {
  if (!user) return false;
  return normalizeRole(user.role) === "OWNER";
}

/**
 * Захищає server-component сторінки/layouts адмін-зони.
 * Гостей віддає на /login (через requireUser → redirect), не-адмінів — на /.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdmin(user)) redirect({ href: "/", locale: await getLocale() });
  return user;
}

export async function requireOwner(): Promise<User> {
  const user = await requireUser();
  if (!isOwner(user)) redirect({ href: "/", locale: await getLocale() });
  return user;
}

/**
 * Версія для server actions: не редиректить (actions повертають JSON), а лише
 * сигналізує статус. Виклик-сайт вирішує що повернути юзеру.
 */
export type AdminCheckResult =
  | { ok: true; user: User; role: Role }
  | { ok: false; error: "UNAUTHENTICATED" | "FORBIDDEN" };

export async function checkAdminAccess(): Promise<AdminCheckResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "UNAUTHENTICATED" };
  const role = normalizeRole(user.role);
  if (role !== "ADMIN" && role !== "OWNER") {
    return { ok: false, error: "FORBIDDEN" };
  }
  return { ok: true, user, role };
}

/** Email власника платформи. Юзер з цим email при першому вході отримує OWNER. */
export function getOwnerEmail(): string | null {
  const raw = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return raw && raw.length > 0 ? raw : null;
}

export function inferRoleForEmail(email: string | null): Role {
  const owner = getOwnerEmail();
  if (!owner || !email) return "USER";
  return email.trim().toLowerCase() === owner ? "OWNER" : "USER";
}
