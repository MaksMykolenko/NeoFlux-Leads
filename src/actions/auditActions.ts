"use server";

import { actionError } from "@/src/lib/i18n/actionErrors";
import { prisma } from "@/src/lib/prisma";
import { recalculateLeadScore } from "@/src/lib/scoring";
import { getCurrentUser } from "@/src/lib/session";
import { checkSubscription } from "@/src/lib/subscription";

export interface AuditActionResult {
  success: boolean;
  error?: string;
  errorCode?: "PLAN_REQUIRED";
  performanceScore?: number;
  issuesCount?: number;
  email?: string | null;
  opportunityScore?: number;
}

export async function runAuditForLead(
  leadId: string
): Promise<AuditActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: await actionError("unauthorized") };

    if (!checkSubscription(user, "websiteAudit")) {
      return {
        success: false,
        errorCode: "PLAN_REQUIRED",
        error: await actionError("planAuditRequired"),
      };
    }

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: user.id },
    });

    if (!lead) {
      return { success: false, error: await actionError("leadNotFound") };
    }

    if (!lead.website) {
      return { success: false, error: await actionError("noWebsite") };
    }

    const { analyzeWebsite, calculatePerformanceScore } = await import(
      "@/src/modules/scraper/websiteAuditor"
    );
    const result = await analyzeWebsite(lead.website);
    const performanceScore = await calculatePerformanceScore(result.issues);

    await prisma.audit.upsert({
      where: { leadId },
      create: {
        leadId,
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

    // Mode-aware recompute з найсвіжішими даними: щойно знайдений email +
    // оновлені audit-булеві. Для LOCAL береться painPoints/hasOnlineBooking
    // самого ліда, для UNIVERSAL — audit + email, для BEATS — артистні поля.
    const freshEmail = result.email ?? lead.email;
    const opportunityScore = recalculateLeadScore(
      { ...lead, email: freshEmail },
      {
        hasSSL: result.ssl,
        mobileFriendly: result.mobileFriendly,
        issues: result.issues,
      },
    );

    const leadUpdate: { score: number; email?: string; phone?: string } = {
      score: opportunityScore,
    };
    if (result.email && result.email !== lead.email) {
      leadUpdate.email = result.email;
    }
    if (result.phone && !lead.phone) {
      leadUpdate.phone = result.phone;
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: leadUpdate,
    });

    return {
      success: true,
      performanceScore,
      issuesCount: result.issues.length,
      email: result.email,
      opportunityScore,
    };
  } catch (error) {
    console.error("runAuditForLead error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : await actionError("unexpected"),
    };
  }
}
