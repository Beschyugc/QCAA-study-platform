"use client";

import { useState, useTransition } from "react";
import {
  createCard,
  updateCard,
  deleteCard,
  setCardSuspended,
} from "./actions";

type Topic = { id: string; label: string };
type Card = {
  id: string;
  front: string;
  back: string;
  cardType: string;
  isSuspended: boolean;
  state: string;
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
  const [cardType, setCardType] = useState<"basic" | "cloze">("basic");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  function handleCreate() {
    if (!topicId || !front.trim() || !back.trim()) return;
    startTransition(async () => {
      await createCard(shortCode, subjectId, topicId, cardType, front, back);
      setFront("");
      setBack("");
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
            onChange={(e) => setCardType(e.target.value as "basic" | "cloze")}
            className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          >
            <option value="basic">Basic</option>
            <option value="cloze">Cloze</option>
          </select>
        </div>
        <textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder={
            cardType === "cloze"
              ? "Text with {{c1::deletions}}"
              : "Front"
          }
          rows={2}
          className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
        />
        {cardType === "basic" && (
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Back"
            rows={2}
            className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
          />
        )}
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

      <ul className="space-y-2">
        {cards.map((card) => (
          <CardRow key={card.id} shortCode={shortCode} card={card} />
        ))}
        {cards.length === 0 && (
          <p className="text-sm text-muted-foreground">No cards yet.</p>
        )}
      </ul>
    </div>
  );
}

function CardRow({ shortCode, card }: { shortCode: string; card: Card }) {
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [pending, startTransition] = useTransition();

  return (
    <li className="rounded-md border border-border p-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5">{card.cardType}</span>
        <span className="rounded bg-muted px-1.5 py-0.5">{card.state}</span>
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
