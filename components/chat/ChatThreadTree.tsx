"use client";

import type { SidebarNode } from "@/lib/chatThreads";

function ThreadTreeItem({
  node,
  depth,
  activeThreadId,
  threads,
  onSelect,
}: {
  node: SidebarNode;
  depth: number;
  activeThreadId: string | null;
  threads: Record<string, { accentColour: string }>;
  onSelect: (threadId: string) => void;
}) {
  const isActive = node.threadId === activeThreadId;
  const accent = threads[node.threadId]?.accentColour;

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(node.threadId)}
        title={node.title}
        className={`flex w-full items-center gap-2.5 rounded-canvas px-2.5 py-2 text-left text-canvas-body-sm transition-colors ${
          isActive
            ? "bg-canvas-accentSoft font-medium text-canvas-accent"
            : "text-canvas-ink hover:bg-canvas-ink/5"
        }`}
        style={{ paddingLeft: 10 + depth * 16 }}
      >
        {accent && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: accent }}
          />
        )}
        <span className="min-w-0 flex-1 truncate leading-snug">
          {depth > 0 ? (
            <span className="text-canvas-muted" aria-hidden>
              ↳{" "}
            </span>
          ) : null}
          {node.title}
        </span>
      </button>
      {node.branches.map((branch) => (
        <ThreadTreeItem
          key={branch.threadId}
          node={branch}
          depth={depth + 1}
          activeThreadId={activeThreadId}
          threads={threads}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export function ChatThreadTree({
  nodes,
  activeThreadId,
  threads,
  onSelect,
}: {
  nodes: SidebarNode[];
  activeThreadId: string | null;
  threads: Record<string, { accentColour: string }>;
  onSelect: (threadId: string) => void;
}) {
  return (
    <>
      {nodes.map((node) => (
        <ThreadTreeItem
          key={node.threadId}
          node={node}
          depth={0}
          activeThreadId={activeThreadId}
          threads={threads}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
