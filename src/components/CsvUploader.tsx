"use client";

import { useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import { useRouter } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  importLeads,
  type ImportLeadInput,
} from "@/src/actions/importActions";

const ACCEPTED_KEYS = [
  "companyName",
  "company_name",
  "company",
  "name",
  "title",
  "website",
  "site",
  "url",
  "email",
  "e-mail",
  "phone",
  "tel",
  "telephone",
  "notes",
  "note",
  "description",
] as const;

type RawRow = Record<string, unknown>;

export default function CsvUploader() {
  const t = useTranslations("CsvUploader");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    | { type: "success" | "error" | "info"; msg: string }
    | null
  >(null);

  function handleFile(file: File) {
    setFeedback({ type: "info", msg: t("parsing") });

    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (result) => {
        const rows = (result.data ?? []).map(toImportRow).filter(notEmpty);
        if (rows.length === 0) {
          setFeedback({ type: "error", msg: t("noRows") });
          return;
        }
        startTransition(async () => {
          const res = await importLeads(rows);
          if (res.success) {
            setFeedback({
              type: "success",
              msg: t("imported", {
                imported: res.imported ?? 0,
                skipped: res.skipped ?? 0,
              }),
            });
            router.refresh();
          } else {
            setFeedback({
              type: "error",
              msg: res.error ?? t("importFailed"),
            });
          }
        });
      },
      error: (err) => {
        setFeedback({ type: "error", msg: `${t("parseError")}: ${err.message}` });
      },
    });
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
    // дозволяємо вибрати той самий файл повторно
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFeedback({ type: "error", msg: t("notCsv") });
      return;
    }
    handleFile(file);
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
          UNIVERSAL
        </span>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center transition-all duration-200 hover:border-cyan-400 hover:bg-cyan-50/40 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-cyan-500 dark:hover:bg-cyan-500/5 ${
          isPending ? "opacity-60" : ""
        }`}
      >
        <CsvIcon className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
        <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {isPending ? t("importing") : t("dropOrClick")}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {t("expectedColumns")}
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        onChange={onPickFile}
        disabled={isPending}
        className="hidden"
      />

      {feedback && (
        <div
          className={`mt-3 rounded-md border px-3 py-2 text-xs ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : feedback.type === "error"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

function toImportRow(row: RawRow): ImportLeadInput | null {
  if (!row || typeof row !== "object") return null;
  const norm: Record<string, string> = {};
  for (const [key, val] of Object.entries(row)) {
    if (typeof val !== "string" && typeof val !== "number") continue;
    const k = key.toLowerCase().trim();
    if (!ACCEPTED_KEYS.includes(k as (typeof ACCEPTED_KEYS)[number])) continue;
    norm[k] = String(val).trim();
  }
  const companyName =
    norm["companyname"] ??
    norm["company_name"] ??
    norm["company"] ??
    norm["name"] ??
    norm["title"];
  const website = norm["website"] ?? norm["site"] ?? norm["url"];
  const email = norm["email"] ?? norm["e-mail"];
  const phone = norm["phone"] ?? norm["tel"] ?? norm["telephone"];
  const notes = norm["notes"] ?? norm["note"] ?? norm["description"];

  if (!companyName && !website && !email) return null;
  return {
    companyName: companyName ?? null,
    website: website ?? null,
    email: email ?? null,
    phone: phone ?? null,
    notes: notes ?? null,
  };
}

function notEmpty(v: ImportLeadInput | null): v is ImportLeadInput {
  return v !== null;
}

function CsvIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 13h6m-6 4h6m-7-9V3l5 5h-4a1 1 0 0 1-1-1Zm-3 14a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v12a2 2 0 0 1-2 2H6Z"
      />
    </svg>
  );
}
