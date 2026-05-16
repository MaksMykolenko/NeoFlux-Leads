/* global React, ChevronDown, Spinner */
const { createElement: h, useState } = React;

const STATUSES = ["New", "Qualified", "Contacted", "Replied", "Won", "Lost"];

const STYLES = {
  New:       "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
  Qualified: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
  Contacted: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  Replied:   "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  Won:       "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  Lost:      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30"
};

function statusClasses(status) {
  return STYLES[status] || "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700";
}

function StatusPill({ status }) {
  return h("span", {
    className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusClasses(status)}`
  }, status);
}

function StatusPicker({ status, onChange }) {
  const [pending, setPending] = useState(false);
  function handleChange(e) {
    const next = e.target.value;
    setPending(true);
    setTimeout(() => { onChange(next); setPending(false); }, 350);
  }
  return h("div", { className: "relative inline-flex items-center" }, [
    h("select", {
      key: "sel",
      value: status,
      onChange: handleChange,
      disabled: pending,
      "aria-label": "Статус ліда",
      className: `appearance-none cursor-pointer rounded-full pl-3.5 pr-9 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 disabled:cursor-wait disabled:opacity-60 ${statusClasses(status)}`
    }, STATUSES.map((s) => h("option", {
      key: s, value: s,
      className: "bg-white text-zinc-900 dark:bg-flux-card dark:text-zinc-50"
    }, s))),
    h("span", { key: "ico", className: "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" },
      pending
        ? h(Spinner, { className: "h-3.5 w-3.5 opacity-70" })
        : h(ChevronDown, { className: "h-3.5 w-3.5 opacity-70" })
    )
  ]);
}

Object.assign(window, { StatusPill, StatusPicker, STATUSES });
