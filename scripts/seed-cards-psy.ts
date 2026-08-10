/**
 * Hand-authored complex_familiar and complex_unfamiliar cards for the seven
 * Psychology topics that still have none: Sensation and perception, Memory,
 * Learning (Unit 3), and Social psychology, Interpersonal processes,
 * Attitudes, Cross-cultural psychology (Unit 4).
 *
 * Psychology already has dense simple_familiar recall coverage from an
 * imported Anki deck (1,154 cards, all unbanded recall), and U3 T1 Brain
 * function already has complex-band cards from a prior pass. This script
 * fills the gap at the top end for the remaining seven topics: exam-style
 * multi-step questions (complex_familiar) and full scenario questions with a
 * marking guide (complex_unfamiliar), written by hand against the actual
 * syllabus wording pulled from the database.
 *
 * No AI provider is called anywhere in this file. Every front/back below is
 * literal data.
 *
 * Run:  npx tsx scripts/seed-cards-psy.ts [--write]
 *
 * Dry run by default; --write inserts. Idempotent — a card is skipped if a
 * card with the same `front` already exists in that topic, so re-running
 * never duplicates rows.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
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
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type Band = "complex_familiar" | "complex_unfamiliar";
type Card = { front: string; back: string; complexity: Band };
type TopicBlock = { unitNumber: number; topicTitle: string; cards: Card[] };

// ============================================================================
// PSYCHOLOGY
// ============================================================================
const PSY: TopicBlock[] = [
  {
    unitNumber: 3,
    topicTitle: "Sensation and perception",
    cards: [
      // ---- complex_familiar (12) ----
      {
        front:
          "Trace the pathway of visual processing from light entering the eye to conscious interpretation, naming the stage and structure involved at each step. (5 marks)",
        back:
          "1. Reception — light is focused by accessory structures (cornea, lens) onto the retina. 2. Transduction — photoreceptors (rods and cones) in the retina's receptive fields convert light energy into neural impulses. 3. Transmission — impulses travel via the optic nerve toward the central nervous system. 4. Preliminary processing — the thalamus receives and relays the visual signal, doing initial processing before passing it on. 5. Organisation and interpretation — the primary visual cortex organises the input into a coherent image and interprets its meaning. 1 mark per correctly named and ordered stage.",
        complexity: "complex_familiar",
      },
      {
        front:
          "Trace the pathway of auditory processing from a sound wave reaching the ear to conscious interpretation, naming the stage and structure involved at each step. (5 marks)",
        back:
          "1. Reception — accessory structures of the outer and middle ear (pinna, ear canal, eardrum, ossicles) collect and channel sound waves. 2. Transduction — sensory receptors (hair cells) in the receptive fields of the cochlea convert the mechanical sound wave into neural impulses. 3. Transmission — impulses travel via the acoustic (auditory) nerve toward the central nervous system. 4. Preliminary processing — the thalamus relays and does initial processing of the auditory signal. 5. Organisation and interpretation — the primary auditory cortex organises the input and interprets its meaning (e.g. as speech, music). 1 mark per correctly named and ordered stage.",
        complexity: "complex_familiar",
      },
      {
        front:
          "A row of separate dots is arranged so that it is perceived as one continuous curved line rather than a series of unconnected dots. Identify the Gestalt principle responsible, and explain the reasoning behind it. (3 marks)",
        back:
          "The principle of continuity (1 mark). Continuity states that the visual system prefers to perceive a smooth, continuous form over abrupt or disconnected elements, so elements that are aligned along a smooth path are grouped together and perceived as a single continuous line rather than as separate dots (2 marks: statement of the rule + application to why the dots are grouped this way).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between monocular and binocular depth cues, and give one named example of each. (3 marks)",
        back:
          "Monocular cues require only one eye to perceive depth, e.g. relative size, interposition (overlap), or linear perspective — any one accepted (1 mark for definition + 1 mark for example). Binocular cues require both eyes working together to perceive depth, e.g. retinal disparity (the slightly different image each eye receives) or convergence (1 mark for definition + example, addressed against monocular).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why a person walking away from you is still perceived as the same size, even though the size of their image on your retina steadily shrinks. (3 marks)",
        back:
          "This is size constancy (1 mark). Although the retinal image shrinks as the person moves further away, the brain uses depth cues (e.g. the person's known/relative size and distance information) to judge that the object is further away, not smaller (1 mark). It combines this distance information with the retinal image size to maintain a stable perception of the object's true size, despite the changing retinal input (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "A student sees an ambiguous shape in the sky and, because they are anxious about an incoming storm, perceives it as a threatening cloud formation rather than a harmless shape. Explain how BOTH emotional state and motivation could each independently produce this perception. (4 marks)",
        back:
          "Emotional state — anxiety primes the perceptual system to notice and interpret ambiguous stimuli in ways consistent with the emotion being felt, so an anxious person is more likely to perceive an ambiguous shape as threatening (2 marks: name the factor + explain the mechanism). Motivation — if the student is motivated to justify cancelling outdoor plans, or is particularly vigilant for storm-related danger, this goal state biases their interpretation of ambiguous sensory information toward what is motivationally relevant (2 marks: name the factor + explain the mechanism).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between loudness, pitch and timbre, and identify which physical property of a sound wave underlies each. (3 marks)",
        back:
          "Loudness is the perceived intensity of a sound, determined by the amplitude of the sound wave (1 mark). Pitch is the perceived highness or lowness of a sound, determined by the frequency of the sound wave (1 mark). Timbre is the perceived quality or tone colour that lets us distinguish two sounds of the same pitch and loudness (e.g. a violin vs a flute playing the same note), determined by the complexity/waveform shape of the sound (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Research by de Bruine, Vredeveldt and van Koppen (2018) investigated cultural influences on visual perception in the context of eyewitness identification. Describe the general finding, and explain why it matters for the reliability of eyewitness testimony. (3 marks)",
        back:
          "The general finding is that people are typically less accurate at recognising and distinguishing faces from a race/ethnicity other than their own, compared with faces from their own race (the cross-race or own-race effect) (1 mark). This matters for eyewitness testimony because a witness identifying a perpetrator of a different race to themselves is more likely to make a perceptual error (e.g. misidentifying an innocent person), which has serious consequences in a legal setting (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Research by Patel and Demorest (2013) investigated cultural influences on auditory perception. Describe the general finding, referring to the role of cultural exposure. (3 marks)",
        back:
          "The general finding is that the music/sound structures a person is exposed to within their own culture shape how they perceive and process auditory patterns such as rhythm and pitch structure (1 mark). Listeners tend to perceive and process music from their own culture more easily/accurately than music using unfamiliar structural conventions from another culture (1 mark), showing that auditory perception of music is not purely biological but is shaped by cultural learning and exposure (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Compare the computational, constructivist and ecological approaches to explaining perception, in terms of their central claim about how perception occurs. (4 marks)",
        back:
          "The computational approach treats perception as an information-processing problem, where the brain builds up a representation of the world through a series of computational steps applied to sensory input (1 mark). The constructivist approach claims perception is actively built/constructed by the brain, which combines incoming sensory data with stored knowledge, expectations and past experience to interpret ambiguous input (1 mark). The ecological approach claims the environment provides rich, sufficient information for perception directly, with little need for the brain to add stored knowledge or construct an interpretation (1 mark). Addressed against each other: computational and constructivist approaches both involve internal processing of sensory input, but only the constructivist approach relies heavily on stored knowledge, while the ecological approach claims this internal construction is largely unnecessary because information is picked up directly from the environment (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "In Bugelski and Alampay's (1961) study, participants first shown a series of animal pictures were more likely to perceive an ambiguous figure as a rat, while participants first shown a series of human faces were more likely to perceive the same figure as a bald man. Explain how this demonstrates the role of frequency of prior exposure in developing a perceptual set. (3 marks)",
        back:
          "Both groups viewed the identical ambiguous stimulus, so the difference in what they perceived cannot be explained by the stimulus itself (1 mark). The only difference between groups was their recent prior exposure — one group's expectations were primed toward animals, the other toward faces (1 mark). This shows that repeated recent exposure to one category of stimulus creates a perceptual set (an expectation) that biases the interpretation of a later ambiguous stimulus toward that category (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why the sense of smell differs from vision and hearing in terms of both its mode of reception and its transmission pathway to the brain. (3 marks)",
        back:
          "Mode of reception — smell is received chemically, when odour molecules bind to olfactory receptors, unlike vision (light) and hearing (mechanical sound waves) which are received via physical energy (1 mark). Transmission pathway — smell is the only sense not transmitted via the thalamus; olfactory signals project more directly toward the olfactory bulb and limbic system before reaching the cortex, unlike visual and auditory signals which are relayed through the thalamus first (2 marks).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (7) ----
      {
        front:
          "A witness of one ethnicity misidentifies an innocent person of a different ethnicity as the perpetrator of a crime in a police lineup. Using research on cultural influences on visual perception, evaluate the reliability of cross-race eyewitness identification, and propose one procedural change police could make to reduce this source of error. (6 marks)",
        back:
          "Model response and marking points: (1) Research such as de Bruine, Vredeveldt and van Koppen (2018) has found that people are generally less accurate at recognising and distinguishing faces from a race other than their own — the cross-race (own-race) effect. (2) This is a perceptual phenomenon rooted in perceptual expertise: people have far more lifetime exposure to faces of their own race, so their visual system has developed finer-tuned discrimination for those faces than for other-race faces. (3) Applied to this scenario, the witness's error is consistent with a genuine, well-documented perceptual limitation rather than dishonesty or carelessness, meaning cross-race identifications carry a higher inherent risk of misidentification than same-race identifications. (4) Judgement — cross-race eyewitness identification should be treated as less reliable evidence than same-race identification and should not be relied upon as the sole basis for a conviction. (5) Procedural change — e.g. using a double-blind lineup procedure (where the administering officer does not know who the suspect is) to remove the chance of unintentional cueing, or informing juries explicitly of the documented cross-race effect so identification evidence is weighed appropriately. (6) The suggested change is explicitly linked back to reducing the specific perceptual error identified, not just a generic 'improve procedure' answer. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Design an experiment, following the logic of Bugelski and Alampay (1961), to test whether prior exposure to a category of images creates a perceptual set that biases interpretation of an ambiguous figure. State the independent variable, dependent variable, procedure and the result that would support your hypothesis. (6 marks)",
        back:
          "Model response and marking points: (1) Independent variable — the category of images participants are shown immediately before viewing the ambiguous figure (e.g. Group A shown images of birds, Group B shown images of dogs). (2) Dependent variable — what participants report seeing in the ambiguous figure (e.g. classified as 'bird-like' or 'dog-like' interpretation). (3) Procedure — randomly allocate participants to Group A or Group B, present the relevant priming images for a fixed, equal exposure time, then present the identical ambiguous figure to both groups and record their first interpretation. (4) Control — both groups must be shown the exact same ambiguous figure and given identical instructions, and exposure conditions (time, number of images) must be equal to isolate priming category as the only manipulated variable. (5) Predicted result supporting the hypothesis — Group A (bird-primed) interpret the ambiguous figure as bird-like significantly more often than Group B, and Group B (dog-primed) interpret it as dog-like more often, mirroring the pattern found by Bugelski and Alampay. (6) This pattern would support the conclusion that recent prior exposure creates a perceptual set that biases interpretation of ambiguous sensory information. 1 mark per developed element, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Explain how the ecological approach's claim that perception is direct differs from the constructivist approach's claim that perception is built from stored knowledge, using size or depth perception to illustrate the difference between the two approaches. (6 marks)",
        back:
          "Model response and marking points: (1) The constructivist approach claims perception involves the brain actively combining incoming sensory (retinal) information with stored knowledge, memory and expectations to construct an interpretation — for size/depth perception, this means the brain uses learned knowledge about typical object sizes and past experience with depth cues to infer distance and true size from an ambiguous retinal image. (2) The ecological approach claims the environment itself provides sufficiently rich information (e.g. optic flow, texture gradients) for perception to occur directly, without needing to consult stored knowledge — for depth perception, cues like texture gradient density are argued to specify distance directly as the information is picked up, with no additional inference step required. (3) The key point of difference: constructivism treats perception as an indirect, inference-based process reliant on stored knowledge, while the ecological approach treats it as a direct pickup of sufficient information already present in the sensory array. (4) Applied consistently to the chosen example (size or depth constancy) throughout, rather than stated only in the abstract. (5) A correct, specific named cue or mechanism used for each approach (e.g. stored knowledge of object size vs texture gradient/optic flow). (6) Overall coherence — the explanation shows genuine understanding of why the two approaches would predict a different underlying process for the same observed perceptual outcome. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A student writes: 'Depth perception relies only on binocular cues like retinal disparity, so a person who has lost the use of one eye cannot perceive depth or judge distance at all.' Identify the flaw in this claim, explain why it is incorrect, and correct it. (5 marks)",
        back:
          "Model response and marking points: (1) Flaw — the claim wrongly assumes depth perception depends entirely on binocular cues. (2) Explanation — monocular depth cues (such as relative size, interposition/overlap, linear perspective, and motion parallax) require only one eye and provide meaningful depth and distance information on their own. (3) A person with the use of only one eye loses access to binocular cues like retinal disparity and convergence, but can still use these monocular cues to perceive depth, meaning depth perception is reduced/less precise, not absent. (4) Correction — the accurate statement is that losing binocular vision reduces the precision of depth perception (particularly at close range, where binocular cues contribute most) but does not eliminate depth perception, because monocular cues remain available. (5) A specific, correctly named monocular cue is used in the corrected explanation, not just an assertion that 'other cues exist'. 1 mark per developed point, maximum 5.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Hudson's (1960) research using pictorial depth-cue tests found that participants from cultures with little exposure to Western pictorial artistic conventions were less able to perceive depth in 2D line drawings using pictorial depth cues than participants from Western cultures, even though both groups had normal vision. Explain what this finding suggests about whether the ability to perceive depth from 2D pictorial cues is innate or learned, and identify one limitation of drawing this conclusion from a single test format. (6 marks)",
        back:
          "Model response and marking points: (1) If depth perception from pictorial cues were entirely innate/hardwired, cultural background and exposure should not affect performance, since all participants had normal vision. (2) The fact that performance differed systematically by cultural exposure to Western pictorial conventions suggests that interpreting pictorial depth cues (such as interposition or relative size represented in a 2D drawing) is, at least partly, a learned perceptual skill rather than a purely innate one. (3) This does not mean depth perception overall is entirely learned — participants still perceive depth normally in the real, 3D world; it is specifically the ability to interpret depth cues represented in an unfamiliar 2D artistic convention that appears to require cultural learning/exposure. (4) Limitation — using only one test format (line drawings in one particular pictorial style) means the result may reflect unfamiliarity with that specific artistic convention rather than a general inability to use pictorial depth cues; different cultures may use their own pictorial conventions that were not tested, so the conclusion cannot be generalised confidently to 'pictorial depth perception' as a whole from this test alone. (5) A stated, reasoned position on innate vs learned (not simply 'both'), tied to the specific finding. (6) Overall coherence connecting the limitation back to why it weakens the strength of the conclusion. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A researcher claims: 'Because the computational, constructivist and ecological approaches to perception all attempt to explain the same phenomenon, only one of them can be correct.' Evaluate this claim, referring to what each approach actually proposes. (6 marks)",
        back:
          "Model response and marking points: (1) Each approach does address the same overall phenomenon (how perception occurs) but proposes a different emphasis rather than a strictly mutually exclusive mechanism: computational focuses on step-by-step information processing, constructivist focuses on the role of stored knowledge and inference, and ecological focuses on direct pickup of environmental information. (2) It is possible that different approaches better explain different perceptual situations — e.g. the ecological approach may better explain perception during active movement through a richly structured environment, while the constructivist approach may better explain perception of genuinely ambiguous or degraded stimuli where stored knowledge is needed to resolve ambiguity. (3) The claim assumes a single correct 'grand theory' must exist, but the effort to understand perception is genuinely ongoing, with several theoretical approaches being actively taken — implying this remains an open, actively investigated question rather than a settled either/or matter. (4) A judgement is required: the claim is not well supported, because approaches that emphasise different aspects/conditions of perception are not automatically mutually exclusive — they could each capture part of a more complete picture, or apply best under different conditions. (5) Supporting reasoning given for the judgement (rather than the judgement stated alone). (6) Overall coherence, using specific claims from each approach rather than referring to them only by name. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A patient has damage restricted to the primary auditory cortex, but their ears, acoustic nerve and thalamus are all functioning normally. Predict the perceptual deficit this patient would show, explain your prediction using the auditory processing pathway, and describe one behavioural test that could confirm it. (6 marks)",
        back:
          "Model response and marking points: (1) The auditory pathway involves reception (ear), transduction (cochlea), transmission (acoustic nerve), preliminary processing (thalamus) and organisation/interpretation (primary auditory cortex) — since only the final stage is damaged, the earlier stages should still function normally. (2) Prediction — the patient would likely still detect that a sound has occurred (since reception, transduction, transmission and thalamic relay are intact), but would have significant difficulty organising and interpreting what the sound means (e.g. recognising it as speech, a specific word, or a familiar noise). (3) This is because the primary auditory cortex is specifically responsible for organising and interpreting auditory input into a meaningful percept — its absence should not block detection but should impair meaningful interpretation. (4) Behavioural test — e.g. present the patient with a range of familiar environmental sounds (such as a dog barking, a phone ringing) and ask them to identify what each sound is, while checking separately (e.g. via a simple detection task, such as pressing a button whenever any sound is heard at all) that they can still detect that a sound occurred. (5) Predicted result confirming the prediction — the patient reliably detects sounds occurring but performs poorly at identifying/naming what the sounds are, showing a dissociation between detection and interpretation. (6) The response explicitly separates 'can detect a sound occurred' from 'can interpret what the sound means', consistent with the specific stage damaged. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
  {
    unitNumber: 3,
    topicTitle: "Memory",
    cards: [
      // ---- complex_familiar (12) ----
      {
        front:
          "Compare the multi-store model and the working memory model of memory in terms of how each describes short-term memory. (4 marks)",
        back:
          "The multi-store model treats short-term memory as a single, unitary store that briefly holds a limited amount of information before it is either lost or transferred to long-term memory (2 marks). The working memory model replaces this single store with several interacting components — the central executive, phonological loop, visuospatial sketchpad and episodic buffer — that each handle a different type of information (e.g. verbal vs visual) at the same time, rather than one general-purpose store (2 marks, addressed against the multi-store model).",
        complexity: "complex_familiar",
      },
      {
        front:
          "State the duration and capacity of (a) short-term memory and (b) long-term memory. (4 marks)",
        back:
          "(a) Short-term memory: duration of approximately 15–30 seconds without rehearsal (1 mark); capacity of approximately 7±2 items (1 mark). (b) Long-term memory: duration is potentially unlimited/lifelong (1 mark); capacity is considered to be effectively unlimited (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between implicit and explicit long-term memory, naming one subtype of each. (4 marks)",
        back:
          "Implicit memory is memory that is not consciously recalled and is expressed through performance rather than conscious recollection — subtypes include procedural memory (skills), priming, and classical conditioning (2 marks: definition + named subtype). Explicit memory is memory that is consciously and deliberately recalled — subtypes include episodic memory (personal events) and semantic memory (facts/general knowledge) (2 marks: definition + named subtype).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe the roles of the hippocampus, the neo-cortex and the amygdala in forming and storing explicit memories. (3 marks)",
        back:
          "The hippocampus plays a key role in forming/consolidating new explicit memories, acting as a temporary processing hub before information is transferred elsewhere (1 mark). The neo-cortex is where explicit memories are eventually stored more permanently, for long-term retention (1 mark). The amygdala contributes emotional significance/salience to explicit memories, which is part of why emotionally significant events tend to be remembered more strongly (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain the role of the cerebellum in forming implicit memories, using a procedural (skill-based) memory as an example. (3 marks)",
        back:
          "The cerebellum is involved in forming implicit memories, particularly procedural memories related to motor skills and coordination (1 mark). For example, learning to ride a bike involves the cerebellum coordinating and refining the motor sequences involved, and with repeated practice this skill becomes stored as an implicit, automatic procedural memory (1 mark). This is distinct from the explicit memory system (hippocampus, neo-cortex, amygdala), meaning damage to the cerebellum can impair skill learning while explicit memory remains intact (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Contrast recall, recognition and relearning as measures of memory retention. (3 marks)",
        back:
          "Recall requires retrieving information from memory with no or minimal cues (e.g. a short-answer question) — the most demanding measure (1 mark). Recognition requires identifying previously learned information when it is presented among other options (e.g. a multiple-choice question) — generally easier than recall because the correct answer is present as a cue (1 mark). Relearning measures how much faster material is learned a second time compared with the first, which can reveal retained memory even when recall and recognition both fail (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between encoding failure and retrieval failure as explanations for forgetting, and give an example of each. (4 marks)",
        back:
          "Encoding failure occurs when information was never properly stored into long-term memory in the first place — e.g. failing to recall the exact design on a coin you have seen thousands of times, because you never paid attention to encode the detail (2 marks: definition + example). Retrieval failure occurs when information was successfully stored but cannot currently be accessed, often due to insufficient retrieval cues — e.g. a 'tip-of-the-tongue' experience, where the memory is present but temporarily inaccessible (2 marks: definition + example).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how interference can cause forgetting, distinguishing between proactive and retroactive interference. (4 marks)",
        back:
          "Interference occurs when one memory disrupts the ability to recall another, related memory (1 mark). Proactive interference is when an older memory disrupts recall of newer information — e.g. difficulty remembering a new phone number because an old, well-learned number keeps coming to mind instead (1.5 marks). Retroactive interference is when a newer memory disrupts recall of older information — e.g. learning a new password makes it harder to recall a previous one (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe how chunking and the method of loci could each be used to improve memory for a list of unrelated items. (4 marks)",
        back:
          "Chunking involves grouping individual pieces of information into larger, meaningful units, which reduces the number of separate items that must be held in short-term memory (e.g. remembering a phone number as chunks of digits rather than as individual digits) (2 marks). The method of loci involves mentally associating each item to be remembered with a specific, familiar physical location along an imagined route, then mentally 'walking' the route at recall to retrieve each item in order via its associated location (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between spacing and interleaving as memory-improvement strategies. (3 marks)",
        back:
          "Spacing involves distributing study sessions on the same material across multiple, separated sessions over time rather than massing them into one session (e.g. studying a topic for 20 minutes on four separate days rather than 80 minutes in one sitting) (1.5 marks). Interleaving involves mixing the study of different topics or problem types within a single study session, rather than studying one topic in a block before moving to the next (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between elaborative rehearsal and maintenance rehearsal, and explain which produces stronger long-term retention. (3 marks)",
        back:
          "Maintenance rehearsal is simple repetition of information (e.g. repeating a number to yourself) with no attempt to connect it to existing knowledge (1 mark). Elaborative rehearsal involves actively connecting new information to existing knowledge or giving it deeper meaning (e.g. relating a new fact to something you already know) (1 mark). Elaborative rehearsal produces stronger long-term retention, consistent with the levels of processing model's claim that deeper, more meaningful processing produces more durable memories than shallow repetition alone (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "In a modified replication of Grant et al. (1998), participants who studied material in a quiet room and were later tested in a quiet room recalled more than participants who studied in a quiet room but were tested in a noisy room. Interpret this result with reference to context-dependent memory. (3 marks)",
        back:
          "This result supports context-dependent memory — the idea that retrieval is more successful when the environmental context at retrieval matches the environmental context present during encoding (1 mark). Because the mismatched (studied quiet/tested noisy) group recalled less than the matched (quiet/quiet) group, the environmental cues present during study appear to have become associated with the encoded material and act as useful retrieval cues only when reinstated at test (2 marks).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (7) ----
      {
        front:
          "A university student studies intensively for eight hours the night before an exam (massed practice) and performs poorly, forgetting much of the material within a week. A classmate studies the same total amount of time but spread across two weeks, and retains the material far longer. Using memory-improvement strategies, explain why the second approach produced better long-term retention, and design a revised study plan for the first student using at least two named strategies. (7 marks)",
        back:
          "Model response and marking points: (1) The second student's approach reflects spacing — distributing study over time rather than massing it into one session — which is associated with stronger long-term retention than massed practice, partly because each new study session requires effortful retrieval of partially forgotten material, which strengthens the memory trace more than passive re-exposure. (2) Massed practice (the first student's approach) allows information to be held in short-term/working memory through sheer repetition within a short window, which can create an illusion of having learned the material well, without the deeper encoding needed for durable long-term storage. (3) A revised plan for the first student incorporating spacing — e.g. splitting the same eight hours across multiple sessions over the two weeks leading up to the exam, rather than the night before. (4) A second named strategy incorporated and correctly explained — e.g. interleaving different topics within each session rather than blocking one topic per session, OR elaborative rehearsal (connecting new material to existing knowledge) rather than simple repetition, OR the method of loci for list-based content. (5) The second strategy's benefit is explained specifically (not just named) — e.g. interleaving forces the retrieval process to discriminate between topics, which strengthens long-term retention compared with studying one block at a time. (6) The plan is coherent and directly addresses the weaknesses identified in the first student's original (massed, non-elaborative) approach. (7) Explicit use of the term 'long-term retention' or equivalent tied to the mechanism, not just 'better memory'. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A patient with damage to the hippocampus can still ride a bicycle and play piano pieces learned before their injury, and can even learn new physical skills through practice, but cannot recall any new personal events or facts learned since the injury. Explain this pattern of symptoms using the distinction between implicit and explicit memory and their underlying brain structures. (6 marks)",
        back:
          "Model response and marking points: (1) Explicit memory (episodic and semantic) relies heavily on the hippocampus (along with the neo-cortex and amygdala) for forming new memories, so hippocampal damage would be expected to impair the ability to form new explicit memories — consistent with the patient's inability to recall new personal events or facts. (2) Memories formed before the injury (such as previously learned piano pieces and cycling) may already be consolidated into long-term storage in the neo-cortex or, for skills, are implicit/procedural memories less dependent on the hippocampus — explaining why these are retained. (3) Implicit memory, particularly procedural memory for motor skills, relies more on structures such as the cerebellum rather than the hippocampus, which explains why the patient can still learn new physical skills through practice despite the hippocampal damage. (4) This pattern is a double dissociation: explicit memory formation is impaired (new facts/events) while implicit memory formation remains intact (new skills), showing that these two memory systems rely on at least partially separate neural structures. (5) The response must explicitly name both memory systems (implicit/procedural via cerebellum, explicit via hippocampus) rather than describing the pattern only in everyday language. (6) Overall coherence linking each retained/impaired ability to the specific structure responsible. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A researcher wants to test whether depth of processing (following the levels of processing model) affects long-term recall, using a design similar to Hyde and Jenkins (1973). Design an experiment with a shallow-processing condition and a deep-processing condition, state the dependent variable, and predict the result that would support the levels of processing model. (7 marks)",
        back:
          "Model response and marking points: (1) Independent variable — depth of processing task performed on a word list, with two conditions. (2) Shallow-processing condition — participants judge a surface/physical feature of each word (e.g. whether it contains the letter 'e', or whether it is printed in capital or lowercase letters), which requires minimal semantic engagement. (3) Deep-processing condition — participants judge the meaning of each word (e.g. whether it fits into a given sentence, or whether it is pleasant or unpleasant), which requires semantic engagement. (4) Both groups must be shown the same word list, under an incidental-learning instruction (not told in advance that memory will be tested), to ensure processing depth — not conscious rehearsal — is what is being manipulated. (5) Dependent variable — the number of words correctly recalled (or recognised) on a later, surprise memory test. (6) Predicted result — the deep-processing group recalls significantly more words than the shallow-processing group. (7) This predicted pattern would support the levels of processing model because it shows that how information is processed (depth of meaning engaged), not simply intentional rehearsal, determines how well it is retained in long-term memory. 1 mark per developed element, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A defence lawyer argues that because their client's confession was obtained after a long police interview, retroactive interference could explain any inaccuracies in the client's account of events from before the interview. Evaluate this argument, referring to what retroactive interference actually predicts, and state one limitation of using this explanation with confidence in a real legal case. (6 marks)",
        back:
          "Model response and marking points: (1) Retroactive interference occurs when newer learning disrupts the recall of older information — so it is a legitimate possible mechanism if new information encountered during the interview genuinely conflicted with or overwrote details of the earlier, original event memory. (2) This makes the argument theoretically plausible: extensive, detailed questioning during a long interview could introduce new information (e.g. suggested details, leading questions) that interferes with the original memory of events. (3) However, retroactive interference specifically requires that the interfering (newer) information be similar to and disruptive of the original memory content — simply having a long interview does not automatically mean interference occurred; the specific content of the interview would need to be examined. (4) Limitation — in a real case, it is very difficult to prove that interference (rather than simple forgetting, deliberate deception, or genuine accurate memory) explains a specific inaccuracy, because there is no way to directly observe what was originally encoded versus what was later altered. (5) A stated judgement — the argument is plausible in principle but cannot be confidently applied to this specific case without more direct evidence of what interfering information was introduced during the interview. (6) Reasoning explicitly supports the judgement rather than asserting it alone. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A café owner notices that regular customers seem to remember their usual order better when they order it in the same café rather than over the phone. Using context-dependent memory (following the logic of Grant et al. 1998), explain this observation, and describe how you would test it as a controlled experiment. (6 marks)",
        back:
          "Model response and marking points: (1) Context-dependent memory predicts that retrieval is easier when the physical/environmental context present at encoding is reinstated at retrieval, because contextual cues become associated with the encoded memory. (2) Applied here — regular customers likely originally formed the memory of their usual order while physically in the café (surrounded by its sights, sounds and smells), so these contextual cues are associated with that memory; ordering over the phone removes those cues, making retrieval somewhat harder or slower. (3) Experimental design — randomly allocate participants to encode a list/set of information (e.g. a study list) either in one environment (Context A) or another distinct environment (Context B). (4) At test, split each group again so half are tested in the same context as encoding and half in a different context, creating four groups (a matched design). (5) Dependent variable — number of items correctly recalled. (6) Predicted result supporting the explanation — groups tested in the same context as encoding recall more than groups tested in a different context, regardless of which specific context (A or B) was used, showing that the matching itself — not either environment individually — drives the effect. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A study finds that older adults perform similarly to younger adults on a recognition memory test but significantly worse on a free recall test of the same material. Using the concepts of recall, recognition and age-related memory change, explain this pattern of results and evaluate what it suggests about the specific nature of memory changes associated with ageing. (6 marks)",
        back:
          "Model response and marking points: (1) Recognition requires identifying previously learned information among other options (cues are present), while recall requires retrieving information with minimal or no cues — recall is generally the more demanding retrieval process. (2) The pattern (similar recognition, worse recall) suggests that the information was successfully encoded and stored by older adults — since it can still be recognised — ruling out a general failure to encode or store the material. (3) This points toward the age-related change being specifically a difficulty with retrieval processes that operate without external cues, rather than a general decline in memory storage capacity. (4) This is consistent with the concept that some age-related memory changes affect specific processes (retrieval without cues) rather than memory as a single, uniform system that simply declines evenly with age. (5) Evaluation/judgement — the finding supports a more precise, nuanced view of age-related memory change (retrieval-specific difficulty) rather than a simple, blanket claim that 'memory gets worse with age', which the recognition data would contradict if taken as a whole-system decline. (6) Reasoning explicitly ties the recall/recognition distinction to the conclusion about ageing, rather than treating them as separate facts. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A student memorises a shopping list of 20 unrelated items using rote repetition (maintenance rehearsal) alone and recalls only 6 items a week later. Devise an improved study strategy for this student that combines at least TWO named memory-improvement techniques from the syllabus, and justify why each chosen technique should improve on the original result. (6 marks)",
        back:
          "Model response and marking points: (1) Identification that rote repetition is maintenance rehearsal, which produces relatively shallow processing and weaker long-term retention compared with strategies that engage deeper or more organised processing. (2) First technique named and applied — e.g. chunking, grouping the 20 items into smaller meaningful categories (e.g. by type of food) to reduce the effective number of units to be remembered. (3) Justification for technique 1 — chunking reduces the load on limited short-term/working memory capacity and creates organisational structure that aids later retrieval. (4) Second technique named and applied — e.g. the method of loci, associating each item with a location along a familiar mental route, OR elaborative rehearsal, actively linking each item to existing knowledge or forming vivid associations between items. (5) Justification for technique 2 — e.g. the method of loci provides a strong, ordered retrieval structure (the route) that recall alone lacks, while elaborative rehearsal creates deeper, more meaningfully connected encoding than simple repetition, both associated with stronger long-term retention than maintenance rehearsal. (6) A coherent combined strategy is described (not just two techniques listed separately) with a stated expectation that recall would improve beyond the original 6/20. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
  {
    unitNumber: 3,
    topicTitle: "Learning",
    cards: [
      // ---- complex_familiar (12) ----
      {
        front:
          "Compare classical conditioning, operant conditioning and social learning theory in terms of the underlying psychological perspective each is based on. (4 marks)",
        back:
          "Classical conditioning and operant conditioning are both grounded in behaviourism, which explains learning purely in terms of observable stimulus–response associations without reference to internal mental states (2 marks). Social learning theory extends beyond strict behaviourism by incorporating social and cognitive psychology — it argues learning can occur through observing others (modelling), which requires cognitive processes such as attention and memory that pure behaviourism does not account for (2 marks, addressed against the other two).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Using the terms unconditioned stimulus (UCS), unconditioned response (UCR), neutral stimulus (NS), conditioned stimulus (CS) and conditioned response (CR), describe how a dog could be classically conditioned to salivate at the sound of a bell. (5 marks)",
        back:
          "Before conditioning: food is the UCS, which naturally produces salivation, the UCR (1 mark); the bell is a neutral stimulus (NS), producing no salivation response (1 mark). During conditioning: the bell (NS) is repeatedly paired with food (UCS) (1 mark). After conditioning: the bell alone becomes a conditioned stimulus (CS), now producing salivation as a conditioned response (CR) (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between stimulus generalisation and stimulus discrimination, using an example from classical conditioning. (3 marks)",
        back:
          "Stimulus generalisation occurs when a conditioned response is also triggered by stimuli similar to the original conditioned stimulus — e.g. a dog conditioned to salivate at one bell tone also salivates at a similar-sounding tone (1.5 marks). Stimulus discrimination occurs when an organism learns to respond only to the specific conditioned stimulus and not to similar stimuli — e.g. the dog learns to salivate only at the exact original bell tone and not at other, distinguishably different tones (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between extinction and spontaneous recovery in classical conditioning. (3 marks)",
        back:
          "Extinction occurs when the conditioned stimulus is repeatedly presented without the unconditioned stimulus, causing the conditioned response to gradually weaken and disappear (1.5 marks). Spontaneous recovery occurs when, after a rest period following extinction, the conditioned response reappears (often weaker) when the conditioned stimulus is presented again, showing the original learning was not completely erased (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe the design and outcome of Watson and Rayner's 'Little Albert' experiment, and identify the ethical issue it raises. (4 marks)",
        back:
          "Watson and Rayner paired a loud, frightening noise (UCS, producing a fear UCR) with the presentation of a previously neutral white rat to a young child, 'Little Albert' (1 mark). After repeated pairings, Albert began to show a fear response (CR) to the rat alone, even without the noise, demonstrating a classically conditioned fear response (2 marks). Ethical issue — the study deliberately induced lasting fear/distress in a child who could not give informed consent, and no attempt was reportedly made to remove the conditioned fear afterward, which would not be considered ethically acceptable by modern research standards (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between positive and negative reinforcement, and between positive and negative punishment, in operant conditioning. Give one example of each. (4 marks)",
        back:
          "Positive reinforcement adds a pleasant stimulus to increase a behaviour (e.g. giving a treat for a trick) (1 mark). Negative reinforcement removes an unpleasant stimulus to increase a behaviour (e.g. a car's seatbelt alarm stopping once the belt is fastened) (1 mark). Positive punishment adds an unpleasant stimulus to decrease a behaviour (e.g. a reprimand for misbehaving) (1 mark). Negative punishment removes a pleasant stimulus to decrease a behaviour (e.g. taking away screen time) (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe how a Skinner box is used to study operant conditioning in animals. (3 marks)",
        back:
          "A Skinner box is a controlled chamber containing a mechanism (e.g. a lever or button) that an animal can operate, along with a means of delivering a reinforcer (e.g. a food pellet dispenser) and/or a punisher (e.g. a mild electric shock) (1 mark). The animal's spontaneous behaviour toward the mechanism is automatically recorded, and the researcher can systematically deliver reinforcement or punishment contingent on that behaviour (1 mark). This isolates the relationship between a specific behaviour and its consequence under controlled conditions, allowing researchers to study how reinforcement and punishment schedules shape behaviour over time (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between modelling and vicarious conditioning in social learning theory. (3 marks)",
        back:
          "Modelling refers to the process of learning a new behaviour by observing and later imitating another person (the model) performing it, without any reinforcement of the observer needing to occur (1.5 marks). Vicarious conditioning refers specifically to learning based on observing the consequences (reinforcement or punishment) experienced by the model, which increases or decreases the observer's own likelihood of performing that behaviour (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe Bandura and colleagues' 'Bobo doll' experiments, and explain what they demonstrated about vicarious conditioning. (4 marks)",
        back:
          "Children observed an adult model behaving either aggressively or non-aggressively toward an inflatable Bobo doll, in some versions with the model's aggression being rewarded, punished, or having no consequence shown (2 marks). Children who observed the model's aggression being rewarded (or unpunished) were more likely to later imitate the aggressive behaviour themselves than children who saw the model punished (2 marks), demonstrating that observing the consequences experienced by a model (vicarious conditioning) shapes an observer's own subsequent behaviour, even without directly experiencing reinforcement themselves.",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how classical conditioning theory could account for immune system responses being triggered by a previously neutral cue. (3 marks)",
        back:
          "In classical conditioning terms, a substance that naturally triggers an immune response (e.g. a drug affecting immune activity) acts as the UCS, and the associated immune change is the UCR (1 mark). If this UCS is repeatedly paired with a neutral stimulus (e.g. a particular taste, smell or environment present during administration), that neutral stimulus can become a CS (1 mark). Eventually, the CS alone (without the original substance) can trigger a conditioned immune response (CR), showing that immune responses — not just behaviour — can become classically conditioned (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how the principles of operant conditioning are applied in employment practices, using reinforcement as an example. (3 marks)",
        back:
          "Operant conditioning principles are applied in employment through reinforcement schedules designed to increase desired work behaviours (1 mark). For example, positive reinforcement is used when a workplace offers bonuses, praise or recognition contingent on employees meeting performance targets, increasing the likelihood employees will repeat those productive behaviours (1 mark). This mirrors the basic operant principle that behaviour followed by a pleasant consequence is more likely to be repeated in future (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how Bandura's (1977) development of social learning theory extended earlier behaviourist accounts of learning based on classical and operant conditioning. (3 marks)",
        back:
          "Classical and operant conditioning explain learning as resulting only from an organism's own direct experience of associations or consequences (1 mark). Bandura's social learning theory extended this by proposing that learning can also occur through observation of others (modelling) and the consequences experienced by those others (vicarious conditioning), without the observer needing to directly experience the stimulus or consequence themselves (1 mark). This introduced a cognitive element (attention, memory, motivation to imitate) into learning theory that pure behaviourist accounts of conditioning did not include (1 mark).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (7) ----
      {
        front:
          "A theme park replaces its loud, sudden ride-launch announcement sound with a gentler chime after receiving complaints that children became distressed at the mere sound of the announcement, even away from the ride. Using classical conditioning concepts, explain why the original announcement sound alone came to cause distress, and design an extinction procedure the park could use to reduce this learned fear in children who already associate the old sound with distress. (7 marks)",
        back:
          "Model response and marking points: (1) The sudden, jarring nature of the ride launch (e.g. a loud mechanical noise or a sudden physical sensation) would naturally act as an unconditioned stimulus (UCS), producing an unconditioned fear/distress response (UCR). (2) The announcement sound, originally a neutral stimulus, was repeatedly paired with this UCS (played immediately before each launch), so through classical conditioning it became a conditioned stimulus (CS), coming to trigger a conditioned fear response (CR) on its own. (3) This explains why children now show distress at the announcement sound alone, even away from the ride, since the CS–CR association has been learned independently of the original UCS. (4) Extinction procedure — repeatedly present the announcement sound (CS) without it being followed by the ride launch/original frightening event (UCS), so the association weakens over repeated trials. (5) A specific, practical way to implement this described — e.g. playing the (now-retired) announcement sound in a calm, safe, unrelated context multiple times with no ride event following it. (6) Caution/limitation noted — spontaneous recovery may occur, meaning the fear response could partially reappear after a break even once extinguished, so the procedure may need to be repeated. (7) The response correctly and consistently uses the terms UCS, UCR, CS, CR and extinction. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A social media platform's algorithm shows a teenager an increasing volume of videos depicting risky stunts performed by popular influencers, most of which receive huge numbers of admiring comments and views (an implied reward). The teenager subsequently attempts a similar risky stunt themselves. Using social learning theory, explain how vicarious conditioning could account for this behaviour, and evaluate one way social media platforms could reduce this risk without banning this type of content outright. (7 marks)",
        back:
          "Model response and marking points: (1) Social learning theory proposes that behaviour can be learned by observing a model and the consequences that model experiences, even without directly experiencing those consequences oneself (vicarious conditioning). (2) In this scenario, the influencers act as models, and the large numbers of admiring comments and views function as an observed positive consequence (a form of vicarious reinforcement) for performing the risky stunt. (3) Because the observed consequence appears rewarding rather than punishing, the teenager's own likelihood of imitating the modelled behaviour increases, consistent with Bandura and colleagues' Bobo doll findings that observed reinforcement of a model increases imitation. (4) The repeated, high-volume exposure via the algorithm increases the number of models and reinforcement instances observed, likely strengthening the vicarious conditioning effect further. (5) Evaluated solution — e.g. platforms could reduce the visible admiration signal by limiting visible comment/like counts on risky-stunt content, reducing the vicarious reinforcement cue, without removing the content itself. (6) Advantage of the solution stated (preserves free expression/content variety while weakening the specific reinforcement signal driving imitation) and one limitation acknowledged (e.g. determined viewers could still infer popularity from other cues, or seek the content elsewhere). (7) Judgement given on whether the proposed change would meaningfully reduce the risk, supported by reasoning. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A dog trainer wants a dog to stop jumping up on visitors. Design a behaviour-modification plan using operant conditioning that includes BOTH a reinforcement strategy to encourage an alternative behaviour AND a strategy to reduce the unwanted behaviour, and justify why using punishment alone would likely be less effective. (6 marks)",
        back:
          "Model response and marking points: (1) Reinforcement strategy — use positive reinforcement (e.g. a treat and praise) whenever the dog greets visitors with all four paws on the ground (an incompatible alternative behaviour), increasing the likelihood the dog repeats this desired behaviour instead of jumping. (2) Reduction strategy for the unwanted behaviour — e.g. use negative punishment by having visitors withdraw attention (turn away, stop engaging) immediately whenever the dog jumps up, removing the pleasant social attention the dog was seeking, which decreases the jumping behaviour over time. (3) Consistency requirement stated — every visitor must apply the same contingencies (reinforce calm greeting, withdraw attention for jumping) or the inconsistent schedule will slow learning. (4) Why punishment alone (e.g. positive punishment such as scolding for jumping) would likely be less effective — it may suppress the behaviour temporarily without teaching the dog what to do instead, meaning the dog could redirect to another unwanted behaviour seeking the same attention. (5) Punishment alone also risks creating an association between the punishment and the visitor/context rather than specifically the jumping behaviour if timing is imprecise, potentially causing unwanted fear responses (a classical conditioning side effect). (6) Overall coherence — the plan pairs reinforcing a desired alternative with reducing the unwanted behaviour, rather than relying on punishment in isolation. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A company deliberately pays quarterly bonuses at unpredictable times and in variable amounts, contingent on hitting sales targets. Employees report working consistently hard all quarter, compared with a previous fixed monthly bonus system, where effort tended to spike only just before each scheduled bonus. Explain this difference using operant conditioning reinforcement principles, and predict what would happen to employee effort if the variable bonus scheme were abruptly stopped altogether. (6 marks)",
        back:
          "Model response and marking points: (1) The new system reflects a variable schedule of reinforcement (reward delivered unpredictably, based on performance rather than fixed timing) — consistent with the general operant conditioning principle that variable reinforcement schedules produce steady, consistent response rates because the organism cannot predict exactly when the next reward will occur. (2) The old fixed monthly bonus reflects a fixed schedule of reinforcement, which typically produces a pattern where responding increases sharply just before the predictable reward and drops off just after, since the timing of reward is known/predictable, explaining the observed effort spikes. (3) The comparison directly explains the reported behaviour pattern: predictable reward timing produced predictable effort spikes, while unpredictable reward timing produced sustained effort, consistent with known effects of reinforcement schedule type on response pattern. (4) Prediction if the variable scheme were abruptly stopped — behaviour reinforced on a variable schedule is typically highly resistant to extinction, so employee effort would likely decline only slowly/gradually rather than dropping sharply straight away, compared with how quickly effort would likely have dropped under the old fixed scheme once stopped. (5) Reasoning for the prediction explicitly draws on the general operant conditioning principle that variable reinforcement produces greater resistance to extinction than fixed reinforcement. (6) The response correctly and consistently distinguishes 'schedule of reinforcement' from the presence/absence of reinforcement itself. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A public health campaign wants to reduce a harmful behaviour among teenagers (e.g. vaping) using social learning theory rather than direct punishment. Devise a media-based strategy that uses modelling and vicarious conditioning to discourage the behaviour, and justify why this approach could be more effective with a teenage audience than a strategy based on directly punishing teenagers who engage in the behaviour. (6 marks)",
        back:
          "Model response and marking points: (1) Strategy — produce media content showing relatable peer-aged models experiencing clearly negative social or physical consequences as a direct result of the behaviour (e.g. social embarrassment, physical symptoms, loss of respect from peers), so the audience vicariously observes an undesirable consequence being modelled. (2) This uses vicarious conditioning — teenagers who see the model experiencing negative consequences by the behaviour are, according to social learning theory, less likely to imitate that behaviour themselves, without needing to directly experience the negative consequence. (3) Choosing relatable peer models (rather than authority figures) is justified because social learning theory emphasises that observers are more likely to identify with and imitate/be influenced by models similar to themselves. (4) Comparative justification against direct punishment — directly punishing teenagers who engage in the behaviour only affects those already caught, after the fact, whereas a vicarious modelling campaign can influence behaviour proactively, before an individual teenager has tried the behaviour at all, by shaping attitudes and expectations in advance. (5) A further justification — direct punishment approaches with teenagers can sometimes provoke reactance/defiance, whereas identifying with a similar peer model showing a genuine negative consequence works through observational learning without triggering the same resistance. (6) Overall coherence, explicitly naming vicarious conditioning and modelling and applying both correctly to the campaign design. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A psychology student argues: 'Watson and Rayner's Little Albert study and Pavlov's original conditioning studies wouldn't be allowed today, so everything we currently know from them is scientifically worthless.' Evaluate this claim, distinguishing between the ethical acceptability of a study's methods and the scientific validity of its findings. (6 marks)",
        back:
          "Model response and marking points: (1) It is accurate that both studies would not meet modern ethical standards — Little Albert involved inducing lasting fear in a child without consent or debriefing/removal of the conditioned fear, and Pavlov's work involved significant animal welfare considerations by modern standards. (2) However, ethical acceptability of how a study was conducted is a separate question from the scientific validity of what it found — a study can be ethically unacceptable by today's standards while its findings are still empirically supported and later independently confirmed/replicated using more ethical methods. (3) In fact, the basic principles both studies demonstrated (classical conditioning of emotional/physiological responses) have since been replicated and extended using far more ethical procedures and remain foundational, well-supported findings in psychology. (4) Judgement — the claim conflates historical ethical failings with the scientific worth of the findings; the historical ethical issues are a legitimate and serious concern (and are part of why such studies shaped modern ethical guidelines), but they do not, on their own, invalidate the empirical conclusions. (5) Reasoning explicitly distinguishes 'ethically unacceptable methods' from 'scientifically invalid findings' rather than treating them as the same issue. (6) A specific reference to how such studies influenced modern ethical guidelines strengthens the evaluation. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A parenting blog claims: 'Rewarding a child every single time they tidy their room is the most effective way to make tidying a permanent habit.' Using operant conditioning reinforcement schedule principles, evaluate this claim and recommend an alternative schedule that would better maintain the behaviour once it is established. (6 marks)",
        back:
          "Model response and marking points: (1) Rewarding every instance of the behaviour is a continuous reinforcement schedule, which is genuinely effective for establishing a new behaviour quickly, because the strong, predictable link between behaviour and reward speeds up initial learning. (2) However, continuous reinforcement schedules generally produce behaviour that is relatively easy to extinguish — if the reward stops (e.g. a parent forgets, or stops rewarding once the behaviour seems established), the behaviour tends to decline relatively quickly because the child has learned to expect reward every time. (3) The claim that continuous reinforcement is 'the most effective way to make tidying a permanent habit' is therefore only partly supported — it is effective for establishing the behaviour but not necessarily for maintaining it long-term without ongoing reward. (4) Recommended alternative — once the behaviour is established, shift to a variable (intermittent) reinforcement schedule, rewarding tidying unpredictably rather than every time. (5) Justification — variable schedules are known to produce behaviour that is more resistant to extinction, because the child cannot predict exactly when reward will occur next and continues the behaviour in anticipation, making the habit more durable if rewards are later reduced or stopped altogether. (6) A stated overall judgement on the original claim (partly right, incomplete) supported by the continuous-vs-variable schedule reasoning. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
  {
    unitNumber: 4,
    topicTitle: "Social psychology",
    cards: [
      // ---- complex_familiar (12) ----
      {
        front:
          "Distinguish between primary and secondary socialisation, giving an example source of each. (3 marks)",
        back:
          "Primary socialisation is the earliest socialisation a person experiences, occurring within the family, where basic norms, values and behaviours are first learned (1.5 marks). Secondary socialisation occurs later and comes from outside the family, e.g. through media or schooling, and continues shaping norms and behaviour throughout life (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Compare social learning theory, cognitive developmental theory and biological theory as explanations of gender role formation, in terms of their central mechanism. (5 marks)",
        back:
          "Social learning theory explains gender role formation through observation, imitation and reinforcement of gendered behaviour modelled by others (1.5 marks). Cognitive developmental theory explains it as arising from a child's own active cognitive understanding/categorisation of gender, which develops in stages as the child matures (1.5 marks). Biological theory explains it with reference to biological factors, such as hormonal and genetic influences, that predispose certain behaviours or traits (1.5 marks). Addressed against each other: social learning emphasises environmental/social input, cognitive developmental emphasises the child's internal cognitive processing, and biological theory emphasises innate physiological factors (0.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how social norms, as described by Cialdini and colleagues (2006), can lead to behaviour change, distinguishing descriptive and injunctive norms. (4 marks)",
        back:
          "Social norms are the perceived rules or standards of a group about how members should or typically do behave, and they can change individual behaviour by creating pressure to conform to what is perceived as normal or expected (1 mark). Descriptive norms refer to perceptions of what others actually do (e.g. 'most people in this hotel reuse their towels'), which can change behaviour by making a behaviour seem common/normal (1.5 marks). Injunctive norms refer to perceptions of what is approved or disapproved of by others (e.g. what people should do), which can change behaviour through social approval/disapproval pressure (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe the procedure and key finding of Asch's (1955) conformity research. (4 marks)",
        back:
          "Participants were placed in a group with confederates and asked to publicly judge which of three comparison lines matched a standard line, a task with an objectively correct answer (2 marks). When confederates unanimously gave an obviously incorrect answer, a substantial proportion of genuine participants conformed to the incorrect majority answer at least once, despite the correct answer being clear, demonstrating the power of group social influence on individual judgement (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe the procedure and key finding of Milgram's (1963) obedience research. (4 marks)",
        back:
          "Participants were instructed by an authority figure (the experimenter) to administer what they believed were increasingly severe electric shocks to another person (a confederate, in reality unharmed) as part of a supposed learning task (2 marks). A surprisingly high proportion of participants continued administering shocks up to the maximum, apparently dangerous, level simply because they were instructed to by the authority figure, demonstrating the powerful effect of perceived legitimate authority on obedience (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe the procedure and key finding of Haney, Banks and Zimbardo's (1973) research on status, roles and power. (4 marks)",
        back:
          "Psychologically healthy participants were randomly assigned to play the role of 'guard' or 'prisoner' in a simulated prison environment for a planned two-week period (2 marks). Participants assigned to the guard role rapidly began behaving abusively and participants assigned to the prisoner role showed significant distress, to the extent the study was terminated early — demonstrating how situational factors (assigned roles, status and power) can powerfully shape behaviour, even overriding participants' personal dispositions (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between compliance, identification and internalisation as forms of group social influence. (3 marks)",
        back:
          "Compliance is publicly going along with a group's behaviour or request while privately disagreeing, often to gain approval or avoid rejection (1 mark). Identification is adopting a group's attitudes or behaviours because of a desire to be associated with that group or its members, without necessarily internalising the belief fully (1 mark). Internalisation is genuinely adopting a group's attitude or behaviour as one's own, so it persists even without the group present, because it aligns with one's own value system (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how status, roles and power can affect social behaviour, using an example. (3 marks)",
        back:
          "Status refers to a person's perceived social standing, roles are the expected behaviours associated with a social position, and power is the capacity to influence or control others' behaviour or outcomes (1 mark). Together these factors shape how a person behaves and how others behave toward them — e.g. a person given a role with high status and power (such as a supervisor) may adopt more authoritative behaviour, while those with lower status/power may show more deferential/compliant behaviour, purely because of the assigned social position rather than personal disposition (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why the presence of others can affect the way a person behaves, referring to conformity or obedience research. (3 marks)",
        back:
          "The presence of others introduces social influence — a person becomes aware of being observed or judged, or aware of a group norm or authority figure's expectations, which can change their behaviour from how they would act alone (1 mark). For example, Asch's research showed individuals conforming to an obviously incorrect group judgement purely because of the presence of a unanimous group, and Milgram's research showed individuals obeying instructions to act against their own moral judgement purely because of the presence of a perceived authority figure (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why social psychological research findings need to be interpreted in light of the cultural and historical context in which they were conducted. (3 marks)",
        back:
          "Social behaviour (such as conformity or obedience) can be influenced by the prevailing cultural norms, values and historical events of the time and place the research was conducted (1 mark). This means a finding obtained in one cultural/historical context (e.g. mid-20th-century USA) may not generalise directly to a different culture or era with different social norms, without further testing (1 mark). It also means researchers' own perspectives and assumptions, shaped by their cultural and historical context, could subtly influence how a study was designed or interpreted (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how demand characteristics could reduce the validity of a social psychology study such as the Stanford Prison Experiment. (3 marks)",
        back:
          "Demand characteristics are cues within a study that lead participants to guess the purpose of the research or how they are expected to behave (1 mark). If participants (e.g. those assigned the 'guard' role) picked up on cues about how they were expected to behave in that role and adjusted their behaviour to match this expectation, their behaviour may reflect what they believed the researchers wanted rather than a genuine, spontaneous response to the situation (1 mark). This would reduce the validity of the study's conclusions about the true effect of the situation/role itself on natural behaviour (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain, with reference to Le Texier's (2019) critique, one methodological issue raised about the Stanford Prison Experiment beyond its widely discussed ethical concerns. (3 marks)",
        back:
          "Le Texier's (2019) critique raised methodological/data collection issues with the study, including that the 'guards' were reportedly coached or influenced toward behaving harshly by the research team, rather than spontaneously developing this behaviour purely from the assigned role itself (2 marks). This raises a concern about the study's internal validity, since if the outcome was influenced by researcher demand rather than purely by the role/situation, the original interpretation (that the situation alone caused the abusive behaviour) may be less strongly supported by the data than originally claimed (1 mark).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (7) ----
      {
        front:
          "A high school introduces a peer-mentoring program using older students as role models to shape younger students' attitudes toward bullying, reasoning that 'if popular older students model kind behaviour, younger students will conform to it as a new social norm.' Using Cialdini et al.'s (2006) social norms research and conformity research (Asch, 1955), evaluate the likely effectiveness of this program, and identify one specific design feature that would strengthen it. (7 marks)",
        back:
          "Model response and marking points: (1) Cialdini et al.'s social norms research shows that behaviour can be changed by shifting perceptions of descriptive norms (what others actually do) and injunctive norms (what is approved of) — a peer-mentoring program that makes kind behaviour appear both common (descriptive) and approved (injunctive) among admired older students should, in principle, be able to shift younger students' behaviour toward that norm. (2) Asch's conformity research shows that people are more likely to conform to a group's behaviour or judgement, particularly a unanimous one, than to resist it — suggesting that seeing consistent, unified modelling of kind behaviour across multiple respected older students (rather than just one) would be more persuasive than a single isolated model. (3) A likely strength of the program — using popular/respected older students as models leverages both the social norms and conformity literature, since younger students are motivated to be associated with a high-status group (linking to identification as a form of social influence). (4) A limitation to weigh — Asch's research also shows conformity typically requires the influencing group to be reasonably sized and, importantly, unanimous; if only some peer mentors model the desired behaviour inconsistently, the 'norm' being communicated is weaker and conformity pressure is reduced. (5) Design feature to strengthen it — ensure consistency across all visible peer mentors (unanimity) in modelling and publicly endorsing the anti-bullying norm, since inconsistency would undermine the norm-based mechanism the program relies on. (6) A stated judgement on overall likely effectiveness (e.g. plausible in principle, provided modelling is consistent/unanimous) supported by the reasoning above. (7) Explicit, correct use of both descriptive/injunctive norms and conformity concepts, not just one. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A researcher wants to replicate Milgram's (1963) obedience paradigm today but must redesign the study to meet current ethical guidelines while still testing the same underlying question about obedience to authority. Devise an ethically acceptable modified design, and explain how each change addresses a specific ethical issue raised by the original study. (7 marks)",
        back:
          "Model response and marking points: (1) Ethical issue 1 — deception about the shocks being real/dangerous caused genuine psychological distress without informed consent to that specific element. Modification — use a design where participants are told upfront that shocks are simulated (or use immersive virtual reality with a virtual victim, a method that has been used in real ethical replications of Milgram's paradigm), removing the deception about danger while still creating a believable obedience scenario. (2) Ethical issue 2 — participants were placed under significant psychological stress with limited ability to easily withdraw. Modification — explicitly and repeatedly remind participants of their right to withdraw at any point without penalty, and monitor participants' distress levels throughout with a clear stopping rule. (3) Ethical issue 3 — lack of full debriefing/support for the distress experienced. Modification — provide a thorough debrief explaining the true nature of the study immediately afterward, along with access to support if needed. (4) Each modification is explicitly linked to the specific original ethical issue it addresses, not stated generically. (5) A consideration of whether the modified design can still meaningfully test obedience to authority despite the changes (e.g. using a virtual or clearly fictional harm scenario still allows the core manipulation — an authority figure instructing continued 'harmful' action — to be tested). (6) Acknowledgement that some loss of realism/validity is a trade-off for meeting ethical standards. (7) Overall coherence — the redesigned study remains recognisably testing the same core obedience question raised by the original. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A company assigns two new employees to job titles with identical actual duties, but one is called 'Team Leader' and given a private office, while the other is called 'Assistant' and given a shared desk. Within weeks, the 'Team Leader' behaves more assertively in meetings and the 'Assistant' behaves more deferentially, despite having equivalent authority on paper. Using research on status, roles and power (Haney, Banks & Zimbardo, 1973), explain this outcome, and evaluate whether this pattern would be expected to persist if the job titles were swapped. (6 marks)",
        back:
          "Model response and marking points: (1) Haney, Banks and Zimbardo's research demonstrated that assigned roles and associated status/power cues (like a title or role label) can powerfully shape behaviour, independent of a person's actual underlying disposition — participants assigned the 'guard' role behaved abusively and those assigned 'prisoner' behaved submissively, purely due to the assigned role. (2) Applied here — the job title and physical status markers (office vs shared desk) function similarly to an assigned role, cueing each employee (and their colleagues) to expect and enact status-consistent behaviour, even though the actual duties and authority are identical. (3) This explains why behaviour diverged despite equal formal authority — the behaviour is being driven by perceived status/role expectations, not by the real underlying job description. (4) Evaluation of whether the pattern would persist if titles were swapped — based on the logic of the original research (where behaviour followed the assigned role rather than the individual), the pattern would likely reverse: the employee newly given the 'Team Leader' title and office would likely begin behaving more assertively, and the employee newly labelled 'Assistant' more deferentially, since it is the role/status cue driving the behaviour rather than a fixed personal trait. (5) A stated, reasoned judgement about persistence/reversal (not simply an assertion). (6) The response explicitly connects the workplace scenario back to the mechanism identified in the original 1973 research (situational role/status cues override personal disposition), rather than describing the two situations only in parallel. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A comparison finds that Asch-style conformity rates vary considerably between cultures, being generally higher in collectivist cultures than in individualist cultures, and appear to have decreased in more recent decades. Using the concept that social psychological findings must be interpreted in cultural and historical context, explain why this pattern might occur and evaluate what it means for treating Asch's original (1955) conformity rate as a fixed, universal truth about human behaviour. (7 marks)",
        back:
          "Model response and marking points: (1) Conformity involves social influence, and the strength of social norms around group harmony vs individual independence differs systematically between cultures — collectivist cultures tend to place greater value on group harmony and social cohesion, which could make individuals more motivated to align publicly with group judgement even against their own perception. (2) Individualist cultures tend to place greater value on independent judgement and self-expression, which could reduce the perceived cost of disagreeing with a group, lowering conformity rates. (3) A decrease in conformity rates over recent decades could similarly reflect a broader historical/cultural shift in some societies toward valuing individual expression, changing social norms around whether public disagreement is socially costly. (4) This is a direct example of why social psychological findings need interpretation in their cultural/historical context — the observed conformity rate is not a fixed property of 'human nature' but is itself shaped by the surrounding social norms of the specific culture/era studied. (5) Evaluation — Asch's original 1955 finding should not be treated as a fixed, universal truth about human conformity, because subsequent research shows the effect size varies meaningfully with cultural and historical factors. (6) Supporting reasoning for the evaluation, drawing explicitly on both the cultural comparison and the historical trend data given. (7) Overall coherence — the response treats 'conformity exists as a genuine phenomenon' and 'the exact rate of conformity is culturally/historically variable' as two separate, both-true claims, rather than concluding the whole phenomenon is invalid. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A journalist writes an article claiming: 'The Stanford Prison Experiment proves that ordinary people will always become abusive if simply given power over others.' Evaluate this claim, referring to Le Texier's (2019) methodological critique. (6 marks)",
        back:
          "Model response and marking points: (1) The original interpretation of the study was that situational factors (assigned role, status and power) alone were sufficient to produce abusive behaviour in ordinary people, which is the basis for the journalist's claim. (2) Le Texier's (2019) critique raises the methodological issue that participants assigned the 'guard' role were reportedly coached or encouraged by the research team toward harsher behaviour, rather than the abusive behaviour emerging spontaneously purely from the situation itself. (3) This is a significant demand characteristics/researcher-influence concern — if guards' behaviour was shaped by what they believed the researchers wanted, the abusive behaviour cannot be attributed purely to 'being given power', undermining the strength of the original causal claim. (4) The claim also overgeneralises with the word 'always' — even setting the methodological critique aside, not every participant assigned the guard role behaved abusively in the original study, showing the effect was not universal even under the study's own conditions. (5) Judgement — the claim is not well supported; it overstates both the certainty ('always') and the underlying causal mechanism (situational power alone), given the specific data collection concerns raised by Le Texier. (6) Reasoning explicitly ties the judgement to both the coaching/demand-characteristics issue and the overgeneralisation issue, rather than relying on only one. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A local council wants to increase household recycling rates. Design a social-norms-based intervention using Cialdini et al.'s (2006) distinction between descriptive and injunctive norms, describing exactly what message each part of the intervention would communicate and predicting which is likely to have the stronger effect if council data shows recycling is currently uncommon in the target neighbourhood. (6 marks)",
        back:
          "Model response and marking points: (1) Descriptive norm message — communicate what residents actually do, e.g. 'X% of households on your street already recycle regularly,' intended to make the behaviour seem common/normal. (2) Injunctive norm message — communicate social approval of the behaviour, e.g. 'Your neighbours strongly approve of households that recycle,' intended to create social approval pressure regardless of how common the behaviour currently is. (3) Correct definitions of descriptive (what others do) and injunctive (what is approved/disapproved) norms are both required and correctly distinguished. (4) Prediction — because recycling is currently uncommon in this neighbourhood, a descriptive norm message stating the true (low) rate could backfire, inadvertently communicating that not recycling is actually the norm; an injunctive norm message (communicating that recycling is approved of, regardless of its current frequency) is therefore likely to have the stronger, safer effect in this specific context. (5) Reasoning for the prediction is explicitly tied to the low baseline rate given in the scenario, not stated as a general rule independent of the data provided. (6) Overall coherence — the intervention design and the prediction are consistent with each other (the recommended emphasis matches the reasoning given). 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A new manager is told by senior staff that a previous manager in the same role 'always got compliance, not real buy-in' from the team, and that as a result, staff reverted to old habits the moment that manager left. Using the distinction between compliance, identification and internalisation, explain why gaining genuine internalisation (rather than mere compliance) matters for lasting behaviour change, and suggest one leadership strategy more likely to produce internalisation. (6 marks)",
        back:
          "Model response and marking points: (1) Compliance involves staff publicly going along with instructions while privately disagreeing, often to avoid conflict or gain approval from the manager while the manager is present/watching. (2) Because compliance depends on the presence of the source of influence (here, the manager and their authority), the compliant behaviour is not expected to persist once that source is removed — consistent with staff reverting to old habits once the manager left. (3) Internalisation involves staff genuinely adopting the values or reasoning behind a behaviour as their own, meaning the behaviour would be expected to persist even without the original influencing manager present, because it now aligns with the staff members' own belief system. (4) This explains why gaining internalisation, not just compliance, matters for lasting behaviour change — only internalisation is not dependent on ongoing external presence/pressure to be maintained. (5) Suggested leadership strategy — e.g. involve staff in genuinely understanding and discussing the reasons behind a desired change (rather than simply issuing instructions), since research on social influence suggests that internalisation is more likely when people understand and personally agree with the underlying rationale, rather than merely being told what to do. (6) Justification for the strategy explicitly ties back to why it would be more likely to produce genuine belief change (internalisation) rather than surface-level compliance. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
  {
    unitNumber: 4,
    topicTitle: "Interpersonal processes",
    cards: [
      // ---- complex_familiar (12) ----
      {
        front:
          "Describe the procedure and key finding of Latané and Darley's (1969) study of bystander intervention. (4 marks)",
        back:
          "Participants believed they were part of a group discussion (via intercom) with either no other bystander, one other bystander, or several other bystanders present when one participant appeared to have a medical emergency (2 marks). The greater the number of perceived bystanders present, the less likely and slower any individual participant was to intervene/help — demonstrating the bystander effect, where the presence of others reduces the likelihood of an individual helping (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between the reciprocity principle and social responsibility as social factors that influence prosocial behaviour. (3 marks)",
        back:
          "The reciprocity principle is the tendency to help others who have previously helped us (or who we expect to help us in future), based on a sense of obligation to return a favour (1.5 marks). Social responsibility is a broader social norm that we should help others who genuinely need it, regardless of any expectation of future repayment (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Identify four personal characteristics that influence prosocial behaviour, and briefly state how each affects the likelihood of helping. (4 marks)",
        back:
          "Empathy — greater ability to understand/share another's emotional state increases likelihood of helping (1 mark). Mood — being in a positive mood generally increases helping, while some negative moods can also increase helping if relieving another's distress is expected to improve one's own mood (1 mark). Competence — feeling capable of providing effective help (e.g. relevant skill or training) increases the likelihood of intervening (1 mark). Altruism — a genuine, selfless motivation to help increases helping behaviour independent of self-benefit (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between diffusion of responsibility and audience inhibition as explanations for reduced bystander intervention in group settings. (3 marks)",
        back:
          "Diffusion of responsibility is the tendency for an individual to feel less personal responsibility to act when others are present, because responsibility feels shared/spread among the group (1.5 marks). Audience inhibition is the reluctance to act because of concern about being evaluated or embarrassed in front of others if the intervention turns out to be unnecessary or is performed incorrectly (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how a cost–benefit analysis could explain why a bystander decides not to intervene in an emergency, using a specific example. (3 marks)",
        back:
          "A cost-benefit analysis involves a bystander weighing the perceived costs of helping (e.g. personal risk, time, embarrassment) against the perceived costs of not helping (e.g. guilt) and the perceived benefits of helping (e.g. social approval, relieving the victim's distress) before deciding whether to act (2 marks). For example, a bystander may not intervene in a physical altercation because the perceived personal risk (cost) of getting hurt outweighs the perceived benefit of helping a stranger (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Using the general aggression model (GAM), explain how a single episode of provocation (e.g. an insult) could lead to an aggressive behavioural response. (4 marks)",
        back:
          "The situational input (the insult) interacts with the person's own internal factors (e.g. personality, prior beliefs about aggression) (1 mark). This combination influences the person's internal state — affecting their cognition (hostile thoughts), affect (anger) and physiological arousal (1 mark). This internal state feeds into an appraisal/decision process, where the person interprets the situation and decides how to respond (1 mark). If the appraisal results in an aggressive response being selected, the outcome is aggressive behaviour (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how the general aggression model (GAM) accounts for the difference between the effect of a single violent media episode and repeated, long-term exposure to violent media. (3 marks)",
        back:
          "A single episode of exposure primarily affects a person's immediate internal state (short-term increases in hostile cognition, arousal or hostile affect), producing only a temporary increase in aggression risk (1.5 marks). Repeated, long-term exposure can instead alter a person's underlying personality and knowledge structures (e.g. developing more hostile beliefs, attitudes and scripts about how to respond to situations generally), producing a more lasting change in aggressive tendencies rather than just a momentary spike (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe the biological and cultural explanations of attraction investigated by Buss et al. (1990), including one key finding. (4 marks)",
        back:
          "Biological (evolutionary) explanations propose that mate preferences reflect adaptive strategies for reproductive success, e.g. that certain preferred traits historically signalled fertility or resource-provision ability (2 marks). Cultural explanations propose that mate preferences are shaped by the specific social/cultural context a person is raised in (1 mark). Buss et al.'s (1990) large cross-cultural study found some mate preferences were relatively consistent across the many cultures studied (supporting a biological/universal component), while other preferences showed cultural variation (supporting a cultural component) (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Identify and describe four social/cognitive origins of attraction. (4 marks)",
        back:
          "Proximity — physical closeness/repeated exposure to a person increases the likelihood of attraction forming (1 mark). Reciprocity — we tend to be attracted to people who show that they are attracted to or like us (1 mark). Similarity — we tend to be attracted to people who share similar attitudes, values or interests to our own (1 mark). Self-disclosure — sharing personal information with another person, and them reciprocating, builds intimacy and increases attraction (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Using Rollie and Duck's phase model of relationship dissolution, describe the intrapsychic and dyadic phases, in order. (4 marks)",
        back:
          "The intrapsychic phase occurs first: an individual privately begins to focus on dissatisfaction with the relationship and their partner, without yet communicating this to the partner (2 marks). The dyadic phase follows: the dissatisfaction is now confronted and discussed directly between the two partners, as the relationship's problems become a shared, openly acknowledged issue between them (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Using Rollie and Duck's phase model of relationship dissolution, describe the social and grave-dressing phases, in order. (4 marks)",
        back:
          "The social phase follows the dyadic phase: the relationship's difficulties or ending become known to and discussed within the couple's wider social network (family, friends), who may become involved or take sides (2 marks). The grave-dressing phase follows: each partner constructs their own account/narrative of why the relationship ended, often to preserve their own social image and make sense of the breakup to themselves and others (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain one strength of the general aggression model (GAM) as an explanation of aggression, referring to its use of multiple theories and perspectives. (3 marks)",
        back:
          "A strength of the GAM (Anderson & Bushman, 2002) is that it integrates evidence and concepts from multiple prior theories and perspectives on aggression (e.g. biological, social learning, and cognitive approaches) into a single, unified framework, rather than relying on just one narrow explanation (2 marks). This gives it broader explanatory power, since it can account for how situational, personal, cognitive and physiological factors all interact to influence aggressive behaviour, rather than attributing aggression to only one type of cause (1 mark).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (7) ----
      {
        front:
          "A person collapses in a busy shopping centre. Using Latané and Darley's (1969) findings and the concepts of diffusion of responsibility and audience inhibition, predict whether a bystander is more or less likely to help if the shopping centre is nearly empty versus very crowded, and design a simple public awareness message that could counteract the predicted effect in the crowded scenario. (7 marks)",
        back:
          "Model response and marking points: (1) Latané and Darley's research found that the greater the number of perceived bystanders present, the less likely and slower any individual is to help — the bystander effect. (2) Prediction — in the nearly empty shopping centre, an individual bystander is more likely to help, because they perceive themselves as the sole or primary person available to act. (3) In the very crowded shopping centre, an individual bystander is less likely to help (or slower to help), because diffusion of responsibility reduces each individual's felt personal responsibility, and audience inhibition increases reluctance to act in front of many onlookers for fear of being judged if the intervention is unnecessary or mishandled. (4) Both mechanisms (diffusion of responsibility and audience inhibition) are explained and correctly applied to the crowded scenario, not just named. (5) Public awareness message design — e.g. a message that directly counters diffusion of responsibility by singling out individuals (such as 'If you see someone collapse, YOU call for help — don't assume someone else will'), which removes the ambiguity about who is responsible that normally allows diffusion of responsibility to operate. (6) Justification that the message specifically targets the mechanism identified (removing perceived shared/ambiguous responsibility), rather than being a generic 'be kind' message. (7) Overall coherence connecting the prediction, the mechanisms, and the counter-message design into one consistent explanation. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A video game company is criticised after a study finds regular players of a violent game show higher aggression on a lab measure immediately after a single play session, but a separate long-term study finds no significant difference in general hostility between long-term players and non-players. Using the general aggression model (GAM), reconcile these two seemingly conflicting findings. (6 marks)",
        back:
          "Model response and marking points: (1) The GAM distinguishes between the effect of a single episode of exposure (which primarily affects a person's immediate internal state — short-term increases in hostile cognition, affect and arousal) and the effect of repeated, long-term exposure (which can alter more stable personality and knowledge structures over time). (2) The short-term lab finding is consistent with a single-episode effect: playing the game immediately before the measure temporarily raised hostile cognition/arousal, producing a short-term increase in aggression on the lab measure taken right afterward. (3) The long-term finding (no difference in general hostility) does not necessarily contradict this — it suggests that for these particular long-term players, repeated exposure has not measurably altered their underlying, stable personality/aggression-related knowledge structures, even though each individual session may still produce a temporary spike. (4) These are not the same claim: a temporary post-session increase in aggression (single-episode effect) is a different phenomenon from a lasting change in general hostile personality traits (long-term effect), so finding one without the other is not a genuine contradiction within the GAM framework. (5) A stated reconciliation making this distinction explicit, rather than treating the two findings as simply inconsistent. (6) Correct, explicit use of GAM terminology (internal state, knowledge structures, single-episode vs long-term routes) throughout. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A dating app wants to redesign its matching algorithm to increase the likelihood of forming lasting attraction between matched users, based on the social and cognitive origins of attraction (proximity, reciprocity, similarity, self-disclosure). Since the app cannot provide true physical proximity before a first meeting, devise a feature that leverages the OTHER three origins of attraction, and justify each design choice. (7 marks)",
        back:
          "Model response and marking points: (1) Reciprocity-based feature — e.g. only reveal to User A that User B has 'liked' them once User A has also expressed interest, so both users experience mutual, reciprocated interest before matching, leveraging the finding that we are more attracted to people who show they like us. (2) Similarity-based feature — e.g. a compatibility-matching algorithm that surfaces users with overlapping stated interests, attitudes or values, leveraging the finding that attraction is more likely between people who perceive themselves as similar. (3) Self-disclosure-based feature — e.g. a structured prompt-based messaging feature that encourages users to gradually share increasingly personal information (rather than generic small talk), leveraging the finding that mutual self-disclosure builds intimacy and increases attraction. (4) Each feature is explicitly justified by reference to its specific, correctly explained origin of attraction, not merely labelled with the term. (5) An acknowledgement that proximity cannot be replicated before an in-person meeting, and a reasoned comment on whether this is likely to limit the app's overall effectiveness compared with in-person-formed attraction. (6) Overall coherence — three distinct, well-developed features corresponding to the three usable origins, not overlapping or vague. (7) The response explicitly states why physical proximity could not be substituted (it requires physical/repeated real-world exposure, which an app interface cannot directly provide before meeting). 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A couple's friends notice the couple 'taking sides' and discussing the relationship's problems in a group chat, several weeks after one partner first admitted privately to a friend that they had been unhappy for months. Using Rollie and Duck's phase model, identify which two phases these two events correspond to, in order, and predict what phase is likely to follow next, justifying your prediction. (6 marks)",
        back:
          "Model response and marking points: (1) The private admission to a friend of unhappiness 'for months', made before the partner confronted the other partner directly, corresponds to the intrapsychic phase — private, individual dissatisfaction not yet raised with the partner. (2) The friends 'taking sides' and discussing it in a group chat corresponds to the social phase — the relationship's difficulties are now known to and being processed within the couple's wider social network. (3) Correct ordering identified: the intrapsychic phase occurred before the social phase became visible (with the dyadic phase, direct confrontation between partners, implied to have occurred between them, even if not explicitly described in the scenario). (4) Predicted next phase — the grave-dressing phase, where each partner is expected to begin constructing their own account/narrative of why the relationship ended, often to preserve their social image. (5) Justification for the prediction — grave-dressing follows the social phase in Rollie and Duck's model once the relationship's ending becomes socially acknowledged, as partners then need to explain the ending to their own social circles. (6) Overall coherence — the two identified phases and the predicted next phase are placed in the correct sequence of the model. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A charity's fundraising letter tells a story about how the reader's specific past donation directly helped one named child, ending with a request for another donation. A second letter simply states general statistics about need. Using the reciprocity principle and personal characteristics that influence prosocial behaviour, explain why the first letter is likely to generate a higher donation response rate, and evaluate one ethical concern with deliberately using the reciprocity principle in this way. (6 marks)",
        back:
          "Model response and marking points: (1) Referencing the reader's specific past donation and its concrete impact can activate the reciprocity principle — even indirectly, by reminding the donor of their own prior prosocial act and its result, potentially creating a sense of ongoing obligation/consistency with their own past helping behaviour. (2) The named, specific child (rather than general statistics) is likely to increase empathy — a personal characteristic strongly linked to prosocial behaviour — because a specific, personalised story is more emotionally engaging than abstract statistics, which is a well-established driver of increased helping behaviour. (3) Both mechanisms (reciprocity-linked framing and empathy induction via personalisation) are explained and applied specifically to why letter one should outperform letter two. (4) Ethical concern — deliberately exploiting known psychological mechanisms (like reciprocity and empathy-inducing personal stories) to increase donations could be seen as manipulative, influencing behaviour through a psychological 'shortcut' rather than the donor's genuine, fully reasoned evaluation of the cause. (5) A stated, reasoned judgement on the ethical concern (e.g. it is a genuine but common concern in charitable fundraising, and is somewhat mitigated if the specific story told is true and the impact genuinely occurred). (6) Overall coherence linking the psychological explanation for effectiveness to the separate ethical evaluation, rather than only addressing one. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Two university students witness a peer being harassed online in a group chat with 40 members. Neither responds, even though both later say privately they were uncomfortable with what they saw. Using diffusion of responsibility, audience inhibition and cost-benefit analysis, explain why neither of the two intervened despite both being personally uncomfortable, and suggest one specific chat-platform design feature that could increase the likelihood of intervention in this kind of scenario. (7 marks)",
        back:
          "Model response and marking points: (1) Diffusion of responsibility — with 40 group members present, each individual bystander (including the two students) is likely to feel that responsibility to intervene is shared among many people, reducing their own personal felt obligation to be the one who acts. (2) Audience inhibition — intervening publicly in a large group chat, visible to all 40 members, carries a heightened risk of public embarrassment or backlash if the intervention is seen as unwelcome or handled awkwardly, which is likely to increase reluctance to act compared with a private setting. (3) Cost-benefit analysis — each student is likely weighing the perceived social cost of speaking up publicly (e.g. risking their own social standing, becoming a target themselves) against the benefit of helping the victim, and in a large, semi-public group, the perceived costs of visible intervention are higher than in a small or private setting. (4) All three mechanisms are explained and specifically applied to why neither acted despite both privately disagreeing with what they saw (i.e. personal disapproval alone was not sufficient to overcome these situational barriers). (5) Design feature suggestion — e.g. a private, low-visibility 'report' or 'flag' function that lets any single member act without the action being publicly visible to the other 39 members, which reduces audience inhibition (removes the public visibility cost) while still ensuring some individual action is taken. (6) Justification for why the feature specifically addresses audience inhibition and/or diffusion of responsibility (e.g. because a private report still requires the same individual decision to act, but removes the social/audience cost that increases reluctance). (7) Overall coherence integrating all three concepts and the design solution consistently. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Buss et al.'s (1990) research on mate preferences found some preferences to be broadly consistent across the many cultures studied, while others varied considerably between cultures. A student claims: 'This proves human attraction is entirely explained by evolutionary biology and cultural explanations are irrelevant.' Evaluate this claim. (6 marks)",
        back:
          "Model response and marking points: (1) The presence of preferences that are broadly consistent across many different cultures is evidence consistent with a biological/evolutionary explanation, since a preference appearing regardless of cultural context suggests it may not be purely culturally learned. (2) However, the same research also found preferences that did vary between cultures, which is evidence against a purely biological explanation for attraction as a whole, since a purely biological/universal mechanism would be expected to produce consistency across all measured preferences, not just some. (3) The most accurate interpretation of the data is that both biological and cultural explanations appear to contribute — some preferences look more universal/biological, others look more culturally shaped — rather than one explanation being sufficient alone. (4) The student's claim overstates the finding by ignoring the cultural variation the same study found, so it is not fully supported by the evidence described. (5) A stated judgement — the claim is not well supported; the research actually supports a combined biological-and-cultural explanation, not a purely biological one. (6) Reasoning explicitly uses both the consistent and the variable findings from the study to support the judgement, rather than citing only one. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
  {
    unitNumber: 4,
    topicTitle: "Attitudes",
    cards: [
      // ---- complex_familiar (12) ----
      {
        front:
          "Describe the tri-component model of attitude structure, naming each component. (3 marks)",
        back:
          "The tri-component model describes an attitude as having three components: the affective component (feelings/emotions toward the attitude object) (1 mark); the behavioural component (how a person acts or intends to act toward the attitude object) (1 mark); and the cognitive component (beliefs and thoughts about the attitude object) (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between implicit and explicit attitudes. (3 marks)",
        back:
          "Explicit attitudes are consciously held and can be deliberately reported or expressed by a person, and are typically measured through direct self-report (e.g. surveys) (1.5 marks). Implicit attitudes operate largely outside conscious awareness or control and can influence behaviour even when they contradict a person's consciously stated (explicit) attitude, typically measured through indirect methods (e.g. reaction-time based tests) (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how cognitive dissonance theory accounts for why people sometimes change their attitude to match a behaviour they have already performed. (4 marks)",
        back:
          "Cognitive dissonance theory proposes that a discrepancy between a person's attitudes, cognitions and behaviours creates psychological discomfort (dissonance) (1 mark). This discomfort creates a drive to reduce the inconsistency (1 mark). Because the behaviour has already occurred and cannot be undone, it is often easier to resolve the discomfort by changing the attitude or belief to become more consistent with the already-performed behaviour, rather than by changing the behaviour itself (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain social identity theory with reference to social categorisation, social identification and social comparison. (4 marks)",
        back:
          "Social categorisation is the process of sorting people (including oneself) into groups (e.g. 'us' and 'them') (1 mark). Social identification is the process of adopting the identity of a group one has categorised oneself as belonging to, taking on its norms and behaviours as part of one's own self-concept (1 mark). Social comparison is the process of comparing one's own group (the in-group) against other groups (out-groups), which tends to favour the in-group in order to maintain positive self-esteem derived from group membership (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between situational and dispositional attributions, giving an example of each for the same behaviour (a colleague arriving late to work). (4 marks)",
        back:
          "A situational attribution explains the behaviour with reference to external, circumstantial factors — e.g. 'they were late because of unexpected heavy traffic' (2 marks). A dispositional attribution explains the behaviour with reference to internal, personal characteristics — e.g. 'they were late because they are a disorganised person' (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain the fundamental attribution error, using the late-colleague example to illustrate it. (3 marks)",
        back:
          "The fundamental attribution error is the general tendency to over-emphasise dispositional (personal) explanations and under-emphasise situational (external) explanations when judging other people's behaviour (2 marks). For example, observers are more likely to conclude a late colleague is simply disorganised (dispositional) than to consider external factors like traffic (situational), even when situational factors may be the true cause (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between self-serving bias and confirmation bias, giving an example of each. (4 marks)",
        back:
          "Self-serving bias is the tendency to attribute one's own successes to internal/dispositional factors and one's own failures to external/situational factors — e.g. crediting a good exam mark to 'being smart' but blaming a poor mark on 'an unfair test' (2 marks). Confirmation bias is the tendency to seek out, interpret or remember information in a way that confirms one's existing beliefs, while ignoring or dismissing contradictory information — e.g. only noticing news stories that support a political view one already holds (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe stereotypes, and identify one advantage and one disadvantage of using them. (4 marks)",
        back:
          "A stereotype is a generalised belief about the characteristics or attributes typically associated with members of a particular social group (1 mark). Advantage — stereotypes can simplify social information processing, allowing quicker judgements/decisions when full information about an individual is not available (1.5 marks). Disadvantage — stereotypes can be inaccurate when applied to a specific individual, leading to unfair judgements or discrimination against people who do not actually fit the generalisation (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between scapegoating and direct experience/personal prejudice as explanations for the formation of prejudice. (3 marks)",
        back:
          "Scapegoating explains prejudice as arising when frustration or blame (often for something unrelated) is displaced onto a substitute target group, rather than the true cause (1.5 marks). Direct experience/personal prejudice explains prejudice as arising from an individual's own specific negative personal experience(s) with a member (or members) of a particular group, generalised to the whole group (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between group prejudice and the prejudiced personality as explanations for the formation of prejudice. (3 marks)",
        back:
          "Group prejudice explains prejudice as arising from group-level processes, such as in-group favouritism and out-group derogation that emerge from simply belonging to and identifying with a social group (1.5 marks). The prejudiced personality explanation proposes that prejudice can arise from stable individual personality characteristics/traits that make some individuals generally more prone to prejudiced attitudes across different target groups, regardless of specific group membership or experience (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe a modified experiment based on Bargh, Chen and Burrows' (1996) study (Experiment 2), and interpret what its results demonstrated about stereotype priming and behaviour. (4 marks)",
        back:
          "Participants were primed (e.g. through a word-based task) with words associated with a stereotype (such as words associated with being elderly), while a control group was not primed with these stereotype-related words (2 marks). Primed participants subsequently behaved in a way consistent with the primed stereotype (e.g. walking measurably more slowly afterward) compared with the unprimed control group (1 mark), demonstrating that exposure to stereotype-related concepts can unconsciously influence subsequent behaviour, even without the participant being aware of the influence (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Contrast prejudice and discrimination. (3 marks)",
        back:
          "Prejudice is an attitude — typically a negative pre-judgement, feeling or belief held about members of a particular group, without necessarily being acted upon (1.5 marks). Discrimination is behaviour — the actual unfair treatment of individuals based on their group membership, which is the behavioural expression (though not the guaranteed outcome) of prejudice (1.5 marks).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (7) ----
      {
        front:
          "A person who strongly identifies as an environmentalist is caught taking a long-haul international flight for a holiday. When challenged, they respond: 'One flight doesn't really matter in the scheme of things, and the airline offsets its carbon emissions anyway.' Using cognitive dissonance theory, explain what is happening psychologically, and evaluate whether this response is likely to lead to genuine attitude change or to genuine behaviour change. (6 marks)",
        back:
          "Model response and marking points: (1) The person's behaviour (flying, a high-carbon activity) is inconsistent with their stated environmentalist attitude, creating cognitive dissonance — the psychological discomfort arising from an inconsistency between attitude and behaviour. (2) The response given ('doesn't really matter', 'airline offsets emissions') is a dissonance-reduction strategy that works by minimising/reinterpreting the significance of the inconsistent behaviour, rather than by changing the underlying attitude or the future behaviour. (3) This differs from the classic dissonance-reduction pathway of actually shifting the attitude to become more consistent with the behaviour (e.g. genuinely becoming less committed to environmentalism) — here the person is instead reducing dissonance by minimising the behaviour's importance, while keeping the original attitude intact. (4) Evaluation — because the person has resolved the discomfort by minimising the behaviour's significance rather than by genuinely updating either their attitude or their future behaviour, this response is unlikely to produce lasting behaviour change (they have removed their psychological reason to change), and it does not represent genuine attitude change either, since the original environmentalist attitude has been left unchanged. (5) A stated, reasoned judgement addressing both whether attitude change and whether behaviour change are likely, not just one. (6) Overall coherence, correctly distinguishing minimisation as one of several possible dissonance-reduction strategies rather than treating it as equivalent to attitude change. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Following a difficult loss, a sports team's coach publicly states the loss was due to 'the referee's poor decisions' (an external factor), while an opposing fan attributes the same loss to 'that team just isn't very skilled' (an internal factor). Using self-serving bias and the fundamental attribution error, explain why the coach's and the fan's explanations for the same event differ so predictably. (6 marks)",
        back:
          "Model response and marking points: (1) The coach's attribution reflects self-serving bias — when explaining an outcome relevant to their own team/self (a failure/loss), people tend to attribute it to external, situational factors (the referee) rather than internal/dispositional ones, protecting their own or their team's self-image. (2) The fan's attribution reflects the fundamental attribution error — when explaining another group's/person's behaviour or outcome (a team they are not part of), observers tend to over-emphasise dispositional/internal explanations (lack of skill) and under-emphasise situational factors (such as the referee's decisions), even though the same situational factor is available as an explanation to both. (3) The key distinguishing feature explaining why the two differ predictably is whose outcome is being explained — the coach is explaining an outcome relevant to their own in-group/self (triggering self-serving bias), while the fan is explaining another group's outcome as an outside observer (triggering the fundamental attribution error). (4) Both biases push explanations in a self/in-group-protective direction, but operate through different specific mechanisms (protecting self-esteem for self-relevant outcomes vs a general observer bias toward dispositional explanations for others). (5) The response explicitly distinguishes the two biases rather than treating them as interchangeable. (6) Overall coherence linking each bias correctly to the correct person (coach = self-serving bias; fan = fundamental attribution error). 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A retail store's hiring manager reports never having any negative experiences with a particular ethnic group personally, yet holds negative stereotypes about that group, which they attribute to 'just knowing people who've had bad experiences with them' at work. Using social identity theory and the concept of group prejudice, explain how this manager could have formed prejudiced attitudes without direct personal negative experience. (6 marks)",
        back:
          "Model response and marking points: (1) Social identity theory proposes that people categorise themselves and others into groups (social categorisation), identify with their own group (social identification), and then engage in social comparison that tends to favour the in-group over out-groups, purely as a result of group membership rather than direct personal experience with individual out-group members. (2) This means simply belonging to an in-group (e.g. co-workers who share negative views) and identifying with that group can be sufficient to adopt the group's shared attitudes toward an out-group, through the social comparison process that favours the in-group's perspective — this is the mechanism behind group prejudice, distinct from direct experience/personal prejudice. (3) The manager's own account ('knowing people who've had bad experiences') describes exactly this — the prejudice is being absorbed through group identification and shared in-group narrative/norms, not through the manager's own direct negative encounters. (4) This shows group prejudice (arising from group membership and processes like social comparison) can operate as an independent pathway to forming prejudiced attitudes, separate from the direct experience/personal prejudice pathway. (5) The response clearly distinguishes the group-prejudice pathway from the direct-experience pathway, and correctly identifies which one applies to this manager. (6) Overall coherence, using social identity theory's three named processes (categorisation, identification, comparison) explicitly. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A researcher wants to test whether age-related stereotype priming affects walking speed, extending the logic of Bargh, Chen and Burrows' (1996) Experiment 2. Design a controlled replication, stating the independent variable, dependent variable, a key control, and the specific result pattern that would support the conclusion that unconscious stereotype activation (not conscious belief) drove any observed effect. (7 marks)",
        back:
          "Model response and marking points: (1) Independent variable — whether participants complete a word-based task containing words associated with the elderly stereotype (e.g. words like 'wrinkle', 'Florida', 'bingo') versus a control task with neutral, unrelated words. (2) Dependent variable — the time taken (or measured walking speed) for participants to walk down a corridor/hallway after completing the task. (3) Key control — participants must not be told the true purpose of the study (to avoid conscious/deliberate behaviour change), and are debriefed afterward and asked directly whether they noticed any connection between the word task and elderly-related concepts, to check whether priming occurred below conscious awareness. (4) Predicted result pattern supporting the conclusion — participants in the elderly-primed condition walk measurably more slowly than the control group, and when asked in debriefing, report NOT having consciously noticed the elderly-related theme of the words or connected it to their walking speed. (5) The requirement that participants report no conscious awareness of the connection is essential, because if participants did consciously notice the theme, the slower walking could instead be explained by deliberate/conscious behaviour change rather than genuine unconscious priming. (6) A correctly stated hypothesis linking the predicted result to the specific claim being tested (unconscious priming, not conscious belief). (7) Overall coherence — all elements (IV, DV, control, and the specific awareness-check result) work together to isolate unconscious priming as the mechanism. 1 mark per developed element, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A social media platform's news feed algorithm shows users more content that matches views they have previously engaged with, gradually narrowing the range of viewpoints each user sees. Using confirmation bias, explain how this algorithm design could strengthen a user's existing attitudes over time, and evaluate whether directly showing users more opposing viewpoints (rather than similar ones) would be an effective solution, referring to how confirmation bias operates. (7 marks)",
        back:
          "Model response and marking points: (1) Confirmation bias is the tendency to seek out, favour and remember information that confirms existing beliefs, while dismissing or discounting contradictory information. (2) The algorithm, by repeatedly showing content matching a user's past engagement (which reflects their existing attitudes), continuously supplies confirming information and reduces exposure to contradictory information, creating ideal conditions for confirmation bias to strengthen existing attitudes over time (a feedback loop between the bias and the algorithm's design). (3) Because confirmation bias also affects how contradictory information is processed (not just whether it is seen), simply exposing users to more opposing content is not guaranteed to work — confirmation bias predicts that users are likely to interpret, discount or dismiss information contradicting their existing view even when it is shown to them, rather than updating their attitude. (4) Evaluation — showing more opposing viewpoints may have limited effectiveness on its own because of this bias in how the information is processed, though it might still have some effect (e.g. increasing awareness that other views exist), so it is not necessarily a complete solution. (5) A stated, reasoned judgement about the likely effectiveness of the proposed solution (rather than assuming exposure alone fixes a processing bias). (6) A suggestion of what else might be needed alongside increased exposure (e.g. presenting opposing views in a way designed to reduce defensive dismissal, though this need not be fully developed for full marks). (7) Overall coherence linking confirmation bias's two effects (biased search/exposure and biased processing of contradictory information) to both the problem and the evaluation of the proposed solution. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A workplace anti-discrimination policy focuses entirely on training staff to recognise and reduce their prejudiced attitudes, but does not address discriminatory behaviours or workplace systems directly. Using the distinction between prejudice and discrimination, evaluate whether this policy design is likely to be sufficient to reduce actual discriminatory outcomes in the workplace. (6 marks)",
        back:
          "Model response and marking points: (1) Prejudice is an attitude (an internal belief/feeling), while discrimination is the behavioural/actionable expression of unfair treatment based on group membership — the two are related but distinct, and one does not automatically or completely predict the other. (2) A person can hold a reduced level of prejudiced attitude yet still, through habit, workplace systems, or unconscious/implicit processes, engage in discriminatory behaviour (e.g. biased hiring or promotion patterns embedded in existing workplace practices), meaning attitude-focused training alone would not necessarily change these behavioural/systemic outcomes. (3) Conversely, discriminatory outcomes can also arise from structural or procedural features of a workplace (e.g. biased selection criteria) that operate independently of any individual staff member's personal attitude level, and attitude training would not address these. (4) Evaluation — because prejudice (attitude) and discrimination (behaviour/outcome) are not identical, a policy that ONLY targets attitudes is unlikely to be sufficient on its own to reduce actual discriminatory outcomes; addressing behaviours and systems directly (e.g. reviewing hiring processes, behavioural accountability measures) would also be needed. (5) A stated, reasoned judgement (policy is likely insufficient alone) supported by the prejudice/discrimination distinction, not simply asserted. (6) Overall coherence — the evaluation explicitly separates the attitude level from the behavioural/systemic level throughout. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "Two employees make the same mistake at work. A manager attributes one employee's mistake to 'they're just careless' (dispositional) and the other employee's identical mistake to 'the instructions they were given were unclear' (situational). Using the fundamental attribution error and stereotypes, propose one plausible explanation for why the manager's attributions differed between the two employees for the identical mistake, and suggest one way the manager could reduce this bias in future evaluations. (6 marks)",
        back:
          "Model response and marking points: (1) The fundamental attribution error alone would predict a general tendency toward dispositional explanations for others' behaviour, but does not by itself explain why the manager attributed the same mistake differently between two different employees — this requires an additional factor. (2) A plausible explanation — a stereotype the manager holds about one employee's group (e.g. based on a category such as age, role, tenure or another group membership) could be biasing the attribution toward a dispositional (personal trait) explanation for that employee, while the absence of such a stereotype for the other employee allows a more situational explanation to be considered. (3) This shows how stereotypes can compound with the general fundamental attribution error tendency, applying a dispositional bias unevenly depending on which group a person is perceived to belong to, rather than applying evenly across all individuals. (4) Suggested bias-reduction strategy — e.g. the manager could use a standardised, criteria-based evaluation process applied identically to all employees for the same type of incident (reducing the opportunity for stereotype-driven differences in attribution to influence the judgement). (5) Justification for the strategy — a standardised process forces situational and dispositional factors to be considered using the same explicit criteria for every employee, reducing the chance that an unconscious stereotype about a specific employee's group unevenly shifts the attribution made. (6) Overall coherence — the explanation identifies stereotype-driven bias specifically as the additional factor needed beyond the general fundamental attribution error to explain the differential treatment. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
  {
    unitNumber: 4,
    topicTitle: "Cross-cultural psychology",
    cards: [
      // ---- complex_familiar (12) ----
      {
        front:
          "Using McMillan and Chavis's (1986) theory, describe the four elements that lead to a sense of community. (4 marks)",
        back:
          "Membership — a feeling of belonging to and being part of the group (1 mark). Influence — a sense that one matters to the group and can influence it, and that the group can influence its members (1 mark). Integration and fulfilment of needs — the belief that being part of the group will help meet one's needs (1 mark). Shared emotional connection — a shared history, experiences or emotional bond among members (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between individualist and collectivist cultures, in terms of how each typically values the individual relative to the group. (3 marks)",
        back:
          "Individualist cultures typically place greater value on personal autonomy, individual achievement and independence, with individual goals often prioritised over group goals (1.5 marks). Collectivist cultures typically place greater value on group harmony, interdependence and the needs/goals of the group (e.g. family, community), often prioritising group goals over individual ones (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Discriminate between multiculturalism and pluralism, on the basis of the presence or absence of a dominant culture. (3 marks)",
        back:
          "Pluralism describes a society where multiple cultural groups coexist, but typically alongside a recognised dominant/mainstream culture that other groups exist in relation to (1.5 marks). Multiculturalism describes a society where multiple cultural groups are recognised and valued more equally, without one culture being positioned as inherently dominant over the others (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Distinguish between culture shock, assimilation and marginalisation as psychological challenges associated with immigration and acculturation. (4 marks)",
        back:
          "Culture shock is the disorientation and psychological difficulty a person experiences when confronted with an unfamiliar culture, often after immigrating (1.3 marks). Assimilation is the process of adopting the values, behaviours and norms of the new/host culture, often while giving up aspects of the original culture (1.3 marks). Marginalisation is the experience of not fully identifying with, or being accepted by, either the original culture or the new host culture, resulting in a sense of exclusion from both (1.4 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how prejudice expressed as implicit and explicit racism can be a source of cultural conflict. (3 marks)",
        back:
          "Explicit racism involves consciously held and openly expressed prejudiced attitudes or discriminatory behaviour toward a cultural/racial group, which can directly create conflict through open hostility or discriminatory treatment (1.5 marks). Implicit racism involves unconscious biases that can still influence behaviour and decision-making (e.g. in hiring or policing) even without conscious intent, contributing to systemic disadvantage and ongoing tension between cultural groups, even when individuals do not believe themselves to hold racist views (1.5 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Describe the four conditions of intergroup contact identified as effective for reducing prejudice. (4 marks)",
        back:
          "Sustained contact — the contact between groups needs to occur over an extended period, not just a single brief encounter, to have a meaningful effect (1 mark). Superordinate goals — the groups need to be working toward a shared goal that requires cooperation from both groups to achieve (1 mark). Mutual interdependence — the groups need to genuinely depend on one another to succeed, rather than working independently alongside each other (1 mark). Equality of status — the contact needs to occur between individuals or groups of equal social status, rather than one group being in a position of authority over the other (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why the development of the sense-of-community theory (McMillan & Chavis, 1986) required drawing on a wide range of evidence from multiple disciplines. (3 marks)",
        back:
          "A sense of community is a complex psychological and social phenomenon involving individual psychological needs (e.g. belonging, influence), group/social dynamics (e.g. shared history, mutual influence) and broader sociological factors (e.g. community structure) (2 marks). No single narrow discipline or evidence source could capture all of these different dimensions, so developing a comprehensive theory required synthesising evidence and concepts from multiple areas of research (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why most psychological research findings on topics such as attraction, conformity or social identity may not be fully applicable outside the specific cultural context in which the original research was conducted. (3 marks)",
        back:
          "Much psychological research has historically been conducted in a specific cultural context — Western, educated, industrialised, rich and democratic (WEIRD) societies (1 mark). Because psychological processes such as attitudes, social norms and behaviour can be shaped by cultural values (e.g. individualism vs collectivism), findings obtained from participants in this specific cultural context may not generalise accurately to people from different cultural backgrounds with different norms and values (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why international collaboration is important when investigating cross-cultural psychological phenomena. (3 marks)",
        back:
          "Cross-cultural phenomena, by definition, require data and perspectives from multiple different cultural contexts to be properly understood, rather than being investigated using participants and researchers from only one culture (1 mark). International collaboration allows researchers with genuine cultural knowledge, access to appropriate participant populations, and locally relevant expertise from each culture studied to contribute, improving the validity and cultural appropriateness of the research (2 marks).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why it is inaccurate to treat Australian First Nations peoples as a single, homogenous cultural group. (3 marks)",
        back:
          "Although Australian First Nations peoples share some common experiences, such as the shared history of colonisation and settlement, they in fact represent many distinct cultural, language and community groups across Australia, each with their own specific traditions, languages and identities (2 marks). Treating them as a single homogenous group overlooks this genuine cultural diversity and can lead to inaccurate assumptions or generalisations that do not reflect the actual diversity of experience and culture within these communities (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain why the psychological challenges associated with colonisation and settlement for Australian First Nations peoples are considered ongoing, rather than only historical. (3 marks)",
        back:
          "The effects of colonisation and settlement (such as disruption to culture, land and community structures) have had consequences that continue to affect wellbeing, identity and community across current and subsequent generations, not just the generation directly affected historically (2 marks). This means the psychological and social challenges are not simply 'in the past' but continue to be experienced and require ongoing recognition and response in the present (1 mark).",
        complexity: "complex_familiar",
      },
      {
        front:
          "Explain how increasing intercultural understanding could help alleviate conflict resulting from cultural diversity, referring to the role of implicit or explicit racism. (3 marks)",
        back:
          "Increasing intercultural understanding involves people gaining accurate knowledge about, and meaningful exposure to, other cultural groups' values, norms and experiences (1 mark). This can help reduce both explicit racism, by challenging openly held prejudiced beliefs with accurate information and direct positive experience, and implicit racism, by increasing familiarity with other cultural groups, which is associated with reduced unconscious bias over time (2 marks).",
        complexity: "complex_familiar",
      },
      // ---- complex_unfamiliar (7) ----
      {
        front:
          "A city redevelops two previously separate ethnic-community neighbourhoods into one mixed suburb, but simply having residents living near each other does not appear to have reduced tensions after two years. Using McMillan and Chavis's (1986) elements of sense of community AND the conditions for effective intergroup contact, design a local council initiative that specifically addresses this, and justify why simple geographic proximity alone was insufficient. (7 marks)",
        back:
          "Model response and marking points: (1) Simple geographic proximity does not, on its own, meet the conditions identified as necessary for intergroup contact to reduce prejudice — sustained, meaningful contact, superordinate goals, mutual interdependence and equality of status — living nearby does not guarantee any of these are present. (2) Explanation for insufficiency — residents can live in close proximity while having minimal genuine interaction, no shared goals requiring cooperation, and no structured equal-status engagement, meaning none of the four effective-contact conditions are automatically satisfied just by redrawing suburb boundaries. (3) Initiative design incorporating superordinate goals and mutual interdependence — e.g. a joint community project (such as a shared community garden or local event) that requires genuine cooperation between residents from both original communities to succeed, rather than optional parallel participation. (4) Initiative design incorporating equality of status — ensure the initiative's organisation gives genuinely equal input/decision-making power to representatives from both original communities, rather than one group leading and the other simply attending. (5) Initiative design incorporating sustained contact — the initiative should be an ongoing, repeated activity (not a single one-off event) to build a real sense of community over time. (6) Link to McMillan and Chavis — the initiative is explicitly designed to build at least two of their four elements (e.g. shared emotional connection through repeated shared experience, and integration/fulfilment of needs through a project that benefits both groups) rather than relying on proximity to create a sense of community automatically. (7) Overall coherence — the justification explicitly explains why proximity alone fails to satisfy either framework, and the initiative is designed to specifically fill those gaps. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A workplace has staff from a highly individualist cultural background and staff from a highly collectivist cultural background, and management notices repeated friction during team performance reviews — individualist staff want to discuss personal achievements, while collectivist staff seem uncomfortable being singled out and prefer discussing team outcomes. Using the individualist/collectivist distinction, explain this friction, and design an alternative performance review process that accommodates both cultural orientations. (6 marks)",
        back:
          "Model response and marking points: (1) Individualist cultures typically value and are comfortable with individual recognition and achievement being highlighted, consistent with staff wanting to discuss personal achievements. (2) Collectivist cultures typically value group harmony and are less comfortable with being singled out individually, especially for praise that separates them from the group, consistent with the discomfort described. (3) The friction arises because a single review format (individual-achievement-focused) aligns well with one cultural orientation but creates genuine discomfort for the other, rather than either group being 'wrong' — it is a cultural values mismatch with the process design, not a performance issue. (4) Alternative process design — incorporate both an individual component (private, one-on-one discussion of personal achievement, for staff comfortable with this) AND a team-outcome component (recognition and discussion framed around collective/team achievement, for staff more comfortable with this framing). (5) Justification — offering both components (rather than only one) respects both cultural orientations rather than forcing all staff into a single culturally-specific format, addressing the specific source of friction identified. (6) Overall coherence — the proposed solution is explicitly linked back to accommodating both orientations rather than favouring one. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A recent immigrant reports feeling like they no longer fully belong to their culture of origin, but also do not feel accepted or fully part of their new host culture, despite genuinely trying to engage with both. Using the concepts of culture shock, assimilation and marginalisation, identify which specific acculturation experience this describes, explain why it differs from assimilation, and suggest one community-level intervention that could help. (6 marks)",
        back:
          "Model response and marking points: (1) This describes marginalisation — not fully identifying with, or being accepted by, either the original or the new host culture. (2) This differs from assimilation, which specifically involves successfully adopting the host culture's values and norms (even if this means giving up aspects of the original culture) — the immigrant here has NOT successfully integrated into the host culture (they report not feeling accepted), so this is not assimilation despite genuine effort to engage. (3) It also differs from simple culture shock, which describes the disorientation/difficulty of encountering an unfamiliar culture generally, rather than the specific ongoing state of not belonging fully to either culture. (4) A correct distinction is drawn between all three terms, with reasoning for why marginalisation specifically (not assimilation or mere culture shock) fits the description given. (5) Suggested intervention — e.g. a community program that creates a genuine 'bridging' space, such as a bicultural community group or mentorship connecting the person with others who share their origin culture and are established in the host culture, aimed at helping build a sense of belonging drawing on both cultural identities rather than requiring a full switch to one. (6) Justification for the intervention explicitly ties back to addressing the lack of acceptance/belonging in either culture, rather than being a generic support suggestion. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A national anti-racism campaign runs advertisements challenging openly stated racist beliefs but reports little change in discriminatory hiring rates measured through employment audits. Using the distinction between explicit and implicit racism, evaluate why the campaign may have had limited effect on hiring outcomes, and propose one different intervention more likely to reduce implicit bias specifically. (6 marks)",
        back:
          "Model response and marking points: (1) Explicit racism involves consciously held and openly expressed racist beliefs — a campaign directly challenging openly stated beliefs targets this form of racism. (2) Implicit racism involves unconscious biases that can still influence behaviour and decision-making (such as hiring decisions) even when a person does not consciously hold or express racist beliefs, and even genuinely believes themselves to be unbiased. (3) A campaign that only challenges conscious, openly stated beliefs would not necessarily address unconscious bias, because implicit racism can operate independently of a person's explicit, self-reported attitudes — someone could sincerely reject explicit racism in a survey while still showing biased behaviour in an unconscious decision-making context like hiring. (4) Evaluation — this explains why hiring outcomes (a behavioural measure likely influenced by implicit bias in quick decisions such as reviewing resumes) may show little change even if explicit attitude measures did improve, because the campaign targeted the wrong (explicit) level for that specific outcome. (5) Alternative intervention more likely to address implicit bias specifically — e.g. structural/procedural changes such as blind resume screening (removing identifying cultural/name information from applications before initial screening), which reduces the opportunity for implicit bias to influence the decision, rather than relying on changing attitudes directly. (6) Justification — a structural intervention like blind screening works even if implicit bias is not consciously recognised or eliminated, because it removes the bias's opportunity to affect the outcome, which is a different (and for this specific outcome, potentially more effective) approach than an attitude-change campaign. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A school with students from many different cultural backgrounds introduces a single 'buddy system' where new students are paired with an existing student for one week only. Reports of prejudice-related incidents do not decrease after a year of running the program. Using the four conditions for effective intergroup contact, evaluate why this program may be failing to reduce prejudice, and redesign it to better meet these conditions. (7 marks)",
        back:
          "Model response and marking points: (1) Sustained contact — a one-week pairing is a brief, short-term contact, which does not meet the condition that effective contact needs to be sustained over an extended period to produce lasting attitude change. (2) Superordinate goals — a simple 'buddy' pairing with no shared task or goal does not necessarily create a genuine shared goal requiring cooperation between the two students. (3) Mutual interdependence — without a task requiring both students to rely on each other to succeed, there is no built-in interdependence in the pairing as described. (4) Equality of status — depending on how the program is framed (e.g. if the 'buddy' is positioned as a helper/guide to the new student rather than an equal), the relationship may not reflect equal status between the two students. (5) At least two of the four conditions correctly identified as likely missing/weak in the current program design, with reasoning for each. (6) Redesign addressing the identified gaps — e.g. extend the pairing to a full term or semester (sustained contact), and give the pair a genuine shared task requiring joint effort and mutual reliance to complete (superordinate goals + interdependence), with both students positioned as equal partners in the task rather than helper/helped (equality of status). (7) Overall coherence — the redesign explicitly maps back to the specific conditions identified as missing, rather than being a generic improvement. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A student argues: 'Since Australian First Nations peoples share a common history of colonisation, government policy addressing their needs can safely use a single, uniform approach nationally.' Evaluate this claim, drawing on the concepts of shared experience and cultural diversity among First Nations groups. (6 marks)",
        back:
          "Model response and marking points: (1) It is accurate that Australian First Nations peoples share some common experiences, including the shared history of colonisation and settlement, which the claim correctly identifies. (2) However, Australian First Nations peoples are not a single, homogenous group — they represent many culturally distinctive groups, each with their own languages, traditions, communities and specific circumstances. (3) A single, uniform national policy approach risks overlooking this genuine cultural diversity, potentially failing to address the specific needs, contexts or preferences of particular communities that differ from the assumptions built into a one-size-fits-all approach. (4) This is a well-recognised tension: shared historical experience does support some common considerations at a national level, but does not justify assuming uniformity in how policy should be applied at the community level. (5) Judgement — the claim is only partly supported; shared history may justify some common national-level considerations, but does not justify a fully uniform approach given the genuine cultural diversity among First Nations communities, meaning policy would likely need to allow for community-specific adaptation. (6) Reasoning explicitly balances both the valid part of the claim (shared history) and the flaw (ignoring diversity), rather than dismissing the claim outright or accepting it fully. 1 mark per developed point, maximum 6.",
        complexity: "complex_unfamiliar",
      },
      {
        front:
          "A multicultural festival brings together several cultural community groups for a single day of shared food and performances, with organisers hoping this will meaningfully reduce intercultural conflict in the area long-term. Using the difference between multiculturalism and pluralism, and the conditions for effective intergroup contact, evaluate the likely long-term impact of a single-day event, and suggest what additional ongoing element the community would need. (7 marks)",
        back:
          "Model response and marking points: (1) A single-day, one-off event provides some brief positive intergroup contact but does not meet the 'sustained contact' condition identified as necessary for genuinely effective prejudice reduction, so on its own it is unlikely to produce lasting change. (2) The event structure (separate stalls/performances by group) does not necessarily involve superordinate goals or mutual interdependence between groups — group members may attend and interact with their own group's stall/performance without meaningful cooperative interaction across groups. (3) Distinction between multiculturalism and pluralism — a well-designed multicultural festival, if it treats all cultural groups as equally valued without positioning one as dominant, reflects a multiculturalist model rather than a pluralist one (which would implicitly centre a dominant culture); this distinction is relevant to how genuinely equal the event's framing is, which relates to the equality-of-status condition. (4) Evaluation — the event is a reasonable starting point (positive initial exposure) but, evaluated against the sustained-contact, superordinate-goals and interdependence conditions, is unlikely on its own to produce a meaningful long-term reduction in intercultural conflict. (5) Suggested additional ongoing element — e.g. establishing an ongoing, ideally recurring, joint community project or council (not just an annual event) that requires genuine collaboration/interdependence between the different cultural groups on a shared goal throughout the year. (6) Justification for the addition explicitly ties back to filling the specific gaps identified (sustained contact + interdependence), not simply 'do more events'. (7) Overall coherence integrating both frameworks (multiculturalism/pluralism and contact conditions) into one consistent evaluation. 1 mark per developed point, maximum 7.",
        complexity: "complex_unfamiliar",
      },
    ],
  },
];

const DATA: Record<string, TopicBlock[]> = { PSY };

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
