// Extracts a QCAA syllabus's unit -> topic -> subtopic -> learning objective
// hierarchy from raw PDF text. Output is never written directly to the DB —
// the caller always shows it in an editable review table first (§5.1: "PDF
// extraction will get things wrong and I need to fix it without touching
// SQL").
export function syllabusExtractionPrompt(subjectName: string, text: string) {
  return `You are extracting the curriculum structure from a QCAA General senior syllabus document for "${subjectName}".

Return ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:

[
  {
    "number": 3,
    "title": "Unit title",
    "topics": [
      {
        "number": 1,
        "title": "Topic title",
        "subtopics": [
          {
            "title": "Subtopic title",
            "learningObjectives": [
              { "text": "Objective text", "qcaaReference": "e.g. AC1.1 if the syllabus labels it, else null" }
            ]
          }
        ]
      }
    ]
  }
]

Rules:
- Only extract Unit 3 and Unit 4 (senior/Year 12 content) — skip Unit 1/2 if present.
- "number" for units is the unit number (3 or 4); "number" for topics is the topic's position within its unit, starting at 1.
- Preserve the syllabus's own wording for objectives — do not paraphrase or summarise.
- If the source text doesn't clearly show a subtopic level, use a single subtopic per topic titled "General".
- If you are not confident about a boundary (e.g. where one topic ends and the next begins), make your best judgement — the user reviews and corrects this output before anything is saved.

Syllabus text:
"""
${text}
"""`;
}
