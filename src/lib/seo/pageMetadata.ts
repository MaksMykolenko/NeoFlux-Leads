import type { Metadata } from "next";
import { buildPageMetadata } from "@/src/lib/seo/metadata";

type PageKey = "home" | "pricing" | "webAgencies";

const COPY: Record<
  PageKey,
  Record<"uk" | "en" | "pl", { title: string; description: string; path: string }>
> = {
  home: {
    uk: {
      title: "AI-лідогенерація для веб-студій | Flux Leads",
      description:
        "Знаходьте бізнеси зі слабкими сайтами, автоматично перевіряйте їх і генеруйте персоналізовані cold email на основі реальних проблем.",
      path: "/",
    },
    en: {
      title: "AI Lead Generation for Web Agencies | Flux Leads",
      description:
        "Find local businesses with weak websites, audit them automatically, and generate personalized cold emails based on real issues.",
      path: "/",
    },
    pl: {
      title: "Pozyskiwanie leadów dla agencji webowych | Flux Leads",
      description:
        "Znajduj lokalne firmy ze słabymi stronami, wykonuj audyty i twórz spersonalizowane wiadomości sprzedażowe.",
      path: "/",
    },
  },
  pricing: {
    uk: {
      title: "Ціни Flux Leads | AI-лідогенерація для веб-студій",
      description:
        "Почніть безкоштовно з 50 лідів на місяць. Порівняйте Starter, Pro та Agency для пошуку лідів, аудиту сайтів, email drafts і CRM.",
      path: "/pricing",
    },
    en: {
      title: "Flux Leads Pricing | AI Lead Generation for Web Agencies",
      description:
        "Start free with 50 leads per month. Compare Starter, Pro, and Agency plans for AI lead search, website audits, email drafts, and CRM.",
      path: "/pricing",
    },
    pl: {
      title: "Cennik Flux Leads | Pozyskiwanie leadów dla agencji webowych",
      description:
        "Zacznij za darmo z 50 leadami miesięcznie. Porównaj plany Starter, Pro i Agency dla wyszukiwania leadów, audytów stron, wiadomości AI i CRM.",
      path: "/pricing",
    },
  },
  webAgencies: {
    uk: {
      title: "Лідогенерація для веб-студій | Outreach через аудит сайтів",
      description:
        "Flux Leads допомагає веб-студіям знаходити локальні бізнеси, аудитувати слабкі сайти, пріоритизувати ліди та писати персоналізовані повідомлення.",
      path: "/solutions/web-agencies",
    },
    en: {
      title: "Lead Generation for Web Agencies | Audit-Led Outreach",
      description:
        "Flux Leads helps web agencies find local businesses, audit weak websites, prioritize prospects, and turn website issues into personalized outreach.",
      path: "/solutions/web-agencies",
    },
    pl: {
      title: "Pozyskiwanie klientów dla agencji webowych | Flux Leads",
      description:
        "Flux Leads pomaga agencjom webowym znajdować lokalne firmy, audytować słabe strony i przygotowywać skuteczny outreach.",
      path: "/solutions/agencje-webowe",
    },
  },
};

export function marketingPageMetadata(
  page: PageKey,
  locale: string,
): Metadata {
  const loc = locale === "en" || locale === "pl" ? locale : "uk";
  const copy = COPY[page][loc];
  return buildPageMetadata({
    locale: loc,
    pathname: copy.path,
    title: copy.title,
    description: copy.description,
    ogImagePath: "/logo-mark.svg",
  });
}
