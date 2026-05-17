"use server";

import { GoogleGenAI } from "@google/genai";
import { revalidateLocalizedPath } from "@/src/i18n/revalidateLocalized";
import { requireGeminiKey } from "@/src/lib/gemini";
import {
  FLUX_PROMOTE_MESSAGE_TYPES,
  getFluxPromoteCompany,
  getFluxPromoteProject,
  isFluxPromoteCompanyId,
  isFluxPromoteProjectForCompany,
} from "@/src/lib/promotion/fluxPromoteProfiles";
import {
  buildFluxPromoteUserPrompt,
  FLUX_PROMOTE_SYSTEM_INSTRUCTION,
} from "@/src/lib/promotion/promotePrompt";
import { calculateProjectFitScore } from "@/src/lib/promotion/projectFitScore";
import {
  canDraftFluxPromoteMessage,
  isFluxPromoteStatus,
} from "@/src/lib/promotion/status";
import { checkFluxPromoteActionAccess } from "@/src/lib/promotion/serverAccess";
import { generateTextWithFallback } from "@/src/lib/ai/prompts";
import { prisma } from "@/src/lib/prisma";

const SEARCH_MODEL = "gemini-2.5-flash";
const MAX_PROMOTE_TARGETS = 10;

export interface FluxPromoteActionResult {
  success: boolean;
  error?: string;
  errorCode?: "UNAUTHENTICATED" | "FORBIDDEN" | "INVALID_INPUT" | "DNC" | "AI_ERROR";
  campaignId?: string;
  targetId?: string;
  messageId?: string;
  saved?: number;
  text?: string;
}

export interface CreateFluxPromoteCampaignInput {
  companyId: string;
  projectId: string;
  goal: string;
  audience: string[];
  channel: string;
  region: string;
  language: string;
  cta: string;
  tone: string;
}

export async function createFluxPromoteCampaign(
  input: CreateFluxPromoteCampaignInput,
): Promise<FluxPromoteActionResult> {
  const access = await checkFluxPromoteActionAccess();
  if (!access.ok) return accessError(access.error);

  const validation = validateCampaignInput(input);
  if (!validation.ok) return validation;

  try {
    const campaign = await prisma.fluxPromoteCampaign.create({
      data: {
        userId: access.user.id,
        companyId: input.companyId,
        projectId: input.projectId,
        goal: input.goal.trim(),
        audience: input.audience.map((item) => item.trim()).filter(Boolean),
        channel: input.channel.trim(),
        region: input.region.trim(),
        language: input.language.trim(),
        cta: input.cta.trim(),
        tone: input.tone.trim(),
      },
      select: { id: true },
    });

    await revalidateLocalizedPath("/flux-promote");
    return { success: true, campaignId: campaign.id };
  } catch (error) {
    console.error("[flux-promote] create campaign", error);
    return dbError(error);
  }
}

export interface SaveFluxPromoteTargetInput {
  campaignId: string;
  name: string;
  type: string;
  platform?: string | null;
  sourceUrl?: string | null;
  websiteUrl?: string | null;
  socialUrl?: string | null;
  contactUrl?: string | null;
  email?: string | null;
  country?: string | null;
  language?: string | null;
  audienceType?: string | null;
  notes?: string | null;
}

