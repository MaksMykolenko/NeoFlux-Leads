import { getTranslations } from "next-intl/server";

export interface CampaignSummaryItem {
  key: string;
  name: string;
  niche: string | null;
  city: string | null;
  goal: string | null;
  language: string | null;
  leads: number;
  contacted: number;
  replies: number;
  won: number;
}

interface CampaignSummaryProps {
  campaigns: CampaignSummaryItem[];
}

export default async function CampaignSummary({
  campaigns,
}: CampaignSummaryProps) {
  const t = await getTranslations("Campaigns");

  return (
    <section>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {campaigns.length}
        </span>
      </div>

      {campaigns.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500 dark:border-flux-border dark:bg-flux-card-2 dark:text-zinc-400">
          {t("empty")}
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <article
              key={campaign.key}
              className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-flux-border dark:bg-flux-card-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {campaign.name}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {[campaign.niche, campaign.city].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="inline-flex rounded-md bg-white px-2 py-1 text-xs font-semibold tabular-nums text-purple-700 ring-1 ring-purple-200 dark:bg-flux-card dark:text-flux-purple-soft dark:ring-flux-purple/30">
                  {campaign.leads}
                </span>
              </div>

              {(campaign.goal || campaign.language) && (
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  {campaign.goal && (
                    <div>
                      <dt className="font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        {t("goal")}
                      </dt>
                      <dd className="mt-0.5 truncate text-zinc-700 dark:text-zinc-300">
                        {campaign.goal}
                      </dd>
                    </div>
                  )}
                  {campaign.language && (
                    <div>
                      <dt className="font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        {t("language")}
                      </dt>
                      <dd className="mt-0.5 truncate text-zinc-700 dark:text-zinc-300">
                        {campaign.language}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
                <Metric label={t("leads")} value={campaign.leads} />
                <Metric label={t("contacted")} value={campaign.contacted} />
                <Metric label={t("replies")} value={campaign.replies} />
                <Metric label={t("won")} value={campaign.won} />
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-zinc-200 dark:bg-flux-card dark:ring-flux-border">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </dd>
    </div>
  );
}
