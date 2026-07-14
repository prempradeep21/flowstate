"use client";

import { useEffect, useMemo } from "react";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatThreadTree } from "@/components/chat/ChatThreadTree";
import { ChatThreadMessages } from "@/components/chat/QnaThreadMessages";
import {
  buildSidebarTree,
  getThreadTailCardId,
  pickDefaultThreadId,
} from "@/lib/chatThreads";
import { FollowUpOptions, useCanvasStore } from "@/lib/store";

function ThreadChatComposer({ threadId }: { threadId: string }) {
  const createFollowUp = useCanvasStore((s) => s.createFollowUp);
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const cardOrder = useCanvasStore((s) => s.cardOrder);

  const tailId = useMemo(
    () =>
      getThreadTailCardId(
        { cards, connections, cardOrder, threads: {}, threadOrder: [] },
        threadId,
      ),
    [cards, connections, cardOrder, threadId],
  );

  const tail = tailId ? cards[tailId] : null;
  const disabled = tail?.status !== "done";

  const onSubmit = (question: string, options?: FollowUpOptions) => {
    if (!tailId) return;
    createFollowUp(tailId, question, options);
  };

  return (
    <div className="shrink-0 border-t border-canvas-border bg-canvas-bg px-4 py-4 md:px-8">
      <ChatComposer
        placeholder={disabled ? "Waiting for the current reply…" : "Follow up"}
        disabled={disabled}
        onSubmit={onSubmit}
      />
    </div>
  );
}

export function ChatView() {
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const threads = useCanvasStore((s) => s.threads);
  const threadOrder = useCanvasStore((s) => s.threadOrder);
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  const setActiveThreadId = useCanvasStore((s) => s.setActiveThreadId);

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

  useEffect(() => {
    if (activeThreadId && threads[activeThreadId]) return;
    const next = pickDefaultThreadId({
      cards,
      connections,
      cardOrder,
      threads,
      threadOrder,
    });
    if (next) setActiveThreadId(next);
  }, [
    activeThreadId,
    cards,
    connections,
    cardOrder,
    threads,
    threadOrder,
    setActiveThreadId,
  ]);

  return (
    <div className="flex h-full w-full bg-canvas-bg">
      <aside className="chat-thread-panel flex w-[260px] shrink-0 flex-col border-r border-canvas-border bg-canvas-card">
        <div className="border-b border-canvas-border px-4 py-3">
          <h2 className="text-canvas-body-sm font-semibold text-canvas-ink">Chats</h2>
          <p className="mt-0.5 text-canvas-caption text-canvas-muted">
            Branches appear nested under their parent.
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {sidebar.length === 0 ? (
            <p className="px-2 py-4 text-canvas-body-sm text-canvas-muted">
              Start a conversation on the canvas (press Q) to see it here.
            </p>
          ) : (
            <ChatThreadTree
              nodes={sidebar}
              activeThreadId={activeThreadId}
              threads={threads}
              onSelect={setActiveThreadId}
            />
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {activeThreadId ? (
          <>
            <ChatThreadMessages threadId={activeThreadId} />
            <ThreadChatComposer threadId={activeThreadId} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-canvas-body text-canvas-muted">
            Select or start a chat from the canvas.
          </div>
        )}
      </div>
    </div>
  );
}
