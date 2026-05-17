import type { NextRequest } from "next/server";
import { LeadMode } from "@prisma/client";
import { assertCronAuth } from "@/src/lib/cron-auth";
import {
  pendingDeliveryLeadWhere,
  pendingDoNotContactLeadWhere,
} from "@/src/lib/autopilotDeliveryGuards";
import { decrypt } from "@/src/lib/crypto";
import {
  claimMessageForSend,
  markMessageDeliveryResult,
  sendUserEmail,
} from "@/src/lib/mailer";
import { prisma } from "@/src/lib/prisma";
import {
  sendTelegramMessage,
  type TelegramCreds,
} from "@/src/lib/telegram/userbot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 10;
const TELEGRAM_DAILY_CAP = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const SUBJECT_FALLBACK_BY_MODE: Record<LeadMode, string> = {
  LOCAL: "Партнерство",
  BEATS: "Beat пропозиція",
  UNIVERSAL: "Партнерство",
};

interface StepReport {
  delivered: number;
  partial: number;
  failed: number;
  skipped: number;
  detail: Array<{
    leadId: string;
    mode: LeadMode;
    email?: { status: "sent" | "failed" | "skipped"; error?: string };
    telegram?: { status: "sent" | "failed" | "skipped"; error?: string };
  }>;
}

interface TelegramRuntime {
  creds: TelegramCreds;
  sessionString: string;
  sessionId: string;
  userId: string;
  dailyRemaining: number;
}

function readSocialUsername(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const tg = obj.telegram;
  if (typeof tg !== "string") return null;
  const trimmed = tg.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/(?:t\.me\/|@)?([a-zA-Z0-9_]{4,32})/);
  if (!m) return null;
  return m[1];
}

async function loadTelegramRuntime(userId: string): Promise<TelegramRuntime | null> {
  const session = await prisma.telegramSession.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      apiId: true,
      apiHash: true,
      sessionKey: true,
      isActive: true,
      dailyCount: true,
      lastReset: true,
    },
  });
  if (!session || !session.isActive) return null;
  if (!session.sessionKey) return null;

  let dailyCount = session.dailyCount;
  const lastResetMs = session.lastReset.getTime();
  if (Date.now() - lastResetMs > DAY_MS) {
    await prisma.telegramSession.update({
      where: { id: session.id },
      data: { dailyCount: 0, lastReset: new Date() },
    });
    dailyCount = 0;
  }
  const dailyRemaining = Math.max(0, TELEGRAM_DAILY_CAP - dailyCount);
  if (dailyRemaining <= 0) return null;

  let sessionString: string;
  let apiHash: string;
  try {
    sessionString = decrypt(session.sessionKey);
    apiHash = decrypt(session.apiHash);
  } catch (err) {
    console.error(
      `[cron/autopilot/step-4] decrypt TG creds/session failed user=${userId}`,
      err,
    );
    return null;
  }

  return {
    creds: { apiId: session.apiId, apiHash },
    sessionString,
    sessionId: session.id,
    userId: session.userId,
    dailyRemaining,
  };
}

