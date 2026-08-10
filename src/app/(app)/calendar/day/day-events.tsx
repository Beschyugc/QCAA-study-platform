"use client";

import { useState, useTransition } from "react";
import { createEvent, updateEvent, deleteEvent, setEventStatus } from "../actions";

type EventItem = {
  id: string;
  title: string;
  start: string;
  end: string;
  subjectId: string | null;
  subjectCode: string | null;
  subjectName: string | null;
  topicId: string | null;
  topicTitle: string | null;
  activityType: string | null;
  status: string;
  notes: string | null;
  source: string;
};

type SubjectOption = {
  id: string;
  shortCode: string;
  name: string;
  topics: { id: string; label: string }[];
};

const ACTIVITY_TYPES = [
  "flashcards", "questions", "lesson", "past_paper",
  "mistake_repair", "assumed_knowledge", "notes", "other",
];

// NOT iso.slice(11, 16) — that reads the UTC wall-clock time embedded in
// the ISO string, but events are created and displayed in local time
// (Australia/Brisbane, UTC+10, no DST). new Date(iso).getHours() converts
// back through the browser's own local timezone instead, which round-trips
// correctly as long as the browser and the server that wrote the event
// agree on timezone — true here, since this only ever runs on localhost.
function hm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function DayEvents({
  dateKey,
  events,
  subjects,
}: {
  dateKey: string;
  events: EventItem[];
  subjects: SubjectOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(events.length === 0);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [activityType, setActivityType] = useState("");
  const [notes, setNotes] = useState("");

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  function reset() {
    setTitle("");
    setStartTime("16:00");
    setEndTime("17:00");
    setSubjectId("");
    setTopicId("");
    setActivityType("");
    setNotes("");
  }

  function handleCreate() {
    if (!title.trim()) return;
    startTransition(async () => {
      await createEvent({
        title,
        date: dateKey,
        startTime,
        endTime,
        subjectId: subjectId || undefined,
        topicId: topicId || undefined,
        activityType: activityType || undefined,
        notes: notes || undefined,
      });
      reset();
      setShowForm(false);
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="signage text-[0.64rem] font-semibold text-[color:var(--text-faint)]">
          Study blocks &amp; events
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-[0.64rem] font-semibold text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-md border border-[color:var(--hairline)] bg-transparent px-2 py-1.5 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-md border border-[color:var(--hairline)] bg-transparent px-2 py-1.5 text-sm"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-md border border-[color:var(--hairline)] bg-transparent px-2 py-1.5 text-sm"
            />
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId("");
              }}
              className="rounded-md border border-[color:var(--hairline)] bg-transparent px-2 py-1.5 text-sm"
            >
              <option value="">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {selectedSubject && selectedSubject.topics.length > 0 && (
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="rounded-md border border-[color:var(--hairline)] bg-transparent px-2 py-1.5 text-sm"
              >
                <option value="">No topic</option>
                {selectedSubject.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="rounded-md border border-[color:var(--hairline)] bg-transparent px-2 py-1.5 text-sm"
            >
              <option value="">Activity type</option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full rounded-md border border-[color:var(--hairline)] bg-transparent p-2 text-sm"
          />
          <button
            onClick={handleCreate}
            disabled={pending || !title.trim()}
            className="rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--state-good)", color: "#06231a" }}
          >
            Add to {dateKey}
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {events.map((event) => (
          <EventRow key={event.id} event={event} dateKey={dateKey} subjects={subjects} />
        ))}
        {events.length === 0 && !showForm && (
          <p className="text-xs text-[color:var(--text-faint)]">Nothing added for this day yet.</p>
        )}
      </ul>
    </div>
  );
}

function EventRow({
  event,
  dateKey,
  subjects,
}: {
  event: EventItem;
  dateKey: string;
  subjects: SubjectOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [startTime, setStartTime] = useState(hm(event.start));
  const [endTime, setEndTime] = useState(hm(event.end));

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const statusStyle: Record<string, string> = {
    scheduled: "border-[color:var(--hairline)] text-[color:var(--text-muted)]",
    completed: "border-[color:var(--state-good)] text-[color:var(--state-good)]",
    skipped: "border-[color:var(--text-faint)] text-[color:var(--text-faint)] line-through",
  };

  function save() {
    startTransition(async () => {
      await updateEvent(event.id, { title, date: dateKey, startTime, endTime });
      setEditing(false);
    });
  }

  return (
    <li className={`rounded-xl border px-3.5 py-3 ${statusStyle[event.status] ?? statusStyle.scheduled}`}>
      {editing ? (
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-[color:var(--hairline)] bg-transparent px-2 py-1 text-sm text-[color:var(--text)]"
          />
          <div className="flex gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-md border border-[color:var(--hairline)] bg-transparent px-2 py-1 text-sm text-[color:var(--text)]"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-md border border-[color:var(--hairline)] bg-transparent px-2 py-1 text-sm text-[color:var(--text)]"
            />
            <button
              onClick={save}
              disabled={pending}
              className="rounded-md px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--state-good)", color: "#06231a" }}
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border border-[color:var(--hairline)] px-3 py-1 text-xs text-[color:var(--text-muted)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[color:var(--text)]">{event.title}</p>
              <p className="tabular-nums text-[0.64rem] text-[color:var(--text-faint)]">
                {hm(event.start)}–{hm(event.end)}
                {event.subjectName && ` · ${event.subjectName}`}
                {event.topicTitle && ` · ${event.topicTitle}`}
                {event.activityType && ` · ${event.activityType.replace("_", " ")}`}
                {event.source === "recommendation" && " · from recommendation"}
              </p>
              {event.notes && (
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">{event.notes}</p>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[0.64rem]">
            {event.status !== "completed" && (
              <button
                onClick={() => startTransition(() => setEventStatus(event.id, "completed"))}
                disabled={pending}
                className="text-[color:var(--state-good)] hover:underline"
              >
                Mark complete
              </button>
            )}
            {event.status !== "scheduled" && (
              <button
                onClick={() => startTransition(() => setEventStatus(event.id, "scheduled"))}
                disabled={pending}
                className="text-[color:var(--text-muted)] hover:underline"
              >
                Reopen
              </button>
            )}
            {event.status !== "skipped" && (
              <button
                onClick={() => startTransition(() => setEventStatus(event.id, "skipped"))}
                disabled={pending}
                className="text-[color:var(--text-muted)] hover:underline"
              >
                Skip
              </button>
            )}
            <button
              onClick={() => setEditing(true)}
              className="text-[color:var(--text-muted)] hover:underline"
            >
              Edit
            </button>
            {confirmingDelete ? (
              <>
                <span className="text-[color:var(--text-faint)]">Delete this?</span>
                <button
                  onClick={() => startTransition(() => deleteEvent(event.id))}
                  disabled={pending}
                  className="font-semibold text-[color:var(--state-danger)] hover:underline"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="text-[color:var(--text-muted)] hover:underline"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                disabled={pending}
                className="text-[color:var(--state-danger)] hover:underline"
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </li>
  );
}
