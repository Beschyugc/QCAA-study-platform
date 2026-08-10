/**
 * A small, named registry of hand-drawn diagrams a lesson can embed.
 *
 * Lesson markdown never contains raw HTML/SVG — Markdown.tsx builds React
 * elements from a closed set of block kinds specifically so model output (or
 * anything else that ends up in a TopicLesson row) can't inject markup. A
 * `:::diagram <id>` block is the one exception that reaches actual visuals:
 * it can only ever resolve to a component already built and reviewed here,
 * by a fixed id. An unrecognised id renders nothing rather than guessing —
 * same rule as the rest of the app: no evidence, no invented content.
 *
 * Each diagram uses the app's own CSS variables for colour, so it sits in
 * light and dark mode the same way the rest of the UI does, and uses
 * currentColor-friendly strokes rather than hardcoded hex so it never fights
 * the subject's accent colour.
 */
import type { JSX } from "react";
import { DIAGRAM_IDS as CONFIGURED_DIAGRAM_IDS } from "@/config/diagrams";

const box = "w-full max-w-md";

function SpeciesRichnessEvenness() {
  // Two communities, both with 4 species (same richness) but very different
  // evenness — the exact distinction QCAA Biology U3T1 tests, and the one
  // number-only students usually miss.
  const communityA = [30, 28, 22, 20]; // even
  const communityB = [76, 10, 8, 6]; // dominated by one species
  const colours = ["var(--line-biology)", "var(--line-methods)", "var(--line-psych)", "var(--line-english)"];
  const barW = 26;
  const gap = 8;
  const chartH = 90;

  function Bars({ values, xOffset }: { values: number[]; xOffset: number }) {
    return (
      <>
        {values.map((v, i) => {
          const h = (v / 100) * chartH;
          const x = xOffset + i * (barW + gap);
          return (
            <rect
              key={i}
              x={x}
              y={chartH - h + 20}
              width={barW}
              height={h}
              fill={colours[i]}
              rx={2}
            />
          );
        })}
      </>
    );
  }

  return (
    <svg viewBox="0 0 320 140" className={box} role="img" aria-label="Species richness versus evenness comparison">
      <Bars values={communityA} xOffset={10} />
      <Bars values={communityB} xOffset={180} />
      <text x="75" y="132" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
        Community A — even
      </text>
      <text x="245" y="132" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
        Community B — dominated
      </text>
      <text x="75" y="12" textAnchor="middle" fontSize="9" fill="var(--text-faint)">
        richness = 4, high evenness
      </text>
      <text x="245" y="12" textAnchor="middle" fontSize="9" fill="var(--text-faint)">
        richness = 4, low evenness
      </text>
    </svg>
  );
}

function QuadratSampling() {
  // A transect line crossing a habitat gradient, with quadrats placed at
  // regular intervals — the standard QCAA method-and-validity diagram for
  // "describe a method to measure biodiversity".
  const quadrats = [40, 90, 140, 190, 240, 290];
  return (
    <svg viewBox="0 0 330 120" className={box} role="img" aria-label="Transect line with quadrats for biodiversity sampling">
      <line x1="20" y1="60" x2="310" y2="60" stroke="var(--text-muted)" strokeWidth="2" />
      <text x="20" y="78" fontSize="9" fill="var(--text-faint)">
        transect line
      </text>
      {quadrats.map((x, i) => (
        <g key={i}>
          <rect
            x={x - 14}
            y={40}
            width={28}
            height={28}
            fill="none"
            stroke="var(--line-biology)"
            strokeWidth="1.5"
          />
          {/* a couple of sampled "individuals" inside each quadrat, so it
              reads as a real count, not just an empty grid */}
          <circle cx={x - 5} cy={50} r="2" fill="var(--line-biology)" />
          <circle cx={x + 4} cy={58} r="2" fill="var(--line-methods)" />
          {i % 2 === 0 && <circle cx={x + 2} cy={48} r="2" fill="var(--line-psych)" />}
          <text x={x} y="26" textAnchor="middle" fontSize="8" fill="var(--text-faint)">
            {i * 10}m
          </text>
        </g>
      ))}
    </svg>
  );
}

function PopulationAgeStructure() {
  // Three classic population pyramid shapes — expanding, stable, declining —
  // the diagram QCAA questions on population growth patterns actually expect
  // you to read and label.
  const shapes: { label: string; bars: number[] }[] = [
    { label: "Expanding", bars: [90, 78, 65, 50, 35, 20, 10] },
    { label: "Stable", bars: [55, 55, 55, 52, 48, 40, 25] },
    { label: "Declining", bars: [30, 38, 48, 58, 65, 60, 40] },
  ];
  const colW = 100;
  return (
    <svg viewBox="0 0 320 130" className={box} role="img" aria-label="Expanding, stable and declining population age structures">
      {shapes.map((s, si) => (
        <g key={si} transform={`translate(${si * colW + 20}, 0)`}>
          {s.bars.map((w, i) => (
            <rect
              key={i}
              x={-w / 4}
              y={8 + i * 12}
              width={w / 2}
              height={9}
              fill="var(--line-biology)"
              opacity={0.4 + (0.6 * (s.bars.length - i)) / s.bars.length}
              rx={1.5}
            />
          ))}
          <text x="0" y="118" textAnchor="middle" fontSize="9" fill="var(--text-muted)">
            {s.label}
          </text>
        </g>
      ))}
      <text x="10" y="10" fontSize="8" fill="var(--text-faint)">
        old
      </text>
      <text x="10" y="112" fontSize="8" fill="var(--text-faint)">
        young
      </text>
    </svg>
  );
}

const REGISTRY: Record<string, () => JSX.Element> = {
  "species-richness-evenness": SpeciesRichnessEvenness,
  "quadrat-sampling": QuadratSampling,
  "population-age-structure": PopulationAgeStructure,
};

// Re-exported for anything already importing DIAGRAM_IDS from here; the
// prompt builder imports the same list from config/diagrams.ts instead, to
// avoid pulling this whole JSX file into server prompt-building code.
export const DIAGRAM_IDS = CONFIGURED_DIAGRAM_IDS;

export function LessonDiagram({ id, caption }: { id: string; caption: string }) {
  const Component = REGISTRY[id];
  if (!Component) return null; // unknown id — render nothing, never guess

  return (
    <figure className="my-2 flex flex-col items-center gap-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface-raised)] p-4">
      <Component />
      {caption && (
        <figcaption className="text-center text-[0.64rem] text-[color:var(--text-muted)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
