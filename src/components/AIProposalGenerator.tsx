"use client";

import { Link } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  generateProposal,
  generateSequence,
  rewriteProposal,
  type RewriteInstruction,
  type SequenceStep,
} from "@/src/actions/aiActions";
import {
  saveGeneratedMessage,
  sendAndSaveEmail,
} from "@/src/actions/messageActions";

interface AIProposalGeneratorProps {
  leadId: string;
  companyName: string;
  leadEmail: string | null;
}

type Toast = {
  type: "success" | "error" | "warn";
  msg: string;
  cta?: { href: string; label: string };
};

const REWRITE_OPTIONS: RewriteInstruction[] = [
  "shorter",
  "friendlier",
  "formal",
];

export default function AIProposalGenerator({
  leadId,
  companyName,
  leadEmail,
}: AIProposalGeneratorProps) {
  const t = useTranslations("AIProposal");
  const tLead = useTranslations("LeadStatus");
  const [text, setText] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [isSending, startSend] = useTransition();
  const [isRewriting, startRewrite] = useTransition();
  const [pendingTone, setPendingTone] = useState<RewriteInstruction | null>(null);
  const [sequence, setSequence] = useState<SequenceStep[] | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isGeneratingSeq, startGenerateSeq] = useTransition();

  const hasText = text.trim().length > 0;
  const canSendEmail = !!leadEmail;
  const isAlreadySaved = savedFor !== null && savedFor === text.trim();

  function handleGenerate() {
    setError(null);
    setCopied(false);
    setSavedFor(null);

    startGenerate(async () => {
      const result = await generateProposal(leadId);
      if (result.success && result.text) {
        setText(result.text);
        setSubject((current) =>
          current.trim()
            ? current
            : t("subjectPlaceholder", { company: companyName })
        );
      } else {
        setError(result.error ?? t("generateErr"));
      }
    });
  }

  async function handleCopy() {
    if (!hasText) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("copyErr"));
    }
  }

  function handleSave() {
    setError(null);
    startSave(async () => {
      const result = await saveGeneratedMessage(leadId, subject, text);
      if (result.success) {
        setSavedFor(text.trim());
      } else {
        setError(result.error ?? t("saveErr"));
      }
    });
  }

  function handleRewrite(instruction: RewriteInstruction) {
    if (!hasText) return;
    setError(null);
    setPendingTone(instruction);
    startRewrite(async () => {
      const result = await rewriteProposal(text, instruction);
      if (result.success && result.text) {
        setText(result.text);
        setSavedFor(null);
      } else {
        setError(result.error ?? t("rewriteErr"));
      }
      setPendingTone(null);
    });
  }

  function handleGenerateSequence() {
    setError(null);
    startGenerateSeq(async () => {
      const result = await generateSequence(leadId);
      if (result.success && result.steps) {
        setSequence(result.steps);
        setActiveStep(1);
        // Підставити перший крок у поля редагування — щоб юзер міг
        // одразу його зберегти/надіслати, як з звичайним згенерованим листом.
        setSubject(result.steps[0].subject);
        setText(result.steps[0].body);
        setSavedFor(null);
        setCopied(false);
      } else {
        setError(result.error ?? t("sequenceErr"));
      }
    });
  }

  function handlePickStep(step: 1 | 2 | 3) {
    if (!sequence) return;
    const found = sequence.find((s) => s.step === step);
    if (!found) return;
    setActiveStep(step);
    setSubject(found.subject);
    setText(found.body);
    setSavedFor(null);
    setCopied(false);
  }

  function handleSendEmail() {
    setError(null);
    setToast(null);
    if (!hasText || !subject.trim() || !canSendEmail) return;

    startSend(async () => {
      const result = await sendAndSaveEmail(leadId, subject, text);

      if (result.success) {
        setSavedFor(text.trim());
        setToast({
          type: "success",
          msg: t("toastSent"),
        });
        return;
      }

      if (result.errorCode === "NO_SMTP") {
        setToast({
          type: "warn",
          msg: t("toastNoSmtp"),
          cta: { href: "/settings", label: t("openSettings") },
        });
        return;
      }

      setToast({
        type: "error",
        msg: result.error ?? t("toastSmtpErr"),
      });
    });
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 dark:bg-flux-card dark:border-flux-border">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("description")}</p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{t("emailOnlyNote")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateSequence}
            disabled={
              isGenerating || isSaving || isGeneratingSeq || isRewriting
            }
            title={t("sequenceTitle")}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-flux-card-2 dark:text-zinc-100 dark:ring-1 dark:ring-inset dark:ring-flux-border-strong dark:hover:bg-flux-card"
          >
            {isGeneratingSeq ? t("generatingShort") : t("sequenceCta")}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            <SparkleIcon className="w-4 h-4" />
            {isGenerating
              ? t("generatingShort")
              : hasText
                ? t("regenerate")
                : t("generate")}
          </button>
        </div>
      </div>

      {sequence && (
        <div className="mt-5 rounded-md border border-zinc-800 bg-[#1a1a1a] p-1">
          <div role="tablist" className="flex gap-1">
            {sequence.map((s) => (
              <button
                key={s.step}
                role="tab"
                aria-selected={activeStep === s.step}
                onClick={() => handlePickStep(s.step)}
                className={`flex-1 rounded px-3 py-2 text-xs font-medium transition ${
                  activeStep === s.step
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <span className="opacity-60">{s.step}.</span> {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        {isGenerating ? (
          <SkeletonLoader label={t("analyzing")} />
        ) : hasText ? (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="ai-proposal-subject"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 dark:text-zinc-400"
              >
                {t("subjectLabel")}
              </label>
              <input
                id="ai-proposal-subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={t("subjectPlaceholder", { company: companyName })}
                className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-flux-border dark:bg-flux-card dark:text-zinc-50 dark:focus:bg-zinc-900"
              />
            </div>

            <div>
              <label
                htmlFor="ai-proposal-body"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 dark:text-zinc-400"
              >
                {t("bodyLabel")}
              </label>
              <textarea
                id="ai-proposal-body"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={Math.min(Math.max(text.split("\n").length + 1, 8), 18)}
                className="block w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-900 shadow-inner focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-flux-border dark:bg-flux-card dark:text-zinc-50 dark:focus:bg-zinc-900"
              />
            </div>

            {/* Re-writer: 3 строгі пласкі кнопки в кіберпанк-палітрі */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {t("rewriteLabel")}
              </span>
              {REWRITE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleRewrite(opt)}
                  disabled={isRewriting || isGenerating || isSaving}
                  className={`inline-flex items-center gap-1.5 rounded-md border border-purple-700 bg-purple-700 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-purple-800 hover:border-purple-800 disabled:opacity-60 ${
                    pendingTone === opt && isRewriting ? "opacity-70" : ""
                  }`}
                >
                  {pendingTone === opt && isRewriting && (
                    <SpinnerIcon className="h-3 w-3 animate-spin" />
                  )}
                  {t(`rewrite.${opt}`)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{t("editHint")}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    copied
                      ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30"
                      : "bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-100 dark:bg-flux-card-2 dark:text-zinc-300 dark:ring-flux-border-strong dark:hover:bg-flux-card-2/80"
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5" />
                      {t("copied")}
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="w-3.5 h-3.5" />
                      {t("copy")}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isAlreadySaved || !subject.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-800 ring-1 ring-inset ring-zinc-200 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700"
                >
                  <SaveIcon className="w-3.5 h-3.5" />
                  {isSaving
                    ? t("saving")
                    : isAlreadySaved
                      ? t("savedState")
                      : t("save")}
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={
                    !canSendEmail ||
                    isSending ||
                    isSaving ||
                    !hasText ||
                    !subject.trim()
                  }
                  title={!canSendEmail ? t("noEmailHint") : undefined}
                  className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  {isSending ? (
                    <>
                      <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                      {t("sending")}
                    </>
                  ) : (
                    <>
                      <PaperPlaneIcon className="w-3.5 h-3.5" />
                      {t("send")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <SparkleIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{t("emptyState")}</p>
          </div>
        )}
      </div>

      {isAlreadySaved && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-emerald-400" />
          <div>
            {t("savedBannerIntro")}{" "}
            <span className="font-semibold">{tLead("Contacted")}</span>.
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {toast && (
        <div
          className={`mt-4 flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
              : toast.type === "warn"
                ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          }`}
        >
          <span className="flex-1">{toast.msg}</span>
          {toast.cta && (
            <Link
              href={toast.cta.href}
              className="font-medium underline hover:no-underline"
            >
              {toast.cta.label}
            </Link>
          )}
        </div>
      )}

      {!canSendEmail && hasText && (
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">{t("noEmailHint")}</p>
      )}
    </section>
  );
}

function SkeletonLoader({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-flux-border dark:bg-flux-card">
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <svg
          className="h-4 w-4 animate-spin text-purple-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        {label}
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM16 1a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258a2.625 2.625 0 0 0-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 16 1Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClipboardIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v6.5A2.25 2.25 0 0 1 15.75 14H13.5v-3.75A2.75 2.75 0 0 0 10.75 7.5H7v-2.25c0-1.21.92-2.205 2.099-2.235l.022-.001A.75.75 0 0 1 9.25 3h6a.75.75 0 0 1 .738.012Z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M2 10.25A2.25 2.25 0 0 1 4.25 8h6.5A2.25 2.25 0 0 1 13 10.25v6.5A2.25 2.25 0 0 1 10.75 19h-6.5A2.25 2.25 0 0 1 2 16.75v-6.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SaveIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3.75 3A1.75 1.75 0 0 0 2 4.75v10.5C2 16.216 2.784 17 3.75 17h12.5A1.75 1.75 0 0 0 18 15.25V8.336c0-.464-.184-.909-.513-1.236l-4.587-4.587A1.75 1.75 0 0 0 11.664 2H3.75ZM6 5.75A.75.75 0 0 1 6.75 5h5a.75.75 0 0 1 0 1.5h-5A.75.75 0 0 1 6 5.75ZM10 11a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PaperPlaneIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.105 3.105a1 1 0 0 1 1.06-.225l13 5a1 1 0 0 1 0 1.866l-13 5a1 1 0 0 1-1.276-1.317L4.36 10 2.89 4.572a1 1 0 0 1 .215-1.467ZM5.602 9.5l-.93 3.428 9.318-3.428H5.602Zm8.388-1L4.672 5.072 5.602 8.5h8.388Z" />
    </svg>
  );
}

function SpinnerIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
