"use client";

import { useMemo } from "react";
import { ChatThreadTree } from "@/components/chat/ChatThreadTree";
import { buildSidebarTree } from "@/lib/chatThreads";
import { useCanvasStore } from "@/lib/store";

/** "All chats" panel — same nested-by-branch tree as the chat view sidebar. */
export function FocusAllChatsPanel() {
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const threads = useCanvasStore((s) => s.threads);
  const threadOrder = useCanvasStore((s) => s.threadOrder);
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  const focusDraftChat = useCanvasStore((s) => s.focusDraftChat);
  const focusSelectChat = useCanvasStore((s) => s.focusSelectChat);

  const sidebar = useMemo(
    () =>
      buildSidebarTree({
        cards,
        connections,
        cardOrder,
        threads,
        threadOrder,
      }),
    [cards, connections, cardOrder, threads, threadOrder],
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
      <div className="shrink-0 border-b border-canvas-border px-4 py-3">
        <h2 className="text-canvas-body-sm font-semibold text-canvas-ink">
          All chats
        </h2>
        <p className="mt-0.5 text-canvas-caption text-canvas-muted">
          Branches appear nested under their parent.
        </p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        {sidebar.length === 0 ? (
          <p className="px-2 py-4 text-canvas-body-sm text-canvas-muted">
            Your chats will appear here.
          </p>
        ) : (
          <ChatThreadTree
            nodes={sidebar}
            activeThreadId={focusDraftChat ? null : activeThreadId}
            threads={threads}
            onSelect={focusSelectChat}
          />
        )}
      </nav>
    </section>
  );
}
