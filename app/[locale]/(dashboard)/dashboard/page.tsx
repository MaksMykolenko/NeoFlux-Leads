import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/src/lib/prisma";
import {
  LeadMode,
  modeFromQuery,
  modeKeyFromMode,
} from "@/src/lib/leadMode";
import { requireUser } from "@/src/lib/session";
import {
  getLeadLimitStatus,
  getPlanForUser,
} from "@/src/lib/subscription";
import ScraperForm from "@/src/components/ScraperForm";
import BeatOutreach from "@/src/components/BeatOutreach";
import UniversalOutreach from "@/src/components/UniversalOutreach";
import CsvUploader from "@/src/components/CsvUploader";
import CheckoutSuccessBanner from "@/src/components/CheckoutSuccessBanner";
import ManageSubscriptionButton from "@/src/components/ManageSubscriptionButton";
import BrandMark from "@/src/components/BrandMark";
import LeadsTableSection from "@/src/components/LeadsTableSection";
import CampaignSummary, {
  type CampaignSummaryItem,
} from "@/src/components/CampaignSummary";
import LeadKanbanBoard, {
  type KanbanLead,
} from "@/src/components/LeadKanbanBoard";
import LeadViewToggle, {
  type LeadView,
} from "@/src/components/LeadViewToggle";
import ModeTabs from "@/src/components/ModeTabs";
import OnboardingTour from "@/src/components/OnboardingTour";
import OnboardingFirstSearch from "@/src/components/OnboardingFirstSearch";
import DatabaseConfigBanner from "@/src/components/DatabaseConfigBanner";
import UsageMeter from "@/src/components/UsageMeter";
import LeadQualityFilters from "@/src/components/LeadQualityFilters";
import {
  applyLeadFilters,
  parseLeadFilters,
} from "@/src/lib/leadFilters";

export const dynamic = "force-dynamic";

/** Local + universal AI search + grounding — довші запити (див. також layout dashboard). */
export const maxDuration = 180;

