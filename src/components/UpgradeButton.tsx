"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createCheckoutSession } from "@/src/actions/stripeActions";

export default function UpgradeButton({
  priceId,
  locale,
  label,
  className,
}: {
  priceId: string;
  locale: string;
  label: string;
  className?: string;
}) {
  const t = useTranslations("Pricing");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await createCheckoutSession(priceId, locale);
      if (!res.success || !res.url) {
        setError(res.error ?? "Stripe error");
        return;
      }
      // Не через router.push — Stripe Checkout живе на чужому домені,
      // тож тільки повноцінний browser-redirect доведе юзера туди.
      window.location.href = res.url;
    });
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className={`${className ?? ""} active:scale-95 disabled:cursor-progress disabled:opacity-70`}
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            {t("checkoutLoading")}
          </span>
        ) : (
          label
        )}
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
