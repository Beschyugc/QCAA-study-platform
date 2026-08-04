# Progress

Live at **https://qcaa-study-platform.vercel.app**

The app is now loaded with Beschy's real course: all five QCAA syllabuses
imported, 593 flashcards generated from the actual learning objectives, and a
left-rail navigation with a hub per subject.

## What's in the database (real, not sample)

| | |
|---|---|
| Subjects | 5 — Methods, Biology, Psychology, English, PE |
| Units | 10 (Unit 3 and Unit 4 per subject) |
| Topics | 29 |
| Learning objectives | 422, QCAA wording verbatim |
| Flashcards | 593, generated from those objectives |
| Timetable blocks | 86, from Beschy's own calendar screenshots |
| Unlock state | 5 active (U3 T1 each), 24 locked |

Source: `School work for claude/1Schoolwork/.../QCAA_External_Past_Papers_2020-2024`,
the "2025 syllabus for 2026 EA" editions — the ones that actually govern his
external assessment. That archive also holds 5 years of past papers and
marking guides per subject (160 PDFs) which are **not yet imported**.

## Structure

Left rail: Dashboard · Methods · Biology · Psychology · English · PE · Timer ·
Ask AI. Each subject row carries its live due-card count.

**Dashboard** — Next Departure (next class or study block, one click to a
running timer already tagged to the right subject and topic), Today with a
week strip, the after-school evening, This Afternoon from the recommendation
engine with a `why?` showing the real scoring numbers, the network map, and a
row per subject showing position, pace and cards due.

**Each subject** — Overview (every topic in unlock order with its red/amber/
green control), Learn, Cards, Syllabus, Ask AI.

- **Learn** writes a lesson per topic from that topic's real objectives:
  what it is, what you must be able to do, the content, where marks get lost,
  and self-test questions. Cached on `TopicLesson`, keyed by a hash of the
  objective text so it only regenerates if the syllabus changes.
- **Cards** is the Anki reviewer, serving a daily set of 10-20 scaled by RAG
  (`config/daily.ts`), topped up with new cards so no subject is ever empty.
- **Red/amber/green** writes to the learning objectives — the same field the
  recommendation engine scores on, so a rating immediately changes what the
  planner suggests rather than feeding a parallel system.
- **Placement** (`/placement`) asks two questions on every topic in a subject,
  including locked ones, marks them, and writes real ratings. Verified against
  the live API: a correct answer plus a blank came back amber with the gap
  named; vague answers red; all-blank red.

## Blocked on / needs Beschy

- **`ANTHROPIC_API_KEY` is still not in Vercel.** Everything that doesn't need
  AI works in production right now — dashboard, timetable, card review,
  RAG rating, timer, unlocking. Everything that does — writing lessons,
  placement, the tutor, the coach, card generation — will fail at school until
  the key is added under Settings → Environment Variables (plus
  `ANTHROPIC_MODEL=claude-sonnet-5`), followed by a redeploy.
- **Beschy's Wednesday P1 English isn't linked to the subject** — it was
  imported as free text, `"ENG (EARLY — leave 7:30!)"`. The dashboard reads the
  leading `ENG` off the label and marks it as a guess (dashed `ENG?` tag).
  Linking it properly makes the guess unnecessary.
- **P5 has Psychology and PE booked simultaneously** on Wednesday. Rotation
  week, or an import artefact — unresolved, so both render with a clash
  warning rather than one being picked. (P4's apparent clash is not one:
  "Cert III Fitness" classifies as routine, so that slot is just Biology.)
- **No target completion dates**, so pace is measured relative to his other
  subjects rather than against a deadline. The UI says which basis it's using.
  Setting real assessment dates switches it to true required-vs-actual pace.
- **Nothing is rated yet** — all 422 objectives are `unrated`. Running
  placement per subject is the fastest way to fix that, and it's what makes
  the planner and the daily card targets meaningful.

## Bugs found and fixed while building this

- **`generateJson` capped output at 8192 tokens.** A full Unit 3+4 syllabus
  extraction runs 12-20k, so it returned truncated, unparseable JSON and threw
  an error that looked like a bad PDF. `max_tokens` is now a caller option, and
  above the default the request streams (the SDK refuses long non-streaming
  calls outright).
- **`replaceCurriculumTree` wrote row by row inside a transaction.** Against
  remote Supabase that's one round trip per row; Psychology (95 objectives)
  and English (94) both blew Prisma's 5s interactive-transaction ceiling and
  rolled back, so those two subjects were *impossible* to import. Now four
  bulk inserts. `saveGeneratedCards` had the identical bug.
- **Locked topics showed "22 due"** next to cards that can't be opened.
- **"Master U4 T0 to unlock"** — the unlock gate is the previous topic in the
  subject, not in the unit.
- **Lessons rendered raw LaTeX** (`$\frac{dy}{dx}$`) and pipe tables. The
  Markdown renderer now handles inline maths, display maths and tables via
  KaTeX. Cards do too — previously only `cardType: "formula"` typeset, so a
  basic Methods card printed `$e^{2x}$` verbatim.
- **The palette shipped two identical lines.** `--line-psych` and `--line-pe`
  were dE76 **0.4** apart under deuteranopia — the same colour for the most
  common colour-vision deficiency. Deepened to `#8B5CF6` / `#2E96E8`, taking
  the worst dichromat pair to 17.8. `src/config/tokens.test.ts` re-derives
  every contrast and CVD number so the palette can't silently regress.

## Scripts

- `npx tsx scripts/import-syllabuses.ts [--write] [MM BIO ...]`
- `npx tsx scripts/generate-cards.ts [--write] [MM BIO ...]`

Both dry-run by default — `replaceCurriculumTree` deletes before it writes —
and both cache AI output under `scripts/.*-cache/` so a failed run doesn't mean
paying for the generation twice.

## Not built yet

- Past papers and marking guides from the archive (160 PDFs, ready to import)
- Past Questions as a separate drillable thing from whole papers
- Daily Questions per subject
- XP, levels, streaks, achievements — no schema for any of it
- FSRS as an SM-2 alternative; PWA/offline reviewer
- Responsive pass is written but unverified at phone width
