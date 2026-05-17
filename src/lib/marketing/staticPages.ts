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
  "lead-generation-for-web-agencies",
  "find-web-design-clients",
  "local-business-website-audit-tool",
  "cold-email-for-web-agencies",
  "pozyskiwanie-klientow-dla-agencji-webowych",
  "jak-znalezc-klientow-na-strony-internetowe",
  "yak-znajty-klientiv-na-sajty",
  "lidogeneratsiya-dlya-veb-studiy",
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
      title: "Polityka prywatności | Flux Leads",
      description:
        "Jak Flux Leads obsługuje dane konta, leadów, billing i usage.",
      eyebrow: "Legal",
      h1: "Polityka prywatności",
      intro:
        "Flux Leads jest zbudowany do B2B lead discovery i outreach. Ta strona opisuje główne kategorie danych przetwarzanych w produkcie.",
      sections: [
        {
          title: "Jakie dane przetwarzamy",
          body:
            "Przetwarzamy dane konta, status subskrypcji, usage produktu, rekordy leadów, wyniki audytów stron, drafty AI i logi operacyjne potrzebne do działania usługi.",
        },
        {
          title: "Dane leadów",
          body:
            "Użytkownik odpowiada za to, aby dane kontaktowe firm były legalne, relewantne, dokładne i usuwane wtedy, gdy nie powinny być dalej używane.",
        },
      ],
    },
    terms: {
      title: "Regulamin | Flux Leads",
      description: "Warunki korzystania z Flux Leads.",
      eyebrow: "Legal",
      h1: "Regulamin",
      intro:
        "To bazowe zasady korzystania z Flux Leads. Przed traktowaniem ich jako finalnego tekstu prawnego warto skonsultować je z prawnikiem.",
      sections: [
        {
          title: "Korzystanie z produktu",
          body:
            "Flux Leads pomaga szukać prospektów, audytować strony, przygotowywać outreach i prowadzić lekki CRM. Użytkownik odpowiada za kontakt z prospektami.",
        },
        {
          title: "Płatności",
          body:
            "Płatne plany są obsługiwane przez Stripe. Subskrypcje można anulować albo zmienić z poziomu billing portal.",
        },
      ],
    },
    cookies: {
      title: "Polityka cookies | Flux Leads",
      description: "Jak Flux Leads używa cookies i storage w przeglądarce.",
      eyebrow: "Legal",
      h1: "Polityka cookies",
      intro:
        "Flux Leads używa cookies i podobnego storage do sesji, preferencji języka, ochrony auth flow i analityki produktu.",
      sections: [
        {
          title: "Essential cookies",
          body:
            "Essential cookies utrzymują sesję, stan bezpieczeństwa i preferencje języka. Bez nich aplikacja nie działa poprawnie.",
        },
        {
          title: "Analityka",
          body:
            "Gdy analityka jest włączona, pomaga rozumieć aggregate usage i ulepszać produkt.",
        },
      ],
    },
    "acceptable-use": {
      title: "Acceptable Use Policy | Flux Leads",
      description:
        "Zasady odpowiedzialnego lead generation, cold outreach i audytów stron w Flux Leads.",
      eyebrow: "Legal",
      h1: "Acceptable Use Policy",
      intro:
        "Flux Leads jest przeznaczony do relewantnego B2B outreach opartego o publiczny kontekst biznesowy, nie do spamu ani illegal scraping.",
      sections: [
        {
          title: "Dozwolone",
          body:
            "Używaj Flux Leads do znajdowania relewantnych firm, weryfikowania informacji, przygotowania wartościowego outreach i utrzymania source trail.",
        },
        {
          title: "Niedozwolone",
          body:
            "Nie używaj Flux Leads do spam campaigns, deceptive outreach, mass scraping, illegal data collection ani ignorowania opt-out.",
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
    "lead-generation-for-web-agencies": {
      kind: "seo",
      title: "Lead Generation for Web Agencies | Flux Leads",
      description:
        "Flux Leads helps web agencies discover local prospects, audit websites, prioritize opportunities, and generate personalized cold emails.",
      eyebrow: "For web agencies",
      h1: "Lead generation for web agencies using AI website audits",
      intro:
        "Most web agencies lose more time on prospecting than on actual delivery. Flux Leads turns that around: AI search finds local businesses in your niche, a Playwright audit captures concrete website problems, and an AI draft writes a first email that references those problems specifically. The result is a repeatable lead-to-pitch pipeline that does not depend on cold-call energy or spray-and-pray templates.",
      sections: [
        {
          title: "Why prospecting is broken at most agencies",
          body:
            "Cold lists from data brokers are noisy and outdated. LinkedIn outreach only works at scale with strong personalization. Word of mouth is slow. Manual Google Maps research is mind-numbing and ends with a generic 'I make websites' email. Flux Leads attacks all three problems by pairing live AI search with a website audit, so you talk to real businesses with real, visible problems on their site.",
        },
        {
          title: "How audit-led outreach works",
          body:
            "You enter a niche (dentists, restaurants, salons, contractors) and a city. AI search returns a list of local businesses with website, phone, and address signals. Each business gets a website audit: SSL, mobile viewport, H1 / title structure, page speed, and email enrichment. An Opportunity Score from 0 to 100 ranks who is worth contacting first. Finally, AI generates a personalized email that opens with a specific finding from that prospect's website — not a generic pitch.",
        },
        {
          title: "What website issues Flux Leads detects",
          body:
            "Missing SSL, no mobile viewport, broken title or H1, slow page load (over 3 seconds), missing meta description, hidden or absent contact email, missing Open Graph tags, and absence of a clear call to action. Each issue becomes a concrete sales angle: 'your site loads 6.4 seconds on mobile, which is likely costing you appointments' is dramatically more convincing than 'do you need a new website?'.",
        },
        {
          title: "Manual outreach vs Flux Leads",
          body:
            "Manual: open Google Maps, copy names to a spreadsheet, visit each site, eyeball problems, write an email from scratch — roughly 30-45 minutes per quality prospect. Flux Leads: enter niche + city, review the ranked list, accept or edit the AI draft, click Send. About 2-3 minutes per qualified prospect, with better personalization because the audit data is structured and consistent.",
        },
        {
          title: "Who should use Flux Leads",
          body:
            "Solo web developers building a freelance pipeline, web design studios with 1-15 people, SEO specialists who offer audits as a lead magnet, and small marketing agencies running B2B outreach for local clients. Anyone whose offer is 'I can make your website work harder for your business' will find the audit-led angle is dramatically easier to sell than abstract design value.",
        },
        {
          title: "Cold email: before and after",
          body:
            "Before: 'Hi, I'm a web developer. Do you need a new website? Let me know if you'd like a quote.' After: 'Hi, I checked your site and noticed three specific issues — no SSL, slow mobile load (6.4s), and no email in the footer. These are likely costing you new patient inquiries, especially from mobile. I can send a 1-page audit with concrete fixes if this is worth your time.' The second email looks researched, respectful, and provides a clear reason to reply.",
        },
        {
          title: "FAQ",
          body:
            "How many leads can I get? Starter is 50/month free. Pro is 1000/month at $20. Agency is 10,000/month at $60. Does Flux Leads send emails for me? Yes, through your SMTP — your sender reputation stays yours. Where does the data come from? AI search over public web sources, cached at search time. Always re-verify before sending. Can I use it outside the US? Yes, the AI works in any region — set the city/country in the region field.",
        },
      ],
      cta: "Start with 50 free leads",
    },
    "find-web-design-clients": {
      kind: "seo",
      title: "Find Web Design Clients with AI Website Audits | Flux Leads",
      description:
        "Learn how to find local businesses with weak websites, audit them automatically, and turn website issues into personalized outreach.",
      eyebrow: "Client acquisition",
      h1: "Find web design clients with audit-backed outreach",
      intro:
        "The hardest part of running a web design practice is not the design — it is finding businesses who recognize they need design help and have budget. Flux Leads narrows the funnel by identifying local businesses with visibly weak websites and giving you a concrete starting point for outreach.",
      sections: [
        {
          title: "Pick a niche and a city",
          body:
            "Start with niches where a website is core to the business but design is often neglected: dentists, plastic surgeons, real estate agents, restaurants, salons, fitness studios, law offices, construction contractors. Combine with a specific city to keep your offer locally relevant.",
        },
        {
          title: "Audit before you pitch",
          body:
            "Flux Leads runs a Playwright-based audit on each prospect: SSL, mobile viewport, semantic H1/title, page load, and contact visibility. These are not vanity metrics — they map to real conversion losses that you can quote in your email.",
        },
        {
          title: "Prioritize by Opportunity Score",
          body:
            "A 0-100 score weighs technical problems, missing SEO basics, mobile usability gaps, and contact availability. High score = obvious gaps + reachable contact + likely good fit. Start outreach from the top of the list.",
        },
        {
          title: "Personalize cold emails",
          body:
            "AI generates a first draft that opens with the specific audit finding for that prospect. You edit, attach a 1-page proposal if you want, and send through your SMTP. The CRM stores subject, body, and delivery status so you can follow up with context.",
        },
        {
          title: "Move qualified prospects through Kanban",
          body:
            "New → Contacted → Replied → Interested → Won. The pipeline is intentionally lightweight so you do not spend more time updating CRM than doing actual sales.",
        },
        {
          title: "Stay on the right side of email compliance",
          body:
            "Use Flux Leads for relevant B2B contact — businesses that publicly publish their email and would plausibly want your offer. Always include opt-out language, respect unsubscribes immediately, and follow GDPR / CAN-SPAM / local rules.",
        },
      ],
      cta: "Create free account",
    },
    "local-business-website-audit-tool": {
      kind: "seo",
      title: "Local Business Website Audit Tool for Outreach | Flux Leads",
      description:
        "Audit local business websites for SEO, mobile, speed, and conversion issues, then use those insights to create better outreach.",
      eyebrow: "Website audit tool",
      h1: "Local business website audit tool that powers outreach",
      intro:
        "Flux Leads runs lightweight automated audits on local business websites and surfaces the issues that matter most in a first sales conversation: SSL, mobile, performance, basic SEO, and contact visibility. Every finding becomes a concrete sales angle in the AI-generated email draft.",
      sections: [
        {
          title: "What the audit checks",
          body:
            "SSL / HTTPS — basic trust signal. Mobile viewport — does the site adapt on phones (where most local searches happen). Title and H1 — clear page identity and SEO basics. Page load time — anything over 3s is a measurable conversion loss. Open Graph and Twitter cards — affects sharing on social. Contact visibility — is there an email or phone in the footer for inbound inquiries.",
        },
        {
          title: "Why audit-led outreach beats generic outreach",
          body:
            "A generic cold email starts with 'Hi, I make websites' and expects the prospect to imagine why they should care. An audit-led email opens with 'your site loads 6.4 seconds on mobile' or 'your site has no SSL certificate' — concrete observations the prospect can verify in 5 seconds. That switch alone typically improves reply rates by 2-4x.",
        },
        {
          title: "Audits are stored, not one-off",
          body:
            "Every audit attaches to a lead record in the CRM. You can re-audit if the prospect's site changes, reference specific findings in follow-up emails, and see audit history per prospect. No need to re-run the same checks every time you want to write a follow-up.",
        },
        {
          title: "Use cases beyond first outreach",
          body:
            "Audit reports also work as a lead magnet on your own site ('free 1-minute website audit'), as a deliverable in a paid mini-engagement ('I'll audit your site for $50 and send a fix plan'), and as evidence in upsell conversations with existing clients.",
        },
        {
          title: "Limitations and honest framing",
          body:
            "The audit is lightweight by design — it captures signals that matter in a first sales conversation, not a full enterprise SEO / accessibility / performance report. For deeper analysis you would still use Lighthouse, Screaming Frog, or specialized tools. Flux Leads' audit is calibrated to give you talking points, not a 47-page deliverable.",
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
        "Flux Leads helps you move beyond 'Do you need a new website?' by grounding outreach in specific website problems. Drafts are generated per prospect using audit data, public business context, and your offer description.",
      sections: [
        {
          title: "Why most agency cold emails fail",
          body:
            "They are written from a template, sound like spam, and ask for a meeting before establishing any reason for the prospect to care. They use generic claims ('we boost conversions', 'modern design') instead of pointing at concrete things the prospect can verify on their own site.",
        },
        {
          title: "Personalized by default",
          body:
            "Drafts can reference slow mobile loading, missing H1/title structure, contact gaps, and other audit findings — automatically. You can edit any draft before sending. The AI is tuned for B2B sales, not generic marketing fluff.",
        },
        {
          title: "Keep control before sending",
          body:
            "Every draft is editable. You use your own SMTP — Gmail App Password, Hostinger, SendGrid, Mailgun, AWS SES — so the sender reputation is yours. Include opt-out language where your jurisdiction requires it. We do not send anything automatically without your action.",
        },
        {
          title: "Output language matches your market",
          body:
            "If you sell in Poland, drafts come out in Polish. Ukraine — Ukrainian. English speaking markets — English. Set the output language per Autopilot config or per manual search.",
        },
      ],
      cta: "Generate your first draft",
    },
  },
  pl: {
    "pozyskiwanie-klientow-dla-agencji-webowych": {
      kind: "seo",
      title: "Pozyskiwanie klientów dla agencji webowych | Flux Leads",
      description:
        "Flux Leads pomaga agencjom webowym znajdować leady, audytować strony i tworzyć spersonalizowane wiadomości sprzedażowe.",
      eyebrow: "Dla agencji webowych",
      h1: "Pozyskiwanie klientów dla agencji webowych przez audyt strony",
      intro:
        "Flux Leads pomaga agencjom webowym znaleźć firmy, które mogą potrzebować lepszej strony, i napisać do nich z konkretnym powodem. Zamiast generycznego „cześć, robię strony”, każdy email zaczyna się od realnych problemów strony klienta.",
      sections: [
        {
          title: "Znajdź lokalne firmy z problemami na stronie",
          body:
            "Wpisujesz niszę (dentyści, restauracje, salony, kliniki, kontrahenci) i miasto. AI search zwraca lokalne firmy z publicznych źródeł, wraz ze stroną, telefonem i adresem.",
        },
        {
          title: "Audyt zamiast wróżenia",
          body:
            "Każda firma dostaje audyt: SSL, mobile viewport, H1/title, czas ładowania, Open Graph, dostępność email w stopce. Audyt zapisuje fakty — nie domysły — które potem są podstawą emaila.",
        },
        {
          title: "Opportunity Score pokazuje, do kogo pisać najpierw",
          body:
            "Ocena 0-100 łączy problemy techniczne strony, brakujące podstawy SEO, mobile usability i dostępność kontaktu. Wyższy score = bardziej oczywista luka = łatwiejsza rozmowa sprzedażowa.",
        },
        {
          title: "Email AI oparty o fakty",
          body:
            "AI generuje pierwszy draft emaila, który zaczyna się od konkretnego znaleziska — „Państwa strona ładuje się 6.4 sekundy na mobile” — zamiast generycznej oferty. Możesz edytować draft przed wysłaniem.",
        },
        {
          title: "Kanban CRM bez zbędnego enterprise'u",
          body:
            "New → Contacted → Replied → Interested → Won. Pipeline jest celowo lekki, żebyś nie spędzał więcej czasu w CRM niż na rozmowach.",
        },
        {
          title: "Dla freelancerów i małych zespołów",
          body:
            "Flux Leads sprawdza się szczególnie dla freelancerów i agencji 1-15 osób, gdzie nie ma dedykowanego sales teamu i każdy projekt zaczyna się od własnoręcznego prospecting.",
        },
        {
          title: "FAQ",
          body:
            "Ile leadów dostanę? Starter: 50/mies. za darmo. Pro: 1000/mies. za $20. Agency: 10 000/mies. za $60. Czy Flux Leads wysyła emaile za mnie? Tak, przez Twój SMTP — reputacja zostaje Twoja. Czy mogę używać poza Polską? Tak, AI pracuje w każdym regionie, wystarczy wpisać kraj/miasto w polu region.",
        },
      ],
      cta: "Zacznij od 50 darmowych leadów",
    },
    "jak-znalezc-klientow-na-strony-internetowe": {
      kind: "seo",
      title: "Jak znaleźć klientów na strony internetowe | Flux Leads",
      description:
        "Dowiedz się, jak znajdować lokalne firmy ze słabymi stronami, wykonywać audyty i zamieniać problemy strony w skuteczny outreach.",
      eyebrow: "Web design clients",
      h1: "Jak znaleźć klientów na strony internetowe bez losowego spamu",
      intro:
        "Zamiast pisać do przypadkowych firm, zacznij od tych, gdzie widać realny problem strony i można zaproponować sensowną poprawę. Ten artykuł pokazuje, jak Flux Leads automatyzuje cały proces — od znajdowania prospektów po wysłanie pierwszego, spersonalizowanego emaila.",
      sections: [
        {
          title: "Wybierz niszę i miasto",
          body:
            "Dentyści, restauracje, salony beauty, kliniki czy lokalne usługi — zacznij od rynku, który rozumiesz. Lokalność jest kluczowa, bo Twoja oferta jest najmocniejsza tam, gdzie strona klienta bezpośrednio wpływa na lokalne zapytania.",
        },
        {
          title: "Pozwól AI znaleźć firmy z publicznych źródeł",
          body:
            "Flux Leads korzysta z Gemini z Google Search grounding — szuka aktualnych firm w sieci, nie odpytuje przestarzałej bazy. Otrzymujesz listę z nazwą, stroną, telefonem i podstawowymi sygnałami biznesowymi.",
        },
        {
          title: "Audyt zamienia podejrzenie w dowód",
          body:
            "Czujesz, że „ta strona wygląda słabo”, to jedno. „Strona ładuje się 6.4 sekundy na mobile i nie ma SSL” — to konkret. Audyt Flux Leads daje Ci ten konkret automatycznie, dla każdego prospekta.",
        },
        {
          title: "Kontaktuj tylko relewantne firmy",
          body:
            "Opportunity Score, audyt strony i draft AI pomagają wybrać lepszych prospektów oraz przygotować bardziej konkretną wiadomość. Wysyłanie do losowych firm z bazy nie działa — kontaktowanie firm z widocznym problemem strony działa.",
        },
        {
          title: "Email, który nie wygląda jak szablon",
          body:
            "AI pisze pierwszy draft odwołujący się do konkretnego problemu danej strony. „Sprawdziłem Państwa stronę i zauważyłem trzy konkretne problemy…” brzmi zupełnie inaczej niż „Czy potrzebują Państwo nowej strony?”. Reply rate jest zwykle 3-4 razy wyższy.",
        },
        {
          title: "Compliance i opt-out",
          body:
            "Pracuj tylko z firmami, które publicznie publikują email, dodawaj zawsze opt-out w stopce, respektuj rezygnacje natychmiast. Flux Leads pomaga targetować, ale za compliance odpowiada użytkownik.",
        },
      ],
      cta: "Zobacz Flux Leads",
    },
  },
  uk: {
    "yak-znajty-klientiv-na-sajty": {
      kind: "seo",
      title: "Як знайти клієнтів на сайти | Flux Leads",
      description:
        "Дізнайтесь, як знаходити локальні бізнеси зі слабкими сайтами, робити аудит і перетворювати проблеми сайту в персоналізований outreach.",
      eyebrow: "Web design клієнти",
      h1: "Як знайти клієнтів на сайти без масового спаму",
      intro:
        "Замість того, щоб писати випадковим компаніям, починайте з тих, де видно реальну проблему сайту і можна запропонувати конкретне рішення. Flux Leads автоматизує весь цикл — від пошуку лідів до персоналізованого першого листа.",
      sections: [
        {
          title: "Виберіть нішу і місто",
          body:
            "Стоматології, ресторани, салони, клініки, локальні послуги — починайте з ринку, який ви розумієте. Локальність критична: ваша оферта найсильніша там, де сайт клієнта прямо впливає на локальні запити.",
        },
        {
          title: "AI знаходить компанії з публічних джерел",
          body:
            "Flux Leads використовує Gemini з Google Search grounding — шукає актуальні бізнеси у живому інтернеті, а не в застарілій базі. Отримуєте список з назвою, сайтом, телефоном і базовими бізнес-сигналами.",
        },
        {
          title: "Аудит перетворює відчуття у доказ",
          body:
            "Відчувати, що „сайт виглядає слабо” — це одне. „Сайт вантажиться 6.4 сек на мобільному і немає SSL” — це конкретика. Аудит Flux Leads дає вам цей конкрет автоматично для кожного ліда.",
        },
        {
          title: "Контактуйте лише з релевантними бізнесами",
          body:
            "Opportunity Score, аудит і AI-драфт допомагають вибрати кращих prospects і написати конкретніше повідомлення. Розсилка по випадковій базі не працює — контакт з компаніями, де є очевидна проблема, працює.",
        },
        {
          title: "Лист, який не схожий на шаблон",
          body:
            "AI генерує draft першого листа з прив'язкою до конкретної проблеми саме цього сайту. „Перевірив ваш сайт і помітив три конкретні проблеми…” звучить зовсім інакше, ніж „Вам потрібен новий сайт?”. Reply rate зазвичай у 3-4 рази вищий.",
        },
        {
          title: "Compliance і opt-out",
          body:
            "Працюйте тільки з компаніями, які публічно публікують email, завжди додавайте opt-out, поважайте відмови миттєво. Flux Leads допомагає таргетувати, але за compliance відповідає користувач.",
        },
      ],
      cta: "Спробувати Flux Leads",
    },
    "lidogeneratsiya-dlya-veb-studiy": {
      kind: "seo",
      title: "Лідогенерація для веб-студій | Flux Leads",
      description:
        "Flux Leads допомагає веб-студіям знаходити лідів, аудитувати сайти та генерувати персоналізовані cold email.",
      eyebrow: "Для веб-студій",
      h1: "Лідогенерація для веб-студій через AI-аудит сайтів",
      intro:
        "Більшість веб-студій витрачає більше часу на пошук клієнтів, ніж на власне роботу. Flux Leads перевертає це: AI шукає локальні бізнеси у вашій ніші, Playwright-аудит фіксує конкретні проблеми сайту, а AI пише перший лист, що посилається саме на ці проблеми.",
      sections: [
        {
          title: "Чому пошук клієнтів зламаний",
          body:
            "Холодні бази від брокерів даних шумні і застарілі. LinkedIn outreach працює лише на масштабі з сильною персоналізацією. Сарафанне радіо повільне. Ручний research у Google Maps виснажує і закінчується шаблонним листом „я роблю сайти”. Flux Leads атакує всі три проблеми, поєднуючи живий AI-пошук з аудитом сайту.",
        },
        {
          title: "Як працює аудит-driven outreach",
          body:
            "Ви вводите нішу (стоматології, ресторани, салони, підрядники) і місто. AI повертає список локальних бізнесів. Кожен отримує аудит: SSL, mobile viewport, H1/title, швидкість завантаження, email-enrichment. Opportunity Score 0-100 пріоритезує кому писати першим. AI генерує лист, що відкривається конкретним знахідком з аудиту — не загальною пропозицією.",
        },
        {
          title: "Які проблеми сайту виявляє Flux Leads",
          body:
            "Відсутність SSL, немає mobile viewport, поламаний title або H1, повільне завантаження (більше 3 сек), відсутній або слабкий meta description, прихований або відсутній email, немає Open Graph тегів, відсутність чіткого call-to-action. Кожна проблема — конкретний sales angle.",
        },
        {
          title: "Ручний outreach vs Flux Leads",
          body:
            "Ручний: відкрити Maps, скопіювати назви, відвідати кожен сайт, помітити проблеми, написати лист — приблизно 30-45 хвилин на кваліфікованого ліда. Flux Leads: ввести нішу + місто, переглянути ранкований список, відредагувати AI-драфт, натиснути Send — 2-3 хвилини на ліда.",
        },
        {
          title: "Для кого Flux Leads",
          body:
            "Соло web-developers, веб-студії 1-15 людей, SEO-спеціалісти що пропонують аудити як lead magnet, маленькі маркетинг-агентства роблять B2B outreach. Якщо ваша оферта „я можу зробити, щоб ваш сайт працював краще для вашого бізнесу” — аудит-driven підхід продається в рази легше за абстрактну дизайн-цінність.",
        },
        {
          title: "Cold email: до і після",
          body:
            "До: „Привіт, я веб-розробник. Вам потрібен новий сайт? Напишіть, якщо цікаво.” Після: „Перевірив ваш сайт і помітив три конкретні проблеми — немає SSL, повільне завантаження на мобільному (6.4 сек), немає email у футері. Це ймовірно коштує вам нових запитів від пацієнтів, особливо з мобільного. Можу надіслати 1-сторінковий аудит з конкретними правками, якщо це актуально.” Другий лист виглядає дослідженим і дає чітку причину відповісти.",
        },
        {
          title: "FAQ",
          body:
            "Скільки лідів отримаю? Starter: 50/міс безкоштовно. Pro: 1000/міс за $20. Agency: 10 000/міс за $60. Чи відправляє Flux Leads листи за мене? Так, через ваш SMTP — sender reputation залишається вашою. Звідки дані? AI-пошук по публічних веб-джерелах, кешований у момент пошуку. Завжди перевіряйте перед відправкою. Чи працює поза Україною? Так, AI працює у будь-якому регіоні — задайте місто/країну у полі region.",
        },
      ],
      cta: "Почати з 50 безкоштовних лідів",
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
