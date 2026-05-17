CREATE TABLE "FluxPromoteCampaign" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "audience" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "channel" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "cta" TEXT NOT NULL,
  "tone" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FluxPromoteCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FluxPromoteTarget" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "platform" TEXT,
  "sourceUrl" TEXT,
  "websiteUrl" TEXT,
  "socialUrl" TEXT,
  "contactUrl" TEXT,
  "email" TEXT,
  "country" TEXT,
  "language" TEXT,
  "audienceType" TEXT,
  "projectFitScore" INTEGER NOT NULL DEFAULT 0,
  "fitReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "suggestedAngle" TEXT,
  "recommendedMessageType" TEXT,
  "status" TEXT NOT NULL DEFAULT 'New',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FluxPromoteTarget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FluxPromoteMessage" (
  "id" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FluxPromoteMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FluxPromoteCampaign_userId_idx" ON "FluxPromoteCampaign"("userId");
CREATE INDEX "FluxPromoteCampaign_companyId_projectId_idx" ON "FluxPromoteCampaign"("companyId", "projectId");
CREATE INDEX "FluxPromoteTarget_campaignId_idx" ON "FluxPromoteTarget"("campaignId");
CREATE INDEX "FluxPromoteTarget_companyId_projectId_idx" ON "FluxPromoteTarget"("companyId", "projectId");
CREATE INDEX "FluxPromoteTarget_status_idx" ON "FluxPromoteTarget"("status");
CREATE INDEX "FluxPromoteMessage_targetId_idx" ON "FluxPromoteMessage"("targetId");
CREATE INDEX "FluxPromoteMessage_status_idx" ON "FluxPromoteMessage"("status");

ALTER TABLE "FluxPromoteCampaign"
  ADD CONSTRAINT "FluxPromoteCampaign_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FluxPromoteTarget"
  ADD CONSTRAINT "FluxPromoteTarget_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "FluxPromoteCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FluxPromoteMessage"
  ADD CONSTRAINT "FluxPromoteMessage_targetId_fkey"
  FOREIGN KEY ("targetId") REFERENCES "FluxPromoteTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