function viewFromQuery(value: string | string[] | undefined): LeadView {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "board" ? "board" : "table";
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    mode?: string | string[];
    view?: string | string[];
    checkout?: string | string[];
    filter?: string | string[];
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  const user = await requireUser();
  const plan = getPlanForUser(user);
  const limitStatus = getLeadLimitStatus(user);

  const query = await searchParams;
  const mode = modeFromQuery(query.mode);
  const view = viewFromQuery(query.view);
  const filters = parseLeadFilters(query.filter);
  const checkoutParam = Array.isArray(query.checkout)
    ? query.checkout[0]
    : query.checkout;
  const showCheckoutSuccess = checkoutParam === "success";
  const isBeats = mode === LeadMode.BEATS;
  const isUniversal = mode === LeadMode.UNIVERSAL;
  const isLocal = mode === LeadMode.LOCAL;
  const isBoard = view === "board";

  const missingDbEnv =
    !process.env.DATABASE_URL?.trim() ||
    !process.env.DIRECT_URL?.trim();

  type LeadWithAudit = Prisma.LeadGetPayload<{
    include: { audit: true };
  }>;

  let leads: LeadWithAudit[] = [];
  let kanbanLeads: KanbanLead[] = [];
  let localLeadCount = 0;
  let campaigns: CampaignSummaryItem[] = [];
  let dbQueryFailed = false;
  let dbQueryError: string | null = null;

  if (!missingDbEnv) {
    try {
      const localCampaignRows = await prisma.lead.findMany({
        where: { userId: user.id, mode: LeadMode.LOCAL },
        orderBy: { createdAt: "desc" },
        take: 500,
        select: {
          category: true,
          city: true,
          status: true,
          notes: true,
        },
      });
      localLeadCount = await prisma.lead.count({
        where: { userId: user.id, mode: LeadMode.LOCAL },
      });
      campaigns = buildCampaigns(localCampaignRows);

      if (isBoard) {
        // Дошка — універсальний вид: ВСІ ліди юзера незалежно від mode,
        // обмежено 200 (досить для огляду воронки в межах одного юзера).
        const all = await prisma.lead.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 200,
          select: {
            id: true,
            companyName: true,
            status: true,
            score: true,
            mode: true,
            category: true,
            city: true,
          },
        });
        kanbanLeads = all;
      } else {
        const where = applyLeadFilters(
          { mode, userId: user.id },
          filters,
        );
        leads = await prisma.lead.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { audit: true },
        });
      }
    } catch (err) {
      dbQueryFailed = true;
      console.error("[home] prisma.lead.findMany", err);
      if (
        process.env.NODE_ENV === "development" &&
        err instanceof Error
      ) {
        dbQueryError = err.message;
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-flux-bg">
      <div
        className={`mx-auto px-4 py-12 sm:px-6 lg:px-8 ${
          isBoard ? "max-w-[88rem]" : "max-w-4xl"
        }`}
      >
        {showCheckoutSuccess && <CheckoutSuccessBanner />}
        {missingDbEnv && (
          <DatabaseConfigBanner variant="missing_env" />
        )}
        {!missingDbEnv && dbQueryFailed && (
          <DatabaseConfigBanner variant="query_failed" detail={dbQueryError} />
        )}

        <div className="flex items-center gap-4">
          <BrandMark
            id="tour-brand-mark"
            href="/dashboard"
            className="h-10 w-10 flex-shrink-0"
          />
          <div id="tour-page-title" className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-flux-text">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-flux-muted">
              {isBeats
                ? t("subtitleBeats")
                : isUniversal
                  ? t("subtitleUniversal")
                  : t("subtitleLocal")}
            </p>
          </div>
        </div>

        {!isBoard && (
          <div className="mt-6">
            <ModeTabs active={modeKeyFromMode(mode)} />
          </div>
        )}

        <div className="mt-6 space-y-3">
          <UsageMeter status={limitStatus} plan={plan} />
          {user.stripeCustomerId && (
            <div className="flex justify-end">
              <ManageSubscriptionButton locale={locale} />
            </div>
          )}
        </div>

        {!isBoard && (
          <div className="mt-6 space-y-4">
            {isBeats ? (
              <BeatOutreach />
            ) : isUniversal ? (
              <UniversalOutreach />
            ) : localLeadCount === 0 && !dbQueryFailed ? (
              <OnboardingFirstSearch />
            ) : (
              <ScraperForm />
            )}
            {!isBeats && <CsvUploader />}
          </div>
        )}

        <div className="mt-10 space-y-4" id="tour-leads-table">
          {isBoard ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-flux-border dark:bg-flux-card">
              <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 dark:border-flux-border sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {t("boardTitle")}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {t("boardSubtitle")}
                  </p>
                </div>
                <LeadViewToggle active="board" />
              </div>
              <LeadKanbanBoard leads={kanbanLeads} />
            </div>
          ) : (
            <>
              {isLocal && <CampaignSummary campaigns={campaigns} />}
              {isLocal && (
                <LeadQualityFilters
                  active={filters}
                  mode={modeKeyFromMode(mode)}
                />
              )}
              <LeadsTableSection
                leads={leads.map((lead) => ({
                  id: lead.id,
                  mode: lead.mode,
                  companyName: lead.companyName,
                  category: lead.category,
                  city: lead.city,
                  website: lead.website,
                  socialLinks: lead.socialLinks,
                  status: lead.status,
                  source: lead.source,
                  followers: lead.followers,
                  lookingForType: lead.lookingForType,
                  notes: lead.notes,
                  audit: lead.audit ? { issues: lead.audit.issues } : null,
                  score: lead.score,
                  painPoints: lead.painPoints,
                  hasOnlineBooking: lead.hasOnlineBooking,
                }))}
                isBeats={isBeats}
                isUniversal={isUniversal}
                title={
                  isBeats
                    ? t("tableTitleBeats")
                    : isUniversal
                      ? t("tableTitleUniversal")
                      : t("tableTitleLocal")
                }
              />
            </>
          )}
        </div>

        <Suspense fallback={null}>
          <OnboardingTour />
        </Suspense>
      </div>
    </div>
  );
}

function buildCampaigns(
  rows: Array<{
    category: string | null;
    city: string | null;
    status: string;
    notes: string | null;
  }>,
): CampaignSummaryItem[] {
  const map = new Map<string, CampaignSummaryItem>();

  for (const row of rows) {
    const niche = row.category || null;
    const city = row.city || null;
    const key = `${niche ?? "unknown"}::${city ?? "unknown"}`.toLowerCase();
    const existing =
      map.get(key) ??
      ({
        key,
        name: [niche, city].filter(Boolean).join(" in ") || "Untitled campaign",
        niche,
        city,
        ...parseCampaignContext(row.notes),
        leads: 0,
        contacted: 0,
        replies: 0,
        won: 0,
      } satisfies CampaignSummaryItem);

    existing.leads += 1;
    if (["Contacted", "Replied", "Won", "Lost"].includes(row.status)) {
      existing.contacted += 1;
    }
    if (row.status === "Replied") existing.replies += 1;
    if (row.status === "Won") existing.won += 1;
    map.set(key, existing);
  }

  return Array.from(map.values()).slice(0, 6);
}

function parseCampaignContext(notes: string | null): {
  goal: string | null;
  language: string | null;
} {
  const context = { goal: null as string | null, language: null as string | null };
  if (!notes) return context;

  for (const row of notes.split(/\r?\n/)) {
    const [rawKey, ...rest] = row.split(":");
    const value = rest.join(":").trim();
    const key = rawKey?.trim().toLowerCase();
    if (!value) continue;
    if (key === "offer" || key === "service") context.goal = value;
    if (key === "language") context.language = value;
  }
  return context;
}
