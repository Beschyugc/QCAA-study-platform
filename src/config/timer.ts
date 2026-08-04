export type TimerPreset = { label: string; focusMinutes: number; breakMinutes: number };

export const TIMER_PRESETS: TimerPreset[] = [
  { label: "25 / 5", focusMinutes: 25, breakMinutes: 5 },
  { label: "40 / 10", focusMinutes: 40, breakMinutes: 10 },
  { label: "50 / 10", focusMinutes: 50, breakMinutes: 10 },
  { label: "90 / 20", focusMinutes: 90, breakMinutes: 20 },
];

export const DEFAULT_PRESET_INDEX = 1; // 40/10

export const LONG_BREAK_AFTER_CYCLES = 4;
export const LONG_BREAK_MULTIPLIER = 2; // long break = breakMinutes * this
