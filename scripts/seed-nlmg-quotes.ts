/**
 * Puts the Never Let Me Go quote analysis into the English section of the app.
 *
 *   npx tsx scripts/seed-nlmg-quotes.ts [--dry-run]
 *
 * Two things happen:
 *
 * 1. The quote-analysis markdown is APPENDED to the existing U4T2 lesson
 *    ("Critical responses to literary texts" — the topic that feeds the external
 *    essay). Appended, not written: that lesson already holds 17k characters of
 *    generated content on how analytical essays work, and overwriting it to add
 *    a quote bank would trade one useful thing for another.
 *
 * 2. Cards are created in three layers, because "knowing a quote" is three
 *    different skills and the exam needs all of them:
 *      - recall    (type_in / cloze) — can you reproduce the words exactly?
 *      - analysis  (basic)           — what does it mean and why does it work?
 *      - deployment(basic)           — which quote do you reach for, given a question?
 *
 * Both steps are idempotent. The lesson append is delimited by a marker and the
 * old block is stripped before re-appending; cards are tagged and the tagged set
 * is deleted before reinsert. So this can be re-run after an edit without
 * duplicating anything.
 */
import { config } from "dotenv";
config({ path: ".env.supabase" });
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const USER_ID = "local";
const TAG = "nlmg-quotes";
const MARKER = "<!-- nlmg-quote-analysis -->";

type CardSpec = {
  type: "basic" | "cloze" | "type_in";
  front: string;
  back: string;
  extra?: string;
  /** Which subtopic it belongs under, by title. */
  strand: "Language and textual analysis" | "Responding to and creating texts" | "Texts in contexts";
};

// ---------------------------------------------------------------------------
// Layer 1 — recall. Can you produce the words?
//
// type_in for anything short enough to type accurately under pressure; cloze for
// the long ones, where demanding the whole passage verbatim would train
// frustration rather than recall. The deletions in the cloze cards are placed on
// the words that carry the analysis, not on random nouns — "efficient",
// "harsh, cruel", "souls at all" are the words you'd actually quote.
// ---------------------------------------------------------------------------
const RECALL: CardSpec[] = [
  {
    type: "type_in",
    strand: "Language and textual analysis",
    front: "NLMG — the novel's opening line. Kathy introduces herself. (Type it exactly.)",
    back: "My name is Kathy H. I'm thirty-one years old, and I've been a carer now for over eleven years.",
    extra: "Ch 1. Identity as job title and length of service — and a surname cut to an initial.",
  },
  {
    type: "type_in",
    strand: "Language and textual analysis",
    front: "NLMG — Miss Lucy names the mechanism the whole novel runs on, in five words. (Ch 7)",
    back: "The problem, as I see it, is that you've been told and not told.",
    extra: "The single most portable quote in the text — it fits almost any question on control, ethics or the guardians.",
  },
  {
    type: "type_in",
    strand: "Language and textual analysis",
    front: "NLMG — Miss Emily's phrase for Norfolk in the geography lesson that becomes the students' private myth. (Ch 6)",
    back: "something of a lost corner of England",
    extra: "Seeded in Ch 6, paid off with the tape in Ch 15 and the final field in Ch 23.",
  },
  {
    type: "type_in",
    strand: "Language and textual analysis",
    front: "NLMG — Ruth's deathbed confession to Kathy. (Ch 19)",
    back: "The main thing is, I kept you and Tommy apart.",
    extra: "Plain monosyllables against an enormity. Reframes years of cruelty as fear of being left alone.",
  },
  {
    type: "cloze",
    strand: "Language and textual analysis",
    front:
      "NLMG, Miss Lucy, Ch 7: \"Your lives are {{c1::set out for you}}. You'll become adults... and before you're even middle-aged, you'll start to {{c2::donate your vital organs}}.\"",
    back: "Declarative future tense — a grammar of inevitability. The one word that lies is \"donate\", which implies a gift that could have been refused.",
  },
  {
    type: "cloze",
    strand: "Language and textual analysis",
    front:
      "NLMG, Miss Emily, Ch 22: \"We took away your art because we thought it would {{c1::reveal your souls}}. Or to put it more finely, we did it to {{c2::prove you had souls at all}}.\"",
    back: "The self-correction is the cruelty — she calmly refines her sentence into something far worse and doesn't notice.",
  },
  {
    type: "cloze",
    strand: "Language and textual analysis",
    front:
      "NLMG, Madame, Ch 22: \"I saw a new world coming rapidly. More {{c1::scientific, efficient}}, yes. More cures for the old sicknesses. Very good. But a {{c2::harsh, cruel}} world. And I saw a little girl, her eyes tightly closed, holding to her breast {{c3::the old kind world}}, one that she knew in her heart could not remain, and she was holding it and pleading, {{c4::never to let her go}}.\"",
    back: "Where the title comes from — and it is reassigned. Kathy thought she was holding a baby; Madame saw an allegory.",
  },
  {
    type: "cloze",
    strand: "Language and textual analysis",
    front:
      "NLMG, Tommy, Ch 23: \"I keep thinking about this river somewhere, with the water moving really fast. And these two people in the water, trying to hold onto each other, holding on as hard as they can, but in the end it's just too much. The {{c1::current's too strong}}. They've got to {{c2::let go, drift apart}}.\"",
    back: "A current is impersonal and nobody's fault. Tommy describes an organised system of killing as though it were weather.",
  },
  {
    type: "cloze",
    strand: "Language and textual analysis",
    front:
      "NLMG, final lines, Ch 23: \"The fantasy never got beyond that — {{c1::I didn't let it}} — and though the tears rolled down my face, I wasn't sobbing or out of control. I just waited a bit, then turned back to the car, to drive off to {{c2::wherever it was I was supposed to be}}.\"",
    back: "Self-censorship in the punctuation, then a return to obedience. The novel withholds catharsis so the reader supplies the anger Kathy won't.",
  },
];

