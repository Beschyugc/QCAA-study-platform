"use client";

import { useState, useTransition } from "react";
import { Latex } from "@/components/latex";
import {
  createCard,
  updateCard,
  deleteCard,
  setCardSuspended,
  bulkSuspend,
  bulkDelete,
  bulkMoveTopic,
  bulkRetag,
  type CardType,
} from "./actions";

type Topic = { id: string; label: string };
type Card = {
  id: string;
  front: string;
  back: string;
  cardType: string;
  tags: string[];
  isSuspended: boolean;
  state: string;
};

const CARD_TYPE_LABEL: Record<CardType, string> = {
  basic: "Basic",
  cloze: "Cloze",
  formula: "Formula",
  type_in: "Type-in",
};

export function CardsManager({
  shortCode,
  subjectId,
  topics,
  cards,
}: {
  shortCode: string;
  subjectId: string;
  topics: Topic[];
  cards: Card[];
}) {
  const [pending, startTransition] = useTransition();
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [cardType, setCardType] = useState<CardType>("basic");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [tags, setTags] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function handleCreate() {
    if (!topicId || !front.trim() || !back.trim()) return;
    startTransition(async () => {
      await createCard(
        shortCode,
        subjectId,
        topicId,
        cardType,
        front,
        back,
        tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      );
      setFront("");
      setBack("");
      setTags("");
    });
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (topics.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No topics yet — build the curriculum tree first.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-md border border-border p-4">
        <h2 className="text-sm font-medium">Add card</h2>
        <div className="flex gap-2">
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={cardType}
            onChange={(e) => setCardType(e.target.value as CardType)}
            className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          >
            {Object.entries(CARD_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder={
            cardType === "cloze"
              ? "Text with {{c1::deletions}}"
              : cardType === "formula"
                ? "Description (LaTeX ok, e.g. Derivative of $e^x$)"
                : cardType === "type_in"
                  ? "Prompt"
                  : "Front"
          }
          rows={2}
          className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
        />
        {cardType !== "cloze" && (
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder={
              cardType === "formula"
                ? "Formula (LaTeX, e.g. \\frac{d}{dx}e^x = e^x)"
                : cardType === "type_in"
                  ? "Expected answer"
                  : "Back"
            }
            rows={2}
            className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
          />
        )}
        {cardType === "formula" && back.trim() && (
          <div className="rounded-md border border-dashed border-input p-2 text-sm">
            Preview: <Latex>{back}</Latex>
          </div>
        )}
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tags, comma, separated"
          className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        />
        <button
          onClick={() => {
            if (cardType === "cloze" && !back.trim()) setBack(front);
            handleCreate();
          }}
          disabled={pending}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted p-2 text-sm">
          <span>{selected.size} selected</span>
          <select
            onChange={(e) => {
              if (!e.target.value) return;
              startTransition(() =>
                bulkMoveTopic(shortCode, [...selected], e.target.value),
              );
              setSelected(new Set());
            }}
            className="rounded border border-input bg-transparent px-2 py-1 text-xs"
            defaultValue=""
          >
            <option value="" disabled>
              Move to topic…
            </option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const tag = prompt("Add tag to selected cards:");
              if (tag)
                startTransition(() =>
                  bulkRetag(shortCode, [...selected], tag),
                );
              setSelected(new Set());
            }}
            className="rounded border border-input px-2 py-1 text-xs"
          >
            Add tag
          </button>
          <button
            onClick={() => {
              startTransition(() => bulkSuspend(shortCode, [...selected], true));
              setSelected(new Set());
            }}
            className="rounded border border-input px-2 py-1 text-xs"
          >
            Suspend
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete ${selected.size} cards?`)) {
                startTransition(() => bulkDelete(shortCode, [...selected]));
                setSelected(new Set());
              }
            }}
            className="rounded border border-destructive px-2 py-1 text-xs text-destructive"
          >
            Delete
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {cards.map((card) => (
          <CardRow
            key={card.id}
            shortCode={shortCode}
            card={card}
            selected={selected.has(card.id)}
            onToggleSelect={() => toggleSelected(card.id)}
          />
        ))}
        {cards.length === 0 && (
          <p className="text-sm text-muted-foreground">No cards yet.</p>
        )}
      </ul>
    </div>
  );
}

function CardRow({
  shortCode,
  card,
  selected,
  onToggleSelect,
}: {
  shortCode: string;
  card: Card;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [pending, startTransition] = useTransition();

  return (
    <li className="rounded-md border border-border p-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={selected} onChange={onToggleSelect} />
        <span className="rounded bg-muted px-1.5 py-0.5">
          {CARD_TYPE_LABEL[card.cardType as CardType] ?? card.cardType}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5">{card.state}</span>
        {card.tags.map((tag) => (
          <span key={tag} className="rounded bg-muted px-1.5 py-0.5">
            #{tag}
          </span>
        ))}
        {card.isSuspended && (
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-600">
            suspended
          </span>
        )}
      </div>
      <textarea
        value={front}
        onChange={(e) => setFront(e.target.value)}
        onBlur={() =>
          front !== card.front &&
          startTransition(() => updateCard(shortCode, card.id, { front }))
        }
        rows={2}
        className="mb-1 w-full rounded border border-transparent bg-transparent p-1 text-sm hover:border-input focus:border-input focus:outline-none"
      />
      <textarea
        value={back}
        onChange={(e) => setBack(e.target.value)}
        onBlur={() =>
          back !== card.back &&
          startTransition(() => updateCard(shortCode, card.id, { back }))
        }
        rows={2}
        className="w-full rounded border border-transparent bg-transparent p-1 text-sm hover:border-input focus:border-input focus:outline-none"
      />
      {card.cardType === "formula" && (
        <div className="mt-1 text-sm text-muted-foreground">
          <Latex>{back}</Latex>
        </div>
      )}
      <div className="mt-1 flex gap-3 text-xs">
        <button
          onClick={() =>
            startTransition(() =>
              setCardSuspended(shortCode, card.id, !card.isSuspended),
            )
          }
          disabled={pending}
          className="text-muted-foreground underline"
        >
          {card.isSuspended ? "Unsuspend" : "Suspend"}
        </button>
        <button
          onClick={() => startTransition(() => deleteCard(shortCode, card.id))}
          disabled={pending}
          className="text-destructive underline"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
