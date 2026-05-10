import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import AuditButton from "@/src/components/AuditButton";
import StatusPicker from "@/src/components/StatusPicker";
import AIProposalGenerator from "@/src/components/AIProposalGenerator";
import { calculateLeadScore, getScoreContext } from "@/src/lib/scoring";

export const dynamic = "force-dynamic";

const DATE_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Kyiv",
});

function formatDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}

function getPerformanceScoreColor(score: number): string {
  if (score > 80) return "text-green-600";
  if (score > 50) return "text-amber-600";
  return "text-red-600";
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      audit: true,
      messages: { orderBy: { sentAt: "desc" } },
    },
  });

  if (!lead) {
    notFound();
  }

  // We compute the score live for display so the UI stays accurate even if
  // the persisted `lead.score` lags (e.g. before the first audit run, or
  // after a manual website edit). The persisted value is still kept in sync
  // by `runAuditForLead` for query/sort use cases.
  const opportunityScore = calculateLeadScore(
    { website: lead.website, email: lead.email },
    lead.audit
      ? { hasSSL: lead.audit.hasSSL, mobileFriendly: lead.audit.mobileFriendly }
      : null
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
              clipRule="evenodd"
            />
          </svg>
          Назад до списку
        </Link>

        <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {lead.companyName}
            </h1>
            {(lead.category || lead.city) && (
              <p className="mt-1.5 text-sm text-gray-500">
                {[lead.category, lead.city].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <StatusPicker
            key={lead.status}
            leadId={lead.id}
            initialStatus={lead.status}
          />
        </header>

        <div className="mt-6">
          <OpportunityScoreCard
            score={opportunityScore}
            hasAudit={!!lead.audit}
          />
        </div>

        <div className="mt-6">
          <AIProposalGenerator
            leadId={lead.id}
            companyName={lead.companyName}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ContactsCard lead={lead} />
          <AuditCard
            audit={lead.audit}
            leadId={lead.id}
            hasWebsite={!!lead.website}
          />

          <section className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900">
              Системна інформація
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SystemField label="Джерело" value={lead.source ?? null} />
              <SystemField
                label="Створено"
                value={formatDate(lead.createdAt)}
              />
              <SystemField
                label="Оновлено"
                value={formatDate(lead.updatedAt)}
              />
            </dl>
          </section>
        </div>

        <div className="mt-6">
          <MessageHistoryFeed messages={lead.messages} />
        </div>
      </div>
    </div>
  );
}

function OpportunityScoreCard({
  score,
  hasAudit,
}: {
  score: number;
  hasAudit: boolean;
}) {
  const ctx = getScoreContext(score);

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Opportunity Score
          </p>
          <h2 className="mt-1 text-base font-semibold text-gray-900">
            Пріоритет ліда для продажу
          </h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${ctx.bgColor} ${ctx.textColor} ${ctx.ringColor}`}
        >
          {ctx.level === "high"
            ? "Високий"
            : ctx.level === "medium"
            ? "Середній"
            : "Низький"}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-7xl font-semibold tabular-nums tracking-tight leading-none ${ctx.textColor}`}
          >
            {score}
          </span>
          <span className="text-base text-gray-400">/ 100</span>
        </div>
        <p className={`text-sm font-medium ${ctx.textColor}`}>{ctx.label}</p>
      </div>

      <div className="mt-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${ctx.barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        {!hasAudit && (
          <p className="mt-3 text-xs text-gray-500">
            Бал розрахований із наявних даних. Запустіть аудит сайту, щоб
            врахувати SSL та mobile-friendly чинники.
          </p>
        )}
      </div>
    </section>
  );
}

interface ContactsCardProps {
  lead: {
    category: string | null;
    city: string | null;
    phone: string | null;
    website: string | null;
    email: string | null;
  };
}

function ContactsCard({ lead }: ContactsCardProps) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900">Контакти</h2>
      <dl className="mt-4 divide-y divide-gray-100 text-sm">
        <ContactRow label="Категорія" value={lead.category} />
        <ContactRow label="Місто" value={lead.city} />
        <ContactRow label="Телефон" value={lead.phone}>
          {lead.phone && (
            <a
              href={`tel:${lead.phone.replace(/\s+/g, "")}`}
              className="text-gray-900 hover:text-blue-600 transition-colors"
            >
              {lead.phone}
            </a>
          )}
        </ContactRow>
        <ContactRow label="Сайт" value={lead.website}>
          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              {stripProtocol(lead.website)}
            </a>
          )}
        </ContactRow>
        <ContactRow label="Email" value={lead.email}>
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              {lead.email}
            </a>
          )}
        </ContactRow>
      </dl>
    </section>
  );
}

function ContactRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string | null;
  children?: React.ReactNode;
}) {
  const display = value
    ? children ?? <span className="text-gray-900">{value}</span>
    : <span className="text-gray-400">Не вказано</span>;

  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right truncate max-w-[60%]">{display}</dd>
    </div>
  );
}

interface AuditCardProps {
  audit: {
    performanceScore: number | null;
    hasSSL: boolean;
    mobileFriendly: boolean;
    issues: string[];
  } | null;
  leadId: string;
  hasWebsite: boolean;
}

function AuditCard({ audit, leadId, hasWebsite }: AuditCardProps) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900">Аудит сайту</h2>

      {!audit ? (
        <div className="mt-4 flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-700">
            Аудит ще не проводився
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {hasWebsite
              ? "Запустіть аналіз сайту, щоб побачити Performance Score."
              : "У ліда відсутній сайт — аудит неможливий."}
          </p>
          {hasWebsite && (
            <div className="mt-4 flex justify-center">
              <AuditButton leadId={leadId} hasAudit={false} />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-baseline gap-2">
            <span
              className={`text-5xl font-semibold tabular-nums tracking-tight ${getPerformanceScoreColor(
                audit.performanceScore ?? 0
              )}`}
            >
              {audit.performanceScore ?? "—"}
            </span>
            <span className="text-sm text-gray-400">/ 100</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <CheckBadge label="SSL" ok={audit.hasSSL} />
            <CheckBadge label="Mobile-friendly" ok={audit.mobileFriendly} />
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Знайдені проблеми
            </h3>
            {audit.issues.length === 0 ? (
              <p className="text-sm text-gray-500">Проблем не знайдено</p>
            ) : (
              <ul className="space-y-2">
                {audit.issues.map((issue, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-gray-400" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function CheckBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
        ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      }`}
    >
      {ok ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 text-green-600"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 text-red-600"
        >
          <path
            fillRule="evenodd"
            d="M5.47 5.47a.75.75 0 0 1 1.06 0L10 8.94l3.47-3.47a.75.75 0 1 1 1.06 1.06L11.06 10l3.47 3.47a.75.75 0 1 1-1.06 1.06L10 11.06l-3.47 3.47a.75.75 0 0 1-1.06-1.06L8.94 10 5.47 6.53a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span
        className={`text-sm font-medium ${
          ok ? "text-green-700" : "text-red-700"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function SystemField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm text-gray-900">
        {value ?? <span className="text-gray-400">Не вказано</span>}
      </dd>
    </div>
  );
}

interface MessageItem {
  id: string;
  subject: string;
  body: string;
  sentAt: Date;
  replyStatus: string;
}

function MessageHistoryFeed({ messages }: { messages: MessageItem[] }) {
  if (messages.length === 0) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900">
          Історія повідомлень
        </h2>
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-700">
            Поки що немає надісланих листів
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Згенеруйте та збережіть AI-пропозицію вище, щоб почати історію.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">
          Історія повідомлень
        </h2>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {messages.length}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {messages.map((msg) => (
          <details
            key={msg.id}
            className="group rounded-lg border border-gray-200 transition-colors hover:border-gray-300 open:border-blue-200 open:bg-blue-50/30"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <time dateTime={msg.sentAt.toISOString()}>
                    {formatDate(msg.sentAt)}
                  </time>
                  <span className="text-gray-300">·</span>
                  <ReplyStatusBadge status={msg.replyStatus} />
                </div>
                <h3 className="mt-1 text-sm font-medium text-gray-900 truncate">
                  {msg.subject}
                </h3>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 mt-1 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </summary>
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {msg.body}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

const REPLY_STATUS_STYLES: Record<string, string> = {
  "No Reply": "bg-gray-100 text-gray-600",
  Replied: "bg-green-100 text-green-700",
  Bounced: "bg-red-100 text-red-700",
};

function ReplyStatusBadge({ status }: { status: string }) {
  const cls = REPLY_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cls}`}
    >
      {status}
    </span>
  );
}
