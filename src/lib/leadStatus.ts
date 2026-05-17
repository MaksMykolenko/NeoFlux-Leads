export const LEAD_STATUSES = [
  "New",
  "Qualified",
  "Contacted",
  "Replied",
  "Won",
  "Lost",
  "Do not contact",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

// Світла + темна теми. Кожен ключ декларує обидва варіанти, щоб у dark mode
// не вилазили світло-пастельні бекграунди. Replied — rose (warm),
// розрізняється з primary brand cyan.
const STATUS_STYLES: Record<LeadStatus, string> = {
  New: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
  Qualified:
    "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
  Contacted:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  Replied:
    "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  Won: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  Lost: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
  "Do not contact":
    "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
};

export function getStatusClasses(status: string): string {
  if (isLeadStatus(status)) return STATUS_STYLES[status];
  return "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700";
}

/** Ліва смуга колонки канбану — узгоджено з палітрою статусів. */
export const KANBAN_COLUMN_ACCENT: Record<LeadStatus, string> = {
  New: "border-l-4 border-l-blue-500",
  Qualified: "border-l-4 border-l-violet-500",
  Contacted: "border-l-4 border-l-amber-500",
  Replied: "border-l-4 border-l-rose-500",
  Won: "border-l-4 border-l-emerald-500",
  Lost: "border-l-4 border-l-red-500",
  "Do not contact": "border-l-4 border-l-zinc-500",
};

/** Сегменти стрічки воронки (розподіл за статусами). */
export const KANBAN_FUNNEL_SEGMENT: Record<LeadStatus, string> = {
  New: "bg-blue-500 dark:bg-blue-400",
  Qualified: "bg-violet-500 dark:bg-violet-400",
  Contacted: "bg-amber-500 dark:bg-amber-400",
  Replied: "bg-rose-500 dark:bg-rose-400",
  Won: "bg-emerald-500 dark:bg-emerald-400",
  Lost: "bg-red-500 dark:bg-red-400",
  "Do not contact": "bg-zinc-500 dark:bg-zinc-400",
};
