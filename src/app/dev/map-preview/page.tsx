import { notFound } from "next/navigation";
import { NetworkMap } from "@/components/dashboard/network-map";
import { Card, Wrap, Zone } from "@/components/dashboard/shell";
import { ThisAfternoon } from "@/components/dashboard/this-afternoon";
import type { LineState, LineStation } from "@/lib/dashboard";

/**
 * Development-only harness for the network map.
 *
 * The map is the hero of the dashboard and it is currently impossible to see
 * against real data: the curriculum tables are empty, so every line renders
 * "no topics yet". Seeding the database to work around that would put fake
 * topics in Beschy's real Postgres, which he declined — so this route feeds
 * the REAL component fabricated props instead. Nothing here touches the
 * database, and nothing here can leak into the dashboard.
 *
 * 404s outside development so it can never ship.
 */
export const dynamic = "force-dynamic";

function station(
  n: number,
  title: string,
  state: LineStation["state"],
  extra: Partial<LineStation> = {},
): LineStation {
  return {
    topicId: `${title}-${n}`,
    number: n,
    title,
    state,
    needsReview: false,
    cardsDue: state === "active" ? 12 : 0,
    redObjectives: state === "active" ? 2 : 0,
    amberObjectives: state === "active" ? 3 : 0,
    greenObjectives: state === "mastered" ? 5 : 1,
    ...extra,
  };
}

function line(
  code: LineState["code"],
  label: string,
  titles: string[],
  activeAt: number,
  position: string,
): LineState {
  const stations = titles.map((t, i) =>
    station(i + 1, t, i < activeAt ? "mastered" : i === activeAt ? "active" : "locked"),
  );
  return {
    code,
    subjectId: `sub-${code}`,
    name: label,
    label,
    icon: "Sigma",
    stations,
    activeIndex: activeAt,
    position,
    masteredCount: activeAt,
    cardsDue: stations.reduce((s, x) => s + x.cardsDue, 0),
    redObjectives: stations.reduce((s, x) => s + x.redObjectives, 0),
  };
}

const LINES: LineState[] = [
  line("MM", "METHODS", ["Rates of change","Differentiation","Applications","Integration","Definite integrals","Areas","Volumes","Motion","Review"], 3, "U3 T3"),
  line("BIO", "BIOLOGY", ["Cells","Transport","Enzymes","Photosynthesis","Respiration","Genetics","Inheritance","Evolution","Ecology"], 5, "U4 T1"),
  line("PSY", "PSYCHOLOGY", ["Foundations","Brain","Memory","Learning","Cognition","Development","Social","Disorders","Research"], 3, "U3 T4"),
  line("ENG", "ENGLISH", ["Close reading","Persuasion","Paper 1","Paper 2","Comparative","Creative","Oral","Exam prep","Review"], 2, "U3 T3"),
  line("PE", "PE", ["Anatomy","Energy systems","Training","Skill acquisition","Tactics","Ethics","Analysis","Report","Review"], 4, "U4 T1"),
];

// One station sent back for review, to prove the fault ring renders.
LINES[1].stations[2].needsReview = true;

export default async function MapPreview() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <Wrap>
      <Zone eyebrow="Dev harness — fabricated props, no database">
        <Card title="The network">
          <NetworkMap lines={LINES} />
        </Card>
      </Zone>

      <Zone eyebrow="Edge case — a long line (24 topics)">
        <Card title="The network">
          <NetworkMap
            lines={[
              line(
                "MM",
                "METHODS",
                Array.from({ length: 24 }, (_, i) => `Topic ${i + 1}`),
                9,
                "U3 T9",
              ),
              LINES[1],
            ]}
          />
        </Card>
      </Zone>

      <Zone eyebrow="This Afternoon — the why? breakdown">
        <Card>
          <ThisAfternoon
            items={[
              {
                topicId: "t1",
                topicTitle: "Integration by substitution",
                position: "U3 T3",
                subjectId: "sub-MM",
                code: "MM",
                minutes: 45,
                summary: "62% red/amber · 22 cards overdue · 4 days since last session",
                score: 0.87,
                subjectPriorityWeight: 1.0,
                contributions: [
                  { factor: "Red/amber objectives", rawValue: "62%", points: 0.31 },
                  { factor: "Days since last studied", rawValue: "4d", points: 0.16 },
                  { factor: "Cards overdue", rawValue: "22", points: 0.22 },
                  { factor: "Pace variance", rawValue: "12d behind", points: 0.18 },
                  { factor: "Assessment proximity", rawValue: "no date set", points: 0 },
                ],
              },
              {
                topicId: "t2",
                topicTitle: "Paper 2 comparative essay",
                position: "U3 T3",
                subjectId: "sub-ENG",
                code: "ENG",
                minutes: 35,
                summary: "88% red/amber · 9 days since last session",
                score: 0.71,
                subjectPriorityWeight: 0.5,
                contributions: [
                  { factor: "Red/amber objectives", rawValue: "88%", points: 0.44 },
                  { factor: "Days since last studied", rawValue: "9d", points: 0.27 },
                  { factor: "Cards overdue", rawValue: "6", points: 0.06 },
                ],
              },
            ]}
            studyMinutes={105}
          />
        </Card>
      </Zone>

      <Zone eyebrow="Edge case — a subject with no topics">
        <Card title="The network">
          <NetworkMap
            lines={[LINES[0], { ...LINES[2], stations: [], activeIndex: -1, position: null, masteredCount: 0 }]}
          />
        </Card>
      </Zone>
    </Wrap>
  );
}
