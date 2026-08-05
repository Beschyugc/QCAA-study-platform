import { AlertTriangle } from "lucide-react";

/**
 * Shown across the app when no AI provider is configured.
 *
 * Without it, every AI feature looks available, spins for a moment, and then
 * fails with a message about environment variables — which reads as the app
 * being broken rather than unconfigured. This says so once, up front, in
 * language that names the fix.
 *
 * Deliberately not dismissible: it describes a real, ongoing limitation, and a
 * dismissed banner would leave those features silently broken again.
 */
export function AiUnavailableBanner() {
  return (
    <div className="border-b border-[color:var(--streak-ember)] bg-[color:color-mix(in_srgb,var(--streak-ember)_12%,transparent)] px-4 py-2.5 sm:px-7">
      <p className="mx-auto flex max-w-[1180px] items-start gap-2 text-[0.64rem] text-[color:var(--streak-ember)]">
        <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold">AI features are switched off on this deployment.</strong>{" "}
          Cards, ratings, the timer, your timetable and subtopic drilling all work normally. Lessons,
          daily questions, placement, the tutor and the coach need an{" "}
          <code className="font-data">ANTHROPIC_API_KEY</code> (and{" "}
          <code className="font-data">ANTHROPIC_MODEL=claude-sonnet-5</code>) in the Vercel project&apos;s
          environment variables, then a redeploy.
        </span>
      </p>
    </div>
  );
}
