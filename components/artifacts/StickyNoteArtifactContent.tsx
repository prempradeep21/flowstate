"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type {
  ArtifactPayload,
  StickyNoteColorId,
} from "@/lib/artifactTypes";
import {
  STICKY_NOTE_BODY_DEFAULT_HEIGHT,
  STICKY_NOTE_BODY_MIN_HEIGHT,
  STICKY_NOTE_COLOR_IDS,
  STICKY_NOTE_PALETTE,
  normalizeStickyNotePayload,
  stickyNoteContentFloors,
  stickyNoteThemeColors,
} from "@/lib/stickyNoteArtifact";
import { useCanvasStore } from "@/lib/store";

export type StickyNoteArtifactActions = {
  save: () => void;
  discard: () => void;
};

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
      aria-label={`${colorId} note`}
      aria-pressed={selected}
      onClick={onSelect}
      className={`h-5 w-5 rounded-full border transition-transform ${
        selected
          ? "scale-110 border-canvas-ink/50 ring-2 ring-canvas-ink/25"
          : "border-canvas-ink/15 hover:scale-105"
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
  stickyContext,
}: {
  payload: Extract<ArtifactPayload, { type: "stickynote" }>;
  artifactId?: string;
  fill?: boolean;
  sidebar?: boolean;
  canvasContentInteractive?: boolean;
  stickyContext?: {
    isEditing: boolean;
    onDirtyChange?: (dirty: boolean) => void;
    onActionsReady?: (actions: StickyNoteArtifactActions) => void;
    onRequestEdit?: () => void;
    onDone?: () => void;
    onSaved?: () => void;
  };
}) {
  const saveStickyNoteArtifactVersion = useCanvasStore(
    (s) => s.saveStickyNoteArtifactVersion,
  );

  const isEditing = stickyContext?.isEditing ?? false;
  const [draft, setDraft] = useState(payload);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(payload);
  }, [payload]);

  const isDirty = !payloadsEqual(draft, payload);

  useEffect(() => {
    stickyContext?.onDirtyChange?.(isDirty);
  }, [isDirty, stickyContext]);

  useEffect(() => {
    if (!isEditing) return;
    const id = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const len = textareaRef.current?.value.length ?? 0;
      textareaRef.current?.setSelectionRange(len, len);
    });
    return () => window.cancelAnimationFrame(id);
  }, [isEditing]);

  const canInteract = !sidebar && canvasContentInteractive;
  const readOnly = !isEditing || !canInteract;
  const colors = stickyNoteThemeColors(draft.data.colorId);

  const handleSave = useCallback(() => {
    if (!artifactId || !isDirty) return;
    const nextPayload = normalizeStickyNotePayload(draft);
    saveStickyNoteArtifactVersion(artifactId, nextPayload);
    stickyContext?.onSaved?.();
  }, [
    artifactId,
    draft,
    isDirty,
    saveStickyNoteArtifactVersion,
    stickyContext,
  ]);

  const handleDiscard = useCallback(() => {
    setDraft(payload);
  }, [payload]);

  useEffect(() => {
    stickyContext?.onActionsReady?.({
      save: handleSave,
      discard: handleDiscard,
    });
  }, [handleDiscard, handleSave, stickyContext]);

  const toolbarBtn =
    "flex h-9 shrink-0 items-center rounded-full px-4 text-canvas-body-sm font-medium transition-colors";

  const editControl = !isEditing ? (
    <button
      type="button"
      onClick={() => stickyContext?.onRequestEdit?.()}
      className={`${toolbarBtn} border border-canvas-ink/20 text-canvas-ink hover:bg-canvas-bg`}
      data-no-drag
    >
      Edit
    </button>
  ) : isDirty ? (
    <button
      type="button"
      onClick={handleSave}
      className={`${toolbarBtn} bg-canvas-accent text-white hover:opacity-90`}
      data-no-drag
    >
      Save
    </button>
  ) : (
    <button
      type="button"
      onClick={() => stickyContext?.onDone?.()}
      className={`${toolbarBtn} border border-canvas-ink/20 text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink`}
      data-no-drag
    >
      Cancel
    </button>
  );

  const handleExitEdit = useCallback(() => {
    if (isDirty) handleDiscard();
    stickyContext?.onDone?.();
  }, [handleDiscard, isDirty, stickyContext]);

  const handleColorSelect = (nextColorId: StickyNoteColorId) => {
    if (readOnly) return;
    setDraft((prev) => ({
      ...prev,
      data: { ...prev.data, colorId: nextColorId },
    }));
  };

  const displayText = draft.data.text.trim() || (sidebar ? "" : "Write a note…");
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
      onDoubleClick={() => {
        if (canInteract && !isEditing) stickyContext?.onRequestEdit?.();
      }}
    >
      {isEditing && canInteract ? (
        <textarea
          ref={textareaRef}
          value={draft.data.text}
          onChange={(e) => {
            setDraft((prev) => ({
              ...prev,
              data: { ...prev.data, text: e.target.value },
            }));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (isDirty) {
                handleSave();
              } else {
                handleExitEdit();
              }
            }
          }}
          placeholder="Write a note…"
          data-selectable-text
          className="min-h-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-4 pb-2 pt-4 text-[15px] leading-relaxed outline-none placeholder:opacity-50"
          style={{ color: colors.ink }}
        />
      ) : (
        <div
          className={`flex-1 overflow-y-auto px-4 pb-2 pt-4 text-[15px] leading-relaxed ${
            !draft.data.text.trim() ? "opacity-50" : ""
          } ${sidebar ? "line-clamp-4" : "whitespace-pre-wrap break-words"}`}
          data-selectable-text
        >
          {displayText}
        </div>
      )}

      <div className="flex items-center justify-end px-4 pb-3 pt-0">
        <span className="text-[10px] font-medium uppercase tracking-wide opacity-35">
          {STICKY_NOTE_PALETTE[draft.data.colorId]?.label ?? "Turbo"}
        </span>
      </div>
    </div>
  );

  if (sidebar) {
    return noteBody;
  }

  return (
    <ArtifactContentStage
      fill={fill}
      artifactId={artifactId}
      showControls={canInteract}
      canvasChrome={fill}
      className="!bg-transparent min-h-0 flex-1"
      controls={
        canInteract ? (
          <>
            <div className="flex min-w-0 items-center gap-2">
              {STICKY_NOTE_COLOR_IDS.map((id) => (
                <ColorSwatch
                  key={id}
                  colorId={id}
                  selected={id === draft.data.colorId}
                  disabled={readOnly}
                  onSelect={() => handleColorSelect(id)}
                />
              ))}
              {editControl}
            </div>
          </>
        ) : undefined
      }
    >
      {noteBody}
    </ArtifactContentStage>
  );
}
