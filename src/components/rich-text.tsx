"use client";

import { Latex } from "./latex";

// Splits on $$...$$ (block) and $...$ (inline) LaTeX delimiters, rendering
// everything else as plain text. Good enough for AI responses that follow
// the prompts/*.ts instruction to wrap math in dollar signs — not a full
// Markdown renderer.
export function RichText({ text }: { text: string }) {
  const blockSplit = text.split(/\$\$([\s\S]+?)\$\$/g);

  return (
    <>
      {blockSplit.map((chunk, i) =>
        i % 2 === 1 ? (
          <div key={i} className="my-2">
            <Latex block>{chunk}</Latex>
          </div>
        ) : (
          <InlineLatexText key={i} text={chunk} />
        ),
      )}
    </>
  );
}

function InlineLatexText({ text }: { text: string }) {
  const parts = text.split(/\$(.+?)\$/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => (i % 2 === 1 ? <Latex key={i}>{part}</Latex> : part))}
    </span>
  );
}
