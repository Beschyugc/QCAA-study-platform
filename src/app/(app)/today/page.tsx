import { requireUser } from "@/lib/auth";
import { getMentorDay } from "@/lib/mentor";
import { addDays, startOfLocalDay } from "@/lib/date";
import { TodayBoard } from "./today-board";

/**
 * The mentor board — what to do in each period today, and what to do after
 * school.
 *
 * This is not the recommendation engine's Plan page. Plan ranks every topic
 * by priority and leaves the sequencing to you; Today is the sequenced
 * version, written against Beschy's actual timetable, because "Methods is
 * your highest-priority subject" is not an instruction you can act on in a
 * 79-minute period.
 */
export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const user = await requireUser();
  const { d } = await searchParams;

  // ?d=YYYY-MM-DD lets Beschy look ahead at tomorrow without waiting for it.
  // Anchored at Brisbane midday so the +10:00 day boundary can't slip it.
  const target = d ? new Date(`${d}T12:00:00+10:00`) : new Date();
  const day = await getMentorDay(user.id, isNaN(target.getTime()) ? new Date() : target);

  const prev = startOfLocalDay(addDays(target, -1));
  const next = startOfLocalDay(addDays(target, 1));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <TodayBoard
        day={day}
        prevKey={prev.toISOString().slice(0, 10)}
        nextKey={next.toISOString().slice(0, 10)}
      />
    </div>
  );
}
