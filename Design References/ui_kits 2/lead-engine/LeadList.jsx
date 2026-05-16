/* global React, PrimaryButton, StatusPill, TertiaryButton, SearchOutline, BeatOutreach, AuthHeader, UsageMeter, KanbanView */
const { createElement: h, useState } = React;

// ───────────────────────────────────────────────────────────────────
// Scraper form (local mode)
// ───────────────────────────────────────────────────────────────────
function ScraperForm({ onSearch }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, msg: "" });

  function handleSubmit(e) {
    e.preventDefault();
    if (!query || !city) return;
    setLoading(true);
    setStatus({ type: "info", msg: "Gemini шукає бізнеси в Google Search… (15–30 секунд)" });
    setTimeout(() => {
      const count = onSearch(query, city);
      setLoading(false);
      setStatus({ type: "success", msg: `Знайдено та додано лідів: ${count}` });
      setQuery("");
    }, 900);
  }

  const inputClass = "block w-full rounded-md border border-zinc-300 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 transition-all duration-200 placeholder:text-zinc-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-flux-bg dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-flux-purple dark:focus:bg-zinc-900 dark:focus:ring-flux-purple-ring";

  return h("div", {
    className: "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:border-zinc-300 dark:border-flux-border dark:bg-flux-card dark:hover:border-flux-border-strong"
  }, [
    h("form", {
      key: "f",
      onSubmit: handleSubmit,
      className: "grid gap-3 md:grid-cols-[1fr_1fr_auto]"
    }, [
      h("label", { key: "n", className: "block" }, [
        h("span", { key: "l", className: "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" }, "Ніша"),
        h("input", {
          key: "i",
          type: "text",
          placeholder: "Стоматологія",
          value: query,
          onChange: (e) => setQuery(e.target.value),
          disabled: loading,
          className: inputClass
        })
      ]),
      h("label", { key: "c", className: "block" }, [
        h("span", { key: "l", className: "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" }, "Локація"),
        h("input", {
          key: "i",
          type: "text",
          placeholder: "Черкаси",
          value: city,
          onChange: (e) => setCity(e.target.value),
          disabled: loading,
          className: inputClass
        })
      ]),
      h("label", { key: "b", className: "block" }, [
        h("span", { key: "l", className: "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" }, "\u00a0"),
        h(PrimaryButton, { pending: loading, disabled: !query || !city, className: "h-[42px] min-w-[140px] w-full" },
          loading ? "Сканування..." : "Пошук"
        )
      ])
    ]),
    status.msg && h("div", {
      key: "s",
      className: `mt-4 p-3 text-sm rounded-lg border ${
        status.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
        : status.type === "error"   ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        :                              "border-purple-200 bg-purple-50 text-purple-800 dark:border-flux-purple-ring dark:bg-flux-purple-tint dark:text-flux-purple-soft"
      }`
    }, status.msg)
  ]);
}

// ───────────────────────────────────────────────────────────────────
// Universal mode form
// ───────────────────────────────────────────────────────────────────
function UniversalForm({ onSearch }) {
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setPending(true);
    setSaved(null);
    setTimeout(() => {
      const count = onSearch(prompt);
      setPending(false);
      setSaved(count);
    }, 1100);
  }

  return h("div", { className: "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-flux-border dark:bg-flux-card" }, [
    h("form", { key: "f", onSubmit: handleSubmit, className: "space-y-3" }, [
      h("label", { key: "l", className: "block text-sm font-medium text-zinc-700 dark:text-zinc-300" },
        "Опишіть, кого шукати. Чим конкретніше — тим релевантніші результати."
      ),
      h("textarea", {
        key: "t",
        value: prompt,
        onChange: (e) => setPrompt(e.target.value),
        rows: 4,
        maxLength: 1000,
        placeholder: "напр.: подкаст-продюсери з України, які записують випуски про маркетинг 2024–2025…",
        className: "block w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-flux-border dark:bg-flux-card dark:text-zinc-50 dark:placeholder:text-zinc-500"
      }),
      h("div", { key: "a", className: "flex flex-wrap items-center gap-3" }, [
        h("button", {
          key: "b",
          type: "submit",
          disabled: pending || !prompt.trim(),
          className: "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:to-flux-purple dark:hover:to-flux-purple-hover"
        }, pending ? "Шукаю в інтернеті..." : "Запустити AI-сканування"),
        pending && h("span", { key: "w", className: "text-xs text-zinc-500 dark:text-zinc-400" }, "Gemini + Google Search ~30s")
      ])
    ]),
    saved !== null && h("p", {
      key: "ok",
      className: "mt-3 text-sm text-emerald-700 dark:text-emerald-300"
    }, [
      "Збережено ",
      h("span", { key: "n", className: "font-semibold tabular-nums" }, saved),
      ` ${saved === 1 ? "запис" : "записів"} у CRM.`
    ]),
    h("p", {
      key: "f",
      className: "mt-3 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500"
    }, "Дані беруться з відкритих джерел через Google Search grounding. Перевіряйте перед outreach.")
  ]);
}