// ---------------------------------------------------------------------------
// Layer 2 — analysis. What does it mean, and why does it work?
//
// This layer is the 6-mark criterion ("analysis of the writer's choices"). Every
// back is written as meaning + mechanism, in that order, because that is the
// order the sentence needs to come out in during the exam.
// ---------------------------------------------------------------------------
const ANALYSIS: CardSpec[] = [
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — \"My name is Kathy H. I'm thirty-one years old, and I've been a carer now for over eleven years.\"\n\nWhat does it mean, and why does it work?",
    back:
      "MEANS: Kathy introduces herself as a job title and a service record. The truncated surname is the tell — clones get a first name and an initial, no family, no lineage.\n\n" +
      "WORKS: First-person retrospective narration in a flat administrative register normalises horror by refusing to mark it as horror. Ishiguro withholds the word \"clone\" entirely, so the reader accepts the world on its terms before understanding it — the opening performs on us the same managed ignorance the students live in.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — \"you've been told and not told\"\n\nWhat does it mean, and why does it work?",
    back:
      "MEANS: The students technically know they will donate but have never been allowed to understand it. Nobody lied; the truth was issued in a form too diluted to act on.\n\n" +
      "WORKS: The novel's thesis compressed into a five-word antithesis. Miss Lucy is the only guardian who breaks the euphemistic register — and she is removed for it, which shows the half-knowledge is policy, not accident.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — \"you'll start to donate your vital organs\"\n\nWhy is the verb \"donate\" the thing to analyse?",
    back:
      "\"Donate\" implies a gift freely given by someone who could have refused. Neither is true. It is the one word in an otherwise brutally factual sentence that lies, and pointing at it shows you analysing diction rather than retelling plot.\n\n" +
      "Pair it with \"complete\" (for dying) and \"carer\"/\"donor\": the students' whole vocabulary was issued to them, so ideology speaks through the narrator. They cannot protest because they were never given a language in which protest is sayable.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — \"we did it to prove you had souls at all\"\n\nWhat does it mean, and why does it work?",
    back:
      "MEANS: The Gallery was never about nurturing the students. Their art was evidence in an argument with the outside world about whether they counted as people at all.\n\n" +
      "WORKS: The self-correction (\"Or to put it more finely\") is the cruelty — Miss Emily calmly refines her sentence into something worse and doesn't notice. It is also a structural reversal: it retrospectively rewrites every earlier scene of children making pictures, forcing the reader to re-read the first half of the novel in their head.",
  },
  {
    type: "basic",
    strand: "Texts in contexts",
    front: "NLMG — Hailsham. What is the ethical point most students miss?",
    back:
      "Hailsham gave its students a better childhood. It never gave them a different fate.\n\n" +
      "The novel's sharpest point is kindness that operates WITHIN an atrocity and leaves the atrocity standing. Miss Emily and Madame are not villains — they are the best the system produced, and they still harvested children. This positions the reader to interrogate their own comfortable sympathy rather than simply enjoy it.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — Norfolk. Why is it significant? (Asked in 2024.)",
    back:
      "MEANS: Miss Emily's throwaway geography remark — Norfolk is \"something of a lost corner of England\" because it's hard to reach by road — is converted by the children into a private myth that Norfolk is where lost things end up.\n\n" +
      "WORKS: A motif seeded in Ch 6 and paid off twice: the replacement tape found there in Ch 15, and the final field in Ch 23. It shows students building an imaginative life out of scraps because real information is withheld. Their hope is made of a misunderstanding — and Ishiguro lets it come half-true, which is crueller than letting it fail.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — the Judy Bridgewater cassette (\"Songs After Dark\"). Why is it significant?",
    back:
      "MEANS: Kathy dances alone holding a pillow to the line \"never let me go\", privately inventing a fantasy of motherhood — the one future absolutely foreclosed to her, since the clones are sterile.\n\n" +
      "WORKS: A symbol operating on two levels that never meet — for Kathy a lost mother, for Madame watching from the doorway a lost world. It is lost and then recovered in Norfolk, making it the emblem of memory itself: the only thing Kathy gets to keep, and even that is a replacement copy, not the original.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — Madame's \"new world\" speech. What does it mean, and why does it work?",
    back:
      "MEANS: Madame's tears in the doorway were never pity for Kathy. Kathy was a symbol to her of a gentler world being replaced by an efficient one.\n\n" +
      "WORKS: The title emerges here and is retrospectively reassigned — Kathy thought she was holding a baby, Madame saw an allegory. That is dramatic irony sustained across two hundred pages. The syntax enacts the contrast: clipped efficient fragments (\"Very good.\") against one long unbroken clause of grief. And the devastating implication is that even the adult who wept for them could not see a child, only a metaphor.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — \"The main thing is, I kept you and Tommy apart.\"\n\nWhat does it mean, and why does it work?",
    back:
      "MEANS: Ruth's deathbed confession, and the closest the novel comes to a reckoning.\n\n" +
      "WORKS: Plain monosyllables set against an enormity — no rhetoric, which is what makes it land. It completes Ruth's characterisation retrospectively: years of cruelty reframed as terror of being left alone. Strong evidence for a friendship question, because it shows friendship here is inseparable from possession and fear.",
  },
  {
    type: "basic",
    strand: "Texts in contexts",
    front: "NLMG — the deferrals rumour. What is the top-band point to make about it?",
    back:
      "MEANS: The students believe a couple who can prove they are genuinely in love might have their donations postponed. Miss Emily confirms in Ch 22 that it never existed. It is the plot's engine — the thing that finally makes Kathy and Tommy act.\n\n" +
      "WORKS: Ishiguro grants hope precisely to show it changes nothing. But the detail that earns the top band: the students NEVER CONSIDER ESCAPE. Their most rebellious act is applying for an exemption within the rules. That measures how completely they have been formed — and invites the reader to ask what rules they have never thought to question.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — Tommy's river metaphor. What does it mean, and why does it work?",
    back:
      "MEANS: Tommy's explanation of why he and Kathy cannot stay together.\n\n" +
      "WORKS: An extended metaphor from the least articulate character in the book — Tommy communicates in tantrums, yet produces the novel's most eloquent image just before he completes. But a current is impersonal, natural, nobody's fault: he describes an organised system of killing as though it were weather. Even in grief he cannot locate blame. The metaphor is beautiful and it is also the final proof of how thoroughly he has been conditioned.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — the final lines. What does it mean, and why does it work?",
    back:
      "MEANS: At a Norfolk fence Kathy permits herself one imagined glimpse of Tommy on the horizon, then stops herself.\n\n" +
      "WORKS: Self-censorship dramatised in the punctuation — the dash cuts into her own sentence, and \"I didn't let it\" makes her the agent of her own restraint. The last clause returns her to obedience: \"wherever it was I was supposed to be\". The novel deliberately withholds catharsis, so the outrage the text refuses to supply is generated in the reader instead. Saying THAT is worth more than describing the scene.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — Tommy's screaming fits (Ch 1 and Ch 23). Why does the repetition matter?",
    back:
      "Structural symmetry that retrains the reader. In Ch 1 the tantrum is comic and the other children laugh. In Ch 23 the identical act is devastating — nothing about the act changed, only what we now know.\n\n" +
      "Ishiguro uses repetition to make the reader measure their own altered understanding. And Tommy's inarticulacy is the argument: when the only honest response to your life is a noise, the system has taken your language too.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — Kathy's constant hedging (\"I don't know how it was where you were\", \"maybe I'm remembering it wrong\"). What is the effect?",
    back:
      "Two effects at once.\n\n" +
      "INTIMACY AND IMPLICATION: \"where you were\" addresses the reader as though we are another clone, quietly enlisting us into her world.\n\n" +
      "TRAINED UNRELIABILITY: she is not deceptive, she is conditioned out of asserting anything. Memory is also the only property she owns, which is why she curates it so carefully — the telling is the one act of authorship available to her.",
  },
  {
    type: "basic",
    strand: "Language and textual analysis",
    front: "NLMG — \"possibles\". Why is the word itself the analysis?",
    back:
      "A \"possible\" is the person a clone was copied from, and the students search for theirs hoping to glimpse a future self. But a possible is precisely the one thing they can never have — a possibility.\n\n" +
      "When the Norfolk search collapses, Ruth's outburst about being modelled on society's discards exposes something worse than the system's contempt: the students have internalised it and rank themselves by it.",
  },
];

