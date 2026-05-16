# Flux Leads — UI kit

A pixel-faithful recreation of the **Flux Leads** product
(repo: [`MaksMykolenko/NeoFlux-Leads`](https://github.com/MaksMykolenko/NeoFlux-Leads)).
Loads with **dark mode** by default (matches `next-themes` `defaultTheme="dark"`)
— flip in the AuthHeader to see the light variant.

## What's mocked

- **AuthHeader** — sticky header with logo glow, theme toggle, UK/EN language switcher, Plan pill, avatar with initials, gear + logout.
- **3-mode tabs** — Local · Beats · Universal — purple active underline.
- **View toggle** — Table / Board pill — clicking "Board" reveals a working kanban with 6 columns (drag is faked: clicking the `→` action on a card cycles its status).
- **UsageMeter** — Pro plan with `142 / 500` used, purple progress bar.
- **Scraper form** (Local mode) — niche + city + purple CTA.
- **Universal mode form** — textarea + violet→purple AI gradient CTA, "Gemini + Google Search ~30s" hint.
- **Beats mode (BeatOutreach)** — keeps the 3-step flow (find → upload demo → AI message) from earlier iteration; recolored to purple.
- **Lead detail** — Opportunity Score, AI Proposal, Audit, Contacts, System info, Message history.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Entry. Loads with `<html class="dark">`, includes a Tailwind config block that registers `flux-*` color tokens. |
| `App.jsx` | Top-level state — mode, view, theme, locale, route. |
| `AuthHeader.jsx` | Sticky top bar + LanguageSwitcher. |
| `UsageMeter.jsx` | Three states: unlimited / normal / danger. |
| `KanbanView.jsx` | Non-DnD kanban — funnel summary + 6 columns + cycle-status action. |
| `LeadList.jsx` | Page composition: header, mode tabs, usage, form, table/board switch. |
| `LeadDetail.jsx` | Detail-view cards. |
| `Card.jsx`, `Buttons.jsx`, `StatusPill.jsx`, `Icons.jsx` | Primitives. |
| `OpportunityScore.jsx`, `AuditCard.jsx`, `AIProposalCard.jsx`, `BeatOutreach.jsx` | Domain cards (recolored to purple). |
| `data.js` | Seed leads — 6 local + 3 beats + 2 universal + 2 AI proposals. |

## What's faked

- Scraper "search" returns 3 hardcoded dental clinics after ~900ms.
- Universal "search" returns 2 hardcoded results after ~1100ms.
- Audit "run" flips an audit on after ~600ms with random scores.
- AI "Generate" returns one of two pre-written Ukrainian cold emails.
- "Save to CRM" pushes a `Message` row + bumps the lead status to `Contacted`.
- "Sign in with Flux ID" / "Upgrade →" / "Sign out" — all `preventDefault()`.
- Theme + locale state lives in React state — no `next-themes`, no `next-intl`.
