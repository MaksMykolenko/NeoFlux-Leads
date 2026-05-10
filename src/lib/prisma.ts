import { PrismaClient } from "@prisma/client";

/**
 * Single PrismaClient instance reused across hot reload (dev) and within
 * the same serverless isolate (Vercel) to avoid exhausting DB connections.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

globalForPrisma.prisma = prisma;
