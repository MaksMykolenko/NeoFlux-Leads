"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useRouter } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import { LEAD_STATUSES, type LeadStatus } from "@/src/lib/leadStatus";
import { LeadMode } from "@/src/lib/leadMode";
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
 * Кіберпанк-мінімалістична канбан-дошка лідів.
 *
 * Темна палітра gunmetal grey + строгі фіолетові акценти. Без glow/neon —
 * лише чисті 1px бордери і пласкі pill-бейджі. Drag-and-drop через
 * @hello-pangea/dnd: useOptimistic для миттєвого UI, server action у
 * transition оновлює БД, router.refresh() підтягує canonical стан. На
 * помилці — оптимістичний апдейт автоматично відкочується (це гарантує
 * сам useOptimistic при завершенні transition без зміни props).
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

  const grouped = useMemo(() => groupByStatus(optimisticLeads), [optimisticLeads]);

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
      // Sync optimistic update inside the transition — UI flips immediately,
      // useOptimistic auto-reverts if the transition resolves without props
      // changing (i.e. server action failed → no router.refresh()).
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
      <div className="rounded-md border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto p-3">
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
  return (
    <div className="flex w-72 flex-shrink-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-2 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          {t(`status.${status}`)}
        </h3>
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-zinc-200 px-1.5 text-[10px] font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 ">
          {leads.length}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-[120px] flex-col gap-2 rounded-md border p-2 transition-colors ${
              snapshot.isDraggingOver
                ? "border-cyan-400 bg-cyan-50 dark:border-cyan-500/60 dark:bg-cyan-500/10"
                : "border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/40"
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
                    className={`select-none rounded-md border bg-white p-3 text-sm shadow-sm transition-colors dark:bg-zinc-900 ${
                      snapshot.isDragging
                        ? "border-cyan-500 ring-2 ring-cyan-500/20"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <KanbanCard lead={lead} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {leads.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-1 items-center justify-center py-4">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-600 ">
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
  const subtitle = lead.category || lead.city || null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100 ">
          {lead.companyName}
        </p>
        <ScoreIndicator score={lead.score} />
      </div>
      {subtitle && (
        <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 pt-1">
        <ModeBadge mode={lead.mode} />
        <a
          href={`/leads/${lead.id}`}
          className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 transition-colors hover:text-cyan-600 dark:text-zinc-400 dark:hover:text-cyan-400"
        >
          →
        </a>
      </div>
    </div>
  );
}

function ScoreIndicator({ score }: { score: number }) {
  const tone =
    score >= 70 ? "score-high" : score >= 40 ? "score-mid" : "score-low";
  const dotClass =
    tone === "score-high"
      ? "bg-emerald-500"
      : tone === "score-mid"
        ? "bg-amber-500"
        : "bg-red-500";
  const textClass =
    tone === "score-high"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "score-mid"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <span className="inline-flex flex-shrink-0 items-center gap-1">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className={`text-xs font-semibold tabular-nums ${textClass}`}>
        {score}
      </span>
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
        "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/30",
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
