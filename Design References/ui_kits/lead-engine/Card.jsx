/* global React */
const { createElement: h } = React;

function Card({ children, className = "" }) {
  return h("section", {
    className: `bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`
  }, children);
}

function CardEyebrow({ children }) {
  return h("p", {
    className: "text-xs font-semibold uppercase tracking-wider text-gray-500"
  }, children);
}

function CardTitle({ children, className = "" }) {
  return h("h2", {
    className: `text-base font-semibold text-gray-900 ${className}`
  }, children);
}

function IconBadge({ children }) {
  return h("div", {
    className: "flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400"
  }, children);
}

function EmptyState({ icon, title, body }) {
  return h("div", {
    className: "flex flex-col items-center justify-center text-center py-8"
  }, [
    h(IconBadge, { key: "i" }, icon),
    h("p", { key: "t", className: "mt-3 text-sm font-medium text-gray-700" }, title),
    body && h("p", { key: "b", className: "mt-1 text-xs text-gray-500" }, body)
  ]);
}

Object.assign(window, { Card, CardEyebrow, CardTitle, IconBadge, EmptyState });
