"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { LINES } from "@/config/tokens";
import { LineIcon } from "@/components/line-icon";
import type { LineState, LineStation } from "@/lib/dashboard";

/**
 * THE NETWORK — the hero of the dashboard.
 *
 * Five lines, each topic a station. Stations behind you are filled and joined
 * by solid track; the track ahead is dashed and locked; your position is a
 * pulsing node. The point is that "Methods is three stations behind Biology"
 * arrives before you read a single word.
 *
 * Structure carries the meaning here, which is only honest because topics
 * genuinely ARE sequential — the unlock state machine enforces it. This is a
 * diagram of the data, not decoration laid over it.
 *
 * Renders as SVG (not canvas) so it stays crisp, selectable and inspectable,
 * and so the load animation is CSS the reduced-motion rule already governs.
 */

const LABEL_W = 176;
const STATUS_W = 150;
const VIEW_W = 1180;
const ROW = 56;
const TOP = 32;
const MAX_GAP = 88;
const MIN_GAP = 22;

type Hover = { station: LineStation; line: LineState; x: number; y: number } | null;

export function NetworkMap({ lines }: { lines: LineState[] }) {
  const [hover, setHover] = useState<Hover>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const maxStations = Math.max(...lines.map((l) => l.stations.length), 0);

  // Fit the longest line into the available track width. Below MIN_GAP the
  // stations would overlap, so the viewBox widens instead and the container
  // scrolls — better than an unreadable smear of dots.
  const trackW = VIEW_W - LABEL_W - STATUS_W;
  const idealGap = maxStations > 1 ? trackW / (maxStations - 1) : MAX_GAP;
  const gap = Math.max(MIN_GAP, Math.min(MAX_GAP, idealGap));
  const width = Math.max(VIEW_W, LABEL_W + gap * Math.max(0, maxStations - 1) + STATUS_W);
  const height = TOP + lines.length * ROW;

  function showTip(station: LineStation, line: LineState, cx: number, cy: number) {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return;
    const r = svg.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const scale = r.width / width;
    setHover({ station, line, x: r.left - w.left + cx * scale, y: r.top - w.top + cy * scale });
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", minWidth: width > VIEW_W ? width * 0.6 : undefined }}
          className="h-auto"
          role="img"
          aria-label={ariaSummary(lines)}
        >
          {lines.map((line, i) => {
            const def = LINES[line.code];
            const y = TOP + i * ROW;
            const delay = `${i * 60}ms`;
            const end = LABEL_W + Math.max(0, line.stations.length - 1) * gap;
            // Everything up to and including the active station is "done
            // track". With no active topic the solid run stops after the last
            // mastered station, which is the truthful reading.
            const solidTo =
              line.activeIndex >= 0
                ? LABEL_W + line.activeIndex * gap
                : LABEL_W + Math.max(0, line.masteredCount - 1) * gap;

            return (
              <g key={line.code}>
                {/* Icon + label together. §10: colour is never the only
                    signal, so the map stays readable with no colour
                    discrimination at all. Nested <svg> needs an explicit
                    size or it expands to the whole viewport. */}
                <g
                  transform={`translate(0 ${y - 8})`}
                  style={{ color: `var(--line-${def.slug}-bright)` }}
                >
                  <LineIcon name={def.icon} size={16} />
                </g>
                <text
                  x={26}
                  y={y + 4}
                  fill={`var(--line-${def.slug}-bright)`}
                  fontFamily="var(--font-display)"
                  fontSize={12}
                  fontWeight={700}
                  letterSpacing={1.1}
                >
                  {def.label}
                </text>

                {line.stations.length === 0 ? (
                  <text
                    x={LABEL_W}
                    y={y + 4}
                    fill="var(--text-faint)"
                    fontFamily="var(--font-body)"
                    fontSize={11}
                  >
                    no topics yet
                  </text>
                ) : (
                  <>
                    {/* track ahead — locked */}
                    <line
                      x1={solidTo}
                      y1={y}
                      x2={end}
                      y2={y}
                      stroke="var(--state-locked)"
                      strokeWidth={5}
                      strokeLinecap="round"
                      strokeDasharray="1 14"
                    />
                    {/* track behind — drawn on load */}
                    {solidTo > LABEL_W && (
                      <line
                        className="map-track"
                        x1={LABEL_W}
                        y1={y}
                        x2={solidTo}
                        y2={y}
                        stroke={`var(--line-${def.slug})`}
                        strokeWidth={5}
                        strokeLinecap="round"
                        style={
                          {
                            "--len": solidTo - LABEL_W,
                            "--d": delay,
                          } as React.CSSProperties
                        }
                      />
                    )}

                    {line.stations.map((station, j) => {
                      const x = LABEL_W + j * gap;
                      return (
                        <g
                          key={station.topicId}
                          className="map-station cursor-pointer"
                          style={{ "--d": delay } as React.CSSProperties}
                          onMouseEnter={() => showTip(station, line, x, y)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={() => showTip(station, line, x, y)}
                          onBlur={() => setHover(null)}
                          tabIndex={0}
                          role="button"
                          aria-label={`${def.label} topic ${station.number}: ${station.title}, ${station.state}`}
                        >
                          {station.state === "active" && (
                            <>
                              <circle cx={x} cy={y} r={17} fill={`var(--line-${def.slug}-glow)`} />
                              <circle
                                className="map-pulse"
                                cx={x}
                                cy={y}
                                r={9}
                                fill={`var(--line-${def.slug}-bright)`}
                                style={{ "--d": delay } as React.CSSProperties}
                              />
                            </>
                          )}
                          {station.state === "mastered" && (
                            <circle
                              cx={x}
                              cy={y}
                              r={7}
                              fill={`var(--line-${def.slug})`}
                              stroke="var(--surface)"
                              strokeWidth={3}
                            />
                          )}
                          {station.state === "locked" && (
                            <circle
                              cx={x}
                              cy={y}
                              r={6}
                              fill="var(--surface)"
                              stroke="var(--state-locked)"
                              strokeWidth={2.5}
                            />
                          )}
                          {/* A topic sent back for review is a station with a
                              fault: ringed, not quietly re-locked. */}
                          {station.needsReview && (
                            <circle
                              cx={x}
                              cy={y}
                              r={12}
                              fill="none"
                              stroke="var(--state-danger)"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                            />
                          )}
                          <circle cx={x} cy={y} r={20} fill="transparent" />
                        </g>
                      );
                    })}
                  </>
                )}

                <text
                  x={width}
                  y={y - 3}
                  textAnchor="end"
                  fill="var(--text)"
                  fontFamily="var(--font-data)"
                  fontSize={12}
                >
                  {line.position ?? "—"}
                </text>
                <text
                  x={width}
                  y={y + 13}
                  textAnchor="end"
                  fill="var(--text-faint)"
                  fontFamily="var(--font-body)"
                  fontSize={11}
                >
                  {line.stations.length === 0
                    ? "not set up"
                    : `${line.masteredCount}/${line.stations.length} mastered`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 min-w-[160px] rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface-raised)] px-3 py-2.5 text-[0.64rem] shadow-[0_8px_24px_-6px_rgb(0_0_0/0.55)]"
          style={{ left: Math.max(0, hover.x - 80), top: hover.y - 104 }}
        >
          <div
            className="mb-1 font-display font-bold"
            style={{ color: `var(--line-${LINES[hover.line.code].slug}-bright)` }}
          >
            T{hover.station.number} {hover.station.title}
          </div>
          <Row label={stateLabel(hover.station)} />
          {hover.station.state === "locked" ? (
            <Row label="Master the previous topic first" muted />
          ) : (
            <>
              <Row
                label="RAG"
                value={`${hover.station.redObjectives}R ${hover.station.amberObjectives}A ${hover.station.greenObjectives}G`}
              />
              <Row label="cards due" value={String(hover.station.cardsDue)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value?: string; muted?: boolean }) {
  return (
    <div
      className={`tabular flex justify-between gap-3.5 ${
        muted ? "text-[color:var(--text-faint)]" : "text-[color:var(--text-muted)]"
      }`}
    >
      <span>{label}</span>
      {value && <span>{value}</span>}
    </div>
  );
}

function stateLabel(station: LineStation): string {
  if (station.needsReview) return "Needs review";
  if (station.state === "active") return "Active — you are here";
  if (station.state === "mastered") return "Mastered";
  return "Locked";
}

/** The map's text equivalent. Screen readers get the same headline the sighted
 *  reading gives: who's ahead, who's behind. */
function ariaSummary(lines: LineState[]): string {
  if (lines.every((l) => l.stations.length === 0)) {
    return "Network map: no topics have been set up on any line yet.";
  }
  return `Network map. ${lines
    .map((l) =>
      l.stations.length === 0
        ? `${LINES[l.code].label}: not set up`
        : `${LINES[l.code].label}: ${l.masteredCount} of ${l.stations.length} topics mastered${
            l.position ? `, currently at ${l.position}` : ""
          }`,
    )
    .join(". ")}.`;
}
