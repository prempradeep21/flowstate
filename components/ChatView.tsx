"use client";

import { useEffect, useMemo, useRef } from "react";
import { ArtifactAttachmentPill } from "@/components/artifacts/ArtifactAttachmentPill";
import { CardAnswerBody } from "@/components/cards/CardAnswerBody";
import { ChatComposer } from "@/components/ChatComposer";
import { CardQaMenu } from "@/components/CardQaMenu";
import {
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
} from "@/lib/sessionArtifacts";
import {
  buildSidebarTree,
  getThreadCardChain,
  getThreadTailCardId,
  pickDefaultThreadId,
  SidebarNode,
} from "@/lib/chatThreads";
import { FollowUpOptions, useCanvasStore } from "@/lib/store";

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

function QnaTurnBlock({ cardId }: { cardId: string }) {
  const card = useCanvasStore((s) => s.cards[cardId]);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const accent = useCanvasStore(
    (s) => s.threads[card?.threadId ?? ""]?.accentColour,
  );

  if (!card || card.status === "empty") return null;

  const showAnswer =
    card.status === "thinking" ||
    card.answer ||
    card.artifactPayload ||
    card.outputArtifactId ||
    (card.images && card.images.length > 0);

  return (
    <div className="relative border-t border-canvas-border/80 first:border-t-0">
      <div className="absolute right-3 top-3 z-20">
        <CardQaMenu cardId={cardId} />
      </div>

      <QaTranslucentSurface>
        <QaQuestionSection accentColour={accent} className="px-5 py-4">
          {card.attachedArtifacts?.map((ref) => {
            const art = sessionArtifacts[ref.artifactId];
            if (!art) return null;
            const ver =
              getVersionById(art, ref.versionId) ?? getLatestVersion(art);
            return (
              <div key={ref.artifactId} className="mb-3">
                <ArtifactAttachmentPill
                  kind={art.kind}
                  title={artifactDisplayTitle(art, ver)}
                  versionNumber={ver.number}
                />
              </div>
            );
          })}

          <p className="pr-8 text-[15px] font-medium leading-snug text-canvas-question">
            {card.question}
          </p>
        </QaQuestionSection>

        {showAnswer && (
          <div className="px-5 pb-4">
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
      </QaTranslucentSurface>
    </div>
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

  const visibleChain = chain.filter(
    (id) => cards[id] && cards[id].status !== "empty",
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [visibleChain, cards]);

  if (visibleChain.length === 0) {
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
      <div className="relative mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-canvas-border bg-transparent shadow-card">
          {visibleChain.map((cardId) => (
            <QnaTurnBlock key={cardId} cardId={cardId} />
          ))}
        </div>
      </div>
    </div>
  );
}

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
            <ThreadChatComposer threadId={activeThreadId} />
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
