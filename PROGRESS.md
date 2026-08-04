# Progress

Build order deviates from the brief's strict §15 sequence from Phase 7 onward:
Phases 7, 8, and the Google Calendar half of 10 are blocked on credentials
(Gemini key, Google OAuth) that haven't arrived yet. Rather than stall,
completed Phases 9 and 11 (both fully unblocked) ahead of them. Everything
built stays in scope for its original phase — this is a reordering, not a
scope cut.

## Phases 1-6 — Foundation through Timer — DONE

- **Phase 1**: Next.js/Prisma/Supabase scaffold, full 23-table schema (all
  RLS-scoped to `userId`), magic-link auth gated to `APP_ALLOWED_EMAIL`,
  deployed to Vercel with GitHub auto-deploy. Verified live in Chrome, both
  local and production.
- **Phase 2**: Curriculum tree editor, keyboard RAG rating (rag_history
  append-only), stale-green flagging, heatmap, CSV/JSON import/export,
  syllabus PDF import (AI extraction step built but unverified — see
  Blocked On), cross-subject `/review`.
- **Phase 3**: Topic unlocking state machine, mastery evidence + confirm
  dialogue with override, regression flagging, progression map.
- **Phase 4**: `lib/srs/sm2.ts` — pure SM-2 matching §7.1 exactly, 21 Vitest
  cases covering every branch, keyboard-driven reviewer with undo.
- **Phase 5**: Formula/type-in card types, image occlusion (scoped-down —
  see code comments), Supabase Storage upload, tags, bulk operations, leech
  list.
- **Phase 6**: Pomodoro timer (localStorage-persisted phase/pause state,
  Postgres-anchored session start), streaks. Found and fixed a real
  timezone bug here — see below.

Every phase above was verified against the real Supabase database with a
throwaway script (built real data, ran the actual code path, asserted, then
cleaned up) since browser click-through has been blocked most of this
session — see Blocked On. Every phase has a clean typecheck and production
build; `npm test` covers SM-2, fuzzy-match, date helpers, and the
recommendation engine (52 tests total as of Phase 11).

**Real bug caught and fixed**: `getStudyStats()`'s streak calculation
originally mixed server-local-timezone day boundaries with UTC-ISO-string
date keys — broke consecutive-day matching for anyone not in UTC (i.e.
Beschy, in AEST). Added `lib/date.ts` using `Intl.DateTimeFormat` with an
explicit `Australia/Brisbane` timezone (fixed +10:00, no DST) so day
boundaries are correct regardless of what timezone the server process
itself runs in. Caught by the DB verification script before it shipped.

## Phase 9 — Formulas and assumed knowledge — DONE

Formula reference (LaTeX via KaTeX, on-sheet flag + filter, drill mode) and
assumed-knowledge vault (category/prompt/answer/latex), both with one-click
flashcard conversion. Reused `Card.tags`/`Card.extra` instead of new schema,
consistent with the image-occlusion approach in Phase 5.

## Phase 11 — Recommendation engine — DONE

`config/recommendation.ts` holds every scoring coefficient.
`lib/recommendation.ts` is a pure `scoreTopicPriority()` (same discipline as
sm2.ts) with an itemised contribution breakdown for the "why is this
recommended?" panel — 18 Vitest cases. `lib/recommendation-data.ts` gathers
real factors per active topic (red/amber proportion, days since studied,
cards overdue, pace variance, days to assessment, needs_review). Added
`Subject.targetCompletionDate`/`nextAssessmentDate` (nullable, still
placeholder-null). `/plan` shows ranked topics with expandable breakdowns
and generates a daily plan against a minute ceiling.

## Blocked on (from Beschy)

- **Gemini API key** — still blank in `.env.local`/Vercel. Blocks: syllabus
  AI extraction (Phase 2, built/unverified), all of Phase 7 (AI provider
  layer), Phase 8 (teach-back), the AI-marking half of Phase 12, the
  AI-narrative half of Phase 13, and AI card generation in Phase 14.
- **Google OAuth credentials** — not provided. Blocks the Calendar-sync half
  of Phase 10 (the timetable-editor half doesn't need them and is
  buildable now).
- **Supabase email rate limit** — was blocking all browser/auth testing;
  status unknown since it hasn't been retested this session. SMTP offer
  (Resend free tier) still open, no response yet.
- **School timetable** — not provided (Phase 10).
- **Real assessment/target-completion dates** — using `null` placeholders
  (Phase 11's pace/assessment factors correctly contribute 0 until these
  exist, rather than fabricating numbers).
- **A full live click-through of everything since Phase 1 is owed** — every
  phase from 2 onward has been verified against the real database via
  scripts, but not through the actual browser UI. This is the single
  biggest open risk: UI bugs (bad Tailwind classes, broken client
  interactivity, layout issues) would not be caught by any of the
  verification done so far.

## Phases 7, 8, 10 (Calendar), 12-14

Not started, or blocked as noted above. See task list / build brief §15 for
scope of each.
