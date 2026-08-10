import type { ReactNode } from "react";
import { Latex } from "@/components/latex";
import { LessonDiagram } from "@/components/lesson-diagrams";

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
  | { kind: "ol"; items: string[] }
  | { kind: "math"; tex: string }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "diagram"; id: string; caption: string };

/** `| a | b |` -> ["a", "b"], tolerating missing outer pipes. */
function splitRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

const isTableRow = (line: string) => /\|/.test(line) && line.trim().startsWith("|");
const isTableDivider = (line: string) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && /-/.test(line);

function parse(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown
    .replace(/\r\n/g, "\n")
    // Display maths written inline on one line ($$...$$) is pulled onto its
    // own line first, so the block loop below sees it cleanly.
    .replace(/\$\$([^$]+)\$\$/g, "\n$$$$$1$$$$\n")
    .split("\n");
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

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trimEnd();

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    // Display maths on its own line.
    const display = line.trim().match(/^\$\$(.+)\$\$$/);
    if (display) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "math", tex: display[1].trim() });
      continue;
    }

    // :::diagram <id> ... ::: — a named visual, see lesson-diagrams.tsx.
    // The id is resolved against a fixed component registry there, never
    // interpreted as markup, so this can't become an HTML-injection path.
    const diagramStart = line.trim().match(/^:::diagram\s+(\S+)\s*$/);
    if (diagramStart) {
      flushParagraph();
      flushList();
      const captionLines: string[] = [];
      let cursor = index + 1;
      while (cursor < lines.length && lines[cursor].trim() !== ":::") {
        if (lines[cursor].trim() !== "") captionLines.push(lines[cursor].trim());
        cursor++;
      }
      blocks.push({ kind: "diagram", id: diagramStart[1], caption: captionLines.join(" ") });
      index = cursor; // land on the closing ::: line; the loop's index++ moves past it
      continue;
    }

    // A table is a header row, a divider, then body rows. Without the
    // divider it's just a paragraph containing pipes, and treating it as a
    // table would mangle it.
    if (isTableRow(line) && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      flushParagraph();
      flushList();
      const header = splitRow(line);
      const rows: string[][] = [];
      let cursor = index + 2;
      while (cursor < lines.length && isTableRow(lines[cursor])) {
        rows.push(splitRow(lines[cursor]));
        cursor++;
      }
      blocks.push({ kind: "table", header, rows });
      index = cursor - 1;
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

/**
 * Bold, italic, inline code and inline maths.
 *
 * Maths is matched FIRST in the alternation so a LaTeX expression containing
 * asterisks or underscores isn't shredded by the emphasis rules before KaTeX
 * ever sees it. Without this, `$a^*_1$` renders as garbage.
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\$[^$\n]+\$|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("$")) {
      out.push(<Latex key={key}>{token.slice(1, -1)}</Latex>);
    } else if (token.startsWith("**")) {
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

/**
 * Rich text without the block structure: maths, bold, italic, code.
 *
 * For places that are a single run of text rather than a document — flashcard
 * fronts and backs, mainly. A card that says "differentiate $e^{2x}$" should
 * typeset the maths without the surrounding paragraph machinery.
 */
export function InlineMarkdown({ children }: { children: string }) {
  return <>{inline(children, "i")}</>;
}

export function Markdown({ children }: { children: string }) {
  const blocks = parse(children);

  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-[color:var(--text-muted)]">
      {blocks.map((block, i) => {
        {
          /* Headings run through inline() too — they routinely contain maths
             ("Why $e$ exists"), and skipping it left raw LaTeX in the one
             place the eye lands first. */
        }
        if (block.kind === "h2") {
          return (
            <h2
              key={i}
              className="signage mt-4 font-display text-xs font-bold first:mt-0"
              style={{ color: "var(--line-bright)" }}
            >
              {inline(block.text, `h2-${i}`)}
            </h2>
          );
        }
        if (block.kind === "h3") {
          return (
            <h3 key={i} className="mt-2 font-display text-base font-medium text-[color:var(--text)]">
              {inline(block.text, `h3-${i}`)}
            </h3>
          );
        }
        if (block.kind === "p") {
          return <p key={i}>{inline(block.text, `p${i}`)}</p>;
        }
        if (block.kind === "math") {
          // Long expressions scroll rather than overflowing the card.
          return (
            <div key={i} className="overflow-x-auto py-1 text-center">
              <Latex block>{block.tex}</Latex>
            </div>
          );
        }
        if (block.kind === "diagram") {
          return <LessonDiagram key={i} id={block.id} caption={block.caption} />;
        }
        if (block.kind === "table") {
          return (
            <div key={i} className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {block.header.map((cell, j) => (
                      <th
                        key={j}
                        className="border-b border-[color:var(--hairline)] px-2.5 py-1.5 text-left font-semibold text-[color:var(--text)]"
                      >
                        {inline(cell, `th${i}-${j}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td
                          key={c}
                          className="border-b border-[color:color-mix(in_srgb,var(--hairline)_55%,transparent)] px-2.5 py-1.5"
                        >
                          {inline(cell, `td${i}-${r}-${c}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
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
