"use client";

import { useEffect, useRef, useState } from "react";
import {
  TIMER_PRESETS,
  DEFAULT_PRESET_INDEX,
  LONG_BREAK_AFTER_CYCLES,
  LONG_BREAK_MULTIPLIER,
} from "@/config/timer";
import { startStudySession, endStudySession, getStudyStats } from "./actions";

type Subject = {
  id: string;
  name: string;
  topics: { id: string; label: string }[];
};
type Stats = { todayMinutes: number; weekMinutes: number; streak: number };
/** Mirrors the Prisma SessionType enum. */
type SessionType = "in_school" | "after_school" | "weekend";

type Phase = "focus" | "break";

// Persisted to localStorage so a reload or browser restart resumes the
// running timer — the session's authoritative start time still lives in
// Postgres (StudySession.startedAt, written the moment Start is clicked),
// this is just the moment-to-moment phase/pause bookkeeping. Same-device
// only; a paused timer doesn't resume on a different device, since that
// would need this state server-side too.
type PersistedState = {
  sessionId: string;
  subjectId: string;
  subjectName: string;
  topicId: string | null;
  presetIndex: number;
  phase: Phase;
  cycle: number;
  phaseEndAt: number;
  isPaused: boolean;
  remainingMsWhenPaused: number | null;
  totalFocusMs: number;
  totalBreakMs: number;
};

const STORAGE_KEY = "qcaa-timer-state";

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not available (e.g. no user gesture yet) — non-fatal.
  }
}

function notify(title: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "granted") new Notification(title);
}

