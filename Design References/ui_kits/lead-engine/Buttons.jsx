/* global React, Spinner, Sparkle */
const { createElement: h } = React;

function PrimaryButton({ children, onClick, disabled, pending, className = "" }) {
  return h("button", {
    type: "button",
    onClick,
    disabled: disabled || pending,
    className: `inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed ${className}`
  }, [
    pending && h(Spinner, { key: "s", className: "h-4 w-4" }),
    h("span", { key: "t" }, children)
  ]);
}

function AIButton({ children, onClick, pending, disabled }) {
  return h("button", {
    type: "button",
    onClick,
    disabled: disabled || pending,
    className: "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-violet-700 hover:to-blue-700 hover:shadow disabled:cursor-wait disabled:opacity-60"
  }, [
    pending
      ? h(Spinner, { key: "s", className: "h-4 w-4" })
      : h(Sparkle, { key: "i", className: "w-4 h-4" }),
    h("span", { key: "t" }, children)
  ]);
}

function TertiaryButton({ children, onClick, disabled, pending }) {
  return h("button", {
    type: "button",
    onClick,
    disabled: disabled || pending,
    className: "inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
  }, [
    pending && h(Spinner, { key: "s", className: "h-3 w-3" }),
    h("span", { key: "t" }, children)
  ]);
}

function SecondaryButton({ children, onClick, icon, tone = "neutral" }) {
  const palette = tone === "success"
    ? "bg-green-50 text-green-700 ring-green-200"
    : "bg-gray-50 text-gray-700 ring-gray-200 hover:bg-gray-100";
  return h("button", {
    type: "button",
    onClick,
    className: `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${palette}`
  }, [
    icon && h("span", { key: "i" }, icon),
    h("span", { key: "t" }, children)
  ]);
}

function SaveButton({ children, onClick, pending, disabled }) {
  return h("button", {
    type: "button",
    onClick,
    disabled,
    className: "inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
  }, [
    pending && h(Spinner, { key: "s", className: "h-3 w-3" }),
    h("span", { key: "t" }, children)
  ]);
}

Object.assign(window, { PrimaryButton, AIButton, TertiaryButton, SecondaryButton, SaveButton });
