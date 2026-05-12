"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createCustomerPortalSession } from "@/src/actions/stripeActions";

/**
 * Веде юзера у Stripe Billing Portal — самообслуговування підписки
 * (картка, інвойси, cancel). Кнопка-secondary (outline) — це налаштування,
 * не основний CTA, тому не претендує на увагу.
 */
export default function ManageSubscriptionButton({
  locale,
}: {
  locale: string;
}) {
  const t = useTranslations("Pricing");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await createCustomerPortalSession(locale);
      if (!res.success || !res.url) {
        setError(res.error ?? "Stripe error");
        return;
      }
      window.location.href = res.url;
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-progress disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-purple-700 dark:hover:bg-purple-500/10 dark:hover:text-purple-300"
      >
        {isPending ? (
          <Spinner />
        ) : (
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M2.5 5.25A2.25 2.25 0 0 1 4.75 3h10.5A2.25 2.25 0 0 1 17.5 5.25v9.5A2.25 2.25 0 0 1 15.25 17H4.75A2.25 2.25 0 0 1 2.5 14.75v-9.5Zm2.25-.75a.75.75 0 0 0-.75.75v1.75h12V5.25a.75.75 0 0 0-.75-.75H4.75ZM16 9H4v5.75c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75V9Z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {isPending ? t("portalLoading") : t("manageSubscription")}
      </button>
      {error && (
        <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
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
