"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Банер успішної підписки. Рендериться на dashboard, коли Stripe повертає
 * юзера з `?checkout=success`. Окремо чистимо query-string через
 * `history.replaceState` — щоб після F5 повідомлення не з'являлось знову.
 */
export default function CheckoutSuccessBanner() {
  const t = useTranslations("Pricing");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("checkout")) {
      url.searchParams.delete("checkout");
      window.history.replaceState(
        {},
        "",
        url.pathname + (url.search ? `?${url.searchParams.toString()}` : "") + url.hash,
      );
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <svg
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-10.3a.75.75 0 0 0-1.07-1.05L8.5 10.78 6.95 9.22a.75.75 0 1 0-1.06 1.06l2.08 2.08a.75.75 0 0 0 1.07-.01l4.66-4.65Z"
          clipRule="evenodd"
        />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-emerald-900">
          {t("checkoutSuccessTitle")}
        </p>
        <p className="mt-0.5 text-xs text-emerald-800">
          {t("checkoutSuccessBody")}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label={t("checkoutSuccessClose")}
        className="ml-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-emerald-700 transition hover:bg-emerald-100"
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  );
}
