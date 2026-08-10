/**
 * Seeds AssumedKnowledge — the "not on the formula sheet but assumed" stuff
 * per subject: exact trig values, log laws, cell structures, landmark
 * studies, energy systems, technique definitions. Hand-written below, not
 * generated — this is exam-prep content, accuracy matters more than volume.
 *
 * Run:  npx tsx scripts/seed-assumed-knowledge.ts [--write] [MM BIO ...]
 *
 * Dry run by default; --write inserts. Idempotent on re-run — each subject's
 * existing entries are matched by prompt, and only prompts not already in
 * the DB get inserted, so running this twice never duplicates rows and
 * running it after someone has hand-edited a few entries via the UI won't
 * clobber those.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type SeedEntry = {
  category: string;
  prompt: string;
  answer: string;
  latex?: string;
};

// ============================================================================
// MATHEMATICAL METHODS (MM)
// Exact trig values, log/index laws, standard derivatives and integrals,
// differentiation rules, quadratics, surds, transformations, domain/range,
// binomial expansion, normal-distribution facts.
// ============================================================================
const MM: SeedEntry[] = [
  // Exact trig values (unit circle)
  { category: "Exact trig values (unit circle)", prompt: "sin(30°)", answer: "1/2", latex: "\\frac{1}{2}" },
  { category: "Exact trig values (unit circle)", prompt: "cos(30°)", answer: "√3/2", latex: "\\frac{\\sqrt{3}}{2}" },
  { category: "Exact trig values (unit circle)", prompt: "tan(30°)", answer: "1/√3 = √3/3", latex: "\\frac{1}{\\sqrt{3}} = \\frac{\\sqrt{3}}{3}" },
  { category: "Exact trig values (unit circle)", prompt: "sin(45°)", answer: "√2/2", latex: "\\frac{\\sqrt{2}}{2}" },
  { category: "Exact trig values (unit circle)", prompt: "cos(45°)", answer: "√2/2", latex: "\\frac{\\sqrt{2}}{2}" },
  { category: "Exact trig values (unit circle)", prompt: "tan(45°)", answer: "1", latex: "1" },
  { category: "Exact trig values (unit circle)", prompt: "sin(60°)", answer: "√3/2", latex: "\\frac{\\sqrt{3}}{2}" },
  { category: "Exact trig values (unit circle)", prompt: "cos(60°)", answer: "1/2", latex: "\\frac{1}{2}" },
  { category: "Exact trig values (unit circle)", prompt: "tan(60°)", answer: "√3", latex: "\\sqrt{3}" },

  // Trig identities
  { category: "Trig identities", prompt: "Pythagorean identity", answer: "sin²θ + cos²θ = 1", latex: "\\sin^2\\theta + \\cos^2\\theta = 1" },
  { category: "Trig identities", prompt: "tan θ in terms of sin and cos", answer: "tan θ = sin θ / cos θ", latex: "\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta}" },
  { category: "Trig identities", prompt: "Period of sin(x) and cos(x)", answer: "2π", latex: "2\\pi" },

  // Radians and degrees
  { category: "Radians and degrees", prompt: "π radians in degrees", answer: "180°", latex: "\\pi \\text{ rad} = 180^\\circ" },
  { category: "Radians and degrees", prompt: "Convert degrees to radians", answer: "radians = degrees × π/180", latex: "\\text{rad} = \\text{deg} \\times \\dfrac{\\pi}{180}" },

  // Log laws
  { category: "Log laws", prompt: "log_a(xy)", answer: "log_a x + log_a y", latex: "\\log_a(xy) = \\log_a x + \\log_a y" },
  { category: "Log laws", prompt: "log_a(x/y)", answer: "log_a x − log_a y", latex: "\\log_a\\!\\left(\\dfrac{x}{y}\\right) = \\log_a x - \\log_a y" },
  { category: "Log laws", prompt: "log_a(xⁿ)", answer: "n · log_a x", latex: "\\log_a(x^n) = n\\log_a x" },
  { category: "Log laws", prompt: "log_a(a)", answer: "1", latex: "\\log_a(a) = 1" },
  { category: "Log laws", prompt: "log_a(1)", answer: "0", latex: "\\log_a(1) = 0" },
  { category: "Log laws", prompt: "a^(log_a x)", answer: "x", latex: "a^{\\log_a x} = x" },

  // Index laws
  { category: "Index laws", prompt: "aᵐ × aⁿ", answer: "a^(m+n)", latex: "a^m \\times a^n = a^{m+n}" },
  { category: "Index laws", prompt: "aᵐ ÷ aⁿ", answer: "a^(m−n)", latex: "a^m \\div a^n = a^{m-n}" },
  { category: "Index laws", prompt: "(aᵐ)ⁿ", answer: "a^(mn)", latex: "(a^m)^n = a^{mn}" },
  { category: "Index laws", prompt: "a⁰", answer: "1 (a ≠ 0)", latex: "a^0 = 1" },
  { category: "Index laws", prompt: "a⁻ⁿ", answer: "1/aⁿ", latex: "a^{-n} = \\dfrac{1}{a^n}" },
  { category: "Index laws", prompt: "a^(m/n)", answer: "the nth root of a, raised to the m — (ⁿ√a)ᵐ", latex: "a^{m/n} = \\left(\\sqrt[n]{a}\\right)^m" },

  // Quadratic formula and discriminant
  { category: "Quadratic formula and discriminant", prompt: "Quadratic formula", answer: "x = (−b ± √(b² − 4ac)) / 2a", latex: "x = \\dfrac{-b \\pm \\sqrt{b^2-4ac}}{2a}" },
  { category: "Quadratic formula and discriminant", prompt: "What the discriminant b² − 4ac tells you", answer: "Δ > 0: two real roots. Δ = 0: one repeated root. Δ < 0: no real roots.", latex: "\\Delta = b^2-4ac" },

  // Surds
  { category: "Surds", prompt: "√a × √b", answer: "√(ab)", latex: "\\sqrt{a}\\times\\sqrt{b} = \\sqrt{ab}" },
  { category: "Surds", prompt: "√a ÷ √b", answer: "√(a/b)", latex: "\\dfrac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\dfrac{a}{b}}" },
  { category: "Surds", prompt: "Rationalise 1/√a", answer: "√a / a", latex: "\\dfrac{1}{\\sqrt{a}} = \\dfrac{\\sqrt{a}}{a}" },
  { category: "Surds", prompt: "(√a)²", answer: "a", latex: "(\\sqrt{a})^2 = a" },

  // Standard derivatives
  { category: "Standard derivatives", prompt: "d/dx (xⁿ)", answer: "n·x^(n−1)", latex: "\\dfrac{d}{dx}(x^n) = nx^{n-1}" },
  { category: "Standard derivatives", prompt: "d/dx (eˣ)", answer: "eˣ", latex: "\\dfrac{d}{dx}(e^x) = e^x" },
  { category: "Standard derivatives", prompt: "d/dx (e^(kx))", answer: "k·e^(kx)", latex: "\\dfrac{d}{dx}(e^{kx}) = ke^{kx}" },
  { category: "Standard derivatives", prompt: "d/dx (ln x)", answer: "1/x", latex: "\\dfrac{d}{dx}(\\ln x) = \\dfrac{1}{x}" },
  { category: "Standard derivatives", prompt: "d/dx (sin(kx))", answer: "k·cos(kx)", latex: "\\dfrac{d}{dx}(\\sin(kx)) = k\\cos(kx)" },
  { category: "Standard derivatives", prompt: "d/dx (cos(kx))", answer: "−k·sin(kx)", latex: "\\dfrac{d}{dx}(\\cos(kx)) = -k\\sin(kx)" },

  // Differentiation rules
  { category: "Differentiation rules", prompt: "Chain rule", answer: "d/dx[f(g(x))] = f'(g(x)) · g'(x)", latex: "\\dfrac{d}{dx}\\big[f(g(x))\\big] = f'(g(x))\\,g'(x)" },
  { category: "Differentiation rules", prompt: "Product rule", answer: "d/dx[uv] = u'v + uv'", latex: "\\dfrac{d}{dx}[uv] = u'v + uv'" },
  { category: "Differentiation rules", prompt: "Quotient rule", answer: "d/dx[u/v] = (u'v − uv') / v²", latex: "\\dfrac{d}{dx}\\!\\left[\\dfrac{u}{v}\\right] = \\dfrac{u'v - uv'}{v^2}" },

  // Standard integrals
  { category: "Standard integrals", prompt: "∫xⁿ dx", answer: "x^(n+1)/(n+1) + c, n ≠ −1", latex: "\\int x^n\\,dx = \\dfrac{x^{n+1}}{n+1} + c" },
  { category: "Standard integrals", prompt: "∫(1/x) dx", answer: "ln|x| + c", latex: "\\int \\dfrac{1}{x}\\,dx = \\ln|x| + c" },
  { category: "Standard integrals", prompt: "∫eˣ dx", answer: "eˣ + c", latex: "\\int e^x\\,dx = e^x + c" },
  { category: "Standard integrals", prompt: "∫e^(kx) dx", answer: "(1/k)·e^(kx) + c", latex: "\\int e^{kx}\\,dx = \\dfrac{1}{k}e^{kx} + c" },
  { category: "Standard integrals", prompt: "∫sin(kx) dx", answer: "−(1/k)·cos(kx) + c", latex: "\\int \\sin(kx)\\,dx = -\\dfrac{1}{k}\\cos(kx) + c" },
  { category: "Standard integrals", prompt: "∫cos(kx) dx", answer: "(1/k)·sin(kx) + c", latex: "\\int \\cos(kx)\\,dx = \\dfrac{1}{k}\\sin(kx) + c" },

  // Graph transformations
  { category: "Graph transformations", prompt: "y = f(x) + k", answer: "vertical shift up k units" },
  { category: "Graph transformations", prompt: "y = f(x + k)", answer: "horizontal shift LEFT k units — the sign flips what you'd expect" },
  { category: "Graph transformations", prompt: "y = a·f(x), |a| > 1", answer: "vertical stretch by factor a" },
  { category: "Graph transformations", prompt: "y = f(bx), |b| > 1", answer: "horizontal compression by factor 1/b" },
  { category: "Graph transformations", prompt: "Reflections of y = f(x)", answer: "y = −f(x) reflects in the x-axis; y = f(−x) reflects in the y-axis" },

  // Domain and range notation
  { category: "Domain and range notation", prompt: "Domain of 1/x", answer: "all real x except x = 0", latex: "x \\in \\mathbb{R},\\ x \\neq 0" },
  { category: "Domain and range notation", prompt: "Domain of ln(x)", answer: "x > 0", latex: "x > 0" },
  { category: "Domain and range notation", prompt: "Domain of √x", answer: "x ≥ 0", latex: "x \\geq 0" },

  // Binomial expansion
  { category: "Binomial expansion", prompt: "General term of (a + b)ⁿ", answer: "C(n,r) · a^(n−r) · b^r", latex: "T_{r+1} = \\binom{n}{r}a^{n-r}b^r" },
  { category: "Binomial expansion", prompt: "nCr formula", answer: "n! / (r!(n−r)!)", latex: "\\binom{n}{r} = \\dfrac{n!}{r!(n-r)!}" },

  // Normal distribution and z-scores
  { category: "Normal distribution and z-scores", prompt: "Empirical rule (68–95–99.7)", answer: "≈68% of data within 1 SD of the mean, ≈95% within 2 SD, ≈99.7% within 3 SD" },
  { category: "Normal distribution and z-scores", prompt: "z-score formula", answer: "z = (x − μ) / σ", latex: "z = \\dfrac{x-\\mu}{\\sigma}" },
  { category: "Normal distribution and z-scores", prompt: "Standard normal distribution parameters", answer: "mean = 0, standard deviation = 1", latex: "\\mu = 0,\\ \\sigma = 1" },
];

// ============================================================================
// BIOLOGY (BIO)
// Cell structures and jobs, biological molecules, enzyme behaviour, DNA/RNA
// structure, mitosis vs meiosis, Punnett square basics, ecological terms.
// ============================================================================
const BIO: SeedEntry[] = [
  // Cell structures and functions
  { category: "Cell structures and functions", prompt: "Nucleus", answer: "stores DNA/genetic material and controls cell activity" },
  { category: "Cell structures and functions", prompt: "Mitochondria", answer: "site of aerobic respiration; produces ATP" },
  { category: "Cell structures and functions", prompt: "Ribosomes", answer: "site of protein synthesis" },
  { category: "Cell structures and functions", prompt: "Rough endoplasmic reticulum", answer: "studded with ribosomes; synthesises and transports proteins" },
  { category: "Cell structures and functions", prompt: "Smooth endoplasmic reticulum", answer: "synthesises lipids; detoxifies substances" },
  { category: "Cell structures and functions", prompt: "Golgi apparatus", answer: "modifies, packages and ships proteins and lipids" },
  { category: "Cell structures and functions", prompt: "Lysosomes", answer: "contain digestive enzymes; break down waste and pathogens" },
  { category: "Cell structures and functions", prompt: "Cell (plasma) membrane", answer: "phospholipid bilayer; selectively permeable, controls what enters/exits the cell" },
  { category: "Cell structures and functions", prompt: "Cell wall (plant cells)", answer: "made of cellulose; provides structural support and shape" },
  { category: "Cell structures and functions", prompt: "Chloroplasts (plant cells)", answer: "site of photosynthesis" },
  { category: "Cell structures and functions", prompt: "Large central vacuole (plant cells)", answer: "storage of water/nutrients/waste; maintains turgor pressure" },
  { category: "Cell structures and functions", prompt: "Cytoskeleton", answer: "maintains cell shape and enables internal movement/transport" },

  // Biological molecules
  { category: "Biological molecules", prompt: "Carbohydrates — monomer and function", answer: "monomer: glucose (a monosaccharide); function: energy storage and structure" },
  { category: "Biological molecules", prompt: "Proteins — monomer and function", answer: "monomer: amino acids; function: enzymes, structure, transport" },
  { category: "Biological molecules", prompt: "Lipids — building blocks and function", answer: "glycerol + fatty acids; function: energy storage, membranes, insulation" },
  { category: "Biological molecules", prompt: "Nucleic acids — monomer and function", answer: "monomer: nucleotides; function: store and transmit genetic information" },
  { category: "Biological molecules", prompt: "Condensation reaction", answer: "joins monomers into a polymer, releasing a water molecule" },
  { category: "Biological molecules", prompt: "Hydrolysis reaction", answer: "breaks a polymer into monomers using a water molecule" },

  // Enzyme behaviour
  { category: "Enzyme behaviour", prompt: "What enzymes are", answer: "proteins that act as biological catalysts, speeding up reactions without being used up" },
  { category: "Enzyme behaviour", prompt: "Active site", answer: "the region of an enzyme where the substrate binds" },
  { category: "Enzyme behaviour", prompt: "Lock-and-key model", answer: "an enzyme's active site is a fixed shape that fits only one specific substrate" },
  { category: "Enzyme behaviour", prompt: "Induced fit model", answer: "the active site changes shape slightly as it binds the substrate, improving the fit" },
  { category: "Enzyme behaviour", prompt: "Denaturation", answer: "high temperature or extreme pH permanently changes an enzyme's shape, so the active site no longer fits its substrate" },
  { category: "Enzyme behaviour", prompt: "Effect of temperature on enzyme rate", answer: "rate increases to an optimum temperature, then falls sharply as the enzyme denatures" },
  { category: "Enzyme behaviour", prompt: "Effect of substrate concentration on enzyme rate", answer: "rate increases with substrate concentration, then plateaus once all active sites are saturated" },

  // DNA and RNA structure
  { category: "DNA and RNA structure", prompt: "DNA structure", answer: "double helix, two antiparallel strands joined by a sugar-phosphate backbone" },
  { category: "DNA and RNA structure", prompt: "DNA base pairing", answer: "adenine–thymine, cytosine–guanine (complementary, joined by hydrogen bonds)" },
  { category: "DNA and RNA structure", prompt: "RNA base pairing", answer: "adenine–uracil, cytosine–guanine (uracil replaces thymine)" },
  { category: "DNA and RNA structure", prompt: "Sugar in DNA", answer: "deoxyribose" },
  { category: "DNA and RNA structure", prompt: "Sugar in RNA", answer: "ribose" },
  { category: "DNA and RNA structure", prompt: "DNA strand count", answer: "double stranded" },
  { category: "DNA and RNA structure", prompt: "RNA strand count", answer: "single stranded" },
  { category: "DNA and RNA structure", prompt: "Nucleotide structure", answer: "a sugar, a phosphate group and a nitrogenous base" },

  // Mitosis vs meiosis
  { category: "Mitosis vs meiosis", prompt: "Purpose of mitosis", answer: "growth and repair — produces genetically identical diploid cells" },
  { category: "Mitosis vs meiosis", prompt: "Purpose of meiosis", answer: "produces genetically variable haploid gametes for sexual reproduction" },
  { category: "Mitosis vs meiosis", prompt: "Daughter cells from mitosis", answer: "2 diploid cells, genetically identical to the parent" },
  { category: "Mitosis vs meiosis", prompt: "Daughter cells from meiosis", answer: "4 haploid cells, each genetically different" },
  { category: "Mitosis vs meiosis", prompt: "Number of divisions in mitosis", answer: "1 division" },
  { category: "Mitosis vs meiosis", prompt: "Number of divisions in meiosis", answer: "2 divisions (meiosis I and meiosis II)" },
  { category: "Mitosis vs meiosis", prompt: "Crossing over", answer: "exchange of genetic material between homologous chromosomes during prophase I of meiosis; increases genetic variation" },
  { category: "Mitosis vs meiosis", prompt: "Independent assortment", answer: "random orientation of homologous chromosome pairs at metaphase I; increases genetic variation" },

  // Punnett squares and genetics basics
  { category: "Punnett squares and genetics basics", prompt: "Genotype vs phenotype", answer: "genotype = an organism's genetic makeup; phenotype = its observable characteristics" },
  { category: "Punnett squares and genetics basics", prompt: "Homozygous", answer: "having two identical alleles for a gene" },
  { category: "Punnett squares and genetics basics", prompt: "Heterozygous", answer: "having two different alleles for a gene" },
  { category: "Punnett squares and genetics basics", prompt: "Dominant allele", answer: "expressed in the phenotype when at least one copy is present (shown as a capital letter)" },
  { category: "Punnett squares and genetics basics", prompt: "Recessive allele", answer: "only expressed when homozygous — two copies needed (shown as a lowercase letter)" },
  { category: "Punnett squares and genetics basics", prompt: "Monohybrid cross ratio (Aa × Aa)", answer: "3:1 phenotypic ratio" },
  { category: "Punnett squares and genetics basics", prompt: "Test cross", answer: "crossing an individual of unknown genotype with a homozygous recessive individual, to determine the unknown genotype from the offspring ratios" },

  // Ecological terms
  { category: "Ecological terms", prompt: "Population", answer: "a group of the same species living in the same area at the same time, capable of interbreeding" },
  { category: "Ecological terms", prompt: "Community", answer: "all the populations of different species living and interacting in an area" },
  { category: "Ecological terms", prompt: "Ecosystem", answer: "a community of organisms together with the abiotic (non-living) environment they interact with" },
  { category: "Ecological terms", prompt: "Habitat", answer: "the physical place where an organism lives" },
  { category: "Ecological terms", prompt: "Niche", answer: "the role and function an organism has within its habitat" },
  { category: "Ecological terms", prompt: "Carrying capacity", answer: "the maximum population size an environment can sustainably support" },
  { category: "Ecological terms", prompt: "Producer / primary consumer / secondary consumer", answer: "producer makes its own food (e.g. plants); primary consumer eats producers; secondary consumer eats primary consumers" },
  { category: "Ecological terms", prompt: "Biotic vs abiotic factors", answer: "biotic = living components of an environment (e.g. predators); abiotic = non-living components (e.g. temperature, water)" },
];

// ============================================================================
// PSYCHOLOGY (PSY)
// Research method fundamentals, ethics, descriptive statistics, brain
// anatomy, and landmark studies with researcher and year.
// ============================================================================
const PSY: SeedEntry[] = [
  // Research method fundamentals
  { category: "Research method fundamentals", prompt: "Independent variable (IV)", answer: "the variable the researcher manipulates or changes" },
  { category: "Research method fundamentals", prompt: "Dependent variable (DV)", answer: "the variable that is measured, expected to change because of the IV" },
  { category: "Research method fundamentals", prompt: "Operationalisation", answer: "defining a variable in precise, measurable terms so it can be manipulated or measured" },
  { category: "Research method fundamentals", prompt: "Extraneous variable", answer: "any variable other than the IV that could affect the DV, if not controlled" },
  { category: "Research method fundamentals", prompt: "Confounding variable", answer: "an uncontrolled extraneous variable that has varied systematically with the IV, providing an alternative explanation for the results" },
  { category: "Research method fundamentals", prompt: "Validity", answer: "the extent to which a study or test measures what it claims to measure" },
  { category: "Research method fundamentals", prompt: "Reliability", answer: "the extent to which a result is consistent and can be replicated" },
  { category: "Research method fundamentals", prompt: "Internal validity", answer: "the extent to which a study genuinely tests the IV–DV relationship, free of confounds" },
  { category: "Research method fundamentals", prompt: "External validity", answer: "the extent to which findings generalise beyond the study — to other people, settings or times" },
  { category: "Research method fundamentals", prompt: "Correlation vs causation", answer: "a correlation shows a relationship between two variables; it does not by itself prove that one causes the other" },

  // Sampling types
  { category: "Sampling types", prompt: "Random sampling", answer: "every member of the population has an equal chance of being selected" },
  { category: "Sampling types", prompt: "Stratified sampling", answer: "the population is divided into subgroups (strata), and a sample is drawn proportionally from each" },
  { category: "Sampling types", prompt: "Convenience sampling", answer: "sampling whoever is easiest to access" },
  { category: "Sampling types", prompt: "Volunteer (self-selected) sampling", answer: "participants opt themselves into the study" },
  { category: "Sampling types", prompt: "Sampling bias", answer: "a sample that does not accurately represent the population it was drawn from" },
  { category: "Sampling types", prompt: "Population vs sample", answer: "population = the entire group of interest; sample = the subset of the population actually studied" },

  // Ethics requirements
  { category: "Ethics requirements", prompt: "Informed consent", answer: "participants must be told what the study involves and agree to take part before it begins" },
  { category: "Ethics requirements", prompt: "Voluntary participation", answer: "no coercion; participants have the right to withdraw at any time without penalty" },
  { category: "Ethics requirements", prompt: "Confidentiality / anonymity", answer: "participant identity and data must be protected" },
  { category: "Ethics requirements", prompt: "Deception", answer: "must be justified, kept to a minimum, and followed by a full debrief" },
  { category: "Ethics requirements", prompt: "Debriefing", answer: "informing participants of the true nature and purpose of the study after it concludes" },
  { category: "Ethics requirements", prompt: "Protection from harm", answer: "participants' physical and psychological wellbeing must be protected throughout the study" },
  { category: "Ethics requirements", prompt: "Right to withdraw", answer: "participants can leave the study at any point — including after data collection — without consequence" },

  // Descriptive statistics
  { category: "Descriptive statistics", prompt: "Mean", answer: "the sum of all scores divided by the number of scores" },
  { category: "Descriptive statistics", prompt: "Median", answer: "the middle value when scores are arranged in order" },
  { category: "Descriptive statistics", prompt: "Mode", answer: "the most frequently occurring score" },
  { category: "Descriptive statistics", prompt: "Range", answer: "the difference between the highest and lowest score" },
  { category: "Descriptive statistics", prompt: "Standard deviation", answer: "a measure of the average spread of scores around the mean" },
  { category: "Descriptive statistics", prompt: "Normal distribution", answer: "a symmetrical, bell-shaped distribution where the mean, median and mode are equal" },
  { category: "Descriptive statistics", prompt: "Qualitative vs quantitative data", answer: "qualitative = descriptive, non-numerical data; quantitative = numerical data" },

  // Brain anatomy
  { category: "Brain anatomy", prompt: "Frontal lobe", answer: "decision-making, planning, personality, voluntary movement" },
  { category: "Brain anatomy", prompt: "Parietal lobe", answer: "processes sensory information — touch and spatial awareness" },
  { category: "Brain anatomy", prompt: "Temporal lobe", answer: "auditory processing, memory, language comprehension" },
  { category: "Brain anatomy", prompt: "Occipital lobe", answer: "visual processing" },
  { category: "Brain anatomy", prompt: "Hippocampus", answer: "formation of new long-term memories" },
  { category: "Brain anatomy", prompt: "Amygdala", answer: "processing emotion, particularly fear" },
  { category: "Brain anatomy", prompt: "Cerebellum", answer: "balance, coordination, fine motor control" },
  { category: "Brain anatomy", prompt: "Brainstem", answer: "regulates vital autonomic functions — breathing, heart rate" },

  // Landmark studies
  { category: "Landmark studies", prompt: "Milgram (1963)", answer: "obedience study — participants administered (believed) electric shocks to a confederate on the instruction of an authority figure" },
  { category: "Landmark studies", prompt: "Zimbardo (1971)", answer: "Stanford Prison Experiment — participants randomly assigned to guard/prisoner roles; terminated early due to participant distress" },
  { category: "Landmark studies", prompt: "Asch (1951)", answer: "conformity study using a line-judgment task — showed people conform to a unanimous but incorrect majority" },
  { category: "Landmark studies", prompt: "Loftus & Palmer (1974)", answer: "eyewitness testimony study — leading questions (e.g. \"smashed\" vs \"hit\") changed participants' estimated speed and recall of a car crash" },
  { category: "Landmark studies", prompt: "Bandura, Ross & Ross (1961)", answer: "Bobo doll experiment — demonstrated observational (social) learning of aggression from a model" },
  { category: "Landmark studies", prompt: "Harlow (1958)", answer: "rhesus monkey attachment study — infants preferred a soft cloth \"mother\" over a wire \"mother\" that provided food, showing comfort matters more than feeding for attachment" },
  { category: "Landmark studies", prompt: "Pavlov (1927)", answer: "classical conditioning — dogs learned to salivate (conditioned response) to a bell (conditioned stimulus) after it was repeatedly paired with food" },
  { category: "Landmark studies", prompt: "Skinner (1938)", answer: "operant conditioning — box experiments showing how reinforcement and punishment shape behaviour" },
  { category: "Landmark studies", prompt: "Rosenhan (1973)", answer: "\"On Being Sane in Insane Places\" — healthy pseudo-patients were admitted to psychiatric hospitals undetected, questioning the validity of psychiatric diagnosis" },
  { category: "Landmark studies", prompt: "Ainsworth (1970)", answer: "Strange Situation procedure — identified infant attachment styles: secure, insecure-avoidant, insecure-resistant" },
];

// ============================================================================
// PHYSICAL EDUCATION (PE)
// Energy systems, muscle fibre types, planes and axes, training principles,
// FITT, anatomy fundamentals.
// ============================================================================
const PE: SeedEntry[] = [
  // Energy systems
  { category: "Energy systems", prompt: "ATP-PC (phosphocreatine) system", answer: "anaerobic, alactic; immediate energy; lasts ~10 seconds; e.g. 100m sprint" },
  { category: "Energy systems", prompt: "Anaerobic glycolysis (lactic acid system)", answer: "anaerobic; uses glucose/glycogen; produces lactate; lasts ~10s up to ~2–3 minutes; e.g. 400m sprint" },
  { category: "Energy systems", prompt: "Aerobic system", answer: "uses oxygen; fuelled by carbohydrate, fat and (minimally) protein; dominant after ~2–3 minutes; e.g. marathon" },
  { category: "Energy systems", prompt: "ATP", answer: "adenosine triphosphate — the immediately usable form of energy in cells" },
  { category: "Energy systems", prompt: "ATP-PC system: rate vs capacity", answer: "fastest rate of ATP production, but very limited capacity/duration" },
  { category: "Energy systems", prompt: "Aerobic system by-products", answer: "carbon dioxide and water — no fatigue-causing by-products" },
  { category: "Energy systems", prompt: "Anaerobic glycolysis by-product", answer: "lactate (lactic acid), which contributes to fatigue" },
  { category: "Energy systems", prompt: "Energy system interplay", answer: "all three systems contribute simultaneously; the dominant one shifts with exercise intensity and duration" },

  // Muscle fibre types
  { category: "Muscle fibre types", prompt: "Type I (slow twitch) fibres", answer: "fatigue-resistant, aerobic; used for endurance activities" },
  { category: "Muscle fibre types", prompt: "Type IIa fibres", answer: "moderate fatigue resistance, both aerobic and anaerobic; used for middle-distance/mixed activities" },
  { category: "Muscle fibre types", prompt: "Type IIx fibres", answer: "fatigue quickly, anaerobic, high force/power; used for sprint/power activities" },
  { category: "Muscle fibre types", prompt: "Slow twitch fibre traits", answer: "more mitochondria and capillaries, higher myoglobin content" },
  { category: "Muscle fibre types", prompt: "Fast twitch fibre traits", answer: "larger diameter, greater force production, fewer mitochondria" },

  // Planes and axes of movement
  { category: "Planes and axes of movement", prompt: "Sagittal plane", answer: "divides the body into left and right; flexion/extension movements occur here" },
  { category: "Planes and axes of movement", prompt: "Frontal (coronal) plane", answer: "divides the body into front and back; abduction/adduction movements occur here" },
  { category: "Planes and axes of movement", prompt: "Transverse plane", answer: "divides the body into upper and lower; rotation movements occur here" },
  { category: "Planes and axes of movement", prompt: "Axis for the sagittal plane", answer: "frontal (horizontal) axis" },
  { category: "Planes and axes of movement", prompt: "Axis for the frontal plane", answer: "sagittal (horizontal) axis" },
  { category: "Planes and axes of movement", prompt: "Axis for the transverse plane", answer: "longitudinal (vertical) axis" },
  { category: "Planes and axes of movement", prompt: "Flexion vs extension", answer: "flexion decreases the angle at a joint; extension increases it" },

  // Training principles
  { category: "Training principles", prompt: "Progressive overload", answer: "gradually increasing training demand to force the body to adapt" },
  { category: "Training principles", prompt: "Specificity", answer: "training should match the demands of the sport or activity" },
  { category: "Training principles", prompt: "Reversibility", answer: "fitness gains are lost when training stops or is reduced (\"use it or lose it\")" },
  { category: "Training principles", prompt: "Variety", answer: "varying training to maintain motivation and avoid plateau or overuse injury" },
  { category: "Training principles", prompt: "Individuality", answer: "training programs should be tailored to the individual" },
  { category: "Training principles", prompt: "Diminishing returns", answer: "as fitness improves, further gains become progressively harder to achieve" },

  // FITT principle
  { category: "FITT principle", prompt: "F in FITT", answer: "Frequency — how often training occurs" },
  { category: "FITT principle", prompt: "I in FITT", answer: "Intensity — how hard the training is (e.g. %HRmax, RPE)" },
  { category: "FITT principle", prompt: "T in FITT (time)", answer: "Time — the duration of the training session" },
  { category: "FITT principle", prompt: "T in FITT (type)", answer: "Type — the mode of training performed (e.g. aerobic, resistance)" },

  // Anatomy fundamentals
  { category: "Anatomy fundamentals", prompt: "Agonist (prime mover)", answer: "the muscle primarily responsible for producing a movement" },
  { category: "Anatomy fundamentals", prompt: "Antagonist", answer: "the muscle that relaxes/lengthens to allow the agonist to move; opposes the agonist" },
  { category: "Anatomy fundamentals", prompt: "Origin (of a muscle)", answer: "the fixed attachment point of a muscle — does not move" },
  { category: "Anatomy fundamentals", prompt: "Insertion (of a muscle)", answer: "the moving attachment point of a muscle" },
  { category: "Anatomy fundamentals", prompt: "Ball and socket joint", answer: "allows movement in multiple planes and rotation; e.g. shoulder, hip" },
  { category: "Anatomy fundamentals", prompt: "Hinge joint", answer: "allows flexion/extension in one plane; e.g. elbow, knee" },
  { category: "Anatomy fundamentals", prompt: "Pivot joint", answer: "allows rotation; e.g. neck (atlas/axis)" },
  { category: "Anatomy fundamentals", prompt: "Tendon", answer: "connects muscle to bone" },
  { category: "Anatomy fundamentals", prompt: "Ligament", answer: "connects bone to bone" },
  { category: "Anatomy fundamentals", prompt: "Cardiac output", answer: "Q = heart rate × stroke volume", latex: "Q = HR \\times SV" },
];

// ============================================================================
// ENGLISH (ENG)
// Literary and persuasive techniques, rhetorical appeals, tone vocabulary,
// text-type conventions, sentence-level terms. Kept sharp and short.
// ============================================================================
const ENG: SeedEntry[] = [
  // Literary techniques
  { category: "Literary techniques", prompt: "Metaphor", answer: "a direct comparison stating one thing is another (no \"like\"/\"as\")" },
  { category: "Literary techniques", prompt: "Simile", answer: "a comparison using \"like\" or \"as\"" },
  { category: "Literary techniques", prompt: "Personification", answer: "giving human qualities to something non-human" },
  { category: "Literary techniques", prompt: "Symbolism", answer: "using an object or image to represent a deeper idea" },
  { category: "Literary techniques", prompt: "Imagery", answer: "descriptive language that appeals to the senses" },
  { category: "Literary techniques", prompt: "Motif", answer: "a recurring element or image that develops a theme" },
  { category: "Literary techniques", prompt: "Juxtaposition", answer: "placing two contrasting things side by side to highlight the difference" },
  { category: "Literary techniques", prompt: "Foreshadowing", answer: "hinting at events that will occur later in the text" },
  { category: "Literary techniques", prompt: "Irony", answer: "a contrast between what is expected/said and what actually happens/is meant" },
  { category: "Literary techniques", prompt: "Allusion", answer: "an indirect reference to another text, person or event" },
  { category: "Literary techniques", prompt: "Characterisation", answer: "the techniques a writer uses to develop and reveal a character" },

  // Persuasive techniques
  { category: "Persuasive techniques", prompt: "Rhetorical question", answer: "a question asked for effect, not requiring an answer" },
  { category: "Persuasive techniques", prompt: "Repetition", answer: "repeating words or phrases for emphasis" },
  { category: "Persuasive techniques", prompt: "Rule of three (tricolon)", answer: "listing three items or ideas for rhythm and emphasis" },
  { category: "Persuasive techniques", prompt: "Emotive language", answer: "word choice designed to provoke an emotional response" },
  { category: "Persuasive techniques", prompt: "Hyperbole", answer: "deliberate exaggeration for effect" },
  { category: "Persuasive techniques", prompt: "Anecdote", answer: "a short personal story used to support an argument" },
  { category: "Persuasive techniques", prompt: "Inclusive language", answer: "words like \"we\"/\"us\" that build solidarity with the audience" },
  { category: "Persuasive techniques", prompt: "Statistics / evidence", answer: "numerical or factual data used to support a claim" },

  // Rhetorical appeals
  { category: "Rhetorical appeals", prompt: "Ethos", answer: "appeal to the credibility or character of the speaker" },
  { category: "Rhetorical appeals", prompt: "Pathos", answer: "appeal to the audience's emotions" },
  { category: "Rhetorical appeals", prompt: "Logos", answer: "appeal to logic or reason" },

  // Tone vocabulary
  { category: "Tone vocabulary", prompt: "Didactic", answer: "intended to teach or moralise" },
  { category: "Tone vocabulary", prompt: "Nostalgic", answer: "sentimental longing for the past" },
  { category: "Tone vocabulary", prompt: "Cynical", answer: "distrustful of sincerity or motives" },
  { category: "Tone vocabulary", prompt: "Satirical", answer: "using humour or irony to criticise or mock" },
  { category: "Tone vocabulary", prompt: "Candid", answer: "openly honest and direct" },
  { category: "Tone vocabulary", prompt: "Solemn", answer: "serious and formal in mood" },
  { category: "Tone vocabulary", prompt: "Wry", answer: "dryly humorous, often ironic" },
  { category: "Tone vocabulary", prompt: "Melancholic", answer: "a pervasive sadness or sorrow" },
  { category: "Tone vocabulary", prompt: "Ambivalent", answer: "having mixed or contradictory feelings" },
  { category: "Tone vocabulary", prompt: "Indignant", answer: "showing anger at what feels unfair treatment" },

  // Text-type conventions
  { category: "Text-type conventions", prompt: "Exposition essay", answer: "argues a single point of view, structured logically" },
  { category: "Text-type conventions", prompt: "Discussion essay", answer: "presents multiple perspectives on an issue" },
  { category: "Text-type conventions", prompt: "Feature article", answer: "informative/engaging piece with a byline, often subheadings and images" },
  { category: "Text-type conventions", prompt: "Speech", answer: "written for oral delivery; uses direct address and rhetorical devices" },
  { category: "Text-type conventions", prompt: "Formal letter/email", answer: "clear purpose, formal register, structured opening and closing" },
  { category: "Text-type conventions", prompt: "Review", answer: "evaluates a text, product or performance, blending description with judgement" },
  { category: "Text-type conventions", prompt: "Narrative", answer: "tells a story, typically structured orientation → complication → resolution" },
  { category: "Text-type conventions", prompt: "Monologue", answer: "an extended speech by a single character revealing thought or feeling" },

  // Sentence-level terms
  { category: "Sentence-level terms", prompt: "Simple sentence", answer: "one independent clause" },
  { category: "Sentence-level terms", prompt: "Compound sentence", answer: "two or more independent clauses joined by a coordinating conjunction" },
  { category: "Sentence-level terms", prompt: "Complex sentence", answer: "an independent clause plus one or more dependent clauses" },
  { category: "Sentence-level terms", prompt: "Syntax", answer: "the arrangement of words and phrases to form sentences" },
  { category: "Sentence-level terms", prompt: "Anaphora", answer: "repetition of a word or phrase at the start of successive clauses/sentences" },
  { category: "Sentence-level terms", prompt: "Asyndeton", answer: "omitting conjunctions between clauses for a clipped, rapid effect" },
  { category: "Sentence-level terms", prompt: "Polysyndeton", answer: "deliberate use of multiple conjunctions in succession, for emphasis or rhythm" },
];

const DATA: Record<string, SeedEntry[]> = { MM, BIO, PSY, PE, ENG };

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const only = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());
  const targets = only.length > 0 ? only : Object.keys(DATA);

  console.log(write ? "MODE: WRITE\n" : "MODE: dry run (nothing is written)\n");

  const summary: { code: string; defined: number; existing: number; inserted: number }[] = [];

  for (const code of targets) {
    const entries = DATA[code];
    if (!entries) {
      console.log(`${code}: no seed data defined for this code — skipping\n`);
      continue;
    }

    const subject = await prisma.subject.findFirst({ where: { shortCode: code } });
    if (!subject) {
      console.log(`${code}: no such subject in the database — skipping\n`);
      continue;
    }

    console.log(`${code} — ${subject.name}`);

    const byCategory = new Map<string, number>();
    for (const e of entries) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1);
    for (const [cat, n] of byCategory) console.log(`  ${cat}: ${n}`);

    const existing = await prisma.assumedKnowledge.findMany({
      where: { subjectId: subject.id },
      select: { prompt: true },
    });
    const existingPrompts = new Set(existing.map((e) => e.prompt));
    const toInsert = entries.filter((e) => !existingPrompts.has(e.prompt));

    console.log(
      `  ${entries.length} defined, ${existing.length} already in DB, ${toInsert.length} new to insert`,
    );

    let inserted = 0;
    if (write && toInsert.length > 0) {
      const result = await prisma.assumedKnowledge.createMany({
        data: toInsert.map((e) => ({
          userId: subject.userId,
          subjectId: subject.id,
          category: e.category,
          prompt: e.prompt,
          answer: e.answer,
          latex: e.latex ?? null,
        })),
      });
      inserted = result.count;
      console.log(`  WROTE ${inserted} rows`);
    }

    summary.push({ code, defined: entries.length, existing: existing.length, inserted });
    console.log();
  }

  console.log("SUMMARY");
  for (const s of summary) {
    const nowInDb = write ? s.existing + s.inserted : s.existing;
    console.log(
      `  ${s.code.padEnd(4)} ${String(s.defined).padStart(3)} defined · ${String(nowInDb).padStart(3)} in DB now${write ? "" : " (dry run — nothing written)"}`,
    );
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
