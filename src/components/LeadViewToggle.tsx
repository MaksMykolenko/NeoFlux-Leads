"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import { useSearchParams } from "next/navigation";

export type LeadView = "table" | "board";

/**
 * Toggle "Таблиця | Дошка" — оновлює `?view=` searchParam, не зачіпаючи
 * інших параметрів URL (mode, etc). Через transition серверний компонент
 * перерендеритиметься автоматично.
 */
export default function LeadViewToggle({ active }: { active: LeadView }) {
  const t = useTranslations("LeadViewToggle");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setView(next: LeadView) {
    if (next === active) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "table") {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div
      role="tablist"
      aria-label={t("ariaLabel")}
      className="inline-flex shrink-0 items-center rounded-full border border-zinc-200/90 bg-zinc-50/90 p-1 text-xs shadow-sm ring-1 ring-black/[0.04] dark:border-flux-border dark:bg-zinc-900/40 dark:ring-white/[0.06]"
    >
      <ToggleButton
        label={t("table")}
        active={active === "table"}
        disabled={isPending}
        onClick={() => setView("table")}
        icon={<TableIcon />}
      />
      <ToggleButton
        label={t("board")}
        active={active === "board"}
        disabled={isPending}
        onClick={() => setView("board")}
        icon={<BoardIcon />}
      />
    </div>
  );
}

function ToggleButton({
  label,
  active,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-all duration-200 ${
        active
          ? "bg-purple-600 text-white shadow-sm dark:bg-flux-purple dark:text-white"
          : "text-zinc-600 hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-flux-card dark:hover:text-zinc-100"
      } disabled:cursor-wait disabled:opacity-60`}
    >
      {icon}
      {label}
    </button>
  );
}

function TableIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5V7H3V4.5ZM3 8.5h14V12H3V8.5Zm0 5h14v2A1.5 1.5 0 0 1 15.5 17h-11A1.5 1.5 0 0 1 3 15.5v-2Z" />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3H7v14H4.5A1.5 1.5 0 0 1 3 15.5v-11ZM8.5 3h3v9h-3V3Zm4.5 0h2.5A1.5 1.5 0 0 1 17 4.5v6h-4V3Z" />
    </svg>
  );
}
