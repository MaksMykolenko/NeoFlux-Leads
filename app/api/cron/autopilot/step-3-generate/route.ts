import type { NextRequest } from "next/server";
import { LeadMode } from "@prisma/client";
import { assertCronAuth } from "@/src/lib/cron-auth";
import { requireGeminiKey } from "@/src/lib/gemini";
import { prisma } from "@/src/lib/prisma";
import { checkSubscription } from "@/src/lib/subscription";
import {
  SYSTEM_INSTRUCTION_FULL,
  SYSTEM_INSTRUCTION_STARTER,
  BEAT_SYSTEM_INSTRUCTION,
  buildBeatUserPrompt,
  buildLocalUserPrompt,
  buildUniversalUserPrompt,
  generateTextWithFallback,
  withOutputLanguage,
} from "@/src/lib/ai/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 5;

const DEFAULT_SUBJECT_BY_MODE: Record<LeadMode, string> = {
  LOCAL: "Партнерство · NeoFlux",
  BEATS: "Beat пропозиція",
  UNIVERSAL: "Партнерство · NeoFlux",
};

interface StepReport {
  generated: number;
  skipped: number;
  errors: number;
  detail: Array<{
    leadId: string;
    mode: LeadMode;
    status: "generated" | "skipped" | "failed";
    error?: string;
  }>;
}

export async function GET(req: NextRequest) {
  const unauth = assertCronAuth(req);
  if (unauth) return unauth;

  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (err) {
    console.error("[cron/autopilot/step-3] missing Gemini key", err);
    return Response.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }

  const report: StepReport = {
    generated: 0,
    skipped: 0,
    errors: 0,
    detail: [],
  };

  try {
    const leads = await prisma.lead.findMany({
      where: { pipelineStatus: "PENDING_GENERATION" },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      include: { audit: true },
    });

    if (leads.length === 0) {
      return Response.json({ ok: true, ...report, message: "no work" });
    }

    for (const lead of leads) {
      if (!lead.userId) {
        report.skipped++;
        report.detail.push({
          leadId: lead.id,
          mode: lead.mode,
          status: "skipped",
          error: "lead has no userId",
        });
        continue;
      }
      try {
        const [user, config] = await Promise.all([
          prisma.user.findUnique({
            where: { id: lead.userId },
            select: { id: true, plan: true },
          }),
          prisma.autopilotConfig.findFirst({
            where: { userId: lead.userId, mode: lead.mode },
            select: { outputLanguage: true },
          }),
        ]);

        if (!user) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { pipelineStatus: "PROCESSED" },
          });
          report.skipped++;
          report.detail.push({
            leadId: lead.id,
            mode: lead.mode,
            status: "skipped",
            error: "user not found",
          });
          continue;
        }

        const language = config?.outputLanguage ?? "Ukrainian";
        const advancedAi = checkSubscription(user, "advancedAi");

        let systemInstruction: string;
        let userPrompt: string;
        let temperature: number;
        let maxOutputTokens: number;

        if (lead.mode === LeadMode.BEATS) {
          systemInstruction = withOutputLanguage(
            advancedAi ? BEAT_SYSTEM_INSTRUCTION : SYSTEM_INSTRUCTION_STARTER,
            language,
          );
          userPrompt = buildBeatUserPrompt(
            {
              handle: lead.companyName,
              realName: lead.realName ?? lead.companyName,
              genre: lead.category ?? "music",
              platform: lead.source ?? "Platform",
              followers: lead.followers,
            },
            null,
          );
          temperature = advancedAi ? 0.85 : 0.5;
          maxOutputTokens = advancedAi ? 600 : 250;
        } else if (lead.mode === LeadMode.UNIVERSAL) {
          systemInstruction = withOutputLanguage(
            advancedAi ? SYSTEM_INSTRUCTION_FULL : SYSTEM_INSTRUCTION_STARTER,
            language,
          );
          userPrompt = buildUniversalUserPrompt({
            companyName: lead.companyName,
            notes: lead.notes,
            website: lead.website,
            email: lead.email,
            source: lead.source,
          });
          temperature = advancedAi ? 0.7 : 0.5;
          maxOutputTokens = advancedAi ? 800 : 300;
        } else {
          systemInstruction = withOutputLanguage(
            advancedAi ? SYSTEM_INSTRUCTION_FULL : SYSTEM_INSTRUCTION_STARTER,
            language,
          );
          userPrompt = buildLocalUserPrompt({
            companyName: lead.companyName,
            category: lead.category,
            city: lead.city,
            website: lead.website,
            email: lead.email,
            score: lead.score,
            audit: lead.audit
              ? {
                  hasSSL: lead.audit.hasSSL,
                  mobileFriendly: lead.audit.mobileFriendly,
                  performanceScore: lead.audit.performanceScore,
                  issues: lead.audit.issues,
                }
              : null,
          });
          temperature = advancedAi ? 0.7 : 0.5;
          maxOutputTokens = advancedAi ? 800 : 300;
        }

        const aiResult = await generateTextWithFallback({
          systemInstruction,
          userPrompt,
          apiKey,
          temperature,
          maxOutputTokens,
        });

        if (!aiResult.success || !aiResult.text) {
          report.errors++;
          report.detail.push({
            leadId: lead.id,
            mode: lead.mode,
            status: "failed",
            error: aiResult.error ?? "AI failed",
          });
          continue;
        }

        await prisma.$transaction([
          prisma.message.create({
            data: {
              leadId: lead.id,
              subject: DEFAULT_SUBJECT_BY_MODE[lead.mode],
              body: aiResult.text,
              deliveryStatus: "DRAFT",
            },
          }),
          prisma.lead.update({
            where: { id: lead.id },
            data: { pipelineStatus: "PENDING_DELIVERY" },
          }),
        ]);

        report.generated++;
        report.detail.push({
          leadId: lead.id,
          mode: lead.mode,
          status: "generated",
        });
      } catch (err) {
        report.errors++;
        console.error(`[cron/autopilot/step-3] lead=${lead.id} failed`, err);
        report.detail.push({
          leadId: lead.id,
          mode: lead.mode,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return Response.json({ ok: true, ...report });
  } catch (err) {
    console.error("[cron/autopilot/step-3] fatal", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
