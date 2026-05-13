import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/src/lib/prisma";
import { getStripe } from "@/src/lib/stripe";
import {
  getPlanIdFromStripePrice,
  type PlanId,
} from "@/src/lib/subscription";

/**
 * Stripe webhook endpoint.
 *
 * Stripe викликає його після успішних/невдалих оплат, апдейтів і скасувань
 * підписки. Підпис верифікуємо ОБОВ'ЯЗКОВО — без перевірки можна підробити
 * запит і безкоштовно отримати PRO/AGENCY.
 *
 * Архітектурні зауваження:
 * - Next.js App Router читає raw body через `req.text()`. JSON-парсинг тут
 *   ламає підпис, бо Stripe рахує HMAC від байтів запиту, а не від JS-об'єкта.
 * - `runtime = "nodejs"` — Stripe SDK вимагає Node crypto, edge runtime
 *   не підійде.
 * - Обробка повинна бути idempotent: Stripe ретраїть події до 3 діб при
 *   non-2xx відповіді, тому два виконання `update` з однаковими даними мають
 *   давати той самий результат. Тут це справджується — ми завжди ставимо
 *   план у фіксований стан, а не інкрементально модифікуємо.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RELEVANT_EVENTS = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
]);

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe webhook] signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error(`[stripe webhook] handler failed for ${event.type}:`, err);
    // 500 — щоб Stripe повторив доставку. Не 400, інакше подія "втратиться".
    return NextResponse.json(
      { error: "Handler failed" },
      { status: 500 },
    );
  }
}

// ─── handlers ────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const userId = resolveUserId(session.metadata, session.client_reference_id);
  if (!userId) {
    console.warn("[stripe webhook] checkout.session.completed without userId");
    return;
  }

  const customerId = asId(session.customer);
  const subscriptionId = asId(session.subscription);
  const targetPlanId = parsePlanId(session.metadata?.targetPlanId);

  // Базове оновлення: лінкуємо Stripe-об'єкти + (опційно) optimistic план.
  // Реальний "джерело істини" — це customer.subscription.updated, який
  // прийде слідом і перезапише plan відповідно до price.id у підписці.
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      ...(targetPlanId
        ? {
            plan: targetPlanId,
            leadsProcessedCount: 0,
            planResetDate: new Date(),
          }
        : {}),
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const price = subscription.items.data[0]?.price;
  const planId = isActive ? getPlanIdFromStripePrice(price ?? undefined) : null;

  await applySubscriptionState({
    subscription,
    nextPlan: planId ?? "STARTER",
    keepSubscriptionId: true,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Cancel або incomplete_expired — повертаємо STARTER, відв'язуємо subscription.
  // Customer id зберігаємо, щоб повторна купівля прив'язалась до того ж Customer.
  await applySubscriptionState({
    subscription,
    nextPlan: "STARTER",
    keepSubscriptionId: false,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // На рекурентну оплату Stripe надсилає і `invoice.paid`, і
  // `customer.subscription.updated`. Дублюємо логіку тут на випадок, якщо
  // підписка прийшла раніше за update-подію (порядок не гарантований).
  const subscriptionId = asId(extractSubscriptionFromInvoice(invoice));
  if (!subscriptionId) return;

  let subscription: Stripe.Subscription;
  try {
    subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  } catch (err) {
    console.error("[stripe webhook] failed to retrieve subscription:", err);
    return;
  }

  await handleSubscriptionUpdated(subscription);
}

// ─── shared helpers ───────────────────────────────────────────────────────

async function applySubscriptionState(args: {
  subscription: Stripe.Subscription;
  nextPlan: PlanId;
  keepSubscriptionId: boolean;
}) {
  const { subscription, nextPlan, keepSubscriptionId } = args;
  const subscriptionId = subscription.id;
  const customerId = asId(subscription.customer);
  const userIdFromMeta = resolveUserId(subscription.metadata, null);

  // Two paths to find the user: by stored subscriptionId, or by metadata.userId
  // (corner case — first webhook may arrive before `checkout.session.completed`).
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: subscriptionId },
        userIdFromMeta ? { id: userIdFromMeta } : { id: "__none__" },
      ],
    },
    select: { id: true, plan: true },
  });

  if (!user) {
    console.warn(
      `[stripe webhook] no user matched subscription=${subscriptionId} metaUserId=${userIdFromMeta ?? "none"}`,
    );
    return;
  }

  const planChanged = user.plan !== nextPlan;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: nextPlan,
      ...(planChanged
        ? { leadsProcessedCount: 0, planResetDate: new Date() }
        : {}),
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      stripeSubscriptionId: keepSubscriptionId ? subscriptionId : null,
    },
  });
}

function resolveUserId(
  metadata: Stripe.Metadata | null | undefined,
  fallback: string | null | undefined,
): string | null {
  const meta = metadata?.userId?.trim();
  if (meta) return meta;
  const fb = fallback?.trim();
  return fb ? fb : null;
}

function parsePlanId(value: string | null | undefined): PlanId | null {
  if (value === "PRO" || value === "AGENCY" || value === "STARTER") {
    return value;
  }
  return null;
}

function asId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

function extractSubscriptionFromInvoice(
  invoice: Stripe.Invoice,
): string | { id: string } | null {
  // Stripe SDK 22 змінив форму invoice.subscription (string vs expanded).
  // Беремо як unknown, далі сепарація типів — щоб уникнути падіння типів
  // при оновленні SDK.
  const raw = (invoice as unknown as { subscription?: string | { id: string } | null })
    .subscription;
  return raw ?? null;
}
