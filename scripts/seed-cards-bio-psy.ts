/**
 * Hand-authored complex_familiar and complex_unfamiliar cards for Biology and
 * Psychology.
 *
 * Both subjects already have dense simple_familiar recall coverage from an
 * imported Anki deck (BIO 1,022 cards, PSY 1,154 cards) — every one of them
 * unbanded recall. This script does NOT add more recall. It fills the gap at
 * the top end: exam-style multi-step questions (complex_familiar) and full
 * scenario questions with a marking guide (complex_unfamiliar), written by
 * hand against the actual syllabus wording pulled from the database.
 *
 * No AI provider is called anywhere in this file. Every front/back below is
 * literal data.
 *
 * Run:  npx tsx scripts/seed-cards-bio-psy.ts [--write]
 *
 * Dry run by default; --write inserts. Idempotent — a card is skipped if a
 * card with the same `front` already exists in that topic, so re-running
 * never duplicates rows.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
// Type-only, so it is erased at compile time and cannot drag src/lib/prisma
// into the module graph. A VALUE import here is hoisted above config(), so the
// Prisma singleton is constructed with an empty DATABASE_URL and falls back to
// localhost:5432 — which is exactly how this failed the first time.
import type { DraftCard } from "../src/lib/cards";

/** Loaded only after config() has run. See the note above. */
async function deps() {
  return import("../src/lib/cards");
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

type Band = "complex_familiar" | "complex_unfamiliar";
type Card = { front: string; back: string; complexity: Band };
type TopicBlock = { unitNumber: number; topicTitle: string; cards: Card[] };

// ============================================================================
// BIOLOGY
// ============================================================================
const BIO: TopicBlock[] = [
  {
    unitNumber: 3,
    topicTitle: "Biodiversity and populations",
    cards: [
      // ---- complex_familiar (18) ----
      {
        front:
          "A capture-recapture study on a possum population marks 40 individuals on the first capture. On the second capture, 50 individuals are caught, of which 8 are already marked. (a) Calculate the estimated population size using the Lincoln index. (b) State one assumption of this method. (3 marks)",
        back:
          "(a) N = M×n/m = (40×50)/8 = 250 possums. 1 mark for correct substitution, 1 mark for the correct answer with units (250 possums). (b) 1 mark for any valid assumption: the population is closed (no births, deaths, immigration or emigration between captures); marked and unmarked individuals mix randomly/have equal chance of capture; marks are not lost or overlooked; marking does not affect survival or catchability.",
        complexity: "complex_familiar",
      },
      {
        front:
          "A quadrat survey of a grassland records three species: A (n=12), B (n=7), C (n=1), N=20 total individuals. Calculate the Simpson's Diversity Index, SDI = 1 − (Σn(n−1)) / (N(N−1)). (4 marks)",
        back:
          "n(n−1) for each species: A = 12×11 = 132, B = 7×6 = 42, C = 1×0 = 0 (1 mark). Σn(n−1) = 174 (1 mark). N(N−1) = 20×19 = 380 (1 mark). SDI = 1 − 174/380 = 1 − 0.458 = 0.54 (1 mark, accept 2 d.p. equivalent).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A student wants to (i) determine the species diversity of insects in a grassland and (ii) estimate the population size of one skink species in the same grassland. State the most appropriate sampling technique for each investigation and justify your choice. (4 marks)",
        back:
          "(i) Quadrats (1 mark) — quadrats can be placed randomly/systematically multiple times across the grassland to record which species are present and their relative abundance/cover, giving richness and evenness data cheaply (1 mark). (ii) Capture-recapture (1 mark) — the skink is a single, mobile species, so a fixed-area technique like quadrats cannot reliably estimate its total population; capturing, marking, releasing and recapturing allows the Lincoln index to be applied to a moving population (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Compare exponential (J-curve) and logistic (S-curve) population growth in terms of (a) the shape of the growth curve and (b) the role of carrying capacity. (4 marks)",
        back:
          "(a) Exponential growth accelerates continuously with no upper limit, producing a J-shaped curve; logistic growth starts exponential but slows as the population approaches carrying capacity, producing an S-shaped curve (2 marks — one per curve, addressed against each other). (b) Exponential growth assumes unlimited resources, so carrying capacity plays no role; logistic growth explicitly levels off at carrying capacity (K) because density-dependent factors (food, space, competition) increasingly limit growth as population size increases (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Two 1 m² quadrats are compared for a wildflower species: Quadrat 1 has 60% cover and appears in 8/10 sub-samples (80% frequency); Quadrat 2 has 60% cover and appears in 3/10 sub-samples (30% frequency). Explain what the frequency data adds to the cover data that cover alone does not show. (3 marks)",
        back:
          "Equal % cover in both quadrats could suggest the species is equally distributed (1 mark). But Quadrat 1's high frequency shows the species is spread evenly across most sub-samples (uniform/widespread distribution), while Quadrat 2's low frequency shows the same total cover is concentrated in only a few sub-samples — the species is patchily/clumped distributed (1 mark). This shows % cover alone cannot distinguish an evenly spread population from a clumped one; frequency data is needed to reveal distribution pattern (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why the presence of microhabitats within an ecosystem can affect the validity and reliability of a sampling method that uses only randomly placed quadrats. (3 marks)",
        back:
          "Microhabitats create localised differences in abiotic conditions (e.g. light, moisture) that cause species to be clumped rather than uniformly distributed (1 mark). Purely random placement can therefore over-sample some microhabitats and under-sample or entirely miss others by chance, so repeated samples give inconsistent results (poor reliability) and the sample may not represent the true community composition (poor validity) (1 mark). This is why stratified sampling — sampling proportionally within each identified microhabitat/stratum — is used instead, to ensure every microhabitat is represented (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A population has a birth rate of 45 per 1000, a death rate of 18 per 1000, an immigration rate of 6 per 1000 and an emigration rate of 11 per 1000. Calculate the population growth rate. (3 marks)",
        back:
          "Growth rate = (births + immigration) − (deaths + emigration) (1 mark). = (45 + 6) − (18 + 11) = 51 − 29 (1 mark). = 22 per 1000 (i.e. +2.2% growth rate) (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A reserve has a rainforest core, a transitional edge zone, and open woodland, each covering a different proportion of the total area. Explain why stratified sampling is more appropriate here than simple random sampling for estimating overall species diversity. (3 marks)",
        back:
          "The reserve is not uniform — the three zones likely differ substantially in species composition due to differing abiotic conditions (light, moisture, canopy cover) (1 mark). Simple random sampling could by chance under-represent the smallest zone, biasing the diversity estimate toward the larger zones (1 mark). Stratified sampling divides the reserve into these known zones and samples each in proportion to its area, ensuring every zone's contribution to diversity is captured (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why r-strategists are favoured in unstable or frequently disturbed environments, while K-strategists are favoured in stable environments. (4 marks)",
        back:
          "r-strategists produce many offspring with little parental care and reach reproductive maturity quickly (1 mark) — in an unstable environment where mortality is high and unpredictable, this rapid reproduction maximises the chance that some offspring survive before conditions change again (1 mark). K-strategists produce few offspring with high parental investment and mature slowly (1 mark) — in a stable environment near carrying capacity, competition for limited resources favours offspring that are well-provisioned and more likely to survive to compete successfully, rather than sheer numbers (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Using the dichotomous key steps below, identify the organism. Step 1: Has wings → go to 2; No wings → Species D. Step 2: Wings covered in scales → Species A; Wings clear/membranous → go to 3. Step 3: One pair of wings → Species B; Two pairs of wings → Species C. An organism has two pairs of clear, membranous wings. Identify it, and explain how a dichotomous key works as a classification tool. (3 marks)",
        back:
          "Species C (1 mark) — has wings (step 1), wings are clear/membranous not scaled (step 2), and has two pairs (step 3). Explanation: a dichotomous key presents a series of paired, mutually exclusive statements about observable characteristics; at each step the user selects the statement that matches the specimen, which leads either to the next pair of statements or to a species identification, progressively narrowing down the possibilities (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why the biological species concept is difficult to apply to (a) asexually reproducing organisms and (b) fossil organisms. (3 marks)",
        back:
          "The biological species concept defines a species as a population capable of interbreeding to produce fertile offspring (1 mark, implied definition needed for context). (a) Asexual organisms do not interbreed at all, so there is no breeding population to test the definition against (1 mark). (b) Fossils cannot be tested for interbreeding or reproductive compatibility because the organisms are dead and only physical/morphological evidence remains (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A 20 m transect is divided into ten 2 m sections. A grass species is recorded present in 6 of the 10 sections (giving % frequency) and covers an estimated 35% of the total transect area (giving % cover). Calculate the % frequency, and explain what % frequency measures that % cover does not. (4 marks)",
        back:
          "% frequency = (6/10) × 100 = 60% (2 marks: method + answer). % frequency measures how widely a species is distributed across the sampled area (presence/absence per section), regardless of how much space it occupies where present; % cover measures the actual area occupied, so a species can have high cover concentrated in few sections (low frequency) or low cover spread across many sections (high frequency) (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A student's initial sampling design uses only 3 quadrats placed by eye near the shadiest part of a field to \"get better data\" and uses a single observer's estimate of % cover with no calibration. State two strategies to minimise bias in this design and explain how each addresses a specific flaw. (3 marks)",
        back:
          "Any two of: (1) Use a random-number generator to place quadrats (addresses the flaw of choosing quadrat locations by eye, which introduces sampling bias toward one habitat type). (2) Increase the number and size of samples (addresses the flaw of only 3 quadrats, which is too few to represent variation across the whole field). (3) Establish clear counting criteria and calibrate the % cover estimate (e.g. cross-check between observers, use a cover-abundance scale) (addresses the flaw of a single uncalibrated observer's subjective estimate). 1 mark per correctly matched strategy + explanation, to a maximum of 3 marks.",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how a soil moisture gradient from a creek bank to a ridge top could produce a clumped distribution of a moisture-loving fern species. (3 marks)",
        back:
          "Soil moisture is highest near the creek and decreases with distance/elevation toward the ridge (1 mark). Because the fern requires consistently moist soil to survive and reproduce, individuals are only able to establish and persist where soil moisture is above the species' tolerance threshold — near the creek (1 mark). This produces a clumped distribution because suitable habitat is patchy (concentrated near the creek) rather than spread evenly across the gradient (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Two ecosystems are described: Ecosystem X has a closed canopy, high rainfall (>1500 mm/yr) and mean annual temperature of 24°C. Ecosystem Y has scattered trees over grassland with 25–70% projective foliage cover. State which classification scheme (Specht or Holdridge) is best suited to classify each, and identify the type of data each scheme primarily relies on. (4 marks)",
        back:
          "Ecosystem X: best classified using the Holdridge life zone scheme (1 mark), which relies primarily on climatic data — mean annual temperature and precipitation (1 mark). Ecosystem Y: best classified using Specht's classification system (1 mark), which relies primarily on vegetation structure data — specifically the projective foliage cover of the dominant stratum (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Compare species richness and species evenness as measures of diversity, and explain one limitation of using species richness alone. (3 marks)",
        back:
          "Species richness counts the number of different species present in a community, while species evenness describes how equally individuals are distributed among those species (1 mark, addressed against each other). Limitation: two communities can have identical species richness but very different evenness — e.g. a community dominated by one species with several rare others has low evenness and feels far less diverse than a community with the same richness but similar abundances of each species; richness alone would score both as equally diverse, hiding this difference (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A population is monitored over 8 years. Growth is rapid and continuously accelerating for the first 5 years, then slows and levels off near a stable value for the remaining 3 years. State whether this describes a J-curve or an S-curve, and justify your answer using features of the data described. (3 marks)",
        back:
          "S-curve (logistic growth) (1 mark). Justification: the initial rapid, accelerating growth matches the early exponential phase of logistic growth, but the slowing and levelling off after year 5 indicates the population is approaching carrying capacity as density-dependent limiting factors increasingly act — this levelling-off phase does not occur in a J-curve, which continues to accelerate indefinitely (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why a violation of the capture-recapture assumption that \"marked individuals become no more or less likely to be caught again\" leads to an overestimate of population size, if marked individuals become trap-shy (avoid recapture). (3 marks)",
        back:
          "If marked individuals become trap-shy, fewer of them are recaptured on the second sampling occasion than would occur under random mixing (1 mark). This lowers m (the number of marked individuals recaptured) in the Lincoln index formula N = M×n/m (1 mark). Because m is the denominator, a smaller m produces a larger calculated N, so the population size is overestimated relative to the true population (1 mark).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (11) ----
      {
        front:
          "Ecologists studying a newly discovered, isolated population of skinks on an island use capture-recapture across three consecutive months. The population estimate rises sharply between month 1 and month 3, a period that coincides with the species' wet-season breeding period. Explain why capture-recapture becomes unreliable when applied across a breeding season, propose a modified sampling protocol that would improve reliability, and justify why your change addresses the specific problem you identified. (6 marks)",
        back:
          "Model response and marking points: (1) Capture-recapture assumes a closed population between the marking and recapture events — no births, deaths, immigration or emigration. (2) During the breeding season, new individuals (hatchlings) are added to the population between captures, so the population is no longer closed. (3) This violates the closed-population assumption directly, because n (individuals in the second sample) now includes unmarked new individuals who were never available to be marked, not just previously-uncounted adults. (4) Consequence: the ratio of marked to unmarked individuals in the second sample no longer reflects the true marked proportion of the original population, so the Lincoln index systematically overestimates the population size. (5) Proposed fix: complete both the marking and recapture sampling within a single short window BEFORE the breeding season begins (or restrict the study to a non-breeding period), so the population can be reasonably treated as closed. (6) Justification: shortening the interval and timing it outside breeding directly removes the source of new, unmarked individuals entering the population between samples, restoring the closed-population assumption the method depends on. 1 mark per distinct point, to a maximum of 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A conservation team compares Simpson's Diversity Index between a heathland plot burnt 12 months ago (SDI = 0.52) and a nearby unburnt reference plot (SDI = 0.81), and concludes that fire reduces biodiversity. Evaluate this conclusion. Your response must reference species richness, species evenness, AND at least one confounding variable that could also explain the difference. (6 marks)",
        back:
          "Model response and marking points: (1) A lower SDI in the burnt plot is consistent with reduced diversity, supporting the conclusion at face value. (2) However, SDI alone conflates richness and evenness — the lower value could reflect fewer species present (lower richness), or the same number of species with one or two now dominating post-fire (lower evenness), and these have different ecological explanations. (3) Without seeing the richness and evenness components separately, the specific mechanism (species loss vs a shift in dominance) cannot be identified from SDI alone. (4) Confounding variable: the two plots may differ in more than fire history — e.g. soil type, slope/drainage, distance from seed sources for recolonisation, or time since the unburnt plot last burnt — any of which could independently affect diversity. (5) Because the plots were not controlled for these variables, the study cannot isolate fire as the sole cause of the diversity difference; it is a correlation, not a demonstrated causal relationship. (6) Judgement: the conclusion is only partially supported — the SDI difference is real, but attributing it confidently and specifically to fire (rather than a confound, or without knowing whether richness or evenness drove the change) is not fully justified by the data given. Marking guide: 1 mark for acknowledging the data direction; 1 mark for the richness/evenness limitation of SDI; 1 mark for identifying a specific plausible confound; 1 mark for explaining why the confound undermines causal attribution; 1 mark for a stated, reasoned judgement; 1 mark for overall coherence linking judgement to evidence.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A student's report states: \"Quadrats were placed randomly by throwing them over my shoulder across a 10 m × 10 m grassland plot to sample plant species abundance. Three quadrats were used, and this gave an accurate estimate of the plot's species diversity.\" Identify two methodological flaws in this approach, explain why each undermines the validity or reliability of the diversity estimate, and state a specific correction for each. (6 marks)",
        back:
          "Model response and marking points, any two flaws developed fully: Flaw 1 — \"throwing over the shoulder\" is not a valid randomisation method; the thrower's position and throwing arm bias where quadrats land, so placement is not truly random, meaning the sample is not representative of the whole plot (this undermines validity). Correction: use a random-number generator to select randomised coordinates (e.g. metre marks along two measuring tapes forming a grid) for quadrat placement. Flaw 2 — three quadrats is too small a sample size to capture the variation present across a 10 m × 10 m area; a small sample is highly sensitive to chance placement, so repeating the study would likely give a different result (this undermines reliability). Correction: increase the number of quadrats sampled (e.g. to 10–20) to better capture spatial variation and allow the estimate to stabilise. Marking: 2 marks per flaw (1 for identifying/explaining why it undermines validity or reliability, 1 for a specific correct correction) × 2 flaws = up to 4 marks, plus up to 2 marks for correctly distinguishing which flaw affects validity vs reliability.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Design an investigation to determine whether soil moisture affects the distribution of a named moisture-sensitive plant species across a gradient from a creek bank to a dry ridge top. Your response must state: the sampling method and technique used, how other abiotic variables would be controlled, what data would be collected, and how the data would be analysed to draw a conclusion. (6 marks)",
        back:
          "Model response and marking points: (1) Sampling method/technique — use a line transect (or belt transect) running from the creek bank to the ridge top, with quadrats placed at regular, systematic intervals along it, to sample how species distribution changes along the gradient. (2) Named plant species and named abiotic factor stated (e.g. a fern species; soil moisture). (3) Controlling other variables — take all quadrats along the same transect on the same day to control for weather/recent rainfall, and choose a transect line with similar canopy cover/light exposure throughout so light is not a confounding factor alongside moisture. (4) Data collected — at each quadrat, record % cover or presence/absence of the target species AND measure soil moisture (e.g. with a soil moisture probe) at the same point. (5) Analysis — plot % cover (or frequency) of the species against soil moisture reading for each quadrat position; a consistent decline in cover/frequency as soil moisture decreases along the transect would support the conclusion that soil moisture affects distribution. (6) A valid conclusion statement tied back to the data pattern, not just \"it affects it\". 1 mark per distinct element present and correctly justified, to a maximum of 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A population of feral pigs shows exponential growth for the first 5 years after being introduced to an island, then growth slows and plateaus. Explain the shift from exponential to logistic growth using population growth concepts, identify TWO plausible density-dependent limiting factors specific to an island environment, and predict what would happen to the growth curve if a new, abundant food source were introduced once the population had plateaued. (6 marks)",
        back:
          "Model response and marking points: (1) In the first years, resources (food, space) are effectively unlimited relative to the small population, so growth is exponential — limited only by the pigs' biotic potential. (2) As the population grows, it approaches the island's carrying capacity, and density-dependent factors increasingly limit growth, causing the shift to logistic (S-curve) growth. (3–4) Two plausible island-specific density-dependent limiting factors, each explained: e.g. limited food supply on a fixed land area becoming depleted as pig numbers rise (intraspecific competition for food); limited fresh water availability on a small island; increasing disease/parasite transmission as density rises; accumulating waste/degraded habitat quality from a growing population in a bounded area. (5) Prediction — introducing a new abundant food source would raise the effective carrying capacity of the island for pigs, since one of the previous limiting factors is relieved; the population would be expected to resume growth (a new phase of increase) before levelling off again at a new, higher plateau. (6) Reasoning explicitly links the new food source to a raised carrying capacity, not just \"the population would grow\". 1 mark per distinct, developed point to a maximum of 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Evaluate the claim: \"The Linnaean classification system is now obsolete because it does not reflect evolutionary relatedness.\" Your response must refer to at least one strength and one limitation of the Linnaean system, and reach a justified conclusion. (5 marks)",
        back:
          "Model response and marking points: (1) Strength — the Linnaean system's hierarchical structure allows scientists to organise, analyse and communicate huge amounts of biodiversity data efficiently, and lets scientists infer similarities between species from shared taxonomic groupings. (2) Limitation — because the system was originally built primarily on physical/morphological features, its groupings do not always reflect true evolutionary relatedness; species can be re-classified as new (e.g. genetic) evidence becomes available, showing the original classification did not always track shared ancestry accurately. (3) Judgement — the claim overstates the case: the system is not obsolete, because it remains useful and continues to be updated/revised as new evidence (e.g. molecular data) comes to light, rather than being discarded. (4) Supporting reasoning for the judgement — a classification system does not need to perfectly reflect evolutionary relatedness at all times to remain useful, provided it can be revised; obsolescence would mean it is no longer usable at all, which is not the case since taxonomists still actively work within and revise the Linnaean framework. (5) Overall coherence: judgement is clearly stated AND supported by both the strength and the limitation named. Marking: 1 mark each for strength, limitation, stated judgement, supporting reasoning, and overall coherence — maximum 5.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Two rainforest fragments share the same Specht classification and have similar species richness. The fragment near an urban edge has SDI = 0.61; the fragment far from the urban edge has SDI = 0.89. Interpret what this pattern suggests about the effect of proximity to an urban edge on community structure, referring explicitly to the concept of evenness. (5 marks)",
        back:
          "Model response and marking points: (1) Since richness is similar between the two fragments but SDI differs substantially, the difference in SDI must be driven mainly by a difference in evenness, not by a difference in the number of species present. (2) A lower SDI with similar richness indicates lower evenness in the urban-edge fragment — meaning individuals are less equally distributed among the species present; one or a few species likely dominate in abundance. (3) This pattern is consistent with urban-edge effects favouring a small number of disturbance-tolerant or generalist species that become dominant, while other species persist only in low numbers (rather than being lost from the fragment entirely, since richness is similar). (4) This distinguishes the urban-edge effect here from a scenario of species loss — the community has not necessarily lost species, but its structure has shifted toward domination by fewer species. (5) A stated interpretation that ties the SDI/evenness reasoning explicitly to \"community structure\" (dominance pattern) rather than simply restating that diversity is lower. Marking: up to 5 marks distributed across these points, with correct use of \"evenness\" as the specific mechanism required for full marks.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A conservation team must decide between (i) a captive breeding program for a critically endangered K-strategist species and (ii) culling to control an r-strategist pest species overrunning the same habitat. Using reproductive strategy characteristics, justify why standard culling would be ineffective — or harmful — if applied to the K-strategist, and suggest an alternative management approach appropriate to K-strategist biology. (6 marks)",
        back:
          "Model response and marking points: (1) r-strategists produce very large numbers of offspring quickly with little parental investment, so culling (which removes individuals) is offset by their high reproductive rate — the population can rebound quickly, which is why culling is a reasonable ongoing control strategy for a pest r-strategist. (2) K-strategists produce few offspring, invest heavily in each one, and mature slowly, so their populations recover from losses far more slowly. (3) Applying culling-style population reduction to a K-strategist that is already critically endangered would further reduce an already small population, and because reproduction is slow, the population could not recover before extinction risk becomes severe — culling would be actively harmful, not just ineffective. (4) K-strategists are also likely to have low genetic diversity if the population is already small/endangered, so further reducing numbers increases the risk of losing genetic diversity, compounding extinction risk (link to the concept that reduced genetic diversity raises extinction risk). (5) Alternative approach — a captive breeding program (or similar) that increases the number of offspring surviving to maturity and maximises genetic diversity retained (e.g. genetic management to avoid inbreeding, staged reintroduction), which matches the slow, high-investment reproductive strategy of a K-strategist. (6) Explicit justification linking the alternative to K-strategist biology (small offspring number but each individual matters more to population recovery). 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A citizen-science biodiversity survey uses only untrained volunteers, sampling during daylight hours, along publicly accessible walking trails within a large nature reserve. Explain two ways this sampling approach could bias the species richness and evenness estimates for the whole reserve, and for each, state the likely direction of the bias (over- or under-estimate). (6 marks)",
        back:
          "Model response and marking points, any two developed: Bias 1 — sampling only along walking trails means habitat away from trails (which may differ substantially in vegetation/microhabitat) is never sampled, so species restricted to those areas are missed; this would under-estimate true species richness for the whole reserve. Bias 2 — sampling only during daylight hours means nocturnal species (e.g. many mammals, some invertebrates) are systematically excluded, again under-estimating overall species richness, and would inflate the apparent evenness/dominance of easily-observed daytime species relative to their true share of the community. Bias 3 (alternative) — untrained volunteers are more likely to correctly identify common, conspicuous species and miss or misidentify rare or cryptic species, which would under-estimate richness of rare species and inflate the apparent evenness toward common species (since rare ones are undercounted or missed entirely). Marking: 3 marks per bias fully explained (1 for identifying the sampling limitation, 1 for the mechanism by which it distorts the estimate, 1 for the correct direction of bias) × 2 = maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A landholder wants to know whether land clearing on one side of a creek has reduced species diversity compared to an uncleared reference site on the other side. Devise a fair sampling comparison — including method, technique, and how you would control for the confound that the two sites may differ in more than just clearing history (e.g. soil type) — and justify why your design supports a valid conclusion about causation. (6 marks)",
        back:
          "Model response and marking points: (1) Sampling method/technique — use randomly or systematically placed quadrats (or a belt transect) of the same size and number on both the cleared and uncleared sides, recording species present, % cover and/or abundance at each. (2) Matching sites for a confound — before selecting exact quadrat locations, first check that both sides have comparable soil type, slope and distance from the creek (e.g. by choosing sampling zones at similar distances from the creek on each side), so that any diversity difference is not simply explained by an unrelated pre-existing difference between the sides. (3) Controlling sampling effort — use identical sample size, quadrat size and timing (same season/day) on both sides so the two datasets are directly comparable. (4) Calculate and compare a diversity measure (e.g. SDI, richness and evenness) for each side using the same formula. (5) Justification for validity — because sampling effort and site characteristics other than clearing history are held constant (controlled), any consistent difference in diversity between the two sides can be more confidently attributed to the clearing itself rather than to a confounding variable. (6) Acknowledge a limitation — even with matching, this remains a comparative (not a true controlled experiment) design because clearing was not randomly assigned, so causation should be inferred cautiously; other unmeasured differences could still exist. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A team estimates a fish population in a large lake using tag-recapture, but the lake is connected to a river along which fish regularly migrate in and out. Explain why the standard capture-recapture assumptions are more likely to be violated in this open system than in an isolated pond, identify which specific assumption is most threatened, and describe how a scientist could adapt the method to reduce this source of error. (5 marks)",
        back:
          "Model response and marking points: (1) Capture-recapture requires the population to be closed between the marking and recapture events — no immigration or emigration. (2) In a lake connected to a river, fish can freely migrate in and out between the two sampling events, so individuals present at recapture may include unmarked fish that were never part of the original marked population (immigrants), and marked fish may leave and become unavailable for recapture (emigrants). (3) The specific assumption most threatened is the closed-population assumption (no immigration/emigration during the study). (4) Consequence if unaddressed — immigration adds unmarked individuals to the recapture sample, inflating n and reducing the proportion marked, which causes the Lincoln index to overestimate the true resident population. (5) Adaptation — shorten the time interval between marking and recapture as much as practically possible to minimise the opportunity for migration to occur, and/or physically restrict the study to a section of the lake (e.g. using a temporary barrier/net across the connecting channel) to approximate a closed system during the study period. Marking: 1 mark per developed point, maximum 5.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
  {
    unitNumber: 3,
    topicTitle: "Functioning ecosystems and succession",
    cards: [
      // ---- complex_familiar (18) ----
      {
        front:
          "Producers in a food chain contain 20,000 kJ of energy. The primary consumers that eat them contain 1,800 kJ. Calculate the percentage energy transfer efficiency between these two trophic levels, and state the general rule of thumb for energy transfer efficiency between trophic levels. (3 marks)",
        back:
          "Efficiency = (1,800 / 20,000) × 100 = 9% (2 marks: correct method + correct answer). General rule: on average only about 10% of energy is transferred from one trophic level to the next (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why only a small proportion of energy is transferred from one trophic level to the next. (3 marks)",
        back:
          "Not all of an organism at one trophic level is eaten or is digestible by the next (e.g. bone, fur, roots left uneaten or excreted as waste) (1 mark). Of the energy that is assimilated, a large proportion is used in cellular respiration to generate ATP for the organism's own life processes and is ultimately lost as heat, rather than being converted into new biomass (1 mark). Only the energy actually converted into new growth/biomass is available to be passed on to the next trophic level when the organism is eaten (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "An ecosystem has a gross primary productivity (GPP) of 12,000 kJ/m²/yr. Producers use 4,500 kJ/m²/yr for their own respiration. Calculate the net primary productivity (NPP), and explain what NPP represents that GPP does not. (3 marks)",
        back:
          "NPP = GPP − R = 12,000 − 4,500 = 7,500 kJ/m²/yr (2 marks: method + answer). NPP represents the energy actually available as new biomass to be passed on to primary consumers/the rest of the ecosystem, whereas GPP is the total energy fixed by photosynthesis before the producers' own respiratory losses are subtracted (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Compare mutualism and parasitism in terms of the effect of the interaction on each species involved. (3 marks)",
        back:
          "In mutualism, both species benefit from the interaction (+/+) (1 mark). In parasitism, one species (the parasite) benefits while the other (the host) is harmed (+/−) (1 mark). Both interactions involve close, often long-term association between two species, but they are distinguished by whether the relationship is beneficial or harmful to the second species (1 mark, addressed against each other).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Two barnacle species occupy overlapping rocky-shore zones. In laboratory conditions where only one species is present, both survive across the full zone. When both are present together, one species is consistently excluded from the upper zone. Explain this outcome using the competitive exclusion principle. (3 marks)",
        back:
          "The competitive exclusion principle states that two species cannot indefinitely occupy the same ecological niche in the same habitat, because one will always out-compete the other for the shared limiting resource(s) (1 mark). In isolation, each species can survive across the full zone because there is no competitor to exclude it (1 mark). When together, the superior competitor excludes the other from the zone where their niches overlap most, restricting the less competitive species to a narrower realised niche than its fundamental niche (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "In a food web, the removal of Species X (a mid-level predator with links to six other species) causes several prey populations to boom and several plant populations to subsequently crash from overgrazing, altering the whole community structure. State what type of species X is, and identify the data used to reach this conclusion. (3 marks)",
        back:
          "Species X is a keystone species (1 mark). This is identified from: its high number of connections in the food web relative to other species (i.e. its interactions affect many other species) (1 mark), and the observation that its removal produced a disproportionately large effect on community structure (prey booms and subsequent vegetation crash) relative to its own abundance/biomass (1 mark) — the defining feature of a keystone species.",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how the removal of a keystone predator can trigger a trophic cascade that reduces the biodiversity of a plant community. (4 marks)",
        back:
          "Removing the keystone predator releases its main prey (herbivores) from predation pressure (1 mark). The herbivore population increases rapidly because a major source of mortality is gone (1 mark). The larger herbivore population then overgrazes plant species, particularly those most palatable/vulnerable (1 mark). This reduces plant species diversity and can alter the physical structure of the habitat, which in turn affects other species that depend on that vegetation — a cascading effect through multiple trophic levels caused by a change at the top (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why a pyramid of numbers can sometimes appear inverted (e.g. one large tree supporting thousands of insect herbivores), while a pyramid of energy is never inverted. (3 marks)",
        back:
          "A pyramid of numbers simply counts individual organisms at each trophic level, and a single large producer (like a tree) can support enormous numbers of much smaller consumers, making the base narrower than the level above it (1 mark). A pyramid of energy instead measures the total energy flow at each trophic level, and because energy is lost (as heat, in respiration, in undigested material) at every transfer, the energy available at each successive level is always smaller than the level below — the second law of thermodynamics guarantees this cannot be inverted (1 mark, plus 1 mark for correctly contrasting the two on this basis).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why monocultures are more susceptible to pest outbreaks and disease than ecosystems with high species diversity. (3 marks)",
        back:
          "In a monoculture, all individuals are genetically similar or identical and belong to a single species, so a pest or pathogen adapted to exploit that species has an abundant, uniform, undefended food source with no barriers to spread (1 mark). In a diverse ecosystem, susceptible individuals are interspersed among other species and genotypes that the pest/pathogen cannot use, which slows transmission between hosts (1 mark). This lack of genetic and species diversity in a monoculture removes the natural \"buffering\" effect that diversity provides against rapid outbreak spread (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A persistent pesticide enters a food chain at the producer level in low concentration. Explain why apex predators in this food chain accumulate the highest concentration of the pesticide in their tissues (biomagnification). (4 marks)",
        back:
          "The pesticide is persistent (not broken down or excreted) and fat-soluble, so it accumulates in an organism's tissue rather than being lost (1 mark). At each trophic level, a consumer eats many organisms from the level below across its lifetime, concentrating the toxin from all of them into its own smaller number of body (1 mark). Because only about 10% of biomass/energy is transferred between trophic levels but the toxin itself is not lost the same way, the concentration of the toxin (rather than being diluted) increases at each successive trophic level (1 mark). Apex predators, being at the top of the food chain, have accumulated the toxin passed up from every level below them, resulting in the highest tissue concentration (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Compare primary succession and secondary succession in terms of the starting substrate and the speed of the process. (4 marks)",
        back:
          "Primary succession begins on bare substrate with no pre-existing soil or organisms (e.g. bare rock after a volcanic eruption or retreating glacier), while secondary succession begins on substrate where soil and often a seed bank/some organisms already exist, following a disturbance that removed the community (e.g. after a fire or land clearing) (2 marks, addressed against each other). Because secondary succession does not require pioneer species to first build soil from scratch, it typically proceeds much faster than primary succession, which can take centuries to establish even initial soil (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Identify three features of pioneer species that make them effective colonisers of bare substrate, and explain how each feature addresses a specific challenge of colonising bare rock. (3 marks)",
        back:
          "Any three, each matched to a challenge: rapid growth and reproduction (allows quick establishment and reproduction before conditions change or competitors arrive); tolerance of harsh abiotic conditions such as high UV exposure, temperature extremes and low water/nutrient availability (bare rock offers no shelter or accumulated soil nutrients); production of many wind- or animal-dispersed seeds/spores (allows colonisation of substrate far from any existing vegetation); ability to fix nitrogen or otherwise contribute to soil formation (bare rock/substrate initially has no organic matter or nitrogen available). 1 mark per correctly matched feature and challenge, maximum 3.",
        complexity: "complex_familiar",
      },
      {
        front:
          "Site A has low species diversity, low total biomass, and is dominated by fast-growing annual plants. Site B has high species diversity, high total biomass, and a multi-layered canopy structure. State which site is at an earlier successional stage and justify your answer using two features of the data. (3 marks)",
        back:
          "Site A is at the earlier successional stage (1 mark). Justification: low species diversity and dominance by fast-growing annual (pioneer-type) species are characteristic of early succession, before slower-growing, more competitive species have had time to establish (1 mark); low total biomass and lack of vertical structure also indicate the community has not yet developed the complexity typical of a later-successional/climax community, unlike Site B's high biomass and multi-layered canopy (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how a severe, prolonged drought could reduce the carrying capacity of a grazing ecosystem for a herbivore population. (3 marks)",
        back:
          "Drought reduces water availability and plant growth (primary productivity) across the ecosystem (1 mark). Because the herbivore population's carrying capacity is set by the availability of food and water resources, a reduction in these resources lowers the maximum population size the ecosystem can sustainably support (1 mark). As the drought continues, the population may exceed the new, lower carrying capacity, leading to increased mortality/emigration until the population falls back in line with the reduced resource base (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A caterpillar population assimilates 8,000 kJ of energy from the plant material it eats. Of this, 6,200 kJ is used in respiration and 1,800 kJ is converted into new caterpillar biomass (growth). Calculate the net production efficiency (biomass produced ÷ energy assimilated × 100), and explain what this value indicates about energy available to the next trophic level. (3 marks)",
        back:
          "Net production efficiency = (1,800 / 8,000) × 100 = 22.5% (2 marks: method + answer). This indicates that only 22.5% of the energy the caterpillar assimilated is stored as biomass and therefore potentially available to be passed on to a predator that eats it — the rest (used in respiration) is lost as heat and unavailable to the next trophic level (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain the role of decomposers in nutrient cycling within an ecosystem, using the nitrogen or carbon cycle as an example. (3 marks)",
        back:
          "Decomposers (bacteria and fungi) break down dead organic matter and waste products from producers and consumers (1 mark). In doing so, they convert complex organic molecules (e.g. proteins, cellulose) back into simple inorganic forms — such as ammonium/nitrate in the nitrogen cycle, or carbon dioxide in the carbon cycle (1 mark). This returns essential nutrients to the soil or atmosphere in a form producers can take up again, allowing the nutrient to continue cycling through the ecosystem rather than remaining locked in dead biomass (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Compare an early-successional community and a climax community in terms of species diversity, total biomass, and stability. (4 marks)",
        back:
          "Species diversity: early-successional communities have low diversity, dominated by a few pioneer species, while climax communities have high diversity with many species occupying a wide range of niches (1 mark, compared). Biomass: early-successional communities have low total biomass, while climax communities have high, often maximal, biomass for that ecosystem type (1 mark, compared). Stability: early-successional communities are relatively unstable and continue to change (are replaced by later stages), while climax communities are relatively stable, self-perpetuating and change little further under existing conditions (2 marks, compared with reasoning).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A wetland receives runoff containing excess nitrogen and phosphorus from surrounding farmland. Explain how this pollution can lead to a reduction in species diversity within the wetland (eutrophication). (4 marks)",
        back:
          "The excess nutrients dramatically increase the growth of algae and fast-growing plants (an algal bloom) (1 mark). This bloom blocks sunlight from reaching submerged plants, reducing their photosynthesis and causing them to die back (1 mark). When the algae and dead plant matter are broken down, decomposer (bacterial) activity increases sharply, consuming large amounts of dissolved oxygen from the water (1 mark). The resulting low oxygen levels (hypoxia) kill oxygen-dependent species such as fish and invertebrates, reducing overall species diversity in the wetland (1 mark).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (11) ----
      {
        front:
          "Wolves are removed from a river valley ecosystem. Over the following years, the deer population increases substantially, riverbank vegetation is heavily overgrazed, and rates of riverbank erosion increase noticeably. Explain the ecological mechanism linking wolf removal to increased erosion, and evaluate ONE management option (reintroduction of wolves vs. active culling of deer) as a solution, considering at least one advantage and one limitation of your chosen option. (7 marks)",
        back:
          "Model response and marking points: (1) Wolves are a keystone predator; their removal releases deer from a major source of predation pressure/mortality. (2) With reduced predation, the deer population increases beyond what predation previously kept it at. (3) The larger deer population increases grazing pressure on riverbank vegetation, particularly palatable plant species along the water's edge. (4) Loss of riverbank vegetation removes the root systems that previously stabilised the soil, so the bank becomes more vulnerable to being washed away, increasing erosion — a trophic cascade linking a top predator to a physical, non-biological outcome (soil erosion). (5) Evaluated option chosen and stated clearly (either wolf reintroduction or deer culling). (6) One genuine advantage of the chosen option explained (e.g. reintroducing wolves restores a natural, self-sustaining predation pressure without ongoing human intervention; OR culling gives managers direct, immediate control over deer numbers). (7) One genuine limitation of the chosen option explained (e.g. wolf reintroduction can be slow to take effect and may create human–wildlife conflict; OR culling requires ongoing repeated intervention and does not restore the natural trophic structure). Marking: 1 mark per distinct developed point, maximum 7; full marks require a stated judgement AND both an advantage and a limitation of the chosen option (an evaluate question needs both a judgement and support).",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "An energy flow study of a lake ecosystem records: producers 50,000 kJ/m²/yr; primary consumers 4,000 kJ/m²/yr; secondary consumers 500 kJ/m²/yr; tertiary consumers 60 kJ/m²/yr. Calculate the energy transfer efficiency between each successive pair of trophic levels, and evaluate whether the ecosystem could realistically sustain a fifth trophic level. (6 marks)",
        back:
          "Model response and marking points: (1) Producers → primary consumers: (4,000/50,000) × 100 = 8%. (2) Primary → secondary consumers: (500/4,000) × 100 = 12.5%. (3) Secondary → tertiary consumers: (60/500) × 100 = 12%. (4) All three efficiencies calculated correctly with working shown. (5) Evaluation — applying a similar transfer efficiency (roughly 8–12%) to the 60 kJ/m²/yr available at the tertiary level would leave only around 5–7 kJ/m²/yr for a fifth trophic level, an extremely small energy budget. (6) Judgement with reasoning: a fifth trophic level is very unlikely to be sustainable, because the energy available would be too small to support even one individual predator with a viable population size/enough prey encounters, consistent with why most real food chains rarely exceed four to five trophic levels. Marking: 1 mark per correct efficiency calculation (3 marks total), 1 mark for the extrapolated estimate, 1 mark for a stated judgement, 1 mark for reasoning that supports the judgement using the numbers.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A student claims: \"A pyramid of numbers will always be a true pyramid shape, narrowing from producers to top predators, because energy is always lost between trophic levels.\" Identify the flaw in this argument, explain why it is incorrect, and give a specific example that disproves the claim. (5 marks)",
        back:
          "Model response and marking points: (1) The flaw is conflating a pyramid of numbers (which counts individual organisms) with a pyramid of energy (which measures energy flow) — these are different measures and do not always produce the same shape. (2) Explanation — energy IS always lost between trophic levels (true for a pyramid of energy), but the NUMBER of individuals at a trophic level depends on the size of the organisms involved, not directly on energy transfer; a single large producer can support very large numbers of small consumers. (3) Specific example: one large oak tree (a single producer) can support thousands of individual insect herbivores feeding on it, which would make a pyramid of numbers narrow at the producer level and wide at the primary consumer level — an inverted pyramid of numbers, despite energy still being lost overall between the two levels. (4) A correctly explained example is required, not just an assertion that exceptions exist. (5) Overall: the claim is incorrect because it wrongly assumes energy loss and organism-count shape must always match. Marking: 1 mark for identifying the flaw, 2 marks for the explanation, 2 marks for a correct, clearly explained example.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Design an investigation to determine whether two named plant species growing in the same garden bed are competing for light. Your response must state: the manipulated variable, how you would isolate light specifically as the resource being tested (controlling other resources), the measured variable(s), and what result would support the conclusion that competition for light is occurring. (6 marks)",
        back:
          "Model response and marking points: (1) Manipulated variable — grow the two species together in some plots and each species alone (as a control) in separate plots of the same size, OR manipulate light availability directly (e.g. shade cloth over some paired plots vs full sun on others) while both species are grown together. (2) Isolating light — control water, soil nutrients and spacing/soil volume identically across all plots so that only light exposure or the presence/absence of the competitor differs between treatments, so any effect can be attributed to competition for light specifically rather than another resource. (3) Measured variable(s) — a growth measure for each species such as height, leaf area or biomass, measured at the same time interval across all plots. (4) Result supporting competition for light — if plants of a species grown together with the competitor show significantly reduced growth compared to the same species grown alone under identical light, water and nutrient conditions, this supports resource competition; comparing this against the shaded vs unshaded treatment specifically isolates light as the resource, since a growth reduction that appears only when light is limited (not when water/nutrients are limited) implicates light specifically. (5) Repeats/replication mentioned to strengthen reliability. 1 mark per developed element, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A former open-cut mine site is rehabilitated by spreading topsoil over compacted, nutrient-poor rock waste. Predict the likely successional trajectory of this site, explaining your reasoning with reference to substrate conditions and pioneer species characteristics, and suggest one human intervention that could accelerate recovery. (7 marks)",
        back:
          "Model response and marking points: (1) Because topsoil (containing some organic matter, seeds and microbes) has been added rather than the site being left as bare rock, this more closely resembles secondary succession than true primary succession, so recovery should be faster than primary succession on bare rock. (2) However, the substrate is still compacted and nutrient-poor, which will still favour species tolerant of poor soil conditions in the earliest stage — pioneer-type species with rapid growth, wide dispersal and tolerance of nutrient-poor/compacted soils are likely to establish first. (3) Nitrogen-fixing pioneer species specifically would be expected to be favoured/beneficial, because they can improve soil nitrogen content despite starting from a nutrient-poor substrate, directly addressing the site's stated limitation. (4) As pioneer species establish and begin adding organic matter and altering soil structure, conditions should gradually improve, allowing less tolerant, more competitive species to establish in later stages (succession proceeding toward greater diversity/biomass over time), consistent with typical successional patterns. (5) Human intervention suggested and justified — e.g. actively seeding with nitrogen-fixing pioneer species, or ripping/de-compacting the soil before revegetation — explained as directly addressing the compaction or nutrient limitation identified. (6) Reasoning throughout explicitly ties predictions back to the stated substrate conditions (compacted, nutrient-poor), not generic succession description. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Evaluate the claim: \"Focusing conservation resources on protecting a keystone species is always the most effective way to protect an ecosystem's biodiversity.\" Your response must include a stated judgement, supporting reasoning, AND acknowledge at least one differing view about the effectiveness of single-species conservation strategies. (6 marks)",
        back:
          "Model response and marking points: (1) In favour of the claim — because a keystone species has a disproportionately large effect on community structure relative to its abundance, protecting it can maintain the ecological relationships (e.g. predation pressure, seed dispersal) that many other species in the ecosystem depend on, potentially protecting biodiversity efficiently with a single, well-targeted intervention. (2) Against the claim — biologists hold differing views on the effectiveness of single-species conservation strategies (keystone, flagship or umbrella species); protecting one species does not guarantee protection of habitat features, abiotic conditions or other species with different needs that are not connected to that keystone species' role, so biodiversity loss can continue through other pathways even if the keystone species itself is protected. (3) A specific risk identified — resources concentrated on one species may be diverted away from habitat-level protection or other threatened species not linked to the keystone species. (4) A stated judgement — e.g. that keystone-species conservation is a valuable and often efficient strategy but should not be treated as \"always\" sufficient on its own, given the documented differing views on its limitations. (5) The judgement is explicitly supported by both points 1 and 2, not asserted alone. (6) Overall coherence and directly answering \"always\" (a judgement about the strength of the claim, not just describing keystone species). Marking: up to 6 marks distributed across a judgement, supporting reasoning, and the required differing-views acknowledgement — a judgement alone or reasoning alone without both scores no more than partial credit.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A biodiverse rainforest area is cleared and replaced with a single-species palm oil plantation. Predict and explain the combined effect of this change on (a) carbon cycling, (b) net productivity, and (c) susceptibility to pest outbreaks in the area, drawing on energy flow, matter cycling and human impact concepts together. (7 marks)",
        back:
          "Model response and marking points: (a) Carbon cycling — clearing removes large amounts of stored carbon (biomass) from the ecosystem, releasing it to the atmosphere (e.g. via burning or decomposition), and a young monoculture plantation initially stores far less carbon than a mature, structurally complex rainforest, reducing the site's role as a carbon store; this may also reduce ongoing carbon sequestration compared to the diverse original vegetation. (b) Net productivity — this may initially seem to increase gross productivity of the crop species, but the loss of multiple vegetation layers and species reduces the overall structural complexity and total biomass accumulation of the ecosystem compared to the original rainforest, and net productivity of the whole system is likely to differ significantly from the diverse original community, which used the available light/space/nutrients across many niches simultaneously. (c) Pest outbreaks — a monoculture of a single palm species provides a uniform, abundant food source for any pest or pathogen adapted to that species, with no non-host species interspersed to slow spread, unlike the original diverse rainforest where susceptible individuals were buffered by surrounding species diversity — making pest outbreaks far more likely and more severe. Marking: up to 2–3 marks per part (a/b/c) for a developed causal explanation linking the specific concept named (carbon cycling / productivity / monoculture pest susceptibility) to the clearing-and-replacement scenario, to a maximum of 7 across all three parts.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A persistent pesticide is applied to a rice field and enters the local food chain at a concentration of 0.002 mg/kg in producers. If the concentration multiplies by a factor of roughly 8 at each trophic level due to biomagnification, calculate the approximate concentration in a bird of prey feeding as a tertiary consumer (three trophic levels above producers), and explain why apex predators are placed at greatest risk from this kind of pollutant. (5 marks)",
        back:
          "Model response and marking points: (1) Concentration after one transfer (primary consumer) = 0.002 × 8 = 0.016 mg/kg. (2) After second transfer (secondary consumer) = 0.016 × 8 = 0.128 mg/kg. (3) After third transfer (tertiary consumer, the bird of prey) = 0.128 × 8 = 1.024 mg/kg (working shown at each step; accept minor rounding). (4) Explanation — because persistent pollutants are not broken down or excreted, and each predator eats and accumulates the toxin from many prey items across the level below over its lifetime, concentration increases at each trophic transfer rather than being diluted the way energy is. (5) Apex predators, sitting at the top of the food chain, have therefore accumulated toxin passed up and concentrated through every level beneath them, resulting in the highest and most dangerous tissue concentration of any organism in the food chain, even though the original contamination level in producers was very low. Marking: 3 marks for correct stepped calculation (or 2 if final answer correct but working unclear), 2 marks for the explanation of biomagnification risk to apex predators.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A national park experiences a major bushfire that burns 40% of its area. Devise a monitoring plan to track the ecosystem's successional recovery over the following five years, stating what data would be collected, how often, and how the data would indicate progression through successional stages. (6 marks)",
        back:
          "Model response and marking points: (1) Since the pre-existing soil and likely seed bank/root systems survived (unlike bare rock), this is secondary succession, so monitoring should expect a faster recovery trajectory than primary succession and should be designed accordingly. (2) Establish fixed, permanently marked quadrats or transects across the burnt area at the start of monitoring, so the same locations are re-sampled each time for valid comparison over time. (3) Data collected — species present (richness), % cover or abundance of each species, and an estimate of vegetation height/structural layering (to detect canopy development), recorded at each site. (4) Frequency — sample at consistent intervals (e.g. every 6–12 months) across the five years, so change over time can be tracked rather than relying on a single before/after comparison. (5) Indicators of successional progress — an initial phase dominated by fast-growing pioneer/annual species with low diversity, followed by increasing species richness, increasing total cover/biomass, and the appearance of longer-lived or larger woody species and increasing structural (canopy) complexity over successive sampling rounds would indicate progression toward later successional stages. (6) A comparison to an unburnt reference site of the same ecosystem type included, to judge how close the recovering area is to the pre-fire community. 1 mark per developed element, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Compare the likely recovery trajectory of two disturbed sites: Site P, bare volcanic rock following a recent eruption, and Site Q, a forest area burnt by a bushfire six months ago with intact soil and a surviving seed bank. Explain which site would be expected to reach a comparable stage of vegetation cover first, and justify your answer with reference to succession type and starting conditions. (6 marks)",
        back:
          "Model response and marking points: (1) Site P represents primary succession (bare substrate, no pre-existing soil or seed bank), while Site Q represents secondary succession (soil and seed bank already present following disturbance) — correctly classifying both. (2) Site Q would be expected to reach comparable vegetation cover far sooner than Site P. (3) Reasoning — Site P's pioneer species must first begin breaking down bare rock and accumulating organic matter to form even the earliest soil, a process that can take a very long time (years to centuries) before other species can establish; Site Q already has soil structure, nutrients and a seed bank in place, so germination and regrowth can begin almost immediately after the disturbance without needing to first build soil from nothing. (4) A stated comparison of relative timescales (Site P: much slower, potentially centuries for mature vegetation; Site Q: potentially years to a few decades). (5) Correct use of \"pioneer species\" and/or \"seed bank\" as the specific mechanisms driving the difference, rather than a generic \"succession happens faster\" statement. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "On a coral reef, a herbivorous fish species grazes algae that would otherwise overgrow and smother coral. When this fish species is heavily overfished, algal cover increases dramatically and coral cover declines. Evaluate whether this fish species meets the criteria for a keystone species, using the definition and evidence given. (5 marks)",
        back:
          "Model response and marking points: (1) A keystone species is defined by having a disproportionately large effect on community structure relative to its abundance/biomass — not simply being important or abundant. (2) Evidence supporting keystone status — removing (overfishing) this species produced a large, structure-changing effect (algal overgrowth, coral decline) on the wider reef community, consistent with the defining feature of a keystone species. (3) A limitation/consideration — the scenario does not state whether this fish was a low-abundance species having an outsized effect (the core keystone criterion) or simply a heavily fished, previously abundant species whose loss had a large effect partly because so many individuals were removed; distinguishing these matters for a rigorous classification. (4) A stated judgement — e.g. that the evidence given (disproportionate ecosystem-level consequence from its removal, maintaining coral over algae) is consistent with keystone species status, though confirming it would require knowing the fish's original abundance relative to its ecological effect. (5) Judgement explicitly supported by the reasoning above, not asserted alone. Marking: up to 5 marks for a judgement supported by both the matching evidence and an acknowledged limitation/qualification in the evidence.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
  {
    unitNumber: 4,
    topicTitle: "Genetics and heredity",
    cards: [
      // ---- complex_familiar (18) ----
      {
        front:
          "A pedigree shows two unaffected parents who have one affected daughter and two unaffected sons. The trait is not seen in earlier generations. State the most likely mode of inheritance, and justify your answer by eliminating one alternative mode. (4 marks)",
        back:
          "Most likely mode: autosomal recessive (1 mark). Justification: both parents are unaffected but produced an affected child, so both parents must be heterozygous carriers — this is only possible if the allele is recessive (1 mark). It is unlikely to be X-linked recessive, because an affected daughter under X-linked recessive inheritance would require the father to be affected (hemizygous, since he only has one X) — but the father here is unaffected, so X-linked recessive is excluded for this pattern (1 mark). It cannot be dominant (autosomal or X-linked), since neither parent shows the trait, so an affected child cannot arise from two unaffected parents under a dominant model (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Colour blindness is X-linked recessive. A carrier mother (XᴮXᵇ) and an unaffected father (XᴮY) have children. Predict the phenotype ratios among their sons and among their daughters separately, and explain why the two sexes differ. (5 marks)",
        back:
          "Sons: XᴮY or XᵇY — 50% unaffected, 50% colour blind (2 marks: correct genotypes and ratio). Daughters: XᴮXᵇ or XᴮXᵇ — all daughters are XᴮX(ᴮ or ᵇ), so 100% unaffected (but 50% are carriers) (2 marks: correct genotypes and ratio). Explanation: sons receive their only X chromosome from their mother and their Y from their father, so a recessive allele on the mother's X is directly expressed with no second X to mask it; daughters receive an X from each parent, and because the father contributes a dominant Xᴮ, daughters always have at least one dominant allele masking the recessive one (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A karyotype shows 47 chromosomes, with three copies of chromosome 21 instead of two. Identify the disorder this karyotype indicates, name the type of chromosomal abnormality involved, and explain the meiotic error most likely responsible. (4 marks)",
        back:
          "Disorder: Down syndrome (trisomy 21) (1 mark). Type of abnormality: aneuploidy (an abnormal chromosome number) (1 mark). Meiotic error: nondisjunction — the pair of chromosome 21 homologues (or sister chromatids) failed to separate properly during meiosis I or II, producing a gamete with two copies of chromosome 21 instead of one; when this gamete fused with a normal gamete at fertilisation, the resulting zygote had three copies of chromosome 21 (2 marks: naming nondisjunction + explaining the mechanism).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A DNA triplet reads TAC (coding for the mRNA codon AUG, methionine). A point mutation changes this to TAT (mRNA codon AUA, isoleucine). State the type of point mutation effect this represents, and explain why this differs from a mutation that changes TAC to TAA (a stop codon). (3 marks)",
        back:
          "TAC → TAT is a missense mutation — it changes the amino acid coded for (methionine to isoleucine) but the polypeptide still has an amino acid at that position, just a different one (1 mark). TAC → TAA is a nonsense mutation, because it creates a premature stop codon, terminating translation early and producing a truncated, likely non-functional polypeptide (1 mark). The key difference is that a missense mutation may only slightly alter protein structure/function (or have no effect if the new amino acid has similar properties), while a nonsense mutation typically has a much more severe effect because it cuts the protein short (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why the insertion of a single nucleotide into a gene's coding sequence is typically more disruptive to the resulting polypeptide than a single nucleotide substitution. (3 marks)",
        back:
          "The genetic code is read in triplets (codons) from a fixed starting point (1 mark). A substitution only changes the one codon it occurs in, so at most one amino acid in the polypeptide is affected (1 mark). An insertion shifts the reading frame for every codon downstream of the insertion point, changing every subsequent triplet grouping and therefore altering every amino acid from that point onward — a frameshift mutation — usually producing a completely non-functional protein (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain the roles of helicase, DNA polymerase and Okazaki fragments together in DNA replication. (4 marks)",
        back:
          "Helicase unwinds and separates the two DNA strands by breaking the hydrogen bonds between complementary bases, creating a replication fork and exposing single-stranded template DNA (1 mark). DNA polymerase then synthesises a new complementary strand by adding nucleotides to the exposed template, but can only add nucleotides in the 5' to 3' direction (1 mark). On the leading strand this allows continuous synthesis in the same direction as the replication fork opens; on the lagging strand, because synthesis must run in the opposite direction to fork opening, DNA polymerase instead synthesises the new strand in short, discontinuous segments called Okazaki fragments (1 mark), which are later joined together (by DNA ligase) to form a continuous strand (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Compare spermatogenesis and oogenesis in terms of the number of functional gametes produced from a single primary germ cell and the timing of meiotic completion. (4 marks)",
        back:
          "Spermatogenesis produces four functional, equally-sized sperm cells from a single primary spermatocyte, because both meiotic divisions occur symmetrically; oogenesis produces only one functional ovum from a single primary oocyte, because cytoplasm is divided unequally, producing one large ovum and small, non-functional polar bodies at each division (2 marks, compared). In males, meiosis proceeds continuously to completion once initiated at puberty; in females, meiosis begins before birth but is arrested (paused) and only completes at ovulation/fertilisation, meaning oocytes can remain suspended in meiosis for years to decades (2 marks, compared).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how crossing over and independent assortment together increase genetic variation in gametes produced by meiosis. (4 marks)",
        back:
          "Crossing over occurs during prophase I, when non-sister chromatids of homologous chromosomes exchange segments of DNA, producing chromosomes with new combinations of alleles that were not present on either original chromosome (2 marks). Independent assortment occurs at metaphase I, when each homologous pair orients randomly relative to other pairs, so which maternal or paternal chromosome ends up in a particular gamete is independent from chromosome pair to chromosome pair, producing many possible combinations of whole chromosomes (2 marks). Together, these processes mean that even without any mutation, no two gametes produced by an individual are genetically identical.",
        complexity: "complex_familiar",
      },
      {
        front:
          "A karyotype shows a normal chromosome number (46), but a segment of chromosome 9 is found attached to chromosome 22. Identify the type of chromosomal abnormality shown, and distinguish it from a deletion. (3 marks)",
        back:
          "This is a translocation — a segment of one chromosome has broken off and become attached to a different, non-homologous chromosome (1 mark). Because the total chromosome number is unchanged (46) and the segment has moved rather than been lost, this is distinct from a deletion, in which a chromosome segment is lost entirely and not replaced, reducing the total genetic material present (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how chemical tags affecting chromatin structure (heterochromatin vs euchromatin) regulate gene expression. (3 marks)",
        back:
          "Heterochromatin is tightly packed/condensed chromatin, while euchromatin is loosely packed (1 mark). Chemical tags (e.g. methylation, histone modification) can cause a region of DNA to become heterochromatin, physically blocking transcription factors and RNA polymerase from accessing the gene's promoter, so the gene is not transcribed/is switched off (1 mark). Conversely, tags that promote a euchromatin state make the DNA accessible, allowing transcription factors and RNA polymerase to bind and transcribe the gene, switching it on (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how a mutation in a HOX gene could lead to a developmental abnormality such as a body segment forming in the wrong location. (3 marks)",
        back:
          "HOX genes encode transcription factors that regulate the expression of other genes controlling body plan development, determining the identity of body segments along the head-to-tail axis (1 mark). A mutation that changes a HOX gene's structure or its pattern of expression alters which target genes it activates or in which body region it is active (1 mark). Because HOX genes act as master switches for segment identity, this can cause a body structure appropriate to one segment to instead develop in the position of another segment, producing a visible developmental abnormality (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe, in the correct sequence, how recombinant DNA is made using restriction enzymes, a plasmid and DNA ligase, explaining the purpose of each step. (4 marks)",
        back:
          "Step 1: a restriction enzyme cuts both the plasmid and the DNA fragment containing the gene of interest at specific recognition sequences, often leaving complementary \"sticky ends\" (1 mark). Step 2: the cut plasmid (now linear, with a gap) and the gene fragment are mixed, and the complementary sticky ends allow the fragment to base-pair into the opened plasmid (1 mark). Step 3: DNA ligase seals the sugar-phosphate backbone at the join points, covalently joining the fragment into the plasmid to form a single, closed circular recombinant DNA molecule (1 mark). Purpose overall: this produces a plasmid carrying the gene of interest that can be inserted into a host cell to replicate and express that gene (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A gel electrophoresis DNA profile shows a child's bands, the mother's bands, and bands from two possible fathers (Male 1 and Male 2). The child has one band matching the mother and one band matching only Male 1, not Male 2. Interpret this result, and state the principle of DNA profiling being applied. (3 marks)",
        back:
          "Male 1 is far more likely to be the biological father, because the child's non-maternal band matches a band present in Male 1's profile but absent from Male 2's (1 mark). Principle: a child inherits one set of alleles/bands from each biological parent, so every band in the child's profile should be explainable by matching a band in the mother's profile or the true father's profile — Male 2 cannot account for the unmatched band, making him unlikely to be the father (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "In the ABO blood group system, alleles Iᴬ and Iᴮ are codominant and both are dominant to i. A father with genotype IᴬIᴮ (blood type AB) and a mother with genotype ii (blood type O) have children. Determine the possible genotypes and phenotypes of their children, with proportions. (4 marks)",
        back:
          "Each child receives either Iᴬ or Iᴮ from the father, and always i from the mother (1 mark). Possible genotypes: Iᴬi (50%) and Iᴮi (50%) (1 mark). Because Iᴬ and Iᴮ are each dominant to i, phenotypes are: 50% blood type A (Iᴬi) and 50% blood type B (Iᴮi) (2 marks) — no child can be type O or type AB from this cross.",
        complexity: "complex_familiar",
      },
      {
        front:
          "A histogram of human height in a population shows a continuous, bell-shaped (normal) distribution rather than a small number of discrete height categories. Explain why polygenic traits such as height produce this kind of distribution. (3 marks)",
        back:
          "A polygenic trait is controlled by multiple genes, each typically contributing a small additive effect to the phenotype, rather than by a single gene with a small number of discrete alleles (1 mark). Because many genes (and their many possible allele combinations) each contribute a little to the final phenotype, and environmental factors add further small variation, the possible phenotypes form a large number of very finely graded values rather than a few distinct categories (1 mark). When plotted, this produces a smooth, continuous, bell-shaped distribution rather than the discrete category ratios seen in single-gene (monohybrid) inheritance (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A clinician wants to determine whether a patient has an extra or missing whole chromosome, versus determine the exact base sequence of one specific gene suspected of carrying a point mutation. State the most appropriate technique for each question and justify your choice. (4 marks)",
        back:
          "Extra/missing whole chromosome: karyotyping (1 mark) — a karyotype displays the full set of chromosomes by number and structure, making it suited to detecting whole-chromosome (aneuploidy) or large structural abnormalities, but not single base-pair changes (1 mark). Point mutation in one specific gene: DNA sequencing (of PCR-amplified DNA) rather than karyotyping or standard gel electrophoresis profiling (1 mark) — because a single point mutation is a change at the level of individual nucleotides, which requires reading the actual base sequence of that gene, not just comparing overall chromosome number/structure or fragment-length band patterns (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how RNA processing — the addition of a 5' cap, RNA splicing, and the addition of a poly-A tail — converts a pre-mRNA transcript into mature mRNA, and explain why splicing specifically is essential for producing a correct protein. (4 marks)",
        back:
          "The 5' cap is added to the start of the transcript to protect it from degradation and assist ribosome binding during translation (1 mark). The poly-A tail is added to the 3' end, also protecting the mRNA from degradation and aiding export from the nucleus (1 mark). RNA splicing removes the non-coding introns from the pre-mRNA and joins the coding exons together (1 mark). Splicing is essential because introns are not part of the protein-coding sequence — if they were not removed, the ribosome would translate them, shifting the reading frame or inserting incorrect amino acid sequences, producing a non-functional protein (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A cross between two individuals produces offspring in a 9:3:3:1 phenotype ratio for two traits. A second cross, testing whether one of these traits is instead sex-linked, produces identical ratios in both male and female offspring. State what the second cross's result indicates about the inheritance of that trait, and explain the reasoning. (4 marks)",
        back:
          "The result indicates the trait is autosomal, not sex-linked (1 mark). Reasoning: if a gene were sex-linked (carried on the X chromosome), the phenotype ratios would typically differ between male and female offspring, because males only have one X chromosome (are hemizygous) while females have two, and inheritance patterns from each parent differ by sex (2 marks). Because the ratio was identical in both sexes, the gene must be located on an autosome, where inheritance does not depend on the sex of the offspring (1 mark).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (11) ----
      {
        front:
          "A family pedigree spans three generations. In Generation I, an unaffected man and an unaffected woman have four children (Generation II): two unaffected daughters and two sons, one of whom is affected. One unaffected Generation II daughter marries an unaffected man and has one affected daughter (Generation III). Determine the most likely mode of inheritance for this trait, state the genotypes (using clear allele symbols you define) of the Generation I parents and the Generation III affected daughter, and justify your reasoning at each generation. (8 marks)",
        back:
          "Model response and marking points: (1) Both Generation I parents are unaffected but produce an affected son, so the allele must be recessive (a dominant allele would require an affected parent). (2) An affected Generation III daughter is produced by two unaffected parents (her mother and father), so the trait cannot be X-linked recessive — an affected daughter under X-linked recessive inheritance requires her father to be affected (hemizygous carrier of the trait), but he is stated as unaffected — so the trait is most consistent with autosomal recessive inheritance. (3) Define allele symbols clearly, e.g. T = dominant (unaffected), t = recessive (affected). (4) Generation I parents: both must be heterozygous carriers, Tt × Tt, since they are unaffected but produced an affected (tt) son. (5) The unaffected Generation II daughter who becomes a Generation III parent: because her father and mother were both Tt, she has a 2/3 chance of being a carrier (Tt) given she is unaffected — for her daughter to be affected (tt), she must in fact be Tt, and her husband must also be a carrier (Tt), each unaffected. (6) Generation III affected daughter's genotype: tt. (7) Overall reasoning is consistent across all three generations (not just asserted at one point). (8) Correct final classification restated: autosomal recessive. 1 mark per developed, correct point, maximum 8.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A person has a mutation that inserts a single extra nucleotide near the very start of the coding sequence of a gene for a digestive enzyme. Explain, at the molecular level, why this mutation is likely to result in a non-functional enzyme, tracing the effect from the DNA change through to protein structure and function. (6 marks)",
        back:
          "Model response and marking points: (1) The genetic code is read in triplets (codons) from a fixed starting point during translation. (2) Inserting a single nucleotide shifts the reading frame for every codon downstream of the insertion point — this is a frameshift mutation. (3) Because the insertion occurs near the very start of the coding sequence, almost the entire gene is downstream of it, so almost every codon read from that point onward is altered, changing almost every amino acid specified compared to the original sequence. (4) This will very likely include the premature appearance of a stop codon somewhere in the shifted frame, truncating the protein early, and/or produce a sequence of amino acids essentially unrelated to the correct enzyme sequence. (5) An enzyme's function depends on its three-dimensional shape, particularly the precise shape of its active site, which is determined by the specific sequence and folding of its amino acid chain. (6) Because the amino acid sequence downstream of the insertion is essentially scrambled, the protein is very unlikely to fold into the correct shape, so its active site (if it forms at all) will not fit its substrate, and the enzyme will not function to catalyse the digestive reaction. 1 mark per developed step in the causal chain, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Full genome sequencing is becoming widely available to the public. Evaluate the claim: \"Full genome sequencing should be made freely available to anyone who wants it, because the health benefits clearly outweigh the risks.\" Your response must include a stated judgement, at least one benefit, and at least one risk. (6 marks)",
        back:
          "Model response and marking points: (1) Benefit — identifying gene variants through full genome sequencing may enable doctors to structure individualised healthcare programs (e.g. tailored screening, early intervention or treatment choices), potentially leading to better health outcomes for the individual. (2) Risk — there is concern about the risks of making this highly personal genetic data available, including privacy issues regarding who owns and can access the information, and potential misuse (e.g. by insurers or employers) if data protection is inadequate. (3) A second risk/consideration — genetic information can have implications for a person's biological relatives (who share DNA), raising consent and privacy issues beyond the individual being tested. (4) A stated judgement that goes beyond \"there are pros and cons\" — e.g. that unrestricted free availability is not clearly justified given unresolved privacy and data-ownership risks, even though the health benefits are real; access should arguably be paired with strong data protection safeguards. (5) The judgement is explicitly supported by weighing the named benefit against the named risk(s), not simply listed separately. (6) Overall coherence: the response directly engages with whether benefits \"clearly outweigh\" risks, rather than only describing both. Marking: up to 6 marks distributed across benefit, risk(s), stated judgement and supporting reasoning — a judgement without reasoning, or reasoning without a stated judgement, cannot score full marks.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A student analyses a gel electrophoresis DNA profile from a crime scene sample and two suspects, and concludes: \"Suspect A's profile has three bands in common with the crime scene sample, so Suspect A is definitely the source of the DNA.\" Identify the flaw in this reasoning and explain why sharing some bands does not prove a definite match. (5 marks)",
        back:
          "Model response and marking points: (1) The flaw is treating a partial band match as proof of identity, when DNA profiling actually compares a chosen number of variable regions, and matching some — but not necessarily all — of the profiled regions does not establish that the DNA came from that specific individual to the exclusion of all others. (2) For a profile match to strongly support identification, ALL of the bands examined in the profile should match, not just three; a true match uses many highly variable loci precisely because a small number of matching bands could occur by chance between unrelated people. (3) The response should identify that the student has not stated how many total bands/loci were compared — if three bands matched out of many more that were tested (some of which may not have matched), this is a very different (weaker) result than three matching being the entirety of the comparison. (4) The conclusion \"definitely the source\" overstates what DNA profiling evidence alone can establish; profiling gives a probability/likelihood-based match, not absolute certainty, and forensic conclusions are usually expressed in terms of probability of a random match rather than certainty. (5) A corrected, appropriately cautious conclusion is stated (e.g. \"the shared bands are consistent with but do not conclusively prove Suspect A is the source, without knowing the total loci compared and the probability of a coincidental match\"). 1 mark per developed point, maximum 5.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Design an investigation using PCR and gel electrophoresis to determine whether a particular plant sample collected in the wild is genetically the same clone as a known cultivated variety, or a distinct genetic individual. State what would be amplified, how the profiles would be compared, and what result would support each possible conclusion. (6 marks)",
        back:
          "Model response and marking points: (1) Extract DNA from both the wild sample and the known cultivated variety. (2) Use PCR to amplify the same set of variable DNA regions (e.g. microsatellite/STR-type loci known to vary between individual plants) in both samples, using identical primers and reaction conditions for both so the results are directly comparable. (3) Run the PCR products from both samples on the same gel electrophoresis run (so band positions can be compared directly and are not affected by run-to-run variation). (4) Compare the resulting band patterns: if the wild sample and the cultivated variety produce identical band patterns (bands at the same positions) across all loci tested, this supports the conclusion that they are the same genetic clone. (5) If the band patterns differ at one or more loci (different band positions/numbers), this supports the conclusion that the wild sample is a genetically distinct individual, not a clone of the cultivated variety. (6) Include a control — a known reference sample of the cultivated variety run on the same gel to confirm the technique produces the expected known pattern, validating the comparison. 1 mark per developed element, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "CRISPR gene-editing technology could theoretically be used either to correct a disease-causing mutation in a patient's own cells (somatic gene editing) or to edit the DNA of embryos so the change is passed on to future generations (germline gene editing). Evaluate whether these two applications raise the same level of ethical concern, using a stated judgement and supporting reasoning. (6 marks)",
        back:
          "Model response and marking points: (1) Somatic gene editing affects only the treated individual's own cells and is not passed on to their offspring, so its effects and risks are contained to the person who consented to treatment. (2) Germline gene editing changes are passed on to all future descendants of the edited embryo, meaning individuals who did not and cannot consent (future generations) are affected by the decision. (3) Germline editing also carries the risk that any unintended/off-target effects of the editing become a permanent part of the human gene pool, rather than being limited to one person's lifetime. (4) A stated judgement — e.g. that germline editing raises substantially greater ethical concern than somatic editing, specifically because of the consent and permanence issues identified, not because gene editing itself is inherently more or less risky as a technology. (5) The judgement is explicitly supported by the consent and permanence points above, not simply an assertion that \"editing embryos feels wrong.\" (6) Overall coherence directly comparing the two applications rather than discussing gene editing generically. Marking: up to 6 marks distributed across the two applications' distinct risk profiles, a stated judgement, and supporting reasoning.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A couple, both unaffected carriers of an autosomal recessive condition, are told by a genetic counsellor that any child they have has a 1 in 4 chance of being affected. They already have one affected child and ask: \"Does that mean our next three children are guaranteed to be unaffected, since the odds should even out?\" Explain the flaw in the couple's reasoning, referring to how probability applies to independent genetic events. (5 marks)",
        back:
          "Model response and marking points: (1) The couple is both carriers (heterozygous, e.g. Aa × Aa), which produces a 1 in 4 (25%) chance of an affected (aa) child for EACH pregnancy independently. (2) Each pregnancy/fertilisation event is an independent event — which allele combination is passed on in one pregnancy has no physical influence on which combination is passed on in a later, separate pregnancy. (3) The couple's reasoning commits a probability error (similar to the \"gambler's fallacy\") — assuming that past outcomes affect future independent probabilities, as if the family's overall ratio must average out to exactly 1:4 over a small number of children. (4) Correct interpretation: each future child still independently has a 25% chance of being affected and a 75% chance of being unaffected, regardless of the outcome of the previous pregnancy — the 1 in 4 figure describes a probability per pregnancy, not a guaranteed ratio across a small, specific number of children. (5) It would in fact be entirely possible (though not certain) for all of their children to be affected, or for none of the remaining children to be affected — probability does not guarantee any particular sequence over a small sample. 1 mark per developed point, maximum 5.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A genetically modified crop has been engineered to be resistant to a specific herbicide, allowing farmers to spray the herbicide to kill weeds without harming the crop. Evaluate the long-term ecological risks of this technology, and discuss whether these risks mean the technology should not be used. Include a stated judgement. (6 marks)",
        back:
          "Model response and marking points: (1) Risk — gene flow from the herbicide-resistant crop to closely related weed species could occur (e.g. via pollen transfer), potentially transferring herbicide resistance to weed populations and creating \"super weeds\" that are then much harder to control. (2) Risk — repeated, heavy use of a single herbicide (enabled by the resistant crop) can also drive the evolution of herbicide-resistant weeds directly through selection pressure, independent of gene flow, since any naturally resistant weed individuals will be strongly favoured under repeated herbicide use. (3) Risk — effects on non-target organisms are a documented concern with transgenic crops more broadly, and should be acknowledged as an additional, separate category of ecological risk beyond weed resistance. (4) Benefit/counterpoint acknowledged for balance — this technology can reduce the need for tillage and multiple different herbicides, which has its own agricultural and environmental advantages, so the technology is not risk-free but not without benefit either. (5) A stated judgement — e.g. that the technology should not be abandoned outright, but that the identified risks (super weeds, resistance evolution) justify careful management practices (such as herbicide rotation or buffer zones) rather than unrestricted use. (6) The judgement is explicitly supported by weighing the risks against the acknowledged benefit, and answers the specific question asked (\"should it not be used\") rather than only listing risks. Marking: up to 6 marks distributed across identified risks, an acknowledged counterpoint, and a supported judgement.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Identical (monozygotic) twins share essentially the same DNA sequence, yet as adults they can develop different disease risks and different physical traits despite growing up in similar environments. Using gene expression regulation concepts (not new mutations), explain how this is biologically possible. (6 marks)",
        back:
          "Model response and marking points: (1) Because the twins' DNA sequence is essentially identical, differences in their traits are not primarily explained by differences in the genes they carry. (2) Gene expression is regulated by mechanisms beyond the DNA sequence itself, including chemical tags that affect chromatin structure (e.g. causing regions to become heterochromatin vs euchromatin) and proteins (transcription factors) that bind to gene promoter regions. (3) These regulatory chemical tags can be influenced by an individual's specific environmental exposures and experiences over their lifetime (e.g. diet, illness, stress, toxin exposure) even when the broad environment seems similar, and even small cumulative differences in exposure between two individuals can accumulate over decades. (4) As these chemical tags accumulate differently between the two twins over time, the pattern of which genes are switched on (euchromatin, accessible to transcription factors) versus switched off (heterochromatin) in their cells increasingly diverges. (5) Because gene expression — not just gene sequence — determines how genes are translated into observable traits and physiological function, this divergence in gene expression patterns can produce different traits and different disease risk despite identical underlying DNA. (6) A clear conclusion explicitly connecting the mechanism (differential gene expression regulation) to the observed outcome (different traits/disease risk) despite identical DNA. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A DNA profile comparison in a paternity case examines five loci. At four loci, the child's non-maternal band matches the alleged father's band. At the fifth locus, the child has a band that matches neither the mother nor the alleged father. Evaluate what conclusion can be reasonably drawn from this evidence, considering possible explanations for the mismatch. (6 marks)",
        back:
          "Model response and marking points: (1) A match at four out of five loci is a strong but not complete match — under the principle that a child should inherit one allele at every locus from each biological parent, a true biological father should match at every locus tested, not just most. (2) One possible explanation for the mismatch: the alleged man is not the biological father, and the four matching loci occurred by chance (though this becomes less likely the more loci match and the more variable those loci are in the population). (3) A second possible explanation: a new mutation occurred at that locus in forming the child's allele, which does happen at a low but non-zero rate and does not necessarily rule out paternity on its own. (4) A third possible explanation: a technical/laboratory error occurred at that one locus (e.g. a band was misread or failed to amplify), which is why forensic/paternity testing typically examines multiple loci rather than relying on a single locus. (5) A reasoned judgement — the evidence is suggestive of paternity given the strong match at four loci, but is not fully conclusive on its own; further loci should be tested, or the single mismatch investigated, before reaching a definitive conclusion. (6) The response explicitly weighs more than one possible explanation for the mismatch rather than jumping to only one. Marking: up to 6 marks distributed across the interpretation of partial matching, at least two distinct plausible explanations for the mismatch, and a supported, appropriately cautious judgement.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A researcher wants to determine whether a rare inherited disorder in a large family is caused by a single autosomal gene or is polygenic. Devise an approach using pedigree analysis that would help distinguish between these two possibilities, explaining what pattern of results would support each hypothesis. (6 marks)",
        back:
          "Model response and marking points: (1) Construct a detailed pedigree across as many generations and family members as possible, recording clearly who is affected and unaffected. (2) Single-gene (monohybrid) inheritance pattern to look for — the trait should appear as a discrete, present/absent (categorical) phenotype, and its transmission pattern across the pedigree should be consistent with one of the standard Mendelian patterns (e.g. matching expected ratios for autosomal dominant or autosomal recessive inheritance, such as roughly 1:1 or 3:1 patterns where relevant, or an affected individual always having at least one affected parent for a dominant trait). (3) Polygenic inheritance pattern to look for — the trait should instead show graded, continuous variation in severity/expression among affected individuals (rather than a simple present/absent state), and the proportion of affected relatives should tend to increase with the number of genes shared (e.g. more affected among identical twins/close relatives than distant relatives) rather than following a clean single-gene ratio. (4) A specific analytical step — compare the observed proportion of affected offspring in multiple sibships against the ratio predicted by a single-gene model (e.g. 1:4 for recessive); a good statistical fit supports single-gene inheritance, while a poor fit (with graded severity observed) supports a polygenic explanation. (5) Note a limitation — pedigree analysis alone cannot conclusively prove a specific gene or genes without molecular/genetic testing, so this approach identifies which model is a better fit but would ideally be followed up with genetic testing. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
  {
    unitNumber: 4,
    topicTitle: "Continuity of life on Earth",
    cards: [
      // ---- complex_familiar (18) ----
      {
        front:
          "In a population of 500 individuals: 320 are AA, 160 are Aa, and 20 are aa. Calculate the frequency of the A allele and the a allele. (4 marks)",
        back:
          "Total alleles = 500 × 2 = 1000 (1 mark). A alleles = (320 × 2) + 160 = 640 + 160 = 800, so frequency of A = 800/1000 = 0.8 (1 mark). a alleles = (20 × 2) + 160 = 40 + 160 = 200, so frequency of a = 200/1000 = 0.2 (1 mark). Check: 0.8 + 0.2 = 1.0, confirming the frequencies are correct (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A bird population has a range of beak sizes. After a drought that eliminates small, soft seeds, only large, hard seeds remain, and the average beak size in the next generation shifts noticeably larger. Identify the type of phenotypic selection shown and explain the mechanism. (4 marks)",
        back:
          "Directional selection (1 mark). Mechanism: the drought changed the available food source, so individuals with larger beaks (better able to crack hard seeds) had higher survival and reproductive success than individuals with small or medium beaks (1 mark). Because the trait favoured is at one extreme of the existing range rather than the average, the population's mean phenotype shifts in that direction over generations as the alleles associated with larger beak size increase in frequency (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Human birth weight data shows that babies of average weight have the highest survival rate, while both very low and very high birth weights are associated with increased mortality. Identify the type of phenotypic selection this represents and explain why it maintains rather than shifts the population average. (4 marks)",
        back:
          "Stabilising selection (1 mark). Explanation: because individuals at BOTH extremes of the phenotype range (very low and very high birth weight) have reduced fitness/survival, selection acts against both tails of the distribution simultaneously (2 marks). This removes extreme phenotypes from the population each generation while leaving the intermediate (average) phenotype favoured, keeping the population's mean phenotype stable over time rather than shifting it in either direction (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A finch population feeding on seeds shows a bimodal (two-peaked) distribution of beak size, with few individuals of intermediate beak size, because two distinct food sources (small soft seeds and large hard seeds) are available while intermediate seeds are scarce. Identify the type of selection acting and explain the outcome. (4 marks)",
        back:
          "Disruptive selection (1 mark). Explanation: individuals with beak sizes suited to either extreme (very small or very large) can efficiently exploit one of the two available food sources, while individuals with intermediate beak size are poorly suited to both, giving them lower fitness (2 marks). Over generations, this favours both extremes over the intermediate phenotype, producing and maintaining a bimodal distribution in the population rather than a single average peak (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Over five generations, the frequency of a particular allele in a beetle population rises from 0.10 to 0.65 following the introduction of a new insecticide. Interpret this data in terms of the type of selection pressure acting on this allele. (3 marks)",
        back:
          "The steady, substantial increase in frequency of this allele following the insecticide's introduction indicates positive selection is acting on it (1 mark) — individuals carrying this allele likely have a survival/reproductive advantage under insecticide exposure (e.g. it confers resistance), so they contribute proportionally more offspring to each subsequent generation (1 mark). This is consistent with the insecticide acting as a new selection pressure favouring a previously less common allele (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Compare divergent evolution and convergent evolution, using one named example of each. (4 marks)",
        back:
          "Divergent evolution occurs when a common ancestral species evolves into two or more different species that become increasingly different over time, typically due to adapting to different environments or selection pressures — e.g. Darwin's finches on the Galápagos Islands, which diverged from a common ancestor into species with different beak shapes suited to different food sources (2 marks). Convergent evolution occurs when unrelated species (from different ancestral lineages) independently evolve similar traits because they face similar selection pressures/environments — e.g. the streamlined body shape of sharks (fish) and dolphins (mammals), which evolved independently for efficient movement through water despite no close common ancestor (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish parallel evolution from convergent evolution. (3 marks)",
        back:
          "Both involve unrelated or distantly related lineages independently evolving similar traits (1 mark). The distinction is the starting point: parallel evolution occurs between related species that already shared a similar trait/genetic background and then evolve in similar directions from that similar starting point (1 mark), whereas convergent evolution occurs between distantly related or unrelated species with very different starting points/ancestry that nonetheless evolve a similar trait due to similar selection pressures (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A flower species has evolved a long, narrow floral tube, and a moth species that pollinates it has evolved an unusually long proboscis (feeding tube) to match. Explain this pattern as an example of coevolution. (3 marks)",
        back:
          "Coevolution occurs when two species exert reciprocal selection pressure on each other, each evolving in response to changes in the other over time (1 mark). Flowers with longer tubes would have been better pollinated by moths with longer probosces (able to reach the nectar), favouring longer floral tubes; simultaneously, moths with longer probosces would gain better access to nectar in longer-tubed flowers, favouring longer probosces (1 mark). Because each species' selection pressure depended on the other species' trait, the two traits evolved together over successive generations (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A mountain range gradually rises, physically dividing a single population of a small mammal species into two areas that can no longer exchange individuals. Over thousands of years, the two populations accumulate enough genetic differences that they can no longer interbreed. Identify the type of speciation described and explain why isolation was necessary for it to occur. (3 marks)",
        back:
          "Allopatric speciation (1 mark). Explanation: physical/geographic isolation prevented gene flow between the two populations (1 mark); without gene flow, mutation, genetic drift and differing selection pressures in each isolated environment could accumulate independently in each population without being homogenised by interbreeding, eventually producing enough genetic divergence that the populations became reproductively isolated (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why populations with reduced genetic diversity face an increased risk of extinction. (4 marks)",
        back:
          "Genetic diversity provides a population with a range of alleles that may confer resistance or tolerance to different environmental challenges, such as disease or changing conditions (1 mark). A population with low genetic diversity has fewer different alleles available, so if a new disease or environmental change arises, it is less likely that any individuals carry alleles that would allow them to survive it (1 mark). Low genetic diversity also increases the likelihood of inbreeding, which raises the frequency of homozygous recessive genotypes and can expose harmful recessive alleles, reducing overall fitness (inbreeding depression) (1 mark). Together, this reduced capacity to adapt to change and increased expression of harmful alleles makes the population more vulnerable to being wiped out by a single event or gradual decline (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A conserved gene sequence is compared between three species: Species X and Species Y differ at 2% of bases; Species X and Species Z differ at 15% of bases. Using the concept that mutations accumulate roughly steadily over time, interpret what this data suggests about the relative timing of divergence of these species from a common ancestor. (3 marks)",
        back:
          "Because mutations accumulate roughly steadily over time (a molecular clock), a smaller percentage difference indicates less time has passed since two species shared a common ancestor, while a larger percentage difference indicates more time has passed (1 mark). Species X and Y differ by only 2%, suggesting they diverged from their common ancestor relatively recently (1 mark). Species X and Z differ by 15%, a much larger difference, suggesting X and Z share a much more distant common ancestor — i.e. X and Y are more closely related to each other than either is to Z (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A cladogram shows Species A and Species B branching from the most recent shared node, with Species C branching from an earlier node that is ancestral to both A and B. Interpret this cladogram to state which two species are most closely related, and identify what determines branching order on a cladogram. (3 marks)",
        back:
          "Species A and Species B are the most closely related pair, because they share the most recent common ancestor (branch point/node) of the three species (1 mark). Species C is more distantly related to both A and B, having diverged earlier (1 mark). Branching order on a cladogram is determined by shared derived characteristics (or shared genetic/molecular sequence similarity) — taxa that share more derived features/sequence similarity are placed as branching from a more recent common node (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Two related species show a 4% difference in a conserved gene sequence. If this gene is known to mutate at an average rate of 0.5% difference per million years between diverging lineages, estimate how long ago these two species diverged from their common ancestor. (3 marks)",
        back:
          "Divergence time = total sequence difference ÷ mutation rate = 4% ÷ 0.5% per million years (1 mark) = 8 million years (1 mark). This estimate assumes the mutation rate has remained roughly constant over this period (molecular clock assumption) (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A small population of 15 animals is founded when a storm carries a few individuals to a remote island, isolated from the mainland population of thousands. Explain why genetic drift is likely to have a much larger effect on the allele frequencies of this new island population than on the mainland population. (3 marks)",
        back:
          "Genetic drift is the random change in allele frequency from generation to generation due to chance events in which individuals survive and reproduce (1 mark). In a very small population, chance events (such as which few individuals happened to be carried by the storm, or random survival/reproduction from generation to generation) can dramatically change allele frequencies, because each individual represents a much larger proportion of the total gene pool (this is a founder effect, a form of genetic drift) (1 mark). In the much larger mainland population, chance events affecting a few individuals are averaged out across thousands of others, so allele frequencies change far more slowly and drift has a much smaller relative effect (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Two populations of the same species live in separate valleys, but individuals occasionally migrate between them and successfully interbreed. Explain how this gene flow affects the genetic differences that would otherwise develop between the two populations. (3 marks)",
        back:
          "Gene flow is the transfer of alleles between populations through migration and interbreeding (1 mark). Without gene flow, each population would accumulate its own independent genetic changes (via mutation, drift and local selection pressures), causing the two populations to diverge genetically over time (1 mark). Because migrants move alleles between the two valleys and successfully interbreed, gene flow counteracts this divergence by homogenising allele frequencies between the two populations, keeping them more genetically similar than they would otherwise become (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain the difference between microevolution and macroevolution, and describe how macroevolutionary change results from microevolutionary change. (4 marks)",
        back:
          "Microevolution refers to small-scale changes in allele frequencies within a population over relatively short timescales, caused by processes such as mutation, gene flow, genetic drift and natural selection (2 marks). Macroevolution refers to large-scale evolutionary change above the species level, such as the formation of new species or higher taxonomic groups, occurring over much longer timescales (1 mark). Macroevolution results from the gradual accumulation of many microevolutionary changes over very long periods of time, particularly when populations become isolated and diverge to the point of forming new, reproductively distinct species (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "The fossil record shows that approximately 66 million years ago, a large proportion of Earth's species (including all non-avian dinosaurs) disappeared from the fossil record within a geologically short period, followed soon after by rapid diversification of mammal species into many new niches. Identify the two evolutionary events described and explain the relationship between them. (3 marks)",
        back:
          "The first event is a mass extinction (the Cretaceous–Paleogene extinction event) (1 mark); the second is an evolutionary radiation (rapid diversification of mammals) (1 mark). The relationship: the mass extinction removed dominant competitor/predator species (dinosaurs) and eliminated species occupying many ecological niches, and this created vacant niches with reduced competition, which the surviving mammal lineages were then able to rapidly diversify to fill — mass extinctions are often followed by evolutionary radiations for this reason (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A scientist wants to determine whether two currently very different-looking species share a recent common ancestor. State whether comparative genomics or morphological (physical feature) comparison alone would provide stronger evidence in this case, and justify your answer. (3 marks)",
        back:
          "Comparative genomics would provide stronger evidence (1 mark). Justification: species can look very different due to strong divergent selection pressures acting on their physical form even while remaining genetically similar in conserved regions, so physical appearance alone can be misleading about true relatedness (1 mark); comparing DNA/protein sequences, especially highly conserved sequences, can reveal genetic similarity and relatedness that is not visible from morphology alone, giving more direct evidence of shared ancestry (1 mark).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (11) ----
      {
        front:
          "A population of frogs on the mainland is well adapted to a wet, cool climate. Around 50,000 years ago, rising sea levels isolated a small number of these frogs on a newly formed island with a hotter, drier climate. Today, the island frogs are morphologically distinct and cannot successfully interbreed with mainland frogs. Explain the full sequence of processes that could have led to this outcome, naming the type of speciation involved. (7 marks)",
        back:
          "Model response and marking points: (1) Rising sea levels created a geographic barrier, physically isolating the small founding population on the island from the mainland population — this is the type of isolation required for allopatric speciation. (2) The founding population was small, so genetic drift (specifically a founder effect) likely altered allele frequencies in the island population compared to the mainland, independent of any adaptive advantage. (3) The island's hotter, drier climate represents a different selection pressure than the mainland's wet, cool climate, so natural selection favoured different traits (e.g. those improving water retention or heat tolerance) in the island population over generations. (4) Because the island population was geographically isolated, there was no gene flow between it and the mainland population, so the genetic changes accumulating on the island (from both drift and selection) were not diluted or reversed by interbreeding with the mainland gene pool. (5) Over approximately 50,000 years, these accumulated microevolutionary changes (drift + selection, with no counteracting gene flow) became substantial enough to produce macroevolutionary change — genetic and morphological divergence to the point that the two populations can no longer successfully interbreed, i.e. reproductive isolation. (6) Type of speciation: allopatric speciation, correctly named and linked to the geographic isolation described. (7) The response explains this as a chain of connected processes (isolation → drift/selection → no gene flow → accumulated divergence → reproductive isolation), not just a list of terms. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Two research teams studying the same group of five closely related mammal species reach different conclusions: Team A's cladogram, based on skeletal morphology, groups Species 1 and Species 2 as most closely related; Team B's cladogram, based on comparative genomics, groups Species 1 and Species 3 as most closely related instead. Evaluate which line of evidence should be given greater weight in this case, and explain a plausible reason the two data types could disagree. (7 marks)",
        back:
          "Model response and marking points: (1) Explain how the two cladograms were built — morphological cladograms group species by shared physical/skeletal features, while genomic cladograms group species by shared DNA/molecular sequence similarity. (2) Plausible reason for disagreement — convergent evolution: Species 1 and 2 could have independently evolved similar skeletal features in response to similar environmental/functional pressures (e.g. similar locomotion or diet) without being especially closely related, producing a misleading morphological grouping. (3) A second plausible reason — some physical features can be lost, reduced or modified rapidly under strong selection, or can evolve at different rates than the underlying DNA sequence, meaning morphological similarity does not always track genetic relatedness precisely, whereas conserved DNA sequences (particularly non-functional or slowly evolving regions) are less prone to converging in this way. (4) Weighing the evidence — genomic/molecular data is generally considered more reliable for inferring true evolutionary relatedness in cases of conflict, because it is less susceptible to being shaped by convergent selection pressures on function/appearance, and directly reflects shared ancestry through inherited sequence similarity. (5) A stated judgement — Team B's genomic-based grouping (Species 1 and 3) should be given greater weight than Team A's morphology-based grouping, for the reasons given. (6) Appropriate caveat — this does not mean morphological evidence is worthless; it remains informative, particularly when combined with other independent evidence (e.g. fossil record, biogeography), and a fuller resolution would ideally draw on multiple lines of evidence rather than genomics alone. (7) The judgement is explicitly supported by the reasoning above, not just asserted. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Evaluate the claim: \"Evolution cannot be a reliable scientific theory because scientists keep changing their explanations of how it works as new evidence emerges.\" Your response must include a stated judgement and explain the role that contested, refined and replaced explanations play in science generally. (6 marks)",
        back:
          "Model response and marking points: (1) Scientific theories are explanations that have been repeatedly tested and corroborated according to the scientific method, but this does not mean they are fixed forever — theories are expected to be refined or replaced as new evidence emerges or when a new explanation has greater explanatory power. (2) This process of revision is a strength of science, not a weakness — it means the theory of evolution is continually tested against and updated with new evidence (e.g. from genetics, which did not exist as a field when the theory was first proposed), rather than being accepted uncritically. (3) The core mechanism of evolution (descent with modification via natural selection and other processes) has been repeatedly corroborated by multiple independent lines of evidence — palaeontology, biogeography, developmental biology, morphology and genetics — even as specific details (e.g. exact mechanisms of inheritance, rates of change) have been refined over time. (4) A stated judgement — the claim is not well supported: refinement of a theory as evidence accumulates is a normal, expected part of how robust scientific theories work, and is a sign of the field responding appropriately to evidence rather than evidence that the underlying theory is unreliable. (5) The judgement is explicitly supported by the reasoning above and specifically addresses the claim's underlying assumption (that revision = unreliability). (6) Overall coherence, directly engaging with the claim rather than only describing evolution in general terms. Marking: up to 6 marks distributed across the explanation of how scientific theories are contested/refined, the corroborating evidence types, and a supported judgement.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A critically endangered species has declined from a population of several thousand to fewer than 50 individuals due to habitat loss. Predict what is likely to happen to the population's genetic diversity over the coming generations if the population remains small, and explain the consequence for the species' long-term extinction risk, even if the immediate threat of habitat loss is fully resolved. (6 marks)",
        back:
          "Model response and marking points: (1) With a population this small, genetic drift will have a much stronger effect on allele frequencies than it did in the larger historical population, because chance events affecting a few individuals represent a much larger proportion of the total gene pool. (2) Genetic drift in a small population tends to randomly reduce genetic diversity over generations, as some alleles are lost by chance (particularly rare alleles) rather than because they are disadvantageous. (3) The very small population size will also likely lead to inbreeding among closely related individuals, since there are few unrelated mates available, further reducing genetic diversity and increasing the frequency of homozygous genotypes (which can expose harmful recessive alleles — inbreeding depression). (4) Even if habitat loss is fully resolved and the population is allowed to grow again in numbers, the genetic diversity already lost through drift and inbreeding during the bottleneck is not easily regained, because new genetic variation can only be restored slowly through new mutations (or migration from another population, if available). (5) Consequence for extinction risk — a genetically less diverse population has a reduced capacity to adapt to future environmental changes or new diseases, since fewer different alleles are available to provide resistance/tolerance, meaning the species remains at elevated extinction risk long after the original threat (habitat loss) is removed. (6) The response explicitly separates the immediate threat (habitat loss) from the ongoing genetic legacy of the bottleneck as two distinct extinction-risk factors. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A student writes: \"Giraffes evolved long necks because their ancestors kept stretching to reach high leaves, and this stretching was passed on to their offspring, making each generation's neck a little longer.\" Identify the scientific misconception in this explanation, and rewrite the explanation correctly using natural selection. (5 marks)",
        back:
          "Model response and marking points: (1) The misconception is a Lamarckian idea — that traits acquired or changed during an individual's lifetime (such as a stretched neck from reaching) can be directly passed on to offspring; this is not how inheritance works, because an individual's DNA is not altered by their body's use during their lifetime (stretching a neck does not change the genes passed on in sperm/eggs). (2) Correct explanation must instead be based on existing heritable variation: within the ancestral giraffe population, there was already natural variation in neck length due to genetic differences between individuals, before any environmental pressure. (3) Selection pressure — individuals that happened to have longer necks (due to their existing genes) had an advantage in accessing high foliage, particularly when food was limited, giving them better survival and/or reproductive success. (4) Because neck length is heritable (genetically determined), these longer-necked individuals passed the alleles for longer necks on to their offspring at a higher rate than shorter-necked individuals did. (5) Over many generations, this differential reproductive success (natural selection acting on pre-existing genetic variation) shifted the population's average neck length longer — not because any individual's neck-stretching was inherited. 1 mark per developed point, maximum 5.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Devise an investigation using a wild population of an insect species with variable body size to determine whether stabilising, directional or disruptive selection is currently acting on body size. State what data would be collected, over what timeframe, and what result would indicate each of the three types of selection. (6 marks)",
        back:
          "Model response and marking points: (1) Sample a large number of individuals from the population and record body size for each, producing a frequency distribution (histogram) of body size in the current generation. (2) Track survival and/or reproductive success for individuals across these different body sizes over a defined period (e.g. one breeding season/generation) — for example by marking individuals and recording which survive to reproduce, or measuring offspring number by body size class. (3) Compare the distribution of body sizes among survivors/successful reproducers to the original population distribution, and/or compare the body-size distribution of the next generation to the current one. (4) Result indicating directional selection — the distribution shifts toward one extreme (e.g. mean body size becomes consistently larger or smaller across the generation). (5) Result indicating stabilising selection — the distribution narrows around the existing average, with survivors/successful reproducers concentrated near the mean and both extremes showing reduced survival/reproduction. (6) Result indicating disruptive selection — the distribution becomes bimodal (two peaks), with survivors/successful reproducers concentrated at both extremes and reduced numbers at the intermediate body size. 1 mark per developed element, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A moth species has evolved bright warning colouration that deters most bird predators, who have learned to avoid it as it also produces a toxin. A newly arrived bird species, unfamiliar with this signal, preys heavily on the moths. Predict how the moth and/or bird populations might evolve over subsequent generations in response to this new predation pressure, explaining your reasoning. (6 marks)",
        back:
          "Model response and marking points: (1) The new bird species represents a new selection pressure on the moth population, since it does not respond to the existing warning colouration/toxin defence the way established predators do. (2) If some moths have existing heritable variation in the strength of their toxin, in a different warning pattern, or in an alternative defence (e.g. camouflage instead of warning colouration), individuals with a more effective defence against this specific new predator would have higher survival. (3) Over generations, natural selection would be expected to favour whichever heritable trait improves survival against the new bird predator, potentially producing directional selection toward a stronger/different defence, or toward reduced reliance on the (now partly ineffective) warning colouration if an alternative strategy proves more effective. (4) From the bird's perspective, if the toxin causes negative consequences for birds that eat the moths (e.g. illness), this would create selection pressure on the bird population favouring individuals that learn or are innately predisposed to avoid the moths — potentially the beginning of the bird population evolving/learning the same avoidance response as established predators. (5) This is an example of a coevolutionary-style reciprocal interaction, since each species' evolutionary trajectory is shaped by pressure exerted by the other, similar to the coevolution concept but arising from a new (not long-established) species interaction. (6) The response explicitly reasons through cause and effect for both organisms rather than only describing the moth or only the bird. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "In a population of 1,000 mosquitoes, the frequency of an insecticide-resistance allele (R) is 0.05 before an insecticide spraying program begins. After five years of repeated spraying, the frequency of R rises to 0.75. (a) Calculate the change in frequency of R over this period. (b) Identify the type of selection this represents and explain the mechanism driving the change. (6 marks)",
        back:
          "Model response and marking points: (a) Change in frequency = 0.75 − 0.05 = 0.70 (an increase of 0.70, or 70 percentage points) (2 marks: correct calculation shown and stated). (b) This represents positive/directional selection acting on the R allele (1 mark). Mechanism: before spraying, R was rare because it conferred no particular survival advantage (and may even have carried a small cost) in the absence of insecticide (1 mark). Once spraying began, mosquitoes carrying R had a large survival advantage over non-resistant mosquitoes, since they could survive insecticide exposure that killed susceptible individuals (1 mark). Because resistant individuals survived to reproduce at a much higher rate than non-resistant individuals each generation, the R allele increased rapidly in frequency across the population over the five years of repeated selection pressure (1 mark).",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Palaeontologists find fossils of an extinct mammal-like reptile with several skeletal features intermediate between modern reptiles and modern mammals. Separately, comparative genomics of living reptile and mammal lineages estimates their common ancestor existed at a similar point in the fossil timeline as this fossil. Explain how these two independent lines of evidence together support a stronger conclusion about mammalian evolutionary origins than either would alone. (6 marks)",
        back:
          "Model response and marking points: (1) The fossil evidence provides direct physical evidence of an organism with a transitional/intermediate combination of features, consistent with a lineage in the process of diverging from a shared reptile-mammal ancestor. (2) On its own, however, a single fossil cannot establish precise timing or confirm that this specific lineage is genuinely ancestral to modern mammals rather than an independent, unrelated lineage that convergently evolved similar features. (3) The comparative genomics evidence, using a molecular clock approach on conserved sequences, independently estimates when the reptile and mammal lineages diverged from their common ancestor, based on accumulated genetic differences between living representatives of each group. (4) On its own, genomic dating provides only an estimated timeframe and no direct physical evidence of what the actual transitional organisms looked like. (5) Because the fossil's age/timeline position and the independently derived genomic divergence estimate correspond, two entirely different types of evidence (physical/morphological and molecular) converge on the same conclusion, which is far stronger support than either alone — this consistency between independent methods is a hallmark of robust scientific evidence, and matches how contemporary evidence for evolution is built from multiple different fields (palaeontology, biogeography, developmental biology, morphology and genetics). (6) The response explicitly explains why agreement between independent methods increases confidence (reduces the chance that a single line of evidence is misleading), not merely stating that there are two types of evidence. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Two populations of a plant species grow on either side of a wide river with no physical barrier preventing pollen or seed dispersal across it, yet the two populations have gradually adapted to different soil types on each bank and show a narrow zone of intermediate hybrid plants directly along the riverbank where both soil types meet. Determine which type of speciation-related process this best represents, and justify your answer by explaining why it is not allopatric speciation. (6 marks)",
        back:
          "Model response and marking points: (1) This scenario best represents parapatric speciation (or an early parapatric divergence process) — populations are not fully geographically isolated (there is no physical barrier and dispersal is possible), but they occupy adjacent ranges with differing environmental conditions (soil type) and show a narrow hybrid zone where the two ranges meet. (2) This is not allopatric speciation because allopatric speciation requires complete geographic isolation preventing gene flow between the diverging populations — here, gene flow is clearly still occurring (as shown by the presence of hybrids), just reduced/limited rather than fully absent. (3) It is also not fully sympatric speciation, because sympatric speciation occurs within a single shared, overlapping range with no geographic separation at all — here there is a clear, if narrow, zone of geographic distinction (opposite riverbanks) with reduced gene flow specifically at the boundary. (4) Mechanism — differing selection pressures from the different soil types on each side favour different traits in each population; because gene flow across the river reduces but does not eliminate genetic exchange, divergence proceeds more slowly than it would under full geographic isolation, but the hybrid zone shows genetic exchange is still limited enough that the two populations remain distinguishable. (5) A clear, reasoned justification distinguishing all three relevant terms (allopatric, sympatric, parapatric) rather than only naming the correct one. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
];

// ============================================================================
// PSYCHOLOGY
// ============================================================================
const PSY: TopicBlock[] = [
  {
    unitNumber: 3,
    topicTitle: "Brain function",
    cards: [
      // ---- complex_familiar (12) ----
      {
        front:
          "Compare a monosynaptic spinal reflex (e.g. the knee-jerk reflex) and a polysynaptic spinal reflex (e.g. the withdrawal reflex from a painful stimulus) in terms of the number of synapses involved and the speed of the response. (3 marks)",
        back:
          "A monosynaptic reflex involves a single synapse directly between the sensory neuron and the motor neuron in the spinal cord, with no interneuron involved (1 mark). A polysynaptic reflex involves at least one interneuron connecting the sensory neuron to the motor neuron, meaning the signal crosses more than one synapse (1 mark). Because each additional synapse adds a small time delay to signal transmission, monosynaptic reflexes are faster than polysynaptic reflexes, which is suited to the knee-jerk's role in immediately maintaining posture, versus the withdrawal reflex needing to coordinate a slightly more complex, multi-muscle response to pain (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe the structure of the human nervous system, distinguishing the central nervous system from the peripheral nervous system, and the somatic from the autonomic division of the peripheral nervous system. (4 marks)",
        back:
          "The central nervous system (CNS) consists of the brain and spinal cord (1 mark). The peripheral nervous system (PNS) consists of all the nerves outside the CNS that connect it to the rest of the body (1 mark). Within the PNS, the somatic division controls voluntary movements via skeletal muscles and carries sensory information to the CNS (1 mark); the autonomic division controls involuntary functions of internal organs and glands (e.g. heart rate, digestion) (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how the formation and storage of explicit memory illustrates that brain function can be both localised and distributed. (4 marks)",
        back:
          "Brain function is localised when a specific function is closely associated with a specific brain area, and distributed when a function relies on multiple brain regions working together (1 mark). Explicit memory formation and storage is distributed, because it is associated with the hippocampus (which plays a key role in forming new explicit memories), the neo-cortex (where explicit memories are ultimately stored long-term) and the amygdala (which attaches emotional significance to memories) (2 marks). This shows that even though each of these regions has an identifiable, somewhat specialised role, the overall function of explicit memory cannot be assigned to any single brain area — it emerges from the coordinated activity of multiple regions (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A patient can understand spoken and written language perfectly but produces slow, effortful, grammatically broken speech. State which language-processing brain area is most likely damaged, and explain how this differs from a patient who speaks fluently but produces speech that makes no sense and cannot understand what is said to them. (4 marks)",
        back:
          "The first patient's symptoms (understanding intact, production impaired) are consistent with damage to Broca's area (1 mark), which has a specific role in language production/speech articulation (1 mark). The second patient's symptoms (fluent but meaningless speech, impaired comprehension) are instead consistent with damage to Wernicke's area (1 mark), which has a specific role in language comprehension — this contrast shows the two areas have distinct, specific roles within language processing, rather than one area governing language as a whole (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how the primary motor cortex, cerebellum and basal ganglia interact to coordinate a voluntary movement such as reaching for a cup. (4 marks)",
        back:
          "The primary motor cortex initiates the voluntary movement by sending signals down to the muscles involved, planning and triggering the intended action (1 mark). The basal ganglia help regulate the initiation of the movement and suppress competing/unwanted movements, ensuring the intended movement is smoothly selected and started (1 mark). The cerebellum continuously monitors sensory feedback during the movement and fine-tunes its timing, coordination and accuracy, correcting for errors as the movement is carried out (1 mark). Together, these three structures allow a movement to be initiated, appropriately selected, and precisely coordinated in real time (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain the roles of the limbic system and the prefrontal cortex in the experience of emotion, and how they interact. (3 marks)",
        back:
          "The limbic system (including structures such as the amygdala) generates the initial emotional response, particularly processing emotionally significant stimuli such as threat (1 mark). The prefrontal cortex is involved in the conscious experience, interpretation and regulation of emotion, including moderating or overriding the more automatic responses generated by the limbic system (1 mark). Together, the limbic system provides the immediate emotional reaction while the prefrontal cortex allows a person to evaluate and regulate that reaction in light of context and consequences (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe the sequence of events in synaptic transmission, from an action potential arriving at the presynaptic terminal to the response of the postsynaptic neuron. (5 marks)",
        back:
          "An action potential arrives at the presynaptic terminal, causing voltage-gated calcium channels to open and calcium ions to enter the terminal (1 mark). The influx of calcium causes synaptic vesicles containing neurotransmitter to fuse with the presynaptic membrane and release their neurotransmitter into the synaptic cleft (1 mark). Neurotransmitter molecules diffuse across the synaptic cleft and bind to specific receptors on the postsynaptic membrane (1 mark). This binding opens ion channels on the postsynaptic neuron, producing either an excitatory or inhibitory postsynaptic potential depending on the neurotransmitter and receptor type (1 mark). The neurotransmitter is then removed from the cleft (via reuptake into the presynaptic neuron or enzymatic breakdown), ending the signal (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Contrast the effect of an excitatory neurotransmitter (e.g. glutamate) and an inhibitory neurotransmitter (e.g. GABA) on a postsynaptic neuron's likelihood of firing an action potential. (3 marks)",
        back:
          "Glutamate, an excitatory neurotransmitter, depolarises the postsynaptic membrane (moves its charge closer to the threshold needed to fire), increasing the likelihood that the postsynaptic neuron will generate an action potential (1 mark). GABA, an inhibitory neurotransmitter, hyperpolarises the postsynaptic membrane (moves its charge further from threshold), decreasing the likelihood that the postsynaptic neuron will fire (1 mark). Whether a postsynaptic neuron ultimately fires depends on the net balance of excitatory and inhibitory input it receives at any given moment (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A patient reports a persistently low mood and reduced motivation. A doctor considers whether the cause could involve dysfunction of a specific neurotransmitter. Identify a neurotransmitter most associated with mood regulation, and describe both a physical and psychological function it has. (3 marks)",
        back:
          "Serotonin (1 mark). Psychological function: regulation of mood (low serotonin activity is associated with depressed mood) (1 mark). Physical function: also involved in regulating sleep and appetite (1 mark, accept any valid physical function of serotonin).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A patient presents with tremor at rest, muscle rigidity and slowed movement. Identify the most likely disorder, the neurotransmitter system involved, and the brain structure primarily affected. (3 marks)",
        back:
          "Parkinson's disease (1 mark). This results from a loss of dopamine-producing neurons (1 mark), primarily affecting the basal ganglia, which relies on dopamine to regulate the initiation and smoothness of voluntary movement — this loss produces the characteristic tremor, rigidity and slowed movement (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why a spinal reflex, such as pulling a hand away from a hot surface, occurs before the person consciously feels the pain. (3 marks)",
        back:
          "In a spinal reflex, the sensory neuron carrying the pain signal synapses with an interneuron and motor neuron directly within the spinal cord, triggering the muscle response without the signal needing to travel up to the brain first (1 mark). Conscious awareness of pain requires the sensory signal to additionally travel up the spinal cord to the brain for processing and interpretation, which takes longer (1 mark). Because the reflex pathway is shorter (spinal cord only) than the pathway to conscious awareness (all the way to the brain), the muscle response occurs first, which is adaptive because it removes the hand from harm before the slower, brain-processed pain sensation is even registered (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how loss of dopamine-producing neurons in the basal ganglia leads to the specific motor symptoms seen in Parkinson's disease, tracing the effect from neurotransmitter loss to movement difficulty. (4 marks)",
        back:
          "The basal ganglia normally use dopamine as a key neurotransmitter to help regulate and smooth the initiation of voluntary movement, in coordination with the primary motor cortex (1 mark). As dopamine-producing neurons progressively degenerate in Parkinson's disease, dopamine levels in the basal ganglia fall (1 mark). Without sufficient dopamine, the basal ganglia's normal role in facilitating smooth initiation of movement and suppressing unwanted movement is impaired (1 mark), resulting in the characteristic symptoms of difficulty initiating movement, slowed movement and tremor, as the motor system loses the fine regulation dopamine normally provides (1 mark).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (7) ----
      {
        front:
          "A patient suffers a head injury affecting the occipital lobe. Predict the specific functional deficits this patient is likely to experience, and explain why damage to a different lobe (e.g. the parietal lobe) would produce a different pattern of deficits, using the concept of localisation of brain function. (6 marks)",
        back:
          "Model response and marking points: (1) The occipital lobe is primarily associated with visual processing, so damage here is likely to impair the patient's vision — e.g. difficulty processing or interpreting visual information, even if the eyes themselves are undamaged. (2) This deficit would be relatively specific to vision, consistent with localisation of function — the occipital lobe having an identifiable specialised role. (3) In contrast, the parietal lobe is primarily associated with processing sensory information such as touch and spatial awareness, so damage there would be expected to produce different deficits — e.g. difficulty with touch sensation, spatial judgement or awareness of one side of the body/environment — not primarily a visual deficit. (4) Explicit comparison — because different, specific functions are localised to different lobes, damage to different regions produces distinguishably different symptom patterns, which is direct evidence for localisation of brain function. (5) An appropriate qualification — while these functions show localisation, the response could note that many everyday tasks (e.g. reading, which draws on visual processing plus other regions) still depend on communication between multiple localised areas, reflecting the distributed side of brain function as well. (6) Reasoning is explicitly tied to the concept of localisation of function throughout, not just naming symptoms. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A new antidepressant drug works by blocking the reuptake of serotonin at the synapse, keeping it available in the synaptic cleft for longer. Explain the intended effect of this mechanism on mood, and evaluate one possible unintended consequence of this same mechanism, given that serotonin is also involved in functions beyond mood. (6 marks)",
        back:
          "Model response and marking points: (1) Normally, after serotonin is released and binds postsynaptic receptors, it is removed from the synaptic cleft via reuptake into the presynaptic neuron, ending its signal. (2) By blocking this reuptake, the drug keeps more serotonin available in the synaptic cleft for longer, increasing the amount of time it can bind to and stimulate postsynaptic receptors. (3) Since serotonin activity is associated with mood regulation, prolonging its availability at the synapse is intended to increase serotonin signalling and improve mood in a patient with depression. (4) Unintended consequence — because serotonin also has physical functions beyond mood (e.g. regulating sleep or appetite), artificially increasing serotonin availability everywhere it acts (not just in mood-related pathways) could plausibly disrupt these other functions as a side effect, such as changes to sleep or appetite. (5) This illustrates the broader principle that changes to neurotransmitter function, even therapeutically intended ones, can have beneficial and/or harmful and/or unintended consequences, because neurotransmitters are rarely involved in only one function. (6) A reasoned evaluative statement connecting the specific mechanism (non-selective increase in serotonin availability) to why an unintended consequence is plausible, not just asserting that side effects exist. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A popular claim states: \"Humans only use 10% of their brain, and unlocking the other 90% would give people extraordinary abilities.\" Using what you know about localisation and distribution of brain function, explain why this claim is not consistent with current understanding of the brain. (5 marks)",
        back:
          "Model response and marking points: (1) The claim implies that 90% of brain tissue is currently unused/inactive, which is inconsistent with the fact that different brain regions have identifiable, active roles (localisation of function) — e.g. the occipital lobe for vision, the frontal lobe for planning, the cerebellum for coordination — collectively accounting for the vast majority of the brain, not just 10%. (2) It is also inconsistent with the concept of distributed function — many functions (e.g. explicit memory, involving the hippocampus, neo-cortex and amygdala together) rely on multiple regions working together, meaning even a single task recruits activity across a wide range of brain areas, not a small isolated 10%. (3) Brain imaging and clinical evidence (e.g. damage to almost any brain region producing some kind of measurable deficit) is inconsistent with large portions of the brain being functionally unnecessary, since damage to areas outside a hypothetical \"used 10%\" would then be expected to have no effect, which is not observed. (4) A correctly reasoned conclusion stating that the claim is a myth not supported by evidence of localisation and distribution of function. (5) The response explicitly uses both localisation and distribution concepts to build the argument, rather than simply asserting the claim is false. 1 mark per developed point, maximum 5.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Devise an investigation (using a case-study/comparative approach, since experimentally damaging brain tissue in humans is not ethical) to test whether damage to the cerebellum specifically impairs coordination of movement rather than the ability to initiate movement. State what groups/data you would compare and what pattern of results would support the conclusion. (6 marks)",
        back:
          "Model response and marking points: (1) Because deliberately damaging brain tissue in humans is unethical, use a case-study/comparative design: identify a group of patients with confirmed cerebellar damage (e.g. from a stroke or injury restricted to the cerebellum) and compare them with a matched group of patients with damage restricted to the primary motor cortex, plus a healthy control group. (2) Measure TWO distinct outcomes for each group: (a) ability to initiate a voluntary movement (e.g. can the patient begin a reaching movement at all, and how quickly) and (b) precision/coordination of the movement once started (e.g. accuracy of reaching a target, smoothness of the movement, ability to correct errors mid-movement). (3) Predicted result supporting the conclusion — the cerebellar-damage group would be expected to show relatively normal ability to initiate movement, but significantly impaired coordination/precision (e.g. overshooting targets, jerky movements) compared to controls. (4) Predicted contrasting result — the motor-cortex-damage group would be expected to show impaired initiation of movement (e.g. weakness, difficulty starting the movement at all), which would be a different pattern from the cerebellar group. (5) This double dissociation (cerebellar damage impairs coordination but not initiation; motor cortex damage impairs initiation) would support the conclusion that the cerebellum's specific role is coordination, separate from the motor cortex's role in initiation. (6) A limitation acknowledged — case studies of naturally occurring damage cannot control the exact location/extent of damage as precisely as an experiment could, limiting how cleanly the two functions can be separated. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A patient makes a strong recovery of speech ability in the years following a stroke that damaged Broca's area, despite the original damaged tissue not regenerating. Explain how brain plasticity could account for this recovery, and suggest what this implies about the localisation of language function being flexible rather than fixed. (6 marks)",
        back:
          "Model response and marking points: (1) Plasticity refers to the brain's ability to reorganise itself — forming new neural connections and, in some cases, having other regions take over functions previously performed by damaged tissue. (2) Because the originally damaged Broca's area tissue does not regenerate, the recovery of speech ability must be explained by surrounding or alternative brain regions (e.g. corresponding areas in the opposite hemisphere, or nearby cortical tissue) taking on some of the language-production role that Broca's area previously performed. (3) This recovery process typically happens gradually over the years following the injury, consistent with the timeframe described, as the brain progressively strengthens and reorganises alternative neural pathways to compensate. (4) Implication for localisation — while a function may typically be strongly localised to a specific area under normal conditions (as with Broca's area and speech production), this does not mean that area is the ONLY possible neural substrate for that function; plasticity shows that localisation reflects the brain's typical/default organisation rather than a fixed, unchangeable one-to-one mapping. (5) This supports the idea that localisation and distribution are not mutually exclusive — a function can be predominantly localised under normal circumstances, while still being capable of being distributed to or reorganised into other regions when the primary area is damaged. (6) The response explicitly connects plasticity to the specific recovery pattern described, not just defining plasticity generically. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A patient has fully intact spinal reflexes (e.g. a normal knee-jerk response) but has extreme difficulty voluntarily initiating everyday movements like standing up from a chair, despite having no muscle weakness. Explain how this pattern of symptoms could occur, referring to the different neural pathways involved in reflexes versus voluntary movement. (6 marks)",
        back:
          "Model response and marking points: (1) Spinal reflexes rely on a reflex arc that operates largely within the spinal cord (sensory neuron, possible interneuron, motor neuron), not requiring input from the brain to occur — this explains why reflexes remain intact even if higher brain regions involved in voluntary movement are affected. (2) Voluntary movement, by contrast, depends on a pathway involving the primary motor cortex (to initiate the movement), the basal ganglia (to regulate/facilitate initiation and suppress competing movements) and the cerebellum (to coordinate execution) — a much more complex circuit than a simple reflex arc. (3) Because the patient has no muscle weakness and reflexes are normal, the muscles and the basic spinal motor pathways are functioning correctly, ruling out damage to the muscles themselves or to the spinal reflex arc. (4) The specific difficulty is with INITIATING voluntary movement, which points toward dysfunction in the structures responsible for the initiation stage of voluntary movement specifically — most likely the basal ganglia (as in conditions such as Parkinson's disease, where basal ganglia dopamine dysfunction impairs movement initiation while reflexes remain intact). (5) This pattern illustrates that reflexive and voluntary movement use distinguishable neural pathways, so damage can selectively impair one while sparing the other. (6) The response reasons through the dissociation (intact reflex pathway vs impaired voluntary-initiation pathway) explicitly rather than just naming basal ganglia dysfunction. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A patient with damage restricted to the amygdala shows a marked reduction in fear responses (e.g. no longer reacting to threatening situations), but is still able to form new explicit (episodic and semantic) memories, though these new memories seem emotionally \"flat\" compared to before the injury. Using the roles of the amygdala in BOTH emotion and explicit memory, explain this pattern of symptoms. (6 marks)",
        back:
          "Model response and marking points: (1) The amygdala plays a central role in the limbic system's processing of emotion, particularly threat/fear, so damage to it would be expected to blunt fear responses — consistent with the patient's reduced reaction to threatening situations. (2) The amygdala also contributes to the formation and storage of explicit memory, working alongside the hippocampus and neo-cortex — but its specific contribution is generally understood to be attaching emotional significance/salience to memories, rather than being solely responsible for forming the memory itself. (3) Because the hippocampus and neo-cortex (the other two structures involved in explicit memory) are undamaged in this patient, the basic capacity to form and store new explicit memories remains intact — explaining why the patient can still form new memories. (4) However, because the amygdala (the structure specifically linked to emotional tagging of memory) is damaged, new memories are formed without their normal emotional colouring, explaining why they seem \"flat\". (5) This double pattern (fear blunted, memory formation intact but emotionally flat) is explained by the amygdala having a specific, identifiable role within TWO different distributed functions (emotion processing and explicit memory) rather than being solely responsible for either function on its own. (6) The response explicitly draws on and connects both syllabus concepts (the limbic system/emotion role and the hippocampus–neo-cortex–amygdala explicit memory system) rather than treating them separately. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
];

const DATA: Record<string, TopicBlock[]> = { BIO, PSY };

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  console.log(write ? "MODE: WRITE\n" : "MODE: dry run (nothing is written)\n");

  const grand = { complex_familiar: 0, complex_unfamiliar: 0 };
  const grandInserted = { complex_familiar: 0, complex_unfamiliar: 0 };

  for (const code of Object.keys(DATA)) {
    const blocks = DATA[code];
    const subject = await prisma.subject.findFirst({ where: { shortCode: code } });
    if (!subject) {
      console.log(`${code}: no such subject in the database — skipping\n`);
      continue;
    }
    console.log(`${code} — ${subject.name}`);

    for (const block of blocks) {
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

      const cf = block.cards.filter((c) => c.complexity === "complex_familiar");
      const cu = block.cards.filter((c) => c.complexity === "complex_unfamiliar");

      const label = `U${block.unitNumber} ${block.topicTitle}`;
      const parts: string[] = [];

      for (const [band, cards] of [
        ["complex_familiar", cf],
        ["complex_unfamiliar", cu],
      ] as [Band, Card[]][]) {
        grand[band] += cards.length;
        const toInsert = cards.filter((c) => !existingFronts.has(c.front));
        const dupes = cards.length - toInsert.length;

        if (write && toInsert.length > 0) {
          const draft: DraftCard[] = toInsert.map((c) => ({
            front: c.front,
            back: c.back,
            cardType: "basic",
            complexity: c.complexity,
          }));
          const inserted = await (await deps()).saveCards(
            subject.userId,
            subject.id,
            topic.id,
            draft,
            ["hand-authored", code, band],
          );
          grandInserted[band] += inserted;
          parts.push(`${band === "complex_familiar" ? "CF" : "CU"} +${inserted}${dupes ? ` (${dupes} dupe)` : ""}`);
        } else {
          parts.push(`${band === "complex_familiar" ? "CF" : "CU"} ${toInsert.length} new${dupes ? ` (${dupes} dupe)` : ""}`);
        }
      }

      console.log(`  ${label.padEnd(44)} ${parts.join("  ")}`);
    }
    console.log();
  }

  console.log("SUMMARY (defined in this script)");
  console.log(
    `  complex_familiar:   ${grand.complex_familiar} defined${write ? `, ${grandInserted.complex_familiar} newly inserted` : ""}`,
  );
  console.log(
    `  complex_unfamiliar: ${grand.complex_unfamiliar} defined${write ? `, ${grandInserted.complex_unfamiliar} newly inserted` : ""}`,
  );
  console.log(`  total:              ${grand.complex_familiar + grand.complex_unfamiliar} defined`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
