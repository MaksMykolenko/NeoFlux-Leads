type FluxLeadsJsonLdProps = {
  locale: "uk" | "en";
  canonicalUrl: string;
};

export default function FluxLeadsJsonLd({
  locale,
  canonicalUrl,
}: FluxLeadsJsonLdProps) {
  const isUk = locale === "uk";

  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${canonicalUrl}#software`,
    name: "Flux Leads",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Lead Generation Software",
    operatingSystem: "Web",
    url: canonicalUrl,
    description: isUk
      ? "B2B Lead Engine і мікро-CRM для веб-студій: AI-пошук локальних бізнесів, автоматичний аудит сайтів, Opportunity Score та персоналізований cold email."
      : "B2B lead engine and micro-CRM for web agencies: AI local business search, automated website audits, opportunity scoring, and personalized cold email.",
    brand: { "@type": "Brand", name: "NeoFlux Software" },
    publisher: {
      "@type": "Organization",
      name: "NeoFlux Software",
      url: "https://neoflux.dev",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "0",
        priceCurrency: "USD",
        description: isUk ? "50 лідів на місяць" : "50 leads per month",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "20",
        priceCurrency: "USD",
        description: isUk
          ? "1000 лідів, аудит сайтів, AI-листи"
          : "1000 leads, website audits, AI emails",
      },
      {
        "@type": "Offer",
        name: "Agency",
        price: "60",
        priceCurrency: "USD",
        description: isUk ? "Безліміт лідів, CSV export" : "Unlimited leads, CSV export",
      },
    ],
    featureList: isUk
      ? [
          "AI-пошук лідів (Google Gemini + Google Search grounding)",
          "Автоматичний аудит сайтів (Playwright)",
          "Opportunity Score 0–100",
          "AI-генерація персоналізованих cold email",
          "Kanban-воронка продажів",
        ]
      : [
          "AI lead search (Google Gemini + Google Search grounding)",
          "Automated website audits (Playwright)",
          "Opportunity Score 0–100",
          "AI personalized cold email generation",
          "Sales Kanban pipeline",
        ],
    audience: {
      "@type": "BusinessAudience",
      audienceType: isUk
        ? "Веб-студії, digital-агенції, B2B outbound-фрілансери"
        : "Web agencies, digital studios, B2B outbound freelancers",
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${canonicalUrl}#faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: isUk
          ? "Чим Flux Leads відрізняється від звичайної CRM?"
          : "How is Flux Leads different from a typical CRM?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isUk
            ? "Flux Leads — Lead Engine: знаходить лідів, аудитує сайти, рахує пріоритет і допомагає надіслати cold email. CRM — легка воронка зі статусами та історією листів."
            : "Flux Leads is a lead engine: finds prospects, audits sites, scores priority, and helps send cold email. CRM is a lightweight pipeline with statuses and message history.",
        },
      },
      {
        "@type": "Question",
        name: isUk
          ? "Як працює AI-пошук локальних бізнесів?"
          : "How does AI local business search work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isUk
            ? "Ви вказуєте нішу та місто. Gemini з Google Search grounding збирає публічні згадки компаній. Результати варто верифікувати перед аутрічем."
            : "You enter a niche and city. Gemini with Google Search grounding gathers public business mentions. Verify results before outreach.",
        },
      },
      {
        "@type": "Question",
        name: isUk ? "Що перевіряє аудит сайту?" : "What does the website audit check?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isUk
            ? "Playwright перевіряє SSL, mobile viewport, title/h1, швидкість завантаження та може витягнути email з HTML на Pro+."
            : "Playwright checks SSL, mobile viewport, title/h1, load time, and can extract email from HTML on Pro+.",
        },
      },
      {
        "@type": "Question",
        name: isUk ? "Що таке Opportunity Score?" : "What is Opportunity Score?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isUk
            ? "Оцінка 0–100, що поєднує технічні проблеми сайту та сигнали слабкої веб-присутності для пріоритизації аутрічу."
            : "A 0–100 score combining technical site issues and weak web presence signals to prioritize outreach.",
        },
      },
    ],
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [softwareApplication, faqPage],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
