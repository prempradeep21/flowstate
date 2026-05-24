import {
  getFamilyThreadIds,
  getThreadCardChain,
  getThreadRootCard,
  getThreadTitle,
  type ChatThreadState,
} from "@/lib/chatThreads";
import type { GroupTranscript, TranscriptExchange } from "@/lib/buildGroupTranscript";
import type { BranchGroup } from "@/lib/store";

export function summaryExchangeKey(
  threadId: string,
  cardId: string,
): string {
  return `${threadId}:${cardId}`;
}

export function collectSummaryExchangeKeys(
  state: ChatThreadState,
  group: BranchGroup,
): string[] {
  const keys: string[] = [];
  for (const rootId of group.familyRootThreadIds) {
    for (const tid of getFamilyThreadIds(state, rootId)) {
      for (const cardId of getThreadCardChain(state, tid)) {
        const card = state.cards[cardId];
        if (!card || card.status !== "done" || !card.answer.trim()) continue;
        keys.push(summaryExchangeKey(tid, cardId));
      }
    }
  }
  return keys.sort();
}

export function buildSummaryContentFingerprint(
  state: ChatThreadState,
  group: BranchGroup,
): string {
  return collectSummaryExchangeKeys(state, group).join("|");
}

export function groupHasNewSummaryContent(
  state: ChatThreadState,
  group: BranchGroup,
): boolean {
  if (!group.summaryMarkdown) return false;
  const current = buildSummaryContentFingerprint(state, group);
  if (!group.summaryContentFingerprint) return false;
  return current !== group.summaryContentFingerprint;
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

function parseFingerprintKeys(fingerprint: string | undefined): Set<string> {
  if (!fingerprint) return new Set();
  return new Set(
    fingerprint.split("|").filter((k) => k.length > 0),
  );
}

export function buildFlowstateGroupTranscript(
  state: ChatThreadState,
  group: BranchGroup,
): GroupTranscript {
  const known = parseFingerprintKeys(group.summaryContentFingerprint);
  const families: GroupTranscript["families"] = [];

  for (const rootId of group.familyRootThreadIds) {
    const threadIds = getFamilyThreadIds(state, rootId);
    const threads: GroupTranscript["families"][number]["threads"] = [];

    for (const tid of threadIds) {
      const chain = getThreadCardChain(state, tid);
      const exchanges: TranscriptExchange[] = [];
      for (const cardId of chain) {
        const key = summaryExchangeKey(tid, cardId);
        if (known.has(key)) continue;
        const card = state.cards[cardId];
        if (!card || card.status !== "done" || !card.answer.trim()) continue;
        exchanges.push({
          question: card.question.trim(),
          answer: card.answer.trim(),
        });
      }
      if (exchanges.length === 0) continue;

      const entry: GroupTranscript["families"][number]["threads"][number] = {
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
