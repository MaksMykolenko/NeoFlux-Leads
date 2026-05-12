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
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
          className="block w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-flux-border dark:bg-flux-card dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending || !prompt.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? t("busyInternet") : t("ctaScan")}
          </button>
          {pending && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{t("googleWait")}</span>
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

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">{t("footerNote")}</p>
    </div>
  );
}
