"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, Check, ChevronDown, ChevronRight, Lock, Play } from "lucide-react";
import { setSubtopicRag, setTopicRag } from "@/app/(app)/subjects/[shortCode]/rag-actions";

/**
 * Topic-by-topic, in unlock order, with the red/amber/green control on each.
 *
 * The RAG rating is what drives how much study a topic gets: red means focus
 * on it, amber means some, green means keep it warm. Setting it here writes to
 * every learning objective under the topic, which is the level the
 * recommendation engine already scores on — so a rating made here immediately
 * changes what the planner suggests.
 *
 * Locked topics render but can't be entered or rated. That's the point of
 * unlocking: the next station only opens when you've mastered this one.
 */

export type SubtopicRow = {
  id: string;
  title: string;
  objectives: number;
  cards: number;
  cardsDue: number;
  red: number;
  amber: number;
  green: number;
};

export type TopicRow = {
  id: string;
  unitNumber: number;
  unitTitle: string;
  number: number;
  title: string;
  state: "locked" | "active" | "mastered";
  needsReview: boolean;
  cardCount: number;
  cardsDue: number;
  objectives: number;
  red: number;
  amber: number;
  green: number;
  unrated: number;
  subtopics: SubtopicRow[];
};

type Rag = "red" | "amber" | "green";

const RAG_META: Record<Rag, { label: string; colour: string; help: string }> = {
  red: { label: "Red", colour: "var(--state-danger)", help: "Focus here — most study time" },
  amber: { label: "Amber", colour: "var(--streak-ember)", help: "Some study — needs shoring up" },
  green: { label: "Green", colour: "var(--state-good)", help: "Solid — just keep it warm" },
};

