import type { Metadata } from "next";
import { buildPageMetadata } from "@/src/lib/seo/metadata";

type PageKey = "home" | "pricing" | "webAgencies";

const COPY: Record<
  PageKey,
  Record<"uk" | "en", { title: string; description: string; path: string }>
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
  },
  pricing: {
    uk: {
      title: "Тарифи Flux Leads — від $0 до Agency",
      description:
        "Starter: 50 лідів/міс безкоштовно. Pro $20 — аудит сайтів і AI-листи. Agency $60 — безліміт лідів і CSV. Оберіть план під ваш outbound.",
      path: "/pricing",
    },
    en: {
      title: "Flux Leads Pricing — Starter to Agency",
      description:
        "Starter: 50 leads/mo free. Pro $20 — site audits & AI emails. Agency $60 — unlimited leads & CSV. Pick the plan for your outreach volume.",
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
  },
};

export function marketingPageMetadata(
  page: PageKey,
  locale: string,
): Metadata {
  const loc = locale === "en" ? "en" : "uk";
  const copy = COPY[page][loc];
  return buildPageMetadata({
    locale: loc,
    pathname: copy.path,
    title: copy.title,
    description: copy.description,
    ogImagePath: "/logo-mark.svg",
  });
}
