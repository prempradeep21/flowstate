"use client";

import { computeAutoLayout } from "@/lib/autoLayout";
import { pickDefaultThreadId } from "@/lib/chatThreads";
import { buildSummaryContentFingerprint } from "@/lib/groupSummaryStaleness";
import {
  captureGraphSnapshot,
  GraphSnapshot,
  MAX_UNDO_STACK,
} from "@/lib/undo";
import { create } from "zustand";

export type ClaudeModel =
  | "claude-opus-4-7"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5";

export type CardStatus = "empty" | "thinking" | "streaming" | "done";

export interface CardImage {
  url: string;
  thumb: string;
  alt: string;
}

export interface CardSize {
  w: number;
  h: number;
}

export interface Card {
  id: string;
  threadId: string;
  question: string;
  answer: string;
  status: CardStatus;
  thinkingLabel?: string;
  position: { x: number; y: number };
  parentCardId: string | null;
  parentConversationId: string | null;
  size?: CardSize;
  artifactId?: string;
  images?: CardImage[];
}

export type CardSide = "top" | "bottom" | "left" | "right";

export interface Connection {
  id: string;
  from: string;
  to: string;
  fromSide: CardSide;
  toSide: CardSide;
}

export interface Thread {
  id: string;
  accentColour: string;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export type ConnectorStyle = "curvy" | "orthogonal";
export type AppViewMode = "canvas" | "chat";

export interface BranchGroup {
  id: string;
  label: string;
  familyRootThreadIds: string[];
  summaryMarkdown: string | null;
  summaryGeneratedAt?: number;
  summaryContentFingerprint?: string;
}

interface CanvasState {
  selectedModel: ClaudeModel;
  setModel: (model: ClaudeModel) => void;

  viewMode: AppViewMode;
  activeThreadId: string | null;
  setViewMode: (mode: AppViewMode) => void;
  setActiveThreadId: (threadId: string) => void;

  sessionUsage: { inputTokens: number; outputTokens: number };
  addUsage: (input: number, output: number) => void;

  viewport: Viewport;
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
  threads: Record<string, Thread>;
  threadOrder: string[];
  openArtifactCardId: string | null;
  openGroupArtifactId: string | null;
  connectorStyle: ConnectorStyle;
  undoPast: GraphSnapshot[];

  selectedFamilyRootIds: string[];
  groups: Record<string, BranchGroup>;
  activeGroupId: string | null;

  setSelectedFamilyRootIds: (rootThreadIds: string[]) => void;
  clearSelection: () => void;
  createGroupFromSelection: (label?: string) => string | null;
  setGroupSummary: (groupId: string, markdown: string) => void;
  openGroupArtifact: (groupId: string) => void;
  closeGroupArtifact: () => void;
  removeGroup: (groupId: string) => void;
  setActiveGroupId: (groupId: string | null) => void;

  recordUndo: () => void;
  undo: () => void;

  setViewport: (next: Partial<Viewport>) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (
    factor: number,
    pivotScreenX: number,
    pivotScreenY: number,
  ) => void;

  updateCard: (id: string, patch: Partial<Card>) => void;
  setCardSize: (id: string, size: CardSize) => void;
  moveSubtree: (rootId: string, dx: number, dy: number) => void;

  createRootCard: (position: { x: number; y: number }) => string;
  createFollowUp: (parentId: string, question: string) => string | null;
  createBranch: (sourceId: string, side: "left" | "right") => string | null;
  deleteFromCard: (cardId: string) => void;

