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
    </Wrap>
  );
}
