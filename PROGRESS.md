# Progress

13 of 14 phases done, Phase 14 in progress (3 of 5 sub-features shipped:
AI card gen, study coach mode, nightly export/backup — FSRS alternative
and PWA/offline reviewer remain). Build order deviated from the brief's
strict §15 sequence in a few places — always to keep making real progress
around a temporary blocker (missing AI key, then later a provider switch),
never to cut scope. Every deviation is noted below.

## Phases 1-13 — DONE

- **1 Foundation**: Next.js/Prisma/Supabase, full schema, magic-link auth,
  deployed to Vercel. Verified live in Chrome, local and production.
- **2 Curriculum**: tree editor, keyboard RAG rating, stale-green flagging,
  heatmap, CSV/JSON import/export, syllabus PDF import.
- **3 Unlocking**: topic state machine, mastery evidence + override,
  regression flagging, progression map.
- **4 SRS core**: `lib/srs/sm2.ts`, pure, matches §7.1 exactly, keyboard
  reviewer with undo.
- **5 SRS extended**: formula/type-in/image-occlusion cards, Storage
  upload, tags, bulk ops, leech list.
- **6 Timer**: Pomodoro, streaks. Real AEST timezone bug found + fixed.
- **7 AI layer**: full provider abstraction — **Claude Sonnet 5 primary**
  (Beschy provided a real Anthropic key mid-session and asked to switch
  from the originally-specced Gemini), Gemini secondary, Groq/OpenRouter
  tertiary. Backoff, caching, context builder, request counter, Ask + Hint.
- **8 Teach-back**: Socratic mode, versioned prompt, app-tracked exchange
  counting, `[STATUS:...]` tagging.
- **9 Formulas/assumed knowledge**: both with one-click flashcard
  conversion.
- **10 Calendar/timetable**: **Beschy's call — no Google Calendar OAuth at
  all.** Instead: upload a photo of any calendar/timetable, Claude vision
  extracts every block (school classes matched to subjects, personal
  routine blocks like Gym/Study Hall/UGC Block kept as free-text labels).
  Real data imported from Beschy's actual weekly calendar screenshots —
  86 blocks covering the full week.
- **11 Recommendation engine**: `config/recommendation.ts` coefficients,
  pure `scoreTopicPriority()` with itemised "why" breakdown, `/plan`.
- **12 Past papers**: upload, timed/open/untimed attempts, self-marking,
  AI-assisted marking against the real marking guide text. Verified against
  Beschy's actual 2024 Biology paper + marking guide.
- **13 Reporting**: dashboard (cards due, streak, top priorities), weekly
  review (AI narrative + 3 priorities from real stats, never fabricated),
  analytics (Recharts: 30-day study trend, RAG distribution), CSV export.

Every phase verified against the real Supabase database and, from Phase 7
onward, against the real Claude API — not just "it compiles." Multiple real
bugs found and fixed before they could bite later:

- **Two AEST timezone bugs** (`getStudyStats` streak calc, `getCurrentPeriod`
  day boundary) — both from mixing server-local-timezone logic with UTC-ISO
  date keys. Fixed with `lib/date.ts` pinned to `Australia/Brisbane`.
- **Claude wraps JSON in ` ```json ` fences** even when told not to —
  `stripJsonFences()`, provider-agnostic.
- **Extended thinking silently eats the token budget** — confirmed 6488 of
  8192 tokens went to an empty thinking block on one real call, truncating
  the answer to nothing. Fixed by disabling thinking for jsonMode/vision
  calls specifically.
- **Naive CSV comma-split corrupted rows with commas in the label** (e.g.
  "UGC BLOCK — film, post, verify...") — switched to tab-separated with
  comma fallback.

## Blocked on / needs Beschy

- **Add `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL=claude-sonnet-5` to Vercel**
  — only in local `.env.local` right now, production AI features won't
  work until it's there too.
- **A full live click-through of the whole app is still owed.** Dashboard,
  Study Coach, and card generation were clicked through live in the browser
  during Phase 14 (real magic-link login, real Claude calls) — that's the
  first browser testing since early Phase 1, and it caught a real bug (see
  Phase 14 notes below). Everything before Phase 14 is still only verified
  at the database/API level, not visually. Still the biggest open risk on
  the table, just a smaller one now.
- Supabase email rate limit status unknown (hasn't been retested this
  session).
- Real assessment/target-completion dates still placeholder-null (Phase 11
  factors correctly contribute 0 until these exist).

## Phase 14 — in progress

Done:
- **AI card generation** (`/subjects/[shortCode]/cards/generate`): paste or
  upload notes (PDF/txt via `pdf-parse`), Claude drafts up to 25 basic/cloze
  cards, review queue (edit/uncheck each) before anything saves. Linked
  from the cards page.
- **Study coach mode** (`/coach`): real 14-day stats (hours by subject, RAG
  distribution, card accuracy, recent paper scores) sent to Claude, which
  must cite actual numbers, not generic advice. Verified: analysis
  correctly called out 3.5 hours all going to one subject and zero to the
  other four.
- **Nightly export/backup**: `exportAllData()` dumps every user-scoped
  table flat. `/api/export` = on-demand JSON download (button on
  dashboard). `/api/cron/backup` = same export, run nightly by Vercel Cron
  (`vercel.json`, bearer-token auth via `CRON_SECRET`), uploaded to the
  `backups` Storage bucket.

Not started:
- FSRS as a swappable SM-2 alternative
- PWA/offline reviewer

All three shipped features verified two ways: against the real Supabase DB
and live Claude API via a throwaway script (deleted after — real subject
data, real card generation output, real coach analysis), and then live in
the browser via a real magic-link login. `npm run build` and `npm test`
(72 tests) both pass.

The browser pass caught a real bug: with zero topics imported for a
subject (true for all 5 of Beschy's subjects right now — no curriculum
tree built yet), the card-generation page's topic dropdown rendered empty
but "Generate cards" stayed clickable, silently doing nothing when clicked.
Fixed — now shows "No topics yet — build the curriculum tree first."

Needs Beschy: `ANTHROPIC_API_KEY` is still local-only — add it to Vercel
prod env vars or `/coach` and card generation won't work in production.