// ---------------------------------------------------------------------------
// Layer 3 — deployment. Given a question, which quote and what line of argument?
//
// This is the layer that usually doesn't exist in a quote bank, and it is the one
// that decides the mark. Knowing fifteen quotes is worth nothing in an 800-word
// essay if the selection takes ten minutes.
// ---------------------------------------------------------------------------
const DEPLOYMENT: CardSpec[] = [
  {
    type: "basic",
    strand: "Responding to and creating texts",
    front: "NLMG exam — the question is a CONCEPT question (\"How is the reader invited to view X?\"). What shape does the essay take?",
    back:
      "Thesis must be about POSITIONING — what the text wants the reader to conclude, and how it engineers that.\n\n" +
      "Three body paragraphs, each pairing one quote with one mechanism. Default reach: \"told and not told\" (control), the euphemisms donate/complete (language), the ending (withheld catharsis), Miss Emily's souls revelation (retrospective reversal).",
  },
  {
    type: "basic",
    strand: "Responding to and creating texts",
    front: "NLMG exam — the question is a SIGNIFICANCE question (\"Analyse the significance of X\"). What shape does the essay take?",
    back:
      "Thesis must argue X carries meaning BEYOND ITSELF, and the strongest structure is to track it across the novel.\n\n" +
      "Norfolk works three times (geography lesson → the tape in Ch 15 → the final field). The cassette works twice (Kathy's fantasy → Madame's). Showing a thing accumulate meaning means you are automatically writing about the writer's choices, which is the 6-mark criterion.",
  },
  {
    type: "basic",
    strand: "Responding to and creating texts",
    front: "NLMG exam — what is the single strongest move available with this text?",
    back:
      "Point out that Ishiguro does to the READER what the guardians do to the STUDENTS. He withholds, supplies partial information, and lets us settle into a comfortable half-knowledge — we are told and not told.\n\n" +
      "Almost any question can be answered through it, and it is an authoritative interpretation rather than a summary. That is precisely the difference between 3 and 6 on the knowledge criteria.",
  },
  {
    type: "basic",
    strand: "Responding to and creating texts",
    front: "NLMG exam — which questions have already been set on this text, and what does that tell you?",
    back:
      "2023: (a) what it means to be human, via the representation of the clones; (b) how the reader is invited to view Kathy's character.\n2024: (a) the concept of friendship; (b) the significance of Norfolk.\n\n" +
      "2026 is the text's FINAL year on the external list, and questions aren't repeated. Untouched ground: love and the deferrals, art and the Gallery, Hailsham, Ruth, Tommy, the guardians, memory, hope, the ending, the cassette.",
  },
  {
    type: "basic",
    strand: "Responding to and creating texts",
    front: "English EA — where do the marks for evidence actually sit, and what separates a 3 from a 5?",
    back:
      "\"Selection and synthesis\" is worth 5. Band 3 is \"provides relevant evidence... uses this in connection with arguments\". Band 5 is \"a well-considered selection... uses this EXPLICITLY to strengthen arguments\".\n\n" +
      "The difference is visible reasoning from the quote. Evidence sitting next to a claim scores 3; evidence you argue from scores 5. Separately, \"analysis of the writer's choices\" is worth 6 — that is the why-it-works half, and naming a device without its effect earns nothing.",
  },
  {
    type: "basic",
    strand: "Responding to and creating texts",
    front: "English EA — three rules for handling quotes under exam conditions.",
    back:
      "1. Short and embedded beats long and blocked. A quoted phrase inside your own sentence proves control; a four-line block quote burns word count and reads as padding.\n" +
      "2. One quote analysed properly beats five named. Feature-spotting is explicitly where marks get lost.\n" +
      "3. Know roughly where it sits. Not page numbers — \"in the closing chapter\", \"in Miss Lucy's outburst\". It shows you know the text's shape.",
  },
];

