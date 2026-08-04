# Progress

## Phase 1 — Foundation

- [x] Next.js (App Router) + TypeScript + Tailwind + shadcn/ui scaffold
- [x] Prisma installed, `prisma.config.ts` pointed at `.env.local`
- [x] `.env.example` written, `.env.local` gitignored
- [x] Full data model written in `prisma/schema.prisma` (curriculum, SRS, study tracking, content, past papers, AI, calendar — every table `userId`-scoped for RLS)
- [x] Prisma 7 client wired: CLI uses `DIRECT_URL` (prisma.config.ts), runtime uses `DATABASE_URL` via `@prisma/adapter-pg` (src/lib/prisma.ts)
- [x] Schema validated, client generated, typecheck clean, production build clean (with placeholder DB creds)
- [x] Pushed to GitHub (`Beschyugc/QCAA-study-platform`, `main`)
- [ ] Supabase project connected (waiting on: project URL, anon key, DATABASE_URL, DIRECT_URL)
- [ ] First real migration run against Supabase
- [ ] RLS policies written (userId = auth.uid() per table)
- [ ] Supabase magic-link auth wired up, gated to `APP_ALLOWED_EMAIL`
- [ ] Deployed to Vercel
- [ ] Verified: a row written from one machine appears on the other

## Blocked on (from Beschy)

- Supabase: project URL, anon/publishable key, DATABASE_URL, DIRECT_URL
- Gemini: real API key (a paste of Live API docs came through instead — see chat)
- School timetable (Phase 10)
- Real assessment/target-completion dates (using placeholders until provided)

## Phases 2-14

Not started. See task list / build brief §15 for scope of each.
