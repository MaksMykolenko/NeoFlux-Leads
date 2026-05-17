import type { AbstractIntlMessages } from "next-intl";
import enMessages from "./en";

const messages = {
  ...enMessages,
  Meta: {
    title: "Flux Leads",
    description: "AI Lead Engine dla B2B outreach",
  },
  Marketing: {
    ...enMessages.Marketing,
    navFeatures: "Funkcje",
    navPricing: "Cennik",
    navWebAgencies: "Dla agencji webowych",
    ctaLogin: "Zaloguj",
    ctaDashboard: "Panel",
    footerTagline:
      "Lead engine i mikro-CRM dla cold outreach. Od NeoFlux Software.",
  },
  MarketingHome: {
    ...enMessages.MarketingHome,
    heroBadge: "Flux Leads · Outreach przez audyt",
    heroH1: "Znajduj firmy ze slabymi stronami. Zamieniaj audyty w klientow.",
    heroSub:
      "Flux Leads pomaga agencjom webowym znajdowac lokalne firmy, analizowac ich strony i tworzyc spersonalizowane wiadomosci sprzedazowe na podstawie realnych problemow.",
    heroCta: "Zacznij za darmo",
    heroSecondary: "Funkcje",
    featuresEyebrow: "Funkcje",
    heroImageAlt: "Interfejs produktu Flux Leads",
    featuresH2: "Jeden proces od prospekta do pitchu",
    featureSearchH3: "AI lead search",
    featureSearchP:
      "Nisza + miasto -> Gemini z Google Search grounding znajduje firmy z publicznych zrodel. To punkt startowy do outboundu, nie certyfikowana baza.",
    featureAuditH3: "Audyt strony w Playwright",
    featureAuditP:
      "SSL, mobile viewport, title/h1, czas ladowania i email enrichment - fakty do pitchu, ze slaba strona kosztuje leady.",
    featureScoreH3: "Opportunity Score",
    featureScoreP:
      "Ocena 0-100 laczy problemy techniczne i slaba obecnosc online, zeby zaczynac outreach od najlepszych okazji.",
    featureCrmH3: "Kanban CRM",
    featureCrmP:
      "Statusy od New do Won, historia wiadomosci i drafty AI bez nadmiaru enterprise CRM.",
    exampleEyebrow: "Przykladowy audyt",
    exampleH2: "Pokaz konkretny powod do pierwszej rozmowy",
    exampleIntro:
      "Przykladowy lokalny lead pokazuje problemy strony, score i kat wiadomosci zanim poswiecisz czas na outreach.",
    exampleBusinessLabel: "Firma",
    exampleBusiness: "Lokalny dentysta w Warszawie",
    exampleIssuesLabel: "Wykryte problemy strony",
    exampleIssue1: "Brak jasnego H1",
    exampleIssue2: "Wolne ladowanie na mobile",
    exampleIssue3: "Brak kontaktowego emaila",
    exampleIssue4: "Slaby SEO title",
    exampleScoreLabel: "Opportunity Score",
    exampleEmailLabel: "Wygenerowany draft emaila",
    exampleEmail:
      "Dzien dobry, zauwazylem kilka problemow na Panstwa stronie, ktore moga obnizac zaufanie i liczbe zapytan, szczegolnie na mobile. Przygotowalem krotki audyt i moge pokazac, co warto poprawic.",
    workflowEyebrow: "Proces w produkcie",
    workflowH2: "Cztery ekrany, jeden powtarzalny proces sprzedazy",
    workflowLeadSearchTitle: "Lead Search",
    workflowLeadSearchBody:
      "Wpisz nisze + miasto i otrzymaj lokalne firmy z publicznych zrodel.",
    workflowAuditTitle: "Website Audit",
    workflowAuditBody:
      "Sprawdz SSL, mobile, SEO i performance zanim zaczniesz outreach.",
    workflowEmailTitle: "AI Email Draft",
    workflowEmailBody:
      "Generuj spersonalizowane cold emaile na podstawie realnych problemow strony.",
    workflowCrmTitle: "Kanban CRM",
    workflowCrmBody: "Prowadz leady od New do Won bez arkuszy.",
    scoreEyebrow: "Opportunity Score",
    scoreH2: "Dlaczego jeden lead ma 82, a inny 35",
    scoreIntro:
      "Score priorytetyzuje firmy, gdzie luka na stronie jest wystarczajaco widoczna dla trafnego pitchu.",
    scoreItem1: "Problemy techniczne strony",
    scoreItem2: "Brakujace lub slabe podstawy SEO",
    scoreItem3: "Mobile usability",
    scoreItem4: "Dostepnosc kontaktu",
    scoreItem5: "Dopasowanie firmy",
    scoreItem6: "Potencjal outreach",
    audienceEyebrow: "Dla kogo?",
    audienceH2: "Stworzone do precyzyjnego B2B outreach",
    builtForTitle: "Dla",
    builtFor1: "Freelance web developerow",
    builtFor2: "Malych agencji webowych",
    builtFor3: "Specjalistow SEO",
    builtFor4: "Tworcow landing page",
    builtFor5: "Lokalnych agencji marketingowych",
    notForTitle: "Nie dla",
    notFor1: "Kampanii spamowych",
    notFor2: "Masowego scrapingu",
    notFor3: "Kupowania losowych list email",
    notFor4: "Zastapienia enterprise CRM",
    emailCompareEyebrow: "Before / after",
    emailCompareH2: "Zamien generic outreach na wiadomosc oparta o fakty",
    genericEmailTitle: "Generic cold email",
    genericEmailBody: "Dzien dobry, tworze strony. Czy potrzebuja Panstwo nowej strony?",
    fluxEmailTitle: "Flux Leads email",
    fluxEmailBody:
      "Dzien dobry, sprawdzilem Panstwa strone i widze, ze laduje sie wolno na mobile oraz nie ma jasnej struktury H1/title. To moze obnizac zaufanie i utrudniac kontakt klientom. Moge wyslac krotki plan poprawek, jesli to aktualne.",
    trustEyebrow: "Zaufanie",
    trustH2: "Budowane przez NeoFlux Software",
    trustP:
      "Flux Leads tworzy NeoFlux Software - maly ukrainski zespol inzynierski budujacy praktyczne narzedzia dla firm digital.",
    trustItem1: "Bez karty na start",
    trustItem2: "Leady z publicznych zrodel",
    trustItem3: "Platnosci Stripe",
    trustItem4: "Lekki CRM w zestawie",
    trustItem5: "Mozesz anulowac w kazdej chwili",
    faqH2: "FAQ",
    faq1Q: "Czym Flux Leads rozni sie od CRM?",
    faq1A:
      "To lead engine: wyszukiwanie, audyt, priorytety i wiadomosci. CRM to lekki pipeline na gorze.",
    faq2Q: "Czy potrzebuje umiejetnosci technicznych?",
    faq2A:
      "Nie. Wpisz nisze i miasto, uruchom audyt, edytuj email AI i wyslij.",
    faq3Q: "Ile kosztuje start?",
    faq3A: "Starter kosztuje $0 i ma 50 leadow/mies. Pro to $20, Agency to $60.",
    faq4Q: "Skad pochodza dane leadow?",
    faq4A:
      "Flux Leads korzysta z AI search po publicznie indeksowanych zrodlach i zapisuje kontekst firmy do weryfikacji. Dane trzeba sprawdzic przed outreach.",
    faq5Q: "Czy Flux Leads wysyla emaile za mnie?",
    faq5A:
      "Moze tworzyc drafty i wysylac przez skonfigurowany SMTP. Ty odpowiadasz za tresc, targetowanie i compliance.",
    faq6Q: "Czy Flux Leads jest zgodny z GDPR?",
    faq6A:
      "Flux Leads pomaga odkrywac publicznie dostepne informacje biznesowe i przygotowac outreach. Uzytkownicy odpowiadaja za lokalne przepisy email marketingu i ochrony danych, w tym GDPR/ePrivacy. Zalecamy kontakt tylko z relewantnymi firmami, uzywanie biznesowych adresow email, gdzie to mozliwe, i zawsze dodawanie opt-out.",
    faq7Q: "Czy moge uzywac w Polsce, Ukrainie albo UE?",
    faq7A:
      "Tak, ale zasady B2B outreach roznia sie miedzy krajami. Targetuj relewantnie, trzymaj source trail i przestan kontaktowac osoby po opt-out.",
    faq8Q: "Co po osiagnieciu miesiecznego limitu?",
    faq8A:
      "Tworzenie nowych leadow zatrzyma sie do kolejnego resetu lub upgrade. Istniejace leady, audyty i CRM pozostaja dostepne.",
    faq9Q: "Jak dziala Opportunity Score?",
    faq9A:
      "Wyzszy score oznacza, ze firma ma wiecej widocznych problemow strony i moze lepiej pasowac do outreach przez audyt.",
    faq10Q: "Czy narzedzie weryfikuje emaile?",
    faq10A:
      "Flux Leads moze znajdowac emaile w HTML strony. To sygnal confidence, nie gwarancja deliverability.",
    faq11Q: "Czy jest darmowy plan?",
    faq11A:
      "Tak. Starter obejmuje 50 nowych leadow miesiecznie i nie wymaga karty.",
    ctaH2: "Gotowy na systematyczny outreach?",
    ctaP: "50 leadow miesiecznie za darmo w Starter. Bez karty.",
    ctaButton: "Utworz darmowe konto",
    ctaFluxId: "Powered by Flux ID - jedno konto dla produktow NeoFlux.",
  },
  WebAgencies: {
    h1: "Lead engine dla agencji webowych",
    intro:
      "Pitch 'Twoja strona kosztuje leady' dziala, kiedy masz dowody. Flux Leads znajduje prospekty, audytuje strone i tworzy spersonalizowany email.",
    h2Pain: "Problemy, ktore rozwiazujemy",
    pain1: "Godziny recznego szukania w Maps i social media",
    pain2: "Szablonowe emaile bez faktow o stronie klienta",
    pain3: "Leady gubia sie miedzy arkuszami, Notion i inboxem",
    h2How: "Jak to dziala",
    step1: "AI znajduje firmy po niszy i miescie",
    step2: "Audyt zapisuje SSL, mobile i sygnaly SEO",
    step3: "Opportunity Score pokazuje, do kogo pisac najpierw",
    step4: "Kanban prowadzi deal do Won",
    cta: "Sprobuj za darmo",
  },
  LanguageSwitcher: {
    label: "Jezyk",
    uk: "Українська",
    en: "English",
    pl: "Polski",
  },
  Pricing: {
    ...enMessages.Pricing,
    back: "Wroc do workspace",
    title: "Cennik",
    subtitle: "Wybierz plan pod wolumen outreach. Mozesz zmienic w kazdej chwili.",
    current: "Obecny plan:",
    perMonth: "/mies.",
    paymentNote:
      "Bezpieczne platnosci przez Stripe. Plan mozna anulowac lub zmienic w Manage subscription.",
    popular: "Najpopularniejszy",
    leadsLine: "{formatted} nowych leadow{perMonthSuffix}",
    perMonthSuffix: "/mies.",
    unlimitedWord: "Bez limitu",
    currentPlan: "Obecny plan",
    upgradeNow: "Upgrade",
    plans: {
      STARTER: {
        ...enMessages.Pricing.plans.STARTER,
        tagline: "Darmowy",
        description: "Przetestuj produkt i zobacz, jak dziala lead search.",
        cta: "Zacznij za darmo",
        highlights: {
          localSearch: "Lokalny search (AI + Google)",
          simpleAi: "Uproszczone drafty email AI",
        },
      },
      PRO: {
        ...enMessages.Pricing.plans.PRO,
        tagline: "Najpopularniejszy",
        description: "Dla freelancerow i malych zespolow robiacych outreach codziennie.",
        cta: "Upgrade do Pro",
        highlights: {
          fullAudit: "Pelny audyt strony (SSL, mobile, performance)",
          emailEnrichment: "Email enrichment z HTML",
          unlimitedAi: "Nielimitowane drafty AI (Gemini)",
        },
      },
      AGENCY: {
        ...enMessages.Pricing.plans.AGENCY,
        tagline: "High-volume",
        description:
          "Dla agencji pracujacych w wielu niszach z konkretnym miesiecznym limitem i fair use.",
        cta: "Start Agency plan",
        highlights: {
          allPro: "Wszystko z Pro",
          csvExport: "Pelny eksport CSV",
        },
      },
    },
  },
  Footer: {
    ...enMessages.Footer,
    tagline:
      "AI lead engine do cold outreach. Znajduj lokalne firmy, artystow i spolki przez Gemini + Google Search.",
    projectsTitle: "Nasze projekty",
    accountTitle: "Konto",
    linkPricing: "Cennik",
    linkSettings: "Ustawienia",
    linkLogin: "Zaloguj",
    linkPolicy: "Privacy policy",
    linkTerms: "Terms",
    linkCookies: "Cookies",
    linkAcceptableUse: "Acceptable use",
    rightsReserved: "Wszelkie prawa zastrzezone.",
  },
} satisfies AbstractIntlMessages;

export default messages;
