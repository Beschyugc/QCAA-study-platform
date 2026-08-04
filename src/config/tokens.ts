/**
 * STUDYLINE — design tokens, TypeScript mirror.
 *
 * src/styles/tokens.css is the source of truth for anything CSS can express.
 * This file exists because the network map is SVG generated in JS: it needs
 * line colours as values, not as `var(--line-methods)` strings it can't
 * interpolate, measure or hand to a gradient stop. Keep the two in step —
 * the hex values here are copied from tokens.css, and there is a test
 * (tokens.test.ts) that fails if they drift.
 *
 * The line ramps were verified for WCAG contrast and dichromat separation;
 * see the header comment in tokens.css for the measured numbers and the two
 * deliberate deviations from the original brief.
 */

/** DB `Subject.shortCode` — the join key between real data and line identity. */
export type SubjectCode = "MM" | "BIO" | "PSY" | "ENG" | "PE";

export type LineRamp = {
  /** Locked track / stations behind. Recessive by design, below 3:1. */
  dim: string;
  /** The 4px line stroke. >= 3.0 on --surface. Not for text. */
  base: string;
  /** Line-coloured text, active station fill, focus rings. >= 4.5 on --surface. */
  bright: string;
  /** Active-node pulse and celebration bloom. Decorative only. */
  glow: string;
};

export type LineDefinition = {
  code: SubjectCode;
  /**
   * The token slug for this line: `--line-{slug}`, `--line-{slug}-bright`.
   * Not derivable from `code` (MM -> methods, PSY -> psych), so it is stored
   * rather than guessed at each call site.
   */
  slug: string;
  /** Full name as it appears in the DB. */
  name: string;
  /** How the line is labelled on the map. */
  label: string;
  /** Colloquial hue name, used in comments and the palette reference only. */
  nickname: string;
  ramp: LineRamp;
  /**
   * lucide-react icon name. §10: colour is never the only signal, so every
   * line carries this alongside its label. Resolved to a component at the
   * render site so this file stays free of React imports.
   */
  icon: string;
  /**
   * XP multiplier (§7.1). Distinct from `Subject.priorityWeight` in the DB,
   * which feeds the recommendation engine on a different scale (1.0 down to
   * 0.35). Both encode the same intent — Methods matters most, PE least — and
   * they must stay in the same rank order. They are not derived from each
   * other on purpose: changing how study time is *allocated* and changing how
   * effort is *rewarded* are separate decisions.
   */
  xpMultiplier: number;
};

export const LINES: Record<SubjectCode, LineDefinition> = {
  MM: {
    code: "MM",
    slug: "methods",
    name: "Mathematical Methods",
    label: "METHODS",
    nickname: "vermilion",
    icon: "Sigma",
    xpMultiplier: 1.4,
    ramp: {
      dim: "#854437",
      base: "#ff5a3d",
      bright: "#ff8465",
      glow: "rgb(255 90 61 / 0.32)",
    },
  },
  BIO: {
    code: "BIO",
    slug: "biology",
    name: "Biology",
    label: "BIOLOGY",
    nickname: "mint",
    // Leaf, not Dna: at 13px the Dna helix collapses into noise.
    icon: "Leaf",
    xpMultiplier: 1.2,
    ramp: {
      dim: "#487d66",
      base: "#2ed09a",
      bright: "#64fcc2",
      glow: "rgb(46 208 154 / 0.32)",
    },
  },
  PSY: {
    code: "PSY",
    slug: "psych",
    name: "Psychology",
    label: "PSYCHOLOGY",
    nickname: "violet",
    icon: "Brain",
    xpMultiplier: 1.1,
    ramp: {
      dim: "#463873",
      base: "#8b5cf6",
      bright: "#b286ff",
      glow: "rgb(139 92 246 / 0.34)",
    },
  },
  ENG: {
    code: "ENG",
    slug: "english",
    name: "English",
    label: "ENGLISH",
    nickname: "rose",
    icon: "BookOpen",
    xpMultiplier: 1.0,
    ramp: {
      dim: "#7e4c62",
      base: "#e86fa9",
      bright: "#ff97d3",
      glow: "rgb(232 111 169 / 0.32)",
    },
  },
  PE: {
    code: "PE",
    slug: "pe",
    name: "Physical Education",
    label: "PE",
    nickname: "azure",
    // Activity, not HeartPulse: the plain trace reads at small sizes and
    // doesn't imply "health class" over "physical education".
    icon: "Activity",
    xpMultiplier: 0.9,
    ramp: {
      dim: "#305475",
      base: "#2e96e8",
      bright: "#5ac0ff",
      glow: "rgb(46 150 232 / 0.32)",
    },
  },
};

/** Map order — the express line first, then by descending XP multiplier. */
export const LINE_ORDER: SubjectCode[] = ["MM", "BIO", "PSY", "ENG", "PE"];

/**
 * Subjects come out of the DB with a `colour` column still holding the old
 * generic Tailwind hexes (#3b82f6, #22c55e...). Line identity is owned here,
 * not there — resolve by shortCode and ignore the column. Returns null for an
 * unrecognised code so a stray subject renders as an unstyled row instead of
 * silently borrowing another line's colour.
 */
export function lineFor(shortCode: string): LineDefinition | null {
  return LINES[shortCode as SubjectCode] ?? null;
}

export const GROUND = {
  ink: "#0f1420",
  surface: "#182031",
  surfaceRaised: "#212b40",
  hairline: "#2c3852",
  inkNight: "#0b0f18",
  surfaceNight: "#131a28",
} as const;

export const TEXT = {
  base: "#e8edf7",
  muted: "#8a97b0",
  faint: "#6b7996",
} as const;

export const SYSTEM = {
  xpGold: "#ffd166",
  streakEmber: "#ff8a3d",
  good: "#2ed09a",
  danger: "#ff5a6e",
  locked: "#516080",
} as const;

/** Mirrors the --dur-* / --ease-* tokens. Used by the SVG map's JS animation. */
export const MOTION = {
  instant: 90,
  state: 180,
  counter: 600,
  loadLine: 520,
  loadStagger: 60,
  celebrate: 1200,
  easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  easeFlap: "cubic-bezier(0.45, 0.05, 0.2, 1)",
} as const;

export const MAP_GEOMETRY = {
  strokeLine: 4,
  strokeLineThin: 2,
  stationRadius: 6,
  stationRadiusActive: 9,
  /** Gap between stations on the compact dashboard map. */
  stationGap: 44,
  /** Vertical gap between lines. */
  lineGap: 38,
} as const;

/**
 * Hour (local, Australia/Brisbane) at which the app switches to the late
 * palette and swaps daily objectives for tomorrow's plan. Guardrail, §9.
 */
export const LATE_NIGHT_HOUR = 23;
