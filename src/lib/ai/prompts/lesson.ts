/**
 * Teaches one topic, from that topic's real QCAA learning objectives.
 *
 * This is the Learn section: not a summary of notes Beschy already has, but
 * an explanation built directly from what the syllabus says he must be able to
 * do. The objectives ARE the assessment spec, so a lesson that covers them
 * covers the exam.
 *
 * Structured dot point by dot point (one syllabus objective at a time — what
 * it means, why it's assessed, what a question on it looks like) rather than
 * grouped prose, because that is literally how the exam is built: one
 * objective, one set of marks. Reading the topic as a block of prose and
 * reading it as "here is dot point 4, here is what it wants from you" produce
 * different exam answers.
 *
 * Deliberately not Socratic — teach-back already does that. Here the job is
 * plain exposition he can read once and come back to.
 */
import { qcaaSystemPrompt } from "./qcaa";
import { DIAGRAM_IDS } from "@/config/diagrams";

export function lessonPrompt(
  subjectName: string,
  unitTitle: string,
  topicTitle: string,
  objectives: string[],
): string {
  return `${qcaaSystemPrompt(`Your job right now: teach one topic of ${subjectName} in full, as a lesson to read and come back to.`)}

Unit: ${unitTitle}
Topic: ${topicTitle}

Teach this topic so that afterwards the student can do every one of the syllabus objectives listed below. Write it as a lesson to read, not a summary of one.

Structure it exactly like this, using Markdown:

## The short version
Three or four sentences: what this topic is actually about and why it exists in the course.

## Dot point by dot point
Work through EVERY syllabus objective listed below, one at a time, in order, each as its own \`### <the objective, verbatim or lightly shortened>\`. Under each one, write exactly three short parts, as bold lead-ins on their own line followed by the content — not as a table:

**What it means** — plain-language explanation of the idea itself. Define every technical term the first time it appears.

**Why it matters** — why this specific idea is in the syllabus: what it explains, what it connects to elsewhere in the course, or what real judgement it trains.

**What a question on this looks like** — the QCAA cognitive verb this objective is normally examined with (identify/describe/explain/analyse/evaluate/etc — pick the one the objective's own wording implies) and one short example of the shape a real question would take, e.g. "Explain [3 marks]: ..." Do not write a full worked answer here — that is what Cards and Practice are for. Just show what is being asked and why that verb demands more than the previous one would.

Where two adjacent dot points are commonly confused (e.g. two similar-sounding terms), say so explicitly under the second one rather than leaving the reader to notice.

Where a visual would genuinely help — a process with steps, a comparison, a structure with parts — and ONE of these exact diagram ids fits, embed it on its own line using this exact syntax (nothing else on those lines):
:::diagram <id>
<one-sentence caption>
:::
Available ids (use only these, and only where they actually fit — do not force one in): ${DIAGRAM_IDS.join(", ") || "(none available yet)"}.
If nothing fits, don't include a diagram block for that dot point — a missing diagram is fine, a wrong one is not.

## Where marks get lost
Three to five specific mistakes students make in this topic — misapplied definitions, confusing related terms, answering with the wrong command verb. Be concrete.

## Check yourself
Five short questions, hardest last, each with the answer underneath in *italics*. These are for self-testing, so no multiple choice.

Rules:
- Use the syllabus's own terminology throughout — that is the wording the exam uses.
- The syllabus objectives below are the authority for WHAT is assessable. For explaining WHY something works the way it does, or general background that deepens understanding without changing scope, you may draw on your own broader knowledge — but say so plainly ("beyond what the syllabus requires, but useful context:") so it's never mistaken for something the exam will test.
- Do not invent syllabus content, exam structure, or QCAA-specific claims (mark allocations, command verbs used in past papers, etc.) beyond what's given here.
- No preamble, no "in this lesson we will". Start at the first heading.
- Australian spelling.

Syllabus objectives for this topic (teach ALL of them, in this order):
${objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
}
