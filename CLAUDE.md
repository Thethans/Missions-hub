# Fielded (missions-hub)

React 18 + Vite 5 missions-matching site: MapLibre map of unreached people groups,
7-question agency-match quiz, opportunities explorer (~1,500 listings, 21 agencies),
Supabase-backed pre-field checklist and prayer map (magic-link auth). Deployed on
Vercel; pushing to `main` deploys production.

## Commands

- `npm run dev` — Vite dev server
- `npm test` — Vitest (jsdom + Testing Library)
- `npm run lint` / `npm run typecheck` — must both pass before committing
- `npm run generate-component` — regenerates `src/components/OpportunitiesExplorer.jsx`
  and `public/data/opportunities-fallback.json` from Supabase + tokens
- `npm run build:prerender` — production build + Puppeteer prerender (what Vercel runs)

## Non-negotiables

1. **Never fabricate data.** No invented stats, testimonials, usage counts, or agency
   attributes. Unconfirmed agency fields are `null` and rendered as "worth asking
   about" — never guessed, never scored (see `src/data/scoreAgency.js`). Social-proof
   numbers only render when backed by a real data source; otherwise the component
   renders nothing.
2. **`src/components/OpportunitiesExplorer.jsx` is generated.** Edit
   `scripts/lib/OpportunitiesExplorer.template.jsx` instead, then run
   `npm run generate-component`. Direct edits get clobbered.
3. **Never run SQL against production Supabase.** Schema changes go in
   `supabase/schema.sql` (idempotent, `create ... if not exists` style) plus a note
   in the PR/commit; the owner applies them manually. Every table needs RLS. Do not
   write policies that select from a table inside that same table's own policy
   (self-recursion — this has bitten before; see commit `ed9897c`).
4. **`supabase` client can be null** (missing env vars in local dev). Every usage
   must guard: `if (!supabase) return;` — follow existing patterns in
   `Checklist.jsx` and the explorer template.
5. **New/changed routes must be added to `ROUTES` in `scripts/prerender.js`** or
   they ship without prerendered HTML/meta tags.

## Design tokens

All visual values come from CSS variables in `src/styles/tokens.css`. Never hardcode
colors, fonts, spacing, radii, or shadows — if a needed value doesn't exist, add a
token first.

- Colors: `--ink-navy #16233b`, `--atlas-paper #faf7f0`, `--voyage-teal #2b6e76`;
  status: `--status-unreached`, `--status-formative`, `--status-reached`;
  derived: `--line`, `--muted-text`
- Type: `--font-display` (Fraunces — headings only), `--font-body` (Inter),
  `--font-mono` (IBM Plex Mono — labels, counts, metadata, kickers)
- Spacing: `--space-1`…`--space-16` (4px base). Radius/shadow: single `--radius`,
  `--shadow` reused everywhere.
- Glass surfaces: `--glass-light-*` on paper backgrounds, `--glass-dark-*` on navy.
- Focus: every interactive element gets `--focus-ring` on `:focus-visible`.

Fonts are self-hosted via `@fontsource` — never add font CDN links.

## CSS conventions

- Global styles live in `src/styles.css` (one intentional monolith, organized in
  commented sections). Add a new commented section per feature; do **not** start a
  CSS-modules/Tailwind/styled-components migration.
- Class naming: kebab-case with a feature prefix (`opp-card`, `opp-filter-chip`,
  `checklist-auth`, `hero-wordmark`). Modifiers use `--` (`opp-icon-btn--saved`).
- Feature-scoped CSS files are allowed only for self-contained features
  (precedent: `src/features/prayer-map/prayer-map.css`, `src/pages/LegalPages.css`).
- Mobile: verify at 390px width. Motion: gate all animation behind
  `usePrefersReducedMotion` (`src/hooks/usePrefersReducedMotion.js`); entrance
  reveals use the existing `RevealOnScroll` component, not new observers.

## Component patterns

- Pages in `src/pages/*Page.jsx` (call `usePageMeta` for title/description),
  shared components in `src/components/`, self-contained verticals in
  `src/features/<name>/`.
- Cards: `<article>` with header (mono agency/kicker label + actions), display-font
  title, muted description, icon-tag meta row, footer with link + action. Copy the
  `OpportunityCard` structure in the explorer template.
- Icons: `@phosphor-icons/react` only, sizes 14–20, `weight="bold"` for inline tags.
- Buttons: primary action = `.cta-button`; icon-only buttons need `aria-label`.
- Every async view has four states: loading (`role="status"`), error
  (`role="alert"`, plain-language, suggests one action), empty (explains why +
  offers a way out, e.g. "Clear filters"), and success. No unexplained spinners.
- localStorage keys are prefixed `fielded_` (`fielded_saved_opps`); wrap reads in
  try/catch with a sane default.

## Data layer

- Big datasets are static JSON in `public/data/` (CDN-cached, same-origin):
  `people-groups.geojson`, `opportunities-fallback.json`, `stats.json`. Pattern:
  static file is the fast path, Supabase is the freshness/auth path.
- Agency data for the quiz: `src/data/agencies.json` + `scoreAgency.js` (28 agencies,
  weighted dimensions, `matched`/`concerns` output). Reuse `getMatches` for any
  "relevance to your quiz" ranking — do not invent a second scoring system.
- Supabase tables: `opportunities`, `inquiries`, checklist tables, prayer-map tables
  (see `supabase/schema.sql`).

## Voice and content templates

Tone: expository and theologically precise, with dry warmth. Plain sentences,
concrete verbs, no marketing froth ("unlock", "empower", "journey" as a verb),
no exclamation points, no manufactured urgency.

- Headings: short declaratives ("Get to the field"), Fraunces, sentence case.
- Kickers/labels: mono font, may be uppercase, factual ("1,558 opportunities ·
  21 agencies").
- Error copy: say what happened and what to do — "Couldn't reach live listings
  right now — showing a recent saved snapshot instead." Never blame the user.
- Empty states: state the cause, offer the exit — "No opportunities match your
  current filters." + Clear filters button.
- Honesty beats polish: unknowns are stated as unknowns ("worth asking about"),
  limitations are named in plain text (the About page is the reference).

## Testing & verification

- Component tests live next to the component (`*.test.jsx`), Testing Library +
  user-event; mock Supabase and `fetch`, never hit the network.
- Before any commit: `npm test && npm run lint && npm run typecheck`.
- UI changes: verify in the browser at desktop and 390px, check the console for
  errors, and check the Network tab when touching data fetching.
