/**
 * Restores the whole curriculum tree, every flashcard, assumed knowledge,
 * the timetable and past-paper metadata from the export produced by the old
 * Supabase-backed deployment (`[C] qcaa-database-export.json`, one level
 * above app/) into this local SQLite database. No AI calls, no cost — this
 * is the same 3,532-card / 422-objective / 29-lesson dataset PROGRESS.md
 * describes, just moved off Supabase.
 *
 * Run: npx tsx scripts/restore-from-export.ts [--write]
 *
 * Dry run by default — reports counts only. --write actually inserts.
 *
 * Every row keeps its original id from the export (so cross-references
 * inside the export stay valid with zero remapping) but has userId
 * rewritten to "local" — the export's userId was a Supabase auth.users
 * UUID that no longer means anything here.
 *
 * CardScheduling isn't in the export (export-everything.ts never selected
 * it), so every card gets a fresh initialState() — due immediately, as if
 * newly added. Actual review history from the old deployment is gone; only
 * content survives, which is what this script is for.
 *
 * Past-paper *files* are not in the export (they lived in Supabase
 * Storage). This restores the metadata (year, paper name, marks) and points
 * questionPaperPath/mcPaperPath/markingGuidePath at where a re-uploaded file
 * WOULD resolve under the new local storage layout
 * (past-papers/local/<uuid>.pdf) — so dropping the real PDFs there later
 * makes them work with no further changes. Until then they 404.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { join } from "node:path";

const WRITE = process.argv.includes("--write");
const LOCAL_USER_ID = "local";
const EXPORT_PATH = join(__dirname, "..", "..", "[C] qcaa-database-export.json");

type Json = Record<string, unknown>;

function withLocalUser<T extends Json>(row: T): T & { userId: string } {
  return { ...row, userId: LOCAL_USER_ID };
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { initialState } = await import("../src/lib/srs/sm2");

  const raw = readFileSync(EXPORT_PATH, "utf-8");
  const data = JSON.parse(raw) as {
    subjects: any[];
    cards: any[];
    assumed: any[];
    timetable: any[];
    papers: any[];
  };

  const units = data.subjects.flatMap((s) => s.units ?? []);
  const topics = units.flatMap((u) => u.topics ?? []);
  const subtopics = topics.flatMap((t) => t.subtopics ?? []);
  const objectives = subtopics.flatMap((st) => st.learningObjectives ?? []);
  const lessons = topics.filter((t) => t.lesson).map((t) => t.lesson);

  console.log("EXPORT CONTENTS");
  console.log(`  subjects: ${data.subjects.length}`);
  console.log(`  units: ${units.length}`);
  console.log(`  topics: ${topics.length}`);
  console.log(`  subtopics: ${subtopics.length}`);
  console.log(`  learning objectives: ${objectives.length}`);
  console.log(`  lessons: ${lessons.length}`);
  console.log(`  cards: ${data.cards.length}`);
  console.log(`  assumed knowledge: ${data.assumed.length}`);
  console.log(`  timetable blocks: ${data.timetable.length}`);
  console.log(`  past papers (metadata only, no files): ${data.papers.length}`);

  if (!WRITE) {
    console.log("\nDry run — nothing written. Re-run with --write to import.");
    await prisma.$disconnect();
    return;
  }

  // Curriculum tables cascade from Subject (onDelete: Cascade all the way
  // down through Unit -> Topic -> Subtopic -> LearningObjective/Card), so
  // clearing Subject clears everything under it in one statement. Cards
  // also cascade, taking CardScheduling with them.
  await prisma.subject.deleteMany({ where: { userId: LOCAL_USER_ID } });
  await prisma.assumedKnowledge.deleteMany({ where: { userId: LOCAL_USER_ID } });
  await prisma.timetableBlock.deleteMany({ where: { userId: LOCAL_USER_ID } });
  await prisma.pastPaper.deleteMany({ where: { userId: LOCAL_USER_ID } });

  await prisma.subject.createMany({
    data: data.subjects.map((s) =>
      withLocalUser({
        id: s.id,
        name: s.name,
        shortCode: s.shortCode,
        priorityWeight: s.priorityWeight,
        colour: s.colour,
        isActive: s.isActive,
        targetCompletionDate: s.targetCompletionDate,
        nextAssessmentDate: s.nextAssessmentDate,
      }),
    ),
  });
  console.log(`wrote ${data.subjects.length} subjects`);

  await prisma.unit.createMany({
    data: units.map((u) =>
      withLocalUser({
        id: u.id,
        subjectId: u.subjectId,
        number: u.number,
        title: u.title,
        order: u.order,
      }),
    ),
  });
  console.log(`wrote ${units.length} units`);

  await prisma.topic.createMany({
    data: topics.map((t) =>
      withLocalUser({
        id: t.id,
        unitId: t.unitId,
        number: t.number,
        title: t.title,
        order: t.order,
        unlockState: t.unlockState,
        needsReview: t.needsReview,
        unlockedAt: t.unlockedAt,
        masteredAt: t.masteredAt,
      }),
    ),
  });
  console.log(`wrote ${topics.length} topics`);

  await prisma.subtopic.createMany({
    data: subtopics.map((st) =>
      withLocalUser({
        id: st.id,
        topicId: st.topicId,
        title: st.title,
        order: st.order,
      }),
    ),
  });
  console.log(`wrote ${subtopics.length} subtopics`);

  await prisma.learningObjective.createMany({
    data: objectives.map((o) =>
      withLocalUser({
        id: o.id,
        subtopicId: o.subtopicId,
        text: o.text,
        qcaaReference: o.qcaaReference,
        ragStatus: o.ragStatus,
        ragUpdatedAt: o.ragUpdatedAt,
        ragHistory: JSON.stringify(o.ragHistory ?? []),
      }),
    ),
  });
  console.log(`wrote ${objectives.length} learning objectives`);

  await prisma.topicLesson.createMany({
    data: lessons.map((l) =>
      withLocalUser({
        id: l.id,
        topicId: l.topicId,
        markdown: l.markdown,
        objectivesHash: l.objectivesHash,
        model: l.model,
      }),
    ),
  });
  console.log(`wrote ${lessons.length} lessons`);

  const CHUNK = 500;
  let cardsWritten = 0;
  for (let i = 0; i < data.cards.length; i += CHUNK) {
    const chunk = data.cards.slice(i, i + CHUNK);
    const init = initialState();
    await prisma.$transaction(async (tx) => {
      await tx.card.createMany({
        data: chunk.map((c: any) =>
          withLocalUser({
            id: c.id,
            subjectId: c.subjectId,
            topicId: c.topicId,
            subtopicId: c.subtopicId ?? null,
            objectiveId: c.objectiveId ?? null,
            cardType: c.cardType,
            complexity: c.complexity ?? null,
            front: c.front,
            back: c.back,
            extra: c.extra ?? null,
            tags: JSON.stringify(Array.isArray(c.tags) ? c.tags : []),
            isSuspended: c.isSuspended ?? false,
          }),
        ),
      });
      await tx.cardScheduling.createMany({
        data: chunk.map((c: any) => ({
          userId: LOCAL_USER_ID,
          cardId: c.id,
          dueDate: new Date(),
          intervalDays: init.intervalDays,
          easeFactor: init.easeFactor,
          repetitions: init.repetitions,
          lapses: init.lapses,
          learningStep: init.learningStep,
          state: init.state,
        })),
      });
    });
    cardsWritten += chunk.length;
    console.log(`  cards: ${cardsWritten}/${data.cards.length}`);
  }

  await prisma.assumedKnowledge.createMany({
    data: data.assumed.map((a) =>
      withLocalUser({
        id: a.id,
        subjectId: a.subjectId,
        category: a.category,
        prompt: a.prompt,
        answer: a.answer,
        latex: a.latex ?? null,
        notes: a.notes ?? null,
      }),
    ),
  });
  console.log(`wrote ${data.assumed.length} assumed-knowledge entries`);

  await prisma.timetableBlock.createMany({
    data: data.timetable.map((t) =>
      withLocalUser({
        id: t.id,
        dayOfWeek: t.dayOfWeek,
        periodName: t.periodName,
        subjectId: t.subjectId ?? null,
        label: t.label ?? null,
        startTime: t.startTime,
        endTime: t.endTime,
        room: t.room ?? null,
      }),
    ),
  });
  console.log(`wrote ${data.timetable.length} timetable blocks`);

  await prisma.pastPaper.createMany({
    data: data.papers.map((p) =>
      withLocalUser({
        id: p.id,
        subjectId: p.subjectId,
        year: p.year,
        paperName: p.paperName,
        // Points at where a re-uploaded file would land under the new local
        // storage layout. Nothing is there yet — see the file header.
        questionPaperPath: `past-papers/local/${p.id}-question.pdf`,
        mcPaperPath: p.mcPaperPath ? `past-papers/local/${p.id}-mc.pdf` : null,
        markingGuidePath: p.markingGuidePath
          ? `past-papers/local/${p.id}-marking-guide.pdf`
          : null,
        totalMarks: p.totalMarks ?? 0,
        hasMarkingGuide: Boolean(p.hasMarkingGuide),
      }),
    ),
  });
  console.log(`wrote ${data.papers.length} past-paper metadata rows (files not restored — see header)`);

  await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
