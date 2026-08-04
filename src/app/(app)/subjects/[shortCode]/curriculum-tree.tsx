"use client";

import { useState, useTransition } from "react";
import {
  createUnit,
  updateUnit,
  deleteUnit,
  createTopic,
  updateTopic,
  deleteTopic,
  moveTopic,
  createSubtopic,
  updateSubtopic,
  deleteSubtopic,
  createObjective,
  updateObjective,
  deleteObjective,
} from "./actions";

type Objective = {
  id: string;
  text: string;
  qcaaReference: string | null;
  ragStatus: string;
};
type Subtopic = { id: string; title: string; learningObjectives: Objective[] };
type Topic = {
  id: string;
  number: number;
  title: string;
  unlockState: string;
  subtopics: Subtopic[];
};
type Unit = { id: string; number: number; title: string; topics: Topic[] };
type SubjectTree = { id: string; shortCode: string; units: Unit[] };

const RAG_COLOUR: Record<string, string> = {
  red: "#ef4444",
  amber: "#f59e0b",
  green: "#22c55e",
  unrated: "#a1a1aa",
};

export function CurriculumTree({ subject }: { subject: SubjectTree }) {
  const [, startTransition] = useTransition();
  const sc = subject.shortCode;

  return (
    <div className="space-y-4">
      {subject.units.map((unit) => (
        <div key={unit.id} className="rounded-md border border-border p-3">
          <EditableRow
            label={`Unit ${unit.number}`}
            value={unit.title}
            onSave={(title) =>
              startTransition(() => updateUnit(sc, unit.id, { title }))
            }
            onDelete={() => startTransition(() => deleteUnit(sc, unit.id))}
          />

          <div className="ml-4 mt-2 space-y-2">
            {unit.topics.map((topic) => (
              <div
                key={topic.id}
                className="rounded-md border border-border/60 p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {topic.unlockState}
                  </span>
                  <EditableRow
                    label={`Topic ${topic.number}`}
                    value={topic.title}
                    onSave={(title) =>
                      startTransition(() => updateTopic(sc, topic.id, { title }))
                    }
                    onDelete={() =>
                      startTransition(() => deleteTopic(sc, topic.id))
                    }
                  />
                  <button
                    onClick={() =>
                      startTransition(() => moveTopic(sc, topic.id, "up"))
                    }
                    className="text-xs text-muted-foreground"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() =>
                      startTransition(() => moveTopic(sc, topic.id, "down"))
                    }
                    className="text-xs text-muted-foreground"
                  >
                    ↓
                  </button>
                </div>

                <div className="ml-4 mt-1 space-y-1">
                  {topic.subtopics.map((subtopic) => (
                    <div key={subtopic.id}>
                      <EditableRow
                        label="Subtopic"
                        value={subtopic.title}
                        onSave={(title) =>
                          startTransition(() =>
                            updateSubtopic(sc, subtopic.id, title),
                          )
                        }
                        onDelete={() =>
                          startTransition(() =>
                            deleteSubtopic(sc, subtopic.id),
                          )
                        }
                      />
                      <ul className="ml-4">
                        {subtopic.learningObjectives.map((objective) => (
                          <li
                            key={objective.id}
                            className="flex items-center gap-2 py-0.5 text-sm"
                          >
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor: RAG_COLOUR[objective.ragStatus],
                              }}
                            />
                            <EditableRow
                              label=""
                              value={objective.text}
                              onSave={(text) =>
                                startTransition(() =>
                                  updateObjective(sc, objective.id, { text }),
                                )
                              }
                              onDelete={() =>
                                startTransition(() =>
                                  deleteObjective(sc, objective.id),
                                )
                              }
                            />
                          </li>
                        ))}
                        <AddInline
                          placeholder="Add learning objective…"
                          onAdd={(text) =>
                            startTransition(() =>
                              createObjective(sc, subtopic.id, text),
                            )
                          }
                        />
                      </ul>
                    </div>
                  ))}
                  <AddInline
                    placeholder="Add subtopic…"
                    onAdd={(title) =>
                      startTransition(() => createSubtopic(sc, topic.id, title))
                    }
                  />
                </div>
              </div>
            ))}
            <AddNumberedInline
              placeholder="Add topic…"
              nextNumber={unit.topics.length + 1}
              onAdd={(number, title) =>
                startTransition(() => createTopic(sc, unit.id, number, title))
              }
            />
          </div>
        </div>
      ))}

      <AddNumberedInline
        placeholder="Add unit…"
        nextNumber={subject.units.length + 3}
        onAdd={(number, title) =>
          startTransition(() => createUnit(sc, subject.id, number, title))
        }
      />
    </div>
  );
}

function EditableRow({
  label,
  value,
  onSave,
  onDelete,
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(value);
  return (
    <span className="inline-flex flex-1 items-center gap-2">
      {label && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {label}
        </span>
      )}
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => text !== value && onSave(text)}
        className="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-input focus:border-input focus:outline-none"
      />
      <button
        onClick={onDelete}
        className="text-xs text-muted-foreground hover:text-destructive"
        aria-label="Delete"
      >
        ✕
      </button>
    </span>
  );
}

function AddInline({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (title: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && value.trim()) {
          onAdd(value.trim());
          setValue("");
        }
      }}
      className="mt-1 w-full rounded border border-dashed border-input bg-transparent px-1 py-0.5 text-sm text-muted-foreground focus:outline-none"
    />
  );
}

function AddNumberedInline({
  placeholder,
  nextNumber,
  onAdd,
}: {
  placeholder: string;
  nextNumber: number;
  onAdd: (number: number, title: string) => void;
}) {
  const [number, setNumber] = useState(nextNumber);
  const [title, setTitle] = useState("");
  return (
    <div className="mt-1 flex gap-2">
      <input
        type="number"
        value={number}
        onChange={(event) => setNumber(Number(event.target.value))}
        className="w-14 rounded border border-dashed border-input bg-transparent px-1 py-0.5 text-sm focus:outline-none"
      />
      <input
        value={title}
        placeholder={placeholder}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && title.trim()) {
            onAdd(number, title.trim());
            setTitle("");
            setNumber(number + 1);
          }
        }}
        className="flex-1 rounded border border-dashed border-input bg-transparent px-1 py-0.5 text-sm text-muted-foreground focus:outline-none"
      />
    </div>
  );
}