function formatMMSS(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TimerClient({
  subjects,
  initialStats,
  initialSubjectId,
  initialTopicId,
  sessionType = "after_school",
  autoStart = false,
}: {
  subjects: Subject[];
  initialStats: Stats;
  /** Preselected from the dashboard's Next Departure / plan links. */
  initialSubjectId?: string;
  initialTopicId?: string;
  sessionType?: SessionType;
  /** Start the moment the page mounts — the dashboard's one-click path. */
  autoStart?: boolean;
}) {
  const [state, setState] = useState<PersistedState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [stats, setStats] = useState(initialStats);
  const [subjectId, setSubjectId] = useState(initialSubjectId ?? subjects[0]?.id ?? "");
  const [topicId, setTopicId] = useState<string>(initialTopicId ?? "");
  const [presetIndex, setPresetIndex] = useState(DEFAULT_PRESET_INDEX);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guards the autostart effect. Without it, StrictMode's double-invoke in
  // development opens two sessions for one click.
  const autoStarted = useRef(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setState(JSON.parse(raw));
  }, []);

  // Autostart only ever fires when there is no session already running or
  // persisted — arriving from the dashboard must never silently discard a
  // timer that's mid-flight.
  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (!subjectId) return;
    autoStarted.current = true;
    void handleStart();
    // handleStart is stable enough for this one-shot; re-running on every
    // render is exactly what the ref guard prevents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, subjectId]);

  useEffect(() => {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  }, [state]);

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Phase transition check.
  useEffect(() => {
    if (!state || state.isPaused) return;
    if (now < state.phaseEndAt) return;

    const preset = TIMER_PRESETS[state.presetIndex];

    if (state.phase === "focus") {
      beep();
      notify("Focus session done — take a break.");
      const nextCycle = state.cycle + 1;
      const isLongBreak = nextCycle % LONG_BREAK_AFTER_CYCLES === 0;
      const breakMs =
        preset.breakMinutes * 60_000 * (isLongBreak ? LONG_BREAK_MULTIPLIER : 1);
      setState({
        ...state,
        phase: "break",
        cycle: nextCycle,
        phaseEndAt: Date.now() + breakMs,
        totalFocusMs: state.totalFocusMs + preset.focusMinutes * 60_000,
      });
    } else {
      beep();
      notify("Break's over — back to it.");
      // The break just completed was a long break if the cycle just
      // finished (state.cycle) landed on a long-break boundary.
      const wasLongBreak = state.cycle % LONG_BREAK_AFTER_CYCLES === 0 && state.cycle > 0;
      const breakMs =
        preset.breakMinutes * 60_000 * (wasLongBreak ? LONG_BREAK_MULTIPLIER : 1);
      setState({
        ...state,
        phase: "focus",
        phaseEndAt: Date.now() + preset.focusMinutes * 60_000,
        totalBreakMs: state.totalBreakMs + breakMs,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, state]);

  async function handleStart() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const { id } = await startStudySession(subjectId, topicId || null, sessionType);
    const preset = TIMER_PRESETS[presetIndex];
    setState({
      sessionId: id,
      subjectId,
      subjectName: subject.name,
      topicId: topicId || null,
      presetIndex,
      phase: "focus",
      cycle: 0,
      phaseEndAt: Date.now() + preset.focusMinutes * 60_000,
      isPaused: false,
      remainingMsWhenPaused: null,
      totalFocusMs: 0,
      totalBreakMs: 0,
    });
  }

  function handlePause() {
    if (!state || state.isPaused) return;
    setState({ ...state, isPaused: true, remainingMsWhenPaused: state.phaseEndAt - Date.now() });
  }

  function handleResume() {
    if (!state || !state.isPaused || state.remainingMsWhenPaused === null) return;
    setState({
      ...state,
      isPaused: false,
      phaseEndAt: Date.now() + state.remainingMsWhenPaused,
      remainingMsWhenPaused: null,
    });
  }

  async function handleStop(completedNaturally: boolean) {
    if (!state) return;
    const preset = TIMER_PRESETS[state.presetIndex];
    let extraFocusMs = 0;
    if (state.phase === "focus" && !state.isPaused) {
      const elapsed = preset.focusMinutes * 60_000 - Math.max(0, state.phaseEndAt - Date.now());
      extraFocusMs = elapsed;
    }
    const totalFocusMinutes = (state.totalFocusMs + extraFocusMs) / 60_000;
    const totalBreakMinutes = state.totalBreakMs / 60_000;
    await endStudySession(state.sessionId, totalFocusMinutes, totalBreakMinutes, completedNaturally);
    setState(null);
    setStats(await getStudyStats());
  }

  const preset = TIMER_PRESETS[state?.presetIndex ?? presetIndex];
  const remainingMs = !state
    ? preset.focusMinutes * 60_000
    : state.isPaused
      ? state.remainingMsWhenPaused ?? 0
      : Math.max(0, state.phaseEndAt - now);

  return (
    <div className="space-y-6">
      <div className="flex justify-around text-center text-xs text-muted-foreground">
        <div>
          <div className="text-lg font-semibold text-foreground">{Math.round(stats.todayMinutes)}m</div>
          Today
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">{Math.round(stats.weekMinutes)}m</div>
          This week
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">{stats.streak}🔥</div>
          Streak
        </div>
      </div>

      {!state && (
        <div className="space-y-2">
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setTopicId("");
            }}
            className="w-full rounded-md border border-input bg-transparent px-2 py-2 text-sm"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full rounded-md border border-input bg-transparent px-2 py-2 text-sm"
          >
            <option value="">No specific topic</option>
            {subjects.find((s) => s.id === subjectId)?.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            {TIMER_PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => setPresetIndex(i)}
                className={`flex-1 rounded-md border px-2 py-1 text-xs ${
                  i === presetIndex ? "border-primary bg-primary/10" : "border-input"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-6xl font-mono font-semibold tabular-nums">
          {formatMMSS(remainingMs)}
        </p>
        {state && (
          <p className="mt-2 text-sm text-muted-foreground">
            {state.phase === "focus" ? "Focus" : "Break"} · {state.subjectName} · cycle {state.cycle + 1}
          </p>
        )}
      </div>

      <div className="flex justify-center gap-2">
        {!state ? (
          <button
            onClick={handleStart}
            disabled={!subjectId}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Start
          </button>
        ) : (
          <>
            {state.isPaused ? (
              <button onClick={handleResume} className="rounded-md border border-input px-4 py-2 text-sm">
                Resume
              </button>
            ) : (
              <button onClick={handlePause} className="rounded-md border border-input px-4 py-2 text-sm">
                Pause
              </button>
            )}
            <button
              onClick={() => handleStop(false)}
              className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive"
            >
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
