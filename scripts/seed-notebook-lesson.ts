/**
 * Appends Beschy's own notebook notes to a topic's lesson, as a clearly
 * marked section beneath the generated lesson.
 *
 * The existing lesson for Biology U3 T2 is ~20k characters of generated
 * content and is NOT touched — this writes only between the two markers
 * below, so re-running replaces the notebook section and leaves everything
 * above it intact. That also makes the script idempotent.
 *
 * Note the durability caveat: TopicLesson regenerates if `objectivesHash`
 * stops matching, i.e. if the curriculum is re-imported. If that happens this
 * section is lost and the script must be re-run. The flashcards are the
 * durable copy of this material; this is the readable one.
 *
 * No AI provider is called. Run:
 *   npx tsx scripts/seed-notebook-lesson.ts [--write]
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

const START = "<!-- NOTEBOOK:START -->";
const END = "<!-- NOTEBOOK:END -->";

const NOTEBOOK = `
---

# 📓 From your notebook — Unit 3 Topic 2

*Your own written notes on dot points 3.2.10, 3.2.13, 3.2.14 and 3.2.15, kept in your wording. Added 12 August 2026.*

## The four exam chains

QCAA's **explain** verb pays for the chain, not the definition. Learn these four as chains and most "explain" questions in this topic write themselves.

**Carrying capacity (3.2.10)**
> factor changes → resource/environment changes → survival & reproduction change → number supported changes → **carrying capacity changes**

**Pioneer species (3.2.13)**
> hardy traits → survive harsh environment → rapid reproduction/dispersal → colonise quickly → modify environment → later species establish

**Succession (3.2.14)**
> pioneer/r-selected species → modify abiotic environment → more species establish → competition/interactions increase → K-selected species become common → **biomass + biodiversity increase**

**Interpreting data (3.2.15)**
> trend → evidence (quote the numbers) → biological meaning

---

## 3.2.10 — Carrying capacity and limiting factors

**K = the population size an ecosystem can support indefinitely using its available resources and services.**

The thing to actually understand: **K is not fixed.** It moves whenever resources or conditions move.
- more food/water → K may **increase**
- drought → less food/water → K may **decrease**

### Biotic factors (living)
food availability · competition · predation · disease

Worked chain: food ↓ → competition ↑ → survival/reproduction ↓ → fewer individuals supported → **K ↓**

### Abiotic factors (non-living)
water · temperature · soil nutrients · soil pH · salinity · pollution · light

Poorer conditions or fewer resources → **K ↓**

### Density-dependent vs density-independent

| | Effect | Examples |
|---|---|---|
| **Density-dependent** | Gets stronger as population density rises | competition, disease, predation, resource shortage, waste accumulation |
| **Density-independent** | Hits regardless of density | drought, flood, cyclone, bushfire, heatwave |

**The test:** does crowding make it worse? Yes → dependent. No → independent.

⚠️ **Trap:** density-independent does **not** mean "cannot change K". A cyclone destroying nesting sites is density-independent *and* lowers K. The two classifications answer different questions.

### Climatic events

**Drought:** rainfall ↓ → water ↓ → producer biomass ↓ → herbivore food ↓ → fewer herbivores survive → **K ↓**

**Flood:** destroys vegetation → grass ↓ → herbivore food ↓ → **herbivore K ↓**

**Cascade worth knowing:** grass ↓ → herbivore food ↓ → herbivore K ↓ → herbivore population ↓ → predator food ↓ → **predator population/K also ↓**

---

## 3.2.13 — Pioneer species as effective colonisers

**One line:** they *arrive fast*, *survive harsh conditions*, and *reproduce fast*. Every listed trait is a way of doing one of those three.

**Features:**
- **Photosynthetic/autotrophic** — nothing has colonised yet, so there is nothing to eat; only a self-feeder survives
- Tolerate **extreme conditions** — strong sun, wind, salinity
- Tolerate **low water** availability
- Tolerate **low nutrient** availability
- Some form **symbiosis with nitrogen-fixing bacteria** — bare substrate has no usable nitrogen, so this is a huge advantage
- Usually **r-selected**: short life cycle, rapid reproduction, many offspring/seeds
- Spores/seeds **easily dispersed** by wind or birds

**Lichens on bare rock — the standard example:**
survive harsh conditions → secrete acids that weather the rock → die and decompose → add organic matter → mineral particles + organic matter = **soil** → mosses and grasses can now establish

*The irony worth writing down: pioneers create the conditions that replace them.* That is **facilitation**.

---

## 3.2.14 — Successional changes

Five things change, and you need the direction of each:

| | Early succession | → | Later succession |
|---|---|---|---|
| **Life history** | r-selected | → | more K-selected |
| **Abiotic** | harsh, no soil | → | soil/nutrients ↑, moisture ↑, shade ↑, ground light ↓ |
| **Interactions** | few, simple | → | competition ↑, complex food webs |
| **Biodiversity** | low | → | **↑** (may plateau/dip at climax) |
| **Biomass** | low | → | **↑** |

**Why the shift from r to K:** pioneers modify the abiotic environment → conditions become stable and resource-rich → stable conditions reward competitive ability and slow maturation → K-selected species establish and outcompete the pioneers.

**Why biodiversity can plateau at climax:** dominant trees monopolise light, and **competitive exclusion** removes weaker competitors — so richness can level off even at maximum biomass.

**Not a contradiction:** ground-level light ↓ while total photosynthesis ↑. Far more leaf area exists, but it is arranged in a canopy that intercepts light *above* the ground.

---

## 3.2.15 — Comparing ecosystems: spatial and temporal

**Spatial = WHERE.** Different locations, same time. Two forests · upstream vs downstream · coastal vs inland · along a transect.

**Temporal = WHEN.** Same location, different times. Day vs night · summer vs winter · before vs after disturbance · 5 vs 100 years into succession.

### The thing that actually loses marks

**Interpret ≠ describe.**

| | |
|---|---|
| ❌ Description | "Trees increased." |
| ✅ Interpretation | "Tree cover rose from 5% to 62% over 100 years, indicating progression to a later successional stage; increased canopy cover also produced greater shade and lower air and soil temperatures." |

Always: **trend → quote the numbers → biological meaning.**

### Worked example — abandoned farmland, 5 → 100 years
- small herbaceous plants **decreased**
- percentage of trees **increased**
- air and soil temperature **decreased**

*Interpretation:* small plants established first, then shrubs and trees. Increased tree cover produced more shade, which lowered air and soil temperature. The biotic community changed the abiotic conditions — causation runs both ways in succession.

### Two traps
1. **Confounding.** Comparing Site A in January with Site B in July is *not* a valid spatial comparison — you have changed location and time together, so the effects cannot be separated.
2. **Detectability.** A daytime-only survey misses nocturnal species, so measured diversity is lower than real diversity. Same problem across seasons with migration and hibernation.

---

*36 flashcards were built from these notes and are in this topic's deck, tagged \`notebook\`. They deliberately test the chains and the interpretation method rather than re-testing definitions the deck already covers.*
`;

async function main() {
  const write = process.argv.includes("--write");
  console.log(write ? "MODE: --write\n" : "MODE: dry run — pass --write to save\n");

  const subject = await prisma.subject.findFirst({ where: { shortCode: "BIO" } });
  if (!subject) throw new Error("BIO subject not found");
  const unit = await prisma.unit.findFirst({ where: { subjectId: subject.id, number: 3 } });
  if (!unit) throw new Error("BIO Unit 3 not found");
  const topic = await prisma.topic.findFirst({
    where: { unitId: unit.id, title: "Functioning ecosystems and succession" },
  });
  if (!topic) throw new Error("U3 T2 not found");

  const lesson = await prisma.topicLesson.findUnique({ where: { topicId: topic.id } });
  if (!lesson) {
    console.log("No existing lesson for this topic — refusing to create one from notes alone.");
    console.log("The generated lesson is the primary content; this script only appends to it.");
    await prisma.$disconnect();
    return;
  }

  const section = `${START}\n${NOTEBOOK.trim()}\n${END}`;

  // Replace between markers if present, otherwise append. Never touches the
  // generated lesson above the START marker.
  const hasMarkers = lesson.markdown.includes(START) && lesson.markdown.includes(END);
  const updated = hasMarkers
    ? lesson.markdown.replace(new RegExp(`${START}[\\s\\S]*?${END}`), section)
    : `${lesson.markdown.trimEnd()}\n\n${section}\n`;

  console.log(`Lesson: ${lesson.markdown.length} chars → ${updated.length} chars`);
  console.log(hasMarkers ? "  (replacing existing notebook section)" : "  (appending new notebook section)");
  console.log(`  generated content preserved: ${updated.startsWith(lesson.markdown.slice(0, 500)) ? "yes" : "NO — ABORT"}`);

  if (write) {
    await prisma.topicLesson.update({
      where: { topicId: topic.id },
      data: { markdown: updated },
    });
    console.log("\nSaved.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
