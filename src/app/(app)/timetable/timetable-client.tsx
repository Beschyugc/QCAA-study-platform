"use client";

import { useState, useTransition } from "react";
import {
  createTimetableBlock,
  deleteTimetableBlock,
  importTimetableCsv,
  extractTimetableFromPhoto,
} from "./actions";

type Subject = { id: string; name: string; shortCode: string };
type Block = {
  id: string;
  periodName: string;
  startTime: string;
  endTime: string;
  room: string | null;
  label: string | null;
  subject: { name: string; shortCode: string; colour: string } | null;
};
type DayGroup = { day: number; name: string; blocks: Block[] };

export function TimetableClient({
  subjects,
  blocksByDay,
}: {
  subjects: Subject[];
  blocksByDay: DayGroup[];
}) {
  const [pending, startTransition] = useTransition();
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [extracting, startExtract] = useTransition();

  const [day, setDay] = useState(1);
  const [period, setPeriod] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("09:50");
  const [room, setRoom] = useState("");

  function handleAdd() {
    if (!period.trim() || !subjectId) return;
    startTransition(async () => {
      await createTimetableBlock(day, period, subjectId, null, start, end, room || null);
      setPeriod("");
      setRoom("");
    });
  }

  function handleImport() {
    startTransition(async () => {
      const { created, total } = await importTimetableCsv(csvText);
      setImportResult(`Added ${created} of ${total} lines.`);
      setCsvText("");
    });
  }

  function handlePhoto(file: File) {
    setPhotoError(null);
    startExtract(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await extractTimetableFromPhoto(formData);
      if (result.error) {
        setPhotoError(result.error);
        return;
      }
      setCsvText(result.csv ?? "");
      setShowImport(true);
    });
  }

  if (subjects.length === 0) {
    return <p className="text-sm text-muted-foreground">No subjects yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-md border border-border p-4">
        <h2 className="text-sm font-medium">Add class block</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
          <input
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Period (e.g. P3)"
            className="w-24 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          />
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          />
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          />
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Room (optional)"
            className="w-28 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAdd}
            disabled={pending}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => setShowImport((v) => !v)}
            className="rounded-md border border-input px-3 py-2 text-sm"
          >
            Paste from spreadsheet
          </button>
          <label className="rounded-md border border-input px-3 py-2 text-sm cursor-pointer">
            {extracting ? "Reading photo…" : "Upload photo of timetable/calendar"}
            <input
              type="file"
              accept="image/*"
              disabled={extracting}
              onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
        {photoError && <p className="text-xs text-destructive">{photoError}</p>}

        {showImport && (
          <div className="space-y-2 pt-2">
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"Mon,P1,MM,08:45,09:35,B12\nMon,P2,Gym,17:00,18:00,\n…"}
              rows={10}
              className="w-full rounded-md border border-input bg-transparent p-2 font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              One line per block: day, period, subject code ({subjects.map((s) => s.shortCode).join("/")}) or a free-text label like "Gym", start, end, room.
              Review and edit before importing — this is a draft, especially if it came from a photo.
            </p>
            <button
              onClick={handleImport}
              disabled={pending || !csvText.trim()}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Import
            </button>
            {importResult && <p className="text-xs text-muted-foreground">{importResult}</p>}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {blocksByDay
          .filter((g) => g.blocks.length > 0)
          .map((group) => (
            <div key={group.day}>
              <h3 className="mb-1 text-sm font-medium">{group.name}</h3>
              <ul className="space-y-1">
                {group.blocks.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: b.subject?.colour ?? "#a1a1aa" }}
                    />
                    <span className="flex-1">
                      {b.startTime}-{b.endTime} {b.periodName}: {b.subject?.name ?? b.label}
                      {b.room ? ` (${b.room})` : ""}
                    </span>
                    <button
                      onClick={() => startTransition(() => deleteTimetableBlock(b.id))}
                      className="text-xs text-destructive underline"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        {blocksByDay.every((g) => g.blocks.length === 0) && (
          <p className="text-sm text-muted-foreground">No timetable entered yet.</p>
        )}
      </div>
    </div>
  );
}
