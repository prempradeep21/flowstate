"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ArtifactPayload,
  StickyNoteColorId,
} from "@/lib/artifactTypes";
import {
  STICKY_NOTE_COLOR_IDS,
  STICKY_NOTE_PALETTE,
  normalizeStickyNotePayload,
  stickyNoteThemeColors,
} from "@/lib/stickyNoteArtifact";
import { useCanvasStore } from "@/lib/store";

function ColorSwatch({
  colorId,
  selected,
  isDark,
  disabled,
  onSelect,
}: {
  colorId: StickyNoteColorId;
  selected: boolean;
  isDark: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const { bg } = stickyNoteThemeColors(colorId, isDark);
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
    />
  );
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
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const saveStickyNoteArtifactVersion = useCanvasStore(
    (s) => s.saveStickyNoteArtifactVersion,
  );
  const isDark = canvasTheme === "dark";

  const [text, setText] = useState(payload.data.text);
  const [colorId, setColorId] = useState(payload.data.colorId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    setText(payload.data.text);
    setColorId(payload.data.colorId);
    dirtyRef.current = false;
  }, [payload]);

  const canEdit = !sidebar && canvasContentInteractive;
  const colors = stickyNoteThemeColors(colorId, isDark);

  const persist = useCallback(
    (nextText: string, nextColorId: StickyNoteColorId) => {
      if (!artifactId) return;
      const nextPayload = normalizeStickyNotePayload({
        ...payload,
        data: { text: nextText, colorId: nextColorId },
      });
      saveStickyNoteArtifactVersion(artifactId, nextPayload);
      dirtyRef.current = false;
    },
    [artifactId, payload, saveStickyNoteArtifactVersion],
  );

  const flush = useCallback(() => {
    if (!dirtyRef.current) return;
    persist(text, colorId);
  }, [colorId, persist, text]);

  const handleColorSelect = (nextColorId: StickyNoteColorId) => {
    setColorId(nextColorId);
    dirtyRef.current = true;
    persist(text, nextColorId);
  };

  const displayText = text.trim() || (sidebar ? "" : "Write a note…");

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-canvas shadow-[2px_3px_8px_rgb(0_0_0/0.12)] ${
        fill ? "h-full min-h-0" : "min-h-[168px]"
      }`}
      style={{ backgroundColor: colors.bg, color: colors.ink }}
    >
      {canEdit ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            dirtyRef.current = true;
            setText(e.target.value);
          }}
          onBlur={flush}
          placeholder="Write a note…"
          data-selectable-text
          className="min-h-0 flex-1 resize-none border-0 bg-transparent px-4 pb-2 pt-4 text-[15px] leading-relaxed outline-none placeholder:opacity-50"
          style={{ color: colors.ink }}
        />
      ) : (
        <div
          className={`flex-1 px-4 pb-2 pt-4 text-[15px] leading-relaxed ${
            !text.trim() ? "opacity-50" : ""
          } ${sidebar ? "line-clamp-4" : "whitespace-pre-wrap break-words"}`}
          data-selectable-text
        >
          {displayText}
        </div>
      )}

      {canEdit ? (
        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
          <div className="flex items-center gap-1.5">
            {STICKY_NOTE_COLOR_IDS.map((id) => (
              <ColorSwatch
                key={id}
                colorId={id}
                selected={id === colorId}
                isDark={isDark}
                onSelect={() => handleColorSelect(id)}
              />
            ))}
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-45">
            {STICKY_NOTE_PALETTE[colorId]?.pantone ?? "108 C"}
          </span>
        </div>
      ) : sidebar && text.trim() ? null : (
        <div className="px-4 pb-3 pt-0">
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-35">
            {STICKY_NOTE_PALETTE[colorId]?.pantone ?? "108 C"}
          </span>
        </div>
      )}
    </div>
  );
}
