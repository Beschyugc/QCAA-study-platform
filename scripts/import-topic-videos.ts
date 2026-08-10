/**
 * Maps the video catalogue onto Mathematical Methods topics.
 *
 * Run:  npx tsx scripts/import-topic-videos.ts [--write]
 *
 * `[C] oct-video-catalogue.json` (one level above app/) holds ~3,099 maths
 * tutorial videos as {id, title} and had never been used. Measured contents:
 * heavily calculus and statistics — which is Methods Units 3 and 4 almost
 * exactly. Nothing in it fits Biology, Psychology or English (0 psychology
 * titles, 20 loosely "english"), so this only ever touches MM. A wrong video
 * on a topic is worse than no video.
 *
 * Matching is deterministic keyword rules — no AI, no API calls, no cost.
 * Dry run by default.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

const CATALOGUE = join(__dirname, "..", "..", "[C] oct-video-catalogue.json");

/** Most videos a single topic may take. 156 links is a wall, not a lesson. */
const PER_TOPIC_CAP = 40;

type CatalogueEntry = { id: string; title: string };

/**
 * One rule per Methods topic, addressed by (unit, topic) rather than title —
 * titles carry prefixes and drift, numbers don't.
 *
 * `deny` runs before `allow`, which is what keeps "derivative of sine" out of
 * U4 T2 Trigonometry and in U3 T2 where it belongs. Without it the plain-trig
 * topic swallows every calculus-of-trig video, since both mention "sine".
 *
 * `strong` marks a more specific match; those sort first, so the cap keeps the
 * best videos rather than whichever the file happened to list earliest.
 */
type Rule = {
  unit: number;
  topic: number;
  label: string;
  allow: RegExp;
  deny?: RegExp;
  strong?: RegExp;
};

const DERIV = /\b(derivative|differentiat|d\/dx|chain rule|product rule|quotient rule|implicit)/i;
const INTEG = /\b(integral|integrat|antideriv|anti-deriv|area under|riemann)/i;

