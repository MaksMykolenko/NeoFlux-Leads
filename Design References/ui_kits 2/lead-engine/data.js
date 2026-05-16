window.SEED = {
  leads: [
    {
      id: "1",
      companyName: "Стоматологія «Білий Слон»",
      category: "Стоматологія",
      city: "Черкаси",
      website: "https://bilyislon.com.ua",
      email: "info@bilyislon.com.ua",
      phone: "+380 472 33 11 22",
      source: "Google Maps",
      status: "Qualified",
      createdAt: "2026-05-04T09:14:00Z",
      updatedAt: "2026-05-08T16:41:00Z",
      audit: {
        performanceScore: 38,
        hasSSL: true,
        mobileFriendly: false,
        issues: [
          "Сайт не адаптований під мобільні пристрої — основна аудиторія втрачає форму запису.",
          "Відсутній тег <h1> на головній сторінці — погіршує SEO.",
          "Час завантаження > 4 секунди на 3G."
        ]
      },
      messages: []
    },
    {
      id: "2",
      companyName: "Pizzeria Mafia Cherkasy",
      category: "Піцерія",
      city: "Черкаси",
      website: "https://instagram.com/mafia.pizza.cherkasy",
      email: null,
      phone: "+380 67 555 11 22",
      source: "Google Maps",
      status: "New",
      createdAt: "2026-05-09T10:22:00Z",
      updatedAt: "2026-05-09T10:22:00Z",
      audit: null,
      messages: []
    },
    {
      id: "3",
      companyName: "Авто-СТО «Колесо»",
      category: "Автосервіс",
      city: "Черкаси",
      website: "https://koleso.cherkasy.ua",
      email: "koleso.sto@gmail.com",
      phone: "+380 67 414 22 33",
      source: "Google Maps",
      status: "Contacted",
      createdAt: "2026-05-02T08:00:00Z",
      updatedAt: "2026-05-08T18:12:00Z",
      audit: {
        performanceScore: 72,
        hasSSL: true,
        mobileFriendly: true,
        issues: [
          "Відсутня сторінка з прайс-листом."
        ]
      },
      messages: [
        {
          id: "m1",
          subject: "Пропозиція для Авто-СТО «Колесо»",
          body: "Доброго дня, команда Авто-СТО «Колесо»!\n\nМи в NeoFlux переглянули ваш сайт і помітили, що в ньому бракує сторінки з прайс-листом — клієнти у Черкасах часто шукають саме «ціна заміна гальмівних колодок» і йдуть до конкурентів, у яких ця інформація на видноті.\n\nМожемо швидко (5–7 робочих днів) додати сторінку з прайс-калькулятором і інтеграцією з вашим телефоном для записів. Це регулярно дає нашим клієнтам +20–30 % дзвінків з органіки.\n\nЧи зручно вам коротко поспілкуватись 15 хвилин у четвер або п’ятницю?\n\nЗ повагою,\nкоманда NeoFlux",
          sentAt: "2026-05-08T18:12:00Z",
          replyStatus: "No Reply"
        }
      ]
    },
    {
      id: "4",
      companyName: "Кав'ярня Brew & Co",
      category: "Кав’ярня",
      city: "Черкаси",
      website: null,
      email: null,
      phone: "+380 96 002 88 17",
      source: "Google Maps",
      status: "New",
      createdAt: "2026-05-09T11:01:00Z",
      updatedAt: "2026-05-09T11:01:00Z",
      audit: null,
      messages: []
    },
    {
      id: "5",
      companyName: "Юридичне бюро «Право і Закон»",
      category: "Юридичні послуги",
      city: "Черкаси",
      website: "https://pravo-zakon.cherkasy.ua",
      email: "office@pravo-zakon.cherkasy.ua",
      phone: "+380 472 71 80 90",
      source: "Google Maps",
      status: "Won",
      createdAt: "2026-04-21T08:30:00Z",
      updatedAt: "2026-05-06T14:22:00Z",
      audit: {
        performanceScore: 88,
        hasSSL: true,
        mobileFriendly: true,
        issues: []
      },
      messages: []
    },
    {
      id: "6",
      companyName: "Beauty Studio «Ніжність»",
      category: "Салон краси",
      city: "Черкаси",
      website: "https://linktr.ee/nizhnist.cherkasy",
      email: null,
      phone: "+380 67 711 03 22",
      source: "Google Maps",
      status: "Replied",
      createdAt: "2026-05-05T13:45:00Z",
      updatedAt: "2026-05-09T08:11:00Z",
      audit: null,
      messages: []
    }
  ],

  // Pre-seeded "beat buyers" — the second search mode.
  universalLeads: [
    {
      id: "u1",
      companyName: "Podcast «UA Builders»",
      category: null,
      city: null,
      website: "https://uabuilders.fm",
      email: "team@uabuilders.fm",
      phone: null,
      source: "Universal AI",
      status: "Qualified",
      createdAt: "2026-05-04T09:00:00Z",
      updatedAt: "2026-05-08T16:00:00Z",
      audit: null,
      messages: [],
      notes: "Український продуктовий подкаст про IT-стартапи. Випуски щотижня, шукають спонсорів."
    },
    {
      id: "u2",
      companyName: "TEDx Cherkasy 2026",
      category: null,
      city: null,
      website: "https://tedxcherkasy.org",
      email: null,
      phone: null,
      source: "Universal AI",
      status: "New",
      createdAt: "2026-05-07T11:00:00Z",
      updatedAt: "2026-05-07T11:00:00Z",
      audit: null,
      messages: [],
      notes: "Локальна TEDx-конференція в Черкасах, готується до осені 2026. Шукають партнерів і техспонсорів."
    }
  ],

  beatClients: [
    {
      id: "b1",
      companyName: "@youngluna.beats",
      realName: "Артем Луна",
      category: "Trap / Drill",
      city: "Київ",
      website: "https://soundcloud.com/youngluna",
      email: "luna.beats@gmail.com",
      phone: null,
      source: "SoundCloud",
      status: "Qualified",
      createdAt: "2026-05-08T11:00:00Z",
      updatedAt: "2026-05-09T14:00:00Z",
      audit: null,
      messages: [],
      audience: { platform: "SoundCloud", followers: 4200, monthlyListeners: 18000, lastUploadDays: 4 },
      lookingForType: true,
      genre: ["Trap", "Drill"]
    },
    {
      id: "b2",
      companyName: "@kyivflow",
      realName: "MC Kyivflow",
      category: "Hip-Hop / Boom Bap",
      city: "Львів",
      website: "https://youtube.com/@kyivflow",
      email: "booking@kyivflow.ua",
      phone: null,
      source: "YouTube",
      status: "New",
      createdAt: "2026-05-09T08:30:00Z",
      updatedAt: "2026-05-09T08:30:00Z",
      audit: null,
      messages: [],
      audience: { platform: "YouTube", followers: 12400, monthlyListeners: 0, lastUploadDays: 12 },
      lookingForType: true,
      genre: ["Hip-Hop", "Boom Bap"]
    },
    {
      id: "b3",
      companyName: "@meri.rnb",
      realName: "Meri",
      category: "R&B / Pop",
      city: "Одеса",
      website: "https://instagram.com/meri.rnb",
      email: null,
      phone: "+380 67 222 33 11",
      source: "Instagram",
      status: "New",
      createdAt: "2026-05-07T19:45:00Z",
      updatedAt: "2026-05-07T19:45:00Z",
      audit: null,
      messages: [],
      audience: { platform: "Instagram", followers: 27800, monthlyListeners: 0, lastUploadDays: 2 },
      lookingForType: false,
      genre: ["R&B", "Pop"]
    }
  ],

  // Two pre-written Gemini-style proposals; rotate per Generate click.
  aiProposals: [
    "Доброго дня, команда стоматології «Білий Слон»!\n\nМи в NeoFlux подивилися ваш сайт і одразу зачепило: основна частина пацієнтів у Черкасах шукає вас зі смартфона, але мобільна версія сайту в'їжджає важко — текст ламається, форма запису з'їжджає за межі екрана. Це прямо вартує вам нових записів.\n\nМи спеціалізуємось саме на швидких редизайнах для медичних практик: 7–10 днів — і ви отримуєте мобільно-першу версію з нативним онлайн-записом, прив'язаним до вашого календаря.\n\nЧи зручно вам поспілкуватись 15 хвилин у четвер або п’ятницю, щоб я показав 2-3 приклади?\n\nЗ повагою,\nкоманда NeoFlux",
    "Доброго дня, «Білий Слон»!\n\nЗнайшов вашу стоматологію через Google Maps і провів короткий аудит — три речі впадають в око: сайт відкривається 4+ секунди на мобільному, h1 на головній порожній (Google вас гірше індексує), а форма запису не працює на iPhone.\n\nДля стоматології в обласному центрі це втрачені 5–8 нових пацієнтів щотижня. У NeoFlux ми перебудовуємо такі сайти за 5 робочих днів — фіксована ціна, без сюрпризів.\n\nГотовий показати 15-хвилинне демо з вашим сайтом на екрані. Зручно у п’ятницю?\n\nЗ повагою,\nкоманда NeoFlux"
  ]
};
