import type { User } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

/**
 * Тарифні плани NeoFlux Lead Engine.
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
  | "csvExport" // експорт лідів у CSV
  | "whiteLabel"; // White-label звіти

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
      whiteLabel: false,
    },
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
      whiteLabel: false,
    },
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
      "White-label звіти",
    ],
    features: {
      websiteAudit: true,
      emailEnrichment: true,
      advancedAi: true,
      unlimitedAi: true,
      csvExport: true,
      whiteLabel: true,
    },
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
 * Інкрементуємо лічильник на `delta` нових лідів. Якщо період (30 днів) минув —
 * скидаємо лічильник у `delta` і оновлюємо `planResetDate`. Атомарно через
 * `update({ where: { id, planResetDate } })` важко зробити, тому покладаємося
 * на коротке перевикання — race condition тут не критичний (лічильник може
 * "скочити" на одиницю, але юзер ніколи не отримає менше, ніж заплачено).
 */
export async function incrementLeadsProcessed(
  userId: string,
  delta: number,
): Promise<void> {
  if (delta <= 0) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { leadsProcessedCount: true, planResetDate: true },
  });
  if (!user) return;

  const elapsed = Date.now() - user.planResetDate.getTime();
  if (elapsed >= RESET_INTERVAL_MS) {
    await prisma.user.update({
      where: { id: userId },
      data: { leadsProcessedCount: delta, planResetDate: new Date() },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { leadsProcessedCount: { increment: delta } },
    });
  }
}
