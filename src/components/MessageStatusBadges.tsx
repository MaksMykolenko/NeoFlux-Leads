"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type MouseEvent,
} from "react";
import { useTranslations } from "next-intl";
import { updateReplyStatus } from "@/src/actions/messageActions";
import { useRouter } from "@/src/i18n/navigation";
import {
  REPLY_STATUSES,
  type ReplyStatus,
} from "@/src/lib/replyStatus";

const REPLY_STATUS_STYLES: Record<ReplyStatus, string> = {
  "No Reply": "bg-gray-100 text-gray-600 hover:bg-gray-200",
  Replied: "bg-green-100 text-green-700 hover:bg-green-200",
  Interested: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  Bounced: "bg-red-100 text-red-700 hover:bg-red-200",
};

const STATUS_LABEL_KEYS: Record<ReplyStatus, string> = {
  "No Reply": "replyNoReply",
  Replied: "replyReplied",
  Interested: "replyInterested",
  Bounced: "replyBounced",
};

function isKnownStatus(value: string): value is ReplyStatus {
  return (REPLY_STATUSES as readonly string[]).includes(value);
}

function stopPropagationDetails(e: MouseEvent) {
  // Бейдж лежить у summary <details> — без stopPropagation клік
  // згортав/розгортав акордеон, а dropdown зникав.
  e.preventDefault();
  e.stopPropagation();
}

export function ReplyStatusEditor({
  messageId,
  initialStatus,
}: {
  messageId: string;
  initialStatus: string;
}) {
  const t = useTranslations("LeadDetail");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: globalThis.MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function apply(next: ReplyStatus) {
    if (next === status) {
      setOpen(false);
      return;
    }
    const prev = status;
    setStatus(next);
    setOpen(false);
    startTransition(async () => {
      const res = await updateReplyStatus(messageId, next);
      if (!res.success) {
        setStatus(prev);
        alert(
          t("replyStatusUpdateFailed", {
            error: res.error ?? "Unknown error",
          }),
        );
        return;
      }
      router.refresh();
    });
  }

  const current = isKnownStatus(status) ? status : "No Reply";
  const cls = REPLY_STATUS_STYLES[current];
  const label = t(STATUS_LABEL_KEYS[current]);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        title={t("replyStatusEditTitle")}
        disabled={isPending}
        onClick={(e) => {
          stopPropagationDetails(e);
          setOpen((v) => !v);
        }}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition disabled:opacity-60 ${cls}`}
      >
        {isPending ? t("replyStatusUpdating") : label}
        <svg
          className="h-2.5 w-2.5 opacity-60"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
          onClick={stopPropagationDetails}
        >
          {REPLY_STATUSES.map((s) => {
            const isCurrent = s === current;
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  stopPropagationDetails(e);
                  apply(s);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-gray-50 ${
                  isCurrent ? "font-semibold text-purple-700" : "text-gray-700"
                }`}
              >
                <span>{t(STATUS_LABEL_KEYS[s])}</span>
                {isCurrent && (
                  <svg
                    className="h-3 w-3 text-purple-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.7 4.5a.75.75 0 0 1 .1 1l-8 10.5a.75.75 0 0 1-1.1.05l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.89 3.89 7.48-9.82a.75.75 0 0 1 1.07-.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const DELIVERY_STYLES: Record<string, string> = {
  SENT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  FAILED: "bg-red-50 text-red-700 ring-red-200",
  DRAFT: "bg-gray-50 text-gray-600 ring-gray-200",
};

export function DeliveryStatusBadge({
  status,
  errorLog,
}: {
  status: string | null | undefined;
  errorLog?: string | null;
}) {
  const t = useTranslations("LeadDetail");
  const [showError, setShowError] = useState(false);
  const normalized =
    status === "SENT" || status === "FAILED" || status === "DRAFT"
      ? status
      : "DRAFT";
  const cls = DELIVERY_STYLES[normalized];
  const label =
    normalized === "SENT"
      ? t("deliverySent")
      : normalized === "FAILED"
        ? t("deliveryFailed")
        : t("deliveryDraft");

  const isFailedWithLog = normalized === "FAILED" && !!errorLog?.trim();

  return (
    <>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset ${cls}`}
      >
        {normalized === "SENT" && <DotIcon className="text-emerald-500" />}
        {normalized === "FAILED" && <DotIcon className="text-red-500" />}
        {normalized === "DRAFT" && <DotIcon className="text-gray-400" />}
        {label}
        {isFailedWithLog && (
          <button
            type="button"
            title={t("deliveryFailedTooltip")}
            aria-label={t("deliveryFailedTooltip")}
            onClick={(e) => {
              stopPropagationDetails(e);
              setShowError(true);
            }}
            className="-mr-0.5 ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-100 text-red-700 transition hover:bg-red-200"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-2.5 w-2.5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1-9a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </span>
      {showError && (
        <ErrorLogDialog
          message={errorLog ?? ""}
          onClose={() => setShowError(false)}
        />
      )}
    </>
  );
}

function ErrorLogDialog({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  const t = useTranslations("LeadDetail");
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("deliveryErrorTitle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label={t("deliveryErrorClose")}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-xs leading-relaxed text-gray-700">
          {message}
        </pre>
      </div>
    </div>
  );
}

function DotIcon({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-1.5 w-1.5 rounded-full bg-current ${className}`}
    />
  );
}
