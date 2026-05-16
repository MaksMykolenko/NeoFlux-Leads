"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  upsertAutopilotConfig,
  toggleAutopilotConfig,
  deleteAutopilotConfig,
  type AutopilotConfigRow,
} from "@/src/actions/autopilotActions";

type ModeKey = "LOCAL" | "BEATS" | "UNIVERSAL";

const MODES: ModeKey[] = ["LOCAL", "BEATS", "UNIVERSAL"];
const LANGUAGES = ["English", "Ukrainian", "Polish", "German"];
const CHANNELS = ["email", "telegram"] as const;
type Channel = (typeof CHANNELS)[number];

interface FormState {
  searchQuery: string;
  targetRegion: string;
  outputLanguage: string;
  channels: Channel[];
  maxLeadsPerDay: number;
  isActive: boolean;
}

function emptyForm(): FormState {
  return {
    searchQuery: "",
    targetRegion: "",
    outputLanguage: "English",
    channels: ["email"],
    maxLeadsPerDay: 10,
    isActive: false,
  };
}

function configToForm(c: AutopilotConfigRow): FormState {
  return {
    searchQuery: c.searchQuery,
    targetRegion: c.targetRegion ?? "",
    outputLanguage: c.outputLanguage,
    channels: c.channels.filter((ch): ch is Channel =>
      (CHANNELS as readonly string[]).includes(ch),
    ),
    maxLeadsPerDay: c.maxLeadsPerDay,
    isActive: c.isActive,
  };
}

