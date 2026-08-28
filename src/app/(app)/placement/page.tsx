import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LINE_ORDER, type SubjectCode } from "@/config/tokens";
import { Wrap, Zone } from "@/components/dashboard/shell";
import { PlacementClient } from "./placement-client";

export const dynamic = "force-dynamic";

export default async function PlacementPage() {
  const user = await requireUser();

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      units: {
        include: {
          topics: {
            include: {
              subtopics: {
                include: { learningObjectives: { select: { ragStatus: true } } },
              },
            },
          },
        },
      },
    },
  });

  const rows = LINE_ORDER.map((code) => {
    const subject = subjects.find((s) => s.shortCode === code);
    const topics = subject?.units.flatMap((u) => u.topics) ?? [];
    const objectives = topics.flatMap((t) => t.subtopics.flatMap((s) => s.learningObjectives));
    return {
      code: code as SubjectCode,
      topics: topics.length,
      // Dot points, not topics — that's what the paper is built and sized
      // against now, so it's what the button has to be honest about.
      objectives: objectives.length,
      rated: objectives.filter((o) => o.ragStatus !== "unrated").length,
    };
  });

  return (
    <Wrap>
      <Zone eyebrow="Placement">
        <h1 className="font-display text-2xl font-medium text-[color:var(--text)]">
          Work out my level
        </h1>
        <div className="mt-3">
          <PlacementClient subjects={rows} />
        </div>
      </Zone>

      {/* The paper placement route: Claude-written Word papers, sat away from
          the screen, photographed into "02 My Work" and marked by hand. Served
          from the same private bucket as the past papers so they're reachable
          from any device, not just the machine they were written on. */}
      <Zone eyebrow="Paper placement">
        <h2 className="font-display text-lg font-medium text-[color:var(--text)]">
          Sit it on paper instead
        </h2>
        <p className="mt-1 max-w-xl text-sm text-[color:var(--text-muted)]">
          Download the placement paper, sit the starred questions under exam conditions,
          photograph every page, and tell Claude where the photos are. If you don&apos;t know
          something, write <strong>&ldquo;no idea&rdquo;</strong> — a lucky guess marks a topic
          green and it never comes back to you.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEMENT_PAPERS.map((paper) => (
            <li key={paper.slug}>
              <a
                href={`/api/uploads/placement/placement-test-${paper.slug}.docx`}
                download
                className="block rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm font-medium text-[color:var(--text)] transition-colors hover:border-[color:var(--text-faint)]"
              >
                {paper.name}
                <span className="mt-0.5 block text-xs font-normal text-[color:var(--text-faint)]">
                  Word document · sit on paper, then photograph
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Zone>
    </Wrap>
  );
}

const PLACEMENT_PAPERS = [
  { slug: "english", name: "English" },
  { slug: "physical-education", name: "Physical Education" },
  { slug: "biology", name: "Biology" },
  { slug: "mathematical-methods", name: "Mathematical Methods" },
  { slug: "psychology", name: "Psychology" },
];
