# Progress

13 of 14 phases done. Only Phase 14 (polish: AI card gen, study coach mode,
FSRS alternative, exports, PWA/offline) remains. Build order deviated from
the brief's strict §15 sequence in a few places — always to keep making
real progress around a temporary blocker (missing AI key, then later a
provider switch), never to cut scope. Every deviation is noted below.

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
- **A full live click-through of the whole app is still owed.** Every
  phase has been verified at the database/API level via scripts (and now
  against real personal data — real timetable, real past paper), but the
  actual browser UI itself hasn't been clicked through since early Phase 1.
  This is the single biggest open risk on the table.
- Supabase email rate limit status unknown (hasn't been retested this
  session).
- Real assessment/target-completion dates still placeholder-null (Phase 11
  factors correctly contribute 0 until these exist).

## Phase 14 — not started

AI card generation from notes, study coach mode, FSRS as a swappable SM-2
alternative, nightly full-DB export, PWA/offline reviewer. See build brief
§15 for scope.
