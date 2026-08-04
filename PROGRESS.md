# Progress

Build order deviates from the brief's strict §15 sequence: Phases 7/8 were
blocked on an AI key for most of the session, so completed Phases 9 and 11
(fully unblocked) first. Once Beschy provided a real Anthropic key, went
back and finished 7/8. Everything stays in scope for its original phase —
this is a reordering, not a scope cut.

## Phases 1-9, 11 — DONE

- **Phase 1**: Next.js/Prisma/Supabase scaffold, full schema (RLS-scoped to
  `userId`), magic-link auth, deployed to Vercel. Verified live in Chrome,
  local and production.
- **Phase 2**: Curriculum tree editor, keyboard RAG rating, stale-green
  flagging, heatmap, CSV/JSON import/export, syllabus PDF import.
- **Phase 3**: Topic unlocking, mastery evidence + confirm dialogue with
  override, regression flagging, progression map.
- **Phase 4**: `lib/srs/sm2.ts` — pure SM-2 matching §7.1 exactly, keyboard-
  driven reviewer with undo.
- **Phase 5**: Formula/type-in cards, image occlusion (scoped-down, see
  code comments), Supabase Storage upload, tags, bulk ops, leech list.
- **Phase 6**: Pomodoro timer, streaks. Real timezone bug found and fixed.
- **Phase 7**: Full AI provider abstraction — Anthropic (Claude Sonnet 5)
  primary, Gemini secondary, Groq/OpenRouter tertiary fallback, backoff,
  caching, context builder, request counter. Ask + Hint modes.
- **Phase 8**: Teach-back Socratic mode, versioned prompt
  (`lib/ai/prompts/teach-back.ts`), app-tracked exchange counting,
  `[STATUS:...]` tagging so the app knows definitively when a point
  resolved vs. needed a direct explanation.
- **Phase 9**: Formula sheet + assumed-knowledge vault, both with one-click
  flashcard conversion.
- **Phase 11**: Recommendation engine — `config/recommendation.ts` holds
  every coefficient, pure `scoreTopicPriority()` with an itemised "why"
  breakdown, `/plan` with daily plan generation.

Every phase verified against the real Supabase database (build real data,
run the actual code path, assert, clean up) since browser click-through has
been blocked most of this session — see Blocked On. 72 tests pass
(`npm test`), clean typecheck and production build on every commit.

**AI layer is now live-verified, not just architecturally plausible.**
The moment a real key arrived, ran the actual API: `generateText()` and
`generateJson()` both work correctly; teach-back was tested against a
deliberately WRONG explanation ("F = m + a" for Newton's second law) and
Claude asked a dimensional-analysis question instead of stating the
correction — exactly the brief's core rule — then tested with a correct
explanation and got a warm confirmation plus exactly one extension
question. Found and fixed a real bug in the process: Claude wraps JSON
responses in ` ```json ` fences even when told not to (Gemini's native JSON
mode doesn't have this problem, which is why it wasn't caught earlier) —
added `stripJsonFences()`, provider-agnostic.

**Two real bugs caught and fixed this session, both timezone-related**:
`getStudyStats()`'s streak calc and `getCurrentPeriod()`'s day-boundary
check both originally mixed server-local-timezone logic with UTC-ISO-string
date keys. `lib/date.ts` / `lib/timetable.ts` fix this with
`Intl.DateTimeFormat` pinned to `Australia/Brisbane` (fixed +10:00, no DST)
regardless of what timezone the server process runs in.

## Blocked on (from Beschy)

- **Add `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL=claude-sonnet-5` to
  Vercel** — they're only in local `.env.local` right now. Production AI
  features won't work until this is added there too (same place you added
  the Supabase/other vars originally).
- **Google OAuth credentials** — blocks the Calendar-sync half of Phase 10.
- **Supabase email rate limit** — status unknown, hasn't been retested this
  session. SMTP offer (Resend free tier) still open.
- **School timetable / real assessment dates** — editors work, still empty.
- **A full live click-through of everything since Phase 1 is owed** — every
  phase has been verified at the database/API level via scripts, but not
  through the actual browser UI. Biggest open risk on the table.

## Phases 10 (Calendar), 12-14

Not started, or blocked as noted above (timetable-editor half of 10 is
done). See task list / build brief §15 for scope of each.
