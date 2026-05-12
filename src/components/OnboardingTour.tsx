"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { driver } from "driver.js";
import type { DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const STORAGE_KEY = "nf.leadEngine.hasSeenTour";

export type TourMode = "local" | "beats" | "universal";

function buildTourSteps(
  tourMode: TourMode,
  ts: (key: string) => string,
): DriveStep[] {
  const isBeats = tourMode === "beats";
  const isUniversal = tourMode === "universal";

  const commonHead: DriveStep[] = [
    {
      element: "#tour-brand-mark",
      popover: {
        title: ts("brandTitle"),
        description: ts("brandBody"),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-page-title",
      popover: {
        title: ts("headerTitle"),
        description: ts("headerBody"),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-mode-tabs",
      popover: {
        title: ts("modesTitle"),
        description: ts("modesBody"),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: isUniversal ? "#tour-universal-search" : "#tour-search-form",
      popover: {
        title: isBeats
          ? ts("searchTitleBeats")
          : isUniversal
            ? ts("searchTitleUniversal")
            : ts("searchTitleLocal"),
        description: isBeats
          ? ts("searchDescBeats")
          : isUniversal
            ? ts("searchDescUniversal")
            : ts("searchDescLocal"),
        side: "bottom",
        align: "start",
      },
    },
  ];

  const beatsPipeline: DriveStep[] = [
    {
      element: "#tour-beats-step-demo",
      popover: {
        title: ts("demoTitle"),
        description: ts("demoBody"),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-beats-messages",
      popover: {
        title: ts("msgTitle"),
        description: ts("msgBody"),
        side: "top",
        align: "start",
      },
    },
  ];

  const tableStep: DriveStep = {
    element: "#tour-leads-table",
    popover: {
      title: ts("leadTableTitle"),
      description: isBeats
        ? ts("tableDescBeats")
        : isUniversal
          ? ts("tableDescUniversal")
          : ts("tableDescLocal"),
      side: "top",
      align: "start",
    },
  };

  const helpStep: DriveStep = {
    element: "#tour-help-button",
    popover: {
      title: ts("replayTitle"),
      description: ts("replayBody"),
      side: "left",
      align: "end",
    },
  };

  if (isBeats) {
    return [...commonHead, ...beatsPipeline, tableStep, helpStep];
  }

  return [...commonHead, tableStep, helpStep];
}

function tourModeFromSearch(mode: string | null): TourMode {
  if (mode === "beats") return "beats";
  if (mode === "universal") return "universal";
  return "local";
}

export default function OnboardingTour() {
  const searchParams = useSearchParams();
  const tourMode = tourModeFromSearch(searchParams.get("mode"));

  const t = useTranslations("OnboardingTour");
  const ts = useTranslations("OnboardingTour.steps");

  const stepsForMode = useMemo(
    () => buildTourSteps(tourMode, ts),
    [tourMode, ts],
  );

  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const tourWasStartedRef = useRef(false);
  const tourModeRef = useRef(tourMode);

  useEffect(() => {
    tourModeRef.current = tourMode;
  }, [tourMode]);

  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      progressText: t("progressText"),
      nextBtnText: t("next"),
      prevBtnText: t("back"),
      doneBtnText: t("done"),
      smoothScroll: true,
      animate: true,
      steps: buildTourSteps(tourModeRef.current, ts),
      onDestroyed: () => {
        if (!tourWasStartedRef.current) return;
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch {
          // ignore
        }
      },
    });

    driverRef.current = driverObj;

    let autoTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const hasSeen = localStorage.getItem(STORAGE_KEY);
      if (!hasSeen) {
        autoTimer = setTimeout(() => {
          driverObj.setSteps(buildTourSteps(tourModeRef.current, ts));
          tourWasStartedRef.current = true;
          driverObj.drive();
        }, 500);
      }
    } catch {
      // localStorage blocked
    }

    return () => {
      if (autoTimer) clearTimeout(autoTimer);
      driverObj.destroy();
      driverRef.current = null;
    };
  }, [t, ts]);

  useEffect(() => {
    driverRef.current?.setSteps(stepsForMode);
  }, [stepsForMode]);

  function startTour() {
    driverRef.current?.setSteps(buildTourSteps(tourMode, ts));
    tourWasStartedRef.current = true;
    driverRef.current?.drive();
  }

  return (
    <button
      type="button"
      id="tour-help-button"
      onClick={startTour}
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-md transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      title={t("helpTitle")}
      aria-label={t("helpAria")}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
        ?
      </span>
      <span className="hidden sm:inline">{t("helpButton")}</span>
    </button>
  );
}
