"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  bulkDeleteLeads,
  bulkRunAudit,
  bulkUpdateStatus,
} from "@/src/actions/bulkActions";
import { LEAD_STATUSES, type LeadStatus } from "@/src/lib/leadStatus";
import type { LeadMode } from "@/src/lib/leadMode";
import LeadTableRow from "@/src/components/LeadTableRow";
import LeadViewToggle from "@/src/components/LeadViewToggle";

export interface SectionLead {
  id: string;
  mode: LeadMode;
  companyName: string;
  category: string | null;
  city: string | null;
  website: string | null;
  socialLinks?: unknown;
  status: string;
  source: string | null;
  followers: number | null;
  lookingForType: boolean | null;
  notes?: string | null;
  audit: { issues: string[] } | null;
}

interface LeadsTableSectionProps {
  leads: SectionLead[];
  isBeats: boolean;
  isUniversal: boolean;
  title: string;
}

/**
 * Клієнтська обгортка над таблицею лідів. Тримає стейт виділених рядків,
 * рендерить bulk-action панель і саму таблицю. Server-сторінка передає
 * вже завантажений масив — обчислення там, оптимізація тут.
 */
export default function LeadsTableSection({
  leads,
  isBeats,
  isUniversal,
  title,
}: LeadsTableSectionProps) {
  const t = useTranslations("LeadsTableSection");
  const tHome = useTranslations("Home");
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    | { type: "success" | "error"; msg: string }
    | null
  >(null);

  const selectedCount = selectedIds.size;
  const allSelected = leads.length > 0 && selectedIds.size === leads.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleOne(id: string, next: boolean) {
    setSelectedIds((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(id);
      else updated.delete(id);
      return updated;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      if (prev.size === leads.length) return new Set();
      return new Set(leads.map((l) => l.id));
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const selectedArr = useMemo(() => Array.from(selectedIds), [selectedIds]);

  function runBulkAudit() {
    setFeedback(null);
    startTransition(async () => {
      const res = await bulkRunAudit(selectedArr);
      if (res.success) {
        setFeedback({
          type: "success",
          msg: t("auditDone", {
            ok: res.succeeded ?? 0,
            total: res.attempted ?? 0,
          }),
        });
        clearSelection();
        router.refresh();
      } else {
        setFeedback({ type: "error", msg: res.error ?? t("genericError") });
      }
    });
  }

  function runBulkStatus(status: LeadStatus) {
    setFeedback(null);
    startTransition(async () => {
      const res = await bulkUpdateStatus(selectedArr, status);
      if (res.success) {
        setFeedback({
          type: "success",
          msg: t("statusChanged", { count: res.count ?? 0, status }),
        });
        clearSelection();
        router.refresh();
      } else {
        setFeedback({ type: "error", msg: res.error ?? t("genericError") });
      }
    });
  }

  function runBulkDelete() {
    if (
      !window.confirm(
        t("confirmDelete", { count: selectedArr.length }),
      )
    ) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await bulkDeleteLeads(selectedArr);
      if (res.success) {
        setFeedback({
          type: "success",
          msg: t("deleted", { count: res.count ?? 0 }),
        });
        clearSelection();
        router.refresh();
      } else {
        setFeedback({ type: "error", msg: res.error ?? t("genericError") });
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {leads.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 ">
              {leads.length}
            </span>
          )}
          <LeadViewToggle active="table" />
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-200 bg-purple-50 px-6 py-2.5 dark:border-purple-500/30 dark:bg-purple-500/10">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-purple-900 dark:text-purple-200">
              {t("selected", { count: selectedCount })}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-purple-700 hover:text-purple-900 hover:underline dark:text-purple-300 dark:hover:text-purple-200"
            >
              {t("clear")}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isBeats && (
              <button
                type="button"
                onClick={runBulkAudit}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-300 transition-all duration-200 hover:bg-purple-100 active:scale-95 disabled:opacity-60 dark:bg-zinc-900 dark:text-purple-300 dark:ring-purple-500/40 dark:hover:bg-purple-500/10"
              >
                {t("auditSelected")}
              </button>
            )}
            <StatusDropdown disabled={isPending} onPick={runBulkStatus} />
            <button
              type="button"
              onClick={runBulkDelete}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-red-700 active:scale-95 disabled:opacity-60 dark:bg-red-500 dark:hover:bg-red-600"
            >
              {t("delete")}
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`border-b px-6 py-2 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="h-12 w-12 text-zinc-300 dark:text-zinc-700 "
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {isBeats ? tHome("emptyTitleBeats") : tHome("emptyTitleOther")}
          </p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            {tHome("emptyHint")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    aria-label={t("selectAll")}
                    className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-purple-500 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {isBeats
                    ? tHome("colArtist")
                    : isUniversal
                      ? tHome("colName")
                      : tHome("colCompany")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {isBeats
                    ? tHome("colGenre")
                    : isUniversal
                      ? tHome("colDesc")
                      : tHome("colCategory")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {isBeats ? tHome("colProfile") : tHome("colSite")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {tHome("colStatus")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {isBeats ? tHome("colAudience") : tHome("colAudit")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {leads.map((lead) => (
                <LeadTableRow
                  key={lead.id}
                  lead={lead}
                  selection={{
                    selected: selectedIds.has(lead.id),
                    onToggle: toggleOne,
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusDropdown({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (status: LeadStatus) => void;
}) {
  const t = useTranslations("LeadsTableSection");
  return (
    <div className="relative">
      <select
        disabled={disabled}
        onChange={(e) => {
          const value = e.target.value;
          if (value) {
            onPick(value as LeadStatus);
            e.target.value = "";
          }
        }}
        defaultValue=""
        className="appearance-none rounded-md border border-purple-300 bg-white px-3 py-1.5 pr-7 text-xs font-medium text-purple-700 transition-all duration-200 hover:bg-purple-100 disabled:opacity-60 dark:border-purple-500/40 dark:bg-zinc-900 dark:text-purple-300 dark:hover:bg-purple-500/10"
      >
        <option value="" disabled>
          {t("changeStatus")}
        </option>
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