  openArtifact: (cardId: string) => void;
  closeArtifact: () => void;
  setConnectorStyle: (style: ConnectorStyle) => void;
  autoLayoutCanvas: () => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const FOLLOW_UP_GAP = 80;
const FALLBACK_CARD_HEIGHT = 240;
const BRANCH_CARD_WIDTH = 420;
// Visual gap between a source and its first branch, and between sibling
// branches on the same side. Equal to one card width so parallel branches
// breathe at roughly the same scale as the cards themselves.
const BRANCH_HORIZONTAL_GAP = BRANCH_CARD_WIDTH;

// Placeholder palette for thread accents until OQ-01 is resolved.
// Cycles after 8 threads.
const PALETTE = [
  "#7C9EFF", // blue
  "#FF8FA3", // pink
  "#6FCF97", // green
  "#F2C94C", // amber
  "#BB6BD9", // purple
  "#56CCF2", // cyan
  "#F2994A", // orange
  "#9B51E0", // violet
];

const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;

function collectSubtreeIds(
  connections: Connection[],
  rootId: string,
): Set<string> {
  const subtree = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const cid = queue.shift()!;
    if (subtree.has(cid)) continue;
    subtree.add(cid);
    for (const conn of connections) {
      if (conn.from === cid) queue.push(conn.to);
    }
  }
  return subtree;
}

/** When a card's height changes, shift follow-up chains to keep vertical gap. */
function shiftBottomAttachedSubtrees(
  state: CanvasState,
  parentId: string,
  dy: number,
): Record<string, Card> {
  if (dy === 0) return state.cards;

  const cards = { ...state.cards };
  const bottomChildren = state.connections
    .filter(
      (c) =>
        c.from === parentId && (c.fromSide === "bottom" || c.fromSide == null),
    )
    .map((c) => c.to);

  for (const childId of bottomChildren) {
    for (const id of collectSubtreeIds(state.connections, childId)) {
      const c = cards[id];
      if (!c) continue;
      cards[id] = {
        ...c,
        position: { ...c.position, y: c.position.y + dy },
      };
    }
  }
  return cards;
}

export const newCardId = () => newId("card");
const newThreadId = () => newId("thread");
const newGroupId = () => newId("group");

// All children of a given source (follow-ups + branches) share a single
// horizontal y-band: the y of the first child created. If none yet, fall back
// to `source.y + source.h + gap`, computed once at first-child time and
// reused by every subsequent sibling regardless of when the source's height
// later changes.
function childBandY(
  state: CanvasState,
  sourceId: string,
  source: Card,
): number {
  let earliest: number | null = null;
  for (const conn of state.connections) {
    if (conn.from !== sourceId) continue;
    const child = state.cards[conn.to];
    if (!child) continue;
    if (earliest === null || child.position.y < earliest) {
      earliest = child.position.y;
    }
  }
  if (earliest !== null) return earliest;
  const sourceH = source.size?.h ?? FALLBACK_CARD_HEIGHT;
  return source.position.y + sourceH + FOLLOW_UP_GAP;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  selectedModel: "claude-sonnet-4-6",
  sessionUsage: { inputTokens: 0, outputTokens: 0 },
  addUsage: (input, output) =>
    set((s) => ({
      sessionUsage: {
        inputTokens: s.sessionUsage.inputTokens + input,
        outputTokens: s.sessionUsage.outputTokens + output,
      },
    })),
  setModel: (model) => set({ selectedModel: model }),

  viewMode: "canvas",
  activeThreadId: null,
  setViewMode: (mode) =>
    set((state) => {
      if (mode === "chat" && !state.activeThreadId && state.threadOrder[0]) {
        return { viewMode: mode, activeThreadId: state.threadOrder[0] };
      }
      return { viewMode: mode };
    }),
  setActiveThreadId: (threadId) => set({ activeThreadId: threadId }),

  viewport: { x: 0, y: 0, scale: 1 },
  cards: {},
  cardOrder: [],
  connections: [],
  threads: {},
  threadOrder: [],
  openArtifactCardId: null,
  openGroupArtifactId: null,
  connectorStyle: "curvy",
  undoPast: [],

  selectedFamilyRootIds: [],
  groups: {},
  activeGroupId: null,

  setSelectedFamilyRootIds: (rootThreadIds) =>
    set({ selectedFamilyRootIds: rootThreadIds }),

  clearSelection: () => set({ selectedFamilyRootIds: [] }),

  createGroupFromSelection: (label) => {
    const safeLabel =
      typeof label === "string" && label.trim().length > 0
        ? label.trim()
        : undefined;
    let groupId: string | null = null;
    set((state) => {
      if (state.selectedFamilyRootIds.length === 0) return state;
      const id = newGroupId();
      groupId = id;
      const groupCount = Object.keys(state.groups).length;
      const group: BranchGroup = {
        id,
        label: safeLabel ?? `Group ${groupCount + 1}`,
        familyRootThreadIds: [...state.selectedFamilyRootIds],
        summaryMarkdown: null,
      };
      return {
        groups: { ...state.groups, [id]: group },
        activeGroupId: id,
        selectedFamilyRootIds: [],
      };
    });
    return groupId;
  },

  setGroupSummary: (groupId, markdown) =>
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return state;
      const nextGroup: BranchGroup = {
        ...group,
        summaryMarkdown: markdown,
        summaryGeneratedAt: Date.now(),
        summaryContentFingerprint: buildSummaryContentFingerprint(
          state,
          group,
        ),
      };
      return {
        groups: {
          ...state.groups,
          [groupId]: nextGroup,
        },
      };
    }),

  openGroupArtifact: (groupId) =>
    set((state) => {
      const group = state.groups[groupId];
      if (!group?.summaryMarkdown) return state;
      const fingerprint =
        group.summaryContentFingerprint ??
        buildSummaryContentFingerprint(state, group);
      return {
        openGroupArtifactId: groupId,
        openArtifactCardId: null,
        groups: {
          ...state.groups,
          [groupId]: { ...group, summaryContentFingerprint: fingerprint },
        },
      };
    }),

  closeGroupArtifact: () => set({ openGroupArtifactId: null }),

  removeGroup: (groupId) =>
    set((state) => {
      if (!state.groups[groupId]) return state;
      const next = { ...state.groups };
      delete next[groupId];
      return {
        groups: next,
        activeGroupId:
          state.activeGroupId === groupId ? null : state.activeGroupId,
        openGroupArtifactId:
          state.openGroupArtifactId === groupId
            ? null
            : state.openGroupArtifactId,
      };
    }),

  setActiveGroupId: (groupId) => set({ activeGroupId: groupId }),

  recordUndo: () =>
    set((state) => {
      const snap = captureGraphSnapshot(state);
      const next = [...state.undoPast, snap];
      if (next.length > MAX_UNDO_STACK) next.shift();
      return { undoPast: next };
    }),

  undo: () =>
    set((state) => {
      if (state.undoPast.length === 0) return state;
      const snap = state.undoPast[state.undoPast.length - 1];
      return {
        ...snap,
        undoPast: state.undoPast.slice(0, -1),
      };
    }),

  setConnectorStyle: (style) => set({ connectorStyle: style }),

  setViewport: (next) =>
    set((state) => ({ viewport: { ...state.viewport, ...next } })),

  panBy: (dx, dy) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + dx,
        y: state.viewport.y + dy,
      },
    })),

  zoomAt: (factor, pivotScreenX, pivotScreenY) =>
    set((state) => {
      const { x, y, scale } = state.viewport;
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, scale * factor),
      );
      const k = nextScale / scale;
      // Keep the world point under the cursor fixed while scaling.
      const nx = pivotScreenX - k * (pivotScreenX - x);
      const ny = pivotScreenY - k * (pivotScreenY - y);
      return { viewport: { x: nx, y: ny, scale: nextScale } };
    }),

  updateCard: (id, patch) =>
    set((state) => {
      const existing = state.cards[id];
      if (!existing) return state;
      return {
        cards: { ...state.cards, [id]: { ...existing, ...patch } },
      };
    }),

  setCardSize: (id, size) =>
    set((state) => {
      const existing = state.cards[id];
      if (!existing) return state;
      const prev = existing.size;
      if (prev && prev.w === size.w && prev.h === size.h) return state;

      const prevH = prev?.h ?? FALLBACK_CARD_HEIGHT;
      const dy = size.h - prevH;
      let cards: Record<string, Card> = {
        ...state.cards,
        [id]: { ...existing, size },
      };
      if (dy !== 0) {
        cards = shiftBottomAttachedSubtrees({ ...state, cards }, id, dy);
      }
      return { cards };
    }),

  moveSubtree: (rootId, dx, dy) =>
    set((state) => {
      if (dx === 0 && dy === 0) return state;
      if (!state.cards[rootId]) return state;

      // BFS over connections to collect the root and all its descendants.
      const subtree = new Set<string>();
      const queue: string[] = [rootId];
      while (queue.length > 0) {
        const id = queue.shift()!;
        if (subtree.has(id)) continue;
        subtree.add(id);
        for (const conn of state.connections) {
          if (conn.from === id && !subtree.has(conn.to)) queue.push(conn.to);
        }
      }

      const nextCards = { ...state.cards };
      subtree.forEach((id) => {
        const c = nextCards[id];
        if (!c) return;
        nextCards[id] = {
          ...c,
          position: { x: c.position.x + dx, y: c.position.y + dy },
        };
      });
      return { cards: nextCards };
    }),

  createRootCard: (position) => {
    const cardId = newCardId();
    set((state) => {
      const undoPast = pushUndoSnapshot(state);
      const threadId = newThreadId();
      const accent = PALETTE[state.threadOrder.length % PALETTE.length];
      const thread: Thread = { id: threadId, accentColour: accent };
      const card: Card = {
        id: cardId,
        threadId,
        question: "",
        answer: "",
        status: "empty",
        position,
        parentCardId: null,
        parentConversationId: null,
      };
      return {
        undoPast,
        threads: { ...state.threads, [threadId]: thread },
        threadOrder: [...state.threadOrder, threadId],
        cards: { ...state.cards, [cardId]: card },
        cardOrder: [...state.cardOrder, cardId],
      };
    });
    return cardId;
  },

  createFollowUp: (parentId, question) => {
    let childId: string | null = null;
    set((state) => {
      const parent = state.cards[parentId];
      if (!parent) return state;
      const undoPast = pushUndoSnapshot(state);
      const id = newCardId();
      childId = id;
      const childY = childBandY(state, parentId, parent);
      const child: Card = {
        id,
        threadId: parent.threadId,
        question,
        answer: "",
        status: "thinking",
        position: {
          x: parent.position.x,
          y: childY,
        },
        parentCardId: parentId,
        parentConversationId: parentId,
      };
      const conn: Connection = {
        id: `conn_${parentId}_${id}`,
        from: parentId,
        to: id,
        fromSide: "bottom",
        toSide: "top",
      };
      return {
        undoPast,
        cards: { ...state.cards, [id]: child },
        cardOrder: [...state.cardOrder, id],
        connections: [...state.connections, conn],
      };
    });
    return childId;
  },

  createBranch: (sourceId, side) => {
    let branchId: string | null = null;
    set((state) => {
      const source = state.cards[sourceId];
      if (!source) return state;
      const undoPast = pushUndoSnapshot(state);

      const existingOnSide = state.connections.filter(
        (c) => c.from === sourceId && c.fromSide === side,
      ).length;

      const slot = existingOnSide; // 0 for the first branch on this side
      const lateralStep = BRANCH_CARD_WIDTH + BRANCH_HORIZONTAL_GAP;

      const x =
        side === "right"
          ? source.position.x +
            BRANCH_CARD_WIDTH +
            BRANCH_HORIZONTAL_GAP +
            lateralStep * slot
          : source.position.x -
            BRANCH_CARD_WIDTH -
            BRANCH_HORIZONTAL_GAP -
            lateralStep * slot;
      const y = childBandY(state, sourceId, source);

      const newThreadIdStr = newThreadId();
      const accent =
        PALETTE[state.threadOrder.length % PALETTE.length];
      const thread: Thread = {
        id: newThreadIdStr,
        accentColour: accent,
      };

      const id = newCardId();
      branchId = id;
      const card: Card = {
        id,
        threadId: newThreadIdStr,
        question: "",
        answer: "",
        status: "empty",
        position: { x, y },
        parentCardId: null,
        parentConversationId: sourceId,
      };

      const conn: Connection = {
        id: `conn_${sourceId}_${id}`,
        from: sourceId,
        to: id,
        fromSide: side,
        toSide: side === "right" ? "left" : "right",
      };

      return {
        undoPast,
        threads: { ...state.threads, [newThreadIdStr]: thread },
        threadOrder: [...state.threadOrder, newThreadIdStr],
        cards: { ...state.cards, [id]: card },
        cardOrder: [...state.cardOrder, id],
        connections: [...state.connections, conn],
      };
    });
    return branchId;
  },

  deleteFromCard: (cardId) =>
    set((state) => {
      if (!state.cards[cardId]) return state;
      const undoPast = pushUndoSnapshot(state);

      const toDelete = collectSubtreeIds(state.connections, cardId);
      const nextCards = { ...state.cards };
      for (const id of toDelete) {
        delete nextCards[id];
      }

      const nextConnections = state.connections.filter(
        (c) => !toDelete.has(c.from) && !toDelete.has(c.to),
      );
      const nextCardOrder = state.cardOrder.filter((id) => !toDelete.has(id));

      const remainingThreadIds = new Set(
        Object.values(nextCards).map((c) => c.threadId),
      );
      const nextThreads = { ...state.threads };
      for (const tid of Object.keys(nextThreads)) {
        if (!remainingThreadIds.has(tid)) delete nextThreads[tid];
      }
      const nextThreadOrder = state.threadOrder.filter((tid) =>
        remainingThreadIds.has(tid),
      );

      let activeThreadId = state.activeThreadId;
      if (activeThreadId && !remainingThreadIds.has(activeThreadId)) {
        activeThreadId = pickDefaultThreadId({
          cards: nextCards,
          connections: nextConnections,
          cardOrder: nextCardOrder,
          threads: nextThreads,
          threadOrder: nextThreadOrder,
        });
      }

      let openArtifactCardId = state.openArtifactCardId;
      if (openArtifactCardId && toDelete.has(openArtifactCardId)) {
        openArtifactCardId = null;
      }

      return {
        undoPast,
        cards: nextCards,
        cardOrder: nextCardOrder,
        connections: nextConnections,
        threads: nextThreads,
        threadOrder: nextThreadOrder,
        activeThreadId,
        openArtifactCardId,
      };
    }),

  openArtifact: (cardId) =>
    set((state) => {
      if (!state.cards[cardId]) return state;
      return { openArtifactCardId: cardId, openGroupArtifactId: null };
    }),

  closeArtifact: () =>
    set({ openArtifactCardId: null, openGroupArtifactId: null }),

  autoLayoutCanvas: () =>
    set((state) => {
      if (state.cardOrder.length === 0) return state;
      const undoPast = pushUndoSnapshot(state);
      const positions = computeAutoLayout({
        cards: state.cards,
        cardOrder: state.cardOrder,
        connections: state.connections,
      });
      if (positions.size === 0) return state;

      const nextCards = { ...state.cards };
      for (const [id, pos] of positions) {
        const existing = nextCards[id];
        if (!existing) continue;
        nextCards[id] = { ...existing, position: pos };
      }
      return { undoPast, cards: nextCards };
    }),
}));

function pushUndoSnapshot(state: CanvasState): GraphSnapshot[] {
  const snap = captureGraphSnapshot(state);
  const next = [...state.undoPast, snap];
  if (next.length > MAX_UNDO_STACK) next.shift();
  return next;
}

// Selector helpers.
export const selectAccentForCard = (cardId: string) =>
  (state: CanvasState): string | undefined => {
    const card = state.cards[cardId];
    if (!card) return undefined;
    return state.threads[card.threadId]?.accentColour;
  };
