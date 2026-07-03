"use client";

import { useEffect, useRef, useState } from "react";

export function EditableArtifactTitle({
  displayTitle,
  renameTitle,
  canRename,
  onRename,
  className,
  as: Tag = "h2",
  wrap = false,
}: {
  displayTitle: string;
  renameTitle: string;
  canRename: boolean;
  onRename: (title: string) => void;
  className?: string;
  as?: "h2" | "p" | "span";
  /** Allow multi-line titles (e.g. repo hub) instead of single-line truncate. */
  wrap?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(renameTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(renameTitle);
  }, [editing, renameTitle]);

  useEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === renameTitle.trim()) return;
    onRename(trimmed);
  };

  const cancel = () => {
    setDraft(renameTitle);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        data-no-drag
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className={`min-w-0 flex-1 rounded border border-canvas-border bg-canvas-card px-2 py-0.5 text-canvas-heading font-semibold leading-tight text-canvas-ink outline-none focus:border-canvas-accent ${className ?? ""}`}
        aria-label="Artifact title"
      />
    );
  }

  return (
    <Tag
      onDoubleClick={(e) => {
        if (!canRename) return;
        e.stopPropagation();
        e.preventDefault();
        setEditing(true);
      }}
      title={canRename ? "Double-click to rename" : undefined}
      className={`min-w-0 flex-1 text-canvas-heading font-semibold leading-tight text-canvas-ink ${
        wrap ? "w-full break-words whitespace-normal" : "truncate"
      } ${canRename ? "cursor-text" : ""} ${className ?? ""}`}
      data-no-drag={canRename ? "" : undefined}
    >
      {displayTitle}
    </Tag>
  );
}
