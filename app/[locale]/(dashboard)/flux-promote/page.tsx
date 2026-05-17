import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/src/lib/prisma";
import { FLUX_PROMOTE_COMPANIES } from "@/src/lib/promotion/fluxPromoteProfiles";
import { requireFluxPromoteUser } from "@/src/lib/promotion/serverAccess";
import FluxPromoteWorkspace, {
  type FluxPromoteCampaignView,
} from "@/src/components/FluxPromoteWorkspace";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export default async function FluxPromotePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireFluxPromoteUser();

  const campaigns = await prisma.fluxPromoteCampaign.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      targets: {
        orderBy: { createdAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      },
    },
  });

  return (
    <FluxPromoteWorkspace
      companies={FLUX_PROMOTE_COMPANIES}
      campaigns={campaigns.map((campaign): FluxPromoteCampaignView => ({
        id: campaign.id,
        companyId: campaign.companyId,
        projectId: campaign.projectId,
        goal: campaign.goal,
        audience: campaign.audience,
        channel: campaign.channel,
        region: campaign.region,
        language: campaign.language,
        cta: campaign.cta,
        tone: campaign.tone,
        status: campaign.status,
        createdAt: campaign.createdAt.toISOString(),
        targets: campaign.targets.map((target) => ({
          id: target.id,
          name: target.name,
          type: target.type,
          companyId: target.companyId,
          projectId: target.projectId,
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
          recommendedMessageType: target.recommendedMessageType,
          status: target.status,
          notes: target.notes,
          messages: target.messages.map((message) => ({
            id: message.id,
            type: message.type,
            subject: message.subject,
            body: message.body,
            status: message.status,
            createdAt: message.createdAt.toISOString(),
          })),
        })),
      }))}
    />
  );
}
