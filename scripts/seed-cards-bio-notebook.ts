/**
 * Cards built from Beschy's own Unit 3 notebook.
 *
 * Source: his handwritten notes on Unit 3 Topic 2 dot points 3.2.10 (carrying
 * capacity), 3.2.13 (pioneer species), 3.2.14 (successional changes) and
 * 3.2.15 (spatial/temporal comparison), pasted in 2026-08-12.
 *
 * WHY THESE CARDS AND NOT MORE RECALL. The topic already holds 63 cards across
 * these four dot points and nearly every one is a definition — "Define carrying
 * capacity", "{{c1::Pioneer species}} is the first species to...". What the deck
 * has no card for anywhere is the thing his notebook is actually built around:
 * the CAUSAL CHAIN. QCAA's "explain" verb pays for the chain, not the
 * definition, and a deck of definitions trains for the wrong verb.
 *
 * So this file deliberately does NOT add more definitions. It adds:
 *   - the chains themselves, as chains (factor → resource → survival → K)
 *   - the trophic cascade (grass ↓ → herbivore ↓ → predator ↓), absent entirely
 *   - the spatial/temporal INTERPRETATION method, which was the thinnest area
 *     in the whole topic (5 cloze cards, all definitional) and the one his
 *     notes cover best: trend → evidence → biological meaning
 *   - "interpret ≠ describe", which is a marks-losing distinction with no card
 *   - the reasoning behind pioneer traits, not just the trait list
 *
 * No AI provider is called anywhere in this file. Every front/back is literal
 * data, so it runs on an empty Anthropic balance.
 *
 * Run:  npx tsx scripts/seed-cards-bio-notebook.ts [--write]
 *
 * Dry run by default; --write inserts. Idempotent — a card is skipped if one
 * with the same `front` already exists in that topic, so re-running never
 * duplicates rows.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
// Type-only, so it is erased at compile time and cannot drag src/lib/prisma
// into the module graph. A VALUE import here is hoisted above config(), so the
// Prisma singleton is constructed with an empty DATABASE_URL and falls back to
// localhost:5432. See PROGRESS.md — this has cost a run once already.
import type { DraftCard } from "../src/lib/cards";

/** Loaded only after config() has run. See the note above. */
async function deps() {
  return import("../src/lib/cards");
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

type Band = "simple_familiar" | "complex_familiar" | "complex_unfamiliar";
type Card = { front: string; back: string; complexity: Band; cardType?: "basic" | "cloze" };
type TopicBlock = { unitNumber: number; topicTitle: string; cards: Card[] };

// ============================================================================
// BIOLOGY — Unit 3, Topic 2: Functioning ecosystems and succession
// Dot points 3.2.10, 3.2.13, 3.2.14, 3.2.15
// ============================================================================
const BIO: TopicBlock[] = [
  {
    unitNumber: 3,
    topicTitle: "Functioning ecosystems and succession",
    cards: [
      // ----------------------------------------------------------------------
      // 3.2.10 — Carrying capacity and limiting factors
      // ----------------------------------------------------------------------
      {
        front:
          "Write out the full causal chain an 'explain' question on carrying capacity should follow.",
        back:
          "Factor changes → resource/environment changes → survival and reproduction change → the number of individuals that can be supported changes → carrying capacity changes.\n\nThis is the chain that earns the marks. Naming the factor and then jumping straight to 'so K decreases' skips the middle and loses the explanation marks.",
        complexity: "simple_familiar",
      },
      {
        front:
          "Why is it wrong to treat carrying capacity (K) as a fixed number for an ecosystem?",
        back:
          "K is set by the resources and conditions currently available, and those change. If resources improve (more food, more water) K can rise; if conditions worsen (drought, pollution, nutrient loss) K can fall. K is a property of the ecosystem's current state, not a permanent constant attached to the species.",
        complexity: "simple_familiar",
      },
      {
        front:
          "Complete the chain: food availability ↓ → ? ↑ → ? ↓ → fewer individuals supported → K ↓",
        back:
          "food availability ↓ → **competition** ↑ → **survival and reproduction** ↓ → fewer individuals supported → K ↓",
        complexity: "simple_familiar",
      },
      {
        front:
          "What single test distinguishes a density-dependent limiting factor from a density-independent one?",
        back:
          "Ask whether the factor's effect gets stronger as the population gets more crowded.\n\nIf yes → density-dependent (competition, disease, predation, resource shortage, waste accumulation) — crowding intensifies it.\nIf no → density-independent (drought, flood, cyclone, bushfire, heatwave) — it hits just as hard whether the population is large or small.",
        complexity: "simple_familiar",
      },
      {
        front:
          "A drought and an outbreak of disease both reduce a population. Which is density-dependent, and why?",
        back:
          "The disease is density-dependent — it spreads by contact, so a denser population transmits it faster and suffers proportionally greater losses.\n\nThe drought is density-independent — the rainfall shortfall is the same regardless of how many individuals are present, so it affects a sparse population as severely as a crowded one.",
        complexity: "simple_familiar",
      },
      {
        front:
          "A national park's kangaroo population sits stably at about 400 individuals. A three-year drought then begins. Explain, using a causal chain, what happens to the carrying capacity of the park for kangaroos. (4 marks)",
        back:
          "Rainfall decreases, so water availability and soil moisture fall (1 mark). Reduced water lowers plant growth, so producer biomass and the amount of grazing available decline (1 mark). With less food and water, competition intensifies and individual survival and reproductive rates fall (1 mark). Therefore the park can sustainably support fewer kangaroos — the carrying capacity decreases, and the population declines towards the new, lower K (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A drought causes grass biomass in a savanna to decline sharply. Explain how this affects BOTH the herbivore population and the predator population that feeds on them. (4 marks)",
        back:
          "Grass biomass ↓ means less food is available to herbivores, so competition among herbivores increases and fewer can be sustained — the herbivore carrying capacity falls and the herbivore population declines (2 marks).\n\nThe predators depend on herbivores as their food source, so as herbivore numbers fall the predators' food supply falls (1 mark). Fewer predators can then be supported, so predator carrying capacity and population size also decrease, with the predator decline lagging behind the herbivore decline (1 mark).\n\nThis is a trophic cascade: an abiotic change at the producer level propagates upward through the food chain.",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why removing a top predator from an ecosystem can eventually LOWER the carrying capacity for the herbivore species it used to eat. (4 marks)",
        back:
          "Removing the predator lifts predation pressure, so herbivore numbers initially rise rapidly (1 mark). The larger herbivore population grazes more intensively than the vegetation can regenerate, so plant biomass is depleted (1 mark). Reduced vegetation means less food, and overgrazing can also degrade soil and reduce plant recovery (1 mark). The ecosystem can now sustainably support fewer herbivores than before — carrying capacity falls, often causing a population crash below the original level (1 mark).\n\nThis is why predation, a density-dependent factor, can be stabilising rather than purely harmful.",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between a factor that changes a population's SIZE and a factor that changes its CARRYING CAPACITY, using an example of each. (3 marks)",
        back:
          "A factor changing population size alters how many individuals are currently present without changing how many the ecosystem could support — e.g. a one-off cull or a disease outbreak reduces numbers, but the resources available are unchanged, so the population can recover back to the same K (1-2 marks).\n\nA factor changing carrying capacity alters the resources or conditions themselves — e.g. permanent habitat clearing or prolonged drought reduces available food, water or space, so the ecosystem now supports fewer individuals indefinitely and the population cannot recover to its former level (1-2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A wetland is fed by a river that is dammed upstream for irrigation. Over the following decade, water levels fall, salinity rises, and waterbird numbers decline by 70%. Evaluate whether this represents a change in carrying capacity or simply a temporary population decline, and justify your judgement. (6 marks)",
        back:
          "Judgement: this represents a genuine reduction in carrying capacity, not a temporary decline (1 mark — a judgement must be stated; a description alone scores nothing on 'evaluate').\n\nSupporting reasoning:\n- The dam is a sustained structural change to water supply, not a one-off event, so reduced water availability is ongoing rather than transient (1 mark).\n- Falling water levels reduce feeding and breeding habitat area, directly reducing the resources available to waterbirds (1 mark).\n- Rising salinity is an abiotic change that reduces the survival of salt-intolerant aquatic plants and invertebrates, cutting the food base as well as habitat (1 mark).\n- Because the underlying resources and conditions have changed, the wetland can now sustainably support fewer birds indefinitely — the population will stabilise at a new lower K rather than recovering (1 mark).\n\nCounter-consideration for full marks: if the dam's flow regime were later restored, water level and salinity could recover and K could rise again — K is not permanent, so the change is better described as sustained rather than irreversible (1 mark).",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "An island seabird colony is hit by a cyclone that destroys 60% of nesting sites. Analysts disagree: one says the cyclone is density-independent so it cannot affect carrying capacity. Identify the flaw in that reasoning and correct it. (5 marks)",
        back:
          "The flaw: the analyst has conflated 'density-independent' with 'cannot change carrying capacity'. These are two different classifications answering two different questions (1 mark).\n\nWhy it is wrong: density-independence describes only whether the factor's severity depends on population density — the cyclone hits equally hard whether the colony is crowded or sparse, so it is correctly classified as density-independent (1 mark). But that classification says nothing about whether the resource base has changed (1 mark).\n\nThe correction: destroying 60% of nesting sites removes a physical resource the birds require to breed. Fewer nesting sites means fewer breeding pairs can be supported, so carrying capacity genuinely falls until the sites regenerate (1 mark). A density-independent factor can absolutely change K — the two classifications are independent of each other (1 mark).",
        complexity: "complex_unfamiliar",
      },

      // ----------------------------------------------------------------------
      // 3.2.13 — Pioneer species as effective colonisers
      // ----------------------------------------------------------------------
      {
        front:
          "Summarise in one line why pioneer species are effective colonisers.",
        back:
          "They arrive fast, survive harsh conditions, and reproduce fast.\n\nEverything else — wind-dispersed spores, tolerance of low water and nutrients, autotrophy, r-selected life history — is a way of doing one of those three things.",
        complexity: "simple_familiar",
      },
      {
        front:
          "Why does being photosynthetic/autotrophic matter specifically for a pioneer species?",
        back:
          "A newly exposed surface such as bare rock or fresh lava has no existing organisms, so there is no food source to consume. Only an organism that makes its own food from sunlight and inorganic material can survive there — a heterotroph would starve because nothing has colonised yet for it to eat.",
        complexity: "simple_familiar",
      },
      {
        front:
          "What advantage does a symbiotic relationship with nitrogen-fixing bacteria give a pioneer species?",
        back:
          "Newly exposed substrate has effectively no usable nitrogen, because nitrogen enters soil through biological activity that has not happened yet. A pioneer partnered with nitrogen-fixing bacteria can obtain nitrogen directly from atmospheric N₂, so it can grow where nitrogen-limited competitors cannot — and as it dies and decomposes it adds that nitrogen to the developing soil for later species.",
        complexity: "simple_familiar",
      },
      {
        front:
          "Explain why pioneer species are almost always r-selected rather than K-selected. (3 marks)",
        back:
          "Newly exposed or recently disturbed habitats are harsh and unpredictable, so mortality is high and conditions may change again before slow-growing organisms mature (1 mark). r-selected traits — short life cycle, rapid reproduction, many small easily dispersed offspring or spores — mean a pioneer can reach the site quickly and produce a new generation before conditions deteriorate (1 mark). K-selected traits such as slow maturation and heavy investment in few offspring would be a liability, because there is no established stable environment to reward competitive ability and the parent may die before reproducing (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how lichens colonising bare rock make the site suitable for species that could not have survived there initially. (4 marks)",
        back:
          "Lichens tolerate the extreme conditions of exposed rock — intense light, wind, low water and effectively no nutrients — so they can establish where other species cannot (1 mark). They secrete acids that chemically weather the rock surface, breaking it into finer mineral particles (1 mark). As lichens die they are decomposed, adding organic matter to those particles (1 mark). Mineral particles plus organic matter is soil: it retains water and holds nutrients, so mosses and then grasses — which require soil and cannot grow on bare rock — can now establish (1 mark).\n\nThis is facilitation: the pioneer modifies the environment in a way that enables its own replacement.",
        complexity: "complex_familiar",
      },
      {
        front:
          "A pioneer plant species is described as having 'seeds dispersed by wind and birds'. Explain how each dispersal mechanism contributes to effective colonisation. (3 marks)",
        back:
          "Wind dispersal carries very large numbers of light seeds or spores over wide areas at no energetic cost to the parent, maximising the chance that at least some land on newly available bare substrate (1 mark). Bird dispersal can carry seeds much further and across barriers wind cannot cross — for example to an isolated island or an isolated forest clearing (1 mark). Together they mean the species reaches new sites quickly and repeatedly, so it arrives before slower-dispersing competitors and establishes first (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A newly formed volcanic island emerges off the Queensland coast. Predict which organisms would colonise first and justify your prediction with reference to the conditions on the island. (5 marks)",
        back:
          "Prediction: lichens and other hardy autotrophic pioneers, followed by mosses (1 mark).\n\nJustification:\n- The island is bare volcanic rock with no soil, so there is no water-retaining or nutrient-holding medium — only species tolerating a total absence of soil can establish (1 mark).\n- There is no existing biological community, so no food source exists for heterotrophs; the first colonisers must be autotrophic (1 mark).\n- The island is isolated by ocean, so colonisers must reach it by long-distance dispersal — wind-borne spores can do this, whereas large seeds cannot (1 mark).\n- Exposed conditions mean intense light, salt spray and wind with no shelter; lichens tolerate these extremes, while larger plants would desiccate (1 mark).",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A rehabilitation team is told that spreading fertiliser on a bare mine site will speed up succession. Evaluate this claim. (6 marks)",
        back:
          "Judgement: fertiliser may accelerate the early stages but is not a substitute for succession and can in some respects work against it (1 mark).\n\nSupporting the claim:\n- A key limit on pioneer establishment is low nutrient availability, particularly nitrogen, so adding nutrients removes one limiting factor and can allow plants to establish faster than waiting for pioneers to build soil nitrogen (1-2 marks).\n\nAgainst the claim:\n- Fertiliser supplies nutrients but not soil STRUCTURE — the organic matter that retains water and holds nutrients in place is built by pioneers living and dying over time, and cannot be added in a bag (1 mark). On compacted rock waste, added nutrients simply leach away.\n- High nutrient levels favour fast-growing competitive species, often weeds, which can outcompete and exclude the native pioneers and hold the site in an arrested early stage rather than progressing (1 mark).\n- Nutrient runoff into adjacent waterways can cause eutrophication, damaging neighbouring ecosystems (1 mark).\n\nA fuller answer notes that inoculating the site with nitrogen-fixing pioneer species addresses the same limitation while also building soil structure, so it is a better-targeted intervention.",
        complexity: "complex_unfamiliar",
      },

      // ----------------------------------------------------------------------
      // 3.2.14 — Successional changes
      // ----------------------------------------------------------------------
      {
        front:
          "Write out the full causal chain an 'explain' question on successional change should follow.",
        back:
          "Pioneer / r-selected species colonise → they modify the abiotic environment (soil, nutrients, moisture, shade) → more species can establish → competition and species interactions increase → K-selected species become more common → biomass and biodiversity increase.\n\nThe pivot in the middle — pioneers changing the environment — is what makes succession happen, and is the step most often left out.",
        complexity: "simple_familiar",
      },
      {
        front:
          "Give the five things that change as succession progresses, and the direction each moves.",
        back:
          "1. Life history: r-selected → more K-selected\n2. Abiotic conditions: soil depth, nutrients and moisture ↑; ground-level light ↓ (shade ↑)\n3. Species interactions: simple → complex; competition and predation ↑, food webs more interconnected\n4. Biodiversity: generally ↑ (may stabilise or dip slightly in a mature climax community as competition excludes some species)\n5. Biomass: ↑",
        complexity: "simple_familiar",
      },
      {
        front:
          "During succession, ground-level light DECREASES while total photosynthesis in the ecosystem INCREASES. Explain why these are not contradictory.",
        back:
          "Total photosynthesis rises because far more plant material is present overall — trees and shrubs hold vastly more leaf area than the original grasses.\n\nGround-level light falls because that increased leaf area is arranged in a canopy above, which intercepts light before it reaches the ground. The light is not lost from the ecosystem; it is captured higher up. This is why shade-tolerant species replace sun-loving early colonisers at ground level.",
        complexity: "simple_familiar",
      },
      {
        front:
          "Why do species interactions become more complex as succession progresses? (3 marks)",
        back:
          "Early successional communities contain few species, so there are few possible interactions and food chains are short and simple (1 mark). As the environment is modified and more species colonise, the number of species present increases (1 mark). More species means more feeding relationships, more competitive pairings and more opportunities for mutualism and parasitism, so food webs become longer and more interconnected and each species interacts with more others (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how pioneer species cause the shift from r-selected to K-selected species during succession. (4 marks)",
        back:
          "Pioneer species modify abiotic conditions — weathering rock, adding organic matter, building soil depth, increasing nutrient and water retention (1 mark). These modified conditions are more stable and more resource-rich than the original bare substrate (1 mark). Stable, resource-rich conditions favour species that compete well for resources and invest heavily in fewer, better-provisioned offspring — K-selected traits — because there is now a persistent environment in which slow maturation pays off (1 mark). These K-selected species outcompete the r-selected pioneers for light, water and nutrients, so pioneers are gradually replaced (1 mark).\n\nNote the irony worth stating: pioneers create the conditions that eliminate them.",
        complexity: "complex_familiar",
      },
      {
        front:
          "A study of an abandoned farm records the following over 100 years: small herbaceous plants decrease, percentage tree cover increases, and both air and soil temperature decrease. Explain the temperature result. (3 marks)",
        back:
          "Increasing tree cover means an increasingly closed canopy above the ground (1 mark). The canopy intercepts incoming solar radiation before it reaches ground level, so less energy is absorbed at the surface (1 mark). Reduced solar input at ground level lowers both soil temperature and the air temperature immediately above it, and the canopy also reduces wind and traps humidity, further moderating temperature extremes (1 mark).\n\nThis is a good example of the biotic community changing the abiotic conditions — the direction of causation runs both ways during succession.",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why biodiversity generally increases during succession but may plateau or slightly decline in a climax community. (4 marks)",
        back:
          "Biodiversity increases through most of succession because pioneers improve soil, nutrients and moisture, and structural complexity increases, creating more niches that additional species can occupy (2 marks).\n\nIn a mature climax community, dominant K-selected species — typically large trees — monopolise light and other key resources through superior competitive ability (1 mark). By competitive exclusion, some shade-intolerant or weaker competitors are eliminated, so species richness can level off or fall slightly even though biomass remains at its maximum (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Two sites are surveyed. Site X: 8 species, 2 t/ha biomass, dominated by fast-reproducing annuals with wind-dispersed seeds. Site Y: 31 species, 180 t/ha biomass, dominated by long-lived trees with large seeds and low reproductive output. Determine the successional stage of each and justify your determination using the data. (5 marks)",
        back:
          "Site X is early successional; Site Y is late successional / approaching climax (1 mark for both, correctly assigned).\n\nJustification from the data:\n- Biomass: 2 t/ha versus 180 t/ha — a 90-fold difference. Low biomass indicates little accumulated plant material and therefore an early stage; very high biomass indicates long-established large-bodied vegetation (1 mark).\n- Biodiversity: 8 versus 31 species. Species richness increases through succession as niches multiply, so the richer site is later (1 mark).\n- Life history: Site X's fast reproduction, wind dispersal and annual habit are r-selected traits characteristic of colonisers of disturbed ground (1 mark).\n- Site Y's long lifespan, large seeds and low reproductive output are K-selected traits, which are favoured only once conditions are stable and competition rather than colonisation determines success (1 mark).",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A conservation manager argues that because biodiversity increases during succession, a reserve should be protected from all fire so it can reach climax and maximise biodiversity. Evaluate this argument in an Australian context. (6 marks)",
        back:
          "Judgement: the argument is flawed — total fire exclusion is likely to reduce rather than maximise biodiversity in most Australian ecosystems (1 mark).\n\nWhere the argument holds:\n- It is true that biodiversity generally rises through succession as niches multiply, so some protection from catastrophic disturbance is justified (1 mark).\n\nWhy it fails:\n- Biodiversity does not increase indefinitely. In a climax community, dominant K-selected species monopolise light and by competitive exclusion eliminate shade-intolerant species, so richness can plateau or fall (1 mark).\n- Many Australian species are fire-adapted and REQUIRE fire to reproduce — serotinous species such as many Banksia release seed only after fire, and some seeds need smoke or heat to germinate. Excluding fire removes their regeneration trigger and they are lost from the reserve (1 mark).\n- Excluding fire removes the disturbance that maintains early-successional habitat, so species dependent on open, recently disturbed ground disappear as the whole reserve converges on one late-successional state (1 mark).\n- Suppressing fire allows fuel to accumulate, making an eventual unplanned fire far more intense and more destructive than the regular low-intensity fires the system evolved with — including fire regimes maintained by First Nations peoples over tens of thousands of years (1 mark).\n\nA better-supported position: a mosaic of patches at different successional stages, maintained by managed burning, sustains higher landscape-scale biodiversity than a uniform climax community.",
        complexity: "complex_unfamiliar",
      },

      // ----------------------------------------------------------------------
      // 3.2.15 — Spatial and temporal comparison
      // ----------------------------------------------------------------------
      {
        front:
          "Distinguish a spatial comparison from a temporal comparison in one line each, and give the one-word memory hook for each.",
        back:
          "Spatial = comparing different LOCATIONS — two forests, upstream vs downstream, coastal vs inland, positions along a transect. Hook: **WHERE**.\n\nTemporal = comparing different TIMES at the same place — day vs night, summer vs winter, before vs after disturbance, 5 years vs 100 years into succession. Hook: **WHEN**.",
        complexity: "simple_familiar",
      },
      {
        front:
          "What three things must an 'interpret' answer contain that a 'describe' answer does not?",
        back:
          "Trend → evidence → biological meaning.\n\n1. Trend — state the direction of the change or difference.\n2. Evidence — quote the actual figures from the data.\n3. Biological meaning — say what it indicates biologically.\n\n'Describe' stops after the trend. 'Interpret' scores nothing without the third step. Saying 'trees increased' is a description; 'tree cover rose from 5% to 62% over 100 years, indicating progression to a later successional stage' is an interpretation.",
        complexity: "simple_familiar",
      },
      {
        front:
          "Why can a bird survey conducted only during daylight underestimate an ecosystem's true species diversity?",
        back:
          "Species differ in when they are active. Nocturnal species — owls, nightjars — are inactive and undetectable during the day, so a daytime-only survey records the diurnal community and misses the nocturnal one entirely. The measured diversity is therefore lower than the real diversity. Migration and hibernation cause the same problem across seasons rather than across a day.",
        complexity: "simple_familiar",
      },
      {
        front:
          "Two rainforest sites are compared: Site A is sampled in January and Site B in July, and Site A shows higher insect diversity. Explain why this comparison cannot support the conclusion that Site A is the more diverse ecosystem. (3 marks)",
        back:
          "The comparison is intended to be spatial — testing whether location affects diversity — but the two sites were sampled at different times of year, so a temporal variable has been introduced alongside the spatial one (1 mark). Insect activity, abundance and life stage vary seasonally with temperature and rainfall, so some of the difference may be caused by the sampling month rather than by the site (1 mark). Because the spatial and temporal effects cannot be separated, the variables are confounded and no valid conclusion about site can be drawn — both sites must be sampled in the same period, or across matched periods, for the comparison to be valid (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A transect runs from an exposed coastal dune inland to sheltered woodland. Species richness rises steadily along it. Identify whether this is a spatial or temporal comparison, and explain the pattern. (4 marks)",
        back:
          "This is a spatial comparison — a single time point across different locations (1 mark).\n\nExplanation: the exposed dune experiences harsh abiotic conditions — salt spray, strong wind, intense light, low water retention in sand, low nutrients — so only a few highly tolerant specialist species can survive there (1 mark). Moving inland, shelter increases and salt exposure decreases, so conditions become progressively less extreme (1 mark). Less extreme conditions mean more species can tolerate the site, and increasing vegetation structure creates more niches, so species richness rises along the transect (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A wetland is surveyed in 2005 and again in 2025. Fish species richness falls from 18 to 11, mean water temperature rises 1.8 °C, and dissolved oxygen falls from 7.2 to 5.1 mg/L. Interpret these data. (4 marks)",
        back:
          "This is a temporal comparison — one location at two time points (1 mark).\n\nInterpretation using trend + evidence + biological meaning:\n- Species richness declined by 7 species (18 → 11), a 39% loss, indicating a substantial reduction in biodiversity (1 mark).\n- Water temperature rose 1.8 °C and dissolved oxygen fell 2.1 mg/L (7.2 → 5.1). These are linked: warmer water holds less dissolved oxygen (1 mark).\n- Biologically, reduced dissolved oxygen means species with high oxygen requirements can no longer meet their metabolic demands and are lost, while more tolerant species persist. The abiotic change has therefore reduced the carrying capacity of the wetland for oxygen-sensitive fish, explaining the fall in richness (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "You are given two graphs: Graph 1 compares canopy cover at four sites along a river in 2025. Graph 2 shows canopy cover at one of those sites from 1990 to 2025. State which comparison each graph supports, and explain what each can and cannot tell you. (4 marks)",
        back:
          "Graph 1 is a spatial comparison — four different locations at one time (1 mark). It can show how canopy cover differs with position along the river and can suggest which abiotic factors vary spatially, but it cannot show whether any site is changing, because there is only one time point (1 mark).\n\nGraph 2 is a temporal comparison — one location across 35 years (1 mark). It can show the direction and rate of change at that site and can indicate successional progression or degradation, but it cannot tell you whether that trend applies to the other three sites, because only one was tracked (1 mark).\n\nUsed together they are far stronger than either alone: the temporal series establishes that change is occurring and the spatial series establishes how widespread the pattern is.",
        complexity: "complex_familiar",
      },
      {
        front:
          "A council monitors a restored creek for 15 years. Native plant cover rises from 12% to 74%, macroinvertebrate families rise from 6 to 19, but water turbidity is unchanged and one introduced fish species has increased. Evaluate the success of the restoration. (7 marks)",
        back:
          "Judgement: the restoration has been substantially but not fully successful (1 mark — 'evaluate' requires a stated judgement; describing the data alone scores nothing).\n\nEvidence of success:\n- Native plant cover rose from 12% to 74%, a six-fold increase, indicating native vegetation has re-established and is now dominant (1 mark).\n- Macroinvertebrate families rose from 6 to 19, indicating substantially increased biodiversity and, since many macroinvertebrate families are pollution-sensitive, improved habitat quality (1 mark).\n- Increasing vegetation and biodiversity over time is consistent with successional progression toward a more mature community, suggesting the system is self-sustaining rather than dependent on ongoing intervention (1 mark).\n\nEvidence against full success:\n- Turbidity is unchanged, indicating the sediment input causing it originates upstream or from catchment runoff, outside the restored reach. Restoration within the creek cannot fix a catchment-scale cause (1 mark).\n- The introduced fish species has increased, and it may prey on or outcompete native species. Improved habitat has benefited the invader as well as the natives, so biodiversity gains may not be secure (1 mark).\n\nQualification for full marks: 15 years is short relative to succession timescales, and the trends may not have stabilised — continued monitoring is needed before declaring the outcome final, and control of the introduced species plus catchment-scale sediment management should be added (1 mark).",
        complexity: "complex_unfamiliar",
      },
    ],
  },
];

// ============================================================================

const DATA: Record<string, TopicBlock[]> = { BIO };

async function main() {
  const write = process.argv.includes("--write");
  console.log(write ? "MODE: --write (inserting)\n" : "MODE: dry run (no writes) — pass --write to insert\n");

  const grand: Record<Band, number> = { simple_familiar: 0, complex_familiar: 0, complex_unfamiliar: 0 };
  const grandInserted: Record<Band, number> = { simple_familiar: 0, complex_familiar: 0, complex_unfamiliar: 0 };

  for (const code of Object.keys(DATA)) {
    const subject = await prisma.subject.findFirst({ where: { shortCode: code } });
    if (!subject) {
      console.log(`${code}: no such subject in the database — skipping\n`);
      continue;
    }
    console.log(`${code} — ${subject.name}`);

    for (const block of DATA[code]) {
      const unit = await prisma.unit.findFirst({
        where: { subjectId: subject.id, number: block.unitNumber },
      });
      if (!unit) {
        console.log(`  U${block.unitNumber} ${block.topicTitle}: unit not found — skipping`);
        continue;
      }
      const topic = await prisma.topic.findFirst({
        where: { unitId: unit.id, title: block.topicTitle },
      });
      if (!topic) {
        console.log(`  U${block.unitNumber} ${block.topicTitle}: topic not found — skipping`);
        continue;
      }

      const existing = await prisma.card.findMany({
        where: { userId: subject.userId, topicId: topic.id },
        select: { front: true },
      });
      const existingFronts = new Set(existing.map((c) => c.front));

      console.log(`  U${block.unitNumber} T${topic.number} ${block.topicTitle} [${topic.unlockState}]`);

      for (const band of ["simple_familiar", "complex_familiar", "complex_unfamiliar"] as Band[]) {
        const cards = block.cards.filter((c) => c.complexity === band);
        grand[band] += cards.length;

        const toInsert = cards.filter((c) => !existingFronts.has(c.front));
        const dupes = cards.length - toInsert.length;
        const label = band === "simple_familiar" ? "SF" : band === "complex_familiar" ? "CF" : "CU";

        if (write && toInsert.length > 0) {
          const draft: DraftCard[] = toInsert.map((c) => ({
            front: c.front,
            back: c.back,
            cardType: c.cardType ?? "basic",
            complexity: c.complexity,
          }));
          const inserted = await (await deps()).saveCards(
            subject.userId,
            subject.id,
            topic.id,
            draft,
            ["notebook", "beschy-notes", code, band],
          );
          grandInserted[band] += inserted;
          console.log(`     ${label}: +${inserted} inserted${dupes ? ` (${dupes} already present)` : ""}`);
        } else {
          console.log(`     ${label}: ${toInsert.length} new${dupes ? ` (${dupes} already present)` : ""}`);
        }
      }
    }
    console.log();
  }

  const total = grand.simple_familiar + grand.complex_familiar + grand.complex_unfamiliar;
  const totalIns = grandInserted.simple_familiar + grandInserted.complex_familiar + grandInserted.complex_unfamiliar;
  console.log("SUMMARY");
  console.log(`  simple_familiar:    ${grand.simple_familiar} defined${write ? `, ${grandInserted.simple_familiar} inserted` : ""}`);
  console.log(`  complex_familiar:   ${grand.complex_familiar} defined${write ? `, ${grandInserted.complex_familiar} inserted` : ""}`);
  console.log(`  complex_unfamiliar: ${grand.complex_unfamiliar} defined${write ? `, ${grandInserted.complex_unfamiliar} inserted` : ""}`);
  console.log(`  total:              ${total} defined${write ? `, ${totalIns} inserted` : ""}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