export async function saveFluxPromoteTarget(
  input: SaveFluxPromoteTargetInput,
): Promise<FluxPromoteActionResult> {
  const access = await checkFluxPromoteActionAccess();
  if (!access.ok) return accessError(access.error);

  const name = input.name.trim();
  if (!input.campaignId || !name) {
    return invalidInput("Campaign and target name are required");
  }

  try {
    const campaign = await prisma.fluxPromoteCampaign.findFirst({
      where: { id: input.campaignId, userId: access.user.id },
    });
    if (!campaign) return invalidInput("Flux Promote campaign not found");

    const company = getFluxPromoteCompany(campaign.companyId);
    const project = getFluxPromoteProject(campaign.projectId);
    if (!company || !project) return invalidInput("Invalid campaign profile");

    const score = calculateProjectFitScore({
      project,
      target: {
        name,
        platform: input.platform,
        sourceUrl: input.sourceUrl,
        websiteUrl: input.websiteUrl,
        socialUrl: input.socialUrl,
        contactUrl: input.contactUrl,
        email: input.email,
        country: input.country,
        language: input.language,
        audienceType: input.audienceType,
        notes: input.notes,
      },
      region: campaign.region,
      language: campaign.language,
    });

    const target = await prisma.fluxPromoteTarget.create({
      data: {
        campaignId: campaign.id,
        name: name.slice(0, 500),
        type: input.type.trim() || "person",
        companyId: campaign.companyId,
        projectId: campaign.projectId,
        platform: cleanNullable(input.platform),
        sourceUrl: cleanNullable(input.sourceUrl),
        websiteUrl: cleanNullable(input.websiteUrl),
        socialUrl: cleanNullable(input.socialUrl),
        contactUrl: cleanNullable(input.contactUrl),
        email: cleanNullable(input.email),
        country: cleanNullable(input.country),
        language: cleanNullable(input.language),
        audienceType: cleanNullable(input.audienceType),
        notes: cleanNullable(input.notes),
        projectFitScore: score.score,
        fitReasons: score.reasons,
        suggestedAngle: score.reasons[0] ?? project.outreachAngles[0] ?? null,
        recommendedMessageType: recommendedMessageType(project.id, campaign.goal),
      },
      select: { id: true },
    });

    await revalidateLocalizedPath("/flux-promote");
    return { success: true, targetId: target.id };
  } catch (error) {
    console.error("[flux-promote] save target", error);
    return dbError(error);
  }
}

export async function searchFluxPromoteTargets(
  campaignId: string,
  query: string,
): Promise<FluxPromoteActionResult> {
  const access = await checkFluxPromoteActionAccess();
  if (!access.ok) return accessError(access.error);

  const trimmedQuery = query.trim();
  if (!campaignId || !trimmedQuery) {
    return invalidInput("Campaign and search query are required");
  }

  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (error) {
    return { success: false, errorCode: "AI_ERROR", error: (error as Error).message };
  }

  try {
    const campaign = await prisma.fluxPromoteCampaign.findFirst({
      where: { id: campaignId, userId: access.user.id },
    });
    if (!campaign) return invalidInput("Flux Promote campaign not found");

    const company = getFluxPromoteCompany(campaign.companyId);
    const project = getFluxPromoteProject(campaign.projectId);
    if (!company || !project) return invalidInput("Invalid campaign profile");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: buildTargetSearchPrompt({
        query: trimmedQuery,
        companyName: company.name,
        projectName: project.name,
        audiences: campaign.audience.length
          ? campaign.audience
          : project.targetAudiences,
        keywords: project.keywords,
        channel: campaign.channel,
        region: campaign.region,
        language: campaign.language,
      }),
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.25,
        maxOutputTokens: 6144,
      },
    });

    const items = parseTargetArray(response.text ?? "");
    let saved = 0;

    for (const item of items.slice(0, MAX_PROMOTE_TARGETS)) {
      const name = textField(item, "name");
      if (!name) continue;
      const score = calculateProjectFitScore({
        project,
        target: {
          name,
          platform: textField(item, "platform"),
          sourceUrl: textField(item, "sourceUrl"),
          websiteUrl: textField(item, "websiteUrl"),
          socialUrl: textField(item, "socialUrl"),
          contactUrl: textField(item, "contactUrl"),
          email: textField(item, "email"),
          country: textField(item, "country"),
          language: textField(item, "language"),
          audienceType: textField(item, "audienceType"),
          notes: textField(item, "notes"),
        },
        region: campaign.region,
        language: campaign.language,
      });

      const exists = await prisma.fluxPromoteTarget.findFirst({
        where: {
          campaignId: campaign.id,
          OR: [
            { sourceUrl: textField(item, "sourceUrl") || undefined },
            { socialUrl: textField(item, "socialUrl") || undefined },
            { name },
          ],
        },
        select: { id: true },
      });
      if (exists) continue;

      await prisma.fluxPromoteTarget.create({
        data: {
          campaignId: campaign.id,
          name: name.slice(0, 500),
          type: textField(item, "type") || "person",
          companyId: campaign.companyId,
          projectId: campaign.projectId,
          platform: textField(item, "platform"),
          sourceUrl: textField(item, "sourceUrl"),
          websiteUrl: textField(item, "websiteUrl"),
          socialUrl: textField(item, "socialUrl"),
          contactUrl: textField(item, "contactUrl"),
          email: textField(item, "email"),
          country: textField(item, "country"),
          language: textField(item, "language"),
          audienceType: textField(item, "audienceType"),
          notes: textField(item, "notes"),
          projectFitScore: score.score,
          fitReasons: score.reasons,
          suggestedAngle:
            textField(item, "suggestedAngle") ||
            score.reasons[0] ||
            project.outreachAngles[0],
          recommendedMessageType:
            textField(item, "recommendedMessageType") ||
            recommendedMessageType(project.id, campaign.goal),
        },
      });
      saved++;
    }

    await revalidateLocalizedPath("/flux-promote");
    return { success: true, saved };
  } catch (error) {
    console.error("[flux-promote] search targets", error);
    return {
      success: false,
      errorCode: "AI_ERROR",
      error: error instanceof Error ? error.message : "Flux Promote target search failed",
    };
  }
}