export async function GET(req: NextRequest) {
  const unauth = assertCronAuth(req);
  if (unauth) return unauth;

  const report: StepReport = {
    delivered: 0,
    partial: 0,
    failed: 0,
    skipped: 0,
    detail: [],
  };

  try {
    // Pick a batch that's pending delivery AND not opt-ed out. The
    // `status: { not: "Do not contact" }` guard is critical — without it,
    // a lead marked DNC after entering the pipeline still gets messaged,
    // which is a compliance bug (GDPR/CAN-SPAM unsubscribe-respect).
    // We still bump pipelineStatus to PROCESSED for DNC leads below so
    // they don't linger in the queue forever.
    const leads = await prisma.lead.findMany({
      where: pendingDeliveryLeadWhere(),
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      include: {
        messages: { orderBy: { sentAt: "desc" }, take: 1 },
      },
    });

    // Sweep DNC leads stuck in PENDING_DELIVERY: mark them PROCESSED so the
    // queue drains. This is a separate query so the main batch isn't
    // contaminated by skipped leads counting against BATCH_SIZE.
    const dncSwept = await prisma.lead.updateMany({
      where: pendingDoNotContactLeadWhere(),
      data: { pipelineStatus: "PROCESSED" },
    });
    if (dncSwept.count > 0) {
      report.skipped += dncSwept.count;
      console.log(
        `[cron/autopilot/step-4] swept ${dncSwept.count} do-not-contact lead(s) to PROCESSED`,
      );
    }

    if (leads.length === 0) {
      return Response.json({ ok: true, ...report, message: "no work" });
    }

    const telegramByUser = new Map<string, TelegramRuntime | null>();

    for (const lead of leads) {
      if (!lead.userId) {
        report.skipped++;
        report.detail.push({
          leadId: lead.id,
          mode: lead.mode,
          email: { status: "skipped", error: "lead has no userId" },
        });
        continue;
      }

      const config = await prisma.autopilotConfig.findFirst({
        where: { userId: lead.userId, mode: lead.mode },
        select: { channels: true },
      });
      const channels = config?.channels ?? [];

      const draft = lead.messages[0];
      const messageBody = draft?.body ?? null;
      const messageSubject =
        draft?.subject?.trim() || SUBJECT_FALLBACK_BY_MODE[lead.mode];

      let anyDelivered = false;
      let anyFailed = false;
      const detailRow: StepReport["detail"][number] = {
        leadId: lead.id,
        mode: lead.mode,
      };

      const wantsEmail = channels.includes("email");
      const wantsTelegram = channels.includes("telegram");

      if (!messageBody) {
        detailRow.email = wantsEmail
          ? { status: "skipped", error: "no draft message" }
          : undefined;
        detailRow.telegram = wantsTelegram
          ? { status: "skipped", error: "no draft message" }
          : undefined;
        report.failed++;
        report.detail.push(detailRow);
        await prisma.lead.update({
          where: { id: lead.id },
          data: { pipelineStatus: "PROCESSED" },
        });
        continue;
      }

      if (wantsEmail) {
        if (!lead.email) {
          detailRow.email = { status: "skipped", error: "lead has no email" };
        } else {
          // Idempotency: atomically transition DRAFT/FAILED → SENDING. If
          // another cron run or a duplicate request already claimed the slot
          // (or the message is already SENT), bail out here without ever
          // hitting SMTP. Eliminates duplicate sends on Vercel retries.
          const claim = await claimMessageForSend(draft!.id);
          if (!claim.ok) {
            detailRow.email =
              claim.reason === "ALREADY_SENT"
                ? { status: "sent" }
                : {
                    status: "skipped",
                    error:
                      claim.reason === "IN_FLIGHT"
                        ? "send already in-flight (idempotency)"
                        : "message not found",
                  };
            if (claim.reason === "ALREADY_SENT") anyDelivered = true;
            // skip the SMTP call entirely — fall through to telegram branch
          } else try {
            const res = await sendUserEmail(
              lead.userId,
              lead.email,
              messageSubject,
              messageBody,
            );
            await markMessageDeliveryResult(draft!.id, res);
            if (res.success) {
              detailRow.email = { status: "sent" };
              anyDelivered = true;
            } else {
              detailRow.email = { status: "failed", error: res.error };
              anyFailed = true;
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // Unexpected throw — release the SENDING claim back to FAILED so
            // future retries are possible.
            await markMessageDeliveryResult(draft!.id, {
              success: false,
              error: msg,
            });
            detailRow.email = { status: "failed", error: msg };
            anyFailed = true;
            console.error(
              `[cron/autopilot/step-4] email failed lead=${lead.id}`,
              err,
            );
          }
        }
      }

      if (wantsTelegram) {
        const username = readSocialUsername(lead.socialLinks);
        if (!username) {
          detailRow.telegram = {
            status: "skipped",
            error: "lead has no telegram handle",
          };
        } else {
          if (!telegramByUser.has(lead.userId)) {
            telegramByUser.set(
              lead.userId,
              await loadTelegramRuntime(lead.userId),
            );
          }
          const runtime = telegramByUser.get(lead.userId);
          if (!runtime) {
            detailRow.telegram = {
              status: "skipped",
              error: "no active Telegram session or daily cap reached",
            };
          } else if (runtime.dailyRemaining <= 0) {
            detailRow.telegram = {
              status: "skipped",
              error: "Telegram daily cap reached during this run",
            };
          } else {
            try {
              const res = await sendTelegramMessage(
                runtime.creds,
                runtime.sessionString,
                username,
                messageBody,
              );
              if (res.success) {
                runtime.dailyRemaining -= 1;
                await prisma.telegramSession.update({
                  where: { id: runtime.sessionId },
                  data: { dailyCount: { increment: 1 } },
                });
                detailRow.telegram = { status: "sent" };
                anyDelivered = true;
              } else {
                detailRow.telegram = {
                  status: "failed",
                  error: res.error,
                };
                anyFailed = true;
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              detailRow.telegram = { status: "failed", error: msg };
              anyFailed = true;
              console.error(
                `[cron/autopilot/step-4] telegram failed lead=${lead.id}`,
                err,
              );
            }
          }
        }
      }

      const updates: { pipelineStatus: string; status?: string } = {
        pipelineStatus: "PROCESSED",
      };
      if (anyDelivered) {
        updates.status = "Contacted";
        if (anyFailed) report.partial++;
        else report.delivered++;
      } else if (anyFailed) {
        report.failed++;
      } else {
        report.skipped++;
      }

      await prisma.lead.update({
        where: { id: lead.id },
        data: updates,
      });

      report.detail.push(detailRow);
    }

    return Response.json({ ok: true, ...report });
  } catch (err) {
    console.error("[cron/autopilot/step-4] fatal", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
