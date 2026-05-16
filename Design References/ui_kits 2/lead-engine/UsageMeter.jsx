/* global React */
const { createElement: h } = React;

function UsageMeter({ plan, used, unlimited }) {
  if (unlimited) {
    return h("div", {
      className: "flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10"
    }, h("div", { className: "flex flex-wrap items-center gap-2 text-sm" }, [
      h("span", { key: "d", className: "inline-flex h-2 w-2 rounded-full bg-emerald-500" }),
      h("span", { key: "p", className: "font-semibold text-emerald-900 dark:text-emerald-200" }, plan.name),
      h("span", { key: "t", className: "text-emerald-700 dark:text-emerald-300" }, "— безлімітно")
    ]));
  }

  const limit = plan.leadsPerMonth;
  const remaining = Math.max(0, limit - used);
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const danger = percent >= 95;
  const warn = !danger && percent >= 75;
  const barColor = danger ? "bg-red-500" : warn ? "bg-amber-500" : "bg-purple-500 dark:bg-flux-purple";
  const trackColor = danger
    ? "border-red-200 bg-red-50/60 dark:border-red-500/30 dark:bg-red-500/10"
    : warn
      ? "border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10"
      : "border-zinc-200 bg-white dark:border-flux-border dark:bg-flux-card";

  return h("div", { className: `rounded-xl border px-4 py-3 ${trackColor}` }, [
    h("div", { key: "row", className: "flex items-center justify-between gap-3 text-sm" }, [
      h("div", { key: "l", className: "min-w-0" }, [
        h("span", { key: "p", className: "font-semibold text-zinc-900 dark:text-flux-text" }, plan.name),
        h("span", { key: "s", className: "text-zinc-600 dark:text-flux-muted" },
          ` — лишилось ${remaining} / ${limit} лідів`
        )
      ]),
      h("a", {
        key: "u",
        href: "#",
        onClick: (e) => e.preventDefault(),
        className: "text-xs font-semibold text-purple-600 transition-colors hover:text-purple-700 hover:underline dark:text-flux-purple-soft dark:hover:text-white"
      }, "Upgrade →")
    ]),
    h("div", { key: "bar", className: "mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-flux-border-strong" },
      h("div", { className: `h-full rounded-full transition-all duration-200 ${barColor}`, style: { width: `${percent}%` } })
    )
  ]);
}

Object.assign(window, { UsageMeter });