export default function AutopilotConfigForm({
  initialConfigs,
  telegramReady,
}: {
  initialConfigs: AutopilotConfigRow[];
  telegramReady: boolean;
}) {
  const t = useTranslations("Autopilot");
  const [configs, setConfigs] = useState<AutopilotConfigRow[]>(initialConfigs);
  const [activeMode, setActiveMode] = useState<ModeKey>("LOCAL");

  const existing = configs.find((c) => c.mode === activeMode) ?? null;
  const [form, setForm] = useState<FormState>(
    existing ? configToForm(existing) : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  function switchMode(next: ModeKey) {
    setActiveMode(next);
    const c = configs.find((x) => x.mode === next);
    setForm(c ? configToForm(c) : emptyForm());
    setError(null);
    setInfo(null);
  }

  function toggleChannel(ch: Channel) {
    setForm((s) => ({
      ...s,
      channels: s.channels.includes(ch)
        ? s.channels.filter((c) => c !== ch)
        : [...s.channels, ch],
    }));
  }

  function onSave() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await upsertAutopilotConfig({
        mode: activeMode,
        searchQuery: form.searchQuery,
        targetRegion: form.targetRegion.trim() || null,
        outputLanguage: form.outputLanguage,
        channels: form.channels,
        maxLeadsPerDay: form.maxLeadsPerDay,
        isActive: form.isActive,
      });
      if (!res.success || !res.id) {
        setError(res.error ?? t("errSaveFailed"));
        return;
      }
      const fresh: AutopilotConfigRow = {
        id: res.id,
        mode: activeMode,
        searchQuery: form.searchQuery,
        targetRegion: form.targetRegion.trim() || null,
        outputLanguage: form.outputLanguage,
        channels: form.channels,
        maxLeadsPerDay: form.maxLeadsPerDay,
        isActive: form.isActive,
        createdAt: existing?.createdAt ?? new Date(),
        updatedAt: new Date(),
      };
      setConfigs((prev) => {
        const without = prev.filter((c) => c.mode !== activeMode);
        return [...without, fresh].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
      });
      setInfo(t("infoSaved"));
    });
  }

  function onToggleActive() {
    if (!existing) return;
    const nextActive = !form.isActive;
    setForm((s) => ({ ...s, isActive: nextActive }));
    startTransition(async () => {
      const res = await toggleAutopilotConfig(existing.id, nextActive);
      if (!res.success) {
        setForm((s) => ({ ...s, isActive: !nextActive }));
        setError(res.error ?? t("errToggleFailed"));
        return;
      }
      setConfigs((prev) =>
        prev.map((c) =>
          c.id === existing.id ? { ...c, isActive: nextActive } : c,
        ),
      );
    });
  }

  function onDelete() {
    if (!existing) return;
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      const res = await deleteAutopilotConfig(existing.id);
      if (!res.success) {
        setError(res.error ?? t("errDeleteFailed"));
        return;
      }
      setConfigs((prev) => prev.filter((c) => c.id !== existing.id));
      setForm(emptyForm());
      setInfo(t("infoDeleted"));
    });
  }

  return (
    <div className="space-y-6">
      <ModeTabs active={activeMode} configs={configs} onChange={switchMode} t={t} />

      <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-flux-border dark:bg-flux-card">
        <Field label={t("searchQueryLabel")} hint={t("searchQueryHint")}>
          <input
            type="text"
            value={form.searchQuery}
            onChange={(e) =>
              setForm((s) => ({ ...s, searchQuery: e.target.value }))
            }
            disabled={isSubmitting}
            placeholder={t(`searchQueryPlaceholder.${activeMode}`)}
            className={INPUT}
          />
        </Field>

        <Field label={t("targetRegionLabel")} hint={t("targetRegionHint")}>
          <input
            type="text"
            value={form.targetRegion}
            onChange={(e) =>
              setForm((s) => ({ ...s, targetRegion: e.target.value }))
            }
            disabled={isSubmitting}
            placeholder={t("targetRegionPlaceholder")}
            className={INPUT}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("outputLanguageLabel")} hint={t("outputLanguageHint")}>
            <select
              value={form.outputLanguage}
              onChange={(e) =>
                setForm((s) => ({ ...s, outputLanguage: e.target.value }))
              }
              disabled={isSubmitting}
              className={INPUT}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {t(`language.${lang}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("maxPerDayLabel")} hint={t("maxPerDayHint")}>
            <input
              type="number"
              min={1}
              max={500}
              value={form.maxLeadsPerDay}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  maxLeadsPerDay: Number.parseInt(e.target.value, 10) || 1,
                }))
              }
              disabled={isSubmitting}
              className={INPUT}
            />
          </Field>
        </div>

        <Field label={t("channelsLabel")} hint={t("channelsHint")}>
          <div className="grid gap-2 sm:grid-cols-2">
            <ChannelCheckbox
              checked={form.channels.includes("email")}
              onChange={() => toggleChannel("email")}
              label={t("channelEmail")}
              disabled={isSubmitting}
            />
            <ChannelCheckbox
              checked={form.channels.includes("telegram")}
              onChange={() => toggleChannel("telegram")}
              label={t("channelTelegram")}
              disabled={isSubmitting || !telegramReady}
              warning={!telegramReady ? t("telegramNotReady") : undefined}
            />
          </div>
        </Field>

        <div className="flex flex-col gap-3 border-t border-zinc-100 pt-5 dark:border-flux-border sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                existing
                  ? onToggleActive()
                  : setForm((s) => ({ ...s, isActive: e.target.checked }))
              }
              disabled={isSubmitting}
              className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-purple-500 focus:ring-purple-500 dark:border-flux-border-strong dark:bg-flux-bg"
            />
            <span className="font-medium text-zinc-900 dark:text-flux-text">
              {t("activeLabel")}
            </span>
            <span className="text-xs text-zinc-500 dark:text-flux-muted">
              {t("activeHint")}
            </span>
          </label>

          <div className="flex gap-2">
            {existing && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 active:scale-95 disabled:opacity-60 dark:border-flux-border dark:bg-flux-card dark:text-flux-text dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                {t("delete")}
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-purple-600 px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-purple-700 active:scale-95 disabled:opacity-60 dark:bg-flux-purple dark:hover:bg-flux-purple-hover"
            >
              {isSubmitting ? t("saving") : t("save")}
            </button>
          </div>
        </div>

        {info && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {info}
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

const INPUT =
  "block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60 dark:border-flux-border-strong dark:bg-flux-bg dark:text-flux-text dark:placeholder:text-zinc-500 dark:focus:border-flux-purple";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-flux-muted">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-zinc-500 dark:text-flux-muted">
          {hint}
        </span>
      )}
    </label>
  );
}

function ChannelCheckbox({
  checked,
  onChange,
  label,
  warning,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  warning?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors ${
        checked
          ? "border-purple-400 bg-purple-50/40 dark:border-flux-purple dark:bg-flux-purple-tint"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-flux-border dark:bg-flux-bg dark:hover:border-flux-border-strong"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-zinc-300 text-purple-500 focus:ring-purple-500 dark:border-flux-border-strong dark:bg-flux-bg"
      />
      <div className="min-w-0">
        <span className="block text-sm font-medium text-zinc-900 dark:text-flux-text">
          {label}
        </span>
        {warning && (
          <span className="mt-0.5 block text-[11px] text-amber-700 dark:text-amber-300">
            {warning}
          </span>
        )}
      </div>
    </label>
  );
}

function ModeTabs({
  active,
  configs,
  onChange,
  t,
}: {
  active: ModeKey;
  configs: AutopilotConfigRow[];
  onChange: (m: ModeKey) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-flux-border dark:bg-flux-card">
      {MODES.map((m) => {
        const isActive = m === active;
        const cfg = configs.find((c) => c.mode === m);
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-purple-600 text-white dark:bg-flux-purple"
                : "text-zinc-700 hover:bg-zinc-50 dark:text-flux-text dark:hover:bg-flux-bg"
            }`}
          >
            <span>{t(`modeName.${m}`)}</span>
            {cfg?.isActive && (
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-white" : "bg-emerald-500"
                }`}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