const RULES: Rule[] = [
  {
    unit: 3,
    topic: 1,
    label: "Differentiation of exponential and logarithmic functions",
    allow: /\b(logarithm|logarithmic|exponential|natural log|\bln\b|e\^|euler)/i,
    deny: INTEG,
    strong: /\b(derivative|differentiat).*(log|exponential)|\b(log|exponential).*(derivative|differentiat)/i,
  },
  {
    unit: 3,
    topic: 2,
    label: "Differentiation of trigonometric functions",
    // Calculus OF trig — the intersection, not either alone.
    allow: /(?=.*\b(trig|sine|cosine|tangent|sec|csc|cot)\b)(?=.*(derivative|differentiat|d\/dx))/i,
    deny: INTEG,
    strong: /\b(derivative|differentiat).*(trig|sine|cosine|tangent)/i,
  },
  {
    unit: 3,
    topic: 3,
    label: "Further applications of differentiation",
    allow:
      /\b(related rate|optimi[sz]|maxima|minima|max\/min|curve sketch|rectilinear|linear[iy]zation|concav|inflection|newton'?s method|mean value theorem|critical point|extrema)/i,
    strong: /\b(related rate|optimi[sz]|rectilinear|inflection)/i,
  },
  {
    unit: 3,
    topic: 4,
    label: "Introduction to integration",
    allow: INTEG,
    deny: /\b(by parts|substitution|trigonometric substitution|partial fraction|volume of revolution|surface area|arc length)/i,
    strong: /\b(antideriv|area under|riemann|definite integral)/i,
  },
  {
    unit: 3,
    topic: 5,
    label: "Discrete random variables",
    allow:
      /\b(discrete|binomial|expected value|probability distribution|bernoulli|probability mass|geometric distribution)/i,
    deny: /\b(continuous|normal distribution)/i,
    strong: /\b(binomial|discrete random|expected value)/i,
  },
  {
    unit: 4,
    topic: 1,
    label: "Further integration",
    allow:
      /\b(integration by parts|by parts|u-?substitution|substitution rule|trigonometric substitution|partial fraction|volume of revolution|solids? of revolution|arc length|improper integral)/i,
    strong: /\b(integration by parts|partial fraction|volume of revolution)/i,
  },
  {
    unit: 4,
    topic: 2,
    label: "Trigonometry",
    allow: /\b(trig|sine|cosine|tangent|radian|unit circle|identit|law of sines|law of cosines|amplitude|period)/i,
    // Anything that is really calculus belongs to U3 T2 / integration topics.
    deny: /(derivative|differentiat|d\/dx|integral|integrat|antideriv)/i,
    strong: /\b(unit circle|radian|identit|law of (sines|cosines))/i,
  },
  {
    unit: 4,
    topic: 3,
    label: "Continuous random variables and the normal distribution",
    allow:
      /\b(normal distribution|z-?score|standard normal|continuous random|probability density|bell curve|empirical rule|standard deviation)/i,
    strong: /\b(normal distribution|z-?score|standard normal|continuous random)/i,
  },
  {
    unit: 4,
    topic: 4,
    label: "Sampling and proportions",
    allow:
      /\b(sampling distribution|sample proportion|sample size|central limit|sampling|population proportion|standard error)/i,
    deny: /\b(confidence interval|margin of error)/i,
    strong: /\b(sampling distribution|sample proportion|central limit)/i,
  },
  {
    unit: 4,
    topic: 5,
    label: "Interval estimates for proportions",
    allow: /\b(confidence interval|margin of error|interval estimate|critical value)/i,
    strong: /\b(confidence interval|margin of error)/i,
  },
];

function matches(rule: Rule, title: string): { hit: boolean; strong: boolean } {
  if (rule.deny?.test(title)) return { hit: false, strong: false };
  if (!rule.allow.test(title)) return { hit: false, strong: false };
  return { hit: true, strong: rule.strong?.test(title) ?? false };
}

async function main() {
  const write = process.argv.includes("--write");
  console.log(write ? "MODE: WRITE\n" : "MODE: dry run (nothing is written)\n");

  const catalogue: CatalogueEntry[] = JSON.parse(readFileSync(CATALOGUE, "utf8"));
  console.log(`catalogue: ${catalogue.length} videos\n`);

  const mm = await prisma.subject.findFirst({
    where: { shortCode: "MM" },
    include: { units: { include: { topics: true } } },
  });
  if (!mm) throw new Error("Mathematical Methods subject not found");

  const matchedIds = new Set<string>();
  let totalPlanned = 0;
  let totalInserted = 0;

  for (const rule of RULES) {
    const unit = mm.units.find((u) => u.number === rule.unit);
    const topic = unit?.topics.find((t) => t.number === rule.topic);
    if (!topic) {
      console.log(`  U${rule.unit} T${rule.topic} — TOPIC NOT FOUND, skipping`);
      continue;
    }

    const hits: { entry: CatalogueEntry; strong: boolean }[] = [];
    for (const entry of catalogue) {
      const m = matches(rule, entry.title);
      if (m.hit) hits.push({ entry, strong: m.strong });
    }
    // Strong matches first, then shorter titles — a shorter title on the same
    // keyword is usually the core lesson rather than an edge case.
    hits.sort(
      (a, b) =>
        Number(b.strong) - Number(a.strong) || a.entry.title.length - b.entry.title.length,
    );
    const chosen = hits.slice(0, PER_TOPIC_CAP);
    for (const h of chosen) matchedIds.add(h.entry.id);

    const existing = await prisma.topicVideo.findMany({
      where: { topicId: topic.id },
      select: { youtubeId: true },
    });
    const have = new Set(existing.map((e) => e.youtubeId));
    const fresh = chosen.filter((h) => !have.has(h.entry.id));
    totalPlanned += fresh.length;

    console.log(
      `  U${rule.unit} T${rule.topic} ${rule.label.slice(0, 44).padEnd(46)} ` +
        `${String(hits.length).padStart(4)} matched -> ${String(chosen.length).padStart(2)} kept, ${fresh.length} new`,
    );

    if (write && fresh.length > 0) {
      // One bulk insert per topic. Row-at-a-time inside a transaction is the
      // documented way this codebase has blown Prisma's 5s ceiling against
      // remote Supabase.
      await prisma.topicVideo.createMany({
        data: fresh.map((h, i) => ({
          id: randomUUID(),
          userId: topic.userId,
          topicId: topic.id,
          youtubeId: h.entry.id,
          title: h.entry.title,
          order: have.size + i,
        })),
        // skipDuplicates isn't supported on SQLite (it was needed for
        // Postgres). Not load-bearing here: `fresh` is already filtered
        // against `have` above, so this is just insurance against the
        // catalogue itself containing a duplicate youtubeId within one
        // topic's batch — rely on @@unique([topicId, youtubeId]) to reject
        // that case loudly instead of silently.
      });
      totalInserted += fresh.length;
    }
  }

  const unmatched = catalogue.length - matchedIds.size;
  console.log(
    `\nTOTAL ${totalPlanned} to add${write ? `, ${totalInserted} inserted` : ""} · ` +
      `${matchedIds.size} distinct videos used · ${unmatched} unmatched (left alone by design)`,
  );
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
