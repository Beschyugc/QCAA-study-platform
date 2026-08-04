"use client";

import { useRef, useState, useTransition } from "react";
import { uploadOcclusionImage, createOcclusionCards, type Region } from "./actions";

type Topic = { id: string; label: string };

export function OcclusionEditor({
  shortCode,
  subjectId,
  topics,
}: {
  shortCode: string;
  subjectId: string;
  topics: Topic[];
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<Region | null>(null);
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [uploading, startUpload] = useTransition();
  const [saving, startSave] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  function handleFile(file: File) {
    startUpload(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const { url } = await uploadOcclusionImage(formData);
      setImageUrl(url);
      setRegions([]);
    });
  }

  function toPercent(clientX: number, clientY: number) {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    };
  }

  function handleMouseDown(e: React.MouseEvent) {
    setDrawing(toPercent(e.clientX, e.clientY));
    setDraft(null);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!drawing) return;
    const p = toPercent(e.clientX, e.clientY);
    setDraft({
      x: Math.min(drawing.x, p.x),
      y: Math.min(drawing.y, p.y),
      w: Math.abs(p.x - drawing.x),
      h: Math.abs(p.y - drawing.y),
    });
  }

  function handleMouseUp() {
    if (draft && draft.w > 1 && draft.h > 1) {
      setRegions((r) => [...r, draft]);
    }
    setDrawing(null);
    setDraft(null);
  }

  function handleSave() {
    if (!imageUrl || regions.length === 0 || !topicId) return;
    startSave(async () => {
      await createOcclusionCards(shortCode, subjectId, topicId, imageUrl, regions);
      setImageUrl(null);
      setRegions([]);
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
    <div className="space-y-4">
      {!imageUrl ? (
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="text-sm"
        />
      ) : (
        <>
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="relative w-full cursor-crosshair select-none overflow-hidden rounded-md border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Occlusion source" className="w-full" draggable={false} />
            {regions.map((r, i) => (
              <div
                key={i}
                className="absolute border-2 border-primary bg-primary/40"
                style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}
              />
            ))}
            {draft && (
              <div
                className="absolute border-2 border-dashed border-primary"
                style={{ left: `${draft.x}%`, top: `${draft.y}%`, width: `${draft.w}%`, height: `${draft.h}%` }}
              />
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Drag on the image to add a region. {regions.length} region
            {regions.length === 1 ? "" : "s"} added.
          </p>

          <ul className="space-y-1">
            {regions.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span>Region {i + 1}</span>
                <input
                  placeholder="Label (optional)"
                  value={r.label ?? ""}
                  onChange={(e) =>
                    setRegions((prev) =>
                      prev.map((p, idx) =>
                        idx === i ? { ...p, label: e.target.value } : p,
                      ),
                    )
                  }
                  className="flex-1 rounded border border-input bg-transparent px-2 py-1 text-xs"
                />
                <button
                  onClick={() =>
                    setRegions((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="text-xs text-destructive"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
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
            <button
              onClick={handleSave}
              disabled={saving || regions.length === 0}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Creating…" : `Create ${regions.length} card${regions.length === 1 ? "" : "s"}`}
            </button>
            <button
              onClick={() => {
                setImageUrl(null);
                setRegions([]);
              }}
              className="text-sm text-muted-foreground underline"
            >
              Start over
            </button>
          </div>
        </>
      )}
    </div>
  );
}
