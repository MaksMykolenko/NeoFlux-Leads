import "server-only";
import Stripe from "stripe";

/**
 * Серверний Stripe клієнт. Ініціалізується лінізиво — щоб build-time
 * (next build) не падав, якщо STRIPE_SECRET_KEY не виставлений у CI.
 *
 * Версія API закріплена явно (а не на актуальній на момент SDK) — так
 * Stripe гарантує, що оновлення нашої залежності `stripe` не змінять
 * формат відповіді мовчазно.
 */

// SDK тип `LatestApiVersion` обмежений рівно одним рядком (актуальна версія),
// але runtime Stripe приймає будь-яку валідну попередню версію. Каст до
// типу другого аргумента конструктора — мінімальне послаблення TS, щоб
// закріпити версію, яку явно затверджував архітектор.
type StripeOptions = ConstructorParameters<typeof Stripe>[1];
const API_VERSION = "2024-04-10" as NonNullable<StripeOptions>["apiVersion"];

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY не налаштовано. Додайте ключ у .env (sk_test_* / sk_live_*).",
    );
  }
  cached = new Stripe(key, { apiVersion: API_VERSION });
  return cached;
}
