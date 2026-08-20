/**
 * Hand-authored COGNITIVE VERB flashcards for all five subjects.
 *
 * Why this deck exists: misreading the cognitive verb is one of the most
 * common reasons QCAA students lose marks — "describe" answered where
 * "explain" was asked scores the describe marks and none of the rest.
 * Study-skills research (retrieval practice + the QCAA-specific advice to
 * drill command terms with a subject-specific example on the back) says
 * this is the highest-leverage generic deck a QCE student can own.
 *
 * Definitions follow QCAA's "Glossary of cognitive verbs" wording. Each
 * card's back adds what a full-mark response actually does in THAT subject.
 * The contrast cards (describe vs explain, analyse vs evaluate...) are the
 * most valuable — discrimination between adjacent verbs is where marks die.
 *
 * NOT generated — no AI provider is called anywhere in this file.
 *
 * Run:  npx tsx scripts/seed-cards-cognitive-verbs.ts [--write] [MM BIO ...]
 *
 * Same machinery as seed-cards-eng-pe.ts: dry run by default, idempotent on
 * front-text, saves through saveCards(), cards attach to U3T1 of each
 * subject and are tagged "cognitive-verbs" so they can be filtered.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { ComplexityBand } from "../src/lib/cards";

async function deps() {
  const cards = await import("../src/lib/cards");
  return cards;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type SeedCard = {
  front: string;
  back: string;
  complexity: ComplexityBand;
  cardType?: "basic" | "cloze";
};

// ============================================================================
// MATHEMATICAL METHODS
// ============================================================================
const MM_VERBS: SeedCard[] = [
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'determine' require in a Methods exam?", back: "Establish or ascertain after calculation, observation or consideration. In Methods: reach a definite value or expression AND show the working that gets there — 'determine' questions are rarely one-liners." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'calculate' require in a Methods exam?", back: "Find a number or answer using mathematical processes. Show the substitution and the process — a bare answer risks losing method marks if the final value is wrong." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'solve' require in a Methods exam?", back: "Find ALL values satisfying the equation/inequality, within any stated domain. Common mark-losers: dropping a solution (e.g. the negative root, extra trig solutions in the domain) or ignoring a domain restriction." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'sketch' require in a Methods exam?", back: "A drawing in simple form giving essential features: intercepts, turning points, asymptotes, endpoints and general shape — labelled. Not a plot-perfect graph, but every 'essential feature' missing costs a mark." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'show that' require in a Methods exam?", back: "Arrive at the GIVEN result with every logical step visible. You cannot use the stated result in your working — start from known information and derive it. More working than usual is expected because the answer is already on the page." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'prove' require in a Methods exam?", back: "Use a sequence of formal logical steps to obtain the required result. Like 'show that' but stricter: state what you start from, justify each step, and end with a conclusion statement." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'derive' require in a Methods exam?", back: "Manipulate a known mathematical relationship to produce a new equation or relationship — the marks are in the manipulation steps, not the final line." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'justify' require in a Methods exam?", back: "Give mathematical reasons or evidence supporting a conclusion — e.g. justify a maximum by showing the sign change of f'(x) or the sign of f''(x), not just 'because the graph goes down'." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'interpret' require in a Methods exam?", back: "Use the mathematics to draw a conclusion IN CONTEXT — translate a value into what it means in the scenario, with units. 'The gradient is 3' scores less than 'the population grows by 3 hundred per hour at t = 2'." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'evaluate' require in a Methods exam?", back: "Two uses: (1) numerically work out the value of an expression/integral; (2) in modelling questions, weigh up strengths and limitations of a model. Read the question to see which is being asked." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'verify' require in a Methods exam?", back: "Give evidence that validates a prior conclusion — typically substitute the claimed value back into the original equation/conditions and show it holds. Verification is substitution; proof is derivation." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'deduce' require in a Methods exam?", back: "Reach a conclusion that necessarily follows from earlier parts or given assumptions. Signals: use the previous part's result — don't start from scratch." },
  { complexity: "simple_familiar", front: "What does 'hence' mean in a Methods question, and how is it different from 'hence or otherwise'?", back: "'Hence' = you MUST use the previous result to answer. 'Hence or otherwise' = using the previous result is the intended (usually fastest) path, but any valid method scores." },
  { complexity: "complex_familiar", front: "Contrast 'show that' with 'solve' — what changes in how you write the response? (2 marks)", back: "1 mark: 'Solve' works forward to an unknown answer; the answer earns marks. 1 mark: 'Show that' works toward a stated answer, so ALL credit is in complete, justified steps — skipping algebra that 'obviously' works loses marks because the target was given." },
  { complexity: "complex_familiar", front: "Contrast 'verify' with 'prove' in Methods. (2 marks)", back: "1 mark: 'Verify' = substitute/check a given or claimed result holds (evidence supporting it). 1 mark: 'Prove' = derive the result formally from first principles or known results with logical justification — substitution of one case is never a proof of a general statement." },
  { complexity: "complex_familiar", front: "A question says 'determine the exact value'. What two requirements does this wording impose? (2 marks)", back: "1 mark: 'Exact' bans decimal approximations — leave surds, fractions, π, e and logs in symbolic form. 1 mark: 'Determine' still demands visible working leading to that value, not a calculator readout." },
  { complexity: "complex_familiar", front: "In a Methods modelling question asked to 'comment on the suitability of the model', what must a full-mark response contain? (2 marks)", back: "1 mark: A judgement (suitable / not suitable / suitable within limits) tied to the context. 1 mark: Mathematical evidence for it — e.g. long-term behaviour of the function, domain where the model breaks down, or fit to given data." },
];

// ============================================================================
// BIOLOGY
// ============================================================================
const BIO_VERBS: SeedCard[] = [
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'describe' require in a Biology exam?", back: "Give an account of characteristics or features — WHAT is happening/what it looks like. No mechanism or reason needed. E.g. describe the trend: 'as light intensity increases, photosynthesis rate increases then plateaus'." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'explain' require in a Biology exam?", back: "Make the idea clear by giving the HOW/WHY — mechanism, cause or biological reason. 'Explain the trend' = state the trend AND the biology causing it (e.g. enzymes saturated, so rate plateaus)." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'analyse' require in a Biology exam?", back: "Dissect data or information into parts and examine relationships — identify patterns, trends, anomalies and relationships between variables, quoting data values as evidence." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'evaluate' require in a Biology exam?", back: "Weigh up strengths AND limitations and reach a judgement — e.g. evaluate an experimental design: valid controls (strength), small sample (limitation), then an overall verdict on reliability/validity." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'compare' require in a Biology exam?", back: "Give similarities AND differences and note their significance. Use comparative sentences ('both...', 'whereas...') — two separate descriptions side-by-side is not comparing." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'contrast' require in a Biology exam?", back: "Differences ONLY, deliberately juxtaposed — 'mitosis produces two identical diploid cells, whereas meiosis produces four genetically different haploid cells'. No similarities required." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'infer' require in a Biology exam?", back: "Draw a conclusion from evidence and reasoning that goes beyond what is directly stated — e.g. from tracks and scat data, infer the predator is present, and state the evidence chain." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'predict' require in a Biology exam?", back: "Give an expected result, usually with the biological reasoning — e.g. predict the effect of removing a keystone species on named populations, tied to the food-web relationships given." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'determine' require in a Biology exam?", back: "Establish a definite answer after consideration/calculation — e.g. determine allele frequencies using the Hardy–Weinberg equations, showing the working from the data given." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'justify' require in a Biology exam?", back: "Support an answer or conclusion with reasons and evidence — quote the data or the biological principle that makes your answer the right one. An unjustified correct choice loses the justification marks." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'identify' require in a Biology exam?", back: "Recognise and name — a short, precise response. 'Identify the independent variable' wants the variable named, not discussed." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'draw conclusions' require in a Biology exam?", back: "Make a judgement based on reasoning and the evidence provided — state what the data shows about the hypothesis/question, referencing specific results." },
  { complexity: "complex_familiar", front: "Contrast 'describe' with 'explain' using an enzyme–temperature graph as the example. (2 marks)", back: "1 mark: Describe = the pattern only: rate rises to an optimum at ~37°C then falls sharply. 1 mark: Explain = the mechanism: rising kinetic energy increases collisions up to the optimum; beyond it, the active site denatures so substrate no longer fits — the WHY behind each phase." },
  { complexity: "complex_familiar", front: "Contrast 'analyse' with 'evaluate' for a question about an ecology field study's data. (2 marks)", back: "1 mark: Analyse = break the data down — trends, relationships between variables, anomalies, quoting values. 1 mark: Evaluate = judge the study — weigh strengths (e.g. replicated quadrats) against limitations (e.g. one season only) and conclude how much confidence the data deserves." },
  { complexity: "complex_familiar", front: "A Biology short-response asks you to 'compare' two organisms' adaptations but you only list each organism's features separately. What happens to your marks and why? (2 marks)", back: "1 mark: You lose the comparison marks — QCAA marking requires explicit links (both/whereas/however) showing similarities and differences recognised. 1 mark: Parallel description without juxtaposition only demonstrates 'describe', a lower cognitive demand than the question asked." },
  { complexity: "complex_familiar", front: "Why do data-response questions saying 'use the data to justify your answer' punish answers that are biologically correct but data-free? (2 marks)", back: "1 mark: 'Justify' with 'use the data' makes quoting specific values/trends from the stimulus a marked requirement. 1 mark: A textbook-correct answer without the stimulus data hasn't performed the cognitive task — the question tests reasoning FROM evidence, not recall." },
];

// ============================================================================
// PSYCHOLOGY
// ============================================================================
const PSY_VERBS: SeedCard[] = [
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'describe' require in a Psychology exam?", back: "Give an account of characteristics or features — e.g. describe the components of the multi-store model of memory: name them and their key properties. No 'why' needed." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'explain' require in a Psychology exam?", back: "Make the concept plain by revealing HOW or WHY — e.g. explain how maintenance rehearsal keeps information in STM: mechanism (repetition refreshes the trace) plus consequence (prevents decay past ~18–30 s)." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'analyse' require in a Psychology exam?", back: "Dissect information/data into parts and examine relationships — in research scenarios: pick apart variables, patterns in results, and links between IV and DV, quoting the numbers." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'evaluate' require in a Psychology exam?", back: "Weigh up strengths and limitations and reach a judgement — e.g. evaluate Milgram's study: methodological strengths, ethical/validity limitations, then a verdict about what it can and can't tell us." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'interpret' require in a Psychology exam?", back: "Use knowledge to recognise trends and draw conclusions from given information — e.g. interpret a results table: what the pattern of means shows about the hypothesis." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'infer' require in a Psychology exam?", back: "Conclude from evidence and reasoning beyond what's directly stated — e.g. from a participant's error pattern, infer which memory store is impaired, citing the evidence chain." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'compare' require in a Psychology exam?", back: "Similarities AND differences, with significance — e.g. compare classical and operant conditioning using linked sentences ('both involve learning associations, whereas only operant involves consequences...')." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'distinguish' require in a Psychology exam?", back: "Recognise two things as distinct — give the key difference(s) that separate them, e.g. distinguish sensation from perception: detection of stimuli vs interpretation of that input." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'justify' require in a Psychology exam?", back: "Give reasons or evidence supporting a conclusion — cite the theory, study or stimulus data that makes the answer defensible, e.g. justify a diagnosis of retroactive interference with the scenario's timeline." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'identify' require in a Psychology exam?", back: "Recognise and name — short answer, e.g. identify the sampling method used: 'convenience sampling'. Don't waste time elaborating unless marks suggest more." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'determine' require in a Psychology exam?", back: "Establish or conclude after consideration of the information — e.g. determine whether results support the hypothesis, stating the decision and the supporting figures." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'draw conclusions' require in a Psychology exam?", back: "Make a judgement from reasoning and evidence — a concluding claim about what the study/data shows, bounded by what the evidence can actually support (no overgeneralising)." },
  { complexity: "complex_familiar", front: "Contrast 'describe' with 'explain' for a question about the misinformation effect. (2 marks)", back: "1 mark: Describe = what it is: post-event information altering an eyewitness's memory of the original event. 1 mark: Explain = the mechanism: the misleading information is integrated into or overwrites the original trace during reconsolidation/reconstruction, so retrieval produces the altered version — the how/why." },
  { complexity: "complex_familiar", front: "Contrast 'evaluate' with 'analyse' for a question about a conformity experiment. (2 marks)", back: "1 mark: Analyse = break down the design and results — variables, conditions, what the numbers show about conformity rates. 1 mark: Evaluate = judge it — weigh strengths (control, replicability) against limitations (artificial task, sample bias, demand characteristics) and conclude how far the findings generalise." },
  { complexity: "complex_familiar", front: "A PSY data question says 'analyse the results in the table'. Your answer explains the theory behind the study but never quotes a number. Why does it score poorly? (2 marks)", back: "1 mark: 'Analyse' targets the RESULTS — the marked skill is dissecting the data: trends, differences between conditions, anomalies, with values quoted. 1 mark: Theory recall answers a different (lower-demand) question than the one asked, so the analysis marks are unearned regardless of accuracy." },
  { complexity: "complex_familiar", front: "Why is 'distinguish' usually a faster question to answer than 'compare' in Psychology? (2 marks)", back: "1 mark: 'Distinguish' only needs the difference(s) that make the two concepts distinct — one sharp boundary line can be enough. 1 mark: 'Compare' needs similarities AND differences AND their significance, so it demands more content and linked comparative phrasing for full marks." },
];

// ============================================================================
// ENGLISH
// ============================================================================
const ENG_VERBS: SeedCard[] = [
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'analyse' require in the English external exam?", back: "Dissect the text to examine how its parts create meaning — identify specific language/aesthetic choices and examine HOW they shape representations and position the audience. Naming devices without examining their effect is not analysis." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'evaluate' require in an English response?", back: "Weigh up and judge — e.g. evaluate how effectively a text's choices construct a perspective: make a judgement about effect/worth and support it with textual evidence, not just describe the choices." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'interpret' require in an English response?", back: "Use knowledge of the text and context to draw conclusions about meaning — offer a defensible reading of what the text's choices suggest, supported by evidence." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'synthesise' require in an English response?", back: "Combine parts into a coherent whole — integrate multiple pieces of textual evidence and ideas into one unified argument, rather than treating each point in isolation." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'justify' require in an English response?", back: "Support your reading/argument with reasons and textual evidence — every claim about meaning or effect must be anchored to a quoted or specific feature of the text." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'create' require in English?", back: "Bring an original text into being — in an imaginative task: craft a text that consciously uses genre conventions, aesthetic features and language choices for deliberate effect on an audience." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'discuss' require in an English response?", back: "Examine by argument — sift considerations for and against a proposition about the text, developing a position through the weighing rather than asserting one side only." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'compare' require in an English response?", back: "Show similarities AND differences between texts/representations and the significance of these — with explicit linking language, not two separate mini-essays." },
  { complexity: "complex_familiar", front: "Contrast 'analyse' with 'evaluate' for the English external's analytical essay. (2 marks)", back: "1 mark: Analyse = examine HOW language and aesthetic choices construct meaning/representations — mechanism-level work. 1 mark: Evaluate = add a judgement about the effect, worth or success of those choices for purpose and audience — analysis plus verdict. The external demands both: analysis without judgement caps your criteria marks." },
  { complexity: "complex_familiar", front: "The English external asks how a writer 'invites' a particular reading. Which cognitive skills does this wording actually demand? (2 marks)", back: "1 mark: Analysis — identify the specific choices (imagery, focalisation, structure, register) doing the inviting. 1 mark: Interpretation — draw a conclusion about the reading those choices construct and how the audience is positioned to accept it, supported by evidence." },
  { complexity: "complex_familiar", front: "Why does retelling the plot score almost nothing in a question asking you to 'analyse how the author represents' a concept? (2 marks)", back: "1 mark: Retelling is 'describe/recall' — the lowest cognitive demand — while the question asks for analysis of construction: HOW choices create the representation. 1 mark: Marks sit in the how: naming techniques, quoting them, and examining their effect on meaning and audience positioning." },
];

// ============================================================================
// PHYSICAL EDUCATION
// ============================================================================
const PE_VERBS: SeedCard[] = [
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'recognise' require in a PE exam?", back: "Identify or recall particular features — e.g. recognise the energy system dominant in a given activity from its duration and intensity. Short, precise response." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'describe' require in a PE exam?", back: "Give an account of characteristics or features — e.g. describe the ATP-PC system: fuel source, duration, intensity, recovery time. No reasons or judgements needed." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'explain' require in a PE exam?", back: "Make it clear HOW or WHY — e.g. explain why the ATP-PC system suits a 100 m sprint: link its rapid ATP resynthesis and ~10 s capacity to the demand of maximal short effort." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'apply' require in a PE exam?", back: "Use knowledge in response to a given situation — take the concept (e.g. a training principle, tactical strategy) and work it into the specific scenario/stimulus provided, not in the abstract." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'analyse' require in a PE exam?", back: "Dissect information/data (e.g. GPS data, heart-rate data, game stats, your own performance) into parts and examine relationships — patterns, strengths, weaknesses, and what relates to what." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'synthesise' require in a PE exam?", back: "Combine parts into a coherent whole — pull together data, personal performance evidence and theory into one integrated justification or strategy. The step between analysing and devising." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'devise' require in a PE exam?", back: "Think out, plan or invent — e.g. devise a training or tactical strategy: produce a NEW plan with specific, actionable detail (what, how, when), grounded in the scenario's constraints." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'evaluate' require in a PE exam?", back: "Weigh strengths and limitations and reach a judgement — e.g. evaluate the effectiveness of a strategy using performance data: evidence for, evidence against, verdict." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'justify' require in a PE exam?", back: "Give reasons or evidence supporting a decision — e.g. justify your choice of training method by linking it to the energy system demands, fitness data and the performer's identified weakness." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'appraise' require in a PE exam?", back: "Evaluate the worth, significance or status of something — closely related to 'evaluate'; make a considered judgement of quality or value, e.g. appraise the fairness of a policy in sport." },
  { complexity: "simple_familiar", front: "Cognitive verb: what does 'optimise' require in a PE exam?", back: "Make a performance/strategy as effective as possible — identify what to change and how the change maximises the outcome, tied to the constraints of the scenario." },
  { complexity: "complex_familiar", front: "Contrast 'devise' with 'justify' in a PE tactical-strategy question. (2 marks)", back: "1 mark: Devise = create the strategy itself — the specific, actionable plan for the scenario. 1 mark: Justify = defend it — link the plan to evidence (data, principles of play, energy systems) showing WHY it should work. Exam questions often demand both; a plan without justification is half the marks." },
  { complexity: "complex_familiar", front: "Contrast 'analyse' with 'evaluate' for a question using match-performance data in PE. (2 marks)", back: "1 mark: Analyse = break the data apart — trends, patterns, relationships (e.g. success rate drops in the final quarter as HR climbs). 1 mark: Evaluate = judge from it — weigh what worked against what didn't and conclude whether the performance/strategy was effective, with the data as evidence." },
  { complexity: "complex_familiar", front: "A PE question says 'apply the principles of training to the athlete in the stimulus'. Why does a textbook definition of each principle score poorly? (2 marks)", back: "1 mark: 'Apply' demands the knowledge be used ON the given situation — each principle must be tied to the stimulus athlete's sport, data and goals. 1 mark: Definitions alone demonstrate 'recall/describe', a lower cognitive demand than the applied response the verb requires." },
];

// ============================================================================

type TopicSeed = { unitNumber: number; topicNumber: number; label: string; cards: SeedCard[] };

// All cognitive-verb cards attach to U3T1 of their subject — the first topic
// a student meets — and carry the "cognitive-verbs" tag for filtering.
const SUBJECTS: Record<string, TopicSeed[]> = {
  MM: [{ unitNumber: 3, topicNumber: 1, label: "U3T1 (cognitive verbs)", cards: MM_VERBS }],
  BIO: [{ unitNumber: 3, topicNumber: 1, label: "U3T1 (cognitive verbs)", cards: BIO_VERBS }],
  PSY: [{ unitNumber: 3, topicNumber: 1, label: "U3T1 (cognitive verbs)", cards: PSY_VERBS }],
  ENG: [{ unitNumber: 3, topicNumber: 1, label: "U3T1 (cognitive verbs)", cards: ENG_VERBS }],
  PE: [{ unitNumber: 3, topicNumber: 1, label: "U3T1 (cognitive verbs)", cards: PE_VERBS }],
};

const BANDS: ComplexityBand[] = ["simple_familiar", "complex_familiar", "complex_unfamiliar"];
const SHORT: Record<ComplexityBand, string> = {
  simple_familiar: "SF",
  complex_familiar: "CF",
  complex_unfamiliar: "CU",
};

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const only = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());
  const targets = only.length > 0 ? only : Object.keys(SUBJECTS);

  console.log(write ? "MODE: WRITE\n" : "MODE: dry run (nothing is written)\n");

  const d = await deps();

  const grand: Record<string, { defined: number; inserted: number }> = {};

  for (const code of targets) {
    const topicSeeds = SUBJECTS[code];
    if (!topicSeeds) {
      console.log(`${code}: no seed data defined for this code — skipping\n`);
      continue;
    }

    const subject = await prisma.subject.findFirst({ where: { shortCode: code } });
    if (!subject) {
      console.log(`${code}: no such subject in the database — skipping\n`);
      continue;
    }

    console.log(`${code} — ${subject.name}`);

    const units = await prisma.unit.findMany({
      where: { subjectId: subject.id },
      include: { topics: true },
    });

    grand[code] = { defined: 0, inserted: 0 };

    for (const seed of topicSeeds) {
      const unit = units.find((u) => u.number === seed.unitNumber);
      const topic = unit?.topics.find((t) => t.number === seed.topicNumber);
      if (!topic) {
        console.log(`  ${seed.label}: no matching U${seed.unitNumber}T${seed.topicNumber} topic in DB — skipping`);
        continue;
      }

      const existing = await prisma.card.findMany({
        where: { topicId: topic.id },
        select: { front: true },
      });
      const existingFronts = new Set(existing.map((e) => e.front));

      const parts: string[] = [];
      for (const band of BANDS) {
        const bandCards = seed.cards.filter((c) => c.complexity === band);
        if (bandCards.length === 0) continue;
        const newCards = bandCards.filter((c) => !existingFronts.has(c.front));

        grand[code].defined += bandCards.length;
        parts.push(`${SHORT[band]} ${bandCards.length} defined, ${newCards.length} new`);

        if (write && newCards.length > 0) {
          const saved = await d.saveCards(
            subject.userId,
            subject.id,
            topic.id,
            newCards.map((c) => ({ front: c.front, back: c.back, cardType: c.cardType ?? "basic", complexity: band })),
            ["hand-authored", "cognitive-verbs", code],
          );
          grand[code].inserted += saved;
        }
      }

      console.log(`  ${seed.label.padEnd(28)} ${parts.join("  |  ")}`);
    }
    console.log();
  }

  console.log("SUMMARY");
  for (const code of Object.keys(grand)) {
    const g = grand[code];
    console.log(
      `  ${code.padEnd(4)} ${String(g.defined).padStart(3)} defined` +
        (write ? `  ${String(g.inserted).padStart(3)} inserted` : "  (dry run — nothing written)"),
    );
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
