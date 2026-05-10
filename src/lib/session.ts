import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
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

export async function getCurrentUser(): Promise<User | null> {
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
