"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TIMELINE_EVENT_MAX_WORDS,
  countWords,
  isValidTimelineLabel,
} from "@/lib/timelineArtifact";

export function TimelineAddPopover({
  at,
  initialLabel = "",
  title,
  onSave,
  onCancel,
  onDelete,
  onAtChange,
  style,
}: {
  at: string;
  initialLabel?: string;
  title: string;
  onSave: (label: string, at: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onAtChange?: (at: string) => void;
  style?: React.CSSProperties;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState(initialLabel);
  const [dateValue, setDateValue] = useState(() => toDateInputValue(at));
  const wordCount = countWords(label);
  const valid = isValidTimelineLabel(label);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleSave = useCallback(() => {
    if (!valid) return;
    const iso = fromDateInputValue(dateValue);
    if (!iso) return;
    onSave(label.trim(), iso);
  }, [valid, label, dateValue, onSave]);

  return (
    <div
      className="absolute z-30 w-56 rounded-canvas border border-canvas-border bg-canvas-card p-3 shadow-lg"
      style={style}
      data-no-drag
      onClick={(e) => e.stopPropagation()}
    >
      <p className="mb-2 text-xs font-semibold text-canvas-ink">{title}</p>
      <input
        ref={inputRef}
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Short label"
        maxLength={120}
        className="mb-1 w-full rounded-md border border-canvas-border bg-canvas-artifactStage px-2 py-1.5 text-xs text-canvas-ink outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/40"
        data-no-drag
        onKeyDown={(e) => {
          if (e.key === "Enter" && valid) handleSave();
          if (e.key === "Escape") onCancel();
        }}
      />
      <p
        className={`mb-2 text-[10px] ${
          wordCount > TIMELINE_EVENT_MAX_WORDS
            ? "text-red-600"
            : "text-canvas-muted"
        }`}
      >
        {wordCount}/{TIMELINE_EVENT_MAX_WORDS} words
      </p>
      <input
        type="date"
        value={dateValue}
        onChange={(e) => {
          setDateValue(e.target.value);
          const iso = fromDateInputValue(e.target.value);
          if (iso) onAtChange?.(iso);
        }}
        className="mb-3 w-full rounded-md border border-canvas-border bg-canvas-artifactStage px-2 py-1.5 text-xs text-canvas-ink outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/40"
        data-no-drag
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!valid}
          onClick={handleSave}
          className="rounded-full bg-canvas-accent px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
          data-no-drag
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-3 py-1 text-xs text-canvas-muted hover:text-canvas-ink"
          data-no-drag
        >
          Cancel
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto text-xs text-red-600 hover:underline"
            data-no-drag
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