// ───────────────────────────────────────────────────────────────────
// Mode tabs
// ───────────────────────────────────────────────────────────────────
function ModeTabs({ mode, onChange }) {
  const tabs = [
    { id: "local",     label: "Локальний бізнес",   hint: "Google Maps · сайти" },
    { id: "beats",     label: "Виконавці для бітів", hint: "SoundCloud · YouTube · Instagram" },
    { id: "universal", label: "Універсальний",      hint: "Будь-яка ніша · вільний запит" }
  ];
  return h("div", {
    className: "flex flex-wrap gap-2 border-b border-zinc-200 dark:border-flux-border"
  }, tabs.map((t) => {
    const active = mode === t.id;
    return h("button", {
      key: t.id,
      type: "button",
      onClick: () => onChange(t.id),
      className: `relative px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none ${
        active
          ? "text-purple-600 dark:text-purple-400"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      }`
    }, [
      h("div", { key: "l" }, t.label),
      h("div", { key: "h", className: "mt-0.5 text-[10px] font-normal uppercase tracking-wider text-zinc-400 dark:text-zinc-500" }, t.hint),
      active && h("span", { key: "u", className: "absolute -bottom-px left-0 right-0 h-0.5 bg-purple-500 dark:bg-purple-400" })
    ]);
  }));
}

// ───────────────────────────────────────────────────────────────────
// View toggle (Table / Board)
// ───────────────────────────────────────────────────────────────────
function ViewToggle({ view, onChange }) {
  function btnClass(active) {
    return `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
      active
        ? "bg-purple-600 text-white shadow-sm dark:bg-flux-purple dark:text-white"
        : "text-zinc-600 hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-flux-card dark:hover:text-zinc-100"
    }`;
  }
  return h("div", {
    role: "tablist",
    className: "inline-flex shrink-0 items-center rounded-full border border-zinc-200/90 bg-zinc-50/90 p-1 text-xs shadow-sm ring-1 ring-black/[0.04] dark:border-flux-border dark:bg-zinc-900/40 dark:ring-white/[0.06]"
  }, [
    h("button", { key: "t", type: "button", onClick: () => onChange("table"), className: btnClass(view === "table") }, [
      h("svg", { key: "i", className: "h-3.5 w-3.5", viewBox: "0 0 20 20", fill: "currentColor" },
        h("path", { d: "M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5V7H3V4.5ZM3 8.5h14V12H3V8.5Zm0 5h14v2A1.5 1.5 0 0 1 15.5 17h-11A1.5 1.5 0 0 1 3 15.5v-2Z" })),
      "Table"
    ]),
    h("button", { key: "b", type: "button", onClick: () => onChange("board"), className: btnClass(view === "board") }, [
      h("svg", { key: "i", className: "h-3.5 w-3.5", viewBox: "0 0 20 20", fill: "currentColor" },
        h("path", { d: "M3 4.5A1.5 1.5 0 0 1 4.5 3H7v14H4.5A1.5 1.5 0 0 1 3 15.5v-11ZM8.5 3h3v9h-3V3Zm4.5 0h2.5A1.5 1.5 0 0 1 17 4.5v6h-4V3Z" })),
      "Board"
    ])
  ]);
}

