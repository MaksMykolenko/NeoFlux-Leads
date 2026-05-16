import type { NextRequest } from "next/server";
import { LeadMode } from "@prisma/client";
import { assertCronAuth } from "@/src/lib/cron-auth";
import { requireGeminiKey } from "@/src/lib/gemini";
import { prisma } from "@/src/lib/prisma";
import { calculateLocalLeadScore } from "@/src/lib/scoring";
import {
  getLeadLimitStatus,
  incrementLeadsProcessed,
} from "@/src/lib/subscription";
import { searchLocalBusinessesViaGemini } from "@/src/lib/geminiLocalBusinessSearch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface StepReport {
  configsProcessed: number;
  configsSkipped: number;
  leadsCreated: number;
  errors: number;
  detail: Array<{
    configId: string;
    mode: LeadMode;
    saved?: number;
    skipped?: number;
    error?: string;
  }>;
}

function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const unauth = assertCronAuth(req);
  if (unauth) return unauth;

  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (err) {
    console.error("[cron/autopilot/step-1] missing Gemini key", err);
    return Response.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }

  const report: StepReport = {
    configsProcessed: 0,
    configsSkipped: 0,
    leadsCreated: 0,
    errors: 0,
    detail: [],
  };

  try {
    const configs = await prisma.autopilotConfig.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "asc" },
    });

    const todayStart = startOfTodayUTC();

    for (const cfg of configs) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: cfg.userId },
          select: {
            id: true,
            plan: true,
            leadsProcessedCount: true,
            planResetDate: true,
          },
        });
        if (!user) {
          report.configsSkipped++;
          report.detail.push({
            configId: cfg.id,
            mode: cfg.mode,
            error: "user not found",
          });
          continue;
        }

        const limitStatus = getLeadLimitStatus(user);
        if (!limitStatus.allowed) {
          report.configsSkipped++;
          report.detail.push({
            configId: cfg.id,
            mode: cfg.mode,
            error: "plan limit reached",
          });
          continue;
        }

        const createdToday = await prisma.lead.count({
          where: {
            userId: cfg.userId,
            mode: cfg.mode,
            createdAt: { gte: todayStart },
            source: { startsWith: "Autopilot" },
          },
        });
        const remainingToday = Math.max(0, cfg.maxLeadsPerDay - createdToday);
        if (remainingToday <= 0) {
          report.configsSkipped++;
          report.detail.push({
            configId: cfg.id,
            mode: cfg.mode,
            error: "daily quota reached",
          });
          continue;
        }

        const planRemaining = limitStatus.unlimited
          ? Number.POSITIVE_INFINITY
          : limitStatus.remaining;
        const cap = Math.max(0, Math.min(remainingToday, planRemaining));

        if (cap <= 0) {
          report.configsSkipped++;
          continue;
        }

        const saved = await runSearchForConfig({
          cfg,
          userId: user.id,
          apiKey,
          cap,
        });

        if (saved > 0) {
          await incrementLeadsProcessed(user.id, saved);
        }

        report.configsProcessed++;
        report.leadsCreated += saved;
        report.detail.push({
          configId: cfg.id,
          mode: cfg.mode,
          saved,
        });
      } catch (err) {
        report.errors++;
        console.error(
          `[cron/autopilot/step-1] config=${cfg.id} mode=${cfg.mode} failed`,
          err,
        );
        report.detail.push({
          configId: cfg.id,
          mode: cfg.mode,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return Response.json({ ok: true, ...report });
  } catch (err) {
    console.error("[cron/autopilot/step-1] fatal", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

interface RunArgs {
  cfg: {
    id: string;
    userId: string;
    mode: LeadMode;
    searchQuery: string;
    targetRegion: string | null;
  };
  userId: string;
  apiKey: string;
  cap: number;
}

async function runSearchForConfig(args: RunArgs): Promise<number> {
  const { cfg, userId, apiKey, cap } = args;

  if (cfg.mode === LeadMode.LOCAL) {
    return runLocalSearch({ cfg, userId, apiKey, cap });
  }
  console.warn(
    `[cron/autopilot/step-1] mode=${cfg.mode} not yet implemented in step-1 (only LOCAL is wired)`,
  );
  return 0;
}

async function runLocalSearch(args: RunArgs): Promise<number> {
  const { cfg, userId, apiKey, cap } = args;
  const city = cfg.targetRegion?.trim();
  if (!city) {
    console.warn(
      `[cron/autopilot/step-1] config=${cfg.id} LOCAL skipped: targetRegion is required`,
    );
    return 0;
  }

  const hits = await searchLocalBusinessesViaGemini(
    cfg.searchQuery,
    city,
    apiKey,
    cfg.targetRegion,
  );

  if (hits.length === 0) return 0;

  let saved = 0;
  for (const hit of hits) {
    if (saved >= cap) break;
    try {
      const existing = await prisma.lead.findFirst({
        where: {
          userId,
          OR: [
            ...(hit.website ? [{ website: hit.website }] : []),
            { companyName: hit.companyName, city },
          ],
        },
        select: { id: true },
      });
      if (existing) continue;

      const score = calculateLocalLeadScore({
        website: hit.website,
        hasOnlineBooking: hit.hasOnlineBooking,
        painPoints: hit.painPoints,
      });

      await prisma.lead.create({
        data: {
          userId,
          mode: LeadMode.LOCAL,
          companyName: hit.companyName,
          website: hit.website,
          phone: hit.phone,
          city,
          category: cfg.searchQuery,
          source: `Autopilot · ${cfg.searchQuery}`,
          painPoints: hit.painPoints,
          hasOnlineBooking: hit.hasOnlineBooking,
          score,
          pipelineStatus: "PENDING_AUDIT",
        },
      });
      saved++;
    } catch (err) {
      console.error(
        `[cron/autopilot/step-1] config=${cfg.id} save lead "${hit.companyName}" failed`,
        err,
      );
    }
  }

  return saved;
}
