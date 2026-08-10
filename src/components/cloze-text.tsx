import { parseCloze } from "@/lib/cloze";
import { InlineMarkdown } from "@/components/markdown";

/**
 * A cloze card, rendered for whichever side is showing.
 *
 * Text runs go through InlineMarkdown so maths inside a cloze sentence still
 * typesets; the deletion itself is rendered separately so it can be blanked
 * on the question side and highlighted on the answer side.
 */
export function ClozeText({
  text,
  revealed,
}: {
  text: string;
  revealed: boolean;
}) {
  return (
    <>
      {parseCloze(text).map((segment, i) => {
        if (segment.kind === "text") {
          return <InlineMarkdown key={i}>{segment.text}</InlineMarkdown>;
        }
        if (!revealed) {
          return (
            <span
              key={i}
              className="mx-0.5 rounded bg-[color:var(--surface-raised)] px-2 py-0.5 text-[color:var(--text-muted)]"
            >
              {segment.hint ? `[${segment.hint}]` : "[...]"}
            </span>
          );
        }
        return (
          <span
            key={i}
            className="mx-0.5 rounded bg-sky-500/15 px-1.5 py-0.5 font-medium text-sky-300"
          >
            <InlineMarkdown>{segment.answer}</InlineMarkdown>
          </span>
        );
      })}
    </>
  );
}