// ───────────────────────────────────────────────────────────────────
// LeadList — top-level page
// ───────────────────────────────────────────────────────────────────
function LeadList({ leads, allLeads, mode, view, onModeChange, onViewChange, onOpen, onAudit, onSearch, onUniversalSearch, onBeatSent, onChangeStatus, user, plan, theme, onThemeToggle, locale, onLocaleChange }) {
  return h("div", { className: "min-h-screen bg-zinc-50 dark:bg-flux-bg" }, [
    h(AuthHeader, { key: "h", user, plan, theme, onThemeToggle, locale, onLocaleChange }),
    h("div", {
      key: "main",
      className: `mx-auto px-4 py-12 sm:px-6 lg:px-8 ${view === "board" ? "max-w-[88rem]" : "max-w-4xl"}`
    }, [
      // Page header
      h("div", { key: "head", className: "flex items-center gap-4" }, [
        h("a", {
          key: "mark",
          href: "#",
          onClick: (e) => e.preventDefault(),
          className: "inline-flex h-10 w-10 flex-shrink-0 rounded-xl shadow-[0_0_15px_rgba(106,0,255,0.5)]"
        }, h("img", { src: "../../assets/logo-mark.svg", className: "h-full w-full" })),
        h("div", { key: "t", className: "min-w-0" }, [
          h("h1", { key: "h", className: "text-2xl font-bold tracking-tight text-zinc-900 dark:text-flux-text" },
            "Flux Leads"
          ),
          h("p", { key: "s", className: "mt-1 text-sm text-zinc-500 dark:text-flux-muted" },
            mode === "beats"     ? "AI-пошук артистів, що купують біти"
            : mode === "universal" ? "Опишіть, кого шукати — Gemini знайде в інтернеті"
            :                        "Автоматичний збір лідів через AI + Google Search"
          )
        ])
      ]),

      // Mode tabs (hidden on board)
      view !== "board" && h("div", { key: "tabs", className: "mt-6" },
        h(ModeTabs, { mode, onChange: onModeChange })
      ),

      // Usage meter
      h("div", { key: "usage", className: "mt-6" },
        h(UsageMeter, { plan, used: 142, unlimited: plan.id === "AGENCY" })
      ),

      // Form
      view !== "board" && h("div", { key: "form", className: "mt-6 space-y-4" },
        mode === "beats"     ? h(BeatOutreach, { onSent: onBeatSent })
        : mode === "universal" ? h(UniversalForm, { onSearch: onUniversalSearch })
        :                        h(ScraperForm, { onSearch })
      ),

      // Table or Board
      h("div", { key: "data", className: "mt-10" },
        view === "board"
          ? h("div", null, [
              h("div", { key: "head", className: "mb-4 flex items-center justify-between gap-3" }, [
                h("div", { key: "t" }, [
                  h("h2", { key: "h", className: "text-base font-semibold text-zinc-900 dark:text-zinc-50" }, "Канбан-воронка"),
                  h("p", { key: "s", className: "mt-1 text-xs text-zinc-500 dark:text-zinc-400" }, "Усі ваші ліди — режим відображається бейджем на картці.")
                ]),
                h(ViewToggle, { key: "v", view, onChange: onViewChange })
              ]),
              h(KanbanView, { key: "k", leads: allLeads, onOpen, onChangeStatus })
            ])
          : h("div", { className: "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-flux-border dark:bg-flux-card" }, [
              h("div", { key: "head", className: "flex items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4 dark:border-flux-border" }, [
                h("h2", { key: "t", className: "text-base font-medium text-zinc-900 dark:text-zinc-50" },
                  mode === "beats" ? "Знайдені виконавці" : mode === "universal" ? "Знайдені ліди" : "Останні ліди"
                ),
                h("div", { key: "r", className: "flex items-center gap-3" }, [
                  leads.length > 0 && h("span", {
                    key: "c",
                    className: "inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }, leads.length),
                  h(ViewToggle, { key: "v", view, onChange: onViewChange })
                ])
              ]),
              leads.length === 0
                ? h(EmptyView, { key: "e", mode })
                : h(LeadsTable, { key: "tbl", leads, mode, onOpen, onAudit })
            ])
      )
    ])
  ]);
}

function EmptyView({ mode }) {
  return h("div", { className: "flex flex-col items-center justify-center py-16 text-center" }, [
    h(SearchOutline, { key: "i", className: "h-12 w-12 text-zinc-300 dark:text-zinc-700" }),
    h("p", { key: "t", className: "mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400" },
      mode === "beats" ? "Виконавців ще немає" : "Лідів ще немає"
    ),
    h("p", { key: "h", className: "mt-1 text-sm text-zinc-400 dark:text-zinc-500" },
      "Використайте форму вище, щоб почати пошук"
    )
  ]);
}

function LeadsTable({ leads, mode, onOpen, onAudit }) {
  const isBeats = mode === "beats";
  const isUniversal = mode === "universal";
  const cols = isBeats
    ? ["Артист", "Жанр", "Профіль", "Статус", "Аудиторія"]
    : isUniversal
      ? ["Назва", "Опис", "Сайт", "Статус", "Джерело"]
      : ["Компанія", "Категорія / Локація", "Сайт", "Статус", "Аудит"];

  return h("div", { className: "overflow-x-auto" },
    h("table", { className: "w-full" }, [
      h("thead", { key: "h" },
        h("tr", { className: "border-b border-zinc-100 dark:border-flux-border" },
          cols.map((c) => h("th", {
            key: c,
            className: "px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400"
          }, c))
        )
      ),
      h("tbody", { key: "b", className: "divide-y divide-zinc-100 dark:divide-zinc-800" },
        leads.map((lead) => h(LeadRow, { key: lead.id, lead, mode, onOpen, onAudit }))
      )
    ])
  );
}

function fmtFollowers(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `${n}`;
}

function LeadRow({ lead, mode, onOpen, onAudit }) {
  const isBeats = mode === "beats";
  return h("tr", {
    className: "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer",
    onClick: () => onOpen(lead.id)
  }, [
    h("td", { key: "c", className: "px-6 py-4 text-sm font-medium whitespace-nowrap" },
      h("a", {
        href: "#",
        onClick: (e) => { e.preventDefault(); e.stopPropagation(); onOpen(lead.id); },
        className: "text-zinc-900 transition-colors hover:text-purple-600 hover:underline dark:text-zinc-100 dark:hover:text-purple-400"
      }, lead.companyName)
    ),
    h("td", { key: "cat", className: "px-6 py-4 text-sm text-zinc-500 whitespace-nowrap dark:text-zinc-400" }, [
      lead.category,
      lead.city && h("span", { key: "city", className: "text-zinc-400 dark:text-zinc-500" }, ` · ${lead.city}`)
    ]),
    h("td", { key: "w", className: "px-6 py-4 text-sm whitespace-nowrap" },
      lead.website
        ? h("a", {
            href: lead.website,
            onClick: (e) => e.stopPropagation(),
            target: "_blank",
            rel: "noopener noreferrer",
            className: "text-purple-600 transition-colors hover:text-purple-700 hover:underline dark:text-purple-400 dark:hover:text-purple-300"
          }, lead.website.replace(/^https?:\/\//, "").replace(/\/$/, ""))
        : h("span", {
            className: "inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }, "Немає")
    ),
    h("td", { key: "s", className: "px-6 py-4 text-sm whitespace-nowrap" },
      h(StatusPill, { status: lead.status })
    ),
    h("td", { key: "a", className: "px-6 py-4 text-sm whitespace-nowrap", onClick: (e) => e.stopPropagation() },
      isBeats
        ? h(BeatsCell, { lead })
        : lead.website
          ? lead.audit
            ? h("div", { className: "flex flex-col items-start gap-0.5" }, [
                h("span", { key: "ok", className: "text-xs font-medium text-emerald-700 dark:text-emerald-300" }, "Аудит пройдено"),
                lead.audit.issues.length > 0 && h("span", {
                  key: "n",
                  className: "text-xs text-zinc-400 dark:text-zinc-500"
                }, `${lead.audit.issues.length} ${lead.audit.issues.length === 1 ? "проблема" : lead.audit.issues.length < 5 ? "проблеми" : "проблем"}`)
              ])
            : h(AuditInlineButton, { leadId: lead.id, onAudit })
          : h("span", { className: "text-xs text-zinc-400 dark:text-zinc-600" }, "—")
    )
  ]);
}

function BeatsCell({ lead }) {
  const followers = lead.audience?.followers;
  return h("div", { className: "flex flex-col items-start gap-0.5" }, [
    followers != null && h("span", {
      key: "f",
      className: "text-xs font-medium tabular-nums text-zinc-700 dark:text-zinc-300"
    }, `${fmtFollowers(followers)} фоловерів`),
    lead.lookingForType && h("span", {
      key: "lt",
      className: "inline-flex items-center whitespace-nowrap rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30"
    }, "шукає type beats")
  ]);
}

function AuditInlineButton({ leadId, onAudit }) {
  const [pending, setPending] = useState(false);
  function handleClick() {
    setPending(true);
    setTimeout(() => { onAudit(leadId); setPending(false); }, 700);
  }
  return h(TertiaryButton, { onClick: handleClick, pending },
    pending ? "Аналізуємо…" : "Зробити аудит"
  );
}

Object.assign(window, { LeadList, ScraperForm, ModeTabs, ViewToggle, UniversalForm });
