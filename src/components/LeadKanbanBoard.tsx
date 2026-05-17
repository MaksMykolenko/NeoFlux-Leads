"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/src/i18n/navigation";
import {
  KANBAN_COLUMN_ACCENT,
  KANBAN_FUNNEL_SEGMENT,
  LEAD_STATUSES,
  type LeadStatus,
} from "@/src/lib/leadStatus";
import { LeadMode } from "@/src/lib/leadMode";
import { getScoreColorClass } from "@/src/lib/scoring";
import { updateLeadStatus } from "@/src/actions/statusActions";

export interface KanbanLead {
  id: string;
  companyName: string;
  status: string;
  score: number;
  mode: LeadMode;
  category: string | null;
  city: string | null;
}

interface LeadKanbanBoardProps {
  leads: KanbanLead[];
}

type OptimisticUpdate = { id: string; newStatus: string };

/**
 * Канбан-воронка лідів: drag-and-drop через @hello-pangea/dnd, useOptimistic
 * для миттєвого UI, server action оновлює БД.
 */
export default function LeadKanbanBoard({ leads }: LeadKanbanBoardProps) {
  const t = useTranslations("Kanban");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticLeads, applyOptimistic] = useOptimistic<
    KanbanLead[],
    OptimisticUpdate
  >(leads, (current, update) =>
    current.map((l) =>
      l.id === update.id ? { ...l, status: update.newStatus } : l,
    ),
  );

  const grouped = useMemo(
    () => groupByStatus(optimisticLeads),
    [optimisticLeads],
  );

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as LeadStatus;
    setError(null);

    startTransition(async () => {
      applyOptimistic({ id: draggableId, newStatus });
      const res = await updateLeadStatus(draggableId, newStatus);
      if (!res.success) {
        setError(res.error ?? t("updateFailed"));
        return;
      }
      router.refresh();
    });
  }

  if (optimisticLeads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 shadow-inner dark:border-flux-border dark:from-flux-card dark:to-flux-bg/80">
          <svg
            className="h-7 w-7 text-zinc-400 dark:text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 18.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
        </div>
        <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
          {t("empty")}
        </p>
      </div>
    );
  }

  const total = optimisticLeads.length;

  return (
    <div>
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2.5 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50/95 to-white px-5 py-4 dark:border-flux-border dark:from-flux-card/90 dark:to-flux-bg/50">
        <FunnelSummary grouped={grouped} total={total} />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto bg-zinc-50/40 px-4 pb-4 pt-4 dark:bg-flux-bg/40">
          {LEAD_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={grouped[status] ?? []}
              isPending={isPending}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

function FunnelSummary({
  grouped,
  total,
}: {
  grouped: Record<LeadStatus, KanbanLead[]>;
  total: number;
}) {
  const t = useTranslations("Kanban");

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t("funnelDistribution")}
        </p>
        <p className="text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
          {t("funnelTotal", { count: total })}
        </p>
      </div>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-200/90 ring-1 ring-inset ring-zinc-300/40 dark:bg-zinc-800 dark:ring-zinc-700/50"
        role="img"
        aria-label={t("funnelDistribution")}
      >
        {LEAD_STATUSES.map((status) => {
          const n = grouped[status]?.length ?? 0;
          if (n === 0) return null;
          return (
            <div
              key={status}
              title={`${t(`status.${status}`)}: ${n}`}
              className={`${KANBAN_FUNNEL_SEGMENT[status]} min-w-[6px] shadow-sm transition-[flex-grow] duration-300`}
              style={{ flexGrow: n, flexBasis: 0 }}
            />
          );
        })}
      </div>
      <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        {t("funnelHint")}
      </p>
    </div>
  );
}

function KanbanColumn({
  status,
  leads,
  isPending,
}: {
  status: LeadStatus;
  leads: KanbanLead[];
  isPending: boolean;
}) {
  const t = useTranslations("Kanban");
  const accent = KANBAN_COLUMN_ACCENT[status];

  return (
    <div
      className={`flex w-[17.5rem] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-flux-border dark:bg-flux-card ${accent}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/80 px-3 py-2.5 dark:border-flux-border dark:bg-flux-card-2/50">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
          {t(`status.${status}`)}
        </h3>
        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white px-2 text-[11px] font-semibold tabular-nums text-zinc-600 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
          {leads.length}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-[220px] flex-col gap-2.5 p-2.5 transition-colors ${
              snapshot.isDraggingOver
                ? "bg-violet-50/90 dark:bg-violet-500/10"
                : "bg-zinc-50/50 dark:bg-flux-bg/30"
            }`}
          >
            {leads.map((lead, index) => (
              <Draggable
                key={lead.id}
                draggableId={lead.id}
                index={index}
                isDragDisabled={isPending}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={provided.draggableProps.style}
                    className={`select-none rounded-lg border bg-white p-3.5 text-sm shadow-sm ring-1 ring-black/[0.03] transition-all dark:bg-flux-card dark:ring-white/5 ${
                      snapshot.isDragging
                        ? "border-violet-500 shadow-lg ring-2 ring-violet-500/25"
                        : "border-zinc-200/90 hover:border-zinc-300 hover:shadow-md dark:border-flux-border dark:hover:border-zinc-600"
                    }`}
                  >
                    <KanbanCard lead={lead} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {leads.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-1 items-center justify-center py-8">
                <span className="rounded-md border border-dashed border-zinc-200/80 bg-white/60 px-3 py-2 text-[11px] text-zinc-400 dark:border-zinc-700 dark:bg-flux-card/40 dark:text-zinc-500">
                  {t("dropHere")}
                </span>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function KanbanCard({ lead }: { lead: KanbanLead }) {
  const t = useTranslations("Kanban");
  const subtitle = lead.category || lead.city || null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
          {lead.companyName}
        </p>
        <ScoreIndicator score={lead.score} />
      </div>
      {subtitle && (
        <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2 dark:border-flux-border">
        <ModeBadge mode={lead.mode} />
        <Link
          href={`/leads/${lead.id}`}
          title={t("openLead")}
          className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-500/15 dark:hover:text-violet-300"
        >
          <span className="sr-only">{t("openLead")}</span>
          <span aria-hidden className="text-sm font-medium">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}

function ScoreIndicator({ score }: { score: number }) {
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold tabular-nums tracking-wider ${getScoreColorClass(score)}`}
    >
      {score}
    </span>
  );
}

function ModeBadge({ mode }: { mode: LeadMode }) {
  const config: Record<LeadMode, { label: string; className: string }> = {
    LOCAL: {
      label: "LOCAL",
      className:
        "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
    },
    BEATS: {
      label: "BEATS",
      className:
        "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-500/30",
    },
    UNIVERSAL: {
      label: "UNIVERSAL",
      className:
        "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
    },
  };
  const { label, className } = config[mode];
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}

function groupByStatus(leads: KanbanLead[]): Record<LeadStatus, KanbanLead[]> {
  const out: Record<LeadStatus, KanbanLead[]> = {
    New: [],
    Qualified: [],
    Contacted: [],
    Replied: [],
    Won: [],
    Lost: [],
    "Do not contact": [],
  };
  for (const lead of leads) {
    const status = isKnownStatus(lead.status) ? lead.status : "New";
    out[status].push(lead);
  }
  return out;
}

function isKnownStatus(status: string): status is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(status);
}
