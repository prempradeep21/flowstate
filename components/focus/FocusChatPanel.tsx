"use client";

import { useMemo, useState } from "react";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatThreadMessages } from "@/components/chat/QnaThreadMessages";
import { FocusNewChatDialog } from "@/components/focus/FocusNewChatDialog";
import { useAuth } from "@/components/AuthProvider";
import { getThreadTailCardId, getThreadTitle } from "@/lib/chatThreads";
import { FollowUpOptions, useCanvasStore } from "@/lib/store";

/** "Current chat" panel — active thread's Q&A chain plus the focus composer. */
export function FocusChatPanel() {
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const threads = useCanvasStore((s) => s.threads);
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  const focusDraftChat = useCanvasStore((s) => s.focusDraftChat);
  const focusArtifactId = useCanvasStore((s) => s.focusArtifactId);
  const focusStartNewChat = useCanvasStore((s) => s.focusStartNewChat);
  const submitFocusMessage = useCanvasStore((s) => s.submitFocusMessage);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const { user, stampContributor } = useAuth();
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);

  const threadState = useMemo(
    () => ({ cards, connections, cardOrder, threads: {}, threadOrder: [] }),
    [cards, connections, cardOrder],
  );

  const isDraft = focusDraftChat != null;
  const thread =
    !isDraft && activeThreadId ? threads[activeThreadId] : undefined;

  const tailId =
    !isDraft && activeThreadId
      ? getThreadTailCardId(threadState, activeThreadId)
      : null;
  const tail = tailId ? cards[tailId] : null;
  const threadIsEmpty = !tail || tail.status === "empty";
  const waitingOnReply =
    !isDraft && tail != null && tail.status !== "done" && tail.status !== "empty";
  const composerDisabled = canvasReadOnly || waitingOnReply;
  const highlightComposer = !composerDisabled && (isDraft || threadIsEmpty);

  const title = isDraft
    ? "New chat"
    : activeThreadId
      ? getThreadTitle(
          { ...threadState, threads, threadOrder: [] },
          activeThreadId,
        )
      : "Current chat";

  const handleNewChat = () => {
    if (focusArtifactId && sessionArtifacts[focusArtifactId]) {
      setNewChatDialogOpen(true);
    } else {
      focusStartNewChat(null);
    }
  };

  const onSubmit = (question: string, options?: FollowUpOptions) => {
    const cardId = submitFocusMessage(question, options);
    if (cardId && user?.id) stampContributor(user.id, cardId);
  };

  return (
    <section className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-canvas-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {thread && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: thread.accentColour }}
            />
          )}
          <h2 className="truncate text-canvas-body-sm font-semibold text-canvas-ink">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          disabled={canvasReadOnly || isDraft}
          className="shrink-0 rounded-canvas border border-canvas-border px-2.5 py-1 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          New chat
        </button>
      </div>

      {isDraft || threadIsEmpty || !activeThreadId ? (
        <div className="flex flex-1 items-center justify-center px-8 text-center text-canvas-body text-canvas-muted">
          Ask anything to start{isDraft ? " a new chat" : ""}.
        </div>
      ) : (
        <ChatThreadMessages
          threadId={activeThreadId}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        />
      )}

      <div
        className={`shrink-0 border-t border-canvas-border bg-canvas-bg px-4 py-4 ${
          highlightComposer ? "rounded-canvas ring-2 ring-canvas-accent" : ""
        }`}
      >
        <ChatComposer
          autoFocus={highlightComposer}
          placeholder={
            waitingOnReply
              ? "Waiting for the current reply…"
              : isDraft || threadIsEmpty
                ? "Ask anything"
                : "Follow up"
          }
          disabled={composerDisabled}
          onSubmit={onSubmit}
        />
      </div>

      {newChatDialogOpen && (
        <FocusNewChatDialog onClose={() => setNewChatDialogOpen(false)} />
      )}
    </section>
  );
}
