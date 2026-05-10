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
import BrandMark from "@/src/components/BrandMark";
import LeadTableRow from "@/src/components/LeadTableRow";
import ModeTabs from "@/src/components/ModeTabs";
import OnboardingTour from "@/src/components/OnboardingTour";
import DatabaseConfigBanner from "@/src/components/DatabaseConfigBanner";
import UsageMeter from "@/src/components/UsageMeter";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  const user = await requireUser();
  const plan = getPlanForUser(user);
  const limitStatus = getLeadLimitStatus(user);

  const query = await searchParams;
  const mode = modeFromQuery(query.mode);
  const isBeats = mode === LeadMode.BEATS;
  const isUniversal = mode === LeadMode.UNIVERSAL;

  const missingDbEnv =
    !process.env.DATABASE_URL?.trim() ||
    !process.env.DIRECT_URL?.trim();

  type LeadWithAudit = Prisma.LeadGetPayload<{
    include: { audit: true };
  }>;

  let leads: LeadWithAudit[] = [];
  let dbQueryFailed = false;
  let dbQueryError: string | null = null;

  if (!missingDbEnv) {
    try {
      leads = await prisma.lead.findMany({
        where: { mode, userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { audit: true },
      });
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

        <div className="mt-6">
          <ModeTabs active={modeKeyFromMode(mode)} />
        </div>

        <div className="mt-6">
          <UsageMeter status={limitStatus} plan={plan} />
        </div>

        <div className="mt-6">
          {isBeats ? (
            <BeatOutreach />
          ) : isUniversal ? (
            <UniversalOutreach />
          ) : (
            <ScraperForm />
          )}
        </div>

        <div className="mt-10" id="tour-leads-table">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">
                {isBeats
                  ? t("tableTitleBeats")
                  : isUniversal
                    ? t("tableTitleUniversal")
                    : t("tableTitleLocal")}
              </h2>
              {leads.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {leads.length}
                </span>
              )}
            </div>

            {leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg
                  className="h-12 w-12 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <p className="mt-3 text-sm font-medium text-gray-500">
                  {isBeats ? t("emptyTitleBeats") : t("emptyTitleOther")}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {t("emptyHint")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isBeats
                          ? t("colArtist")
                          : isUniversal
                            ? t("colName")
                            : t("colCompany")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isBeats
                          ? t("colGenre")
                          : isUniversal
                            ? t("colDesc")
                            : t("colCategory")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isBeats ? t("colProfile") : t("colSite")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("colStatus")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isBeats ? t("colAudience") : t("colAudit")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <LeadTableRow
                        key={lead.id}
                        lead={{
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
                          audit: lead.audit
                            ? { issues: lead.audit.issues }
                            : null,
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <Suspense fallback={null}>
          <OnboardingTour />
        </Suspense>
      </div>
    </div>
  );
}