async function main() {
  const dry = process.argv.includes("--dry-run");
  const all = [...RECALL, ...ANALYSIS, ...DEPLOYMENT];

  const subject = await prisma.subject.findFirst({
    where: { userId: USER_ID, shortCode: "ENG" },
  });
  if (!subject) throw new Error("No ENG subject for user 'local'.");

  const topic = await prisma.topic.findFirst({
    where: {
      userId: USER_ID,
      unit: { number: 4, subjectId: subject.id },
      title: { contains: "Critical responses" },
    },
    include: { subtopics: true, lesson: true },
  });
  if (!topic) throw new Error("No ENG U4 'Critical responses to literary texts' topic.");

  const strandId = new Map(topic.subtopics.map((s) => [s.title, s.id]));
  for (const c of all) {
    if (!strandId.has(c.strand)) throw new Error(`No subtopic titled "${c.strand}" on that topic.`);
  }

  const existing = await prisma.card.count({
    where: { userId: USER_ID, topicId: topic.id, tags: { contains: TAG } },
  });

  console.log(`subject   : ${subject.shortCode} (${subject.id})`);
  console.log(`topic     : U4T${topic.number} ${topic.title}`);
  console.log(`lesson    : ${topic.lesson ? `${topic.lesson.markdown.length} chars` : "none"}`);
  console.log(`cards     : ${all.length} to write (${RECALL.length} recall · ${ANALYSIS.length} analysis · ${DEPLOYMENT.length} deployment)`);
  console.log(`            ${existing} already tagged "${TAG}" — these get replaced`);

  if (dry) {
    console.log("\nDRY RUN — nothing written.");
    await prisma.$disconnect();
    return;
  }

  // --- lesson append ---------------------------------------------------------
  const section = readFileSync(
    join(process.cwd(), "scripts", "content", "eng-u4t2-nlmg-quotes.md"),
    "utf-8",
  );
  const base = (topic.lesson?.markdown ?? "").split(MARKER)[0].trimEnd();
  const markdown = `${base}\n\n${MARKER}\n${section}`;

  if (topic.lesson) {
    await prisma.topicLesson.update({
      where: { topicId: topic.id },
      data: { markdown },
    });
  } else {
    throw new Error(
      "That topic has no lesson to append to. Generate or hand-author one first — " +
        "this script deliberately won't create a lesson that is only a quote bank.",
    );
  }
  console.log(`\nlesson    : ${base.length} -> ${markdown.length} chars (quote section appended)`);

  // --- cards -----------------------------------------------------------------
  const removed = await prisma.card.deleteMany({
    where: { userId: USER_ID, topicId: topic.id, tags: { contains: TAG } },
  });
  if (removed.count) console.log(`cards     : removed ${removed.count} previous "${TAG}" cards`);

  let written = 0;
  for (const c of all) {
    await prisma.card.create({
      data: {
        userId: USER_ID,
        subjectId: subject.id,
        topicId: topic.id,
        subtopicId: strandId.get(c.strand)!,
        cardType: c.type,
        front: c.front,
        back: c.back,
        extra: c.extra ?? null,
        tags: JSON.stringify([TAG, "ENG", "never-let-me-go"]),
      },
    });
    written++;
  }

  console.log(`cards     : wrote ${written}`);
  console.log("\nDone. Open the app -> English -> Unit 4 -> Critical responses to literary texts.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
