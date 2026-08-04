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

## Phase 2 — Curriculum — DONE

- [x] `config/subjects.ts` — the 5 subjects + priority weights, data not hardcoded logic
- [x] `prisma/seed.ts` — resolves the Supabase `auth.users` row by `APP_ALLOWED_EMAIL`, upserts subjects (no hardcoded user id)
- [x] Home page reads real Subject rows via Prisma
- [x] `/subjects/[shortCode]` — manual tree editor: inline add/edit/delete units/topics/subtopics/objectives, up/down topic reordering
- [x] `/subjects/[shortCode]/rate` — keyboard RAG rating: ↑/↓ move, 1/2/3 = red/amber/green, auto-advance, filter chips
- [x] `setRagStatus()` appends to `rag_history` (never overwrites) — status + timestamp per change
- [x] Stale-green flagging (`config/rag.ts`, default 21 days) — surfaced as a badge, never auto-downgrades. **Partial**: only checks rating age so far; full check (no related card reviews/study sessions) needs Phase 4-6 data
- [x] RAG heatmap — units × topics grid, cell colour = weighted average, hover shows %
- [x] CSV/JSON export (`/subjects/[shortCode]/export`) and import (`.../import`) — full-replace semantics, called out in the UI
- [x] Syllabus PDF import (`.../syllabus-import`) — upload → `pdf-parse` → Gemini structures it → editable JSON review → same save path as manual import
- [x] `/review` — cross-subject reds/stale-greens/unrated view, satisfies §5.2's "all reds across all subjects" requirement that per-subject Rate mode doesn't cover

**Verified for real** (without browser access — Supabase's free-tier email rate limit blocked magic-link testing most of this phase): CSV parser/writer round-trips exactly through quotes/commas/newlines (throwaway script); `pdf-parse` extracts 116k characters cleanly from the actual Biology 2025 syllabus PDF (58 pages, throwaway script); every slice has a clean typecheck + production build. **Not verified**: nothing in the browser UI has been clicked through yet this phase, and the AI extraction step is architecturally complete but untested end-to-end since `GEMINI_API_KEY` is still blank.

## Phase 3 — Unlocking — DONE

- [x] `config/unlocking.ts` — active-topic cap (default 1), mastery thresholds
- [x] `lib/unlocking.ts` — init on import, mastery evidence check, confirm+advance, regression flagging (needs_review, never reverts unlock_state)
- [x] Progression map — landing content on the subject page, click active/mastered topics to open the mastery evidence dialogue with override

**Verified for real**: throwaway DB script ran the full lifecycle (init → rate green → confirm mastery → next topic activates → rate red → needs_review flags without reverting) against real Supabase data on the PE subject, all assertions passed, cleaned up after.

## Phase 4 — SRS core — DONE

- [x] `lib/srs/sm2.ts` — pure SM-2, no DB access, matches §7.1 exactly (2.5 ease/1.3 floor, 0/3/4/5 quality scale, 1min/10min learning steps, 1→6→prev×ease graduation, lapse penalty, 8-lapse leech, ±5% fuzz)
- [x] 21 Vitest cases, every branch, written before UI wiring — all pass (`npm test`)
- [x] Card CRUD (basic + cloze) at `/subjects/[shortCode]/cards`
- [x] Reviewer at `.../reviewer` — topic-scoped to active+mastered only, space/1-4/s/b/u keyboard-driven, undo restores exact pre-grade snapshot

**Verified for real**: throwaway DB script built a card on PE, ran new → learning → graduate → review through the actual database, confirmed CardScheduling and Review rows persist correctly, cleaned up after.

## Blocked on (from Beschy)

- Gemini: still need a real API key in `.env.local` + Vercel — blocks testing syllabus AI extraction (built, unverified) and all of Phase 7+
- Supabase email rate limit — blocks any browser/auth click-through testing until it resets or SMTP gets wired up (offered earlier, no response yet)
- School timetable (Phase 10)
- Real assessment/target-completion dates (using placeholders until provided)
- **A full live click-through of everything built in Phases 2-4 is owed** the moment either the rate limit clears or SMTP is set up — nothing in the actual browser UI has been exercised since Phase 1, only the database logic underneath it (verified repeatedly via throwaway scripts). Flagging clearly so this doesn't get lost.

## Phases 5-14

Not started. See task list / build brief §15 for scope of each. Currently starting
Phase 5 (SRS extended — image occlusion, formula/type-in cards, media upload, bulk ops).
