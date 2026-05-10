# NeoFlux Lead Engine

Lightweight lead-generation tool for B2B web-development outreach. Scrapes
local businesses from Google Maps, audits their websites for common
technical problems, scores each lead by sales-opportunity potential, and
drafts personalized cold emails with Google Gemini.

Built for [NeoFlux](https://neoflux.dev) — a Ukrainian digital agency — but
can be repurposed for any niche where the sales pitch is *"your website is
costing you customers"*.

## Features

- **Google Maps scraper** — runs Playwright (headed) to collect company
  name, phone, and website for a given niche + city.
- **Website auditor** — headless Playwright check for SSL, mobile-friendly
  viewport, `<h1>`/`<title>` presence, slow load (> 3s), and contact email
  extraction from raw HTML.
- **Opportunity Score (0–100)** — proprietary signal that combines audit
  pain points and "fake-website" platforms (Instagram, ChoiceQR,
  Linktree, etc.) into a single sales-priority score.
- **AI cold-email generator** — Google Gemini 2.5 Flash drafts a 5–7
  sentence Ukrainian cold email referencing the *actual* issues found
  during the audit.
- **Mini-CRM UI** — list view, lead detail page, status pipeline (`New` →
  `Qualified` → `Contacted` → `Replied` → `Won` / `Lost`), and message
  history.

## Tech stack

- **Next.js 16** (App Router, Server Actions, React 19)
- **TypeScript 5**, **Tailwind CSS v4**
- **Prisma 6** + **PostgreSQL** (works great with Supabase)
- **Playwright** for web scraping & website auditing
- **`@google/genai`** for the Gemini integration

## Getting started

### 1. Prerequisites

- Node.js **20+**
- A PostgreSQL database (a free [Supabase](https://supabase.com/) project
  works out of the box)
- A Google **Gemini API key** — grab one at
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 2. Clone & install

```bash
git clone https://github.com/MaksMykolenko/NeoFlux-Leads.git
cd NeoFlux-Leads
npm install
```

The `postinstall` step pulls Playwright browser binaries. If it doesn't,
run it manually:

```bash
npx playwright install chromium
```

### 3. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

| Variable         | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`   | Pooled Postgres connection string used by the Next.js runtime           |
| `DIRECT_URL`     | Direct (non-pooled) connection used by Prisma migrations                |
| `GEMINI_API_KEY` | Google AI Studio API key for the AI proposal generator                  |

> If you're using Supabase, both `DATABASE_URL` and `DIRECT_URL` can be the
> same pooler URL on port `5432`. Some networks block port `6543`, hence
> the deliberate fallback to `5432`.

### 4. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

This creates four tables: `Lead`, `Audit`, `Campaign`, `Message`.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. On the home page, type a niche (e.g. `Стоматологія`) and a city
   (e.g. `Черкаси`) and hit **Пошук**. A visible Chromium window will
   open and walk through Google Maps. Expect 15–30 seconds per search.
2. Each scraped business shows up in the leads table. Click a row to open
   the lead detail page.
3. On the detail page, hit **Зробити аудит** to run the website auditor
   in the background. SSL, mobile, and SEO findings populate, and the
   Opportunity Score recalculates live.
4. Use **Згенерувати листа (AI)** to have Gemini draft a personalized
   cold email pulling from the audit findings. Edit the subject/body,
   then **Зберегти в CRM** to log it as a `Message` and bump the lead's
   status to `Contacted`.

## Why is the Google Maps scraper not headless?

Google aggressively serves CAPTCHAs to headless Chromium. Running with
`headless: false` reliably reaches the results page. If you deploy this
to a server, you'll need a virtual display (Xvfb) or a different
strategy — the auditor itself **is** headless and works fine in
production.

## Project layout

```
app/                    # Next.js App Router pages
  page.tsx              # Lead list + scraper form
  leads/[id]/page.tsx   # Lead detail view
prisma/
  schema.prisma         # Database schema
src/
  actions/              # Server Actions (scrape, audit, AI, status, save)
  components/           # Client React components
  lib/
    prisma.ts           # Prisma singleton
    scoring.ts          # Opportunity Score logic
    leadStatus.ts       # Status enum + style map
  modules/scraper/
    googleMapsScraper.ts
    websiteAuditor.ts
```

## Scripts

| Script           | What it does                |
| ---------------- | --------------------------- |
| `npm run dev`    | Start the Next.js dev server |
| `npm run build`  | Production build             |
| `npm run start`  | Start the production server  |
| `npm run lint`   | Run ESLint                   |

## License

[MIT](./LICENSE) — do whatever you want, no warranty.
