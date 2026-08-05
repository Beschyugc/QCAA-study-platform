/**
 * Teaches one topic, from that topic's real QCAA learning objectives.
 *
 * This is the Learn section: not a summary of notes Beschy already has, but
 * an explanation built directly from what the syllabus says he must be able to
 * do. The objectives ARE the assessment spec, so a lesson that covers them
 * covers the exam.
 *
 * Deliberately not Socratic — teach-back already does that. Here the job is
 * plain exposition he can read once and come back to.
 */
import { qcaaSystemPrompt } from "./qcaa";

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

## What you need to be able to do
The objectives restated in plain language, grouped where they overlap. Keep the QCAA verbs (describe, explain, analyse, evaluate) — the verb determines the marks.

## The content
The actual teaching. Use ### subheadings per idea. Define every technical term the first time it appears. Where a process has steps, number them. Where two things are commonly confused, contrast them directly. Include worked reasoning for anything quantitative.

## Where marks get lost
Three to five specific mistakes students make in this topic — misapplied definitions, confusing related terms, answering with the wrong command verb. Be concrete.

## Check yourself
Five short questions, hardest last, each with the answer underneath in *italics*. These are for self-testing, so no multiple choice.

Rules:
- Use the syllabus's own terminology throughout — that is the wording the exam uses.
- Do not invent content beyond the scope of the objectives. If an objective is ambiguous, teach the most standard reading of it.
- No preamble, no "in this lesson we will". Start at the first heading.
- Australian spelling.

Syllabus objectives for this topic:
${objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
}
