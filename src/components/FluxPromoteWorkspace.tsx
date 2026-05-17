"use client";

import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import {
  createFluxPromoteCampaign,
  generateFluxPromoteMessage,
  saveFluxPromoteTarget,
  searchFluxPromoteTargets,
  updateFluxPromoteTargetStatus,
} from "@/src/actions/fluxPromoteActions";
import type {
  CompanyProfile,
  FluxPromoteCompanyId,
  FluxPromoteProjectId,
  ProjectProfile,
} from "@/src/lib/promotion/fluxPromoteProfiles";
import {
  FLUX_PROMOTE_CHANNELS,
  FLUX_PROMOTE_CTAS,
  FLUX_PROMOTE_GOALS,
  FLUX_PROMOTE_REGIONS,
  FLUX_PROMOTE_TONES,
} from "@/src/lib/promotion/fluxPromoteProfiles";
import { FLUX_PROMOTE_STATUSES } from "@/src/lib/promotion/status";

export interface FluxPromoteMessageView {
  id: string;
  type: string;
  subject: string | null;
  body: string;
  status: string;
  createdAt: string;
}

export interface FluxPromoteTargetView {
  id: string;
  name: string;
  type: string;
  companyId: string;
  projectId: string;
  platform: string | null;
  sourceUrl: string | null;
  websiteUrl: string | null;
  socialUrl: string | null;
  contactUrl: string | null;
  email: string | null;
  country: string | null;
  language: string | null;
  audienceType: string | null;
  projectFitScore: number;
  fitReasons: string[];
  suggestedAngle: string | null;
  recommendedMessageType: string | null;
  status: string;
  notes: string | null;
  messages: FluxPromoteMessageView[];
}

export interface FluxPromoteCampaignView {
  id: string;
  companyId: string;
  projectId: string;
  goal: string;
  audience: string[];
  channel: string;
  region: string;
  language: string;
  cta: string;
  tone: string;
  status: string;
  createdAt: string;
  targets: FluxPromoteTargetView[];
}

interface FluxPromoteWorkspaceProps {
  companies: CompanyProfile[];
  campaigns: FluxPromoteCampaignView[];
}

const LANGUAGES = ["English", "Ukrainian", "Polish"] as const;
const TARGET_TYPES = [
  "person",
  "company",
  "community",
  "creator",
  "directory",
  "repo",
  "forum",
  "server",
] as const;

