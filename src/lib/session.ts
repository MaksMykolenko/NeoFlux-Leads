import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import type { User } from "@prisma/client";
import { redirect } from "@/src/i18n/navigation";
import { prisma } from "@/src/lib/prisma";

export const SESSION_COOKIE = "neoflux_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 днів — як у Flux ID

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

type CreateSessionInput = {
  userId: string;
  userAgent?: string | null;
  ip?: string | null;
};

/**
 * Створює серверну сесію в БД. Повертає сирий токен — його треба покласти в
 * HTTP-only cookie. У БД зберігається лише SHA-256 хеш, тож якщо БД скомпрометують,
 * сирі токени неможливо відновити.
 */
export async function createSession({ userId, userAgent, ip }: CreateSessionInput): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await prisma.session.create({
    data: { tokenHash, userId, expiresAt, userAgent: userAgent ?? null, ip: ip ?? null },
  });

  return { token, expiresAt };
}

export async function destroySessionByToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/**
 * Захищає server-component сторінку: повертає юзера або робить redirect на локалізований /login.
 * Це другий рівень захисту після middleware (на випадок підробленого cookie).
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale: await getLocale() });
  }
  return user!;
}

/**
 * Для server actions, що не можуть редиректити (вони повертають JSON-результат).
 * Повертає id залогіненого юзера або null. Виклик-сайт сам формує помилку.
 */
export async function getRequestUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }
    return session.user;
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
    console.error("[session] getCurrentUser", err);
    return null;
  }
}

export type CookieAttrs = {
  name: string;
  value: string;
  maxAge?: number;
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
};

export function buildSessionCookie(token: string): CookieAttrs {
  return {
    name: SESSION_COOKIE,
    value: token,
    maxAge: SESSION_TTL_SECONDS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

export function buildClearedSessionCookie(): CookieAttrs {
  return {
    name: SESSION_COOKIE,
    value: "",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}
