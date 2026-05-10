"use server";

import { prisma } from "@/src/lib/prisma";
import { calculateLeadScore } from "@/src/lib/scoring";

export interface AuditActionResult {
  success: boolean;
  error?: string;
  performanceScore?: number;
  issuesCount?: number;
  email?: string | null;
  opportunityScore?: number;
}

export async function runAuditForLead(
  leadId: string
): Promise<AuditActionResult> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, error: "Лід не знайдено" };
    }

    if (!lead.website) {
      return { success: false, error: "У ліда немає сайту для аудиту" };
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

    // Compute Opportunity Score using the freshest data: the email might
    // have just been discovered during this audit run, and we use the
    // updated audit booleans rather than the stale stored ones.
    const freshEmail = result.email ?? lead.email;
    const opportunityScore = calculateLeadScore(
      { website: lead.website, email: freshEmail },
      { hasSSL: result.ssl, mobileFriendly: result.mobileFriendly }
    );

    const leadUpdate: { score: number; email?: string } = {
      score: opportunityScore,
    };
    if (result.email && result.email !== lead.email) {
      leadUpdate.email = result.email;
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
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
