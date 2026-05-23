import {
  getFamilyThreadIds,
  getThreadCardChain,
  getThreadRootCard,
  getThreadTitle,
  type ChatThreadState,
} from "@/lib/chatThreads";
import type { BranchGroup } from "@/lib/store";

export interface TranscriptExchange {
  question: string;
  answer: string;
}

export interface TranscriptThread {
  title: string;
  branchedFrom?: string;
  exchanges: TranscriptExchange[];
}

export interface TranscriptFamily {
  rootTitle: string;
  threads: TranscriptThread[];
}

export interface GroupTranscript {
  families: TranscriptFamily[];
}

function isBranchThread(state: ChatThreadState, threadId: string): boolean {
  const root = getThreadRootCard(state, threadId);
  if (!root) return false;
  return state.connections.some(
    (c) =>
      c.to === root.id &&
      (c.fromSide === "left" || c.fromSide === "right"),
  );
}

function getBranchOriginSnippet(
  state: ChatThreadState,
  threadId: string,
): string | undefined {
  const root = getThreadRootCard(state, threadId);
  if (!root) return undefined;
  const conn = state.connections.find(
    (c) =>
      c.to === root.id &&
      (c.fromSide === "left" || c.fromSide === "right"),
  );
  if (!conn) return undefined;
  const source = state.cards[conn.from];
  if (!source) return undefined;
  const q = source.question.trim();
  if (!q) return "earlier thread";
  return q.length > 80 ? `${q.slice(0, 80)}…` : q;
}

export function buildGroupTranscript(
  state: ChatThreadState,
  group: BranchGroup,
): GroupTranscript {
  const families: TranscriptFamily[] = [];

  for (const rootId of group.familyRootThreadIds) {
    const threadIds = getFamilyThreadIds(state, rootId);
    const threads: TranscriptThread[] = [];

    for (const tid of threadIds) {
      const chain = getThreadCardChain(state, tid);
      const exchanges: TranscriptExchange[] = [];
      for (const cardId of chain) {
        const card = state.cards[cardId];
        if (!card || card.status !== "done" || !card.answer.trim()) continue;
        exchanges.push({
          question: card.question.trim(),
          answer: card.answer.trim(),
        });
      }
      if (exchanges.length === 0) continue;

      const entry: TranscriptThread = {
        title: getThreadTitle(state, tid),
        exchanges,
      };
      if (isBranchThread(state, tid)) {
        const snippet = getBranchOriginSnippet(state, tid);
        if (snippet) entry.branchedFrom = snippet;
      }
      threads.push(entry);
    }

    if (threads.length > 0) {
      families.push({
        rootTitle: getThreadTitle(state, rootId),
        threads,
      });
    }
  }

  return { families };
}

export function transcriptHasContent(transcript: GroupTranscript): boolean {
  return transcript.families.some((f) =>
    f.threads.some((t) => t.exchanges.length > 0),
  );
}
