/* global React, ChevronDown, Spinner */
const { createElement: h, useState } = React;

const STATUSES = ["New", "Qualified", "Contacted", "Replied", "Won", "Lost"];

const STYLES = {
  New:       "bg-blue-50 text-blue-700 ring-blue-200",
  Qualified: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Contacted: "bg-amber-50 text-amber-700 ring-amber-200",
  Replied:   "bg-purple-50 text-purple-700 ring-purple-200",
  Won:       "bg-green-50 text-green-700 ring-green-200",
  Lost:      "bg-red-50 text-red-700 ring-red-200"
};

function statusClasses(status) {
  return STYLES[status] || "bg-gray-50 text-gray-700 ring-gray-200";
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
    setTimeout(() => {
      onChange(next);
      setPending(false);
    }, 350);
  }

  return h("div", { className: "relative inline-flex items-center" }, [
    h("select", {
      key: "sel",
      value: status,
      onChange: handleChange,
      disabled: pending,
      "aria-label": "Статус ліда",
      className: `appearance-none cursor-pointer rounded-full pl-3.5 pr-9 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:cursor-wait disabled:opacity-60 ${statusClasses(status)}`
    }, STATUSES.map((s) => h("option", { key: s, value: s, className: "bg-white text-gray-900" }, s))),
    h("span", {
      key: "ico",
      className: "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
    }, pending
      ? h(Spinner, { className: "h-3.5 w-3.5 opacity-70" })
      : h(ChevronDown, { className: "h-3.5 w-3.5 opacity-70" })
    )
  ]);
}

Object.assign(window, { StatusPill, StatusPicker, STATUSES });
