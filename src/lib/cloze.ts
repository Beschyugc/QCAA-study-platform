// Anki cloze syntax: {{c1::answer}} or {{c1::answer::hint}}.
//
// Cards are stored with the markers intact so the same string can render as
// both the question (deletion hidden) and the answer (deletion shown). Without
// this, a cloze card prints its own answer on the front and tests nothing.

// [\s\S] rather than . with the /s flag: a deletion can span newlines, and
// the /s flag needs an es2018 target this project doesn't set.
const CLOZE_RE = /\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g;

export type ClozeSegment =
  | { kind: "text"; text: string }
  | { kind: "deletion"; ordinal: number; answer: string; hint?: string };

export function hasCloze(text: string): boolean {
  CLOZE_RE.lastIndex = 0;
  return CLOZE_RE.test(text);
}

/** Split a cloze string into literal text and deletion segments, in order. */
export function parseCloze(text: string): ClozeSegment[] {
  const segments: ClozeSegment[] = [];
  let lastIndex = 0;

  CLOZE_RE.lastIndex = 0;
  for (let m = CLOZE_RE.exec(text); m !== null; m = CLOZE_RE.exec(text)) {
    if (m.index > lastIndex) {
      segments.push({ kind: "text", text: text.slice(lastIndex, m.index) });
    }
    segments.push({
      kind: "deletion",
      ordinal: Number(m[1]),
      answer: m[2],
      ...(m[3] ? { hint: m[3] } : {}),
    });
    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", text: text.slice(lastIndex) });
  }
  return segments;
}

/** Every distinct deletion number in the text, ascending. */
export function clozeOrdinals(text: string): number[] {
  const seen = new Set<number>();
  for (const seg of parseCloze(text)) {
    if (seg.kind === "deletion") seen.add(seg.ordinal);
  }
  return [...seen].sort((a, b) => a - b);
}

/**
 * The card with its deletions removed. A hint, where present, shows in place
 * of the answer — that's the point of writing one.
 *
 * `ordinal` limits blanking to a single deletion (Anki generates one card per
 * ordinal); omitting it blanks them all, which is the right behaviour when one
 * note maps to one card.
 */
export function clozeQuestion(text: string, ordinal?: number): string {
  return parseCloze(text)
    .map((seg) => {
      if (seg.kind === "text") return seg.text;
      if (ordinal !== undefined && seg.ordinal !== ordinal) return seg.answer;
      return seg.hint ? `[${seg.hint}]` : "[...]";
    })
    .join("");
}

/** The card with every deletion filled back in. */
export function clozeAnswer(text: string): string {
  return parseCloze(text)
    .map((seg) => (seg.kind === "text" ? seg.text : seg.answer))
    .join("");
}
