"use client";

import type { ArtifactPayload, TodoItem } from "@/lib/artifactTypes";
import { formatRichTextForDisplay } from "@/lib/richTextDisplay";

function SidebarCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border-2 ${
        checked
          ? "border-canvas-accent bg-canvas-accent"
          : "border-canvas-ink/40 bg-canvas-card"
      }`}
      aria-hidden
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="h-2 w-2 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2.5 6l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function SidebarTodoRow({ item }: { item: TodoItem }) {
  return (
    <li className="flex items-start gap-2 border-b border-canvas-ink/12 px-2.5 py-1.5 last:border-0">
      <SidebarCheckbox checked={item.checked} />
      <span
        className={`rich-text min-w-0 flex-1 text-canvas-caption leading-snug ${
          item.checked
            ? "text-canvas-muted line-through"
            : "text-canvas-ink"
        }`}
      >
        {formatRichTextForDisplay(item.label || "Untitled")}
      </span>
    </li>
  );
}

export function TodoSidebarPreview({
  payload,
}: {
  payload: Extract<ArtifactPayload, { type: "todo" }>;
}) {
  const items = payload.data.items;

  if (items.length === 0) {
    return (
      <div className="flex h-full min-h-[80px] items-center justify-center px-3 text-canvas-caption text-canvas-muted">
        Empty list
      </div>
    );
  }

  return (
    <div data-canvas-scroll className="h-full max-h-[180px] overflow-y-auto">
      <ul>
        {items.map((item) => (
          <SidebarTodoRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}
