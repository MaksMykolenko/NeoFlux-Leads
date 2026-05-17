import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { assertCronAuth } from "@/src/lib/cron-auth";
import { CHANNEL_ORDER } from "@/src/lib/channels";
import { requireGeminiKey } from "@/src/lib/gemini";
import { LeadMode } from "@/src/lib/leadMode";
import type { BeatProspect } from "@/src/lib/beatProspects";
import { coreSearchAndSaveLeads } from "@/src/lib/leadSearch/local";
import { coreSearchBeatProspects } from "@/src/lib/leadSearch/beats";
import { coreSearchUniversalLeads } from "@/src/lib/leadSearch/universal";
import { prisma } from "@/src/lib/prisma";
import { calculateArtistScore } from "@/src/lib/scoring";
import {
  getLeadLimitStatus,
  incrementLeadsProcessed,
} from "@/src/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const INTER_CONFIG_DELAY_MS = 2000;
const LOG = "[Autopilot Step 1]";

interface StepReport {
  configsProcessed: number;
  configsSkipped: number;
  configsFailed: number;
  leadsCreated: number;
  detail: Array<{
    configId: string;
    mode: LeadMode;
    userId: string;
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

  try {
    requireGeminiKey();
  } catch (err) {
    console.error(`${LOG} missing Gemini key`, err);
    return Response.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }

  const report: StepReport = {
    configsProcessed: 0,
    configsSkipped: 0,
    configsFailed: 0,
    leadsCreated: 0,
    detail: [],
  };

  try {
    const configs = await prisma.autopilotConfig.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "asc" },
    });

    console.log(`${LOG} Found ${configs.length} active configs.`);
    if (configs.length === 0) {
      return Response.json({
        ok: true,
        ...report,
        message: "no active configs",
      });
    }

    const todayStart = startOfTodayUTC();

    for (let i = 0; i < configs.length; i++) {
      const cfg = configs[i];
      console.log(
        `${LOG} Processing ${cfg.mode} for User ${cfg.userId} (config=${cfg.id})`,
      );

      try {
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
            userId: cfg.userId,
            error: "daily quota reached",
          });
          console.log(
            `${LOG} daily quota reached config=${cfg.id} (${createdToday}/${cfg.maxLeadsPerDay})`,
          );
          continue;
        }

        const outcome = await processConfig(cfg, remainingToday);

        if (outcome.error) {
          report.configsFailed++;
          report.detail.push({
            configId: cfg.id,
            mode: cfg.mode,
            userId: cfg.userId,
            saved: outcome.saved,
            error: outcome.error,
          });
          console.error(
            `${LOG} config=${cfg.id} failed: ${outcome.error}`,
          );
        } else {
          report.configsProcessed++;
          report.leadsCreated += outcome.saved;
          report.detail.push({
            configId: cfg.id,
            mode: cfg.mode,
            userId: cfg.userId,
            saved: outcome.saved,
          });
          console.log(
            `${LOG} Successfully saved ${outcome.saved} leads for User ${cfg.userId}`,
          );
        }
      } catch (err) {
        report.configsFailed++;
        console.error(`${LOG} config=${cfg.id} threw:`, err);
        report.detail.push({
          configId: cfg.id,
          mode: cfg.mode,
          userId: cfg.userId,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      if (i < configs.length - 1) {
        await new Promise((r) => setTimeout(r, INTER_CONFIG_DELAY_MS));
      }
    }

    console.log(
      `${LOG} done. processed=${report.configsProcessed} skipped=${report.configsSkipped} failed=${report.configsFailed} leads=${report.leadsCreated}`,
    );
    return Response.json({ ok: true, ...report });
  } catch (err) {
    console.error(`${LOG} fatal`, err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

interface ConfigRow {
  id: string;
  userId: string;
  mode: LeadMode;
  searchQuery: string;
  targetRegion: string | null;
  maxLeadsPerDay: number;
}

interface ConfigOutcome {
  saved: number;
  error?: string;
}

async function processConfig(
  cfg: ConfigRow,
  remainingToday: number,
): Promise<ConfigOutcome> {
  switch (cfg.mode) {
    case LeadMode.LOCAL: {
      const city = cfg.targetRegion?.trim();
      if (!city) {
        return { saved: 0, error: "LOCAL: targetRegion is required" };
      }
      const result = await coreSearchAndSaveLeads({
        userId: cfg.userId,
        query: cfg.searchQuery,
        city,
        region: cfg.targetRegion,
        pipelineStatus: "PENDING_AUDIT",
        source: "Autopilot (LOCAL)",
        revalidate: false,
      });
      if (!result.success) {
        return { saved: result.count, error: result.error ?? "search failed" };
      }
      return { saved: result.count };
    }

    case LeadMode.UNIVERSAL: {
      const result = await coreSearchUniversalLeads({
        userId: cfg.userId,
        prompt: cfg.searchQuery,
        region: cfg.targetRegion,
        pipelineStatus: "PENDING_AUDIT",
        source: "Autopilot (UNIVERSAL)",
        revalidate: false,
      });
      if (!result.success) {
        return {
          saved: result.saved ?? 0,
          error: result.error ?? "search failed",
        };
      }
      return { saved: result.saved ?? 0 };
    }

    case LeadMode.BEATS: {
      const result = await coreSearchBeatProspects({
        userId: cfg.userId,
        query: cfg.searchQuery,
        region: cfg.targetRegion,
      });
      if (!result.success) {
        return { saved: 0, error: result.error ?? "search failed" };
      }
      const saved = await persistBeatsProspects({
        userId: cfg.userId,
        cap: remainingToday,
        prospects: result.prospects,
      });
      return { saved };
    }

    default:
      return { saved: 0, error: `unsupported mode: ${cfg.mode}` };
  }
}

interface PersistBeatsInput {
  userId: string;
  cap: number;
  prospects: BeatProspect[];
}

/**
 * Зберігає `BeatProspect[]` як `Lead` (mode=BEATS, pipelineStatus=PENDING_GENERATION).
 * Артистам не потрібен аудит сайту — одразу йдемо в генерацію.
 * Дедуп per-(userId, mode=BEATS, companyName=handle).
 */
async function persistBeatsProspects({
  userId,
  cap,
  prospects,
}: PersistBeatsInput): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, leadsProcessedCount: true, planResetDate: true },
  });
  if (!user) return 0;

  const limitStatus = getLeadLimitStatus(user);
  if (!limitStatus.allowed) return 0;

  let remaining = Math.min(
    cap,
    limitStatus.unlimited ? Number.POSITIVE_INFINITY : limitStatus.remaining,
  );
  let saved = 0;

  for (const artist of prospects) {
    if (remaining <= 0) break;
    const handle = artist.handle?.trim();
    if (!handle) continue;
    try {
      const existing = await prisma.lead.findFirst({
        where: { userId, mode: LeadMode.BEATS, companyName: handle },
        select: { id: true },
      });
      if (existing) continue;

      const socialLinks = sanitizeContactsForJson(artist.contacts);
      const score = calculateArtistScore({
        email: artist.email,
        followers: artist.followers,
        lookingForType: artist.lookingForType,
      });

      await prisma.lead.create({
        data: {
          userId,
          mode: LeadMode.BEATS,
          companyName: handle,
          realName: artist.realName || handle,
          category: artist.genre || null,
          source: "Autopilot (BEATS)",
          website: artist.profileUrl,
          email: artist.email,
          followers: artist.followers,
          lookingForType: artist.lookingForType,
          score,
          pipelineStatus: "PENDING_GENERATION",
          ...(socialLinks !== undefined ? { socialLinks } : {}),
        },
      });
      saved += 1;
      remaining -= 1;
    } catch (err) {
      console.error(`${LOG} BEATS save artist=${handle} failed`, err);
    }
  }

  if (saved > 0) {
    await incrementLeadsProcessed(userId, saved);
  }
  return saved;
}

function sanitizeContactsForJson(
  contacts: BeatProspect["contacts"] | undefined,
): Prisma.InputJsonValue | undefined {
  if (!contacts) return undefined;
  const out: Record<string, string> = {};
  for (const key of CHANNEL_ORDER) {
    const v = contacts[key];
    if (typeof v === "string" && v.trim()) {
      out[key] = v.trim();
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
