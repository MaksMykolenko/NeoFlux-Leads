/* global React, PrimaryButton, StatusPill, TertiaryButton, SearchOutline, BeatOutreach */
const { createElement: h, useState } = React;

function ScraperForm({ onSearch }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, msg: "" });

  function handleSubmit(e) {
    e.preventDefault();
    if (!query || !city) return;
    setLoading(true);
    setStatus({ type: null, msg: "Запуск сканера... (це може зайняти 15-30 секунд)" });
    setTimeout(() => {
      const count = onSearch(query, city);
      setLoading(false);
      setStatus({ type: "success", msg: `Успіх! Знайдено та додано лідів: ${count}` });
      setQuery("");
    }, 800);
  }

  return h("div", {
    className: "bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8"
  }, [
    h("h2", { key: "h", className: "text-lg font-semibold text-gray-900 mb-4" }, "Пошук нових лідів"),
    h("form", {
      key: "f",
      onSubmit: handleSubmit,
      className: "flex flex-col md:flex-row gap-4"
    }, [
      h("input", {
        key: "q",
        type: "text",
        placeholder: "Ніша (напр. Стоматологія)",
        value: query,
        onChange: (e) => setQuery(e.target.value),
        disabled: loading,
        className: "flex-1 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60"
      }),
      h("input", {
        key: "c",
        type: "text",
        placeholder: "Локація (напр. Черкаси)",
        value: city,
        onChange: (e) => setCity(e.target.value),
        disabled: loading,
        className: "flex-1 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60"
      }),
      h(PrimaryButton, { key: "b", pending: loading, className: "min-w-[140px]" },
        loading ? "Сканування..." : "Пошук"
      )
    ]),
    status.msg && h("div", {
      key: "s",
      className: `mt-4 p-3 text-sm rounded-lg ${
        status.type === "success" ? "bg-green-50 text-green-700 border border-green-200"
        : status.type === "error"   ? "bg-red-50 text-red-700 border border-red-200"
        :                              "bg-blue-50 text-blue-700 border border-blue-200"
      }`
    }, status.msg)
  ]);
}

function ModeTabs({ mode, onChange }) {
  const tabs = [
    { id: "local", label: "Локальний бізнес",   hint: "Google Maps · сайти, телефони" },
    { id: "beats", label: "Виконавці для бітів", hint: "SoundCloud · YouTube · Instagram" }
  ];
  return h("div", { className: "flex flex-wrap gap-2 border-b border-gray-200" },
    tabs.map((t) => h("button", {
      key: t.id,
      type: "button",
      onClick: () => onChange(t.id),
      className: `relative px-4 py-3 text-sm font-medium transition-colors ${
        mode === t.id
          ? "text-blue-700"
          : "text-gray-500 hover:text-gray-900"
      }`
    }, [
      h("div", { key: "l" }, t.label),
      h("div", { key: "h", className: "text-[10px] font-normal text-gray-400 uppercase tracking-wider mt-0.5" }, t.hint),
      mode === t.id && h("span", {
        key: "u",
        className: "absolute -bottom-px left-0 right-0 h-0.5 bg-blue-600"
      })
    ]))
  );
}

function LeadList({ leads, mode, onModeChange, onOpen, onAudit, onSearch, onBeatSearch }) {
  return h("div", { className: "min-h-screen bg-gray-50" },
    h("div", { className: "mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8" }, [
      h("h1", { key: "t", className: "text-2xl font-semibold text-gray-900 tracking-tight" }, "NeoFlux Lead Engine"),
      h("p", { key: "s", className: "mt-1 text-sm text-gray-500" },
        mode === "beats"
          ? "AI-пошук артистів, які купують біти"
          : "Автоматичний збір лідів з Google Maps"
      ),
      h("div", { key: "tabs", className: "mt-6" }, h(ModeTabs, { mode, onChange: onModeChange })),
      h("div", { key: "f", className: "mt-8" },
        mode === "beats"
          ? h(BeatOutreach, { onSent: onBeatSearch })
          : h(ScraperForm, { onSearch })
      ),
      h("div", { key: "tbl", className: "mt-10" },
        h("div", { className: "bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden" }, [
          h("div", { key: "h", className: "px-6 py-4 border-b border-gray-200 flex items-center justify-between" }, [
            h("h2", { key: "t", className: "text-base font-medium text-gray-900" },
              mode === "beats" ? "Знайдені виконавці" : "Останні ліди"
            ),
            leads.length > 0 && h("span", {
              key: "c",
              className: "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
            }, leads.length)
          ]),
          leads.length === 0
            ? h("div", { key: "e", className: "flex flex-col items-center justify-center py-16 text-center" }, [
                h(SearchOutline, { key: "i", className: "h-12 w-12 text-gray-300" }),
                h("p", { key: "t", className: "mt-3 text-sm font-medium text-gray-500" }, "Лідів ще немає"),
                h("p", { key: "h", className: "mt-1 text-sm text-gray-400" }, "Використайте форму вище, щоб почати пошук")
              ])
            : h(LeadsTable, { key: "tbl", leads, onOpen, onAudit })
        ])
      )
    ])
  );
}

