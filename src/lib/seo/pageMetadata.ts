import type { Metadata } from "next";
import { buildPageMetadata } from "@/src/lib/seo/metadata";

type PageKey = "home" | "pricing" | "webAgencies";

const COPY: Record<
  PageKey,
  Record<"uk" | "en" | "pl", { title: string; description: string; path: string }>
> = {
  home: {
    uk: {
      title: "Flux Leads — AI лідоген і CRM для аутрічу",
      description:
        "Знаходьте локальних клієнтів, аудитуйте сайти, рахуйте Opportunity Score і надсилайте персоналізований cold email — одна платформа для веб-студій.",
      path: "/",
    },
    en: {
      title: "Flux Leads — AI Lead Gen & Outreach CRM",
      description:
        "Find local businesses, audit websites, score sales opportunities, and send personalized cold emails—one platform built for web agencies.",
      path: "/",
    },
    pl: {
      title: "Flux Leads — AI lead gen i CRM do outreach",
      description:
        "Znajduj lokalne firmy ze slabymi stronami, audytuj je automatycznie i generuj spersonalizowane cold emaile dla agencji webowych.",
      path: "/",
    },
  },
  pricing: {
    uk: {
      title: "Тарифи Flux Leads — від $0 до Agency",
      description:
        "Starter: 50 лідів/міс безкоштовно. Pro $20 — аудит сайтів і AI-листи. Agency $60 — 10 000 лідів і CSV. Оберіть план під ваш outbound.",
      path: "/pricing",
    },
    en: {
      title: "Flux Leads Pricing — Starter to Agency",
      description:
        "Starter: 50 leads/mo free. Pro $20 — site audits & AI emails. Agency $60 — 10,000 leads & CSV. Pick the plan for your outreach volume.",
      path: "/pricing",
    },
    pl: {
      title: "Cennik Flux Leads — Starter, Pro i Agency",
      description:
        "Starter: 50 leadow/mies. za darmo. Pro $20 — audyty stron i emaile AI. Agency $60 — 10 000 leadow i CSV.",
      path: "/pricing",
    },
  },
  webAgencies: {
    uk: {
      title: "Flux Leads для веб-студій — клієнти з аудиту",
      description:
        "Знаходьте бізнеси з слабким сайтом, отримуйте докази для пітчу (SSL, mobile, SEO) і закривайте угоди в Kanban-воронці — без таблиць і хаосу.",
      path: "/solutions/web-agencies",
    },
    en: {
      title: "Flux Leads for Web Agencies — Audit-Led Sales",
      description:
        "Find businesses with weak websites, get proof for your pitch (SSL, mobile, SEO), and close deals in a Kanban pipeline—no spreadsheet chaos.",
      path: "/solutions/web-agencies",
    },
    pl: {
      title: "Flux Leads dla agencji webowych — sprzedaz przez audyt",
      description:
        "Znajduj firmy ze slabymi stronami, zbieraj dowody do pitchu (SSL, mobile, SEO) i zamykaj deale w pipeline Kanban.",
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
