import type { User } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

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

export interface Plan {
  id: PlanId;
  name: string;
  priceUsd: number;
  // Скільки нових лідів дозволено зберегти на місяць.
  // Number.POSITIVE_INFINITY = без обмежень.
  leadsPerMonth: number;
  tagline: string;
  description: string;
  highlights: string[];
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
    leadsPerMonth: 20,
    tagline: "Безкоштовно",
    description: "Спробувати продукт і зрозуміти, як працює пошук лідів.",
    highlights: [
      "20 нових лідів на місяць",
      "Локальний пошук (AI + Google)",
      "Спрощена AI-генерація листів",
    ],
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
    tagline: "Найпопулярніший",
    description: "Для фрилансерів і малих команд, які роблять outreach щодня.",
    highlights: [
      "1000 нових лідів на місяць",
      "Повний аудит сайтів (SSL, mobile, performance)",
      "Email enrichment з HTML",
      "Безлімітна AI-генерація листів (Gemini)",
    ],
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
    leadsPerMonth: Number.POSITIVE_INFINITY,
    tagline: "Без обмежень",
    description: "Для агенцій, які працюють з кількома нішами одночасно.",
    highlights: [
      "Безліміт лідів",
      "Усі функції Pro",
      "Експорт у CSV",
    ],
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

const RESET_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 днів

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
