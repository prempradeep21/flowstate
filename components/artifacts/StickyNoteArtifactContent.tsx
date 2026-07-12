"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ArtifactPayload,
  StickyNoteColorId,
} from "@/lib/artifactTypes";
import {
  STICKY_NOTE_BODY_DEFAULT_HEIGHT,
  STICKY_NOTE_BODY_MIN_HEIGHT,
  STICKY_NOTE_PICKER_COLOR_IDS,
  normalizeStickyNotePayload,
  stickyNoteContentFloors,
  stickyNoteThemeColors,
} from "@/lib/stickyNoteArtifact";
import { useCanvasStore } from "@/lib/store";

function ColorSwatch({
  colorId,
  selected,
  disabled,
  onSelect,
}: {
  colorId: StickyNoteColorId;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const { bg } = stickyNoteThemeColors(colorId);
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={colorId === "turbo" ? "Yellow note" : "Dark gray note"}
      aria-pressed={selected}
      onClick={onSelect}
      className={`h-4 w-4 rounded-full border ${
        selected
          ? "border-canvas-accent ring-1 ring-canvas-accent/40"
          : "border-canvas-ink/20"
      } ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}`}
      style={{ backgroundColor: bg }}
      data-no-drag
    />
  );
}

function payloadsEqual(
  a: Extract<ArtifactPayload, { type: "stickynote" }>,
  b: Extract<ArtifactPayload, { type: "stickynote" }>,
): boolean {
  return a.data.text === b.data.text && a.data.colorId === b.data.colorId;
}

export function StickyNoteArtifactContent({
  payload,
  artifactId,
  fill = false,
  sidebar = false,
  canvasContentInteractive = true,
}: {
  payload: Extract<ArtifactPayload, { type: "stickynote" }>;
  artifactId?: string;
  fill?: boolean;
  sidebar?: boolean;
  canvasContentInteractive?: boolean;
}) {
  const saveStickyNoteArtifactVersion = useCanvasStore(
    (s) => s.saveStickyNoteArtifactVersion,
  );

  const [draft, setDraft] = useState(payload);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(payload);
  }, [payload]);

  const persist = useCallback(
    (next: Extract<ArtifactPayload, { type: "stickynote" }>) => {
      if (!artifactId) return;
      const normalized = normalizeStickyNotePayload(next);
      if (payloadsEqual(normalized, payload)) return;
      saveStickyNoteArtifactVersion(artifactId, normalized);
    },
    [artifactId, payload, saveStickyNoteArtifactVersion],
  );

  const schedulePersist = useCallback(
    (next: Extract<ArtifactPayload, { type: "stickynote" }>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => persist(next), 400);
    },
    [persist],
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const canInteract = !sidebar && canvasContentInteractive;
  const colors = stickyNoteThemeColors(draft.data.colorId);

  const handleColorSelect = (nextColorId: StickyNoteColorId) => {
    if (!canInteract) return;
    const next = {
      ...draft,
      data: { ...draft.data, colorId: nextColorId },
    };
    setDraft(next);
    persist(next);
  };

  const handleTextChange = (text: string) => {
    const next = { ...draft, data: { ...draft.data, text } };
    setDraft(next);
    schedulePersist(next);
  };

  const handleBlur = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    persist(draft);
  };

  const contentFloors = stickyNoteContentFloors();
  const bodyMinHeight = fill
    ? STICKY_NOTE_BODY_DEFAULT_HEIGHT
    : STICKY_NOTE_BODY_MIN_HEIGHT;

  const noteBody = (
    <div
      className={`relative flex flex-col overflow-hidden shadow-[2px_3px_8px_rgb(0_0_0/0.12)] ${
        fill ? "min-h-0 flex-1 rounded-canvas-sm" : "rounded-canvas"
      }`}
      style={{
        backgroundColor: colors.bg,
        color: colors.ink,
        minWidth: fill ? contentFloors.minWidth : undefined,
        minHeight: bodyMinHeight,
      }}
    >
      {canInteract ? (
        <textarea
          value={draft.data.text}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Write a note…"
          data-selectable-text
          className="min-h-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-4 py-4 text-[15px] leading-relaxed outline-none placeholder:opacity-50"
          style={{ color: colors.ink }}
        />
      ) : (
        <div
          className={`flex-1 overflow-y-auto px-4 py-4 text-[15px] leading-relaxed ${
            !draft.data.text.trim() ? "opacity-50" : ""
          } ${sidebar ? "line-clamp-4" : "whitespace-pre-wrap break-words"}`}
          data-selectable-text
        >
          {draft.data.text.trim() || (sidebar ? "" : "Write a note…")}
        </div>
      )}

      {canInteract ? (
        <div
          className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5"
          data-no-drag
        >
          {STICKY_NOTE_PICKER_COLOR_IDS.map((id) => (
            <ColorSwatch
              key={id}
              colorId={id}
              selected={id === draft.data.colorId}
              onSelect={() => handleColorSelect(id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );

  if (sidebar) {
    return noteBody;
  }

  return (
    <div
      className={`min-h-0 flex-1 ${fill ? "flex flex-col" : ""}`}
    >
      {noteBody}
    </div>
  );
}