export async function updateFluxPromoteTargetStatus(
  targetId: string,
  status: string,
): Promise<FluxPromoteActionResult> {
  const access = await checkFluxPromoteActionAccess();
  if (!access.ok) return accessError(access.error);
  if (!targetId || !isFluxPromoteStatus(status)) {
    return invalidInput("Invalid Flux Promote status");
  }

  const result = await prisma.fluxPromoteTarget.updateMany({
    where: { id: targetId, campaign: { userId: access.user.id } },
    data: { status },
  });
  if (result.count === 0) return invalidInput("Flux Promote target not found");

  await revalidateLocalizedPath("/flux-promote");
  return { success: true, targetId };
}

export async function generateFluxPromoteMessage(
  targetId: string,
  messageType: string,
): Promise<FluxPromoteActionResult> {
  const access = await checkFluxPromoteActionAccess();
  if (!access.ok) return accessError(access.error);
  if (!targetId) return invalidInput("Target is required");

  const normalizedType = FLUX_PROMOTE_MESSAGE_TYPES.includes(
    messageType as (typeof FLUX_PROMOTE_MESSAGE_TYPES)[number],
  )
    ? messageType
    : "DM";

  let apiKey: string;
  try {
    apiKey = requireGeminiKey();
  } catch (error) {
    return { success: false, errorCode: "AI_ERROR", error: (error as Error).message };
  }

  const target = await prisma.fluxPromoteTarget.findFirst({
    where: { id: targetId, campaign: { userId: access.user.id } },
    include: { campaign: true },
  });
  if (!target) return invalidInput("Flux Promote target not found");
  if (!canDraftFluxPromoteMessage(target.status)) {
    return {
      success: false,
      errorCode: "DNC",
      error: "Target is marked Do not contact. Message generation is blocked.",
    };
  }

  const company = getFluxPromoteCompany(target.companyId);
  const project = getFluxPromoteProject(target.projectId);
  if (!company || !project) return invalidInput("Invalid Flux Promote profile");

  const prompt = buildFluxPromoteUserPrompt({
    company,
    project,
    target: {
      name: target.name,
      type: target.type,
      platform: target.platform,
      sourceUrl: target.sourceUrl,
      websiteUrl: target.websiteUrl,
      socialUrl: target.socialUrl,
      contactUrl: target.contactUrl,
      email: target.email,
      country: target.country,
      language: target.language,
      audienceType: target.audienceType,
      projectFitScore: target.projectFitScore,
      fitReasons: target.fitReasons,
      suggestedAngle: target.suggestedAngle,
      notes: target.notes,
      status: target.status,
    },
    goal: target.campaign.goal,
    cta: target.campaign.cta,
    language: target.campaign.language,
    tone: target.campaign.tone,
    channel: target.campaign.channel,
    messageType: normalizedType,
  });

  const generated = await generateTextWithFallback({
    apiKey,
    systemInstruction: FLUX_PROMOTE_SYSTEM_INSTRUCTION,
    userPrompt: prompt,
    temperature: 0.55,
    maxOutputTokens: 700,
  });
  if (!generated.success || !generated.text) {
    return {
      success: false,
      errorCode: "AI_ERROR",
      error: generated.error ?? "Flux Promote message generation failed",
    };
  }

  const message = await prisma.fluxPromoteMessage.create({
    data: {
      targetId: target.id,
      type: normalizedType,
      subject: normalizedType === "Email" ? `${project.name} outreach` : null,
      body: generated.text,
    },
    select: { id: true },
  });

  await prisma.fluxPromoteTarget.update({
    where: { id: target.id },
    data: { status: "Message drafted" },
  });
  await revalidateLocalizedPath("/flux-promote");

  return {
    success: true,
    targetId: target.id,
    messageId: message.id,
    text: generated.text,
  };
}

