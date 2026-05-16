/* global React */
const { createElement: h, useState } = React;

// Minimal non-DnD kanban (no @hello-pangea/dnd in the kit). Clicking a card
// opens the lead; the "..." cell action allows status change via prompt.

const STATUSES = ["New", "Qualified", "Contacted", "Replied", "Won", "Lost"];

const COLUMN_ACCENT = {
  New:       "border-l-blue-500",
  Qualified: "border-l-violet-500",
  Contacted: "border-l-amber-500",
  Replied:   "border-l-rose-500",
  Won:       "border-l-emerald-500",
  Lost:      "border-l-red-500"
};

const FUNNEL = {
  New:       "bg-blue-500 dark:bg-blue-400",
  Qualified: "bg-violet-500 dark:bg-violet-400",
  Contacted: "bg-amber-500 dark:bg-amber-400",
  Replied:   "bg-rose-500 dark:bg-rose-400",
  Won:       "bg-emerald-500 dark:bg-emerald-400",
  Lost:      "bg-red-500 dark:bg-red-400"
};

const MODE_BADGE = {
  local:     "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  beats:     "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-500/30",
  universal: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700"
};

function scoreFor(lead) {
  // Mirror of scoring.ts
  let s = 50;
  if (lead.audit?.hasSSL) s -= 30;
  if (lead.audit?.mobileFriendly) s -= 20;
  if (lead.website && /instagram\.com|choiceqr\.(com|app)|linktr\.ee|facebook\.com\/(?!sharer)/i.test(lead.website)) s += 40;
  if (lead.email) s += 10;
  return Math.max(0, Math.min(100, s));
}

function ScoreIndicator({ score }) {
  const tone = score >= 70 ? "high" : score >= 40 ? "mid" : "low";
  const dot  = tone === "high" ? "bg-emerald-500" : tone === "mid" ? "bg-amber-500" : "bg-red-500";
  const text = tone === "high" ? "text-emerald-600 dark:text-emerald-400" : tone === "mid" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
  return h("span", { className: "inline-flex flex-shrink-0 items-center gap-1" }, [
    h("span", { key: "d", className: `inline-block h-1.5 w-1.5 rounded-full ${dot}` }),
    h("span", { key: "t", className: `text-xs font-semibold tabular-nums ${text}` }, score)
  ]);
}

function ModeBadge({ mode }) {
  const cls = MODE_BADGE[mode] || MODE_BADGE.local;
  return h("span", {
    className: `inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ring-1 ring-inset ${cls}`
  }, mode.toUpperCase());
}

function KanbanView({ leads, onOpen, onChangeStatus }) {
  const grouped = STATUSES.reduce((acc, s) => { acc[s] = []; return acc; }, {});
  for (const l of leads) (grouped[l.status] || grouped.New).push(l);

  const total = leads.length;

  return h("div", { className: "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-flux-border dark:bg-flux-card" }, [
    // Funnel
    h("div", { key: "f", className: "border-b border-zinc-100 bg-gradient-to-b from-zinc-50/95 to-white px-5 py-4 dark:border-flux-border dark:from-flux-card/90 dark:to-flux-bg/50" }, [
      h("div", { key: "h", className: "flex flex-wrap items-end justify-between gap-2" }, [
        h("p", { key: "l", className: "text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" }, "Розподіл по воронці"),
        h("p", { key: "t", className: "text-xs tabular-nums text-zinc-600 dark:text-zinc-300" }, `Всього: ${total}`)
      ]),
      h("div", {
        key: "bar",
        className: "mt-2.5 flex h-3 w-full overflow-hidden rounded-full bg-zinc-200/90 ring-1 ring-inset ring-zinc-300/40 dark:bg-zinc-800 dark:ring-zinc-700/50"
      }, STATUSES.map((s) => {
        const n = grouped[s].length;
        if (n === 0) return null;
        return h("div", {
          key: s,
          title: `${s}: ${n}`,
          className: `${FUNNEL[s]} min-w-[6px] shadow-sm transition-[flex-grow] duration-300`,
          style: { flexGrow: n, flexBasis: 0 }
        });
      })),
      h("p", { key: "hint", className: "mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400" },
        "Перетягніть картку між колонками, щоб оновити статус."
      )
    ]),

    // Columns
    h("div", { key: "cols", className: "flex gap-4 overflow-x-auto bg-zinc-50/40 px-4 pb-4 pt-4 dark:bg-flux-bg/40" },
      STATUSES.map((s) => h(KanbanColumn, {
        key: s,
        status: s,
        leads: grouped[s],
        onOpen,
        onChangeStatus
      }))
    )
  ]);
}

function KanbanColumn({ status, leads, onOpen, onChangeStatus }) {
  return h("div", {
    className: `flex w-[17.5rem] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-flux-border dark:bg-flux-card border-l-4 ${COLUMN_ACCENT[status]}`
  }, [
    h("div", { key: "h", className: "flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/80 px-3 py-2.5 dark:border-flux-border dark:bg-flux-card-2/50" }, [
      h("h3", { key: "t", className: "text-[11px] font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200" }, status),
      h("span", {
        key: "c",
        className: "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white px-2 text-[11px] font-semibold tabular-nums text-zinc-600 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700"
      }, leads.length)
    ]),
    h("div", { key: "b", className: "flex min-h-[220px] flex-col gap-2.5 p-2.5 bg-zinc-50/50 dark:bg-flux-bg/30" },
      leads.length === 0
        ? h("div", { className: "flex flex-1 items-center justify-center py-8" },
            h("span", { className: "rounded-md border border-dashed border-zinc-200/80 bg-white/60 px-3 py-2 text-[11px] text-zinc-400 dark:border-zinc-700 dark:bg-flux-card/40 dark:text-zinc-500" }, "Перетягніть сюди")
          )
        : leads.map((lead) => h(KanbanCard, { key: lead.id, lead, onOpen, onChangeStatus }))
    )
  ]);
}

function KanbanCard({ lead, onOpen, onChangeStatus }) {
  const subtitle = lead.category || lead.city;
  return h("div", {
    className: "select-none rounded-lg border bg-white p-3.5 text-sm shadow-sm ring-1 ring-black/[0.03] transition-all dark:bg-flux-card dark:ring-white/5 border-zinc-200/90 hover:border-zinc-300 hover:shadow-md dark:border-flux-border dark:hover:border-zinc-600 cursor-pointer",
    onClick: () => onOpen(lead.id)
  }, [
    h("div", { key: "top", className: "flex flex-col gap-2" }, [
      h("div", { key: "row", className: "flex items-start justify-between gap-2" }, [
        h("p", { key: "t", className: "line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50" }, lead.companyName),
        h(ScoreIndicator, { key: "s", score: scoreFor(lead) })
      ]),
      subtitle && h("p", { key: "sub", className: "line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400" }, subtitle),
      h("div", { key: "ft", className: "flex items-center justify-between gap-2 border-t border-zinc-100 pt-2 dark:border-flux-border" }, [
        h(ModeBadge, { key: "m", mode: lead._mode || "local" }),
        h("button", {
          key: "next",
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            const cur = STATUSES.indexOf(lead.status);
            const next = STATUSES[(cur + 1) % STATUSES.length];
            onChangeStatus(lead.id, next);
          },
          title: "Перевести в наступний статус",
          className: "inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-500/15 dark:hover:text-violet-300"
        }, "→")
      ])
    ])
  ]);
}

Object.assign(window, { KanbanView });
