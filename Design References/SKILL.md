---
name: flux-leads-design
description: Use this skill to generate well-branded interfaces and assets for Flux Leads — the bilingual (uk/en) Ukrainian B2B prospecting CRM (local business / beats / universal lead modes). Defaults to DARK mode with Flux ID purple brand (#6a00ff). Contains tokens, fonts, assets, and a clickable Flux Leads UI kit.
user-invocable: true
---

Read README.md inside this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here.

If invoked without other guidance, ask the user what they want to build, ask some questions, and act as an expert designer.

## What this skill knows

- Flux Leads — the Ukrainian/English B2B sales CRM (Next.js 16 + Tailwind v4 + Geist Sans + Prisma 6 + next-intl + next-themes).
- **Three lead modes**: Local (Gemini + Search), Beats (music artists for type beats), Universal (free-form OSINT).
- **Dark mode is the default** (Flux ID design tokens — `#0b0c10` bg, `#13141c` cards, `#6a00ff` purple). Light mode is a toggle.
- The full color palette: zinc neutrals + purple primary + violet/amber/rose/emerald/red/blue status family. See `colors_and_type.css`.
- Type scale and Geist usage (sentence-case headings, **font-bold** h1 on dashboard, `tabular-nums` numerics).
- Status semantics (`New/Qualified/Contacted/Replied/Won/Lost`) including kanban-column accents and funnel segments.
- Iconography pattern (inline Heroicons, no font/sprite, no emoji).
- Purple-glow elevation utility (`flux-glow`, `flux-glow-lg`, `flux-glow-card`).
- A clickable UI kit recreating the dashboard (auth header, mode tabs, scraper form, table + kanban view, lead detail).

## When to use what

- **Prototyping a new dashboard surface** → start from `ui_kits/lead-engine/` components: `AuthHeader`, `ModeTabs`, `LeadViewToggle`, `Card`, `StatusPill`, `UsageMeter`, `KanbanBoard`. Author dark-first; add `dark:` siblings.
- **Marketing/landing surfaces** → use the marketing palette: `#0a0a0f` page bg, grid overlay, purple-glow CTA, `font-extrabold` h1.
- **Decks / slides** → use the wordmark with `Flux` in fg + `Leads` in purple. Stay sentence-case, no emoji, no gradient on cards.
