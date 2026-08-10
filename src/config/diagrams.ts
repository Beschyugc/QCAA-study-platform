/**
 * The ids of every diagram in the lesson-diagram registry
 * (src/components/lesson-diagrams.tsx), kept here as plain data so
 * prompt-building code (src/lib/ai/prompts/lesson.ts) doesn't have to import
 * a .tsx file full of React/JSX just to list what's available.
 *
 * Keep this in sync with the REGISTRY keys in lesson-diagrams.tsx — there's
 * a dev-time check for that in lesson-diagrams.test.ts.
 */
export const DIAGRAM_IDS = [
  "species-richness-evenness",
  "quadrat-sampling",
  "population-age-structure",
] as const;
