# Fielded — starter scaffold

A pre-built starting point for a missions-matching site: interactive Joshua Project map,
mission board matcher quiz, and a Supabase-backed profile/prayer-wall foundation.
Everything here runs on free tiers.

## What's already built
- `src/components/WorldMap.jsx` — MapLibre map, colored by unreached/formative/reached status
- `src/components/MatchQuiz.jsx` — scoring quiz against `src/data/agencies.json`
- `scripts/fetch-joshua-project.mjs` — pulls JP data into a cached GeoJSON file
- `.github/workflows/update-data.yml` — auto-refreshes that data weekly, free, no server needed
- `supabase/schema.sql` — user profiles + prayer request tables with row-level security

## What's NOT built yet (intentionally left for next passes)
- Logistics/budget calculators, support-raising templates, pre-field checklist UI
- Mentor matching, forum/community features
- Real styling pass (current CSS is a plain placeholder, not a design)
- Expanded `agencies.json` — only 7 seed agencies; needs real research to be trustworthy

---

## Your part: three accounts, ~15 minutes total

1. **GitHub** (free) — create an account, then a new repository (public, no license needed yet).
2. **Cloudflare Pages** (free) — sign up, click "Create a project," connect it to the GitHub repo you just made. Build command: `npm run build`. Output directory: `dist`.
3. **Joshua Project API key** (free) — register at https://joshuaproject.net/api/register.
4. **Supabase** (free) — create a project at https://supabase.com. Once created, go to the SQL Editor and paste in the contents of `supabase/schema.sql`, then run it. Then go to Settings > API and copy the Project URL and anon public key.

Then:
- In GitHub repo Settings > Secrets and variables > Actions, add a secret named `JP_API_KEY` with your Joshua Project key. This lets the auto-refresh Action pull data without you doing it manually.
- In Cloudflare Pages project settings > Environment variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the values from Supabase.

## Handing this to Claude Code

Paste this brief into Claude Code in this project's folder:

> This is a scaffolded Vite + React site for a missions-matching platform ("Fielded").
> It has a working MapLibre map (src/components/WorldMap.jsx), a matcher quiz
> (src/components/MatchQuiz.jsx), a Joshua Project data-fetch script
> (scripts/fetch-joshua-project.mjs), a GitHub Action to auto-refresh that data
> (.github/workflows/update-data.yml), and a Supabase schema (supabase/schema.sql).
> Please: (1) run `npm install` and `npm run dev` to confirm it boots, (2) help me
> initialize a git repo and push to my GitHub repo at [paste your repo URL], (3) run
> `npm run fetch-jp` once locally with my JP_API_KEY to populate real map data and
> verify the map renders correctly, (4) then build out [pick from: logistics
> calculators / pre-field checklist / forum / real visual design pass] next.

Claude Code will be able to run commands, install packages, initialize git, and push
for you — things this chat interface can't do directly.

## What Claude Code will hand back to you
- Confirmation the site runs locally (a localhost URL to check in your browser)
- A pushed GitHub repo — refresh your Cloudflare Pages dashboard and it will auto-deploy
- A live `.pages.dev` URL once deployment finishes (check the Cloudflare Pages dashboard)
- Possibly a request for the Supabase/JP keys if it needs to test the data pipeline live —
  paste those directly into Claude Code's terminal prompts, never into chat history you'd share elsewhere
