import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStudyStats } from "./timer/actions";
import { getTopicRecommendations } from "@/lib/recommendation-data";
import {
  afterSchool,
  buildAfternoonPlan,
  computePace,
  currentBlock,
  currentWeekday,
  decorateDay,
  getLineStates,
  getWeek,
  nextDeparture,
  type DashboardBlock,
} from "@/lib/dashboard";
import { localDayAndMinutes } from "@/lib/timetable";
// Aliased: `today` is already the weekday number in this file.
import { today as todaysDate } from "@/lib/daily-questions";
import { Card, Empty, Wrap, Zone } from "@/components/dashboard/shell";
import { TopBar } from "@/components/dashboard/top-bar";
import { LineRows } from "@/components/dashboard/line-rows";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { NextDeparture } from "@/components/dashboard/next-departure";
import { AfterSchoolPanel } from "@/components/dashboard/after-school";
import { ThisAfternoon } from "@/components/dashboard/this-afternoon";
import { NetworkMap } from "@/components/dashboard/network-map";

// The dashboard reads "now" on every request; nothing here may be cached.
export const dynamic = "force-dynamic";

function ImportLink({ children }: { children: React.ReactNode }) {
  return (
    <Link
      href="/subjects/MM/syllabus-import"
      className="inline-flex rounded-xl bg-[color:var(--state-good)] px-5 py-2.5 text-xs font-semibold text-[#06231a] transition-[filter] duration-[180ms] hover:brightness-110"
    >
      {children}
    </Link>
  );
}

export default async function Dashboard() {
  const user = await requireUser();
  const now = new Date();

  const [{ blocks, codeBySubjectId }, lines, stats, recommendations, subjects, doneSets] =
    await Promise.all([
    getWeek(user.id),
    getLineStates(user.id),
    getStudyStats(),
    getTopicRecommendations(user.id),
    prisma.subject.findMany({
      where: { userId: user.id },
      select: { shortCode: true, targetCompletionDate: true },
    }),
    prisma.dailyQuestionSet.findMany({
      where: { userId: user.id, date: todaysDate(), completedAt: { not: null } },
      select: { subject: { select: { shortCode: true } } },
    }),
  ]);
  const questionsDone = new Set(doneSets.map((s) => s.subject.shortCode));

  const today = currentWeekday(now);
  const { minutes: nowMinutes } = localDayAndMinutes(now);

  const days: Record<number, DashboardBlock[]> = {};
  for (let day = 0; day < 7; day++) days[day] = decorateDay(blocks, codeBySubjectId, day);

  const departure = nextDeparture(blocks, codeBySubjectId, now);
  const current = currentBlock(blocks, now);
  const evening = afterSchool(days[today]);
  const plan = buildAfternoonPlan(recommendations, lines, evening.studyMinutes);
  const totalCardsDue = lines.reduce((sum, l) => sum + l.cardsDue, 0);
  const pace = computePace(
    lines,
    new Map(subjects.map((s) => [s.shortCode, s.targetCompletionDate])),
  );
  const anyTopics = lines.some((l) => l.stations.length > 0);

  const todayLabel = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    day: "numeric",
    month: "short",
  }).format(now);

  return (
    <>
      <TopBar streak={stats.streak} timerLabel={null} />

      <Wrap>
        <Zone eyebrow="Zone 1 — Overview">
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5">
              <Card title="Next departure">
                <NextDeparture departure={departure} lines={lines} totalCardsDue={totalCardsDue} />
              </Card>

              <Card>
                {plan.length > 0 ? (
                  <ThisAfternoon items={plan} studyMinutes={evening.studyMinutes} />
                ) : (
                  <>
                    <h2 className="signage mb-3.5 font-display text-xs font-bold text-[color:var(--text-muted)]">
                      This afternoon
                    </h2>
                    <Empty
                      headline="Nothing to plan yet"
                      action={<ImportLink>Import a syllabus →</ImportLink>}
                    >
                      The recommendation engine ranks active topics. There aren&apos;t any yet, so
                      it has nothing to score — and inventing a plan would be worse than showing
                      you this.
                    </Empty>
                  </>
                )}
              </Card>
            </div>

            <div className="flex flex-col gap-5">
              <Card>
                <TodayPanel
                  days={days}
                  today={today}
                  todayLabel={todayLabel}
                  currentBlockId={current?.id ?? null}
                  nowMinutes={nowMinutes}
                />
              </Card>

              <Card title={evening.lastBell ? `After ${evening.lastBell}` : "After school"}>
                <AfterSchoolPanel data={evening} />
              </Card>
            </div>
          </div>
        </Zone>

        <Zone>
          <Card title="The network">
            {anyTopics ? (
              <NetworkMap lines={lines} />
            ) : (
              <Empty
                headline="No track laid yet"
                action={<ImportLink>Import your first syllabus →</ImportLink>}
              >
                Five lines, zero stations. The map draws itself from the topics in your curriculum
                tree, and there aren&apos;t any on any subject.
                <br />
                This is the one thing holding back most of the dashboard.
              </Empty>
            )}
          </Card>
        </Zone>

        <Zone eyebrow="Your subjects">
          <LineRows lines={lines} pace={pace} questionsDone={questionsDone} />
        </Zone>
      </Wrap>
    </>
  );
}
