import { describe, it, expect } from "vitest";
import { DIAGRAM_IDS } from "@/config/diagrams";

// The prompt builder tells the model which diagram ids exist by reading
// config/diagrams.ts, not the component registry itself (importing the .tsx
// registry into server prompt code would drag React into it for no reason).
// That split only works if the two lists are kept in sync by hand — this is
// the tripwire for when they drift.
describe("DIAGRAM_IDS", () => {
  it("matches the registry keys in lesson-diagrams.tsx", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("./lesson-diagrams.tsx", import.meta.url), "utf-8"),
    );
    const registryBlock = source.match(/const REGISTRY[^{]*\{([\s\S]*?)\n\};/)?.[1] ?? "";
    const registryIds = [...registryBlock.matchAll(/"([\w-]+)":/g)].map((m) => m[1]);

    expect(new Set(registryIds)).toEqual(new Set(DIAGRAM_IDS));
  });
});
