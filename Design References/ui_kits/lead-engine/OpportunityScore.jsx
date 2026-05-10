/* global React, Card, CardEyebrow, CardTitle */
const { createElement: h } = React;

function scoreCtx(score) {
  if (score > 70) return {
    text: "text-green-600", bar: "bg-green-500",
    ring: "ring-green-200", bg: "bg-green-50",
    label: "Високий потенціал для продажу послуг", level: "Високий"
  };
  if (score > 40) return {
    text: "text-amber-600", bar: "bg-amber-500",
    ring: "ring-amber-200", bg: "bg-amber-50",
    label: "Помірний потенціал — варто перевірити", level: "Середній"
  };
  return {
    text: "text-red-600", bar: "bg-red-500",
    ring: "ring-red-200", bg: "bg-red-50",
    label: "Низький пріоритет", level: "Низький"
  };
}

function OpportunityScore({ score, hasAudit }) {
  const ctx = scoreCtx(score);
  return h(Card, null, [
    h("div", { key: "h", className: "flex items-start justify-between gap-4" }, [
      h("div", { key: "l" }, [
        h(CardEyebrow, { key: "e" }, "Opportunity Score"),
        h(CardTitle, { key: "t", className: "mt-1" }, "Пріоритет ліда для продажу")
      ]),
      h("span", {
        key: "p",
        className: `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${ctx.bg} ${ctx.text} ${ctx.ring}`
      }, ctx.level)
    ]),
    h("div", { key: "n", className: "mt-6 flex flex-wrap items-end gap-x-6 gap-y-3" }, [
      h("div", { key: "num", className: "flex items-baseline gap-2" }, [
        h("span", {
          key: "v",
          className: `text-7xl font-semibold tabular-nums tracking-tight leading-none ${ctx.text}`
        }, score),
        h("span", { key: "d", className: "text-base text-gray-400" }, "/ 100")
      ]),
      h("p", { key: "l", className: `text-sm font-medium ${ctx.text}` }, ctx.label)
    ]),
    h("div", { key: "bar", className: "mt-6" }, [
      h("div", {
        key: "track",
        className: "h-2 w-full overflow-hidden rounded-full bg-gray-100"
      }, h("div", {
        className: `h-full rounded-full transition-all ${ctx.bar}`,
        style: { width: `${score}%` }
      })),
      !hasAudit && h("p", {
        key: "hint",
        className: "mt-3 text-xs text-gray-500"
      }, "Бал розрахований із наявних даних. Запустіть аудит сайту, щоб врахувати SSL та mobile-friendly чинники.")
    ])
  ]);
}

// Pure scoring; mirror of src/lib/scoring.ts
function calculateLeadScore(lead) {
  const BASE = 50;
  let s = BASE;
  if (lead.audit?.hasSSL) s -= 30;
  if (lead.audit?.mobileFriendly) s -= 20;
  if (lead.website && /instagram\.com|choiceqr\.(com|app)|linktr\.ee|facebook\.com\/(?!sharer)/i.test(lead.website)) s += 40;
  if (lead.email) s += 10;
  return Math.max(0, Math.min(100, s));
}

Object.assign(window, { OpportunityScore, calculateLeadScore, scoreCtx });
