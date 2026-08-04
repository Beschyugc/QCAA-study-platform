"use client";

import { useEffect, useState, useTransition } from "react";
import { getMasteryEvidence, confirmMastery } from "./actions";

type Topic = {
  id: string;
  number: number;
  title: string;
  unlockState: string;
  needsReview: boolean;
};
type Unit = { id: string; number: number; title: string; topics: Topic[] };

const STATE_STYLE: Record<string, string> = {
  locked: "bg-muted text-muted-foreground",
  active: "bg-blue-500 text-white ring-2 ring-blue-300",
  mastered: "bg-green-500 text-white",
};

export function ProgressionMap({
  shortCode,
  units,
}: {
  shortCode: string;
  units: Unit[];
}) {
  const [dialogTopic, setDialogTopic] = useState<Topic | null>(null);

  return (
    <div className="mb-6 space-y-3">
      {units.map((unit) => (
        <div key={unit.id} className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-xs text-muted-foreground">
            Unit {unit.number}
          </span>
          <div className="flex flex-wrap gap-2">
            {unit.topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() =>
                  topic.unlockState !== "locked" && setDialogTopic(topic)
                }
                disabled={topic.unlockState === "locked"}
                className={`relative flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-medium ${
                  topic.needsReview
                    ? "bg-amber-500 text-white"
                    : STATE_STYLE[topic.unlockState]
                } ${topic.unlockState === "locked" ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                title={`Topic ${topic.number}: ${topic.title}`}
              >
                {topic.unlockState === "mastered" && !topic.needsReview && "✓ "}
                {topic.needsReview && "⚠ "}T{topic.number}
              </button>
            ))}
          </div>
        </div>
      ))}

      {dialogTopic && (
        <MasteryDialog
          shortCode={shortCode}
          topic={dialogTopic}
          onClose={() => setDialogTopic(null)}
        />
      )}
    </div>
  );
}

function MasteryDialog({
  shortCode,
  topic,
  onClose,
}: {
  shortCode: string;
  topic: Topic;
  onClose: () => void;
}) {
  const [evidence, setEvidence] = useState<Awaited<
    ReturnType<typeof getMasteryEvidence>
  > | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getMasteryEvidence(topic.id).then(setEvidence);
  }, [topic.id]);

  function handleConfirm(override: boolean) {
    startTransition(async () => {
      await confirmMastery(shortCode, topic.id, override);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-5">
        <h2 className="mb-1 text-lg font-semibold">
          Topic {topic.number}: {topic.title}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {topic.unlockState === "mastered"
            ? "Already mastered."
            : "Confirm mastery — this unlocks the next topic."}
        </p>

        {!evidence ? (
          <p className="text-sm text-muted-foreground">Loading evidence…</p>
        ) : (
          <ul className="mb-4 space-y-1.5 text-sm">
            <li className="flex justify-between">
              <span>Learning objectives rated green</span>
              <span
                className={
                  evidence.allObjectivesGreen
                    ? "text-green-600"
                    : "text-destructive"
                }
              >
                {evidence.greenObjectives}/{evidence.totalObjectives}
              </span>
            </li>
            <li className="flex justify-between text-muted-foreground">
              <span>Card reviews (3+, quality ≥ {evidence.minRecentQuality})</span>
              <span>not yet tracked</span>
            </li>
            <li className="flex justify-between text-muted-foreground">
              <span>Study minutes (≥ {evidence.minStudyMinutes})</span>
              <span>not yet tracked</span>
            </li>
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-input px-3 py-2 text-sm"
          >
            Cancel
          </button>
          {topic.unlockState !== "mastered" && (
            <>
              <button
                onClick={() => handleConfirm(true)}
                disabled={pending}
                className="rounded-md border border-input px-3 py-2 text-sm disabled:opacity-50"
              >
                Confirm anyway
              </button>
              <button
                onClick={() => handleConfirm(false)}
                disabled={pending || !evidence?.gatePasses}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {pending ? "Confirming…" : "Confirm mastery"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
