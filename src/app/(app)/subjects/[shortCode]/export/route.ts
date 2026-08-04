import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rowsToCsv, type CurriculumRow } from "@/lib/curriculum-csv";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> },
) {
  const { shortCode } = await params;
  const user = await requireUser();
  const format = request.nextUrl.searchParams.get("format") ?? "json";

  const subject = await prisma.subject.findFirst({
    where: { userId: user.id, shortCode: shortCode.toUpperCase() },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          topics: {
            orderBy: { order: "asc" },
            include: {
              subtopics: {
                orderBy: { order: "asc" },
                include: {
                  learningObjectives: { orderBy: { createdAt: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  if (format === "csv") {
    const rows: CurriculumRow[] = subject.units.flatMap((unit) =>
      unit.topics.flatMap((topic) =>
        topic.subtopics.flatMap((subtopic) =>
          subtopic.learningObjectives.length === 0
            ? [
                {
                  unitNumber: unit.number,
                  unitTitle: unit.title,
                  topicNumber: topic.number,
                  topicTitle: topic.title,
                  subtopicTitle: subtopic.title,
                  objectiveText: "",
                  qcaaReference: "",
                },
              ]
            : subtopic.learningObjectives.map((objective) => ({
                unitNumber: unit.number,
                unitTitle: unit.title,
                topicNumber: topic.number,
                topicTitle: topic.title,
                subtopicTitle: subtopic.title,
                objectiveText: objective.text,
                qcaaReference: objective.qcaaReference ?? "",
              })),
        ),
      ),
    );

    return new NextResponse(rowsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${subject.shortCode}-curriculum.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(subject.units, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${subject.shortCode}-curriculum.json"`,
    },
  });
}
