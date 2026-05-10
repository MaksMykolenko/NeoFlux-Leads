/* global React, ChevronLeft, ChevronDown, EnvelopeOutline, Card, CardTitle, EmptyState, StatusPicker, OpportunityScore, AuditCard, AIProposalCard, calculateLeadScore */
const { createElement: h, useState } = React;

const fmt = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit", month: "long", year: "numeric",
  hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kyiv"
});
const formatDate = (d) => fmt.format(new Date(d));
const stripProto = (u) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

function LeadDetail({ lead, onBack, onStatusChange, onRunAudit, onSaveMessage }) {
  const score = calculateLeadScore(lead);

  return h("div", { className: "min-h-screen bg-gray-50" },
    h("div", { className: "mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8" }, [
      h("a", {
        key: "back",
        href: "#",
        onClick: (e) => { e.preventDefault(); onBack(); },
        className: "inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      }, [
        h(ChevronLeft, { key: "i", className: "w-4 h-4" }),
        "Назад до списку"
      ]),

      h("header", { key: "head", className: "mt-5 flex flex-wrap items-start justify-between gap-4" }, [
        h("div", { key: "l", className: "min-w-0" }, [
          h("h1", { key: "t", className: "text-3xl font-semibold tracking-tight text-gray-900" }, lead.companyName),
          (lead.category || lead.city) && h("p", {
            key: "s",
            className: "mt-1.5 text-sm text-gray-500"
          }, [lead.category, lead.city].filter(Boolean).join(" · "))
        ]),
        h(StatusPicker, { key: "p", status: lead.status, onChange: onStatusChange })
      ]),

      h("div", { key: "score", className: "mt-6" },
        h(OpportunityScore, { score, hasAudit: !!lead.audit })
      ),

      h("div", { key: "ai", className: "mt-6" },
        h(AIProposalCard, {
          companyName: lead.companyName,
          leadId: lead.id,
          audit: lead.audit,
          onSave: onSaveMessage
        })
      ),

      h("div", { key: "grid", className: "mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2" }, [
        h(ContactsCard, { key: "c", lead }),
        h(AuditCard, { key: "a", audit: lead.audit, hasWebsite: !!lead.website, onRunAudit }),
        h("section", {
          key: "sys",
          className: "lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        }, [
          h(CardTitle, { key: "t" }, "Системна інформація"),
          h("dl", { key: "dl", className: "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3" }, [
            h(SystemField, { key: 1, label: "Джерело", value: lead.source }),
            h(SystemField, { key: 2, label: "Створено", value: formatDate(lead.createdAt) }),
            h(SystemField, { key: 3, label: "Оновлено", value: formatDate(lead.updatedAt) })
          ])
        ])
      ]),

      h("div", { key: "msg", className: "mt-6" },
        h(MessageHistory, { messages: lead.messages })
      )
    ])
  );
}

function ContactsCard({ lead }) {
  const rows = [
    { label: "Категорія", value: lead.category, render: (v) => v },
    { label: "Місто", value: lead.city, render: (v) => v },
    { label: "Телефон", value: lead.phone, render: (v) =>
        h("a", { href: `tel:${v.replace(/\s+/g, "")}`, className: "text-gray-900 hover:text-blue-600 transition-colors" }, v)
    },
    { label: "Сайт", value: lead.website, render: (v) =>
        h("a", { href: v, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 hover:text-blue-800 hover:underline transition-colors" }, stripProto(v))
    },
    { label: "Email", value: lead.email, render: (v) =>
        h("a", { href: `mailto:${v}`, className: "text-blue-600 hover:text-blue-800 hover:underline transition-colors" }, v)
    }
  ];

  return h(Card, null, [
    h(CardTitle, { key: "t" }, "Контакти"),
    h("dl", { key: "dl", className: "mt-4 divide-y divide-gray-100 text-sm" },
      rows.map((r, i) => h("div", {
        key: i,
        className: "flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
      }, [
        h("dt", { key: "l", className: "text-gray-500" }, r.label),
        h("dd", { key: "v", className: "text-right truncate max-w-[60%]" },
          r.value
            ? r.render(r.value)
            : h("span", { className: "text-gray-400" }, "Не вказано")
        )
      ]))
    )
  ]);
}

function SystemField({ label, value }) {
  return h("div", null, [
    h("dt", { key: "l", className: "text-xs font-semibold uppercase tracking-wider text-gray-500" }, label),
    h("dd", { key: "v", className: "mt-1.5 text-sm text-gray-900" },
      value ?? h("span", { className: "text-gray-400" }, "Не вказано")
    )
  ]);
}

const REPLY_STYLES = {
  "No Reply": "bg-gray-100 text-gray-600",
  "Replied":  "bg-green-100 text-green-700",
  "Bounced":  "bg-red-100 text-red-700"
};

function ReplyStatusBadge({ status }) {
  const cls = REPLY_STYLES[status] || "bg-gray-100 text-gray-600";
  return h("span", {
    className: `inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cls}`
  }, status);
}

function MessageHistory({ messages }) {
  if (messages.length === 0) {
    return h(Card, null, [
      h(CardTitle, { key: "t" }, "Історія повідомлень"),
      h("div", { key: "e", className: "mt-4" },
        h(EmptyState, {
          icon: h(EnvelopeOutline, { className: "w-6 h-6" }),
          title: "Поки що немає надісланих листів",
          body: "Згенеруйте та збережіть AI-пропозицію вище, щоб почати історію."
        })
      )
    ]);
  }

  return h(Card, null, [
    h("div", { key: "h", className: "flex items-center justify-between gap-3" }, [
      h(CardTitle, { key: "t" }, "Історія повідомлень"),
      h("span", {
        key: "c",
        className: "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
      }, messages.length)
    ]),
    h("div", { key: "list", className: "mt-4 space-y-2" },
      messages.map((m) => h(MessageItem, { key: m.id, msg: m }))
    )
  ]);
}

function MessageItem({ msg }) {
  const [open, setOpen] = useState(false);
  return h("div", {
    className: `group rounded-lg border transition-colors ${
      open ? "border-blue-200 bg-blue-50/30" : "border-gray-200 hover:border-gray-300"
    }`
  }, [
    h("div", {
      key: "sum",
      onClick: () => setOpen((o) => !o),
      className: "flex cursor-pointer items-start justify-between gap-3 px-4 py-3"
    }, [
      h("div", { key: "l", className: "min-w-0 flex-1" }, [
        h("div", { key: "meta", className: "flex items-center gap-2 text-xs text-gray-500" }, [
          h("time", { key: "t" }, formatDate(msg.sentAt)),
          h("span", { key: "d", className: "text-gray-300" }, "·"),
          h(ReplyStatusBadge, { key: "r", status: msg.replyStatus })
        ]),
        h("h3", { key: "s", className: "mt-1 text-sm font-medium text-gray-900 truncate" }, msg.subject)
      ]),
      h(ChevronDown, {
        key: "i",
        className: `w-4 h-4 mt-1 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`
      })
    ]),
    open && h("div", {
      key: "body",
      className: "border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap"
    }, msg.body)
  ]);
}

Object.assign(window, { LeadDetail });
