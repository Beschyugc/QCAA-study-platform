import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getStudyStats } from "./timer/actions";
import {
  currentBlock,
  currentWeekday,
  decorateDay,
  getLineStates,
  getWeek,
  nextDeparture,
  type DashboardBlock,
} from "@/lib/dashboard";
import { localDayAndMinutes } from "@/lib/timetable";
import { Card, Wrap, Zone } from "@/components/dashboard/shell";
import { TopBar } from "@/components/dashboard/top-bar";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { NextDeparture } from "@/components/dashboard/next-departure";

// The dashboard reads "now" on every request; nothing here may be cached.
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireUser();
  const now = new Date();

  const [{ blocks, codeBySubjectId }, lines, stats] = await Promise.all([
    getWeek(user.id),
    getLineStates(user.id),
    getStudyStats(),
  ]);

  const today = currentWeekday(now);
  const { minutes: nowMinutes } = localDayAndMinutes(now);

  // The whole week up front — 86 rows — so the week strip switches days
  // without a round trip.
  const days: Record<number, DashboardBlock[]> = {};
  for (let day = 0; day < 7; day++) days[day] = decorateDay(blocks, codeBySubjectId, day);

  const departure = nextDeparture(blocks, codeBySubjectId, now);
  const current = currentBlock(blocks, now);
  const totalCardsDue = lines.reduce((sum, l) => sum + l.cardsDue, 0);

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
                <NextDeparture
                  departure={departure}
                  lines={lines}
                  totalCardsDue={totalCardsDue}
                />
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
            </div>
          </div>
        </Zone>
      </Wrap>

      {/* Temporary: the phases 1-14 routes have no home on the new dashboard
          until Zone 3 and the subject hubs land (steps 7-9). Without this they
          would be unreachable, which would be a regression dressed up as a
          redesign. */}
      <Wrap>
        <Zone eyebrow="Everything else — until Zone 3 lands">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[color:var(--text-muted)]">
            {[
              ["/plan", "Plan"],
              ["/timer", "Timer"],
              ["/timetable", "Timetable"],
              ["/review", "Review"],
              ["/analytics", "Analytics"],
              ["/weekly-review", "Weekly review"],
              ["/coach", "Coach"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="underline underline-offset-4 hover:text-[color:var(--text)]">
                {label}
              </Link>
            ))}
            <span className="ml-auto text-[color:var(--text-faint)]">{user.email}</span>
          </div>
        </Zone>
      </Wrap>
    </>
  );
}
