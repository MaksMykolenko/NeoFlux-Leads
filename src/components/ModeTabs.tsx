import Link from "next/link";
import type { LeadModeKey } from "@/src/lib/leadMode";

interface ModeTabsProps {
  active: LeadModeKey;
}

interface TabDef {
  id: LeadModeKey;
  href: string;
  label: string;
  hint: string;
}

const TABS: TabDef[] = [
  {
    id: "local",
    href: "/",
    label: "Локальний бізнес",
    hint: "Google Maps · сайти, телефони",
  },
  {
    id: "beats",
    href: "/?mode=beats",
    label: "Виконавці для бітів",
    hint: "SoundCloud · YouTube · Instagram",
  },
];

export default function ModeTabs({ active }: ModeTabsProps) {
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
            className={`relative px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "text-blue-700"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <div>{tab.label}</div>
            <div className="text-[10px] font-normal text-gray-400 uppercase tracking-wider mt-0.5">
              {tab.hint}
            </div>
            {isActive && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
