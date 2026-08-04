import type { ReactNode } from "react";

/**
 * Minimal Markdown renderer for AI-generated lessons.
 *
 * Builds React elements rather than setting innerHTML, so model output can
 * never inject markup — there is no HTML parsing step to exploit. It handles
 * exactly the subset the lesson prompt asks for (h2/h3, paragraphs, ordered
 * and unordered lists, bold, italic, inline code) and renders anything else as
 * plain text. That is a deliberate ceiling: a general Markdown dependency
 * would bring HTML passthrough with it.
 */

// One member per kind rather than a member with a union discriminant —
// TypeScript can only narrow this shape down to `never` after all the text
// cases are handled, which is what lets the list branch typecheck.
type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function parse(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "p", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: heading[1].length === 2 ? "h2" : "h3", text: heading[2] });
      continue;
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ordered) {
      flushParagraph();
      if (list?.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      if (list?.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  return blocks;
}

/** Bold, italic and inline code. Emitted as elements, never as HTML. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) {
      out.push(
        <strong key={key} className="font-semibold text-[color:var(--text)]">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      out.push(
        <code
          key={key}
          className="rounded bg-[color:var(--surface-raised)] px-1 py-0.5 font-data text-[0.9em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      out.push(
        <em key={key} className="text-[color:var(--text-muted)]">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ children }: { children: string }) {
  const blocks = parse(children);

  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-[color:var(--text-muted)]">
      {blocks.map((block, i) => {
        if (block.kind === "h2") {
          return (
            <h2
              key={i}
              className="signage mt-4 font-display text-xs font-bold first:mt-0"
              style={{ color: "var(--line-bright)" }}
            >
              {block.text}
            </h2>
          );
        }
        if (block.kind === "h3") {
          return (
            <h3 key={i} className="mt-2 font-display text-base font-medium text-[color:var(--text)]">
              {block.text}
            </h3>
          );
        }
        if (block.kind === "p") {
          return <p key={i}>{inline(block.text, `p${i}`)}</p>;
        }
        const List = block.kind === "ol" ? "ol" : "ul";
        return (
          <List
            key={i}
            className={`ml-5 flex flex-col gap-1.5 ${
              block.kind === "ol" ? "list-decimal" : "list-disc"
            }`}
          >
            {block.items.map((item, j) => (
              <li key={j} className="pl-1">
                {inline(item, `l${i}-${j}`)}
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
