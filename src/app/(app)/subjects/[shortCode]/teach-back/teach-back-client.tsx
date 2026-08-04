"use client";

import { useState, useTransition } from "react";
import { RichText } from "@/components/rich-text";
import { startTeachBackSession, submitTeachBack, updateRagAfterTeachBack } from "./actions";
import type { RagStatus } from "../actions";

type Objective = { id: string; text: string; ragStatus: string; breadcrumb: string };
type Message = { role: "user" | "assistant"; content: string };
type SessionStatus = "questioning" | "offered_explanation" | "explained" | "resolved" | null;

const RAG_COLOUR: Record<string, string> = {
  red: "#ef4444",
  amber: "#f59e0b",
  green: "#22c55e",
  unrated: "#a1a1aa",
};

export function TeachBackClient({
  shortCode,
  objectives,
}: {
  shortCode: string;
  objectives: Objective[];
}) {
  const [objectiveId, setObjectiveId] = useState(objectives[0]?.id ?? "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<SessionStatus>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ragUpdated, setRagUpdated] = useState(false);
  const [pending, startTransition] = useTransition();

  const objective = objectives.find((o) => o.id === objectiveId);

  function begin() {
    startTransition(async () => {
      const id = await startTeachBackSession(objectiveId);
      setSessionId(id);
      setMessages([]);
      setStatus("questioning");
      setRagUpdated(false);
      setError(null);
    });
  }

  function send() {
    if (!input.trim() || !sessionId) return;
    const text = input;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setError(null);
    startTransition(async () => {
      const result = await submitTeachBack(sessionId, text);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: result.text! }]);
      setStatus(result.status);
    });
  }

  function reset() {
    setSessionId(null);
    setMessages([]);
    setStatus(null);
    setError(null);
    setRagUpdated(false);
  }

  const ended = status === "resolved" || status === "explained";

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: objective ? RAG_COLOUR[objective.ragStatus] : undefined }}
        />
        <select
          value={objectiveId}
          onChange={(e) => setObjectiveId(e.target.value)}
          disabled={!!sessionId}
          className="flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-sm disabled:opacity-70"
        >
          {objectives.map((o) => (
            <option key={o.id} value={o.id}>
              {o.text} — {o.breadcrumb}
            </option>
          ))}
        </select>
      </div>

      {!sessionId ? (
        <button
          onClick={begin}
          disabled={pending || !objectiveId}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Start
        </button>
      ) : (
        <>
          <div className="mb-3 min-h-40 space-y-3 rounded-md border border-border p-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Explain this in your own words to get started.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[85%] rounded-md px-3 py-2 text-left text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <RichText text={m.content} />
                </div>
              </div>
            ))}
            {pending && <p className="text-sm text-muted-foreground">Thinking…</p>}
          </div>

          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}

          {!ended ? (
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Your explanation…"
                className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
              <button
                onClick={send}
                disabled={pending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Send
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {status === "resolved"
                  ? "Nailed it. Update the RAG rating?"
                  : "Logged as unresolved. Update the RAG rating?"}
              </p>
              {!ragUpdated ? (
                <div className="flex gap-2">
                  {(["red", "amber", "green"] as RagStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        startTransition(async () => {
                          await updateRagAfterTeachBack(shortCode, objectiveId, s);
                          setRagUpdated(true);
                        })
                      }
                      className="rounded-md border border-input px-3 py-1.5 text-sm capitalize"
                      style={{ borderColor: RAG_COLOUR[s] }}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => setRagUpdated(true)}
                    className="text-sm text-muted-foreground underline"
                  >
                    Leave as is
                  </button>
                </div>
              ) : (
                <button onClick={reset} className="text-sm text-muted-foreground underline">
                  Teach back another objective
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
