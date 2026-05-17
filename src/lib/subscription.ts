import { createHash } from "node:crypto";
import type { Prisma, User } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
export { calculateLeadSlotGrant } from "@/src/lib/leadSlotMath";

/**
 * Тарифні плани Flux Leads.
 *
 * Single source of truth — тут описані ліміти та фічі для кожного плану.
 * Server actions зчитують їх через `checkSubscription()` і `getPlanForUser()`.
 * /pricing рендериться напряму з цього модуля.
 */

export type PlanId = "STARTER" | "PRO" | "AGENCY";

export type FeatureKey =
  | "websiteAudit" // запуск Playwright-аудиту сайтів
  | "emailEnrichment" // витяг email з HTML під час аудиту
  | "advancedAi" // повноцінний промпт Gemini (а не спрощений)
  | "unlimitedAi" // без обмежень на кількість AI-генерацій
  | "csvExport"; // експорт лідів у CSV

/** Ключі перекладів у `Pricing.plans.{id}.highlights.*` (перший пункт — leadsLine). */
export const PLAN_HIGHLIGHT_KEYS: Record<PlanId, readonly string[]> = {
  STARTER: ["localSearch", "simpleAi"],
  PRO: ["fullAudit", "emailEnrichment", "unlimitedAi"],
  AGENCY: ["allPro", "csvExport"],
};

export interface Plan {
  id: PlanId;
  name: string;
  priceUsd: number;
  // Скільки нових лідів дозволено зберегти на місяць.
  // Ліміт має бути явним: пошук/аудит/AI draft мають реальну собівартість.
  leadsPerMonth: number;
  features: Record<FeatureKey, boolean>;
  // Stripe Price ID (price_…) або Product ID (prod_…) для Checkout.
  // Якщо prod_ — при створенні сесії обирається активна recurring-ціна продукту.
  // Webhook зіставляє і price.id, і price.product з цим значенням.
  stripePriceId: string | null;
}

export const PLANS: Record<PlanId, Plan> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    priceUsd: 0,
    leadsPerMonth: 50,
    features: {
      websiteAudit: false,
      emailEnrichment: false,
      advancedAi: false,
      unlimitedAi: false,
      csvExport: false,
    },
    stripePriceId: null,
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceUsd: 20,
    leadsPerMonth: 1000,
    features: {
      websiteAudit: true,
      emailEnrichment: true,
      advancedAi: true,
      unlimitedAi: true,
      csvExport: false,
    },
    stripePriceId: "prod_UV0mNdVJs3O1ub",
  },
  AGENCY: {
    id: "AGENCY",
    name: "Agency",
    priceUsd: 60,
    leadsPerMonth: 10000,
    features: {
      websiteAudit: true,
      emailEnrichment: true,
      advancedAi: true,
      unlimitedAi: true,
      csvExport: true,
    },
    stripePriceId: "prod_UV0oVIZZb3fA1s",
  },
};

export const PLAN_ORDER: PlanId[] = ["STARTER", "PRO", "AGENCY"];

/** Безпечно дістати план з рядка (на випадок невалідного `user.plan` у БД). */
export function getPlanById(id: string | null | undefined): Plan {
  if (id && id in PLANS) return PLANS[id as PlanId];
  return PLANS.STARTER;
}

export function getPlanForUser(user: Pick<User, "plan">): Plan {
  return getPlanById(user.plan);
}

/** Зворотній lookup: Stripe price.id або product id → PlanId. */
export function getPlanIdByStripePriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  for (const id of PLAN_ORDER) {
    if (PLANS[id].stripePriceId === priceId) return id;
  }
  return null;
}

/**
 * Lookup за об'єктом Price з підписки: спочатку price.id, потім price.product
 * (коли в PLANS збережено prod_).
 */
export function getPlanIdFromStripePrice(
  price: { id: string; product: unknown } | null | undefined,
): PlanId | null {
  if (!price) return null;
  const byPrice = getPlanIdByStripePriceId(price.id);
  if (byPrice) return byPrice;
  const productId = stripeProductIdFromPriceProduct(price.product);
  if (!productId) return null;
  return getPlanIdByStripePriceId(productId);
}

function stripeProductIdFromPriceProduct(product: unknown): string | null {
  if (typeof product === "string") return product;
  if (
    product &&
    typeof product === "object" &&
    "deleted" in product &&
    (product as { deleted?: boolean }).deleted
  ) {
    return null;
  }
  if (
    product &&
    typeof product === "object" &&
    "id" in product &&
    typeof (product as { id: unknown }).id === "string"
  ) {
    return (product as { id: string }).id;
  }
  return null;
}

