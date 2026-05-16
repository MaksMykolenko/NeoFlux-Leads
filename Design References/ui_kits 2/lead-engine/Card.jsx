/* global React */
const { createElement: h } = React;

function Card({ children, className = "" }) {
  return h("section", {
    className: `bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 dark:border-flux-border dark:bg-flux-card dark:shadow-none ${className}`
  }, children);
}

function CardEyebrow({ children }) {
  return h("p", {
    className: "text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
  }, children);
}

function CardTitle({ children, className = "" }) {
  return h("h2", {
    className: `text-base font-semibold text-zinc-900 dark:text-zinc-50 ${className}`
  }, children);
}

function IconBadge({ children }) {
  return h("div", {
    className: "flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
  }, children);
}

function EmptyState({ icon, title, body }) {
  return h("div", {
    className: "flex flex-col items-center justify-center text-center py-8"
  }, [
    h(IconBadge, { key: "i" }, icon),
    h("p", { key: "t", className: "mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200" }, title),
    body && h("p", { key: "b", className: "mt-1 text-xs text-zinc-500 dark:text-zinc-400" }, body)
  ]);
}

Object.assign(window, { Card, CardEyebrow, CardTitle, IconBadge, EmptyState });