function LeadsTable({ leads, onOpen, onAudit }) {
  return h("div", { className: "overflow-x-auto" },
    h("table", { className: "w-full" }, [
      h("thead", { key: "h" },
        h("tr", { className: "border-b border-gray-100" },
          ["Компанія", "Категорія / Локація", "Сайт", "Статус", "Аудит"].map((c) =>
            h("th", {
              key: c,
              className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            }, c)
          )
        )
      ),
      h("tbody", { key: "b", className: "divide-y divide-gray-100" },
        leads.map((lead) => h("tr", {
          key: lead.id,
          className: "hover:bg-gray-50 transition-colors cursor-pointer",
          onClick: () => onOpen(lead.id)
        }, [
          h("td", { key: "c", className: "px-6 py-4 text-sm font-medium whitespace-nowrap" },
            h("a", {
              href: "#",
              onClick: (e) => { e.preventDefault(); e.stopPropagation(); onOpen(lead.id); },
              className: "text-gray-900 hover:text-blue-600 hover:underline transition-colors"
            }, lead.companyName)
          ),
          h("td", { key: "cat", className: "px-6 py-4 text-sm text-gray-500 whitespace-nowrap" }, [
            lead.category,
            lead.city && h("span", { key: "city", className: "text-gray-400" }, ` · ${lead.city}`)
          ]),
          h("td", { key: "w", className: "px-6 py-4 text-sm whitespace-nowrap" },
            lead.website
              ? h("a", {
                  href: lead.website,
                  onClick: (e) => e.stopPropagation(),
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                }, lead.website.replace(/^https?:\/\//, "").replace(/\/$/, ""))
              : h("span", {
                  className: "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500"
                }, "Немає")
          ),
          h("td", { key: "s", className: "px-6 py-4 text-sm whitespace-nowrap" },
            h(StatusPill, { status: lead.status })
          ),
          h("td", { key: "a", className: "px-6 py-4 text-sm whitespace-nowrap", onClick: (e) => e.stopPropagation() },
            lead.website
              ? lead.audit
                ? h("div", { className: "flex flex-col items-start gap-0.5" }, [
                    h("span", { key: "ok", className: "text-xs font-medium text-green-700" }, "Аудит пройдено"),
                    lead.audit.issues.length > 0 && h("span", {
                      key: "n",
                      className: "text-xs text-gray-400"
                    }, `${lead.audit.issues.length} ${
                      lead.audit.issues.length === 1 ? "проблема" :
                      lead.audit.issues.length < 5 ? "проблеми" : "проблем"
                    }`)
                  ])
                : h(AuditInlineButton, { leadId: lead.id, onAudit })
              : h("span", { className: "text-xs text-gray-400" }, "—")
          )
        ]))
      )
    ])
  );
}

function AuditInlineButton({ leadId, onAudit }) {
  const [pending, setPending] = useState(false);
  function handleClick() {
    setPending(true);
    setTimeout(() => {
      onAudit(leadId);
      setPending(false);
    }, 700);
  }
  return h(TertiaryButton, { onClick: handleClick, pending },
    pending ? "Аналізуємо…" : "Зробити аудит"
  );
}

Object.assign(window, { LeadList });