/** Перевірка фічі за поточним планом юзера. */
export function checkSubscription(
  user: Pick<User, "plan">,
  feature: FeatureKey,
): boolean {
  return getPlanForUser(user).features[feature];
}

export const RESET_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 днів

/**
 * Якщо `planResetDate` старший за 30 днів — лічильник вважається скинутим.
 * Реальне обнулення в БД відбувається ліниво, при наступному `incrementLeads`,
 * щоб не робити write на кожен read.
 */
function effectiveCount(user: Pick<User, "leadsProcessedCount" | "planResetDate">): number {
  const elapsed = Date.now() - user.planResetDate.getTime();
  if (elapsed >= RESET_INTERVAL_MS) return 0;
  return user.leadsProcessedCount;
}

export type LeadLimitStatus = {
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  /** true → можна створити хоча б один новий лід */
  allowed: boolean;
};

export function getLeadLimitStatus(
  user: Pick<User, "plan" | "leadsProcessedCount" | "planResetDate">,
): LeadLimitStatus {
  const plan = getPlanForUser(user);
  const used = effectiveCount(user);
  const unlimited = plan.leadsPerMonth === Number.POSITIVE_INFINITY;
  const limit = unlimited ? 0 : plan.leadsPerMonth;
  const remaining = unlimited ? Number.POSITIVE_INFINITY : Math.max(0, limit - used);
  return {
    used,
    limit,
    remaining,
    unlimited,
    allowed: unlimited || remaining > 0,
  };
}

/**
 * Атомарне інкрементування лічильника. Два кроки:
 *
 * 1) Conditional reset через `updateMany` з фільтром planResetDate < cutoff —
 *    скидає counter тільки якщо вікно вже сплило. Race-safe: якщо одночасно
 *    два запити дійшли сюди, лише один з них пройде фільтр (інший побачить
 *    новий planResetDate і пропустить reset).
 * 2) Атомарний `increment: delta` — Prisma транслює в SQL `count = count + N`,
 *    тож паралельні виклики не "обнуляють" один одного.
 *
 * Не робимо декремент при видаленні лідів — стандартна анти-абуз практика
 * (інакше юзер може імпортувати/видалити/повторити нескінченно в межах вікна).
 *
 * ⚠️ Race-warning for callers: this primitive only makes the WRITE atomic.
 * Sequences like `read remaining → save N leads → incrementLeadsProcessed(N)`
 * remain vulnerable to concurrent overshoot. Prefer `tryClaimLeadSlots` below
 * for paths that may run in parallel (lead-search cores).
 */
export async function incrementLeadsProcessed(
  userId: string,
  delta: number,
): Promise<void> {
  if (delta <= 0) return;

  const cutoff = new Date(Date.now() - RESET_INTERVAL_MS);

  await prisma.user.updateMany({
    where: { id: userId, planResetDate: { lt: cutoff } },
    data: { leadsProcessedCount: 0, planResetDate: new Date() },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { leadsProcessedCount: { increment: delta } },
  });
}

export interface ClaimResult {
  /** How many slots were actually granted (0 <= granted <= wanted). */
  granted: number;
  /** Plan limit (Number.POSITIVE_INFINITY for unlimited). */
  limit: number;
  /** Used count after the claim. */
  usedAfter: number;
  /** Why granted < wanted (only set when partial/zero). */
  reason?: "LIMIT_REACHED" | "USER_NOT_FOUND";
}

// tsconfig target is ES2017 — BigInt literals (`123n`) are unavailable, so we
// build the mask via the BigInt() constructor.
const POSITIVE_BIGINT_MASK = BigInt("0x7fffffffffffffff");

export function userLeadLimitLockKey(userId: string): string {
  // Postgres advisory lock keys are signed bigints. Derive a stable 63-bit
  // positive key from the userId via SHA-256, formatted as a string so we
  // can pass it via parameterized raw SQL.
  const hash = createHash("sha256").update(userId).digest();
  const big = hash.readBigInt64BE(0) & POSITIVE_BIGINT_MASK;
  return big.toString();
}

