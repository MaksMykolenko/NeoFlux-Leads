# NeoFlux Lead Engine

Lightweight lead-generation tool for B2B web-development outreach. Finds
local businesses by niche and city using **Gemini + Google Search grounding**
(no browser automation for discovery), audits their websites for common
technical problems, scores each lead by sales-opportunity potential, and
drafts personalized cold emails with Google Gemini.

Built for [NeoFlux](https://neoflux.dev) — a Ukrainian digital agency — but
can be repurposed for any niche where the sales pitch is *"your website is
costing you customers"*.

## Features

- **Local business search** — Gemini 2.5 Flash with Google Search finds
  company name, phone, and website from public pages for a given niche + city
  (serverless-friendly, works on Vercel).
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
- **Playwright** for website auditing only (local discovery does not use it)
- **`@google/genai`** for Gemini (proposals, beat/universal/local search)

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

After install, Prisma generates the client (`postinstall`). For the
**website auditor** (Playwright) locally you need Chromium:

```bash
npx playwright install chromium
```

### 3. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

| Variable                  | Purpose                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`            | Pooled Postgres connection string used by the Next.js runtime                            |
| `DIRECT_URL`              | Direct Postgres URL for Prisma `migrate` / `db push` (Supabase: **Direct connection**, not session pooler) |
| `GEMINI_API_KEY`          | Google AI Studio API key (local search, universal/beats search, AI letters)              |
| `FLUX_ID_BASE_URL`        | Base URL of the Flux ID server (e.g. `https://fluxid.fluxmarketplace.store`)             |
| `FLUX_CLIENT_ID`          | OAuth client_id, issued by `php oauth/register_client.php` on the Flux ID server          |
| `FLUX_CLIENT_SECRET`      | OAuth client_secret (shown once at registration time — store securely)                    |
| `FLUX_REDIRECT_URI`       | Must match the redirect_uri used when registering the client (e.g. `…/api/auth/flux/callback`) |
| `FLUX_OAUTH_STATE_SECRET` | Random ≥32-byte secret for signing the OAuth state cookie (`openssl rand -base64 48`)     |

> **Supabase:** keep `DATABASE_URL` on the **pooler** (transaction mode on
> `6543` is best for serverless). Set `DIRECT_URL` to the **direct** URI
> (host `db.<project-ref>.supabase.co`, port `5432` — from Dashboard →
> Database → *Connection string* → *Direct*). If `DIRECT_URL` points at the
> same **session** pooler as the app, `prisma db push` / migrate can fail with
> `EMAXCONNSESSION` (max 15 clients) when the pool is busy.

### 4. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

This creates the application tables: `Lead`, `Audit`, `Campaign`, `Message`,
plus `User` and `Session` (used by the Flux ID login flow).

### 4a. Register a Flux ID OAuth client

The login button on every page kicks off an OAuth 2.0 Authorization Code flow
against [Flux ID](https://fluxid.fluxmarketplace.store). On the Flux ID server,
register this app once:

```bash
php oauth/register_client.php "NeoFlux Lead Engine" "http://localhost:3000/api/auth/flux/callback"
```

It prints a `client_id` and `client_secret` (the secret is shown **only once**).
Paste both into your `.env` as `FLUX_CLIENT_ID` / `FLUX_CLIENT_SECRET`, set
`FLUX_REDIRECT_URI` to the same callback URL you registered, and generate
`FLUX_OAUTH_STATE_SECRET` with `openssl rand -base64 48`.

For production, register a second client with the production callback URL
(e.g. `https://your-app.vercel.app/api/auth/flux/callback`) and put those
values into Vercel env vars.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploying to Vercel

The home page loads leads from PostgreSQL **on every request**. If the app
shows “server error” on your `.vercel.app` URL, almost always one of these is
missing in **Project → Settings → Environment Variables** (apply to
*Production*, *Preview*, *Development* as needed):

| Variable                  | Required | Notes |
| ------------------------- | -------- | ----- |
| `DATABASE_URL`            | **Yes**  | Supabase pooler or direct Postgres URL (same DB you use locally). |
| `DIRECT_URL`              | **Yes**  | Prisma DDL/migrations: use Supabase **direct** `db.*.supabase.co:5432` URL, not the session pooler (avoids `EMAXCONNSESSION`). |
| `GEMINI_API_KEY`          | **Yes**  | Needed for AI search and letter flows. |
| `FLUX_ID_BASE_URL`        | **Yes**  | Flux ID origin (e.g. `https://fluxid.fluxmarketplace.store`). |
| `FLUX_CLIENT_ID`          | **Yes**  | Issued by `php oauth/register_client.php` for **this** environment's callback URL. |
| `FLUX_CLIENT_SECRET`      | **Yes**  | Paired with `FLUX_CLIENT_ID`; shown only once at registration. |
| `FLUX_REDIRECT_URI`       | **Yes**  | Must exactly match the URL you registered (e.g. `https://<app>.vercel.app/api/auth/flux/callback`). |
| `FLUX_OAUTH_STATE_SECRET` | **Yes**  | Any high-entropy string (`openssl rand -base64 48`); rotates state cookies. |

Then **Redeploy** (Deployments → … → Redeploy) so the new env vars are picked up.

Apply your schema to the hosted database once (from your machine with `DATABASE_URL`
pointing at prod, or via Supabase SQL editor after `prisma migrate diff`):

```bash
npx prisma db push
# or: npx prisma migrate deploy
```

If errors persist, open **Deployments → your deployment → Runtime Logs** and look
for Prisma or connection errors.

## Usage

1. On the home page (local mode), type a niche (e.g. `Стоматологія`) and a city
   (e.g. `Черкаси`) and hit **Пошук**. Gemini searches the open web and returns
   a short list of businesses; expect on the order of **10–40 seconds** per search.
2. Each saved business shows up in the leads table. Click a row to open
   the lead detail page.
3. On the detail page, hit **Зробити аудит** to run the website auditor
   in the background. SSL, mobile, and SEO findings populate, and the
   Opportunity Score recalculates live.
4. Use **Згенерувати листа (AI)** to have Gemini draft a personalized
   cold email pulling from the audit findings. Edit the subject/body,
   then **Зберегти в CRM** to log it as a `Message` and bump the lead's
   status to `Contacted`.

> **Note:** Local search results depend on what Gemini can retrieve via Google
> Search grounding. Treat listings as starting points and verify before outreach.

## Project layout

```
app/[locale]/           # Localized App Router pages (uk / en)
  page.tsx              # Lead list + local / beats / universal forms
  leads/[id]/page.tsx   # Lead detail view
  api/auth/
    flux/login/         # GET → redirect to Flux ID /oauth/authorize.php
    flux/callback/      # GET ?code → token exchange → upsert User → session cookie
    logout/             # POST → destroy session
prisma/
  schema.prisma         # Database schema
src/
  actions/              # Server Actions (search, audit, AI, status, save)
  components/           # Client React components (incl. AuthHeader)
  lib/
    prisma.ts           # Prisma singleton
    geminiLocalBusinessSearch.ts  # Local niche+city → Gemini + Google Search
    scoring.ts          # Opportunity Score logic
    leadStatus.ts       # Status enum + style map
    fluxAuth.ts         # Flux ID OAuth helpers (state, token, userinfo)
    session.ts          # DB-backed session cookie helpers
  modules/scraper/
    websiteAuditor.ts   # Playwright site checks
```

## Scripts

| Script            | What it does |
| ----------------- | -------------------------- |
| `npm run dev`     | Start the Next.js dev server |
| `npm run build`   | `prisma generate` then production build |
| `npm run start`   | Start the production server |
| `npm run lint`    | Run ESLint |

`postinstall` runs `prisma generate` after `npm install` (needed on Vercel).

## License

[MIT](./LICENSE) — do whatever you want, no warranty.
