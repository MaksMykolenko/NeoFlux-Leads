"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { searchAndSaveLeads } from "@/src/actions/leadActions";
import { Link, useRouter } from "@/src/i18n/navigation";

type Status =
  | { type: null; msg: "" }
  | { type: "info" | "success" | "error"; msg: string }
  | { type: "blocked"; plan: string };

export default function ScraperForm() {
  const t = useTranslations("ScraperForm");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>({ type: null, msg: "" });
  const router = useRouter();

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!query || !city) return;

    setLoading(true);
    setStatus({ type: "info", msg: t("helperChrome") });

    try {
      const result = await searchAndSaveLeads(query, city);

      if (result.success) {
        setStatus(
          result.count > 0
            ? { type: "success", msg: t("toastAdded", { count: result.count }) }
            : { type: "info", msg: t("toastDup") },
        );
        setQuery("");
        router.refresh();
      } else if (result.errorCode === "LIMIT_REACHED") {
        setStatus({ type: "blocked", plan: t.raw("blockedTitle") as string });
      } else {
        setStatus({
          type: "error",
          msg: t("toastErr", { message: result.error ?? "?" }),
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        msg: t("toastErr", {
          message: err instanceof Error ? err.message : "Server action failed",
        }),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id="tour-search-form"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <form onSubmit={handleScrape} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <Field label={t("nicheLabel")}>
          <input
            type="text"
            placeholder={t("nichePlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </Field>
        <Field label={t("cityLabel")}>
          <input
            type="text"
            placeholder={t("cityPlaceholder")}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </Field>
        <Field label=" ">
          <button
            type="submit"
            disabled={loading || !query || !city}
            className="inline-flex h-[42px] min-w-[140px] items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4 animate-spin" />
                <span>{t("submitBusy")}</span>
              </>
            ) : (
              <>
                <SearchIcon className="h-4 w-4" />
                <span>{t("submitIdle")}</span>
              </>
            )}
          </button>
        </Field>
      </form>

      {status.type === "blocked" && (
        <BlockedBanner planName={status.plan} />
      )}

      {status.type && status.type !== "blocked" && status.msg && (
        <Banner type={status.type}>{status.msg}</Banner>
      )}
    </div>
  );
}

const inputClass =
  "block w-full rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:opacity-60";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Banner({
  type,
  children,
}: {
  type: "info" | "success" | "error";
  children: React.ReactNode;
}) {
  const cls =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : type === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-purple-200 bg-purple-50 text-purple-800";
  return (
    <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${cls}`}>
      {children}
    </div>
  );
}

function BlockedBanner({ planName }: { planName: string }) {
  const t = useTranslations("ScraperForm");
  return (
    <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <div>
        <p className="font-semibold text-amber-900">{planName}</p>
        <p className="mt-0.5 text-xs text-amber-800">
          {t("blockedBody", { plan: planName })}
        </p>
      </div>
      <Link
        href="/pricing"
        className="inline-flex h-8 items-center rounded-md bg-amber-900 px-3 text-xs font-medium text-white transition hover:bg-amber-950"
      >
        {t("blockedCta")} →
      </Link>
    </div>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 3.32 9.876l3.652 3.651a.75.75 0 1 0 1.06-1.06l-3.65-3.652A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
