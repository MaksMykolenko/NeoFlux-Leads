"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { searchUniversalLeads } from "@/src/actions/universalActions";

export default function UniversalOutreach() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || pending) return;

    setError(null);
    setLastSaved(null);

    startTransition(async () => {
      const res = await searchUniversalLeads(trimmed);
      if (res.success) {
        setLastSaved(res.saved ?? 0);
        router.refresh();
      } else {
        setError(res.error ?? "Пошук не вдався");
      }
    });
  }

  return (
    <div id="tour-universal-search" className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          htmlFor="universal-prompt"
          className="block text-sm font-medium text-gray-700"
        >
          Опишіть, кого шукаєте
        </label>
        <textarea
          id="universal-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          disabled={pending}
          placeholder='Наприклад: «Знайди 5 SaaS стартапів у сфері логістики в Польщі з публічним сайтом» або «Контакти HR-директорів українських IT-компаній 200+ людей»'
          className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending || !prompt.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-violet-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "AI аналізує інтернет…" : "Запустити AI-сканер"}
          </button>
          {pending && (
            <span className="text-xs text-gray-500">
              Зачекайте — виконується пошук у Google…
            </span>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {lastSaved !== null && !pending && (
        <p className="text-sm text-green-700">
          Збережено в CRM:{" "}
          <span className="font-semibold tabular-nums">{lastSaved}</span>{" "}
          {lastSaved === 1 ? "запис" : "записів"} (нові та оновлені за назвою).
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-gray-400">
        Результати зберігаються як ліди режиму «Універсальний». Перевіряйте
        достовірність даних перед outreach — AI може помилятися.
      </p>
    </div>
  );
}