export default function FluxPromoteWorkspace({
  companies,
  campaigns,
}: FluxPromoteWorkspaceProps) {
  const t = useTranslations("FluxPromote");
  const router = useRouter();
  const firstCompany = companies[0];
  const [companyId, setCompanyId] = useState<FluxPromoteCompanyId>(
    firstCompany.id,
  );
  const projects = useMemo(
    () => companies.find((company) => company.id === companyId)?.projects ?? [],
    [companies, companyId],
  );
  const [projectId, setProjectId] = useState<FluxPromoteProjectId>(
    projects[0]?.id ?? firstCompany.projects[0].id,
  );
  const project = projects.find((item) => item.id === projectId) ?? projects[0];
  const [goal, setGoal] = useState<string>(FLUX_PROMOTE_GOALS[0]);
  const [channel, setChannel] = useState<string>(FLUX_PROMOTE_CHANNELS[0]);
  const [region, setRegion] = useState<string>(FLUX_PROMOTE_REGIONS[0]);
  const [language, setLanguage] = useState<string>("English");
  const [cta, setCta] = useState<string>(FLUX_PROMOTE_CTAS[0]);
  const [tone, setTone] = useState<string>(FLUX_PROMOTE_TONES[0]);
  const [audienceText, setAudienceText] = useState(
    project?.targetAudiences.join("\n") ?? "",
  );
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    campaigns[0]?.id ?? "",
  );
  const selectedCampaign =
    campaigns.find((campaign) => campaign.id === selectedCampaignId) ??
    campaigns[0] ??
    null;
  const [searchQuery, setSearchQuery] = useState("");
  const [manualTarget, setManualTarget] = useState({
    name: "",
    type: "person",
    platform: "",
    sourceUrl: "",
    socialUrl: "",
    email: "",
    notes: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCompanyChange(nextCompanyId: FluxPromoteCompanyId) {
    const nextCompany = companies.find((company) => company.id === nextCompanyId);
    const nextProject = nextCompany?.projects[0];
    setCompanyId(nextCompanyId);
    if (nextProject) {
      setProjectId(nextProject.id);
      setAudienceText(nextProject.targetAudiences.join("\n"));
    }
  }

  function handleProjectChange(nextProjectId: FluxPromoteProjectId) {
    const nextProject = projects.find((item) => item.id === nextProjectId);
    setProjectId(nextProjectId);
    if (nextProject) setAudienceText(nextProject.targetAudiences.join("\n"));
  }

  function submitCampaign(e: FormEvent) {
    e.preventDefault();
    if (!project || pending) return;
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await createFluxPromoteCampaign({
        companyId,
        projectId,
        goal,
        audience: audienceText.split(/\r?\n|,/).map((item) => item.trim()),
        channel,
        region,
        language,
        cta,
        tone,
      });
      if (!result.success) {
        setError(result.error ?? t("genericError"));
        return;
      }
      setSelectedCampaignId(result.campaignId ?? "");
      setMessage(t("campaignCreated"));
      router.refresh();
    });
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    if (!selectedCampaign || !searchQuery.trim() || pending) return;
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await searchFluxPromoteTargets(
        selectedCampaign.id,
        searchQuery.trim(),
      );
      if (!result.success) {
        setError(result.error ?? t("genericError"));
        return;
      }
      setMessage(t("targetsSaved", { count: result.saved ?? 0 }));
      router.refresh();
    });
  }

  function submitManualTarget(e: FormEvent) {
    e.preventDefault();
    if (!selectedCampaign || !manualTarget.name.trim() || pending) return;
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await saveFluxPromoteTarget({
        campaignId: selectedCampaign.id,
        ...manualTarget,
      });
      if (!result.success) {
        setError(result.error ?? t("genericError"));
        return;
      }
      setManualTarget({
        name: "",
        type: "person",
        platform: "",
        sourceUrl: "",
        socialUrl: "",
        email: "",
        notes: "",
      });
      setMessage(t("targetSaved"));
      router.refresh();
    });
  }

  function generateMessage(targetId: string, type: string) {
    if (pending) return;
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await generateFluxPromoteMessage(targetId, type);
      if (!result.success) {
        setError(result.error ?? t("genericError"));
        return;
      }
      setMessage(t("messageGenerated"));
      router.refresh();
    });
  }

  function updateStatus(targetId: string, status: string) {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await updateFluxPromoteTargetStatus(targetId, status);
      if (!result.success) {
        setError(result.error ?? t("genericError"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-flux-bg">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-6 dark:border-flux-border md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-flux-purple-soft">
              Flux Promote
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {t("subtitle")}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            {t("safetyWarning")}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-flux-border dark:bg-flux-card">
            <form onSubmit={submitCampaign} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("selectCompany")}>
                  <select
                    value={companyId}
                    onChange={(e) =>
                      handleCompanyChange(e.target.value as FluxPromoteCompanyId)
                    }
                    className={selectClass}
                  >
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("selectProject")}>
                  <select
                    value={project?.id ?? ""}
                    onChange={(e) =>
                      handleProjectChange(e.target.value as FluxPromoteProjectId)
                    }
                    className={selectClass}
                  >
                    {projects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {project && <ProjectSummary project={project} />}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SelectField label="Goal" value={goal} onChange={setGoal} options={FLUX_PROMOTE_GOALS} />
                <SelectField label="Channel" value={channel} onChange={setChannel} options={FLUX_PROMOTE_CHANNELS} />
                <SelectField label="Region" value={region} onChange={setRegion} options={FLUX_PROMOTE_REGIONS} />
                <SelectField label="Language" value={language} onChange={setLanguage} options={LANGUAGES} />
                <SelectField label="CTA" value={cta} onChange={setCta} options={FLUX_PROMOTE_CTAS} />
                <SelectField label="Tone" value={tone} onChange={setTone} options={FLUX_PROMOTE_TONES} />
              </div>

              <Field label="Audience">
                <textarea
                  value={audienceText}
                  onChange={(e) => setAudienceText(e.target.value)}
                  rows={4}
                  className={textareaClass}
                />
              </Field>

              <button type="submit" disabled={pending} className={primaryButtonClass}>
                {pending ? t("working") : t("createCampaign")}
              </button>
            </form>
          </section>

          <aside className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-flux-border dark:bg-flux-card">
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              {t("campaigns")}
            </h2>
            <div className="mt-4 space-y-2">
              {campaigns.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("noCampaigns")}
                </p>
              ) : (
                campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => setSelectedCampaignId(campaign.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selectedCampaign?.id === campaign.id
                        ? "border-purple-300 bg-purple-50 text-purple-900 dark:border-flux-purple/50 dark:bg-flux-purple-tint dark:text-white"
                        : "border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-flux-border dark:text-zinc-300"
                    }`}
                  >
                    <span className="block font-medium">
                      {projectName(companies, campaign.projectId)}
                    </span>
                    <span className="mt-0.5 block text-xs opacity-75">
                      {campaign.goal} · {campaign.targets.length} targets
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>

        {(message || error) && (
          <div
            className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            }`}
          >
            {error ?? message}
          </div>
        )}

        {selectedCampaign && (
          <section className="mt-8 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <form
                onSubmit={submitSearch}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-flux-border dark:bg-flux-card"
              >
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  {t("searchTargets")}
                </h2>
                <textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  rows={4}
                  placeholder={t("searchPlaceholder")}
                  className={`${textareaClass} mt-3`}
                />
                <button
                  type="submit"
                  disabled={pending || !searchQuery.trim()}
                  className={`${primaryButtonClass} mt-4`}
                >
                  {pending ? t("working") : t("searchCta")}
                </button>
              </form>

              <form
                onSubmit={submitManualTarget}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-flux-border dark:bg-flux-card"
              >
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  {t("addTarget")}
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={manualTarget.name}
                    onChange={(e) =>
                      setManualTarget({ ...manualTarget, name: e.target.value })
                    }
                    placeholder="Name"
                    className={inputClass}
                  />
                  <select
                    value={manualTarget.type}
                    onChange={(e) =>
                      setManualTarget({ ...manualTarget, type: e.target.value })
                    }
                    className={selectClass}
                  >
                    {TARGET_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <input
                    value={manualTarget.platform}
                    onChange={(e) =>
                      setManualTarget({ ...manualTarget, platform: e.target.value })
                    }
                    placeholder="Platform"
                    className={inputClass}
                  />
                  <input
                    value={manualTarget.sourceUrl}
                    onChange={(e) =>
                      setManualTarget({ ...manualTarget, sourceUrl: e.target.value })
                    }
                    placeholder="Source URL"
                    className={inputClass}
                  />
                  <input
                    value={manualTarget.socialUrl}
                    onChange={(e) =>
                      setManualTarget({ ...manualTarget, socialUrl: e.target.value })
                    }
                    placeholder="Social URL"
                    className={inputClass}
                  />
                  <input
                    value={manualTarget.email}
                    onChange={(e) =>
                      setManualTarget({ ...manualTarget, email: e.target.value })
                    }
                    placeholder="Email"
                    className={inputClass}
                  />
                </div>
                <textarea
                  value={manualTarget.notes}
                  onChange={(e) =>
                    setManualTarget({ ...manualTarget, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Notes"
                  className={`${textareaClass} mt-3`}
                />
                <button
                  type="submit"
                  disabled={pending || !manualTarget.name.trim()}
                  className={`${secondaryButtonClass} mt-4`}
                >
                  {t("saveTarget")}
                </button>
              </form>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {selectedCampaign.targets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-5 py-10 text-center text-sm text-zinc-500 dark:border-flux-border dark:bg-flux-card dark:text-zinc-400 md:col-span-2">
                  {t("noTargets")}
                </div>
              ) : (
                selectedCampaign.targets.map((target) => (
                  <TargetCard
                    key={target.id}
                    target={target}
                    disabled={pending}
                    onGenerate={generateMessage}
                    onStatusChange={updateStatus}
                  />
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ProjectSummary({ project }: { project: ProjectProfile }) {
  const t = useTranslations("FluxPromote");
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-flux-border dark:bg-flux-card-2">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        {project.name}
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {project.shortDescription}
      </p>
      <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {project.valueProposition}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <MiniList title={t("targetAudiences")} items={project.targetAudiences} />
        <MiniList title={t("suggestedKeywords")} items={project.keywords} />
      </div>
    </div>
  );
}

function TargetCard({
  target,
  disabled,
  onGenerate,
  onStatusChange,
}: {
  target: FluxPromoteTargetView;
  disabled: boolean;
  onGenerate: (targetId: string, type: string) => void;
  onStatusChange: (targetId: string, status: string) => void;
}) {
  const t = useTranslations("FluxPromote");
  const dnc = target.status === "Do not contact";
  const latestMessage = target.messages[0];
  const messageTabs = ["Email", "DM", "Social post", "Community comment", "Follow-up"];

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-flux-border dark:bg-flux-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">
            {target.name}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {target.platform || target.type} · {target.audienceType || target.language || "PR target"}
          </p>
        </div>
        <div className="rounded-lg bg-purple-50 px-3 py-2 text-right dark:bg-flux-purple-tint">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-flux-purple-soft">
            {t("projectFitScore")}
          </div>
          <div className="text-lg font-bold tabular-nums text-purple-900 dark:text-white">
            {target.projectFitScore}/100
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <InfoBlock
          title={t("whyThisTarget")}
          body={
            target.fitReasons.length
              ? target.fitReasons.join("; ")
              : target.notes || "No fit breakdown yet."
          }
        />
        <InfoBlock
          title={t("suggestedAngle")}
          body={target.suggestedAngle || target.recommendedMessageType || "Review target context first."}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {target.sourceUrl && <OutboundLink label="Source" href={target.sourceUrl} />}
        {target.websiteUrl && <OutboundLink label="Website" href={target.websiteUrl} />}
        {target.socialUrl && <OutboundLink label="Social" href={target.socialUrl} />}
        {target.contactUrl && <OutboundLink label="Contact" href={target.contactUrl} />}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={target.status}
          onChange={(e) => onStatusChange(target.id, e.target.value)}
          disabled={disabled}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 dark:border-flux-border dark:bg-flux-card-2 dark:text-zinc-100"
        >
          {FLUX_PROMOTE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {dnc && (
          <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
            DNC
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-flux-border">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t("messageDraftTabs")}
        </div>
        <div className="flex flex-wrap gap-2">
          {messageTabs.map((type) => (
            <button
              key={type}
              type="button"
              disabled={disabled || dnc}
              onClick={() => onGenerate(target.id, type)}
              className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-flux-border dark:text-zinc-300 dark:hover:border-flux-purple/60 dark:hover:text-flux-purple-soft"
            >
              {type}
            </button>
          ))}
        </div>
        {latestMessage && (
          <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs leading-5 text-zinc-700 dark:bg-flux-card-2 dark:text-zinc-300">
            <div className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
              {latestMessage.type}
            </div>
            <p className="whitespace-pre-wrap">{latestMessage.body}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {title}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.slice(0, 8).map((item) => (
          <span
            key={item}
            className="rounded-md bg-white px-2 py-1 text-xs text-zinc-700 ring-1 ring-zinc-200 dark:bg-flux-card dark:text-zinc-300 dark:ring-flux-border"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {title}
      </div>
      <p className="mt-1 leading-6 text-zinc-700 dark:text-zinc-300">{body}</p>
    </div>
  );
}

function OutboundLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-md border border-zinc-200 px-2 py-1 text-zinc-600 transition hover:border-purple-300 hover:text-purple-700 dark:border-flux-border dark:text-zinc-400 dark:hover:border-flux-purple/60 dark:hover:text-flux-purple-soft"
    >
      {label}
    </a>
  );
}

function projectName(companies: CompanyProfile[], projectId: string): string {
  for (const company of companies) {
    const project = company.projects.find((item) => item.id === projectId);
    if (project) return project.name;
  }
  return projectId;
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-flux-border dark:bg-flux-card-2 dark:text-zinc-50 dark:placeholder:text-zinc-500";

const selectClass = inputClass;

const textareaClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-flux-border dark:bg-flux-card-2 dark:text-zinc-50 dark:placeholder:text-zinc-500";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-flux-border dark:bg-flux-card-2 dark:text-zinc-100 dark:hover:border-flux-purple/60 dark:hover:bg-flux-purple-tint";
