"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import type { LeadModeKey } from "@/src/lib/leadMode";

interface ModeTabsProps {
  active: LeadModeKey;
}

type ModeTabKey =
  | "localLabel"
  | "localHint"
  | "beatsLabel"
  | "beatsHint"
  | "universalLabel"
  | "universalHint";

interface TabDef {
  id: LeadModeKey;
  href: string;
  labelKey: ModeTabKey;
  hintKey: ModeTabKey;
}

const TABS: TabDef[] = [
  {
    id: "local",
    href: "/",
    labelKey: "localLabel",
    hintKey: "localHint",
  },
  {
    id: "beats",
    href: "/?mode=beats",
    labelKey: "beatsLabel",
    hintKey: "beatsHint",
  },
  {
    id: "universal",
    href: "/?mode=universal",
    labelKey: "universalLabel",
    hintKey: "universalHint",
  },
];

export default function ModeTabs({ active }: ModeTabsProps) {
  const t = useTranslations("ModeTabs");

  return (
    <div
      id="tour-mode-tabs"
      className="flex flex-wrap gap-2 border-b border-gray-200"
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`relative px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:bg-gray-50 ${
              isActive
                ? "text-purple-700"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <div>{t(tab.labelKey)}</div>
            <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-gray-400">
              {t(tab.hintKey)}
            </div>
            {isActive && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-purple-600" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
