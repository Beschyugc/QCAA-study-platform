# Progress

## Phase 1 — Foundation — DONE

- [x] Next.js (App Router) + TypeScript + Tailwind + shadcn/ui scaffold
- [x] Prisma installed, `prisma.config.ts` pointed at `.env.local`
- [x] `.env.example` written, `.env.local` gitignored
- [x] Full data model written in `prisma/schema.prisma` (curriculum, SRS, study tracking, content, past papers, AI, calendar — every table `userId`-scoped for RLS)
- [x] Prisma 7 client wired: CLI uses `DIRECT_URL` (prisma.config.ts), runtime uses `DATABASE_URL` via `@prisma/adapter-pg` (src/lib/prisma.ts)
- [x] Schema validated, client generated, typecheck clean, production build clean
- [x] Pushed to GitHub (`Beschyugc/QCAA-study-platform`, `main`)
- [x] Supabase project connected, first migration run (23 tables)
- [x] RLS policies (`userId = auth.uid()`) on every table — applied via `prisma db execute` since Prisma's shadow DB lacks Supabase's `auth` schema; documented pattern for future auth-dependent migrations
- [x] Supabase magic-link auth, gated to `APP_ALLOWED_EMAIL`, verified live in Chrome (unauthenticated redirect, disallowed-email rejection, real magic-link round trip, sign-out)
- [x] Deployed to Vercel (`qcaa-study-platform.vercel.app`), GitHub-connected auto-deploy
  - Fixed: missing `postinstall: prisma generate` (generated client is gitignored, wasn't being created on Vercel's fresh install)
  - Fixed: env vars weren't set on Vercel at all initially — now populated (Production + Preview)
  - Fixed: Supabase Site URL / Redirect URLs didn't include the Vercel domain — added production, preview wildcard, and localhost callback URLs
- [x] Verified auth end-to-end on the live production URL, not just local dev

## Phase 2 — Curriculum — IN PROGRESS

Scope: subject/unit/topic/subtopic/learning_objective models (already in schema from
Phase 1), subject priority-weight config, syllabus PDF import with editable review
before save, manual curriculum tree editor, CSV/JSON bulk import/export, RAG rating
UI with keyboard nav, stale-green decay, per-subject heatmap.

Building in vertical slices — see task list for sub-steps.

## Blocked on (from Beschy)

- Gemini: need to confirm the API key entered into Vercel/`.env.local` is a real key, not blank — needed for AI syllabus extraction later in Phase 2 and for Phase 7+
- School timetable (Phase 10)
- Real assessment/target-completion dates (using placeholders until provided)

## Phases 3-14

Not started. See task list / build brief §15 for scope of each.
