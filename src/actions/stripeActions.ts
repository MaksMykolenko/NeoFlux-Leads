"use server";

import { prisma } from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/session";
import { getStripe } from "@/src/lib/stripe";
import { PLANS, type PlanId } from "@/src/lib/subscription";
import { routing } from "@/src/i18n/routing";

export interface CheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface PortalResult {
  success: boolean;
  url?: string;
  error?: string;
  /** "NO_CUSTOMER" — юзер ще не робив Checkout, Stripe Customer не існує. */
  errorCode?: "NO_CUSTOMER" | "NO_BASE_URL" | "STRIPE_ERROR";
}

const ALLOWED_PRICE_IDS = new Set(
  Object.values(PLANS)
    .map((p) => p.stripePriceId)
    .filter((id): id is string => typeof id === "string" && id.length > 0),
);

function isAllowedPriceId(value: string): boolean {
  return ALLOWED_PRICE_IDS.has(value);
}

function safeLocale(value: string): string {
  return (routing.locales as readonly string[]).includes(value)
    ? value
    : routing.defaultLocale;
}

/**
 * Створює Stripe Checkout Session у режимі `subscription` і повертає URL,
 * на який клієнт має зробити redirect (через `window.location.href`).
 *
 * Безпека:
 * - `priceId` валідується проти allowlist з PLANS — клієнт не може передати
 *   довільний price (наприклад, $0.01-плану з іншого акаунту).
 * - `client_reference_id` + `metadata.userId` дають вебхук-обробнику чітку
 *   прив'язку до нашого юзера (Stripe Customer ID на цьому етапі може ще
 *   не існувати).
 */
export async function createCheckoutSession(
  priceId: string,
  locale: string,
): Promise<CheckoutResult> {
  if (!priceId || !isAllowedPriceId(priceId)) {
    return { success: false, error: "Невалідний priceId" };
  }

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Не авторизовано" };

  const base = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!base) {
    return {
      success: false,
      error:
        "NEXT_PUBLIC_BASE_URL не налаштовано — Checkout не зможе побудувати success_url.",
    };
  }

  const safeBase = base.replace(/\/$/, "");
  const safeLoc = safeLocale(locale);

  // Знаходимо plan, на який чекаутить юзер — для metadata, щоб у вебхуку було
  // зрозуміло, який план активувати без додаткового запиту до Stripe.
  const targetPlanId = (Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).find(
    ([, plan]) => plan.stripePriceId === priceId,
  )?.[0];

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        targetPlanId: targetPlanId ?? "",
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          targetPlanId: targetPlanId ?? "",
        },
      },
      customer_email: user.email ?? undefined,
      success_url: `${safeBase}/${safeLoc}/?checkout=success`,
      cancel_url: `${safeBase}/${safeLoc}/pricing`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return { success: false, error: "Stripe не повернув URL сесії" };
    }
    return { success: true, url: session.url };
  } catch (error) {
    console.error("createCheckoutSession error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Stripe API error",
    };
  }
}

/**
 * Створює Stripe Billing Portal session — самообслуговування для активних
 * підписників: оновлення картки, скасування підписки, перегляд інвойсів.
 *
 * Customer ID беремо з БД, а не з клієнтського запиту — щоб юзер не міг
 * передати чужий cus_*. Якщо stripeCustomerId порожній, повертаємо
 * NO_CUSTOMER (це означає, що юзер ще не оформив підписку — UI не має
 * рендерити кнопку).
 *
 * Передумова: у Stripe Dashboard має бути налаштований Billing Portal
 * (https://dashboard.stripe.com/test/settings/billing/portal). Без цього
 * sessions.create поверне `No configuration provided`.
 */
export async function createCustomerPortalSession(
  locale: string,
): Promise<PortalResult> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return { success: false, error: "Не авторизовано" };

  // Свіжо тягнемо з БД, щоб stripeCustomerId був актуальним (webhook міг
  // встановити його після того, як cookie-payload юзера вже зрендерився).
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return {
      success: false,
      errorCode: "NO_CUSTOMER",
      error: "Customer ID not found",
    };
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!base) {
    return {
      success: false,
      errorCode: "NO_BASE_URL",
      error: "NEXT_PUBLIC_BASE_URL не налаштовано",
    };
  }

  const safeBase = base.replace(/\/$/, "");
  const safeLoc = (routing.locales as readonly string[]).includes(locale)
    ? locale
    : routing.defaultLocale;

  try {
    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${safeBase}/${safeLoc}`,
    });
    if (!portalSession.url) {
      return {
        success: false,
        errorCode: "STRIPE_ERROR",
        error: "Stripe не повернув URL порталу",
      };
    }
    return { success: true, url: portalSession.url };
  } catch (error) {
    console.error("createCustomerPortalSession error:", error);
    return {
      success: false,
      errorCode: "STRIPE_ERROR",
      error: error instanceof Error ? error.message : "Stripe API error",
    };
  }
}
