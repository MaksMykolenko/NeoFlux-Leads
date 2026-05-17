import { routing } from "@/src/i18n/routing";

export type MarketingLocale = (typeof routing.locales)[number];

type StaticPage = {
  kind: "legal" | "seo";
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  sections: { title: string; body: string }[];
  cta?: string;
};

type StaticPageCopy = Omit<StaticPage, "kind">;

export const LEGAL_SLUGS = [
  "privacy",
  "terms",
  "cookies",
  "acceptable-use",
] as const;

export const SEO_SLUGS = [
  "lead-generation-for-web-design-agencies",
  "find-web-design-clients",
  "local-business-website-audit-tool",
  "cold-email-for-web-agencies",
  "pozyskiwanie-klientow-dla-agencji-webowych",
  "jak-znalezc-klientow-na-strony-internetowe",
] as const;

export const STATIC_PAGE_SLUGS = [...LEGAL_SLUGS, ...SEO_SLUGS] as const;

const legalCommon = {
  en: {
    privacy: {
      title: "Privacy Policy | Flux Leads",
      description:
        "How Flux Leads handles account, lead, billing, and product usage data.",
      eyebrow: "Legal",
      h1: "Privacy Policy",
      intro:
        "Flux Leads is built for B2B lead discovery and outreach workflows. This page explains the main categories of data we process and how users should handle prospect information.",
      sections: [
        {
          title: "Data we process",
          body:
            "We process account details, subscription status, product usage, lead records added by users, website audit outputs, generated drafts, and operational logs needed to run the service.",
        },
        {
          title: "Lead and outreach data",
          body:
            "Users are responsible for making sure any business contact data they collect or use through Flux Leads is lawful, relevant, accurate, and removed when it should no longer be used.",
        },
        {
          title: "Service providers",
          body:
            "Flux Leads may use infrastructure, analytics, AI, email, and payment providers such as Stripe to operate the product. We only share data needed for those services.",
        },
      ],
    },
    terms: {
      title: "Terms of Service | Flux Leads",
      description: "Terms for using Flux Leads lead generation and outreach CRM.",
      eyebrow: "Legal",
      h1: "Terms of Service",
      intro:
        "These terms describe the baseline rules for using Flux Leads. They are written for a practical early-stage SaaS and should be reviewed by counsel before relying on them as final legal text.",
      sections: [
        {
          title: "Use of the product",
          body:
            "Flux Leads helps users search for prospects, audit websites, draft outreach, and manage a lightweight CRM pipeline. Users remain responsible for how they contact prospects.",
        },
        {
          title: "Billing",
          body:
            "Paid plans are billed through Stripe. You can cancel or change your subscription from the billing portal when available in your account.",
        },
        {
          title: "Availability",
          body:
            "We work to keep the service reliable, but lead search, website audits, AI output, and third-party integrations can fail or return incomplete data.",
        },
      ],
    },
    cookies: {
      title: "Cookie Policy | Flux Leads",
      description: "How Flux Leads uses cookies and similar browser storage.",
      eyebrow: "Legal",
      h1: "Cookie Policy",
      intro:
        "Flux Leads uses cookies and similar storage to keep users signed in, remember locale preferences, protect authentication flows, and understand product usage.",
      sections: [
        {
          title: "Essential cookies",
          body:
            "Essential cookies keep the session, security state, and language preference working. Without them the app cannot function correctly.",
        },
        {
          title: "Analytics",
          body:
            "Where analytics is enabled, it helps us understand aggregate product usage and improve the service. You can manage browser-level controls through your browser settings.",
        },
      ],
    },
    "acceptable-use": {
      title: "Acceptable Use Policy | Flux Leads",
      description:
        "Rules for responsible lead generation, cold outreach, and website audit usage in Flux Leads.",
      eyebrow: "Legal",
      h1: "Acceptable Use Policy",
      intro:
        "Flux Leads is designed for relevant B2B outreach based on public business context. It is not designed for spam, harassment, illegal scraping, or purchased contact lists.",
      sections: [
        {
          title: "Allowed use",
          body:
            "Use Flux Leads to find relevant business prospects, verify the information, prepare useful outreach, and maintain a clear source trail for your work.",
        },
        {
          title: "Not allowed",
          body:
            "Do not use Flux Leads for spam campaigns, deceptive outreach, mass scraping, illegal data collection, sensitive personal data targeting, or ignoring opt-out requests.",
        },
        {
          title: "Compliance",
          body:
            "Users must follow applicable email marketing, privacy, data protection, and platform rules, including GDPR/ePrivacy where they apply.",
        },
      ],
    },
  },
  uk: {
    privacy: {
      title: "Політика конфіденційності | Flux Leads",
      description:
        "Як Flux Leads обробляє акаунт, ліди, billing і product usage data.",
      eyebrow: "Legal",
      h1: "Політика конфіденційності",
      intro:
        "Flux Leads створений для B2B lead discovery та outreach workflow. Ця сторінка пояснює основні категорії даних, які обробляє сервіс.",
      sections: [
        {
          title: "Які дані обробляємо",
          body:
            "Ми обробляємо дані акаунта, статус підписки, використання продукту, записи лідів, результати аудиту сайтів, AI drafts і технічні логи для роботи сервісу.",
        },
        {
          title: "Дані лідів",
          body:
            "Користувач відповідає за те, щоб business contact data, які він використовує у Flux Leads, були законними, релевантними, точними й видалялися, коли їх більше не можна використовувати.",
        },
      ],
    },
    terms: {
      title: "Умови використання | Flux Leads",
      description: "Умови використання Flux Leads lead generation та outreach CRM.",
      eyebrow: "Legal",
      h1: "Умови використання",
      intro:
        "Це базові правила користування Flux Leads. Перед використанням як фінального юридичного тексту їх варто перевірити з юристом.",
      sections: [
        {
          title: "Використання продукту",
          body:
            "Flux Leads допомагає шукати prospects, аудитувати сайти, готувати outreach і вести lightweight CRM. Користувач відповідає за контакт із prospects.",
        },
        {
          title: "Оплата",
          body:
            "Платні плани обробляються через Stripe. Підписку можна скасувати або змінити через billing portal, коли він доступний в акаунті.",
        },
      ],
    },
    cookies: {
      title: "Cookie Policy | Flux Leads",
      description: "Як Flux Leads використовує cookies і browser storage.",
      eyebrow: "Legal",
      h1: "Cookie Policy",
      intro:
        "Flux Leads використовує cookies та схоже сховище для сесії, language preference, захисту auth flow і аналітики продукту.",
      sections: [
        {
          title: "Essential cookies",
          body:
            "Essential cookies потрібні для сесії, безпеки й вибору мови. Без них app не працює коректно.",
        },
        {
          title: "Analytics",
          body:
            "Якщо аналітика увімкнена, вона допомагає розуміти aggregate usage і покращувати сервіс.",
        },
      ],
    },
    "acceptable-use": {
      title: "Acceptable Use Policy | Flux Leads",
      description:
        "Правила відповідального lead generation, cold outreach і website audit у Flux Leads.",
      eyebrow: "Legal",
      h1: "Acceptable Use Policy",
      intro:
        "Flux Leads створений для релевантного B2B outreach на основі публічного бізнес-контексту, а не для spam або illegal scraping.",
      sections: [
        {
          title: "Дозволене використання",
          body:
            "Використовуйте Flux Leads для пошуку релевантних business prospects, перевірки інформації, корисного outreach і збереження source trail.",
        },
        {
          title: "Заборонено",
          body:
            "Не використовуйте Flux Leads для spam campaigns, deceptive outreach, mass scraping, illegal data collection або ігнорування opt-out.",
        },
      ],
    },
  },
  pl: {
    privacy: {
      title: "Privacy Policy | Flux Leads",
      description:
        "Jak Flux Leads obsluguje dane konta, leadow, billing i usage.",
      eyebrow: "Legal",
      h1: "Privacy Policy",
      intro:
        "Flux Leads jest zbudowany do B2B lead discovery i outreach. Ta strona opisuje glowne kategorie danych przetwarzanych w produkcie.",
      sections: [
        {
          title: "Jakie dane przetwarzamy",
          body:
            "Przetwarzamy dane konta, status subskrypcji, usage produktu, rekordy leadow, wyniki audytow stron, drafty AI i logi operacyjne potrzebne do dzialania uslugi.",
        },
        {
          title: "Dane leadow",
          body:
            "Uzytkownik odpowiada za to, aby dane kontaktowe firm byly legalne, relewantne, dokladne i usuwane wtedy, gdy nie powinny byc dalej uzywane.",
        },
      ],
    },
    terms: {
      title: "Terms of Service | Flux Leads",
      description: "Warunki korzystania z Flux Leads.",
      eyebrow: "Legal",
      h1: "Terms of Service",
      intro:
        "To bazowe zasady korzystania z Flux Leads. Przed traktowaniem ich jako finalnego tekstu prawnego warto skonsultowac je z prawnikiem.",
      sections: [
        {
          title: "Korzystanie z produktu",
          body:
            "Flux Leads pomaga szukac prospektow, audytowac strony, przygotowywac outreach i prowadzic lekki CRM. Uzytkownik odpowiada za kontakt z prospektami.",
        },
        {
          title: "Platnosci",
          body:
            "Platne plany sa obslugiwane przez Stripe. Subskrypcje mozna anulowac albo zmienic z poziomu billing portal.",
        },
      ],
    },
    cookies: {
      title: "Cookie Policy | Flux Leads",
      description: "Jak Flux Leads uzywa cookies i storage w przegladarce.",
      eyebrow: "Legal",
      h1: "Cookie Policy",
      intro:
        "Flux Leads uzywa cookies i podobnego storage do sesji, preferencji jezyka, ochrony auth flow i analityki produktu.",
      sections: [
        {
          title: "Essential cookies",
          body:
            "Essential cookies utrzymuja sesje, stan bezpieczenstwa i preferencje jezyka. Bez nich aplikacja nie dziala poprawnie.",
        },
        {
          title: "Analytics",
          body:
            "Gdy analityka jest wlaczona, pomaga rozumiec aggregate usage i ulepszac produkt.",
        },
      ],
    },
    "acceptable-use": {
      title: "Acceptable Use Policy | Flux Leads",
      description:
        "Zasady odpowiedzialnego lead generation, cold outreach i audytow stron w Flux Leads.",
      eyebrow: "Legal",
      h1: "Acceptable Use Policy",
      intro:
        "Flux Leads jest przeznaczony do relewantnego B2B outreach opartego o publiczny kontekst biznesowy, nie do spamu ani illegal scraping.",
      sections: [
        {
          title: "Dozwolone",
          body:
            "Uzywaj Flux Leads do znajdowania relewantnych firm, weryfikowania informacji, przygotowania wartosciowego outreach i utrzymania source trail.",
        },
        {
          title: "Niedozwolone",
          body:
            "Nie uzywaj Flux Leads do spam campaigns, deceptive outreach, mass scraping, illegal data collection ani ignorowania opt-out.",
        },
      ],
    },
  },
} satisfies Record<
  MarketingLocale,
  Record<(typeof LEGAL_SLUGS)[number], StaticPageCopy>
