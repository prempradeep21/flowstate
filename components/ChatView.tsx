"use client";

import { useEffect, useMemo } from "react";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatThreadTree } from "@/components/chat/ChatThreadTree";
import { ChatThreadMessages } from "@/components/chat/QnaThreadMessages";
import {
  buildSidebarTree,
  getBranchParentThreadId,
  getThreadTailCardId,
  getThreadTitle,
  pickDefaultThreadId,
} from "@/lib/chatThreads";
import { FollowUpOptions, useCanvasStore } from "@/lib/store";
import { isConversationCard } from "@/lib/conversationCard";

/** Thread sidebar width; the workspace centers the bottom toolbar past it. */
export const CHAT_SIDEBAR_WIDTH_PX = 304;
/** Room the open artifacts panel takes: 462px panel + 12px inset + 12px gap. */
export const CHAT_RIGHT_PANEL_CLEARANCE_PX = 486;

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
  // An imported transcript thread ends on a conversation card, whose status is
  // always "done" — so the status check alone leaves this composer looking live
  // while createFollowUp refuses the write, swallowing whatever was typed.
  const importedThread = isConversationCard(tail);
  const disabled = tail?.status !== "done" || importedThread;

  const onSubmit = (question: string, options?: FollowUpOptions) => {
    if (!tailId) return;
    createFollowUp(tailId, question, options);
  };

  return (
    // Bottom padding clears the floating bottom toolbar (bottom-5 + its height),
    // which stays put across views — the composer sits above it, never under.
    <div className="shrink-0 px-8 pb-[104px] pt-2">
      <ChatComposer
        placeholder={
          importedThread
            ? "Imported transcript — branching from it is coming soon"
            : disabled
              ? "Waiting for the current reply…"
              : "Follow up"
        }
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
  const rightPanelCollapsed = useCanvasStore((s) => s.rightPanelCollapsed);

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

  const threadState = { cards, connections, cardOrder, threads, threadOrder };
  const activeTitle = activeThreadId
    ? getThreadTitle(threadState, activeThreadId)
    : null;
  const parentThreadId = activeThreadId
    ? getBranchParentThreadId(threadState, activeThreadId)
    : null;
  const parentTitle = parentThreadId
    ? getThreadTitle(threadState, parentThreadId)
    : null;
  const activeAccent = activeThreadId
    ? threads[activeThreadId]?.accentColour
    : undefined;

  return (
    <div className="flex h-full w-full bg-canvas-card">
      <aside
        className="chat-thread-panel flex shrink-0 flex-col border-r border-canvas-border bg-canvas-bg"
        style={{ width: CHAT_SIDEBAR_WIDTH_PX }}
      >
        {/* The floating canvas chip (AppLeftPanel) sits here in every view. */}
        <div className="h-[82px] shrink-0" aria-hidden />
        <div className="flex items-baseline justify-between px-5 pb-2">
          <h2 className="text-canvas-caption font-medium text-canvas-muted">
            Chats
          </h2>
          {threadOrder.length > 0 ? (
            <span className="text-canvas-caption tabular-nums text-canvas-muted">
              {threadOrder.length}
            </span>
          ) : null}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6">
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

      <section
        className="flex min-w-0 flex-1 flex-col transition-[padding] duration-panel ease-panel"
        // An open artifacts panel floats over the right edge; make room for it
        // instead of hiding text behind it.
        style={{
          paddingRight: rightPanelCollapsed ? 0 : CHAT_RIGHT_PANEL_CLEARANCE_PX,
        }}
      >
        {/* Header row shares its band with the floating top-right chrome, so
            the title keeps clear of it on the right. With the panel open only
            the buttons beside it remain in this column. */}
        <header
          className={`flex h-[70px] shrink-0 items-center pl-8 ${
            rightPanelCollapsed ? "pr-[min(26rem,35vw)]" : "pr-[min(16rem,25vw)]"
          }`}
        >
          {activeTitle ? (
            <div className="flex min-w-0 items-center gap-2.5">
              {activeAccent ? (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: activeAccent }}
                  aria-hidden
                />
              ) : null}
              <h1
                className="truncate text-canvas-body font-medium text-canvas-ink"
                title={activeTitle}
              >
                {activeTitle}
              </h1>
              {parentTitle ? (
                <span
                  className="hidden min-w-0 truncate text-canvas-body-sm text-canvas-muted lg:inline"
                  title={parentTitle}
                >
                  ↳ branched from {parentTitle}
                </span>
              ) : null}
            </div>
          ) : null}
        </header>

        {activeThreadId ? (
          <>
            <ChatThreadMessages threadId={activeThreadId} />
            <ThreadChatComposer threadId={activeThreadId} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center pb-[104px] text-canvas-body text-canvas-muted">
            Select or start a chat from the canvas.
          </div>
        )}
      </section>
    </div>
  );
}
