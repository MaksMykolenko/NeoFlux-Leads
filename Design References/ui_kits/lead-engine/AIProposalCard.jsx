/* global React, Card, CardEyebrow, CardTitle, AIButton, SecondaryButton, SaveButton, Sparkle, Clipboard, Check, Spinner */
const { createElement: h, useState } = React;

function AIProposalCard({ companyName, leadId, audit, onSave, savedSubject }) {
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFor, setSavedFor] = useState(savedSubject || null);
  const [copied, setCopied] = useState(false);

  const proposals = window.SEED.aiProposals;
  const hasText = text.trim().length > 0;
  const isAlreadySaved = savedFor !== null && savedFor === text.trim();

  function handleGenerate() {
    setGenerating(true);
    setCopied(false);
    setSavedFor(null);
    setTimeout(() => {
      const next = proposals[Math.floor(Math.random() * proposals.length)];
      setText(next);
      setSubject((s) => s.trim() ? s : `Пропозиція для ${companyName}`);
      setGenerating(false);
    }, 1100);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      onSave({ subject, body: text });
      setSavedFor(text.trim());
      setSaving(false);
    }, 500);
  }

  const rows = Math.min(Math.max(text.split("\n").length + 1, 8), 18);

  return h(Card, null, [
    h("div", { key: "head", className: "flex flex-wrap items-start justify-between gap-3" }, [
      h("div", { key: "l" }, [
        h(CardEyebrow, { key: "e" }, "AI Proposal"),
        h(CardTitle, { key: "t", className: "mt-1" }, "Холодний лист під цього ліда"),
        h("p", { key: "s", className: "mt-1 text-sm text-gray-500" },
          "Gemini 2.5 Flash проаналізує дані ліда та згенерує персоналізований лист на основі знайдених «болей»."
        )
      ]),
      h(AIButton, { key: "btn", onClick: handleGenerate, pending: generating || saving },
        generating ? "Генерую..." : hasText ? "Згенерувати ще раз" : "Згенерувати листа (AI)"
      )
    ]),

    h("div", { key: "body", className: "mt-5" },
      generating
        ? h(SkeletonLoader, { key: "sk" })
        : hasText
          ? h("div", { key: "form", className: "space-y-3" }, [
              h("div", { key: "subj" }, [
                h("label", {
                  key: "l",
                  className: "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
                }, "Тема листа"),
                h("input", {
                  key: "i",
                  type: "text",
                  value: subject,
                  onChange: (e) => setSubject(e.target.value),
                  className: "block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                })
              ]),
              h("div", { key: "body" }, [
                h("label", {
                  key: "l",
                  className: "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
                }, "Текст листа"),
                h("textarea", {
                  key: "t",
                  value: text,
                  rows,
                  onChange: (e) => setText(e.target.value),
                  className: "block w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-900 shadow-inner focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                })
              ]),
              h("div", { key: "actions", className: "flex flex-wrap items-center justify-between gap-3 pt-1" }, [
                h("span", { key: "h", className: "text-xs text-gray-400" }, "Тему та текст можна редагувати перед збереженням."),
                h("div", { key: "btns", className: "flex items-center gap-2" }, [
                  h(SecondaryButton, {
                    key: "c",
                    onClick: handleCopy,
                    tone: copied ? "success" : "neutral",
                    icon: copied ? h(Check, { className: "w-3.5 h-3.5" }) : h(Clipboard, { className: "w-3.5 h-3.5" })
                  }, copied ? "Скопійовано" : "Копіювати"),
                  h(SaveButton, {
                    key: "s",
                    onClick: handleSave,
                    pending: saving,
                    disabled: saving || isAlreadySaved || !subject.trim()
                  }, saving ? "Зберігаю..." : isAlreadySaved ? "Збережено" : "Зберегти в CRM")
                ])
              ])
            ])
          : h("div", { key: "empty", className: "flex flex-col items-center justify-center text-center py-8" }, [
              h(Sparkle, { key: "i", className: "w-8 h-8 text-gray-300" }),
              h("p", { key: "t", className: "mt-3 text-sm text-gray-500" },
                "Натисніть кнопку, щоб AI створив персональний холодний лист."
              )
            ])
    ),

    isAlreadySaved && h("div", {
      key: "toast",
      className: "mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800"
    }, [
      h(Check, { key: "i", className: "w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" }),
      h("div", { key: "t" }, [
        "Повідомлення збережено, статус ліда змінено на ",
        h("span", { key: "b", className: "font-semibold" }, "Contacted"),
        "."
      ])
    ])
  ]);
}

function SkeletonLoader() {
  return h("div", {
    className: "rounded-lg border border-gray-200 bg-gray-50 p-4"
  }, [
    h("div", { key: "h", className: "flex items-center gap-2 text-sm text-gray-500" }, [
      h(Spinner, { key: "s", className: "h-4 w-4 text-violet-600" }),
      "AI аналізує ліда..."
    ]),
    h("div", { key: "lines", className: "mt-4 space-y-2.5" }, [
      h("div", { key: 1, className: "h-3 w-3/5 animate-pulse rounded bg-gray-200" }),
      h("div", { key: 2, className: "h-3 w-full animate-pulse rounded bg-gray-200" }),
      h("div", { key: 3, className: "h-3 w-11/12 animate-pulse rounded bg-gray-200" }),
      h("div", { key: 4, className: "h-3 w-4/5 animate-pulse rounded bg-gray-200" }),
      h("div", { key: 5, className: "h-3 w-2/3 animate-pulse rounded bg-gray-200" })
    ])
  ]);
}

Object.assign(window, { AIProposalCard });
