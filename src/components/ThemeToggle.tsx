"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

/**
 * Іконкова кнопка-перемикач. До hydration рендеримо нейтральний стан, щоб
 * не отримати mismatch між SSR (theme невідома) і CSR.
 */
export default function ThemeToggle() {
  const t = useTranslations("ThemeToggle");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";
  const label = mounted
    ? isDark
      ? t("switchToLight")
      : t("switchToDark")
    : t("toggle");

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {!mounted ? (
        <PlaceholderIcon />
      ) : isDark ? (
        <SunIcon />
      ) : (
        <MoonIcon />
      )}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M10 2.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM10 14.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM3.5 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3.5 10ZM14.25 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75ZM5.05 5.05a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06L5.05 6.11a.75.75 0 0 1 0-1.06ZM12.83 12.83a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM5.05 14.95a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0ZM12.83 7.17a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0ZM10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.455 2.005a.75.75 0 0 1 .272.86 7 7 0 0 0 9.408 9.408.75.75 0 0 1 .96 1.06A8.5 8.5 0 1 1 6.394 1.044a.75.75 0 0 1 1.06.96Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlaceholderIcon() {
  // Нейтральне коло — щоб layout не стрибав до hydration.
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 rounded-full border border-current opacity-40"
    />
  );
}
