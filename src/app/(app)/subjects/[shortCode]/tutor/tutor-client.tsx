"use client";

import { useEffect, useState, useTransition } from "react";
import { RichText } from "@/components/rich-text";
import { askQuestion, getHint, getRequestCountToday } from "./actions";

type Topic = { id: string; label: string };
type Mode = "ask" | "hint";
type ChatMessage = { role: "user" | "assistant"; content: string };

export function TutorClient({ subjectId, topics }: { subjectId: string; topics: Topic[] }) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [mode, setMode] = useState<Mode>("ask");
  const [requestCount, setRequestCount] = useState<number | null>(null);

  useEffect(() => {
    getRequestCountToday().then(setRequestCount);
  }, []);

  if (topics.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active topics yet — unlock one first.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
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
        {requestCount !== null && (
          <span className="text-xs text-muted-foreground">
            {requestCount} AI requests today
          </span>
        )}
      </div>

      <div className="mb-4 flex gap-1">
        {(["ask", "hint"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1 text-xs ${
              mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {m === "ask" ? "Ask" : "Hint"}
          </button>
        ))}
      </div>

      {mode === "ask" ? (
        <AskPanel subjectId={subjectId} topicId={topicId} onRequestSent={() => setRequestCount((c) => (c ?? 0) + 1)} />
      ) : (
        <HintPanel subjectId={subjectId} topicId={topicId} onRequestSent={() => setRequestCount((c) => (c ?? 0) + 1)} />
      )}
    </div>
  );
}

function AskPanel({
  subjectId,
  topicId,
  onRequestSent,
}: {
  subjectId: string;
  topicId: string;
  onRequestSent: () => void;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    if (!input.trim()) return;
    const question = input;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setError(null);
    startTransition(async () => {
      const result = await askQuestion(subjectId, topicId, subjectId, conversationId, question);
      onRequestSent();
      if (result.error) {
        setError(result.error);
        return;
      }
      setConversationId(result.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: result.answer! }]);
    });
  }

  return (
    <div>
      <div className="mb-3 min-h-40 space-y-3 rounded-md border border-border p-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask anything about this topic — context (objectives, RAG ratings) is sent automatically.
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
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a question…"
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
    </div>
  );
}

function HintPanel({
  subjectId,
  topicId,
  onRequestSent,
}: {
  subjectId: string;
  topicId: string;
  onRequestSent: () => void;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [locked, setLocked] = useState(false);
  const [level, setLevel] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [hints, setHints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function nextHint() {
    if (!problem.trim()) return;
    const nextLevel = (level + 1) as 1 | 2 | 3 | 4;
    setError(null);
    startTransition(async () => {
      const result = await getHint(subjectId, topicId, subjectId, conversationId, problem, nextLevel);
      onRequestSent();
      if (result.error) {
        setError(result.error);
        return;
      }
      setLocked(true);
      setConversationId(result.conversationId);
      setLevel(nextLevel);
      setHints((h) => [...h, result.hint!]);
    });
  }

  function reset() {
    setProblem("");
    setLocked(false);
    setLevel(0);
    setHints([]);
    setConversationId(null);
    setError(null);
  }

  return (
    <div>
      <textarea
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        disabled={locked}
        placeholder="What are you stuck on?"
        rows={2}
        className="mb-2 w-full rounded-md border border-input bg-transparent p-2 text-sm disabled:opacity-70"
      />
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}

      <div className="mb-3 space-y-2">
        {hints.map((hint, i) => (
          <div key={i} className="rounded-md border border-border bg-muted p-3 text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Level {i + 1}
            </span>
            <RichText text={hint} />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={nextHint}
          disabled={pending || level >= 4 || !problem.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Thinking…" : level === 0 ? "Get a hint" : level >= 4 ? "Full solution given" : "Next hint"}
        </button>
        {locked && (
          <button onClick={reset} className="text-sm text-muted-foreground underline">
            New problem
          </button>
        )}
      </div>
    </div>
  );
}
