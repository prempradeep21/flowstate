"use client";

// Canvas memory: faint cross-branch awareness. Each thread keeps a rolling
// ~50-token gist (refreshed by a cheap background call after each exchange);
// when a card asks a question, the relevance-ranked gists of *sibling*
// branches ride along so the model has a faint idea of what else is being
// explored — without ever inheriting those branches' actual context.

import { collectAncestorCardIds } from "@/lib/buildAncestorHistory";
import { getThreadTitle, type ChatThreadState } from "@/lib/chatThreads";
import { capByChars, rankByRelevance } from "@/lib/memory/relevance";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useCanvasStore } from "@/lib/store";

export interface CanvasMemoryEntry {
  title: string;
  gist: string;
}

const MAX_SIBLING_GISTS = 5;
const MAX_BLOCK_CHARS = 1600;
const MAX_GIST_CHARS = 400;
const GIST_DEBOUNCE_MS = 3000;

function threadState(): ChatThreadState {
  const state = useCanvasStore.getState();
  return {
    cards: state.cards,
    cardOrder: state.cardOrder,
    connections: state.connections,
    threads: state.threads,
    threadOrder: state.threadOrder,
  };
}

/**
 * Sibling-branch gists for a card's next question: every thread's gist except
 * the threads on the card's own ancestor chain (those are already in its real
 * context). Ranked by lexical overlap with the question (recency breaks
 * ties), capped by count and characters — no LLM call on this path.
 */
export function collectSiblingGists(
  cardId: string,
  question: string,
): CanvasMemoryEntry[] {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return [];

  const excludedThreads = new Set<string>([card.threadId]);
  const graph = { cards: state.cards, connections: state.connections };
  for (const ancestorId of collectAncestorCardIds(graph, cardId)) {
    const threadId = state.cards[ancestorId]?.threadId;
    if (threadId) excludedThreads.add(threadId);
  }

  const chatState = threadState();
  const candidates = Object.entries(state.threadGists)
    .filter(
      ([threadId, entry]) =>
        !excludedThreads.has(threadId) &&
        entry.gist.trim() &&
        state.threads[threadId],
    )
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .map(([threadId, entry]) => ({
      title: getThreadTitle(chatState, threadId),
      gist: entry.gist.trim().slice(0, MAX_GIST_CHARS),
    }));

  const ranked = rankByRelevance(
    candidates,
    (c) => `${c.title} ${c.gist}`,
    question,
  ).slice(0, MAX_SIBLING_GISTS);

  return capByChars(ranked, (c) => c.title.length + c.gist.length, MAX_BLOCK_CHARS);
}

const gistTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Debounced per-thread rolling gist refresh; safe to call on every completion. */
export function scheduleThreadGistRefresh(cardId: string): void {
  const card = useCanvasStore.getState().cards[cardId];
  if (!card) return;
  const threadId = card.threadId;

  const existing = gistTimers.get(threadId);
  if (existing) clearTimeout(existing);
  gistTimers.set(
    threadId,
    setTimeout(() => {
      gistTimers.delete(threadId);
      void refreshThreadGist(threadId, cardId);
    }, GIST_DEBOUNCE_MS),
  );
}

async function refreshThreadGist(
  threadId: string,
  cardId: string,
): Promise<void> {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card || card.threadId !== threadId) return;
  const answer = card.answer?.trim() ?? "";
  const previous = state.threadGists[threadId];

  try {
    const res = await fetch("/api/gist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previousGist: previous?.gist,
        threadTitle: getThreadTitle(threadState(), threadId),
        question: card.question,
        answer,
      }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { gist?: string };
    const gist = typeof data.gist === "string" ? data.gist.trim() : "";
    if (!gist) return;
    useCanvasStore.getState().setThreadGist(threadId, {
      gist: gist.slice(0, MAX_GIST_CHARS),
      updatedAt: Date.now(),
      turnCount: (previous?.turnCount ?? 0) + 1,
    });
  } catch {
    // transient network failure — the next exchange refreshes the gist
  }
}

/** Fire-and-forget: buffer this question for user-memory extraction. */
function pingUserMemoryExtract(question: string): void {
  if (!isSupabaseConfigured() || !question.trim()) return;
  void fetch("/api/memory/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  }).catch(() => {
    // server no-ops for guests; failures are harmless
  });
}

/**
 * Called when a card's ask completes. Skips failed/empty exchanges, then
 * refreshes the branch gist and buffers the question for memory extraction.
 */
export function notifyExchangeComplete(cardId: string): void {
  const card = useCanvasStore.getState().cards[cardId];
  if (!card || !card.question.trim()) return;
  const answer = card.answer?.trim() ?? "";
  const hasContent =
    (answer && !answer.startsWith("⚠️")) ||
    card.artifactPayload ||
    card.outputArtifactId;
  if (!hasContent) return;

  scheduleThreadGistRefresh(cardId);
  pingUserMemoryExtract(card.question);
}
