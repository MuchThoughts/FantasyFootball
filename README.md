# Fantasy Football Draft Planner

A live auction-draft cheat sheet for a 12-team, 2QB/superflex, half-PPR keeper league. Tracks live prices vs.
league-specific historical targets, tiers, keepers, and per-team draft strategy — synced in real time across
every device at the table.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript, deployed on [Vercel](https://vercel.com)
- [Supabase](https://supabase.com) Postgres for persistence, with Realtime for multi-device sync
- No login — each draft gets a "profile" (a shareable room). Anyone with the link can view/edit it.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

Open http://localhost:3000.

## Data model

- `profiles` — one row per draft room (`id`, `name`).
- `draft_states` — one row per profile, a single `jsonb` blob holding settings, keepers, drafted players,
  player notes/tiers, custom players, and budget strategies. Realtime is enabled on this table so every
  connected device gets pushed updates as picks are entered.

Static reference data (2026 ADP board, this league's historical price-by-rank curves, per-owner tendencies,
offensive PPG splits) lives in `src/lib/data/` and ships with the app — it doesn't need a database.

## Deploying

Push to the connected GitHub branch; Vercel redeploys automatically. Set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel project's environment variables (see `.env.local` for the
values used locally).