>;

const seoPages: Partial<Record<MarketingLocale, Record<string, StaticPage>>> = {
  en: {
    "lead-generation-for-web-design-agencies": {
      kind: "seo",
      title: "Lead Generation for Web Design Agencies | Flux Leads",
      description:
        "Find local businesses with weak websites, audit them automatically, and generate personalized outreach for web design services.",
      eyebrow: "For web design agencies",
      h1: "Lead generation for web design agencies using AI website audits",
      intro:
        "Flux Leads gives web design agencies a repeatable way to find businesses that may need a better website and approach them with proof.",
      sections: [
        {
          title: "Find businesses with visible website gaps",
          body:
            "Search by niche and city, then review public business context, website status, and contact signals before deciding who deserves outreach.",
        },
        {
          title: "Turn audit findings into a sales angle",
          body:
            "Use SSL, mobile, SEO, performance, and contact issues to make the first email specific instead of generic.",
        },
      ],
      cta: "Start free",
    },
    "find-web-design-clients": {
      kind: "seo",
      title: "Find Web Design Clients with AI Website Audits | Flux Leads",
      description:
        "Flux Leads helps agencies find web design clients by discovering weak local websites and creating audit-backed cold emails.",
      eyebrow: "Client acquisition",
      h1: "Find web design clients with audit-backed outreach",
      intro:
        "Instead of pitching every local business the same way, Flux Leads helps you identify real website issues and write a relevant message.",
      sections: [
        {
          title: "Start with niche and city",
          body:
            "Look for dentists, restaurants, salons, clinics, contractors, or any local niche where a better website can create value.",
        },
        {
          title: "Prioritize by Opportunity Score",
          body:
            "Focus on businesses with clear technical or SEO gaps, then move qualified prospects through the built-in Kanban pipeline.",
        },
      ],
      cta: "Create free account",
    },
    "local-business-website-audit-tool": {
      kind: "seo",
      title: "Local Business Website Audit Tool | Flux Leads",
      description:
        "Run lightweight website audits for local businesses and use the findings to prepare relevant outreach.",
      eyebrow: "Website audit tool",
      h1: "Local business website audits for outreach",
      intro:
        "Flux Leads checks practical website signals that matter in a first sales conversation: mobile, SSL, titles, H1, performance, and contact visibility.",
      sections: [
        {
          title: "Audit before you pitch",
          body:
            "A short audit helps you avoid vague claims and gives the prospect a concrete reason to reply.",
        },
        {
          title: "Use findings in email drafts",
          body:
            "AI email drafts reference real site issues so your message feels researched and relevant.",
        },
      ],
      cta: "Try website audits",
    },
    "cold-email-for-web-agencies": {
      kind: "seo",
      title: "Cold Email for Web Agencies | Flux Leads",
      description:
        "Generate cold email drafts for web agency outreach using real website audit findings and business context.",
      eyebrow: "Cold email",
      h1: "Cold email for web agencies that starts with evidence",
      intro:
        "Flux Leads helps you move beyond 'Do you need a new website?' by grounding outreach in specific website problems.",
      sections: [
        {
          title: "Personalized by default",
          body:
            "Drafts can reference slow mobile loading, missing H1/title structure, contact gaps, and other practical audit findings.",
        },
        {
          title: "Keep control before sending",
          body:
            "Edit every draft, use your SMTP, and include opt-out language where your outreach process requires it.",
        },
      ],
      cta: "Generate your first draft",
    },
  },
  pl: {
    "pozyskiwanie-klientow-dla-agencji-webowych": {
      kind: "seo",
      title: "Pozyskiwanie klientow dla agencji webowych | Flux Leads",
      description:
        "Znajduj lokalne firmy ze slabymi stronami, audytuj je automatycznie i tworz spersonalizowane wiadomosci sprzedazowe.",
      eyebrow: "Dla agencji webowych",
      h1: "Pozyskiwanie klientow dla agencji webowych przez audyt strony",
      intro:
        "Flux Leads pomaga agencjom webowym znalezc firmy, ktore moga potrzebowac lepszej strony, i napisac do nich z konkretnym powodem.",
      sections: [
        {
          title: "Znajdz lokalne firmy z problemami na stronie",
          body:
            "Wpisz nisze i miasto, sprawdz publiczny kontekst firmy, status strony i dostepne kontakty.",
        },
        {
          title: "Zamien audyt w wiadomosc",
          body:
            "Wykorzystaj problemy SSL, mobile, SEO, performance i kontaktu jako konkretny kat pierwszego emaila.",
        },
      ],
      cta: "Zacznij za darmo",
    },
    "jak-znalezc-klientow-na-strony-internetowe": {
      kind: "seo",
      title: "Jak znalezc klientow na strony internetowe | Flux Leads",
      description:
        "Flux Leads pomaga freelancerom i agencjom znalezc firmy, ktore maja slabe strony i potrzebuja lepszego website.",
      eyebrow: "Web design clients",
      h1: "Jak znalezc klientow na strony internetowe bez losowego spamu",
      intro:
        "Zamiast pisac do przypadkowych firm, zacznij od tych, gdzie widac realny problem strony i mozna zaproponowac sensowna poprawe.",
      sections: [
        {
          title: "Wybierz nisze i miasto",
          body:
            "Dentysci, restauracje, salony beauty, kliniki czy lokalne uslugi - zacznij od rynku, ktory rozumiesz.",
        },
        {
          title: "Kontaktuj tylko relewantne firmy",
          body:
            "Opportunity Score, audyt strony i draft AI pomagaja wybrac lepszych prospektow oraz przygotowac bardziej konkretna wiadomosc.",
        },
      ],
      cta: "Zobacz Flux Leads",
    },
  },
} satisfies Partial<Record<MarketingLocale, Record<string, StaticPage>>>;

export function getStaticMarketingPage(
  locale: string,
  slug: string,
): StaticPage | null {
  if (!isMarketingLocale(locale)) return null;
  const legal = legalCommon[locale][slug as (typeof LEGAL_SLUGS)[number]];
  if (legal) return { ...legal, kind: "legal" };
  return seoPages[locale]?.[slug] ?? null;
}

export function isMarketingLocale(locale: string): locale is MarketingLocale {
  return routing.locales.includes(locale as MarketingLocale);
}

export function getStaticMarketingParams() {
  const params: { locale: MarketingLocale; slug: string }[] = [];

  for (const locale of routing.locales) {
    for (const slug of LEGAL_SLUGS) {
      params.push({ locale, slug });
    }
  }

  for (const locale of routing.locales) {
    for (const slug of Object.keys(seoPages[locale] ?? {})) {
      params.push({ locale, slug });
    }
  }

  return params;
}
