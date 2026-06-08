"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload, TodoItem, TodoPriority } from "@/lib/artifactTypes";
import { useCanvasStore } from "@/lib/store";
import {
  cloneTodoPayload,
  createTodoItem,
  todoCompletionStats,
} from "@/lib/todoArtifact";

const PRIORITY_OPTIONS: { value: TodoPriority | ""; label: string }[] = [
  { value: "", label: "—" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

const PRIORITY_STYLES: Record<TodoPriority, string> = {
  low: "text-canvas-muted bg-canvas-border/40",
  medium: "text-canvas-warningText bg-canvas-warningSoft ring-1 ring-canvas-warningRing/80",
  high: "text-canvas-accent bg-canvas-artifactIconBg ring-1 ring-canvas-accent/30",
};

function payloadsEqual(
  a: Extract<ArtifactPayload, { type: "todo" }>,
  b: Extract<ArtifactPayload, { type: "todo" }>,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function formatDueDate(iso: string): string {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function TodoCheckbox({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`group relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all duration-200 ease-out ${
        checked
          ? "border-canvas-accent bg-canvas-accent"
          : "border-canvas-border bg-canvas-card hover:border-canvas-muted"
      } ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}`}
    >
      <svg
        viewBox="0 0 12 12"
        className={`h-2.5 w-2.5 text-white transition-all duration-200 ${
          checked ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M2.5 6l2.5 2.5 4.5-5" />
      </svg>
    </button>
  );
}

function TodoRow({
  item,
  index,
  readOnly,
  onUpdate,
  onRemove,
}: {
  item: TodoItem;
  index: number;
  readOnly: boolean;
  onUpdate: (patch: Partial<TodoItem>) => void;
  onRemove: () => void;
}) {
  return (
    <li
      className="group todo-row-animate flex items-start gap-3 border-b border-canvas-border/50 px-4 py-3 last:border-0"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <TodoCheckbox
        checked={item.checked}
        disabled={readOnly}
        onChange={() => onUpdate({ checked: !item.checked })}
      />

      <div className="min-w-0 flex-1 space-y-2">
        {readOnly ? (
          <p
            className={`text-canvas-body leading-snug ${
              item.checked
                ? "text-canvas-muted line-through decoration-canvas-border"
                : "text-canvas-ink"
            }`}
          >
            {item.label || "Untitled"}
          </p>
        ) : (
          <input
            type="text"
            value={item.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="What needs doing?"
            className={`w-full bg-transparent text-canvas-body leading-snug outline-none placeholder:text-canvas-muted/60 ${
              item.checked
                ? "text-canvas-muted line-through decoration-canvas-border"
                : "text-canvas-ink"
            }`}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          {readOnly ? (
            <>
              {item.dueDate && (
                <span className="inline-flex items-center gap-1 text-canvas-caption text-canvas-muted">
                  <CalendarIcon />
                  {formatDueDate(item.dueDate)}
                </span>
              )}
              {item.priority && (
                <span
                  className={`rounded-full px-2 py-0.5 text-canvas-micro font-medium uppercase tracking-wide ${PRIORITY_STYLES[item.priority]}`}
                >
                  {item.priority}
                </span>
              )}
            </>
          ) : (
            <>
              <label className="inline-flex items-center gap-1 rounded-canvas border border-transparent px-1 py-0.5 text-canvas-caption text-canvas-muted transition-colors hover:border-canvas-border hover:bg-canvas-card">
                <CalendarIcon />
                <input
                  type="date"
                  value={item.dueDate ?? ""}
                  onChange={(e) =>
                    onUpdate({ dueDate: e.target.value || undefined })
                  }
                  className="cursor-pointer bg-transparent text-canvas-caption text-canvas-muted outline-none [color-scheme:light]"
                />
              </label>
              <select
                value={item.priority ?? ""}
                onChange={(e) =>
                  onUpdate({
                    priority: (e.target.value as TodoPriority) || undefined,
                  })
                }
                className={`rounded-full px-2 py-0.5 text-canvas-micro font-medium uppercase tracking-wide outline-none transition-colors ${
                  item.priority
                    ? PRIORITY_STYLES[item.priority]
                    : "bg-canvas-border/30 text-canvas-muted"
                }`}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value || "none"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove item"
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-canvas text-canvas-muted opacity-0 transition-all hover:bg-canvas-dangerSoft hover:text-canvas-danger group-hover:opacity-100"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <path
              d="M4 4l8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </li>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      className="h-3 w-3 shrink-0 opacity-70"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <rect x="1.5" y="2.5" width="11" height="10" rx="1" />
      <path d="M1.5 5.5h11M4.5 1v2M9.5 1v2" />
    </svg>
  );
}

export interface TodoArtifactActions {
  save: () => void;
  discard: () => void;
}

export function TodoArtifactContent({
  artifactId,
  payload,
  versionId,
  latestVersionId,
  isEditing,
  fill = false,
  onDirtyChange,
  onActionsReady,
  onSaved,
}: {
  artifactId: string;
  payload: Extract<ArtifactPayload, { type: "todo" }>;
  versionId: string;
  latestVersionId: string;
  isEditing: boolean;
  fill?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onActionsReady?: (actions: TodoArtifactActions) => void;
  onSaved?: () => void;
}) {
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const saveTodoArtifactVersion = useCanvasStore((s) => s.saveTodoArtifactVersion);
  const isLatest = versionId === latestVersionId;
  const readOnly = !isEditing || !isLatest || canvasReadOnly;

  const [draft, setDraft] = useState(() => cloneTodoPayload(payload));
  const [externalNotice, setExternalNotice] = useState<string | null>(null);
  const savedVersionRef = useRef(versionId);
  const justSavedRef = useRef(false);

  const isDirty = useMemo(
    () => isEditing && isLatest && !payloadsEqual(draft, payload),
    [draft, payload, isEditing, isLatest],
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const { done, total } = todoCompletionStats(
    readOnly ? payload.data.items : draft.data.items,
  );
  const progress = total > 0 ? (done / total) * 100 : 0;

  useEffect(() => {
    if (justSavedRef.current) {
      justSavedRef.current = false;
      savedVersionRef.current = versionId;
      setDraft(cloneTodoPayload(payload));
      return;
    }

    if (versionId !== savedVersionRef.current) {
      setDraft(cloneTodoPayload(payload));
      savedVersionRef.current = versionId;
    }
  }, [versionId, payload]);

  useEffect(() => {
    if (!isEditing) {
      setDraft(cloneTodoPayload(payload));
      setExternalNotice(null);
    }
  }, [isEditing, payload]);

  useEffect(() => {
    if (!isEditing) return;
    const hadDirty = isDirty;
    if (versionId !== savedVersionRef.current && hadDirty) {
      setExternalNotice("Updated elsewhere — unsaved changes discarded.");
    }
  }, [versionId, isEditing, isDirty]);

  const updateItem = useCallback((id: string, patch: Partial<TodoItem>) => {
    setDraft((prev) => ({
      ...prev,
      data: {
        items: prev.data.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      },
    }));
    setExternalNotice(null);
  }, []);

  const removeItem = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      data: { items: prev.data.items.filter((item) => item.id !== id) },
    }));
    setExternalNotice(null);
  }, []);

  const addItem = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      data: { items: [...prev.data.items, createTodoItem()] },
    }));
    setExternalNotice(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!isDirty) return;
    justSavedRef.current = true;
    saveTodoArtifactVersion(artifactId, draft);
    setExternalNotice(null);
    onSaved?.();
  }, [artifactId, draft, isDirty, onSaved, saveTodoArtifactVersion]);

  const handleDiscard = useCallback(() => {
    setDraft(cloneTodoPayload(payload));
    setExternalNotice(null);
  }, [payload]);

  useEffect(() => {
    onActionsReady?.({ save: handleSave, discard: handleDiscard });
  }, [handleSave, handleDiscard, onActionsReady]);

  const displayItems = readOnly ? payload.data.items : draft.data.items;

  return (
    <ArtifactContentStage fill={fill} className={fill ? "flex flex-col" : ""}>
      <div className={`flex flex-col ${fill ? "min-h-0 flex-1" : ""}`}>
        <div className="shrink-0 border-b border-canvas-border/60 px-4 pb-3 pt-4">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="font-display text-canvas-body-sm tracking-wide text-canvas-ink">
              {total === 0
                ? "Nothing here yet"
                : done === total
                  ? "All done"
                  : `${total - done} remaining`}
            </span>
            {total > 0 && (
              <span className="text-canvas-caption tabular-nums text-canvas-muted">
                {done}/{total}
              </span>
            )}
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-canvas-border/60">
            <div
              className="h-full rounded-full bg-canvas-accent transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {!isLatest && (
            <p className="mt-2 text-canvas-caption italic text-canvas-muted">
              Viewing an older version — switch to latest to edit.
            </p>
          )}
          {externalNotice && (
            <p className="mt-2 text-canvas-caption text-canvas-warningText">{externalNotice}</p>
          )}
        </div>

        <div
          data-canvas-scroll
          className={`overflow-y-auto ${fill ? "min-h-0 flex-1" : "max-h-[380px]"}`}
        >
          {displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-canvas-artifactIconBg text-canvas-accent">
                <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
                  <path
                    d="M6 10l2.5 2.5L14 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="font-display text-canvas-body text-canvas-ink">
                {readOnly ? "No items in this version" : "Start your list"}
              </p>
              <p className="mt-1 text-canvas-compact text-canvas-muted">
                {readOnly
                  ? "This snapshot has no tasks."
                  : "Add a task below to get going."}
              </p>
            </div>
          ) : (
            <ul>
              {displayItems.map((item, index) => (
                <TodoRow
                  key={item.id}
                  item={item}
                  index={index}
                  readOnly={readOnly}
                  onUpdate={(patch) => updateItem(item.id, patch)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {isEditing && !readOnly && (
          <div className="shrink-0 border-t border-canvas-border/60 bg-canvas-card/80 backdrop-blur-sm">
            <button
              type="button"
              onClick={addItem}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-canvas-body-sm text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-canvas border border-dashed border-canvas-border text-canvas-muted">
                +
              </span>
              Add task
            </button>
          </div>
        )}
      </div>
    </ArtifactContentStage>
  );
}
