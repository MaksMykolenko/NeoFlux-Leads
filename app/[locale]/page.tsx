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
import BrandMark from "@/src/components/BrandMark";
import LeadsTableSection from "@/src/components/LeadsTableSection";
import LeadKanbanBoard, {
  type KanbanLead,
} from "@/src/components/LeadKanbanBoard";
import LeadViewToggle, {
  type LeadView,
} from "@/src/components/LeadViewToggle";
import ModeTabs from "@/src/components/ModeTabs";
import OnboardingTour from "@/src/components/OnboardingTour";
import DatabaseConfigBanner from "@/src/components/DatabaseConfigBanner";
import UsageMeter from "@/src/components/UsageMeter";

export const dynamic = "force-dynamic";

/** Local AI search can exceed default serverless timeout on Vercel. */
export const maxDuration = 60;

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
  const isBeats = mode === LeadMode.BEATS;
  const isUniversal = mode === LeadMode.UNIVERSAL;
  const isBoard = view === "board";

  const missingDbEnv =
    !process.env.DATABASE_URL?.trim() ||
    !process.env.DIRECT_URL?.trim();

  type LeadWithAudit = Prisma.LeadGetPayload<{
    include: { audit: true };
  }>;

  let leads: LeadWithAudit[] = [];
  let kanbanLeads: KanbanLead[] = [];
  let dbQueryFailed = false;
  let dbQueryError: string | null = null;

  if (!missingDbEnv) {
    try {
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
        leads = await prisma.lead.findMany({
          where: { mode, userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 10,
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {missingDbEnv && (
          <DatabaseConfigBanner variant="missing_env" />
        )}
        {!missingDbEnv && dbQueryFailed && (
          <DatabaseConfigBanner variant="query_failed" detail={dbQueryError} />
        )}

        <div className="flex items-center gap-3">
          <BrandMark
            id="tour-brand-mark"
            href="/"
            className="h-9 w-9 flex-shrink-0"
          />
          <div id="tour-page-title" className="min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
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

        <div className="mt-6">
          <UsageMeter status={limitStatus} plan={plan} />
        </div>

        {!isBoard && (
          <div className="mt-6 space-y-4">
            {isBeats ? (
              <BeatOutreach />
            ) : isUniversal ? (
              <UniversalOutreach />
            ) : (
              <ScraperForm />
            )}
            {!isBeats && <CsvUploader />}
          </div>
        )}

        <div className="mt-10" id="tour-leads-table">
          {isBoard ? (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-medium text-gray-900">
                  {t("boardTitle")}
                </h2>
                <LeadViewToggle active="board" />
              </div>
              <LeadKanbanBoard leads={kanbanLeads} />
            </div>
          ) : (
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
          )}
        </div>

        <Suspense fallback={null}>
          <OnboardingTour />
        </Suspense>
      </div>
    </div>
  );
}
