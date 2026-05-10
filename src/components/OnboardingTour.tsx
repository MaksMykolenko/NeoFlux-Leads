"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { driver } from "driver.js";
import type { DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const STORAGE_KEY = "nf.leadEngine.hasSeenTour";

/**
 * Повний тур: залежить від режиму (локальний бізнес vs біти),
 * бо кроки для BeatOutreach існують лише на `?mode=beats`.
 */
function buildTourSteps(isBeats: boolean): DriveStep[] {
  const commonHead: DriveStep[] = [
    {
      element: "#tour-page-header",
      popover: {
        title: "NeoFlux Lead Engine",
        description:
          "Головний екран: логотип NeoFlux і заголовок. Тут ви керуєте пошуком лідів і збереженими контактами.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-mode-tabs",
      popover: {
        title: "Режими роботи",
        description:
          "Перемикайте «Локальний бізнес» (Google Maps, аудит сайтів) та «Виконавці для бітів» (AI-пошук артистів, демо, розсилка по каналах).",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-search-form",
      popover: {
        title: isBeats ? "Пошук артистів (AI)" : "Пошук локальних лідів",
        description: isBeats
          ? "Введіть жанр, платформу або @нік. Gemini з пошуком Google знайде реальних артистів; оберіть картки та продовжіть до демо й повідомлень."
          : "Введіть нішу та місто і натисніть «Пошук». Система збере компанії з карт і додасть їх у таблицю нижче.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  const beatsPipeline: DriveStep[] = [
    {
      element: "#tour-beats-step-demo",
      popover: {
        title: "Демо біта",
        description:
          "Після вибору артистів завантажте трек: превʼю, водяний знак (у браузері), метадані для AI-листа (BPM, тональність, ціна).",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-beats-smtp",
      popover: {
        title: "Налаштування надсилання",
        description:
          "Чернетка SMTP для майбутньої відправки. Зараз лист не йде по пошті автоматично — «Зберегти в CRM» фіксує контакт і повідомлення в базі.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-beats-messages",
      popover: {
        title: "Повідомлення та канали",
        description:
          "AI згенерує текст під кожного артиста. Відкрийте Email, Telegram, Instagram тощо — текст скопіюється там, де треба; потім збережіть outreach у CRM.",
        side: "top",
        align: "start",
      },
    },
  ];

  const tableStep: DriveStep = {
    element: "#tour-leads-table",
    popover: {
      title: "Таблиця лідів",
      description: isBeats
        ? "Останні збережені артисти з CRM. Клік по рядку відкриє картку: соцмережі, фоловери, історія повідомлень і демо."
        : "Останні додані компанії. Відкрийте лід для аудиту сайту, контактів і AI-листа.",
      side: "top",
      align: "start",
    },
  };

  const helpStep: DriveStep = {
    element: "#tour-help-button",
    popover: {
      title: "Підказки завжди поруч",
      description:
        "Натисніть «Як це працює» у будь-який момент, щоб пройти тур знову (після першого візиту тур не стартує автоматично).",
      side: "left",
      align: "end",
    },
  };

  if (isBeats) {
    return [...commonHead, ...beatsPipeline, tableStep, helpStep];
  }

  return [...commonHead, tableStep, helpStep];
}

export default function OnboardingTour() {
  const searchParams = useSearchParams();
  const isBeats = searchParams.get("mode") === "beats";

  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const tourWasStartedRef = useRef(false);
  const isBeatsRef = useRef(isBeats);

  useEffect(() => {
    isBeatsRef.current = isBeats;
  }, [isBeats]);

  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      progressText: "{{current}} з {{total}}",
      nextBtnText: "Далі",
      prevBtnText: "Назад",
      doneBtnText: "Готово",
      smoothScroll: true,
      animate: true,
      steps: buildTourSteps(isBeatsRef.current),
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
          driverObj.setSteps(buildTourSteps(isBeatsRef.current));
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
  }, []);

  useEffect(() => {
    driverRef.current?.setSteps(buildTourSteps(isBeats));
  }, [isBeats]);

  function startTour() {
    driverRef.current?.setSteps(buildTourSteps(isBeats));
    tourWasStartedRef.current = true;
    driverRef.current?.drive();
  }

  return (
    <button
      type="button"
      id="tour-help-button"
      onClick={startTour}
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-md transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      title="Показати огляд інтерфейсу"
      aria-label="Як це працює — короткий тур"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
        ?
      </span>
      <span className="hidden sm:inline">Як це працює</span>
    </button>
  );
}
