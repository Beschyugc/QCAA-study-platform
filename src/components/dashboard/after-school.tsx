import { BookMarked } from "lucide-react";
import type { AfterSchool as AfterSchoolData } from "@/lib/dashboard";

/**
 * Everything past the last bell, interleaved so the evening reads as one shape:
 * study blocks, gym, dinner, the UGC block, wind-down.
 *
 * §4.3 asks for Google Calendar events here. There is no Google Calendar —
 * Phase 10 was built as a photo import of Beschy's own timetable instead, on
 * his call, and the `calendar_events` table is empty. So this reads from the
 * same imported blocks as Today, and says so rather than showing a sync status
 * for an integration that doesn't exist.
 */
export function AfterSchoolPanel({ data }: { data: AfterSchoolData }) {
  if (data.blocks.length === 0) {
    return (
      <p className="py-5 text-center text-xs text-[color:var(--text-muted)]">
        Nothing timetabled after school today.
      </p>
    );
  }

  return (
    <div>
      <ul>
        {data.blocks.map((block) => {
          const minutes = duration(block.startTime, block.endTime);
          const isStudy = block.kind === "study";
          return (
            <li
              key={block.id}
              className="grid grid-cols-[46px_1fr_auto] items-center gap-2.5 border-b border-[color:color-mix(in_srgb,var(--hairline)_55%,transparent)] py-1.5 text-xs last:border-b-0"
            >
              <span className="tabular text-[color:var(--text-muted)]">{block.startTime}</span>
              <span className="flex min-w-0 items-center gap-2">
                {isStudy && (
                  <BookMarked
                    className="h-3 w-3 shrink-0 text-[color:var(--state-good)]"
                    aria-label="study block"
                  />
                )}
                <span
                  className={`truncate ${isStudy ? "text-[color:var(--text)]" : "text-[color:var(--text-muted)]"}`}
                >
                  {block.label ?? block.periodName}
                </span>
              </span>
              <span className="tabular text-[0.64rem] text-[color:var(--text-faint)]">
                {minutes > 0 ? formatDuration(minutes) : ""}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-2.5 flex gap-1.5 text-[0.64rem] text-[color:var(--text-faint)]">
        <span aria-hidden>ℹ</span>
        <span>
          From your imported timetable — there&apos;s no Google Calendar connected.{" "}
          {data.studyMinutes > 0 ? (
            <>
              Only <span className="tabular">{formatDuration(data.studyMinutes)}</span> of study
              time fits tonight, so the plan is capped to that.
            </>
          ) : (
            "No study block is marked out for tonight."
          )}
        </span>
      </p>
    </div>
  );
}

function duration(start: string, end: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return Math.max(0, toMin(end) - toMin(start));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}
