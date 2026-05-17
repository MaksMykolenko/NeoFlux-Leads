"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { searchAndSaveLeads } from "@/src/actions/leadActions";

const LANGUAGE_OPTIONS = ["Polish", "English", "Ukrainian"] as const;

export default function OnboardingFirstSearch() {
  const t = useTranslations("FirstSearch");
  const router = useRouter();
  const [niche, setNiche] = useState("dentists");
  const [city, setCity] = useState("Warsaw");
  const [service, setService] = useState("website redesign");
  const [language, setLanguage] = useState<(typeof LANGUAGE_OPTIONS)[number]>(
    "Polish",
  );
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!niche.trim() || !city.trim()) return;

    setMessage({ type: "info", text: t("searching") });
    startTransition(async () => {
      const result = await searchAndSaveLeads(niche, city, null, {
        service,
        language,
      });

      if (result.success) {
        setMessage({
          type: result.count > 0 ? "success" : "info",
          text:
            result.count > 0
              ? t("success", { count: result.count })
              : t("empty"),
        });
        router.refresh();
        return;
      }

      setMessage({
        type: "error",
        text: result.error ?? t("error"),
      });
    });
  }

  return (
    <section className="rounded-2xl border border-purple-200 bg-gradient-to-br from-white to-purple-50/70 p-5 shadow-sm dark:border-flux-purple/30 dark:from-flux-card dark:to-flux-purple/10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-flux-purple-soft">
            {t("eyebrow")}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-purple-700 ring-1 ring-purple-200 dark:bg-flux-card-2 dark:text-flux-purple-soft dark:ring-flux-purple/30">
          {t("badge")}
        </span>
      </div>

      <form
        onSubmit={submit}
        className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_0.8fr_auto]"
      >
        <Field label={t("niche")}>
          <input
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </Field>
        <Field label={t("city")}>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </Field>
        <Field label={t("service")}>
          <input
            value={service}
            onChange={(event) => setService(event.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </Field>
        <Field label={t("language")}>
          <select
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as (typeof LANGUAGE_OPTIONS)[number])
            }
            disabled={isPending}
            className={inputClass}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`languageOptions.${option}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label=" ">
          <button
            type="submit"
            disabled={isPending || !niche.trim() || !city.trim()}
            className="inline-flex h-[42px] w-full min-w-[170px] items-center justify-center rounded-xl bg-purple-600 px-5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(168,85,247,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-purple-300 disabled:shadow-none dark:bg-flux-purple dark:hover:bg-flux-purple-hover"
          >
            {isPending ? t("busy") : t("submit")}
          </button>
        </Field>
      </form>

      {message && (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
              : message.type === "error"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                : "border-purple-200 bg-purple-50 text-purple-800 dark:border-flux-purple-ring dark:bg-flux-purple-tint dark:text-flux-purple-soft"
          }`}
        >
          {message.text}
        </div>
      )}
    </section>
  );
}

const inputClass =
  "block h-[42px] w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 transition-all duration-200 placeholder:text-zinc-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-flux-bg dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-purple-500 dark:focus:bg-zinc-900 dark:focus:ring-purple-500/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}
