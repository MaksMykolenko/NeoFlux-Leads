# Lead Engine — UI kit

A pixel-faithful recreation of the **NeoFlux Lead Engine** product
(home + lead-detail screens), wired up as a clickable click-thru
prototype with fake data. No backend — the leads + audit + messages
live in `useState` and are seeded from `data.js`.

## Files

- `index.html` — entry. Boots React, wires up routing between the
  list and detail views. Also includes a tiny browser frame so the
  preview reads as the real product URL bar.
- `data.js` — seed leads, audits, sample AI proposal text. Plain JS,
  loaded as a `<script>` so every other JSX file can read `window.SEED`.
- `App.jsx` — top-level state + route switch.
- `LeadList.jsx` — home screen: scraper form, recent-leads table.
- `LeadDetail.jsx` — composes the detail-view cards.
- `Card.jsx` — `Card`, `CardEyebrow`, `Section` primitives + the
  `IconBadge` empty-state swatch.
- `Buttons.jsx` — `PrimaryButton`, `AIButton`, `TertiaryButton`,
  `SecondaryButton`, with built-in spinner-on-`pending`.
- `StatusPill.jsx` — `StatusPill` + the matching `<select>`-based
  `StatusPicker` used in the detail header.
- `OpportunityScore.jsx` — the big-number card with progress bar.
- `AuditCard.jsx` — performance-score, SSL/mobile checks, issues list.
- `AIProposalCard.jsx` — the gradient-CTA AI card with subject + body
  textareas, copy + save buttons, "Saved" toast.
- `Icons.jsx` — every Heroicons SVG used by the kit, exported as
  React components.

## What's faked

- Scraper "search" returns 3 hardcoded Cherkasy dental clinics after
  ~600ms.
- Audit "run" flips an audit on after ~500ms with deterministic data.
- AI "Generate" returns one of two pre-written Ukrainian cold emails.
- "Save to CRM" pushes a `Message` row + bumps the lead status to
  `Contacted`.
