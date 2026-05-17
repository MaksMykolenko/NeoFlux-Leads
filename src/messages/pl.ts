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
      "Lead engine i mikro-CRM do cold outreach. Od NeoFlux Software.",
  },
  MarketingHome: {
    ...enMessages.MarketingHome,
    heroBadge: "Flux Leads · Outreach przez audyt",
    heroH1: "Znajduj firmy ze słabymi stronami. Zamieniaj audyty w klientów.",
    heroSub:
      "Flux Leads pomaga agencjom webowym znajdować lokalne firmy, analizować ich strony i tworzyć spersonalizowane wiadomości sprzedażowe na podstawie realnych problemów.",
    heroCta: "Zacznij za darmo",
    heroSecondary: "Funkcje",
    featuresEyebrow: "Funkcje",
    heroImageAlt: "Interfejs produktu Flux Leads",
    featuresH2: "Jeden proces od prospekta do pitchu",
    featureSearchH3: "AI lead search",
    featureSearchP:
      "Nisza + miasto → Gemini z Google Search grounding znajduje firmy z publicznych źródeł. To punkt startowy do outboundu, nie certyfikowana baza.",
    featureAuditH3: "Audyt strony w Playwright",
    featureAuditP:
      "SSL, mobile viewport, title/h1, czas ładowania i email enrichment — fakty do pitchu, że słaba strona kosztuje leady.",
    featureScoreH3: "Opportunity Score",
    featureScoreP:
      "Ocena 0-100 łączy problemy techniczne i słabą obecność online, żeby zaczynać outreach od najlepszych okazji.",
    featureCrmH3: "Kanban CRM",
    featureCrmP:
      "Statusy od New do Won, historia wiadomości i drafty AI bez nadmiaru enterprise CRM.",
    exampleEyebrow: "Przykładowy audyt",
    exampleH2: "Pokaż konkretny powód do pierwszej rozmowy",
    exampleIntro:
      "Przykładowy lokalny lead pokazuje problemy strony, score i kąt wiadomości zanim poświęcisz czas na outreach.",
    exampleBusinessLabel: "Firma",
    exampleBusiness: "Lokalny dentysta w Warszawie",
    exampleIssuesLabel: "Wykryte problemy strony",
    exampleIssue1: "Brak jasnego H1",
    exampleIssue2: "Wolne ładowanie na mobile",
    exampleIssue3: "Brak kontaktowego emaila",
    exampleIssue4: "Słaby SEO title",
    exampleScoreLabel: "Opportunity Score",
    exampleEmailLabel: "Wygenerowany draft emaila",
    exampleEmail:
      "Dzień dobry, zauważyłem kilka problemów na Państwa stronie, które mogą obniżać zaufanie i liczbę zapytań, szczególnie na mobile. Przygotowałem krótki audyt i mogę pokazać, co warto poprawić.",
    workflowEyebrow: "Proces w produkcie",
    workflowH2: "Cztery ekrany, jeden powtarzalny proces sprzedaży",
    workflowLeadSearchTitle: "Lead Search",
    workflowLeadSearchBody:
      "Wpisz niszę + miasto i otrzymaj lokalne firmy z publicznych źródeł.",
    workflowAuditTitle: "Website Audit",
    workflowAuditBody:
      "Sprawdź SSL, mobile, SEO i performance zanim zaczniesz outreach.",
    workflowEmailTitle: "AI Email Draft",
    workflowEmailBody:
      "Generuj spersonalizowane cold emaile na podstawie realnych problemów strony.",
    workflowCrmTitle: "Kanban CRM",
    workflowCrmBody: "Prowadź leady od New do Won bez arkuszy.",
    scoreEyebrow: "Opportunity Score",
    scoreH2: "Dlaczego jeden lead ma 82, a inny 35",
    scoreIntro:
      "Score priorytetyzuje firmy, gdzie luka na stronie jest wystarczająco widoczna dla trafnego pitchu.",
    scoreItem1: "Problemy techniczne strony",
    scoreItem2: "Brakujące lub słabe podstawy SEO",
    scoreItem3: "Mobile usability",
    scoreItem4: "Dostępność kontaktu",
    scoreItem5: "Dopasowanie firmy",
    scoreItem6: "Potencjał outreach",
    audienceEyebrow: "Dla kogo?",
    audienceH2: "Stworzone do precyzyjnego B2B outreach",
    builtForTitle: "Dla",
    builtFor1: "Freelance web developerów",
    builtFor2: "Małych agencji webowych",
    builtFor3: "Specjalistów SEO",
    builtFor4: "Twórców landing page",
    builtFor5: "Lokalnych agencji marketingowych",
    notForTitle: "Nie dla",
    notFor1: "Kampanii spamowych",
    notFor2: "Masowego scrapingu",
    notFor3: "Kupowania losowych list email",
    notFor4: "Zastąpienia enterprise CRM",
    emailCompareEyebrow: "Before / after",
    emailCompareH2: "Zamień generic outreach na wiadomość opartą o fakty",
    genericEmailTitle: "Generic cold email",
    genericEmailBody: "Dzień dobry, tworzę strony. Czy potrzebują Państwo nowej strony?",
    fluxEmailTitle: "Flux Leads email",
    fluxEmailBody:
      "Dzień dobry, sprawdziłem Państwa stronę i widzę, że ładuje się wolno na mobile oraz nie ma jasnej struktury H1/title. To może obniżać zaufanie i utrudniać kontakt klientom. Mogę wysłać krótki plan poprawek, jeśli to aktualne.",
    trustEyebrow: "Zaufanie",
    trustH2: "Budowane przez NeoFlux Software",
    trustP:
      "Flux Leads tworzy NeoFlux Software — mały ukraiński zespół inżynierski budujący praktyczne narzędzia dla firm digital.",
    trustItem1: "Bez karty na start",
    trustItem2: "Leady z publicznych źródeł",
    trustItem3: "Płatności Stripe",
    trustItem4: "Lekki CRM w zestawie",
    trustItem5: "Możesz anulować w każdej chwili",
    faqH2: "FAQ",
    faq1Q: "Czym Flux Leads różni się od CRM?",
    faq1A:
      "To lead engine: wyszukiwanie, audyt, priorytety i wiadomości. CRM to lekki pipeline na górze.",
    faq2Q: "Czy potrzebuję umiejętności technicznych?",
    faq2A:
      "Nie. Wpisz niszę i miasto, uruchom audyt, edytuj email AI i wyślij.",
    faq3Q: "Ile kosztuje start?",
    faq3A: "Starter kosztuje $0 i ma 50 leadów/mies. Pro to $20, Agency to $60.",
    faq4Q: "Skąd pochodzą dane leadów?",
    faq4A:
      "Flux Leads korzysta z AI search po publicznie indeksowanych źródłach i zapisuje kontekst firmy do weryfikacji. Dane trzeba sprawdzić przed outreach.",
    faq5Q: "Czy Flux Leads wysyła emaile za mnie?",
    faq5A:
      "Może tworzyć drafty i wysyłać przez skonfigurowany SMTP. Ty odpowiadasz za treść, targetowanie i compliance.",
    faq6Q: "Czy Flux Leads jest zgodny z GDPR?",
    faq6A:
      "Flux Leads pomaga odkrywać publicznie dostępne informacje biznesowe i przygotować outreach. Użytkownicy odpowiadają za lokalne przepisy email marketingu i ochrony danych, w tym GDPR/ePrivacy. Zalecamy kontakt tylko z relewantnymi firmami, używanie biznesowych adresów email, gdzie to możliwe, i zawsze dodawanie opt-out.",
    faq7Q: "Czy mogę używać w Polsce, Ukrainie albo UE?",
    faq7A:
      "Tak, ale zasady B2B outreach różnią się między krajami. Targetuj relewantnie, trzymaj source trail i przestań kontaktować osoby po opt-out.",
    faq8Q: "Co po osiągnięciu miesięcznego limitu?",
    faq8A:
      "Tworzenie nowych leadów zatrzyma się do kolejnego resetu lub upgrade. Istniejące leady, audyty i CRM pozostają dostępne.",
    faq9Q: "Jak działa Opportunity Score?",
    faq9A:
      "Wyższy score oznacza, że firma ma więcej widocznych problemów strony i może lepiej pasować do outreach przez audyt.",
    faq10Q: "Czy narzędzie weryfikuje emaile?",
    faq10A:
      "Flux Leads może znajdować emaile w HTML strony. To sygnał confidence, nie gwarancja deliverability.",
    faq11Q: "Czy jest darmowy plan?",
    faq11A:
      "Tak. Starter obejmuje 50 nowych leadów miesięcznie i nie wymaga karty.",
    ctaH2: "Gotowy na systematyczny outreach?",
    ctaP: "50 leadów miesięcznie za darmo w Starter. Bez karty.",
    ctaButton: "Utwórz darmowe konto",
    ctaFluxId: "Powered by Flux ID — jedno konto dla produktów NeoFlux.",
  },
  WebAgencies: {
    h1: "Pozyskiwanie klientów dla agencji webowych przez audyty stron",
    intro:
      "Pitch „Twoja strona kosztuje leady” działa, kiedy masz dowody. Flux Leads znajduje prospekty, audytuje stronę i tworzy spersonalizowaną wiadomość — od pierwszego kontaktu do zamknięcia deala w Kanbanie.",
    h2Pain: "Dlaczego agencje webowe nie mogą znaleźć klientów",
    pain1: "Godziny ręcznego szukania w Google Maps, LinkedIn i social media",
    pain2: "Szablonowe emaile bez konkretnych faktów o stronie klienta",
    pain3: "Leady gubią się między arkuszami, Notion i inboxem",
    h2How: "Jak działa outreach oparty o audyt",
    step1: "AI znajduje lokalne firmy po niszy, mieście i regionie",
    step2: "Audyt zapisuje SSL, mobile, SEO i czas ładowania — twardy dowód",
    step3: "Opportunity Score pokazuje, do kogo pisać najpierw",
    step4: "AI generuje cold email na podstawie konkretnych problemów strony",
    step5: "Kanban prowadzi deal od New, przez Contacted, do Won",
    h2Example: "Przykład: lokalny dentysta w Warszawie ze słabą stroną",
    exampleBody:
      "Wpisujesz „dentysta Warszawa” w Flux Leads. AI zwraca 20 firm z publicznych źródeł. Audyt pokazuje, że klinika „SmileLab” ma stronę bez SSL, wolne ładowanie 6.4 s na mobile i brak adresu email w nagłówku. Opportunity Score: 87/100. AI generuje email: „Dzień dobry, zauważyłem trzy konkretne problemy na Państwa stronie, które mogą obniżać liczbę zapytań od pacjentów…”. Wysyłasz ze swojego SMTP. Lead wpada w kolumnę Contacted. Dwa dni później klient odpowiada.",
    h2Manual: "Ręczny outreach vs Flux Leads",
    manualTime: "8 godzin tygodniowo",
    manualTimeBody:
      "Ręczne szukanie firm, analiza strony, pisanie emaila i wprowadzanie do CRM dla każdego leada osobno.",
    fluxTime: "20 minut tygodniowo",
    fluxTimeBody:
      "Wpisujesz niszę i miasto, AI robi audyty, drafty i priorytetyzację — Ty wybierasz, kogo skontaktować.",
    h2WhoFor: "Dla kogo jest Flux Leads",
    whoFor1: "Agencje webowe i studia projektowe (1-15 osób)",
    whoFor2: "Freelance web developerzy szukający klientów na strony",
    whoFor3: "Specjaliści SEO oferujący audyty jako lead magnet",
    whoFor4: "Marketing-agencje robiące cold outreach dla B2B",
    h2Issues: "Jakie problemy strony Flux Leads wykrywa",
    issue1: "Brak SSL/HTTPS — strona niezabezpieczona, ostrzeżenia w przeglądarce",
    issue2: "Brak responsywności mobilnej — viewport meta, layout się rozjeżdża",
    issue3: "Wolne ładowanie — czas powyżej 3 sekund, niska konwersja",
    issue4: "Brak lub słaby SEO title i meta description",
    issue5: "Brak jasnego H1 lub jego brak na pierwszym ekranie",
    issue6: "Brak kontaktowego emaila w HTML / kontakcie",
    issue7: "Brak Open Graph i Twitter cards — słabe udostępnianie na social media",
    h2BeforeAfter: "Cold email: generic vs Flux Leads",
    beforeTitle: "Generic szablon (10% odpowiedzi)",
    beforeBody:
      "Dzień dobry, jestem web developerem. Tworzę nowoczesne strony dla firm. Czy potrzebują Państwo nowej strony? Mogę przedstawić ofertę.",
    afterTitle: "Flux Leads email (3-4× wyższy reply rate)",
    afterBody:
      "Dzień dobry, sprawdziłem Państwa stronę i widzę trzy konkretne problemy: ładuje się 6.4 s na mobile, brak SSL i brak adresu email w stopce. To może obniżać liczbę zapytań od potencjalnych pacjentów — szczególnie tych, którzy szukają „dentysty Warszawa” z telefonu. Mogę wysłać krótki plan poprawek (3 strony), jeśli to teraz aktualny temat.",
    h2Faq: "FAQ dla agencji webowych",
    faqQ1: "Ile lidów mogę zdobyć miesięcznie?",
    faqA1:
      "Starter: 50/mies. za darmo. Pro: 1000/mies. za $20. Agency: 10 000/mies. za $60. Można zacząć od Startera i upgrade'ować, kiedy zauważysz, że AI faktycznie znajduje twoich klientów.",
    faqQ2: "Czy Flux Leads wysyła emaile za mnie?",
    faqA2:
      "Może wysyłać przez Twój SMTP (Gmail App Password, Hostinger, SendGrid). Reputacja domeny zostaje Twoja — nie wysyłamy z platformy.",
    faqQ3: "Czy dane lidów są aktualne?",
    faqA3:
      "AI search korzysta z publicznych źródeł indeksowanych w czasie wyszukania. Dane zawsze sprawdzaj przed wysłaniem — telefon, adres, godziny otwarcia mogą się dezaktualizować.",
    faqQ4: "Czy mogę używać poza Polską?",
    faqA4:
      "Tak. Flux Leads pracuje z każdym regionem — wpisujesz miasto/kraj w polu „region”, a AI ogranicza wyszukiwanie. UA, EN, PL — pełna lokalizacja interfejsu i wygenerowanych wiadomości.",
    ctaTitle: "Zacznij od 50 darmowych leadów miesięcznie",
    ctaBody:
      "Bez karty. Bez ograniczeń czasowych na Starterze. Upgrade, kiedy będziesz gotowy.",
    cta: "Spróbuj za darmo",
  },
  LanguageSwitcher: {
    label: "Język",
    uk: "Українська",
    en: "English",
    pl: "Polski",
  },
  Pricing: {
    ...enMessages.Pricing,
    back: "Wróć do workspace",
    title: "Cennik",
    subtitle: "Wybierz plan pod wolumen outreach. Możesz zmienić w każdej chwili.",
    current: "Obecny plan:",
    perMonth: "/mies.",
    paymentNote:
      "Bezpieczne płatności przez Stripe. Plan można anulować lub zmienić w Manage subscription.",
    popular: "Najpopularniejszy",
    leadsLine: "{formatted} nowych leadów{perMonthSuffix}",
    perMonthSuffix: "/mies.",
    unlimitedWord: "Bez limitu",
    currentPlan: "Obecny plan",
    upgradeNow: "Upgrade",
    plans: {
      STARTER: {
        ...enMessages.Pricing.plans.STARTER,
        tagline: "Darmowy",
        description: "Przetestuj produkt i zobacz, jak działa lead search.",
        cta: "Zacznij za darmo",
        highlights: {
          localSearch: "Lokalny search (AI + Google)",
          simpleAi: "Uproszczone drafty email AI",
        },
      },
      PRO: {
        ...enMessages.Pricing.plans.PRO,
        tagline: "Najpopularniejszy",
        description: "Dla freelancerów i małych zespołów robiących outreach codziennie.",
        cta: "Upgrade do Pro",
        highlights: {
          fullAudit: "Pełny audyt strony (SSL, mobile, performance)",
          emailEnrichment: "Email enrichment z HTML",
          unlimitedAi: "Nielimitowane drafty AI (Gemini)",
        },
      },
      AGENCY: {
        ...enMessages.Pricing.plans.AGENCY,
        tagline: "High-volume",
        description:
          "Dla agencji pracujących w wielu niszach z konkretnym miesięcznym limitem i fair use.",
        cta: "Start Agency plan",
        highlights: {
          allPro: "Wszystko z Pro",
          csvExport: "Pełny eksport CSV",
        },
      },
    },
  },
  Footer: {
    ...enMessages.Footer,
    tagline:
      "AI lead engine dla agencji webowych i freelancerów. Znajduj lokalne firmy, audytuj słabe strony i przygotowuj spersonalizowany outreach.",
    projectsTitle: "Nasze projekty",
    accountTitle: "Konto",
    resourcesTitle: "Zasoby",
    linkPricing: "Cennik",
    linkSettings: "Ustawienia",
    linkLogin: "Zaloguj",
    linkPolicy: "Privacy policy",
    linkTerms: "Terms",
    linkCookies: "Cookies",
    linkAcceptableUse: "Acceptable use",
    rightsReserved: "Wszelkie prawa zastrzeżone.",
  },
} satisfies AbstractIntlMessages;

export default messages;
