"use client";

import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CardAnswerBody } from "@/components/cards/CardAnswerBody";
import { CardQaMenu } from "@/components/CardQaMenu";
import {
  buildSidebarTree,
  getThreadCardChain,
  getThreadTailCardId,
  pickDefaultThreadId,
  SidebarNode,
} from "@/lib/chatThreads";
import { useAutoResizeTextarea } from "@/lib/useAutoResizeTextarea";
import { useCanvasStore } from "@/lib/store";

function SidebarItem({
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
        className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
          isActive
            ? "bg-canvas-ink/8 text-canvas-ink"
            : "text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
        }`}
        style={{ paddingLeft: 10 + depth * 14 }}
      >
        {accent && (
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ background: accent }}
          />
        )}
        <span className="line-clamp-2 min-w-0 flex-1 leading-snug">
          {depth > 0 ? "↳ " : ""}
          {node.title}
        </span>
      </button>
      {node.branches.map((branch) => (
        <SidebarItem
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

function ChatMessages({ threadId }: { threadId: string }) {
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const chain = useMemo(
    () =>
      getThreadCardChain(
        { cards, connections, cardOrder, threads: {}, threadOrder: [] },
        threadId,
      ),
    [cards, connections, cardOrder, threadId],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chain, cards]);

  if (chain.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-[14px] text-canvas-muted">
        No messages in this chat yet.
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 md:px-8"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        {chain.map((cardId) => {
          const card = cards[cardId];
          if (!card || card.status === "empty") return null;

          return (
            <div
              key={cardId}
              className="relative flex flex-col gap-3 rounded-xl border border-transparent"
            >
              <CardQaMenu cardId={cardId} />
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-canvas-ink px-4 py-3 text-[15px] leading-relaxed text-canvas-card">
                  {card.question}
                </div>
              </div>

              {(card.status === "thinking" ||
                card.answer ||
                card.artifactPayload ||
                (card.images && card.images.length > 0)) && (
                <div className="flex flex-col gap-3">
                  {card.status === "thinking" ? (
                    <div className="text-[14px] text-canvas-muted animate-pulse">
                      {card.thinkingLabel ?? "Thinking"}…
                    </div>
                  ) : (
                    <CardAnswerBody
                      card={card}
                      isStreaming={card.status === "streaming"}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatComposer({ threadId }: { threadId: string }) {
  const createFollowUp = useCanvasStore((s) => s.createFollowUp);
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const [draft, setDraft] = useState("");
  const textarea = useAutoResizeTextarea(draft);

  const tailId = useMemo(
    () =>
      getThreadTailCardId(
        { cards, connections, cardOrder, threads: {}, threadOrder: [] },
        threadId,
      ),
    [cards, connections, cardOrder, threadId],
  );

  const tail = tailId ? cards[tailId] : null;
  const canSend =
    Boolean(tailId) &&
    tail?.status === "done" &&
    draft.trim().length > 0;

  const submit = () => {
    const q = draft.trim();
    if (!tailId || !q || !canSend) return;
    createFollowUp(tailId, q);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="shrink-0 border-t border-canvas-border bg-canvas-card px-4 py-4 md:px-8">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref={textarea.ref}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            textarea.resize();
          }}
          onKeyDown={onKeyDown}
          placeholder={
            tail?.status === "done"
              ? "Ask a follow-up…"
              : "Waiting for the current reply…"
          }
          disabled={tail?.status !== "done"}
          rows={1}
          className="block min-h-[44px] min-w-0 flex-1 resize-none overflow-hidden rounded-xl border border-canvas-border bg-canvas-bg px-4 py-2.5 text-[15px] leading-normal text-canvas-ink outline-none placeholder:text-canvas-muted/70 focus:border-canvas-ink/30 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          className="mb-0.5 shrink-0 rounded-xl bg-canvas-ink px-4 py-2.5 text-[13px] font-medium text-canvas-card transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Send
        </button>
      </div>
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
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-canvas-border bg-canvas-card">
        <div className="border-b border-canvas-border px-4 py-3">
          <h2 className="text-[13px] font-semibold text-canvas-ink">Chats</h2>
          <p className="mt-0.5 text-[11px] text-canvas-muted">
            Branches appear nested under their parent.
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {sidebar.length === 0 ? (
            <p className="px-2 py-4 text-[13px] text-canvas-muted">
              Start a conversation on the canvas (press Q) to see it here.
            </p>
          ) : (
            sidebar.map((node) => (
              <SidebarItem
                key={node.threadId}
                node={node}
                depth={0}
                activeThreadId={activeThreadId}
                threads={threads}
                onSelect={setActiveThreadId}
              />
            ))
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {activeThreadId ? (
          <>
            <ChatMessages threadId={activeThreadId} />
            <ChatComposer threadId={activeThreadId} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[14px] text-canvas-muted">
            Select or start a chat from the canvas.
          </div>
        )}
      </div>
    </div>
  );
}