/**
 * Atomically reserve up to `wanted` lead-creation slots for the user.
 *
 * Why a separate primitive: the older flow
 *   const status = getLeadLimitStatus(user);   // read
 *   for (const lead of ...) prisma.lead.create(...)  // save
 *   incrementLeadsProcessed(userId, saved);    // write
 *
 * has a TOCTOU race — two parallel searches both observe `remaining = 5` and
 * each save 5 leads, leaving the user at +10 over plan. This helper closes
 * the race with a Postgres advisory transaction lock keyed by userId, so any
 * concurrent claims for the same user serialize. Different users still go in
 * parallel — the lock scope is per-user, not global.
 *
 * Usage pattern:
 *   1. Call `tryClaimLeadSlots(userId, wantedCount)` BEFORE any lead.create.
 *   2. Save up to `granted` leads. Dedup'd / failed creates → release.
 *   3. Call `releaseLeadSlots(userId, granted - actuallySaved)` for the rest.
 *
 * Returns `granted = 0` with reason="LIMIT_REACHED" when the user is at cap.
 */
export async function tryClaimLeadSlots(
  userId: string,
  wanted: number,
): Promise<ClaimResult> {
  if (wanted <= 0) {
    return { granted: 0, limit: 0, usedAfter: 0, reason: "LIMIT_REACHED" };
  }

  return prisma.$transaction(async (tx) => {
    // Per-user advisory lock — auto-released on tx commit/rollback. Two
    // parallel calls for the SAME user wait on each other here; different
    // users are unaffected.
    await tx.$executeRawUnsafe(
      `SELECT pg_advisory_xact_lock(${userLeadLimitLockKey(userId)}::bigint)`,
    );

    const u = await tx.user.findUnique({
      where: { id: userId },
      select: { plan: true, leadsProcessedCount: true, planResetDate: true },
    });
    if (!u) {
      return {
        granted: 0,
        limit: 0,
        usedAfter: 0,
        reason: "USER_NOT_FOUND",
      };
    }

    const plan = getPlanForUser(u);
    const cutoff = new Date(Date.now() - RESET_INTERVAL_MS);
    const isExpiredReset = u.planResetDate.getTime() < cutoff.getTime();
    const baseUsed = isExpiredReset ? 0 : u.leadsProcessedCount;

    if (plan.leadsPerMonth === Number.POSITIVE_INFINITY) {
      // unlimited — still bump counter for accounting/analytics.
      if (isExpiredReset) {
        await tx.user.update({
          where: { id: userId },
          data: { leadsProcessedCount: wanted, planResetDate: new Date() },
        });
      } else {
        await tx.user.update({
          where: { id: userId },
          data: { leadsProcessedCount: { increment: wanted } },
        });
      }
      return {
        granted: wanted,
        limit: Number.POSITIVE_INFINITY,
        usedAfter: baseUsed + wanted,
      };
    }

    const remaining = Math.max(0, plan.leadsPerMonth - baseUsed);
    const granted = Math.min(wanted, remaining);
    if (granted === 0) {
      return {
        granted: 0,
        limit: plan.leadsPerMonth,
        usedAfter: baseUsed,
        reason: "LIMIT_REACHED",
      };
    }

    if (isExpiredReset) {
      await tx.user.update({
        where: { id: userId },
        data: { leadsProcessedCount: granted, planResetDate: new Date() },
      });
    } else {
      await tx.user.update({
        where: { id: userId },
        data: { leadsProcessedCount: { increment: granted } },
      });
    }
    return {
      granted,
      limit: plan.leadsPerMonth,
      usedAfter: baseUsed + granted,
    };
  });
}

export async function withUserLeadLimitLock<T>(
  userId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT pg_advisory_xact_lock(${userLeadLimitLockKey(userId)}::bigint)`,
    );
    return fn(tx);
  });
}

export async function incrementLeadsProcessedInTx(
  tx: Prisma.TransactionClient,
  userId: string,
  delta: number,
): Promise<void> {
  if (delta <= 0) return;

  const cutoff = new Date(Date.now() - RESET_INTERVAL_MS);

  await tx.user.updateMany({
    where: { id: userId, planResetDate: { lt: cutoff } },
    data: { leadsProcessedCount: 0, planResetDate: new Date() },
  });

  await tx.user.update({
    where: { id: userId },
    data: { leadsProcessedCount: { increment: delta } },
  });
}

/**
 * Give back unused slots after a partial save (failed creates, dedup hits).
 * `decrement` could underflow past zero on a regular Prisma `update`, so we
 * use a `GREATEST(0, ...)` clamp via raw SQL.
 */
export async function releaseLeadSlots(
  userId: string,
  count: number,
): Promise<void> {
  if (count <= 0) return;
  await prisma.$executeRaw`
    UPDATE "User"
    SET "leadsProcessedCount" = GREATEST(0, "leadsProcessedCount" - ${count})
    WHERE "id" = ${userId}
  `;
}
