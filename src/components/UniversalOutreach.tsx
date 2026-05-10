"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { searchUniversalLeads } from "@/src/actions/universalActions";

export default function UniversalOutreach() {
  const router = useRouter();
  const t = useTranslations("UniversalOutreach");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || pending) return;

    setError(null);
    setLastSaved(null);

    startTransition(async () => {
      const res = await searchUniversalLeads(trimmed);
      if (res.success) {
        setLastSaved(res.saved ?? 0);
        router.refresh();
      } else {
        setError(res.error ?? t("searchFailed"));
      }
    });
  }

  return (
    <div id="tour-universal-search" className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          htmlFor="universal-prompt"
          className="block text-sm font-medium text-gray-700"
        >
          {t("promptLabel")}
        </label>
        <textarea
          id="universal-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          disabled={pending}
          placeholder={t("promptPlaceholder")}
          className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending || !prompt.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-violet-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? t("busyInternet") : t("ctaScan")}
          </button>
          {pending && (
            <span className="text-xs text-gray-500">{t("googleWait")}</span>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {lastSaved !== null && !pending && (
        <p className="text-sm text-green-700">
          {t("savedPrefix")}{" "}
          <span className="font-semibold tabular-nums">{lastSaved}</span>{" "}
          {lastSaved === 1 ? t("recordOne") : t("recordMany")}{" "}
          {t("savedSuffix")}
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-gray-400">{t("footerNote")}</p>
    </div>
  );
}
