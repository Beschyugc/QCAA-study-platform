# QCAA Study Platform

Single-user study platform for Year 12 QCAA General: Mathematical Methods, Biology,
Psychology, English, Physical Education. Spaced repetition, progressive topic
unlocking, RAG tracking, an AI tutor, past-paper marking, and a recommendation
engine that tells you what to study each day.

See `PROGRESS.md` for build status.

## Stack

- Next.js (App Router) + TypeScript
- Supabase — Postgres, auth (magic link, single allowed email), file storage
- Prisma — ORM, migrations
- Tailwind CSS + shadcn/ui
- TanStack Query
- Vercel — deployment

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in every value. Where to get each one:
   - **Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY`) — Supabase dashboard → your project →
     Project Settings → API.
   - **`DATABASE_URL` / `DIRECT_URL`** — Project Settings → Database →
     Connection string. `DATABASE_URL` = Transaction pooler (port 6543, used
     at runtime by the app). `DIRECT_URL` = Session pooler or direct
     connection (port 5432, used by `prisma migrate`).
   - **`GEMINI_API_KEY`** — aistudio.google.com → Get API key. This is the
     plain Gemini API key for `generateContent` calls — not the Live API
     (real-time audio/video), which this app doesn't use.
   - **Google Calendar OAuth** — set up in Phase 10, once a real Vercel
     domain exists for the redirect URI.
   - **`APP_ALLOWED_EMAIL`** — the only email allowed to sign in.
3. `npx prisma migrate dev` (once `DATABASE_URL`/`DIRECT_URL` are set)
4. `npm run dev` → http://localhost:3000

Local dev and the deployed app point at the **same** Supabase project — that's
what makes data sync between your laptop and desktop automatic. There is no
local-only data store.

## Deployment

Connected to GitHub — push to `main` and Vercel deploys automatically. Set the
same environment variables from `.env.local` in the Vercel project settings
(Project → Settings → Environment Variables).

## Config-driven values

Nothing that should be tunable lives hardcoded in components. See:

- `config/subjects.ts` — subject priority weights (§1 of the build brief)
- `config/srs.ts` — SM-2 defaults, daily caps, leech threshold
- `config/recommendation.ts` — priority-score coefficients (Phase 11)
- `config/rag.ts` — stale-green decay window, mastery thresholds
