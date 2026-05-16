/* global React, Card, CardTitle, EmptyState, DocumentOutline, Check, X, TertiaryButton */
const { createElement: h, useState } = React;

function perfColor(score) {
  if (score > 80) return "text-emerald-600 dark:text-emerald-400";
  if (score > 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function CheckBadge({ label, ok }) {
  return h("div", {
    className: `flex items-center gap-2 rounded-lg border px-3 py-2 ${
      ok
        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
        : "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
    }`
  }, [
    ok
      ? h(Check, { key: "i", className: "w-4 h-4 text-emerald-600 dark:text-emerald-400" })
      : h(X, { key: "i", className: "w-4 h-4 text-red-600 dark:text-red-400" }),
    h("span", {
      key: "t",
      className: `text-sm font-medium ${ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`
    }, label)
  ]);
}

function AuditCard({ audit, hasWebsite, onRunAudit }) {
  const [pending, setPending] = useState(false);

  function handleRun() {
    setPending(true);
    setTimeout(() => { onRunAudit(); setPending(false); }, 600);
  }

  return h(Card, null, [
    h(CardTitle, { key: "t" }, "Аудит сайту"),
    !audit
      ? h("div", { key: "e", className: "mt-4" }, [
          h(EmptyState, {
            key: "es",
            icon: h(DocumentOutline, { className: "w-6 h-6" }),
            title: "Аудит ще не проводився",
            body: hasWebsite
              ? "Запустіть аналіз сайту, щоб побачити Performance Score."
              : "У ліда відсутній сайт — аудит неможливий."
          }),
          hasWebsite && h("div", { key: "btn", className: "mt-4 flex justify-center" },
            h(TertiaryButton, { onClick: handleRun, pending }, pending ? "Аналізуємо…" : "Зробити аудит")
          )
        ])
      : h(React.Fragment, { key: "f" }, [
          h("div", { key: "n", className: "mt-4 flex items-baseline gap-2" }, [
            h("span", {
              key: "v",
              className: `text-5xl font-semibold tabular-nums tracking-tight ${perfColor(audit.performanceScore || 0)}`
            }, audit.performanceScore ?? "—"),
            h("span", { key: "d", className: "text-sm text-zinc-400 dark:text-zinc-600" }, "/ 100")
          ]),
          h("div", { key: "g", className: "mt-5 grid grid-cols-2 gap-3" }, [
            h(CheckBadge, { key: "ssl", label: "SSL", ok: audit.hasSSL }),
            h(CheckBadge, { key: "mob", label: "Mobile-friendly", ok: audit.mobileFriendly })
          ]),
          h("div", { key: "iss", className: "mt-6" }, [
            h("h3", {
              key: "h",
              className: "text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2"
            }, "Знайдені проблеми"),
            audit.issues.length === 0
              ? h("p", { key: "no", className: "text-sm text-zinc-500 dark:text-zinc-400" }, "Проблем не знайдено")
              : h("ul", { key: "ul", className: "space-y-2" },
                  audit.issues.map((iss, i) => h("li", {
                    key: i,
                    className: "flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                  }, [
                    h("span", { key: "d", className: "mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-600" }),
                    h("span", { key: "t" }, iss)
                  ]))
                )
          ])
        ])
  ]);
}

Object.assign(window, { AuditCard, CheckBadge });
