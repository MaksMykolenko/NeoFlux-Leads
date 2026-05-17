import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { LeadMode } from "@/src/lib/leadMode";
import { requireUser } from "@/src/lib/session";
import AuditButton from "@/src/components/AuditButton";
import StatusPicker from "@/src/components/StatusPicker";
import AIProposalGenerator from "@/src/components/AIProposalGenerator";
import {
  DeliveryStatusBadge,
  ReplyStatusEditor,
} from "@/src/components/MessageStatusBadges";
import { getScoreContext } from "@/src/lib/scoring";
import { buildLeadInsights, type ScoreBreakdownItem } from "@/src/lib/leadInsights";
import {
  CHANNELS,
  channelTranslated,
  getAvailableChannels,
  parseContacts,
  universalSocialLinkRows,
  type ChannelKey,
} from "@/src/lib/channels";

export const dynamic = "force-dynamic";

function getPerformanceScoreColor(score: number): string {
  if (score > 80) return "text-green-600 dark:text-emerald-400";
  if (score > 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("LeadDetail");
  const tc = await getTranslations("Channels");

  const dateLocale =
    locale === "en" ? "en-US" : locale === "pl" ? "pl-PL" : "uk-UA";
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  });
  const formatDateLocalized = (date: Date) => dateFormatter.format(date);

  const user = await requireUser();

  // findFirst з userId-фільтром: чужий лід виглядатиме як 404, не як 403.
  // Це безпечніше з UX-боку — не розкриваємо існування чужих ID.
  const lead = await prisma.lead.findFirst({
    where: { id, userId: user.id },
    include: {
      audit: true,
      messages: { orderBy: { sentAt: "desc" } },
    },
  });

  if (!lead) {
    notFound();
  }

  const isBeats = lead.mode === LeadMode.BEATS;
  const isUniversal = lead.mode === LeadMode.UNIVERSAL;

  const backHref =
    lead.mode === LeadMode.BEATS
      ? "/dashboard?mode=beats"
      : lead.mode === LeadMode.UNIVERSAL
        ? "/dashboard?mode=universal"
        : "/dashboard";

  // Single source of truth: `lead.score` з БД. Перерахунок відбувається в
  // місцях запису (createLead, runAuditForLead, autopilot step-2-audit), а
  // не на льоту при рендері — щоб усі поверхні (Table/Kanban/детальна) бачили
  // однакове число.
  const opportunityScore = lead.score;
  const scoreCtx = getScoreContext(opportunityScore);
  const levelPillLabel =
    scoreCtx.level === "high"
      ? t("scoreBadgeHigh")
      : scoreCtx.level === "medium"
        ? t("scoreBadgeMedium")
        : t("scoreBadgeLow");
  const scoreDescription =
    scoreCtx.labelKey === "high"
      ? t("scoreLabel.high")
      : scoreCtx.labelKey === "medium"
        ? t("scoreLabel.medium")
        : t("scoreLabel.low");
  const scoreFootnote = isBeats
    ? t("scoreHintBeats")
    : !isUniversal
      ? t("scoreHintLocalNoAudit")
      : isUniversal && !lead.audit
        ? t("scoreHintUniversalNoAudit")
      : null;
  const leadInsights = buildLeadInsights({
    mode: lead.mode,
    website: lead.website,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    category: lead.category,
    city: lead.city,
    notes: lead.notes,
    painPoints: lead.painPoints,
    hasOnlineBooking: lead.hasOnlineBooking,
    followers: lead.followers,
    lookingForType: lead.lookingForType,
    audit: lead.audit,
    updatedAt: lead.updatedAt,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-flux-card">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors dark:text-zinc-400 dark:hover:text-zinc-100"
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
          {t("back")}
        </Link>

        <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {lead.companyName}
            </h1>
            {isBeats ? (
              (lead.realName || lead.category || lead.source) && (
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {[lead.realName, lead.category, lead.source]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )
            ) : isUniversal ? (
              lead.notes && (
                <p className="mt-1.5 text-sm text-zinc-500 line-clamp-3 dark:text-zinc-400">
                  {lead.notes}
                </p>
              )
            ) : (
              (lead.category || lead.city) && (
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {[lead.category, lead.city].filter(Boolean).join(" · ")}
                </p>
              )
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
            styles={scoreCtx}
            levelPillLabel={levelPillLabel}
            scoreDescription={scoreDescription}
            footnote={scoreFootnote}
            scoreHeading={t("scoreHeading")}
            scoreTitle={t("scoreTitle")}
            breakdown={leadInsights.scoreBreakdown}
            breakdownTitle={t("scoreBreakdownTitle")}
          />
        </div>

        <div className="mt-6">
          <LeadContextCard
            why={leadInsights.why}
            suggestedAngle={leadInsights.suggestedAngle}
            source={lead.source}
            website={lead.website}
            contactPage={null}
            lastChecked={formatDateLocalized(leadInsights.lastCheckedAt)}
            offer={leadInsights.searchContext.offer}
            language={leadInsights.searchContext.language}
            t={t}
          />
        </div>

        <div className="mt-6">
          <AIProposalGenerator
            leadId={lead.id}
            companyName={lead.companyName}
            leadEmail={lead.email}
          />
        </div>

        <div
          className={`mt-6 grid grid-cols-1 gap-6 ${
            isBeats ? "" : "lg:grid-cols-2"
          }`}
        >
          <ContactsCard
            lead={lead}
            isBeats={isBeats}
            isUniversal={isUniversal}
            t={t}
            tc={tc}
          />
          {!isBeats && (
            <AuditCard
              audit={lead.audit}
              leadId={lead.id}
              hasWebsite={!!lead.website}
              t={t}
            />
          )}

          <section
            className={`bg-white rounded-xl shadow-sm border border-zinc-200 p-6 dark:bg-flux-card dark:border-flux-border ${
              isBeats ? "" : "lg:col-span-2"
            }`}
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {t("systemInfoTitle")}
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SystemField
                label={isBeats ? t("systemPlatform") : t("systemSource")}
                value={lead.source ?? null}
                emptyLabel={t("notProvided")}
              />
              <SystemField
                label={t("created")}
                value={formatDateLocalized(lead.createdAt)}
              />
              <SystemField
                label={t("updated")}
                value={formatDateLocalized(lead.updatedAt)}
              />
            </dl>
          </section>
        </div>

        <div className="mt-6">
          <MessageHistoryFeed
            messages={lead.messages}
            formatDate={formatDateLocalized}
            t={t}
            tc={tc}
          />
        </div>
      </div>
    </div>
  );
}

function OpportunityScoreCard({
  score,
  styles: ctx,
  levelPillLabel,
  scoreDescription,
  footnote,
  scoreHeading,
  scoreTitle,
  breakdown,
  breakdownTitle,
}: {
  score: number;
  styles: ReturnType<typeof getScoreContext>;
  levelPillLabel: string;
  scoreDescription: string;
  footnote: string | null;
  scoreHeading: string;
  scoreTitle: string;
  breakdown: ScoreBreakdownItem[];
  breakdownTitle: string;
}) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 dark:bg-flux-card dark:border-flux-border">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {scoreHeading}
          </p>
          <h2 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {scoreTitle}
          </h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${ctx.bgColor} ${ctx.textColor} ${ctx.ringColor}`}
        >
          {levelPillLabel}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-7xl font-semibold tabular-nums tracking-tight leading-none ${ctx.textColor}`}
          >
            {score}
          </span>
          <span className="text-base text-zinc-400 dark:text-zinc-500">/ 100</span>
        </div>
        <p className={`text-sm font-medium ${ctx.textColor}`}>{scoreDescription}</p>
      </div>

      <div className="mt-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${ctx.barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        {footnote ? (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{footnote}</p>
        ) : null}
      </div>

      {breakdown.length > 0 && (
        <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-flux-border dark:bg-flux-card-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {breakdownTitle}
          </h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {breakdown.map((item) => (
              <li
                key={`${item.label}-${item.points}`}
                className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-xs ring-1 ring-zinc-200 dark:bg-flux-card dark:ring-flux-border"
              >
                <span className="text-zinc-600 dark:text-zinc-300">
                  {item.label}
                </span>
                <span
                  className={`font-semibold tabular-nums ${
                    item.points >= 0
                      ? "text-purple-700 dark:text-flux-purple-soft"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {item.points > 0 ? `+${item.points}` : item.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function LeadContextCard({
  why,
  suggestedAngle,
  source,
  website,
  contactPage,
  lastChecked,
  offer,
  language,
  t,
}: {
  why: string;
  suggestedAngle: string;
  source: string | null;
  website: string | null;
  contactPage: string | null;
  lastChecked: string;
  offer: string | null;
  language: string | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const sourceHref = extractFirstUrl(source);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-flux-border dark:bg-flux-card">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {t("whyThisLeadTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {why}
          </p>
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t("suggestedAngleTitle")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            {suggestedAngle}
          </p>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">
          <ContextField
            label={t("sourceUrl")}
            value={source}
            emptyLabel={t("notProvided")}
            href={sourceHref}
          />
          <ContextField
            label={t("websiteUrl")}
            value={website}
            emptyLabel={t("notProvided")}
            href={website}
          />
          <ContextField
            label={t("contactPageUrl")}
            value={contactPage}
            emptyLabel={t("notProvided")}
            href={contactPage}
          />
          <ContextField
            label={t("lastChecked")}
            value={lastChecked}
            emptyLabel={t("notProvided")}
          />
          {offer && (
            <ContextField
              label={t("campaignOffer")}
              value={offer}
              emptyLabel={t("notProvided")}
            />
          )}
          {language && (
            <ContextField
              label={t("campaignLanguage")}
              value={language}
              emptyLabel={t("notProvided")}
            />
          )}
        </dl>
      </div>
    </section>
  );
}

function ContextField({
  label,
  value,
  emptyLabel,
  href,
}: {
  label: string;
  value: string | null;
  emptyLabel: string;
  href?: string | null;
}) {
  const displayValue = value ? (
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate text-purple-600 hover:text-purple-800 hover:underline dark:text-flux-purple-soft dark:hover:text-white"
      >
        {href === value ? stripProtocol(value) : value}
      </a>
    ) : (
      <span className="truncate text-zinc-900 dark:text-zinc-50">{value}</span>
    )
  ) : (
    <span className="text-zinc-400 dark:text-zinc-500">{emptyLabel}</span>
  );

  return (
    <div className="min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-flux-border dark:bg-flux-card-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 flex min-w-0">{displayValue}</dd>
    </div>
  );
}

function extractFirstUrl(value: string | null): string | null {
  const match = value?.match(/https?:\/\/\S+/);
  return match?.[0] ?? null;
}

interface ContactsCardProps {
  lead: {
    category: string | null;
    city: string | null;
    phone: string | null;
    website: string | null;
    email: string | null;
    realName: string | null;
    source: string | null;
    followers: number | null;
    lookingForType: boolean | null;
    socialLinks: unknown;
    notes: string | null;
  };
  isBeats: boolean;
  isUniversal: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
  tc: (key: string, values?: Record<string, string | number>) => string;
}

function fmtFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `${n}`;
}

function ContactsCard({
  lead,
  isBeats,
  isUniversal,
  t,
  tc,
}: ContactsCardProps) {
  if (isBeats) {
    // Unify any legacy top-level email into the social-links blob so
    // `getAvailableChannels` returns it alongside Instagram/Telegram/etc.
    const parsedContacts = parseContacts(lead.socialLinks) ?? {};
    if (lead.email && !parsedContacts.email) parsedContacts.email = lead.email;
    if (lead.phone && !parsedContacts.phone) parsedContacts.phone = lead.phone;
    const channels = getAvailableChannels(parsedContacts);

    return (
      <section className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 dark:bg-flux-card dark:border-flux-border">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t("contactsTitle")}</h2>
          {channels.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {channels.length}{" "}
              {channels.length === 1 ? t("channelsOne") : t("channelsMany")}
            </span>
          )}
        </div>

        <dl className="mt-4 divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          <ContactRow label={t("realName")} value={lead.realName} emptyLabel={t("notProvided")} />
          <ContactRow label={t("genre")} value={lead.category} emptyLabel={t("notProvided")} />
          <ContactRow label={t("platform")} value={lead.source} emptyLabel={t("notProvided")} />
          <ContactRow
            label={t("audience")}
            value={lead.followers != null ? `${lead.followers}` : null}
            emptyLabel={t("notProvided")}
          >
            {lead.followers != null && (
              <span className="text-zinc-900 tabular-nums dark:text-zinc-50">
                {t("followersFmt", { count: fmtFollowers(lead.followers) })}
              </span>
            )}
          </ContactRow>
          <ContactRow
            label={t("typeBeats")}
            value={lead.lookingForType ? t("typeYes") : t("typeNo")}
            emptyLabel={t("notProvided")}
          >
            {lead.lookingForType ? (
              <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30">
                {t("seekingBadge")}
              </span>
            ) : (
              <span className="text-zinc-500 dark:text-zinc-400">{t("notSeekingPublic")}</span>
            )}
          </ContactRow>
        </dl>

        {channels.length > 0 ? (
          <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-flux-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 dark:text-zinc-400">
              {t("channelsHeading")}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {channels.map(({ def, value }) => {
                const ui = channelTranslated(def.key, tc);
                return (
                  <a
                    key={def.key}
                    href={def.buildHref(value)}
                    target={def.key === "phone" || def.key === "email" ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-flux-border dark:bg-flux-card dark:hover:bg-zinc-800"
                  >
                    <def.Icon className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
                    <span className="font-medium text-zinc-900 flex-shrink-0 dark:text-zinc-50">
                      {ui.label}
                    </span>
                    <span className="text-zinc-500 truncate dark:text-zinc-400">{value}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="mt-5 border-t border-zinc-100 pt-5 text-sm text-zinc-400 dark:border-flux-border dark:text-zinc-500">
            {t("noChannels")}
          </p>
        )}
      </section>
    );
  }

  if (isUniversal) {
    const socialRows = universalSocialLinkRows(lead.socialLinks);
    return (
      <section className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 dark:bg-flux-card dark:border-flux-border">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t("contactsTitle")}</h2>
        <dl className="mt-4 divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          <ContactRow label={t("universalDesc")} value={lead.notes} emptyLabel={t("notProvided")}>
            {lead.notes ? (
              <span className="text-zinc-900 whitespace-pre-wrap text-right text-xs max-w-[70%] dark:text-zinc-50">
                {lead.notes}
              </span>
            ) : undefined}
          </ContactRow>
          <ContactRow label={t("site")} value={lead.website} emptyLabel={t("notProvided")}>
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 hover:underline transition-colors dark:text-flux-purple-soft dark:hover:text-white"
              >
                {stripProtocol(lead.website)}
              </a>
            )}
          </ContactRow>
          <ContactRow label={t("email")} value={lead.email} emptyLabel={t("notProvided")}>
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="text-purple-600 hover:text-purple-800 hover:underline transition-colors dark:text-flux-purple-soft dark:hover:text-white"
              >
                {lead.email}
              </a>
            )}
          </ContactRow>
          <ContactRow label={t("phone")} value={lead.phone} emptyLabel={t("notProvided")}>
            {lead.phone && (
              <a
                href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                className="text-zinc-900 hover:text-purple-600 transition-colors dark:text-zinc-50"
              >
                {lead.phone}
              </a>
            )}
          </ContactRow>
        </dl>

        {socialRows.length > 0 ? (
          <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-flux-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 dark:text-zinc-400">
              {t("socialHeading")}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {socialRows.map((row) => (
                <a
                  key={`${row.label}-${row.href}`}
                  href={row.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-flux-border dark:bg-flux-card dark:hover:bg-zinc-800"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{row.label}</span>
                  <span className="text-zinc-500 truncate dark:text-zinc-400">{row.display}</span>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-5 border-t border-zinc-100 pt-5 text-sm text-zinc-400 dark:border-flux-border dark:text-zinc-500">
            {t("noSocialExtra")}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 dark:bg-flux-card dark:border-flux-border">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t("contactsTitle")}</h2>
      <dl className="mt-4 divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
        <ContactRow label={t("category")} value={lead.category} emptyLabel={t("notProvided")} />
        <ContactRow label={t("city")} value={lead.city} emptyLabel={t("notProvided")} />
        <ContactRow label={t("phone")} value={lead.phone} emptyLabel={t("notProvided")}>
          {lead.phone && (
            <a
              href={`tel:${lead.phone.replace(/\s+/g, "")}`}
              className="text-zinc-900 hover:text-purple-600 transition-colors dark:text-zinc-50"
            >
              {lead.phone}
            </a>
          )}
        </ContactRow>
        <ContactRow label={t("site")} value={lead.website} emptyLabel={t("notProvided")}>
          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 hover:underline transition-colors dark:text-flux-purple-soft dark:hover:text-white"
            >
              {stripProtocol(lead.website)}
            </a>
          )}
        </ContactRow>
        <ContactRow label={t("email")} value={lead.email} emptyLabel={t("notProvided")}>
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="text-purple-600 hover:text-purple-800 hover:underline transition-colors dark:text-flux-purple-soft dark:hover:text-white"
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
  emptyLabel,
}: {
  label: string;
  value: string | null;
  children?: React.ReactNode;
  emptyLabel: string;
}) {
  const display = value
    ? children ?? <span className="text-zinc-900 dark:text-zinc-50">{value}</span>
    : <span className="text-zinc-400 dark:text-zinc-500">{emptyLabel}</span>;

  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
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
  t: (key: string, values?: Record<string, string | number>) => string;
}

function AuditCard({ audit, leadId, hasWebsite, t }: AuditCardProps) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 dark:bg-flux-card dark:border-flux-border">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t("auditTitle")}</h2>

      {!audit ? (
        <div className="mt-4 flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-zinc-400 dark:text-zinc-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("auditEmptyTitle")}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {hasWebsite ? t("auditEmptyHintWeb") : t("auditEmptyHintNoSite")}
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
            <span className="text-sm text-zinc-400 dark:text-zinc-500">/ 100</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <CheckBadge label={t("ssl")} ok={audit.hasSSL} />
            <CheckBadge label={t("mobile")} ok={audit.mobileFriendly} />
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 dark:text-zinc-400">
              {t("issuesHeading")}
            </h3>
            {audit.issues.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("issuesNone")}</p>
            ) : (
              <ul className="space-y-2">
                {audit.issues.map((issue, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-400" />
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
        ok
          ? "border-green-200 bg-green-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
          : "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
      }`}
    >
      {ok ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 text-green-600 dark:text-emerald-400"
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
          className="w-4 h-4 text-red-600 dark:text-red-400"
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
          ok ? "text-green-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
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
  emptyLabel,
}: {
  label: string;
  value: string | null;
  emptyLabel?: string;
}) {
  const fallback = emptyLabel ?? "—";
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm text-zinc-900 dark:text-zinc-50">
        {value ?? <span className="text-zinc-400 dark:text-zinc-500">{fallback}</span>}
      </dd>
    </div>
  );
}

interface MessageAttachment {
  name?: string | null;
  bytes?: number | null;
  bpm?: string | null;
  keySig?: string | null;
  genre?: string | null;
  price?: string | null;
}

interface MessageItem {
  id: string;
  subject: string;
  body: string;
  sentAt: Date;
  replyStatus: string;
  deliveryStatus: string;
  errorLog: string | null;
  attachment: unknown;
  channels: unknown;
}

function asChannels(value: unknown): ChannelKey[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (k): k is ChannelKey => typeof k === "string" && k in CHANNELS
  );
}

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function asAttachment(value: unknown): MessageAttachment | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  return {
    name: typeof v.name === "string" ? v.name : null,
    bytes: typeof v.bytes === "number" ? v.bytes : null,
    bpm: typeof v.bpm === "string" ? v.bpm : null,
    keySig: typeof v.keySig === "string" ? v.keySig : null,
    genre: typeof v.genre === "string" ? v.genre : null,
    price: typeof v.price === "string" ? v.price : null,
  };
}

function MessageHistoryFeed({
  messages,
  formatDate,
  t,
  tc,
}: {
  messages: MessageItem[];
  formatDate: (d: Date) => string;
  t: (key: string, values?: Record<string, string | number>) => string;
  tc: (key: string, values?: Record<string, string | number>) => string;
}) {
  if (messages.length === 0) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 dark:bg-flux-card dark:border-flux-border">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {t("messagesTitle")}
        </h2>
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-zinc-400 dark:text-zinc-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("messagesEmptyTitle")}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("messagesEmptyHint")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 dark:bg-flux-card dark:border-flux-border">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {t("messagesTitle")}
        </h2>
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {messages.length}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {messages.map((msg) => (
          <details
            key={msg.id}
            className="group rounded-lg border border-zinc-200 transition-colors hover:border-zinc-300 open:border-purple-200 open:bg-purple-50/40 dark:border-flux-border"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <time dateTime={msg.sentAt.toISOString()}>
                    {formatDate(msg.sentAt)}
                  </time>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <DeliveryStatusBadge
                    status={msg.deliveryStatus}
                    errorLog={msg.errorLog}
                  />
                  <ReplyStatusEditor
                    messageId={msg.id}
                    initialStatus={msg.replyStatus}
                  />
                </div>
                <h3 className="mt-1 text-sm font-medium text-zinc-900 truncate dark:text-zinc-50">
                  {msg.subject}
                </h3>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 mt-1 flex-shrink-0 text-zinc-400 transition-transform group-open:rotate-180 dark:text-zinc-500"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </summary>
            <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap dark:border-flux-border dark:bg-flux-card dark:text-zinc-300">
              {msg.body}
              <MessageAttachmentBadge attachment={asAttachment(msg.attachment)} />
              <MessageChannelsBadge channels={asChannels(msg.channels)} tc={tc} t={t} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function MessageAttachmentBadge({
  attachment,
}: {
  attachment: MessageAttachment | null;
}) {
  if (!attachment || !attachment.name) return null;
  const meta = [
    attachment.bpm ? `${attachment.bpm} BPM` : null,
    attachment.keySig,
    attachment.genre,
    attachment.price ? `$${attachment.price}` : null,
    attachment.bytes ? fmtBytes(attachment.bytes) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mt-3 flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-xs not-prose dark:border-violet-500/30 dark:bg-violet-500/10">
      <span className="text-violet-700 dark:text-violet-300">♪</span>
      <span className="font-medium text-violet-900 truncate dark:text-violet-100">
        {attachment.name}
      </span>
      {meta && <span className="text-violet-700/70 dark:text-violet-300/70">· {meta}</span>}
    </div>
  );
}

function MessageChannelsBadge({
  channels,
  tc,
  t,
}: {
  channels: ChannelKey[];
  tc: (key: string, values?: Record<string, string | number>) => string;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  if (channels.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 not-prose">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {t("sentVia")}
      </span>
      {channels.map((key) => {
        const def = CHANNELS[key];
        const ui = channelTranslated(key, tc);
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-inset ring-purple-200 dark:bg-flux-purple-tint dark:text-flux-purple-soft dark:ring-flux-purple-ring"
          >
            <def.Icon className="w-3 h-3" />
            {ui.label}
          </span>
        );
      })}
    </div>
  );
}
