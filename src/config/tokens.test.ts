import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GROUND, LINES, LINE_ORDER, SYSTEM, TEXT, lineFor } from "./tokens";

/**
 * tokens.css is the source of truth; tokens.ts is a hand-maintained mirror for
 * the SVG map. These tests fail the moment the two drift, which is the only
 * thing stopping a palette edit in one file from silently not applying in the
 * other.
 *
 * The contrast and colour-vision assertions re-derive the numbers quoted in the
 * tokens.css header, so those comments can't rot into being wrong either.
 */

const css = readFileSync(join(__dirname, "../styles/tokens.css"), "utf8");

function cssVar(name: string): string {
  const match = css.match(new RegExp(`^\\s*--${name}:\\s*([^;]+);`, "m"));
  if (!match) throw new Error(`--${name} not found in tokens.css`);
  return match[1].trim().toLowerCase();
}

// --- colour maths (WCAG 2.1 + Viénot dichromat simulation) -------------------

const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const fromLinear = (c: number) => {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};
const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

function toLab(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const Y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const Z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;
  const f = (t: number) =>
    t > Math.pow(6 / 29, 3) ? Math.cbrt(t) : t / (3 * Math.pow(6 / 29, 2)) + 4 / 29;
  const [fx, fy, fz] = [f(X / 0.95047), f(Y / 1), f(Z / 1.08883)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const deltaE76 = (a: string, b: string) => {
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
};

/** Viénot 1999 dichromat simulation via HPE cone space. */
function simulate(hex: string, type: "protan" | "deutan" | "tritan"): string {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const L = 17.8824 * r + 43.5161 * g + 4.11935 * b;
  const M = 3.45565 * r + 27.1554 * g + 3.86714 * b;
  const S = 0.0299566 * r + 0.184309 * g + 1.46709 * b;
  let l = L, m = M, s = S;
  if (type === "protan") l = 2.02344 * M - 2.52581 * S;
  else if (type === "deutan") m = 0.494207 * L + 1.24827 * S;
  else s = -0.395913 * L + 0.801109 * M;
  const out = [
    fromLinear(0.0809444479 * l + -0.130504409 * m + 0.116721066 * s),
    fromLinear(-0.0102485335 * l + 0.0540193266 * m + -0.113614708 * s),
    fromLinear(-0.000365296938 * l + -0.00412161469 * m + 0.693511405 * s),
  ];
  return "#" + out.map((v) => v.toString(16).padStart(2, "0")).join("");
}

// --- drift -------------------------------------------------------------------

describe("tokens.ts mirrors tokens.css", () => {
  it.each(LINE_ORDER)("%s ramp matches", (code) => {
    const { ramp, slug } = LINES[code];
    expect(ramp.dim).toBe(cssVar(`line-${slug}-dim`));
    expect(ramp.base).toBe(cssVar(`line-${slug}`));
    expect(ramp.bright).toBe(cssVar(`line-${slug}-bright`));
    expect(ramp.glow.replace(/\s+/g, "")).toBe(cssVar(`line-${slug}-glow`).replace(/\s+/g, ""));
  });

  it("ground, text and system colours match", () => {
    expect(GROUND.ink).toBe(cssVar("ink"));
    expect(GROUND.surface).toBe(cssVar("surface"));
    expect(GROUND.surfaceRaised).toBe(cssVar("surface-raised"));
    expect(GROUND.hairline).toBe(cssVar("hairline"));
    expect(TEXT.base).toBe(cssVar("text"));
    expect(TEXT.muted).toBe(cssVar("text-muted"));
    expect(TEXT.faint).toBe(cssVar("text-faint"));
    expect(SYSTEM.xpGold).toBe(cssVar("xp-gold"));
    expect(SYSTEM.streakEmber).toBe(cssVar("streak-ember"));
    expect(SYSTEM.good).toBe(cssVar("state-good"));
    expect(SYSTEM.danger).toBe(cssVar("state-danger"));
    expect(SYSTEM.locked).toBe(cssVar("state-locked"));
  });
});

// --- accessibility floors the brief actually asks for ------------------------

describe("contrast floors (§10)", () => {
  const grounds = [GROUND.ink, GROUND.surface, GROUND.surfaceRaised];

  it("body text clears AA on every ground", () => {
    for (const g of grounds) {
      expect(contrast(TEXT.base, g)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(TEXT.muted, g)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("faint text clears the 3:1 non-text floor on every ground", () => {
    // This is what the #5B6883 -> #6B7996 change in tokens.css bought.
    for (const g of grounds) expect(contrast(TEXT.faint, g)).toBeGreaterThanOrEqual(3);
  });

  it.each(LINE_ORDER)("%s base works as a 4px stroke, bright works as text", (code) => {
    const { ramp } = LINES[code];
    expect(contrast(ramp.base, GROUND.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(ramp.bright, GROUND.surface)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("lines stay distinguishable for common colour vision deficiency (§2.2)", () => {
  const pairs = LINE_ORDER.flatMap((a, i) =>
    LINE_ORDER.slice(i + 1).map((b) => [a, b] as const),
  );

  // 25 is comfortably distinct; 15 is "clearly not the same colour". Normal
  // vision is held to the higher bar, dichromats to the lower one, because
  // five hues cannot all stay 25 apart once an axis collapses.
  it.each(["normal", "protan", "deutan"] as const)("%s vision", (vision) => {
    for (const [a, b] of pairs) {
      const ca = LINES[a].ramp.base;
      const cb = LINES[b].ramp.base;
      const d =
        vision === "normal"
          ? deltaE76(ca, cb)
          : deltaE76(simulate(ca, vision), simulate(cb, vision));
      expect(d, `${a} vs ${b} under ${vision}`).toBeGreaterThan(vision === "normal" ? 25 : 15);
    }
  });

  it("psych and pe are not the same colour to a deuteranope", () => {
    // The regression this palette change exists to prevent: as originally
    // briefed (#B57BFF / #3DA5FF) this was dE 0.4 — literally identical.
    const d = deltaE76(
      simulate(LINES.PSY.ramp.base, "deutan"),
      simulate(LINES.PE.ramp.base, "deutan"),
    );
    expect(d).toBeGreaterThan(15);
  });
});

describe("line identity resolves by shortCode, not the DB colour column", () => {
  it("resolves the five real subjects", () => {
    for (const code of LINE_ORDER) expect(lineFor(code)?.code).toBe(code);
  });

  it("returns null for an unknown subject rather than borrowing a line", () => {
    expect(lineFor("CHEM")).toBeNull();
  });

  it("xp multipliers stay in the same rank order as the recommendation weights", () => {
    // priorityWeight in src/config/subjects.ts: MM 1.0 > BIO 0.8 > PSY 0.65 >
    // ENG 0.5 > PE 0.35. Different scale, same ordering — see tokens.ts.
    const multipliers = LINE_ORDER.map((c) => LINES[c].xpMultiplier);
    expect(multipliers).toEqual([...multipliers].sort((a, b) => b - a));
  });
});
