"use client";

import { useState, useTransition } from "react";
import { generateProposal } from "@/src/actions/aiActions";
import { saveGeneratedMessage } from "@/src/actions/messageActions";

interface AIProposalGeneratorProps {
  leadId: string;
  companyName: string;
}

export default function AIProposalGenerator({
  leadId,
  companyName,
}: AIProposalGeneratorProps) {
  const [text, setText] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [isSaving, startSave] = useTransition();

  const hasText = text.trim().length > 0;
  // Disable Save while the textarea matches what we last persisted to avoid
  // accidentally inserting an identical Message row a second time.
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
          current.trim() ? current : `Пропозиція для ${companyName}`
        );
      } else {
        setError(result.error ?? "Не вдалось згенерувати лист");
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
      setError("Не вдалось скопіювати в буфер обміну");
    }
  }

  function handleSave() {
    setError(null);
    startSave(async () => {
      const result = await saveGeneratedMessage(leadId, subject, text);
      if (result.success) {
        setSavedFor(text.trim());
      } else {
        setError(result.error ?? "Не вдалось зберегти повідомлення");
      }
    });
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            AI Proposal
          </p>
          <h2 className="mt-1 text-base font-semibold text-gray-900">
            Холодний лист під цього ліда
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gemini 2.5 Flash проаналізує дані ліда та згенерує персоналізований
            лист на основі знайдених «болей».
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-violet-700 hover:to-blue-700 hover:shadow disabled:cursor-wait disabled:opacity-60"
        >
          <SparkleIcon className="w-4 h-4" />
          {isGenerating
            ? "Генерую..."
            : hasText
            ? "Згенерувати ще раз"
            : "Згенерувати листа (AI)"}
        </button>
      </div>

      <div className="mt-5">
        {isGenerating ? (
          <SkeletonLoader />
        ) : hasText ? (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="ai-proposal-subject"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
              >
                Тема листа
              </label>
              <input
                id="ai-proposal-subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={`Пропозиція для ${companyName}`}
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="ai-proposal-body"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
              >
                Текст листа
              </label>
              <textarea
                id="ai-proposal-body"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={Math.min(Math.max(text.split("\n").length + 1, 8), 18)}
                className="block w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-900 shadow-inner focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-gray-400">
                Тему та текст можна редагувати перед збереженням.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    copied
                      ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200"
                      : "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5" />
                      Скопійовано
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="w-3.5 h-3.5" />
                      Копіювати
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isAlreadySaved || !subject.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  <SaveIcon className="w-3.5 h-3.5" />
                  {isSaving
                    ? "Зберігаю..."
                    : isAlreadySaved
                    ? "Збережено"
                    : "Зберегти в CRM"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <SparkleIcon className="w-8 h-8 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              Натисніть кнопку, щоб AI створив персональний холодний лист.
            </p>
          </div>
        )}
      </div>

      {isAlreadySaved && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800">
          <CheckIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
          <div>
            Повідомлення збережено, статус ліда змінено на{" "}
            <span className="font-semibold">Contacted</span>.
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </section>
  );
}

function SkeletonLoader() {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <svg
          className="h-4 w-4 animate-spin text-violet-600"
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
        AI аналізує ліда...
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="h-3 w-3/5 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
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