function validateCampaignInput(
  input: CreateFluxPromoteCampaignInput,
): FluxPromoteActionResult & { ok?: never } | { ok: true } {
  if (!isFluxPromoteCompanyId(input.companyId)) {
    return invalidInput("Invalid company");
  }
  if (!isFluxPromoteProjectForCompany(input.projectId, input.companyId)) {
    return invalidInput("Project does not belong to selected company");
  }
  if (!input.goal.trim() || !input.channel.trim() || !input.language.trim()) {
    return invalidInput("Goal, channel and language are required");
  }
  return { ok: true };
}

function buildTargetSearchPrompt(input: {
  query: string;
  companyName: string;
  projectName: string;
  audiences: string[];
  keywords: string[];
  channel: string;
  region: string;
  language: string;
}): string {
  return `You are finding PR/outreach targets for an internal NeoFlux product campaign.

Company: ${input.companyName}
Project: ${input.projectName}
Channel: ${input.channel}
Region: ${input.region}
Preferred language: ${input.language}
Audiences: ${input.audiences.join(", ")}
Keywords: ${input.keywords.join(", ")}
User query: ${input.query}

Return only a JSON array with up to ${MAX_PROMOTE_TARGETS} real public targets. Each object must include:
- name
- type: person | company | community | creator | directory | repo | forum | server
- platform
- sourceUrl
- websiteUrl
- socialUrl
- contactUrl
- email only if publicly listed
- country
- language
- audienceType
- notes with factual source context
- suggestedAngle
- recommendedMessageType

Rules:
- Do not invent emails, URLs, metrics, followers or traction.
- Prefer public source/profile URLs.
- No markdown. Raw JSON array only.`;
}

function parseTargetArray(raw: string): Array<Record<string, unknown>> {
  const cleaned = raw
    .replace(/^﻿/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const first = cleaned.indexOf("[");
  const last = cleaned.lastIndexOf("]");
  const json = first >= 0 && last > first ? cleaned.slice(first, last + 1) : cleaned;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    );
  } catch {
    return [];
  }
}

function textField(item: Record<string, unknown>, key: string): string | null {
  const value = item[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanNullable(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function recommendedMessageType(projectId: string, goal: string): string {
  const goalLower = goal.toLowerCase();
  if (projectId === "unitymcp") return "GitHub repo pitch";
  if (projectId === "flux-marketplace") return "Seller invitation";
  if (projectId === "flux-leads" || projectId === "flux-bionics") {
    return "Beta tester invitation";
  }
  if (goalLower.includes("partner")) return "Partner pitch";
  if (goalLower.includes("launch")) return "Launch post";
  return "DM";
}

function accessError(
  error: "UNAUTHENTICATED" | "FORBIDDEN",
): FluxPromoteActionResult {
  return {
    success: false,
    errorCode: error,
    error: error === "UNAUTHENTICATED" ? "Not authenticated" : "Forbidden",
  };
}

function invalidInput(error: string): FluxPromoteActionResult {
  return { success: false, errorCode: "INVALID_INPUT", error };
}

function dbError(error: unknown): FluxPromoteActionResult {
  return {
    success: false,
    error: error instanceof Error ? error.message : "Database error",
  };
}
