/* global React, Spinner, Sparkle */
const { createElement: h } = React;

function PrimaryButton({ children, onClick, disabled, pending, className = "" }) {
  return h("button", {
    type: "button",
    onClick,
    disabled: disabled || pending,
    className: `inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] transition-all duration-200 hover:bg-purple-700 hover:-translate-y-0.5 active:scale-95 disabled:bg-purple-300 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none dark:bg-flux-purple dark:shadow-[0_4px_20px_rgba(106,0,255,0.4)] dark:hover:bg-flux-purple-hover dark:hover:shadow-[0_6px_24px_rgba(106,0,255,0.5)] ${className}`
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
    className: "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow disabled:cursor-wait disabled:opacity-60 dark:to-flux-purple dark:hover:to-flux-purple-hover"
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
    className: "inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed dark:bg-flux-purple-tint dark:text-flux-purple-soft dark:hover:bg-flux-purple-ring/40"
  }, [
    pending && h(Spinner, { key: "s", className: "h-3 w-3" }),
    h("span", { key: "t" }, children)
  ]);
}

function SecondaryButton({ children, onClick, icon, tone = "neutral" }) {
  const palette = tone === "success"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30"
    : "bg-zinc-50 text-zinc-700 ring-zinc-200 hover:bg-zinc-100 dark:bg-flux-card dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800";
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
    className: "inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed dark:bg-flux-purple dark:hover:bg-flux-purple-hover"
  }, [
    pending && h(Spinner, { key: "s", className: "h-3 w-3" }),
    h("span", { key: "t" }, children)
  ]);
}

Object.assign(window, { PrimaryButton, AIButton, TertiaryButton, SecondaryButton, SaveButton });
