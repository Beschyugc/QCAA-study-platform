import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "@/components/markdown";

function render(md: string): string {
  return renderToStaticMarkup(<Markdown>{md}</Markdown>);
}

// The question bank writes model answers and QCAA sample responses as
// blockquotes, and comparison tables carry most of the working out. Both of
// those render through this component, so a parser that silently drops a
// construct shows up as literal "> " characters in front of every model
// answer in the app.
describe("Markdown blockquotes", () => {
  it("renders a quoted line as a blockquote, not a paragraph with a marker", () => {
    const html = render("> **Strength.** Heavy load, 2-6 reps.");
    expect(html).toContain("<blockquote");
    expect(html).toMatch(/<strong[^>]*>Strength\.<\/strong>/);
    // The marker itself must never survive into the output.
    expect(html).not.toContain("&gt;");
  });

  it("treats a bare > as a paragraph break inside one quote", () => {
    const html = render(["> First point.", ">", "> Second point."].join("\n"));
    expect(html.match(/<blockquote/g)).toHaveLength(1);
    expect(html.match(/<p>/g)).toHaveLength(2);
    expect(html).toContain("First point.");
    expect(html).toContain("Second point.");
  });

  it("ends the quote at the first unquoted line", () => {
    const html = render(["> Quoted.", "", "Not quoted."].join("\n"));
    expect(html.match(/<blockquote/g)).toHaveLength(1);
    expect(html).toContain("Not quoted.");
    // "Not quoted." must sit outside the blockquote element.
    expect(html.split("</blockquote>")[1]).toContain("Not quoted.");
  });

  it("still renders tables and lists alongside quotes", () => {
    const html = render(
      ["> Quote.", "", "| A | B |", "|---|---|", "| 1 | 2 |", "", "- item"].join("\n"),
    );
    expect(html).toContain("<blockquote");
    expect(html).toContain("<table");
    expect(html).toContain("<ul");
    expect(html).toMatch(/<li[^>]*>item<\/li>/);
  });
});

// The Today board links each placement task to its downloadable paper, so a
// renderer that drops [label](href) — or worse, one that turns an arbitrary
// scheme into an anchor — breaks either the download or the injection ceiling.
describe("Markdown links", () => {
  it("renders a same-origin path as an anchor", () => {
    const html = render("Download: [the paper](/api/uploads/placement/x.docx)");
    expect(html).toContain('href="/api/uploads/placement/x.docx"');
    expect(html).toContain("download");
    expect(html).toContain("the paper");
  });

  it("renders an https link with a new-tab target", () => {
    const html = render("[QCAA](https://www.qcaa.qld.edu.au/)");
    expect(html).toContain('href="https://www.qcaa.qld.edu.au/"');
    expect(html).toContain('target="_blank"');
  });

  it("refuses non-https schemes and leaves them as text", () => {
    const html = render("[x](javascript:alert(1))");
    expect(html).not.toContain("<a");
    expect(html).toContain("[x](javascript:alert(1))");
  });

  it("keeps bold inside the label working", () => {
    const html = render("[**PE** paper](/api/uploads/placement/pe.docx)");
    expect(html).toMatch(/<a[^>]*><strong/);
  });
});
