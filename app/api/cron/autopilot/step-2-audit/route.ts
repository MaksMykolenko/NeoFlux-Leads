import type { NextRequest } from "next/server";
import pLimit from "p-limit";
import { LeadMode } from "@prisma/client";
import { assertCronAuth } from "@/src/lib/cron-auth";
import { prisma } from "@/src/lib/prisma";
import { calculateLocalLeadScore } from "@/src/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 5;
const AUDIT_CONCURRENCY = 3;

interface StepReport {
  audited: number;
  skipped: number;
  errors: number;
  detail: Array<{
    leadId: string;
    mode: LeadMode;
    status: "audited" | "skipped" | "failed";
    issuesCount?: number;
    error?: string;
  }>;
}

export async function GET(req: NextRequest) {
  const unauth = assertCronAuth(req);
  if (unauth) return unauth;

  const report: StepReport = {
    audited: 0,
    skipped: 0,
    errors: 0,
    detail: [],
  };

  try {
    const leads = await prisma.lead.findMany({
      where: { pipelineStatus: "PENDING_AUDIT" },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      select: {
        id: true,
        mode: true,
        website: true,
        email: true,
        painPoints: true,
        hasOnlineBooking: true,
      },
    });

    if (leads.length === 0) {
      return Response.json({ ok: true, ...report, message: "no work" });
    }

    const { analyzeWebsite, calculatePerformanceScore } = await import(
      "@/src/modules/scraper/websiteAuditor"
    );

    const limit = pLimit(AUDIT_CONCURRENCY);
    await Promise.allSettled(
      leads.map((lead) =>
        limit(async () => {
          try {
            if (lead.mode !== LeadMode.LOCAL || !lead.website) {
              await prisma.lead.update({
                where: { id: lead.id },
                data: { pipelineStatus: "PENDING_GENERATION" },
              });
              report.skipped++;
              report.detail.push({
                leadId: lead.id,
                mode: lead.mode,
                status: "skipped",
              });
              return;
            }

            const result = await analyzeWebsite(lead.website);
            const performanceScore = await calculatePerformanceScore(
              result.issues,
            );

            await prisma.audit.upsert({
              where: { leadId: lead.id },
              create: {
                leadId: lead.id,
                performanceScore,
                issues: result.issues,
                hasSSL: result.ssl,
                mobileFriendly: result.mobileFriendly,
              },
              update: {
                performanceScore,
                issues: result.issues,
                hasSSL: result.ssl,
                mobileFriendly: result.mobileFriendly,
              },
            });

            const freshEmail = result.email ?? lead.email;
            const opportunityScore = calculateLocalLeadScore({
              website: lead.website,
              hasOnlineBooking: lead.hasOnlineBooking,
              painPoints: lead.painPoints,
            });

            const leadUpdate: {
              score: number;
              email?: string;
              pipelineStatus: string;
            } = {
              score: opportunityScore,
              pipelineStatus: "PENDING_GENERATION",
            };
            if (result.email && result.email !== lead.email) {
              leadUpdate.email = result.email;
            }

            await prisma.lead.update({
              where: { id: lead.id },
              data: leadUpdate,
            });

            report.audited++;
            report.detail.push({
              leadId: lead.id,
              mode: lead.mode,
              status: "audited",
              issuesCount: result.issues.length,
            });
          } catch (err) {
            report.errors++;
            console.error(`[cron/autopilot/step-2] lead=${lead.id} failed`, err);
            report.detail.push({
              leadId: lead.id,
              mode: lead.mode,
              status: "failed",
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }),
      ),
    );

    return Response.json({ ok: true, ...report });
  } catch (err) {
    console.error("[cron/autopilot/step-2] fatal", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
