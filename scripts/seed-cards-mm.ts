/**
 * Hand-authored flashcards for MATHEMATICAL METHODS (MM) — Beschy's priority
 * subject, and the thinnest in coverage terms: 484 cards total but heavily
 * skewed, with U4 T4 (Sampling and proportions) and U4 T5 (Interval estimates
 * for proportions) at 8 cards each and no complexity-band coverage at all,
 * and several other topics missing whole bands (e.g. U4 T1-T3 have zero
 * simple_familiar band-tagged cards despite 100+ total cards each).
 *
 * NOT generated. No AI provider is called anywhere in this file. Every card
 * below was written by hand against the real syllabus objectives pulled
 * straight out of the database (Subject -> Unit -> Topic -> Subtopic ->
 * LearningObjective), using QCAA's own wording and terminology. Every
 * derivative, integral, probability and numeric answer was worked by hand
 * and checked at least two independent ways before being written down.
 *
 * Run:  npx tsx scripts/seed-cards-mm.ts [--write]
 *
 * Dry run by default; --write inserts. Idempotent on re-run — cards are
 * matched against a topic's existing fronts, and only new fronts are
 * inserted, so running this twice never duplicates rows.
 *
 * Topics are located by (subject shortCode, unit number, topic number)
 * rather than by title text.
 *
 * Saves go through saveCards() in src/lib/cards.ts — the bulk two-statement
 * insert that creates Card + CardScheduling rows without per-row writes
 * inside a transaction (that pattern blew Prisma's 5s interactive-transaction
 * ceiling against remote Supabase and rolled back whole imports before).
 *
 * cards.ts itself pulls in the AI provider at module scope, so — following
 * the same pattern as scripts/generate-cards.ts and scripts/seed-cards-eng-pe.ts
 * — it's imported dynamically AFTER config() has run, and only saveCards is
 * ever called from it. Nothing in this file calls generateText,
 * draftCardsForBand, or touches the Anthropic SDK.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { ComplexityBand } from "../src/lib/cards";

async function deps() {
  const cards = await import("../src/lib/cards");
  return cards;
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

type SeedCard = {
  front: string;
  back: string;
  complexity: ComplexityBand;
  cardType?: "basic" | "cloze";
};

// ============================================================================
// U3 T1: Differentiation of exponential and logarithmic functions
// ============================================================================
const MM_U3T1: SeedCard[] = [
  // simple_familiar
  { complexity: "simple_familiar", front: "State the derivative of $e^x$.", back: "$\\frac{d}{dx}e^x = e^x$" },
  { complexity: "simple_familiar", front: "State the rule for differentiating $e^{f(x)}$.", back: "$\\frac{d}{dx}e^{f(x)} = f'(x)\\,e^{f(x)}$" },
  { complexity: "simple_familiar", front: "State the derivative of $\\ln(x)$ for $x>0$.", back: "$\\frac{d}{dx}\\ln(x) = \\frac{1}{x}$" },
  { complexity: "simple_familiar", front: "State the rule for differentiating $\\ln(f(x))$.", back: "$\\frac{d}{dx}\\ln(f(x)) = \\frac{f'(x)}{f(x)}$" },
  { complexity: "simple_familiar", front: "What is the $y$-intercept of the graph $y=e^x$?", back: "$(0,1)$, since $e^0=1$." },
  { complexity: "simple_familiar", front: "What is the equation of the horizontal asymptote of $y=e^x$?", back: "$y=0$." },
  { complexity: "simple_familiar", front: "What is the $x$-intercept of the graph $y=\\ln(x)$?", back: "$(1,0)$, since $\\ln(1)=0$." },
  { complexity: "simple_familiar", front: "What is the equation of the vertical asymptote of $y=\\ln(x)$?", back: "$x=0$." },
  { complexity: "simple_familiar", front: "State the domain of $y=\\ln(x)$.", back: "$x>0$ (i.e. $(0,\\infty)$)." },
  { complexity: "simple_familiar", front: "How is the number $e$ defined, in terms of the limit $\\frac{a^h-1}{h}$ as $h \\to 0$?", back: "$e$ is the unique number $a>0$ for which $\\lim_{h \\to 0}\\frac{a^h-1}{h} = 1$." },
  { complexity: "simple_familiar", front: "What is the geometric relationship between the graphs of $y=e^x$ and $y=\\ln(x)$?", back: "They are reflections of each other in the line $y=x$, since they are inverse functions." },
  { complexity: "simple_familiar", front: "Differentiate $y=e^{3x}$.", back: "$\\frac{dy}{dx} = 3e^{3x}$" },
  { complexity: "simple_familiar", front: "Differentiate $y=\\ln(5x)$.", back: "$\\frac{dy}{dx} = \\frac{5}{5x} = \\frac{1}{x}$" },
  { complexity: "simple_familiar", front: "Solve $e^x = 5$ for $x$, giving an exact answer.", back: "$x=\\ln(5)$" },
  // complex_familiar
  { complexity: "complex_familiar", front: "Determine $\\frac{dy}{dx}$ if $y = \\ln(x^2+4x)$. (2 marks)", back: "1 mark: $f(x) = x^2+4x$ so $f'(x)=2x+4$. 1 mark: $\\frac{dy}{dx} = \\frac{2x+4}{x^2+4x}$." },
  { complexity: "complex_familiar", front: "Find the equation of the tangent to $y=e^{2x}$ at the point where $x=0$. (3 marks)", back: "1 mark: $\\frac{dy}{dx}=2e^{2x}$, so the gradient at $x=0$ is $2e^0=2$. 1 mark: The point of tangency is $(0, e^0)=(0,1)$. 1 mark: Tangent equation: $y-1=2(x-0) \\Rightarrow y=2x+1$." },
  // complex_unfamiliar
  { complexity: "complex_unfamiliar", front: "A colony of bacteria grows according to $N(t) = 200e^{0.15t}$, where $N$ is the number of bacteria and $t$ is time in hours. A second colony decays according to $M(t) = 5000e^{-0.2t}$. Find, correct to two decimal places, the time at which colony $N$ is increasing at the same rate (in magnitude) as colony $M$ is decreasing. (5 marks)", back: "1 mark: $N'(t) = 30e^{0.15t}$ (rate colony N is increasing). 1 mark: $M'(t) = -1000e^{-0.2t}$, so the rate colony M is decreasing is $1000e^{-0.2t}$. 1 mark: Setting the rates equal: $30e^{0.15t} = 1000e^{-0.2t}$. 1 mark: $e^{0.35t} = \\frac{100}{3} \\Rightarrow 0.35t = \\ln\\left(\\frac{100}{3}\\right)$. 1 mark: $t = \\frac{\\ln(100/3)}{0.35} \\approx 10.02$ hours." },
  { complexity: "complex_unfamiliar", front: "The value of a delivery van depreciates according to $V(t) = 45000e^{-kt}$, where $V$ is the value in dollars and $t$ is time in years. After 4 years the van is worth \\$28000. Find $k$ correct to 4 decimal places, then determine the rate at which the van's value is decreasing at $t=4$, correct to the nearest dollar per year. (5 marks)", back: "1 mark: Substitute $t=4$, $V=28000$: $28000 = 45000e^{-4k}$. 1 mark: $e^{-4k} = \\frac{28000}{45000} = 0.6222$, so $-4k = \\ln(0.6222)$. 1 mark: $k = \\frac{-\\ln(0.6222)}{4} \\approx 0.1186$. 1 mark: $V'(t) = -45000k\\,e^{-kt}$, so $V'(4) = -45000(0.1186)(0.6222) \\approx -3321$. 1 mark: The van's value is decreasing at approximately \\$3321 per year at $t=4$." },
  { complexity: "complex_unfamiliar", front: "Two curves, $y=e^{x-1}$ and $y=\\ln(x)+1$, both pass through the point $(1,1)$. Determine the gradient of each curve at $x=1$, and hence describe the relationship between their tangent lines at that point. (5 marks)", back: "1 mark: For $y=e^{x-1}$, $\\frac{dy}{dx}=e^{x-1}$, so at $x=1$ the gradient is $e^0=1$. 1 mark: For $y=\\ln(x)+1$, $\\frac{dy}{dx}=\\frac{1}{x}$, so at $x=1$ the gradient is $\\frac{1}{1}=1$. 1 mark: Both curves pass through $(1,1)$ (check: $e^0=1$ and $\\ln(1)+1=1$). 1 mark: Since both gradients equal 1, the tangent line to each curve at $(1,1)$ is $y-1=1(x-1)$, i.e. $y=x$. 1 mark: The two tangent lines are therefore identical (not merely parallel) — both curves share the same tangent line $y=x$ at their point of intersection." },
  { complexity: "complex_unfamiliar", front: "A student differentiates $y = \\ln(3x^2)$ and writes $\\frac{dy}{dx} = \\frac{1}{3x^2}$. Identify the error in the student's working, and give the correct derivative. (4 marks)", back: "1 mark: The student applied $\\frac{d}{dx}\\ln(x)=\\frac1x$ directly to $3x^2$ without applying the chain rule $\\frac{d}{dx}\\ln(f(x))=\\frac{f'(x)}{f(x)}$. 1 mark: With $f(x)=3x^2$, $f'(x)=6x$, so the correct derivative is $\\frac{dy}{dx}=\\frac{6x}{3x^2}$. 1 mark: This simplifies to $\\frac{dy}{dx}=\\frac{2}{x}$. 1 mark: Check: $\\ln(3x^2)=\\ln3+2\\ln x$, so $\\frac{dy}{dx}=0+\\frac{2}{x}=\\frac{2}{x}$, confirming the corrected answer." },
  { complexity: "complex_unfamiliar", front: "An earthquake's magnitude $M$ relates to its energy $E$ by $M = \\frac{2}{3}\\ln\\left(\\frac{E}{E_0}\\right)$ for a reference energy $E_0$. An earthquake of magnitude $M=6$ releases four times the energy of an earthquake of magnitude $M_1$. Determine $M_1$, correct to two decimal places. (5 marks)", back: "1 mark: Rearranging $M=\\frac23\\ln\\left(\\frac{E}{E_0}\\right)$ gives $\\frac{E}{E_0}=e^{\\frac32 M}$. 1 mark: For $M=6$: $\\frac{E_6}{E_0}=e^{9}\\approx 8103.08$. 1 mark: Since $E_6=4E_1$, $\\frac{E_1}{E_0}=\\frac{e^9}{4}\\approx 2025.77$. 1 mark: $M_1=\\frac23\\ln(2025.77)\\approx \\frac23(7.6137)$. 1 mark: $M_1\\approx 5.08$." },
  { complexity: "complex_unfamiliar", front: "A population of insects is modelled by $P(t) = 800e^{0.08t}$ for $t \\geq 0$ weeks. Determine how long it takes for the population to be increasing at a rate of 100 insects per week, correct to the nearest week, and state one limitation of using this exponential model for large $t$. (5 marks)", back: "1 mark: $P'(t) = 64e^{0.08t}$. 1 mark: Set $64e^{0.08t}=100 \\Rightarrow e^{0.08t} = 1.5625$. 1 mark: $0.08t = \\ln(1.5625) \\approx 0.4463$. 1 mark: $t \\approx 5.58$ weeks, i.e. approximately 6 weeks (nearest week). 1 mark: Limitation: exponential growth is unbounded, so the model is unrealistic for large $t$ since real populations are eventually limited by food, space or other environmental constraints." },
];

// ============================================================================
// U3 T2: Differentiation of trigonometric functions and differentiation rules
// ============================================================================
const MM_U3T2: SeedCard[] = [
  // simple_familiar
  { complexity: "simple_familiar", front: "State the derivative of $\\sin(x)$.", back: "$\\frac{d}{dx}\\sin(x)=\\cos(x)$" },
  { complexity: "simple_familiar", front: "State the derivative of $\\cos(x)$.", back: "$\\frac{d}{dx}\\cos(x)=-\\sin(x)$" },
  { complexity: "simple_familiar", front: "State the rule for differentiating $\\sin(f(x))$.", back: "$\\frac{d}{dx}\\sin(f(x)) = f'(x)\\cos(f(x))$" },
  { complexity: "simple_familiar", front: "State the rule for differentiating $\\cos(f(x))$.", back: "$\\frac{d}{dx}\\cos(f(x)) = -f'(x)\\sin(f(x))$" },
  { complexity: "simple_familiar", front: "State the chain rule for differentiating $y=f(g(x))$.", back: "$\\frac{dy}{dx} = f'(g(x))\\cdot g'(x)$" },
  { complexity: "simple_familiar", front: "State the product rule for differentiating $y = u(x)v(x)$.", back: "$\\frac{dy}{dx} = u'(x)v(x) + u(x)v'(x)$" },
  { complexity: "simple_familiar", front: "State the quotient rule for differentiating $y=\\frac{u(x)}{v(x)}$.", back: "$\\frac{dy}{dx} = \\frac{u'(x)v(x) - u(x)v'(x)}{[v(x)]^2}$" },
  { complexity: "simple_familiar", front: "Differentiate $y=\\sin(4x)$.", back: "$\\frac{dy}{dx}=4\\cos(4x)$" },
  { complexity: "simple_familiar", front: "Differentiate $y=\\cos(2x)$.", back: "$\\frac{dy}{dx}=-2\\sin(2x)$" },
  { complexity: "simple_familiar", front: "When should you use the chain rule rather than the product rule to differentiate a function?", back: "When the function is a composition of functions (one function 'inside' another), e.g. $\\sin(x^2)$, rather than a product of two separate functions, e.g. $x^2\\sin(x)$." },
  // complex_familiar
  { complexity: "complex_familiar", front: "Differentiate $y = x^3\\cos(x)$ using the product rule. (2 marks)", back: "1 mark: Let $u=x^3$ ($u'=3x^2$) and $v=\\cos(x)$ ($v'=-\\sin(x)$). 1 mark: $\\frac{dy}{dx} = 3x^2\\cos(x) - x^3\\sin(x)$." },
  { complexity: "complex_familiar", front: "Differentiate $y=\\frac{\\sin(x)}{x^2}$ using the quotient rule. (3 marks)", back: "1 mark: $u=\\sin(x)$, $u'=\\cos(x)$; $v=x^2$, $v'=2x$. 1 mark: $\\frac{dy}{dx} = \\frac{x^2\\cos(x) - 2x\\sin(x)}{x^4}$. 1 mark: Simplifying by cancelling a factor of $x$: $\\frac{dy}{dx} = \\frac{x\\cos(x) - 2\\sin(x)}{x^3}$." },
  { complexity: "complex_familiar", front: "Differentiate $y = \\cos(3x)\\sin(2x)$ using the product rule, expressing your answer in simplest form. (3 marks)", back: "1 mark: $u=\\cos(3x)$, $u'=-3\\sin(3x)$; $v=\\sin(2x)$, $v'=2\\cos(2x)$. 1 mark: $\\frac{dy}{dx} = -3\\sin(3x)\\sin(2x) + \\cos(3x)\\cdot 2\\cos(2x)$. 1 mark: $\\frac{dy}{dx} = 2\\cos(3x)\\cos(2x) - 3\\sin(3x)\\sin(2x)$." },
];

// ============================================================================
// U3 T3: Further applications of differentiation
// ============================================================================
const MM_U3T3: SeedCard[] = [
  // simple_familiar
  { complexity: "simple_familiar", front: "What does it mean for a curve to be concave up on an interval?", back: "The curve bends upward like a cup; $f''(x) > 0$ on that interval." },
  { complexity: "simple_familiar", front: "What does it mean for a curve to be concave down on an interval?", back: "The curve bends downward like a cap; $f''(x) < 0$ on that interval." },
  { complexity: "simple_familiar", front: "Define a point of inflection.", back: "A point where the concavity of a curve changes (from concave up to concave down, or vice versa), typically where $f''(x)=0$ and changes sign." },
  { complexity: "simple_familiar", front: "State the second derivative test for a stationary point at $x=a$ where $f'(a)=0$.", back: "If $f''(a)>0$, $x=a$ is a local minimum. If $f''(a)<0$, $x=a$ is a local maximum. If $f''(a)=0$, the test is inconclusive." },
  { complexity: "simple_familiar", front: "What does the second derivative of a displacement function, $s''(t)$, represent physically?", back: "Acceleration — the rate of change of velocity with respect to time." },
  { complexity: "simple_familiar", front: "What is the relationship between the first and second derivatives of a function?", back: "The second derivative is the derivative of the first derivative — it measures the rate of change of the gradient function." },
  { complexity: "simple_familiar", front: "If $f''(x) = 0$ at $x=a$, does this guarantee a point of inflection at $x=a$?", back: "No — $f''(x)=0$ is necessary but not sufficient; the concavity (sign of $f''(x)$) must actually change either side of $x=a$." },
  { complexity: "simple_familiar", front: "In an optimisation problem, what condition on the first derivative identifies candidate maximum or minimum points?", back: "Stationary points, where $f'(x) = 0$." },
  { complexity: "simple_familiar", front: "State the notation for the second derivative of $y=f(x)$, using both Leibniz and prime notation.", back: "$\\frac{d^2y}{dx^2}$ or $f''(x)$." },
  { complexity: "simple_familiar", front: "Find $f''(x)$ if $f(x) = x^4$.", back: "$f'(x)=4x^3$, so $f''(x)=12x^2$." },
  // complex_familiar
  { complexity: "complex_familiar", front: "Determine the coordinates of the point of inflection on the curve $y = x^3 - 6x^2 + 9x$. (3 marks)", back: "1 mark: $y''=6x-12$. 1 mark: Setting $y''=0$ gives $x=2$ (and $y''$ changes sign there, confirming an inflection). 1 mark: Substituting $x=2$: $y=8-24+18=2$, so the point of inflection is $(2,2)$." },
  { complexity: "complex_familiar", front: "Use the second derivative test to classify the stationary points of $f(x) = x^3 - 3x^2 - 9x + 5$. (4 marks)", back: "1 mark: $f'(x)=3x^2-6x-9=3(x-3)(x+1)$, giving stationary points at $x=3$ and $x=-1$. 1 mark: $f''(x)=6x-6$. 1 mark: At $x=3$: $f''(3)=12>0$, so $(3,-22)$ is a local minimum. 1 mark: At $x=-1$: $f''(-1)=-12<0$, so $(-1,10)$ is a local maximum." },
  // complex_unfamiliar
  { complexity: "complex_unfamiliar", front: "A rectangular sheet of cardboard measuring 20 cm by 32 cm has equal squares of side length $x$ cm cut from each corner, and the sides folded up to form an open box. Determine the value of $x$ that maximises the volume of the box, and state the maximum volume, correct to the nearest cm³. (6 marks)", back: "1 mark: $V(x) = x(20-2x)(32-2x) = 4x^3 - 104x^2 + 640x$, for $0<x<10$. 1 mark: $V'(x) = 12x^2 - 208x + 640$. 1 mark: Setting $V'(x)=0$: $3x^2-52x+160=0$, giving $x = \\frac{52\\pm\\sqrt{2704-1920}}{6} = \\frac{52\\pm28}{6}$, so $x=4$ or $x=13.33$. 1 mark: Only $x=4$ lies in the valid domain $0<x<10$. 1 mark: $V''(x)=-208+24x$; at $x=4$, $V''(4)=-112<0$, confirming a maximum. 1 mark: $V(4) = 4(12)(24) = 1152\\text{ cm}^3$." },
  { complexity: "complex_unfamiliar", front: "The displacement of a particle moving in a straight line is given by $s(t) = t^3 - 9t^2 + 15t$, where $s$ is in metres and $t \\geq 0$ is in seconds. Determine the time at which the particle's acceleration is zero, and describe what is happening to the particle's velocity at that instant. (5 marks)", back: "1 mark: $v(t)=s'(t) = 3t^2-18t+15$ and $a(t)=s''(t)=6t-18$. 1 mark: Setting $a(t)=0$: $6t-18=0 \\Rightarrow t=3$ seconds. 1 mark: Since $a(t)=v'(t)$, $a=0$ means velocity has a stationary point at $t=3$. 1 mark: As $v(t)$ is an upward-opening parabola (coefficient of $t^2$ is positive), $t=3$ gives a minimum value of $v$: $v(3) = 27-54+15=-12\\text{ m/s}$. 1 mark: At $t=3$ seconds, the particle's velocity is momentarily neither increasing nor decreasing — it is at its minimum (most negative) value before beginning to increase again." },
  { complexity: "complex_unfamiliar", front: "A cylindrical can with an open top is to be manufactured to hold a volume of $500\\pi\\text{ cm}^3$. Show that the surface area of material used is $S(r) = \\pi r^2 + \\frac{1000\\pi}{r}$, where $r$ is the base radius, and determine the radius that minimises the surface area. (6 marks)", back: "1 mark: Volume: $\\pi r^2 h = 500\\pi \\Rightarrow h = \\frac{500}{r^2}$. 1 mark: Surface area (base + curved side, no top): $S = \\pi r^2 + 2\\pi r h = \\pi r^2 + 2\\pi r \\cdot \\frac{500}{r^2} = \\pi r^2 + \\frac{1000\\pi}{r}$, as required. 1 mark: $S'(r) = 2\\pi r - \\frac{1000\\pi}{r^2}$. 1 mark: Setting $S'(r)=0$: $2\\pi r = \\frac{1000\\pi}{r^2} \\Rightarrow r^3 = 500 \\Rightarrow r = 500^{1/3} \\approx 7.94\\text{ cm}$. 1 mark: $S''(r) = 2\\pi + \\frac{2000\\pi}{r^3} > 0$ for all $r>0$, confirming this is a minimum. 1 mark: The surface area is minimised when $r \\approx 7.94\\text{ cm}$." },
  { complexity: "complex_unfamiliar", front: "A cost function for producing $x$ units is $C(x) = 0.01x^3 - 3x^2 + 400x + 5000$ dollars, for $0 \\leq x \\leq 200$. Determine the production level that minimises the marginal cost, and justify using the second derivative that this is indeed a minimum. (5 marks)", back: "1 mark: Marginal cost is $C'(x) = 0.03x^2 - 6x + 400$. To minimise this, find its stationary point: $C''(x) = 0.06x - 6$. 1 mark: Setting $C''(x)=0$: $0.06x=6 \\Rightarrow x=100$. 1 mark: The third derivative $C'''(x) = 0.06 > 0$ (constant), confirming $C''(x)$ changes from negative to positive at $x=100$, so the marginal cost function has a minimum there. 1 mark: Minimum marginal cost: $C'(100) = 0.03(100)^2 - 6(100) + 400 = 300-600+400 = 100$. 1 mark: The marginal cost is minimised at a production level of $x=100$ units, where the marginal cost is \\$100 per unit." },
  { complexity: "complex_unfamiliar", front: "The curve $y = ax^3 + bx^2$ has a point of inflection at $(1, 3)$. Determine the values of $a$ and $b$. (5 marks)", back: "1 mark: Since the curve passes through $(1,3)$: $a(1)^3+b(1)^2=3 \\Rightarrow a+b=3$. 1 mark: $y''=6ax+2b$; a point of inflection requires $y''(1)=0$: $6a+2b=0 \\Rightarrow 3a+b=0$. 1 mark: Solving simultaneously: from $b=-3a$, substitute into $a+b=3$: $a-3a=3 \\Rightarrow -2a=3 \\Rightarrow a=-1.5$. 1 mark: $b=-3(-1.5)=4.5$. 1 mark: Check: $y''=6(-1.5)x+2(4.5)=-9x+9$, which is zero at $x=1$ and changes sign there (linear, nonzero slope), confirming a genuine inflection point. So $a=-1.5$, $b=4.5$." },
];

// ============================================================================
// U3 T4: Introduction to integration
// ============================================================================
const MM_U3T4: SeedCard[] = [
  // simple_familiar
  { complexity: "simple_familiar", front: "What is anti-differentiation the reverse process of?", back: "Differentiation." },
  { complexity: "simple_familiar", front: "State the notation used for an indefinite integral of $f(x)$.", back: "$\\int f(x)\\,dx$" },
  { complexity: "simple_familiar", front: "State the rule $\\int x^n\\,dx$ for $n \\neq -1$.", back: "$\\int x^n\\,dx = \\frac{x^{n+1}}{n+1}+c$" },
  { complexity: "simple_familiar", front: "State $\\int e^x\\,dx$.", back: "$\\int e^x\\,dx = e^x + c$" },
  { complexity: "simple_familiar", front: "State $\\int \\frac{1}{x}\\,dx$ for $x>0$.", back: "$\\int \\frac{1}{x}\\,dx = \\ln(x) + c$" },
  { complexity: "simple_familiar", front: "State $\\int \\sin(x)\\,dx$.", back: "$\\int \\sin(x)\\,dx = -\\cos(x)+c$" },
  { complexity: "simple_familiar", front: "State $\\int \\cos(x)\\,dx$.", back: "$\\int \\cos(x)\\,dx = \\sin(x)+c$" },
  { complexity: "simple_familiar", front: "What is the term for the constant $c$ that appears when finding an indefinite integral?", back: "The constant of integration." },
  { complexity: "simple_familiar", front: "State the rule for integrating a sum of functions, $\\int(f(x)+g(x))\\,dx$.", back: "$\\int(f(x)+g(x))\\,dx = \\int f(x)\\,dx + \\int g(x)\\,dx$" },
  { complexity: "simple_familiar", front: "State the rule for integrating a constant multiple of a function, $\\int k f(x)\\,dx$.", back: "$\\int k f(x)\\,dx = k \\int f(x)\\,dx$" },
  { complexity: "simple_familiar", front: "State the general rule for $\\int f(ax+b)\\,dx$ in terms of $F$, an antiderivative of $f$.", back: "$\\int f(ax+b)\\,dx = \\frac{1}{a}F(ax+b)+c$" },
  { complexity: "simple_familiar", front: "Find $\\int x^4\\,dx$.", back: "$\\frac{x^5}{5}+c$" },
  { complexity: "simple_familiar", front: "Find $\\int e^{2x}\\,dx$.", back: "$\\frac{1}{2}e^{2x}+c$" },
  { complexity: "simple_familiar", front: "Find $\\int \\sin(3x)\\,dx$.", back: "$-\\frac{1}{3}\\cos(3x)+c$" },
  { complexity: "simple_familiar", front: "What extra piece of information is needed to determine the value of $c$ when finding $f(x)$ from $f'(x)$?", back: "An initial condition — a known value of $f$ at a particular $x$, e.g. $f(a)=b$." },
  { complexity: "simple_familiar", front: "How is displacement determined from a velocity function?", back: "By anti-differentiating the velocity function, using an initial displacement value to find the constant of integration." },
  // complex_familiar
  { complexity: "complex_familiar", front: "Determine $f(x)$ given $f'(x) = 6x^2 - 4x$ and $f(1) = 5$. (3 marks)", back: "1 mark: $f(x) = \\int(6x^2-4x)\\,dx = 2x^3 - 2x^2 + c$. 1 mark: Using $f(1)=5$: $2(1)-2(1)+c = 5 \\Rightarrow c=5$. 1 mark: $f(x) = 2x^3-2x^2+5$." },
  { complexity: "complex_familiar", front: "A particle has acceleration $a(t) = 4t - 2$ m/s². Given $v(0) = 3$ m/s and $s(0)=0$, determine the particle's displacement function $s(t)$. (4 marks)", back: "1 mark: $v(t) = \\int(4t-2)\\,dt = 2t^2-2t+c_1$; using $v(0)=3$ gives $c_1=3$, so $v(t)=2t^2-2t+3$. 1 mark: $s(t) = \\int v(t)\\,dt = \\frac{2}{3}t^3 - t^2 + 3t + c_2$. 1 mark: Using $s(0)=0$ gives $c_2=0$. 1 mark: $s(t) = \\frac{2}{3}t^3 - t^2 + 3t$." },
  // complex_unfamiliar
  { complexity: "complex_unfamiliar", front: "A ball is thrown upward from a building edge with acceleration $a(t) = -9.8\\text{ m/s}^2$, initial velocity $v(0)=15\\text{ m/s}$, and initial height $s(0)=20\\text{ m}$. Determine the time at which the ball reaches its maximum height, and find that maximum height, correct to one decimal place. (6 marks)", back: "1 mark: $v(t) = \\int -9.8\\,dt = -9.8t + c_1$; using $v(0)=15$ gives $c_1=15$, so $v(t) = -9.8t+15$. 1 mark: Maximum height occurs when $v(t)=0$: $-9.8t+15=0 \\Rightarrow t = \\frac{15}{9.8} \\approx 1.53\\text{ s}$. 1 mark: $s(t) = \\int v(t)\\,dt = -4.9t^2+15t+c_2$; using $s(0)=20$ gives $c_2=20$, so $s(t)=-4.9t^2+15t+20$. 1 mark: $s(1.53) = -4.9(1.53)^2 + 15(1.53) + 20$. 1 mark: $\\approx -11.48+22.96+20$. 1 mark: $\\approx 31.5\\text{ m}$ (maximum height, to one decimal place)." },
  { complexity: "complex_unfamiliar", front: "Water flows into a tank at rate $R(t) = 20 + 6\\sin\\!\\left(\\frac{\\pi t}{12}\\right)$ litres per minute, where $t$ is time in minutes. The tank starts with $500$ litres. Determine the amount of water in the tank after $10$ minutes, correct to the nearest litre. (5 marks)", back: "1 mark: $V(t) = \\int R(t)\\,dt = 20t - \\frac{72}{\\pi}\\cos\\!\\left(\\frac{\\pi t}{12}\\right) + c$ (using $\\int \\sin(kt)\\,dt = -\\frac1k\\cos(kt)+c$ with $k=\\frac{\\pi}{12}$). 1 mark: Using $V(0)=500$: $-\\frac{72}{\\pi}\\cos(0)+c=500 \\Rightarrow c = 500+\\frac{72}{\\pi}$. 1 mark: So $V(t) = 20t + 500 + \\frac{72}{\\pi}\\left[1-\\cos\\!\\left(\\frac{\\pi t}{12}\\right)\\right]$. 1 mark: At $t=10$: $\\frac{\\pi(10)}{12}=\\frac{5\\pi}{6}$, and $\\cos\\!\\left(\\frac{5\\pi}{6}\\right)=-\\frac{\\sqrt3}{2}\\approx -0.866$. 1 mark: $V(10) = 200+500+\\frac{72}{\\pi}(1.866) \\approx 700+42.8 \\approx 743$ litres." },
];

// ============================================================================
// U3 T5: Discrete random variables
// ============================================================================
const MM_U3T5: SeedCard[] = [
  // simple_familiar
  { complexity: "simple_familiar", front: "What is a discrete random variable?", back: "A random variable that can take only a countable (often finite) set of distinct values, each with an associated probability." },
  { complexity: "simple_familiar", front: "What must the sum of all probabilities in a discrete probability function equal?", back: "1 (i.e. $\\sum p_i = 1$)." },
  { complexity: "simple_familiar", front: "What condition must every probability $p_i$ in a discrete probability distribution satisfy?", back: "$0 \\le p_i \\le 1$ for every outcome." },
  { complexity: "simple_familiar", front: "State the formula for the mean (expected value) of a discrete random variable $X$.", back: "$E(X) = \\mu = \\sum p_i x_i$" },
  { complexity: "simple_familiar", front: "State the formula for the variance of a discrete random variable $X$.", back: "$\\text{Var}(X) = \\sum p_i(x_i-\\mu)^2$" },
  { complexity: "simple_familiar", front: "State the formula for the standard deviation of a discrete random variable $X$.", back: "$\\sqrt{\\text{Var}(X)}$" },
  { complexity: "simple_familiar", front: "What is a uniform discrete random variable?", back: "One where every possible outcome has the same (equally likely) probability." },
  { complexity: "simple_familiar", front: "Define a Bernoulli random variable.", back: "A random variable with exactly two possible outcomes, usually coded as 'success' (1) and 'failure' (0)." },
  { complexity: "simple_familiar", front: "State the mean of a Bernoulli distribution with parameter $p$.", back: "$p$" },
  { complexity: "simple_familiar", front: "State the variance of a Bernoulli distribution with parameter $p$.", back: "$p(1-p)$" },
  { complexity: "simple_familiar", front: "What is a Bernoulli trial?", back: "A single trial with exactly two possible outcomes ('success' or 'failure'), where the probability of success is constant." },
  { complexity: "simple_familiar", front: "What conditions define a binomial random variable $X$?", back: "$X$ counts the number of successes $r$ in $n$ independent Bernoulli trials, each with the same probability of success $p$." },
  { complexity: "simple_familiar", front: "State the formula for $P(X=r)$ for a binomial random variable with parameters $n$ and $p$.", back: "$P(X=r) = \\binom{n}{r}p^r(1-p)^{n-r}$" },
  { complexity: "simple_familiar", front: "State the mean of a binomial distribution with parameters $n$ and $p$.", back: "$np$" },
  { complexity: "simple_familiar", front: "State the variance of a binomial distribution with parameters $n$ and $p$.", back: "$np(1-p)$" },
  { complexity: "simple_familiar", front: "What does $\\binom{n}{r}$ represent in the binomial probability formula?", back: "The number of ways of choosing $r$ successes from $n$ trials (the binomial coefficient)." },
  { complexity: "simple_familiar", front: "What does 'at least' mean in probability language, e.g. $P(X \\geq 3)$?", back: "Greater than or equal to — includes the stated value and all values above it." },
  { complexity: "simple_familiar", front: "What does 'at most' mean in probability language, e.g. $P(X \\leq 3)$?", back: "Less than or equal to — includes the stated value and all values below it." },
  { complexity: "simple_familiar", front: "What does 'between $a$ and $b$ inclusive' mean for a discrete random variable?", back: "$a \\leq X \\leq b$, including both endpoints $a$ and $b$." },
  { complexity: "simple_familiar", front: "How can relative frequencies from observed data be used in relation to a discrete random variable?", back: "They can be used as point estimates of the true probabilities associated with the random variable." },
  // complex_familiar
  { complexity: "complex_familiar", front: "A discrete random variable $X$ has $P(X=1)=0.2$, $P(X=2)=0.3$, $P(X=3)=k$, $P(X=4)=0.1$. Determine $k$, then calculate $E(X)$. (4 marks)", back: "1 mark: Probabilities sum to 1: $0.2+0.3+k+0.1=1 \\Rightarrow k=0.4$. 1 mark: $E(X) = 1(0.2)+2(0.3)+3(0.4)+4(0.1)$. 1 mark: $=0.2+0.6+1.2+0.4$. 1 mark: $E(X) = 2.4$." },
  { complexity: "complex_familiar", front: "A fair six-sided die is rolled. Let $X$ be the number of sixes obtained in 5 independent rolls. State the distribution of $X$ (including parameters), and calculate $P(X=2)$, correct to four decimal places. (4 marks)", back: "1 mark: $X \\sim \\text{Bi}(n=5, p=\\frac16)$. 1 mark: $P(X=2) = \\binom{5}{2}\\left(\\frac16\\right)^2\\left(\\frac56\\right)^3$. 1 mark: $=10 \\times \\frac{1}{36} \\times \\frac{125}{216} = \\frac{1250}{7776}$. 1 mark: $\\approx 0.1608$." },
  { complexity: "complex_familiar", front: "The number of faulty items in a batch is modelled by $X \\sim \\text{Bi}(n=20, p=0.05)$. Calculate the mean and standard deviation of $X$, correct to two decimal places. (3 marks)", back: "1 mark: $E(X) = np = 20(0.05) = 1$. 1 mark: $\\text{Var}(X) = np(1-p) = 20(0.05)(0.95) = 0.95$. 1 mark: $\\text{SD}(X) = \\sqrt{0.95} \\approx 0.97$." },
  { complexity: "complex_familiar", front: "A game costs \\$3 to play. A player wins \\$10 with probability $0.15$, wins \\$5 with probability $0.25$, and otherwise wins nothing. Let $X$ be the player's net profit. Determine the probability distribution of $X$ and calculate $E(X)$. (4 marks)", back: "1 mark: Net profit values: win \\$10 → $X=7$ (prob 0.15); win \\$5 → $X=2$ (prob 0.25); win nothing → $X=-3$ (prob $1-0.15-0.25=0.6$). 1 mark: $E(X) = 7(0.15)+2(0.25)+(-3)(0.6)$. 1 mark: $=1.05+0.5-1.8$. 1 mark: $E(X) = -0.25$, i.e. the player loses 25 cents on average per game." },
  // complex_unfamiliar
  { complexity: "complex_unfamiliar", front: "A quality-control inspector tests items where 8% are defective, one at a time, independently, until the first defective item is found. Let $Y$ be the number of items tested up to and including the first defective one. Explain why $Y$ does not satisfy the conditions required for a binomial random variable. (4 marks)", back: "1 mark: A binomial random variable requires a fixed, predetermined number of trials $n$. 1 mark: Here, the number of items tested is not fixed in advance — testing stops as soon as the first defective item appears, so the number of trials is itself random. 1 mark: The trials are still independent with a constant probability of 'success' (0.08) at each trial, satisfying two of the binomial conditions. 1 mark: However, because $n$ is not fixed, $Y$ does not satisfy all the conditions required for a binomial distribution." },
  { complexity: "complex_unfamiliar", front: "A factory packs biscuits into boxes of 12. Each biscuit independently has a $2\\%$ chance of being broken. A box is 'substandard' if it contains 3 or more broken biscuits. The factory processes 500 boxes per day. Estimate the number of substandard boxes produced per day, correct to the nearest whole box. (6 marks)", back: "1 mark: $X \\sim \\text{Bi}(n=12, p=0.02)$ models the number of broken biscuits per box. 1 mark: $P(X=0) = (0.98)^{12} \\approx 0.7847$. 1 mark: $P(X=1) = \\binom{12}{1}(0.02)(0.98)^{11} \\approx 0.1922$. 1 mark: $P(X=2) = \\binom{12}{2}(0.02)^2(0.98)^{10} \\approx 0.0216$. 1 mark: $P(X\\geq3) = 1-[P(X=0)+P(X=1)+P(X=2)] \\approx 1-0.9985 = 0.0015$. 1 mark: Expected substandard boxes per day $\\approx 500 \\times 0.0015 \\approx 0.77$, so approximately $1$ substandard box is produced per day." },
  { complexity: "complex_unfamiliar", front: "A basketball player has a $70\\%$ free-throw success rate, and each attempt is independent. In a game she attempts 8 free throws. Determine the minimum number of successful free throws $k$ such that $P(X \\geq k) < 0.5$, where $X$ is the number of successful throws. Justify your answer using calculated probabilities. (5 marks)", back: "1 mark: $X \\sim \\text{Bi}(n=8, p=0.7)$. 1 mark: $P(X=6) = \\binom86(0.7)^6(0.3)^2 \\approx 0.2965$, $P(X=7)=\\binom87(0.7)^7(0.3)^1\\approx0.1977$, $P(X=8)=(0.7)^8\\approx0.0576$. 1 mark: $P(X\\geq6) = P(6)+P(7)+P(8) \\approx 0.2965+0.1977+0.0576 = 0.5518$, which is not less than 0.5. 1 mark: $P(X\\geq7) = P(7)+P(8) \\approx 0.1977+0.0576 = 0.2553$, which is less than 0.5. 1 mark: Since $P(X\\geq6)\\geq0.5$ but $P(X\\geq7)<0.5$, the minimum value of $k$ is $7$." },
];

// ============================================================================
// U4 T1: Further integration
// ============================================================================
const MM_U4T1: SeedCard[] = [
  // simple_familiar
  { complexity: "simple_familiar", front: "State the fundamental theorem of calculus relating a definite integral to an antiderivative $F$.", back: "$\\int_a^b f(x)\\,dx = F(b)-F(a)$, where $F'(x)=f(x)$." },
  { complexity: "simple_familiar", front: "What does the definite integral $\\int_a^b f(x)\\,dx$ represent, when $f(x)>0$ on $[a,b]$?", back: "The area under the curve $y=f(x)$ between $x=a$ and $x=b$." },
  { complexity: "simple_familiar", front: "State the definite integral as a limit of a sum, using $\\sum f(x_i)\\delta x_i$.", back: "$\\int_a^b f(x)\\,dx = \\lim_{\\delta x_i \\to 0} \\sum f(x_i)\\,\\delta x_i$" },
  { complexity: "simple_familiar", front: "State the trapezoidal rule for approximating $\\int_a^b f(x)\\,dx$ with strip width $w$.", back: "$\\int_a^b f(x)\\,dx \\approx \\frac{w}{2}\\big[f(x_0)+2(f(x_1)+\\cdots+f(x_{n-1}))+f(x_n)\\big]$, where $w=\\frac{b-a}{n}$." },
  { complexity: "simple_familiar", front: "How is the strip width $w$ calculated for the trapezoidal rule with $n$ strips over $[a,b]$?", back: "$w = \\frac{b-a}{n}$" },
  { complexity: "simple_familiar", front: "How is total change calculated from a rate of change function $r(t)$ over an interval $[a,b]$?", back: "By evaluating the definite integral $\\int_a^b r(t)\\,dt$." },
  { complexity: "simple_familiar", front: "Evaluate $\\int_0^2 x^2\\,dx$.", back: "$\\left[\\frac{x^3}{3}\\right]_0^2 = \\frac{8}{3}-0 = \\frac{8}{3}$" },
  { complexity: "simple_familiar", front: "Evaluate $\\int_1^3 4\\,dx$.", back: "$[4x]_1^3 = 12-4=8$" },
  { complexity: "simple_familiar", front: "How do you find the area between two curves $y=f(x)$ and $y=g(x)$ (where $f(x)\\geq g(x)$) from $x=a$ to $x=b$?", back: "$\\int_a^b \\big(f(x)-g(x)\\big)\\,dx$" },
  { complexity: "simple_familiar", front: "What must be true for $\\int_a^b f(x)\\,dx$ to directly equal the area under the curve $y=f(x)$?", back: "$f(x)$ must be positive (above the $x$-axis) over the whole interval $[a,b]$." },
  { complexity: "simple_familiar", front: "How can the displacement of a moving object be found from its velocity function $v(t)$ over $[a,b]$?", back: "By evaluating the definite integral $\\int_a^b v(t)\\,dt$." },
  { complexity: "simple_familiar", front: "Does increasing the number of strips $n$ in the trapezoidal rule generally improve or worsen the approximation of a definite integral?", back: "It generally improves the approximation, since narrower strips follow the curve more closely." },
  { complexity: "simple_familiar", front: "State the notation used for the definite integral of $f(x)$ from $x=a$ to $x=b$.", back: "$\\int_a^b f(x)\\,dx$" },
  { complexity: "simple_familiar", front: "In the sum $\\sum f(x_i)\\delta x_i$ used to estimate area under a curve, what does $\\delta x_i$ represent?", back: "The width of the $i$-th narrow rectangular strip." },
  { complexity: "simple_familiar", front: "Evaluate $\\int_0^{\\pi} \\sin(x)\\,dx$.", back: "$[-\\cos(x)]_0^{\\pi} = (-\\cos\\pi)-(-\\cos0) = 1-(-1)=2$" },
  { complexity: "simple_familiar", front: "State the relationship between marginal rate of change and total change over an interval.", back: "Integrating a marginal (instantaneous) rate of change over an interval gives the total change in the quantity over that interval." },
];

// ============================================================================
// U4 T2: Trigonometry
// ============================================================================
const MM_U4T2: SeedCard[] = [
  // simple_familiar
  { complexity: "simple_familiar", front: "State the sine rule.", back: "$\\frac{a}{\\sin(A)} = \\frac{b}{\\sin(B)} = \\frac{c}{\\sin(C)}$" },
  { complexity: "simple_familiar", front: "State the cosine rule for finding a side, $c^2 = ?$", back: "$c^2 = a^2+b^2-2ab\\cos(C)$" },
  { complexity: "simple_familiar", front: "State the cosine rule rearranged to find an angle.", back: "$\\cos(C) = \\frac{a^2+b^2-c^2}{2ab}$" },
  { complexity: "simple_familiar", front: "State the formula for the area of a triangle given two sides and the included angle.", back: "$\\text{Area} = \\frac12 bc\\sin(A)$" },
  { complexity: "simple_familiar", front: "When should the sine rule be used to solve a triangle rather than the cosine rule?", back: "When you know two angles and one side (AAS/ASA), or two sides and a non-included angle (SSA)." },
  { complexity: "simple_familiar", front: "When should the cosine rule be used to solve a triangle rather than the sine rule?", back: "When you know all three sides (SSS), or two sides and the included angle (SAS)." },
  { complexity: "simple_familiar", front: "What is the 'ambiguous case' of the sine rule?", back: "A situation (given SSA — two sides and a non-included angle) where two different triangles can satisfy the given information, giving two possible solutions for an unknown angle." },
  { complexity: "simple_familiar", front: "In a bearing problem, what does a bearing of $135^\\circ$ mean?", back: "A direction measured clockwise from north, $135^\\circ$ around from north (i.e. south-east)." },
  { complexity: "simple_familiar", front: "Define the angle of elevation.", back: "The angle measured upward from the horizontal to a line of sight to an object above the observer." },
  { complexity: "simple_familiar", front: "Define the angle of depression.", back: "The angle measured downward from the horizontal to a line of sight to an object below the observer." },
  { complexity: "simple_familiar", front: "What is true about the angle of elevation from point A to point B and the angle of depression from point B to point A?", back: "They are equal (alternate angles between the horizontal at A and the horizontal at B, cut by the line of sight)." },
  { complexity: "simple_familiar", front: "For a triangle with sides $a=7$, $b=9$ and included angle $C=40^\\circ$, state the correct substitution into the area formula (do not evaluate).", back: "$\\text{Area} = \\frac12(7)(9)\\sin(40^\\circ)$" },
  { complexity: "simple_familiar", front: "How many independent pieces of information (sides/angles) are generally needed to fully solve a triangle?", back: "Three, including at least one side length." },
];

// ============================================================================
// U4 T3: Continuous random variables and the normal distribution
// ============================================================================
const MM_U4T3: SeedCard[] = [
  // simple_familiar
  { complexity: "simple_familiar", front: "What is a probability density function (pdf) for a continuous random variable?", back: "A function $p(x)$ such that the probability of $X$ lying in an interval equals the area under $p(x)$ over that interval; total area under the curve equals 1." },
  { complexity: "simple_familiar", front: "What must be true of the total area under a probability density function?", back: "It must equal 1." },
  { complexity: "simple_familiar", front: "For a continuous random variable, what is $P(X=a)$ for any single exact value $a$?", back: "$0$ — probability is only meaningfully associated with an interval, not a single point, for a continuous random variable." },
  { complexity: "simple_familiar", front: "State the formula for the expected value of a continuous random variable $X$ with pdf $p(x)$.", back: "$E(X) = \\mu = \\int_{-\\infty}^{\\infty} x\\,p(x)\\,dx$" },
  { complexity: "simple_familiar", front: "State the formula for the variance of a continuous random variable $X$ with pdf $p(x)$ and mean $\\mu$.", back: "$\\text{Var}(X) = \\sigma^2 = \\int_{-\\infty}^{\\infty} (x-\\mu)^2 p(x)\\,dx$" },
  { complexity: "simple_familiar", front: "Define a $z$-value (z-score) for a normally distributed variable.", back: "The number of standard deviations a value $x$ lies above or below the mean, $z=\\frac{x-\\mu}{\\sigma}$." },
  { complexity: "simple_familiar", front: "What is a $z$-value used for?", back: "To compare values from different normal distributions on a common, standardised scale." },
  { complexity: "simple_familiar", front: "State the notation used to describe a normal random variable $X$ with mean $\\mu$ and standard deviation $\\sigma$.", back: "$X \\sim N(\\mu, \\sigma^2)$" },
  { complexity: "simple_familiar", front: "What shape does the graph of a normal distribution's probability density function have?", back: "A symmetric, bell-shaped curve, centred on the mean $\\mu$." },
  { complexity: "simple_familiar", front: "About what proportion of values in a normal distribution lie within one standard deviation of the mean?", back: "Approximately 68%." },
  { complexity: "simple_familiar", front: "About what proportion of values in a normal distribution lie within two standard deviations of the mean?", back: "Approximately 95%." },
  { complexity: "simple_familiar", front: "About what proportion of values in a normal distribution lie within three standard deviations of the mean?", back: "Approximately 99.7%." },
  { complexity: "simple_familiar", front: "State the mean and standard deviation of the standard normal distribution.", back: "Mean $=0$, standard deviation $=1$." },
  { complexity: "simple_familiar", front: "Give an example of a real-world phenomenon typically suitable for modelling by a normal random variable.", back: "Naturally occurring, continuously varying measurements such as adult height, or measurement errors (any reasonable example)." },
  { complexity: "simple_familiar", front: "What is a quantile of a normal distribution?", back: "The value of $X$ below which a given proportion (probability) of the distribution lies." },
  { complexity: "simple_familiar", front: "For $X \\sim N(\\mu, \\sigma^2)$, what is the $z$-value corresponding to $x=\\mu$?", back: "$z=0$" },
  { complexity: "simple_familiar", front: "Define the cumulative distribution function of a continuous random variable.", back: "A function $F(x) = P(X \\leq x)$ giving the probability that $X$ takes a value less than or equal to $x$." },
  { complexity: "simple_familiar", front: "How is the cumulative distribution function $F(x)$ related to the probability density function $p(x)$?", back: "$F(x) = \\int_{-\\infty}^{x} p(t)\\,dt$ — the cumulative distribution function is the integral (running total area) of the probability density function." },
  // complex_unfamiliar
  { complexity: "complex_unfamiliar", front: "A light bulb's lifetime is modelled by $X \\sim N(1200, 90^2)$ hours. A quality manager wants no more than $2\\%$ of bulbs to fail before the warranted lifetime. Using $P(X < 1200 - 2.05\\sigma) \\approx 0.02$, determine an appropriate warranted lifetime, correct to the nearest hour, and explain the reasoning. (5 marks)", back: "1 mark: The manager wants $P(X<L)\\leq0.02$, and is given $P(X<\\mu-2.05\\sigma)\\approx0.02$, so $L=\\mu-2.05\\sigma$. 1 mark: Substituting $\\mu=1200$, $\\sigma=90$: $L=1200-2.05(90)=1200-184.5$. 1 mark: $L=1015.5\\approx1016$ hours (nearest hour). 1 mark: This works because subtracting a suitable multiple of the standard deviation from the mean locates the point below which only the desired small proportion of the distribution lies. 1 mark: Setting the warranty at this point ensures approximately 2% or fewer bulbs are expected to fail before it expires." },
  { complexity: "complex_unfamiliar", front: "Machine A fills bottles $X \\sim N(500, 4^2)$ mL and Machine B fills $Y \\sim N(502, 9^2)$ mL. A bottle is rejected below 495 mL. Calculate the $z$-value for the rejection threshold on each machine, and determine which machine is more likely to produce a rejected bottle. (5 marks)", back: "1 mark: For Machine A: $z_A = \\frac{495-500}{4} = -1.25$. 1 mark: For Machine B: $z_B = \\frac{495-502}{9} \\approx -0.78$. 1 mark: A $z$-value closer to $0$ corresponds to a threshold that is less extreme relative to that machine's own distribution, i.e. a larger probability of falling below it. 1 mark: Since $-0.78$ is closer to $0$ than $-1.25$, Machine B's 495 mL threshold is less extreme (in standard deviations) than Machine A's. 1 mark: Machine B is therefore more likely to produce a rejected bottle, despite having a higher mean, because its much larger standard deviation (9 mL vs 4 mL) makes low fills relatively more common." },
  { complexity: "complex_unfamiliar", front: "Standardised test scores are $X \\sim N(65, 12^2)$. A university admits only the top $10\\%$ of scorers, using the fact that the $z$-value for the 90th percentile of the standard normal distribution is approximately $1.28$. Determine the minimum entry score, correct to the nearest whole mark. (4 marks)", back: "1 mark: The top 10% corresponds to the 90th percentile, with $z \\approx 1.28$. 1 mark: Cut-off score $= \\mu + z\\sigma = 65 + 1.28(12)$. 1 mark: $=65+15.36=80.36$. 1 mark: The minimum score required for entry is approximately $80$ marks (nearest whole mark)." },
  { complexity: "complex_unfamiliar", front: "Metal rods have lengths $X \\sim N(300, 2.5^2)$ mm and are rejected if more than $5$ mm from the target of $300$ mm. Explain, using $z$-values, why this is equivalent to rejecting rods more than $2$ standard deviations from the mean, and state approximately what proportion of rods are rejected. (4 marks)", back: "1 mark: The rejection threshold of $5$mm corresponds to $z = \\frac{5}{2.5} = 2$ standard deviations from the mean. 1 mark: So 'more than 5mm from 300mm' is exactly equivalent to 'more than 2 standard deviations from the mean' for this distribution. 1 mark: By the empirical rule, approximately 95% of values in a normal distribution lie within 2 standard deviations of the mean. 1 mark: So approximately $100\\%-95\\%=5\\%$ of rods are expected to be rejected." },
  { complexity: "complex_unfamiliar", front: "Fitness test scores are $X \\sim N(50, 8^2)$. A coach wants the middle $50\\%$ of athletes, using $z$-values of approximately $\\pm 0.67$ bounding the middle 50% of a standard normal distribution. Determine the score range defining this middle 50%, correct to the nearest whole number. (4 marks)", back: "1 mark: Lower bound: $\\mu - 0.67\\sigma = 50 - 0.67(8) = 50-5.36$. 1 mark: $=44.64 \\approx 45$ (nearest whole number). 1 mark: Upper bound: $\\mu+0.67\\sigma = 50+5.36 = 55.36 \\approx 55$. 1 mark: The middle 50% of athletes have fitness test scores approximately between $45$ and $55$." },
];

// ============================================================================
// U4 T4: Sampling and proportions — nothing at all before this run
// ============================================================================
const MM_U4T4: SeedCard[] = [
  // simple_familiar
  { complexity: "simple_familiar", front: "Define a random sample.", back: "A sample selected such that every member of the population has a known, non-zero (often equal) chance of being chosen, ensuring the selection is not influenced by human choice or bias." },
  { complexity: "simple_familiar", front: "What is meant by bias in sampling?", back: "A systematic tendency for a sample to misrepresent the population, caused by a non-random or flawed selection procedure." },
  { complexity: "simple_familiar", front: "Give one procedure that helps ensure a sample is random.", back: "Using a random number generator (or table) to select individuals from a numbered list of the whole population (simple random sampling)." },
  { complexity: "simple_familiar", front: "Define the sample proportion $\\hat{p}$.", back: "The proportion of a sample that has a particular characteristic, $\\hat{p} = \\frac{x}{n}$, where $x$ is the number of successes and $n$ is the sample size." },
  { complexity: "simple_familiar", front: "State the formula for the mean of the sample proportion $\\hat{p}$.", back: "$E(\\hat{p}) = p$, the population proportion." },
  { complexity: "simple_familiar", front: "State the formula for the standard deviation of the sample proportion $\\hat{p}$.", back: "$\\sqrt{\\frac{p(1-p)}{n}}$" },
  { complexity: "simple_familiar", front: "Why is the sample proportion $\\hat{p}$ described as a random variable?", back: "Because its value varies from sample to sample — different random samples of the same size generally give different values of $\\hat{p}$." },
  { complexity: "simple_familiar", front: "For what kind of samples does the distribution of $\\hat{p}$ become approximately normal?", back: "For large sample sizes $n$." },
  { complexity: "simple_familiar", front: "State the standardised formula used to examine how closely the distribution of $\\hat{p}$ approximates a standard normal distribution.", back: "$\\frac{\\hat{p}-p}{\\sqrt{\\hat{p}(1-\\hat{p})/n}}$" },
  { complexity: "simple_familiar", front: "What two factors affect how closely the distribution of $\\hat{p}$ approximates normality?", back: "The sample size $n$ and the population proportion $p$ (closeness of the approximation depends on both)." },
  { complexity: "simple_familiar", front: "If a survey samples $n=200$ people and $x=84$ respond 'yes', calculate the sample proportion $\\hat{p}$.", back: "$\\hat{p} = \\frac{84}{200} = 0.42$" },
  { complexity: "simple_familiar", front: "Name one type of distribution whose random samples might be displayed graphically to examine sampling behaviour.", back: "Uniform, Bernoulli, binomial or normal (any one)." },
  { complexity: "simple_familiar", front: "Why does using a convenience sample (e.g. surveying only people at a shopping centre on a weekday morning) typically introduce bias?", back: "Because it does not give every member of the population an equal or known chance of selection — the sample systematically over-represents certain groups (e.g. those free on weekday mornings)." },
  { complexity: "simple_familiar", front: "As sample size $n$ increases, what happens to the standard deviation of $\\hat{p}$, $\\sqrt{p(1-p)/n}$?", back: "It decreases — larger samples give a sample proportion that varies less from sample to sample." },
  // complex_familiar
  { complexity: "complex_familiar", front: "A random sample of 150 shoppers finds that 96 prefer online shopping. Calculate the sample proportion $\\hat{p}$ and its standard deviation, correct to four decimal places. (3 marks)", back: "1 mark: $\\hat{p} = \\frac{96}{150} = 0.64$. 1 mark: $\\text{SD}(\\hat{p}) = \\sqrt{\\frac{0.64(0.36)}{150}} = \\sqrt{0.001536}$. 1 mark: $\\approx 0.0392$." },
  { complexity: "complex_familiar", front: "Explain why selecting participants only from people who answer their landline phone during business hours would introduce bias into a sample estimating support for a policy. (2 marks)", back: "1 mark: This method excludes anyone without a landline or who is unavailable during business hours (e.g. people at work, younger people who use mobiles only), so not every member of the population has an equal chance of selection. 1 mark: The resulting sample is likely to systematically over-represent certain groups (e.g. retirees, people working from home), skewing the estimated proportion away from the true population proportion." },
  { complexity: "complex_familiar", front: "A random sample of $n=80$ is taken from a population with true proportion $p=0.3$. State the mean and standard deviation of the distribution of $\\hat{p}$, correct to four decimal places, and comment on whether a normal approximation is likely to be appropriate. (4 marks)", back: "1 mark: $E(\\hat{p}) = p = 0.3$. 1 mark: $\\text{SD}(\\hat{p}) = \\sqrt{\\frac{0.3(0.7)}{80}} = \\sqrt{0.002625} \\approx 0.0512$. 1 mark: Since $np=80(0.3)=24$ and $n(1-p)=80(0.7)=56$ are both comfortably large, the sample size is large enough for the distribution of $\\hat{p}$ to be reasonably approximated by a normal distribution. 1 mark: This means probabilities and intervals involving $\\hat{p}$ can be estimated using the normal distribution with the calculated mean and standard deviation." },
  { complexity: "complex_familiar", front: "Explain why two independent random samples of size $n=50$ taken from the same population with true proportion $p=0.5$ are likely to give different values of $\\hat{p}$. (2 marks)", back: "1 mark: $\\hat{p}$ is a random variable — its value depends on which particular individuals happen to be selected in each sample, and this selection varies by chance between samples. 1 mark: Even though both samples are drawn from a population with the same true proportion $p$, sampling variability means each sample's specific composition differs, producing different observed $\\hat{p}$ values around the same true mean $p$." },
  { complexity: "complex_familiar", front: "Observed sample proportions over several hours of quality-control testing are 0.05, 0.08, 0.03, 0.10, 0.06. Estimate the population proportion $p$, and explain why averaging multiple sample proportions gives a better estimate than a single sample. (3 marks)", back: "1 mark: Average $\\hat{p} = \\frac{0.05+0.08+0.03+0.10+0.06}{5} = \\frac{0.32}{5} = 0.064$, giving an estimate of $p \\approx 0.064$. 1 mark: A single sample's $\\hat{p}$ is affected by sampling variability and may lie some distance from the true $p$ by chance. 1 mark: Averaging several independent samples reduces the effect of this random variability, giving an estimate that tends to be closer to the true population proportion $p$." },
  { complexity: "complex_familiar", front: "Explain why a sample proportion $\\hat{p}$ from a sample of size $n=20$ is less reliable as an estimate of $p$ than one from a sample of size $n=500$, referring to the standard deviation formula. (2 marks)", back: "1 mark: $\\text{SD}(\\hat{p}) = \\sqrt{p(1-p)/n}$ decreases as $n$ increases, since $n$ is in the denominator. 1 mark: The larger sample ($n=500$) therefore has a smaller standard deviation, meaning its $\\hat{p}$ values cluster more tightly around the true $p$, making it a more reliable estimate than the $n=20$ sample." },
  { complexity: "complex_familiar", front: "A researcher generates 100 simulated random samples of size $n=40$ from a population with $p=0.5$, and plots the resulting $\\hat{p}$ values in a histogram. Describe the expected shape and explain why. (3 marks)", back: "1 mark: The histogram would be expected to show an approximately symmetric, bell-shaped (normal-like) distribution centred near $\\hat{p}=0.5$. 1 mark: This is because with $p=0.5$ and $n=40$ large enough (np and n(1-p) both well above 5), the sampling distribution of $\\hat{p}$ is approximately normal. 1 mark: The centre of the distribution should be close to the true population proportion $p=0.5$, since $E(\\hat{p})=p$." },
  { complexity: "complex_familiar", front: "A sample gives $\\hat{p}=0.45$ from $n=120$ where the true proportion is $p=0.5$. Calculate the standardised value $\\frac{\\hat{p}-p}{\\sqrt{\\hat{p}(1-\\hat{p})/n}}$, correct to two decimal places, and interpret it. (3 marks)", back: "1 mark: $\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}} = \\sqrt{\\frac{0.45(0.55)}{120}} = \\sqrt{0.0020625} \\approx 0.0454$. 1 mark: Standardised value $= \\frac{0.45-0.5}{0.0454} \\approx -1.10$. 1 mark: This means the observed sample proportion is about $1.10$ standard deviations below the true population proportion — a moderate but not extreme deviation, consistent with ordinary sampling variability." },
  // complex_unfamiliar
  { complexity: "complex_unfamiliar", front: "A school of 1200 students wants to estimate the proportion using public transport. The principal proposes surveying the first 100 students who arrive on a given morning. Evaluate whether this is likely to produce a reliable estimate, and propose a better method. (5 marks)", back: "Model response: This method is unlikely to be reliable, because students who arrive early are not representative of the whole student population with respect to transport mode — students using public transport may be more or less likely to arrive at a particular time depending on bus/train schedules. This introduces bias: the sample does not give every student an equal, known chance of selection, so the resulting $\\hat{p}$ could systematically over- or under-estimate the true proportion. A better method: assign every student a number and use a random number generator to select 100 students from the full list of 1200 (simple random sampling), giving every student an equal chance of selection and avoiding the arrival-time bias entirely. Marking points: (1) identifies that arrival time correlates with transport mode, creating bias; (2) explains the sample does not give equal/known selection chance to all students; (3) explains the likely mechanism/direction of bias; (4) proposes a specific, genuinely random alternative method; (5) explains why the proposed method removes the identified bias." },
  { complexity: "complex_unfamiliar", front: "A large survey of $n=1000$ voters finds $\\hat{p}=0.52$ supporting a proposal; a smaller survey of $n=40$ finds $\\hat{p}=0.65$. A journalist claims the smaller survey shows 'stronger support' and should be trusted more because the number is higher. Evaluate this claim using $\\text{SD}(\\hat{p})$ for each survey. (5 marks)", back: "Model response: The journalist's claim is not well supported. $\\text{SD}(\\hat{p})$ for the large survey is $\\sqrt{\\frac{0.52(0.48)}{1000}} \\approx 0.0158$, while for the small survey it is $\\sqrt{\\frac{0.65(0.35)}{40}} \\approx 0.0754$ — nearly five times larger. This means the small survey's $\\hat{p}$ is far more variable and could easily have landed well away from the true population proportion purely by chance, whereas the large survey's $\\hat{p}$ is a much more precise estimate. A higher observed $\\hat{p}$ in a small, high-variability sample is not evidence of 'stronger' true support. Marking points: (1) calculates $\\text{SD}(\\hat p)$ for the large survey; (2) calculates $\\text{SD}(\\hat p)$ for the small survey; (3) compares the two, noting the small survey's much greater variability; (4) explains a higher $\\hat p$ in a high-variability sample isn't strong evidence of higher true support; (5) reaches a clear judgement, favouring the large survey's reliability." },
  { complexity: "complex_unfamiliar", front: "A manufacturer believes 10% of light bulbs are defective ($p=0.10$). Quality control tests random samples of $n=25$ bulbs each hour. Explain why the normal approximation for $\\hat{p}$ may NOT be appropriate here, referring to the relevant condition, and describe the effect on interpreting results. (5 marks)", back: "Model response: The closeness of the normal approximation for $\\hat{p}$ depends on both $n$ and $p$, and a common guide requires both $np$ and $n(1-p)$ to be sufficiently large (conventionally at least 5). Here $np = 25(0.10) = 2.5$, well below this threshold, even though $n(1-p) = 22.5$ is large. Because $np$ is small, the true sampling distribution of $\\hat{p}$ is likely noticeably skewed rather than symmetric, so approximating it as normal could give inaccurate probability estimates. This matters practically because quality-control decisions based on a poorly-fitting normal approximation could trigger false alarms or miss genuine problems. Marking points: (1) states the relevant condition; (2) calculates $np=2.5$ correctly; (3) identifies this fails the guideline despite $n(1-p)$ being adequate; (4) explains the practical consequence (skewed distribution, unreliable estimates); (5) connects this to a real consequence for decision-making." },
  { complexity: "complex_unfamiliar", front: "A student collects a random sample of $n=30$ and calculates $\\hat{p}=0.20$, arguing 'the true population proportion must be exactly 0.20.' Evaluate this claim using the concept of $\\hat{p}$ as a random variable. (4 marks)", back: "Model response: This claim is not well supported. $\\hat{p}$ is a random variable whose value varies from sample to sample — it is an estimate of the population proportion $p$, not a guaranteed exact measurement of $p$ itself. Different random samples of the same size would very likely produce different values of $\\hat{p}$, clustered around the true $p$ but rarely landing exactly on it, especially with a modest sample size of $n=30$. The correct interpretation is that $\\hat{p}=0.20$ is a point estimate of $p$, with sampling uncertainty, not proof that $p$ equals exactly 0.20. Marking points: (1) states a clear judgement rejecting the claim; (2) explains $\\hat{p}$ is a random variable that varies between samples; (3) explains $\\hat{p}$ is a point estimate with sampling variability, not an exact value; (4) notes this uncertainty is more pronounced for a small sample like $n=30$." },
  { complexity: "complex_unfamiliar", front: "A researcher repeatedly draws random samples of $n=15$ from a population with $p=0.05$, and plots the standardised values $\\frac{\\hat{p}-p}{\\sqrt{\\hat{p}(1-\\hat{p})/n}}$, expecting them to look approximately standard normal, but finds the plot noticeably skewed. Explain, using $n$ and $p$, why this is expected rather than a simulation error. (4 marks)", back: "Model response: This outcome is expected, not an error. The closeness of the standardised distribution of $\\hat{p}$ to standard normal depends on both $n$ and $p$ — the approximation is poorest when $p$ is close to $0$ or $1$ and/or $n$ is small, since the underlying number of successes is then constrained close to a boundary, producing skew. With $n=15$ and $p=0.05$, $np = 0.75$, far below the usual guideline of at least $5$, so a poor normal approximation is exactly what should be expected for this combination, regardless of how correctly the simulation was carried out. Marking points: (1) states this is expected, not a simulation error; (2) explains the approximation depends on both $n$ and $p$; (3) calculates or references $np=0.75$ as evidence the guideline is failed; (4) explains why small $np$ produces skew rather than a symmetric normal shape." },
];

// ============================================================================
// U4 T5: Interval estimates for proportions — nothing at all before this run
// ============================================================================
const MM_U4T5: SeedCard[] = [
  // simple_familiar
  { complexity: "simple_familiar", front: "Define an interval estimate for a population parameter.", back: "A range of values, calculated from sample data, believed to contain the true population parameter with a stated level of confidence." },
  { complexity: "simple_familiar", front: "State the formula for an approximate confidence interval for a population proportion $p$.", back: "$\\left(\\hat{p} - z\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}},\\ \\hat{p} + z\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}}\\right)$" },
  { complexity: "simple_familiar", front: "State the formula for the approximate margin of error for a sample proportion.", back: "$z\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}}$" },
  { complexity: "simple_familiar", front: "What does $z$ represent in the confidence interval formula for a proportion?", back: "The appropriate quantile of the standard normal distribution corresponding to the chosen confidence level." },
  { complexity: "simple_familiar", front: "State the value of $z$ used for a 95% confidence interval.", back: "$z \\approx 1.96$" },
  { complexity: "simple_familiar", front: "State the value of $z$ used for a 90% confidence interval.", back: "$z \\approx 1.645$" },
  { complexity: "simple_familiar", front: "State the value of $z$ used for a 99% confidence interval.", back: "$z \\approx 2.576$" },
  { complexity: "simple_familiar", front: "What happens to the margin of error as the confidence level increases (e.g. from 90% to 99%), all else being equal?", back: "The margin of error increases, since a higher confidence level requires a larger $z$-value, producing a wider interval." },
  { complexity: "simple_familiar", front: "What happens to the margin of error as the sample size $n$ increases, all else being equal?", back: "The margin of error decreases, since $n$ appears in the denominator inside the square root." },
  { complexity: "simple_familiar", front: "What is meant by saying we are '95% confident' that an interval contains the true population proportion?", back: "That if this sampling and interval-construction process were repeated many times, approximately 95% of the resulting intervals would contain the true population proportion $p$." },
  { complexity: "simple_familiar", front: "Is it true that every confidence interval calculated from a sample contains the true population proportion $p$?", back: "No — most, but not all, confidence intervals contain $p$; some samples by chance produce intervals that miss it." },
  { complexity: "simple_familiar", front: "Which value is used in place of the true $p$ when calculating a confidence interval for a proportion, since $p$ is unknown?", back: "The sample proportion $\\hat{p}$." },
  { complexity: "simple_familiar", front: "Name the two quantities whose product gives the margin of error.", back: "The $z$-value (for the chosen confidence level) and the standard error $\\sqrt{\\hat{p}(1-\\hat{p})/n}$." },
  { complexity: "simple_familiar", front: "A sample gives $\\hat{p}=0.4$ with margin of error $0.05$. State the resulting confidence interval.", back: "$(0.35, 0.45)$" },
  // complex_familiar
  { complexity: "complex_familiar", front: "A random sample of $n=200$ finds $\\hat{p}=0.35$ support a proposal. Calculate a 95% confidence interval for the true proportion, correct to three decimal places. (4 marks)", back: "1 mark: $\\text{SE} = \\sqrt{\\frac{0.35(0.65)}{200}} = \\sqrt{0.0011375} \\approx 0.0337$. 1 mark: Margin of error $= 1.96 \\times 0.0337 \\approx 0.0661$. 1 mark: $CI = (0.35-0.0661,\\ 0.35+0.0661)$. 1 mark: $\\approx (0.284,\\ 0.416)$." },
  { complexity: "complex_familiar", front: "A sample of $n=500$ gives $\\hat{p}=0.62$. Calculate the margin of error for a 90% confidence interval, correct to four decimal places. (3 marks)", back: "1 mark: $\\text{SE} = \\sqrt{\\frac{0.62(0.38)}{500}} = \\sqrt{0.0004712} \\approx 0.0217$. 1 mark: Margin of error $= 1.645 \\times 0.0217$. 1 mark: $\\approx 0.0357$." },
  { complexity: "complex_familiar", front: "Survey A has $n=100$ and Survey B has $n=900$, both $\\hat{p}=0.5$. Calculate the margin of error for each at the 95% confidence level, correct to four decimal places, and compare the widths of the resulting confidence intervals. (4 marks)", back: "1 mark: Survey A: $\\text{SE}=\\sqrt{0.25/100}=0.05$, margin of error $=1.96(0.05)=0.098$. 1 mark: Survey B: $\\text{SE}=\\sqrt{0.25/900}\\approx0.0167$, margin of error $=1.96(0.0167)\\approx0.0327$. 1 mark: Survey B's margin of error is roughly a third of Survey A's, since $n$ is 9 times larger and $\\text{SE}$ scales with $1/\\sqrt{n}$. 1 mark: Survey B's confidence interval is therefore considerably narrower (more precise) than Survey A's, despite using the same confidence level." },
  { complexity: "complex_familiar", front: "A pollster wants the margin of error for a 95% confidence interval to be no more than $0.03$, given a preliminary estimate of $\\hat{p}=0.5$. Show that $n=1068$ satisfies this requirement, and explain what happens if a smaller $n$ is used. (4 marks)", back: "1 mark: Require $1.96\\sqrt{\\frac{0.5(0.5)}{n}} \\leq 0.03$. 1 mark: Rearranging: $\\sqrt{\\frac{0.25}{n}} \\leq \\frac{0.03}{1.96} \\approx 0.015306$, so $\\frac{0.25}{n} \\leq 0.0002343$, giving $n \\geq \\frac{0.25}{0.0002343} \\approx 1067.2$. 1 mark: Since $n$ must be a whole number at least this large, $n=1068$ is the smallest sample size satisfying the requirement. 1 mark: A smaller $n$ would make $\\frac{1}{\\sqrt n}$ larger, producing a margin of error greater than the required $0.03$." },
  { complexity: "complex_familiar", front: "A 99% confidence interval for a proportion is $(0.41, 0.59)$ from $n=400$. Determine $\\hat{p}$ and the margin of error used. (2 marks)", back: "1 mark: $\\hat{p}$ is the midpoint of the interval: $\\hat{p} = \\frac{0.41+0.59}{2} = 0.5$. 1 mark: The margin of error is half the interval width: $\\frac{0.59-0.41}{2} = 0.09$." },
  { complexity: "complex_familiar", front: "A researcher calculates a 95% confidence interval for a proportion as $(0.20, 0.30)$. A colleague claims this means 'there is a 95% probability that the true proportion lies between 0.20 and 0.30.' Explain why this is technically incorrect, and state the correct interpretation. (3 marks)", back: "1 mark: The true population proportion $p$ is a fixed (though unknown) value, not a random variable — once the interval has been calculated, $p$ either is or isn't in it, so a probability cannot meaningfully be assigned to this fixed fact. 1 mark: The 95% refers to the long-run behaviour of the method: if many random samples were taken and an interval calculated the same way from each, approximately 95% of those intervals would contain the true $p$. 1 mark: Correct interpretation: we are 95% confident this particular interval contains the true population proportion, based on the reliability of the method used — not a 95% probability statement about this one fixed interval." },
  { complexity: "complex_familiar", front: "A sample of $n=250$ gives $\\hat{p}=0.18$. Calculate the width of the 95% confidence interval for the population proportion, correct to three decimal places. (3 marks)", back: "1 mark: $\\text{SE} = \\sqrt{\\frac{0.18(0.82)}{250}} = \\sqrt{0.0005904} \\approx 0.0243$. 1 mark: Margin of error $=1.96(0.0243) \\approx 0.0476$. 1 mark: Width of the interval $= 2 \\times 0.0476 \\approx 0.095$." },
  { complexity: "complex_familiar", front: "Explain why the confidence interval formula $\\left(\\hat p-z\\sqrt{\\hat p(1-\\hat p)/n},\\ \\hat p + z\\sqrt{\\hat p(1-\\hat p)/n}\\right)$ uses $\\hat{p}$ rather than $p$ inside the square root. (2 marks)", back: "1 mark: The true population proportion $p$ is unknown — it is exactly what the interval is trying to estimate, so it cannot be used directly in the calculation. 1 mark: The sample proportion $\\hat{p}$ is used as the best available estimate of $p$ to calculate the standard error, since it is the only value actually known from the sample data." },
  // complex_unfamiliar
  { complexity: "complex_unfamiliar", front: "A council surveys 300 randomly selected residents and finds 45% support a new development. Calculate a 95% confidence interval for the true proportion, and use it to determine whether the council can be confident a majority (more than 50%) of residents oppose the development. (6 marks)", back: "Model response: $\\text{SE} = \\sqrt{\\frac{0.45(0.55)}{300}} \\approx 0.0287$. Margin of error $=1.96(0.0287) \\approx 0.0563$. The 95% confidence interval for the proportion supporting the development is $(0.45-0.0563,\\ 0.45+0.0563) \\approx (0.394,\\ 0.506)$. Since this interval extends up to about $0.506$ — just above $0.5$ — it is still plausible that true support is slightly above 50%, meaning opposition could be slightly below 50%. Because the interval includes values on both sides of $0.5$, the council cannot be confident a majority oppose the development; the data is consistent with the vote being close to an even split, or even slightly in favour. Marking points: (1) calculates SE correctly; (2) calculates margin of error correctly; (3) calculates the confidence interval correctly; (4) recognises the interval straddles the 50/50 threshold; (5) correctly reasons majority opposition cannot be confidently concluded; (6) states a clear, justified conclusion referencing the calculated interval." },
  { complexity: "complex_unfamiliar", front: "A university claims '95% confidence intervals are correct 95% of the time.' A colleague says this is misleading. Evaluate this concern, explaining what the 95% actually refers to and one implication for interpreting a single survey's result. (5 marks)", back: "Model response: The colleague's concern is valid. The 95% actually refers to the long-run performance of the interval-construction procedure: if the same sampling and calculation process were repeated many times, approximately 95% of the resulting intervals would contain the true population proportion. For any single survey, the resulting interval either does or does not contain the true value — there is no ongoing 95% chance attached to that one specific interval once calculated. One implication: even with a sound method, roughly 1 in 20 confidence intervals calculated this way are expected to simply miss the true value by chance, not due to any flaw in that particular survey. Marking points: (1) agrees the statement is misleading with justification; (2) explains 95% refers to the long-run frequency of the method producing intervals containing the true value; (3) explains a single calculated interval either does or does not contain the true value; (4) states the correct implication (about 1 in 20 intervals will miss by chance); (5) connects this to how a single survey result should be interpreted." },
  { complexity: "complex_unfamiliar", front: "A researcher wants to halve the margin of error of a confidence interval for a proportion without changing the confidence level. Determine the factor by which the sample size $n$ must be increased, and justify algebraically. (5 marks)", back: "Model response: Margin of error $=z\\sqrt{\\frac{\\hat p(1-\\hat p)}{n}}$, proportional to $\\frac{1}{\\sqrt n}$ when $z$ and $\\hat p$ are fixed. To halve the margin of error: $\\frac{1}{\\sqrt{n_{\\text{new}}}} = \\frac12 \\cdot \\frac{1}{\\sqrt{n_{\\text{old}}}}$, i.e. $\\sqrt{n_{\\text{new}}} = 2\\sqrt{n_{\\text{old}}}$, so $n_{\\text{new}} = 4n_{\\text{old}}$. The sample size must be increased by a factor of $4$ (quadrupled), since the margin of error decreases only with the square root of $n$, not proportionally to $n$ itself. Marking points: (1) correctly identifies ME as proportional to $1/\\sqrt n$; (2) sets up the correct relationship for halving ME; (3) solves algebraically to get $n_{\\text{new}}=4n_{\\text{old}}$; (4) states the factor of 4 clearly; (5) explains why (the square-root relationship, not a linear one)." },
  { complexity: "complex_unfamiliar", front: "A pharmaceutical trial estimates the proportion of patients with a side effect using $\\hat p = 0.02$ from $n=150$. A statistician warns the standard confidence interval formula may not be reliable. Explain why, referring to the conditions needed for the normal approximation to be valid. (4 marks)", back: "Model response: The confidence interval formula relies on the sampling distribution of $\\hat p$ being approximately normal, typically requiring both $n\\hat p$ and $n(1-\\hat p)$ to be sufficiently large (a common guideline is at least 5). Here $n\\hat p = 150(0.02) = 3$, below this guideline, even though $n(1-\\hat p)=147$ is large. Because the expected number of side-effect cases is small, the actual distribution is likely noticeably skewed, so the normal-based confidence interval formula may produce a poor approximation — potentially including implausible values. Marking points: (1) states the relevant condition; (2) calculates $n\\hat p=3$ correctly; (3) identifies this fails the guideline; (4) explains the consequence — a skewed underlying distribution making the standard formula unreliable." },
  { complexity: "complex_unfamiliar", front: "A journalist reports: 'A poll of 40 people found 60% support the new policy, with a margin of error of ±2%.' A statistics student is suspicious. Verify the student's suspicion by calculating the actual 95% margin of error for this sample, and suggest what may have gone wrong with the reported figure. (5 marks)", back: "Model response: Actual margin of error $=1.96\\sqrt{\\frac{0.6(0.4)}{40}} = 1.96\\sqrt{0.006} \\approx 1.96(0.0775) \\approx 0.152$, i.e. approximately $\\pm15.2\\%$ — dramatically larger than the reported $\\pm2\\%$. This confirms the student's suspicion: with only $n=40$ respondents, the sample proportion is highly variable and cannot support such a small margin of error; a margin of error as small as $\\pm2\\%$ typically requires a sample size in the thousands. Likely explanations: the journalist may have misreported or misunderstood the actual margin of error, confused it with a different statistic, or conflated this small survey with a much larger one. Marking points: (1) calculates the correct margin of error for $n=40$; (2) recognises this is far larger than the reported ±2%; (3) explains why (small sample size cannot support such precision); (4) references the sample size actually needed for such a small margin of error; (5) offers a plausible explanation for the discrepancy." },
];

// ============================================================================
// Topic mapping — located by (unit number, topic number), not title text.
// ============================================================================
type TopicSeed = { unitNumber: number; topicNumber: number; label: string; cards: SeedCard[] };

const SUBJECTS: Record<string, TopicSeed[]> = {
  MM: [
    { unitNumber: 3, topicNumber: 1, label: "U3T1 Differentiation of exp/log functions", cards: MM_U3T1 },
    { unitNumber: 3, topicNumber: 2, label: "U3T2 Differentiation of trig functions & rules", cards: MM_U3T2 },
    { unitNumber: 3, topicNumber: 3, label: "U3T3 Further applications of differentiation", cards: MM_U3T3 },
    { unitNumber: 3, topicNumber: 4, label: "U3T4 Introduction to integration", cards: MM_U3T4 },
    { unitNumber: 3, topicNumber: 5, label: "U3T5 Discrete random variables", cards: MM_U3T5 },
    { unitNumber: 4, topicNumber: 1, label: "U4T1 Further integration", cards: MM_U4T1 },
    { unitNumber: 4, topicNumber: 2, label: "U4T2 Trigonometry", cards: MM_U4T2 },
    { unitNumber: 4, topicNumber: 3, label: "U4T3 Continuous RVs & normal distribution", cards: MM_U4T3 },
    { unitNumber: 4, topicNumber: 4, label: "U4T4 Sampling and proportions", cards: MM_U4T4 },
    { unitNumber: 4, topicNumber: 5, label: "U4T5 Interval estimates for proportions", cards: MM_U4T5 },
  ],
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

  let cloze_no_markers = 0;
  const grand: Record<string, Record<ComplexityBand, { defined: number; inserted: number }>> = {};

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

    grand[code] = {
      simple_familiar: { defined: 0, inserted: 0 },
      complex_familiar: { defined: 0, inserted: 0 },
      complex_unfamiliar: { defined: 0, inserted: 0 },
    };

    for (const seed of topicSeeds) {
      const unit = units.find((u) => u.number === seed.unitNumber);
      const topic = unit?.topics.find((t) => t.number === seed.topicNumber);
      if (!topic) {
        console.log(`  ${seed.label}: no matching U${seed.unitNumber}T${seed.topicNumber} topic found in DB — skipping`);
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
        const newCards = bandCards.filter((c) => !existingFronts.has(c.front));

        for (const c of newCards) {
          if (c.cardType === "cloze" && !c.front.includes("{{c")) cloze_no_markers += 1;
        }

        grand[code][band].defined += bandCards.length;
        parts.push(`${SHORT[band]} ${bandCards.length} defined, ${newCards.length} new`);

        if (write && newCards.length > 0) {
          const saved = await d.saveCards(
            subject.userId,
            subject.id,
            topic.id,
            newCards.map((c) => ({ front: c.front, back: c.back, cardType: c.cardType ?? "basic", complexity: band })),
            ["hand-authored", code, band],
          );
          grand[code][band].inserted += saved;
        }
      }

      console.log(`  ${seed.label.padEnd(42)} ${parts.join("  |  ")}`);
    }
    console.log();
  }

  console.log("SUMMARY (per subject / per band)");
  for (const code of Object.keys(grand)) {
    for (const band of BANDS) {
      const g = grand[code][band];
      console.log(
        `  ${code.padEnd(4)} ${SHORT[band]}  ${String(g.defined).padStart(3)} defined` +
          (write ? `  ${String(g.inserted).padStart(3)} inserted` : "  (dry run — nothing written)"),
      );
    }
  }

  if (cloze_no_markers > 0) {
    console.log(`\nWARNING: ${cloze_no_markers} card(s) marked cardType "cloze" have no {{c markers — this would be a broken card.`);
  } else {
    console.log("\nAll cloze cards contain {{c markers — no broken cloze cards.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