export function TopicList({ shortCode, topics }: { shortCode: string; topics: TopicRow[] }) {
  const units = [...new Set(topics.map((t) => t.unitNumber))];

  return (
    <div className="flex flex-col gap-6">
      {units.map((unitNumber) => {
        const inUnit = topics.filter((t) => t.unitNumber === unitNumber);
        return (
          <section key={unitNumber}>
            <h2 className="signage mb-2.5 font-display text-xs font-bold text-[color:var(--text-muted)]">
              Unit {unitNumber} — {inUnit[0]?.unitTitle}
            </h2>
            <ul className="flex flex-col gap-2">
              {inUnit.map((topic) => {
                // The gate is the previous topic in the WHOLE subject, not in
                // the unit — the first topic of Unit 4 is unlocked by the last
                // topic of Unit 3, and computing it per-unit produced
                // "Master U4 T0 to unlock".
                const index = topics.findIndex((t) => t.id === topic.id);
                const previous = index > 0 ? topics[index - 1] : null;
                return (
                  <TopicItem
                    key={topic.id}
                    shortCode={shortCode}
                    topic={topic}
                    previous={previous}
                  />
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function TopicItem({
  shortCode,
  topic,
  previous,
}: {
  shortCode: string;
  topic: TopicRow;
  previous: TopicRow | null;
}) {
  const [rag, setRag] = useState<Rag | null>(dominantRag(topic));
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const locked = topic.state === "locked";
  // A single "General" subtopic is an artefact of extraction, not a real
  // division — expanding it would just repeat the topic back at you.
  const hasRealSubtopics =
    topic.subtopics.length > 1 ||
    (topic.subtopics.length === 1 && topic.subtopics[0].title.toLowerCase() !== "general");

  function rate(value: Rag) {
    setRag(value);
    startTransition(async () => {
      await setTopicRag(shortCode, topic.id, value);
    });
  }

  return (
    <li
      className={`rounded-xl border px-4 py-3 ${
        locked
          ? "border-[color:var(--hairline)] opacity-60"
          : "border-[color:var(--hairline)] bg-[color:var(--surface)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.64rem]">
          {topic.state === "mastered" ? (
            <Check className="h-4 w-4" style={{ color: "var(--line-bright)" }} aria-label="mastered" />
          ) : topic.state === "active" ? (
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--line-bright)", boxShadow: "0 0 0 4px var(--line-glow)" }}
              aria-label="active topic"
            />
          ) : (
            <Lock className="h-3.5 w-3.5 text-[color:var(--state-locked)]" aria-label="locked" />
          )}
        </span>

        {/* Full width on a phone. Left as flex-1, the rating buttons and
            actions take the row's space and squeeze this to near-zero, which
            wraps the title to one word per line and makes the list unreadable.
            Only visible at an actual narrow viewport — the desktop layout is
            fine, which is exactly why it survived until the layout was tested
            at 390px. */}
        <span className="w-full min-w-0 sm:w-auto sm:flex-1">
          <span className="tabular mr-2 text-[0.64rem] text-[color:var(--text-faint)]">
            U{topic.unitNumber} T{topic.number}
          </span>
          <span className={locked ? "text-xs text-[color:var(--text-faint)]" : "text-xs text-[color:var(--text)]"}>
            {topic.title}
          </span>
          {topic.needsReview && (
            <span className="ml-2 rounded-full border border-[color:var(--state-danger)] px-1.5 py-px text-[0.64rem] text-[color:var(--state-danger)]">
              needs review
            </span>
          )}
          <span className="mt-0.5 block text-[0.64rem] text-[color:var(--text-faint)]">
            {topic.objectives} objectives · {topic.cardCount} cards
            {/* Locked topics never show a due count — their cards exist but
                aren't in play yet. */}
            {!locked && topic.cardsDue > 0 && (
              <span style={{ color: "var(--line-bright)" }}> · {topic.cardsDue} due</span>
            )}
            {locked && <span> · locked</span>}
          </span>
        </span>

        {locked ? (
          <span className="text-[0.64rem] text-[color:var(--text-faint)]">
            {previous
              ? `Master U${previous.unitNumber} T${previous.number} to unlock`
              : "Locked"}
          </span>
        ) : (
          <>
            <span className="flex gap-1" role="group" aria-label="Confidence rating">
              {(Object.keys(RAG_META) as Rag[]).map((value) => {
                const meta = RAG_META[value];
                const on = rag === value;
                return (
                  <button
                    key={value}
                    onClick={() => rate(value)}
                    disabled={pending}
                    title={meta.help}
                    aria-pressed={on}
                    className="rounded-md border px-2 py-1 text-[0.64rem] font-semibold transition-colors duration-[180ms] disabled:opacity-50"
                    style={{
                      borderColor: on ? meta.colour : "var(--hairline)",
                      background: on ? meta.colour : "transparent",
                      color: on ? "#0f1420" : "var(--text-muted)",
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </span>

            <Link
              href={`/subjects/${shortCode}/learn/${topic.id}`}
              className="flex items-center gap-1 rounded-lg border border-[color:var(--hairline)] px-2.5 py-1.5 text-[0.64rem] font-semibold text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-raised)] hover:text-[color:var(--text)]"
            >
              <BookOpen className="h-3 w-3" aria-hidden />
              Learn
            </Link>

            <Link
              href={`/subjects/${shortCode}/reviewer?topicId=${topic.id}`}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.64rem] font-semibold"
              style={{ background: "var(--line)", color: "#0f1420" }}
            >
              <Play className="h-3 w-3" aria-hidden />
              Cards
              <ChevronRight className="h-3 w-3" aria-hidden />
            </Link>
          </>
        )}
      </div>

      {!locked && rag && (
        <p className="mt-2 text-[0.64rem]" style={{ color: RAG_META[rag].colour }}>
          {RAG_META[rag].help}
        </p>
      )}

      {!locked && hasRealSubtopics && (
        <>
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="mt-2 flex items-center gap-1 text-[0.64rem] text-[color:var(--text-faint)] hover:text-[color:var(--text-muted)]"
          >
            {open ? (
              <ChevronDown className="h-3 w-3" aria-hidden />
            ) : (
              <ChevronRight className="h-3 w-3" aria-hidden />
            )}
            {open ? "Hide" : "Show"} the {topic.subtopics.length} subtopics
          </button>

          {open && (
            <ul className="mt-2 flex flex-col gap-1.5 border-l border-[color:var(--hairline)] pl-3">
              {topic.subtopics.map((subtopic) => (
                <SubtopicItem key={subtopic.id} shortCode={shortCode} subtopic={subtopic} />
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

/**
 * One subtopic: rate it and drill just its cards.
 *
 * This is the "I only need to do one part of this topic" path. Cards were
 * filed against subtopics after the fact, and a card the classifier wasn't
 * confident about stayed unfiled — those still show when you drill the whole
 * topic, so nothing is lost, it just isn't claimed to be here.
 */
function SubtopicItem({
  shortCode,
  subtopic,
}: {
  shortCode: string;
  subtopic: SubtopicRow;
}) {
  const [rag, setRag] = useState<Rag | null>(
    subtopic.red > 0 ? "red" : subtopic.amber > 0 ? "amber" : subtopic.green > 0 ? "green" : null,
  );
  const [pending, startTransition] = useTransition();

  function rate(value: Rag) {
    setRag(value);
    startTransition(async () => {
      await setSubtopicRag(shortCode, subtopic.id, value);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      {/* Same reason as the topic title above. */}
      <span className="w-full min-w-0 sm:w-auto sm:flex-1">
        <span className="block text-[0.64rem] text-[color:var(--text-muted)]">{subtopic.title}</span>
        <span className="block text-[0.64rem] text-[color:var(--text-faint)]">
          {subtopic.objectives} objectives · {subtopic.cards} cards
          {subtopic.cardsDue > 0 && (
            <span style={{ color: "var(--line-bright)" }}> · {subtopic.cardsDue} due</span>
          )}
        </span>
      </span>

      <span className="flex gap-1" role="group" aria-label={`Confidence for ${subtopic.title}`}>
        {(Object.keys(RAG_META) as Rag[]).map((value) => {
          const meta = RAG_META[value];
          const on = rag === value;
          return (
            <button
              key={value}
              onClick={() => rate(value)}
              disabled={pending}
              title={meta.help}
              aria-pressed={on}
              className="rounded border px-1.5 py-0.5 text-[0.64rem] font-semibold transition-colors duration-[180ms] disabled:opacity-50"
              style={{
                borderColor: on ? meta.colour : "var(--hairline)",
                background: on ? meta.colour : "transparent",
                color: on ? "#0f1420" : "var(--text-faint)",
              }}
            >
              {meta.label[0]}
            </button>
          );
        })}
      </span>

      {subtopic.cards > 0 && (
        <Link
          href={`/subjects/${shortCode}/reviewer?subtopicId=${subtopic.id}`}
          className="rounded-lg border border-[color:var(--hairline)] px-2 py-1 text-[0.64rem] font-semibold text-[color:var(--text-muted)] hover:bg-[color:var(--surface-raised)] hover:text-[color:var(--text)]"
        >
          Drill
        </Link>
      )}
    </li>
  );
}

/**
 * A topic's headline rating from its objectives: worst wins. One red objective
 * in an otherwise green topic still means there's something to fix, and
 * averaging would hide exactly the thing worth surfacing.
 */
function dominantRag(topic: TopicRow): Rag | null {
  if (topic.red > 0) return "red";
  if (topic.amber > 0) return "amber";
  if (topic.green > 0) return "green";
  return null;
}
