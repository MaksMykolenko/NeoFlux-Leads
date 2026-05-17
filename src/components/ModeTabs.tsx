"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import type { LeadModeKey } from "@/src/lib/leadMode";

/**
 * `LeadModeKey` covers the public lead-search modes (local/beats/universal).
 * Flux Promote is admin-only and lives at a separate route (`/flux-promote`)
 * — it gets its own tab id `promote` that's not part of LeadModeKey, so the
 * existing mode-dispatch logic in /dashboard stays untouched.
 */
export type ModeTabId = LeadModeKey | "promote";

interface ModeTabsProps {
  active: ModeTabId;
  /**
   * When true, render the admin-only "Flux Promote" tab. The decision must be
   * made server-side by a parent that can inspect the user's role; this
   * component is "use client" and intentionally does not fetch session data
   * itself. Keep `false` for non-admin users to keep the UI surface clean.
   */
  showPromote?: boolean;
}

type ModeTabKey =
  | "localLabel"
  | "localHint"
  | "beatsLabel"
  | "beatsHint"
  | "universalLabel"
  | "universalHint"
  | "promoteLabel"
  | "promoteHint";

interface TabDef {
  id: ModeTabId;
  href: string;
  labelKey: ModeTabKey;
  hintKey: ModeTabKey;
  /** Highlight chip for the admin-only promote tab. */
  variant?: "default" | "promote";
}

const TABS: TabDef[] = [
  {
    id: "local",
    href: "/dashboard",
    labelKey: "localLabel",
    hintKey: "localHint",
  },
  {
    id: "beats",
    href: "/dashboard?mode=beats",
    labelKey: "beatsLabel",
    hintKey: "beatsHint",
  },
  {
    id: "universal",
    href: "/dashboard?mode=universal",
    labelKey: "universalLabel",
    hintKey: "universalHint",
  },
  {
    id: "promote",
    href: "/flux-promote",
    labelKey: "promoteLabel",
    hintKey: "promoteHint",
    variant: "promote",
  },
];

export default function ModeTabs({
  active,
  showPromote = false,
}: ModeTabsProps) {
  const t = useTranslations("ModeTabs");

  const visibleTabs = TABS.filter((tab) =>
    tab.id === "promote" ? showPromote : true,
  );

  return (
    <div
      id="tour-mode-tabs"
      className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-flux-border"
    >
      {visibleTabs.map((tab) => {
        const isActive = active === tab.id;
        const isPromote = tab.variant === "promote";
        const baseLabel = isActive
          ? "text-purple-600 dark:text-purple-400"
          : isPromote
            ? "text-purple-700 dark:text-flux-purple-soft hover:text-purple-900 dark:hover:text-flux-purple"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`relative px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-900 ${baseLabel}`}
          >
            <div className="flex items-center gap-1.5">
              {isPromote && <PromoteIcon className="h-3 w-3" />}
              {t(tab.labelKey)}
            </div>
            <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t(tab.hintKey)}
            </div>
            {isActive && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-purple-500" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

function PromoteIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M10 1.5a.75.75 0 0 1 .67.41l1.96 3.97 4.38.64a.75.75 0 0 1 .42 1.28l-3.17 3.09.75 4.36a.75.75 0 0 1-1.09.79L10 13.93l-3.92 2.06a.75.75 0 0 1-1.09-.79l.75-4.36-3.17-3.09a.75.75 0 0 1 .42-1.28l4.38-.64L9.33 1.91A.75.75 0 0 1 10 1.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
