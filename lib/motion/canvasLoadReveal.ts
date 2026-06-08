import {
  buildSidebarTree,
  getFamilyCardIds,
  type ChatThreadState,
} from "@/lib/chatThreads";
import type { CanvasArtifactNode, Card } from "@/lib/store";
import { canvasLoadDelays } from "./tokens";

export const CANVAS_LOAD_REVEAL_DURATION_MS = canvasLoadDelays.slideDuration;
export const CANVAS_LOAD_REVEAL_TOTAL_MS = canvasLoadDelays.totalMs;

export interface CanvasLoadRevealPlan {
  delays: Record<string, number>;
  unitCount: number;
  maxDelayMs: number;
}

type RevealUnit =
  | { kind: "family"; anchorX: number; cardIds: string[] }
  | { kind: "artifact"; id: string; anchorX: number };

export interface CanvasLoadRevealInput {
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: ChatThreadState["connections"];
  threads: ChatThreadState["threads"];
  threadOrder: string[];
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
}

export function buildCanvasLoadRevealPlan(
  input: CanvasLoadRevealInput,
): CanvasLoadRevealPlan {
  const threadState: ChatThreadState = {
    cards: input.cards,
    cardOrder: input.cardOrder,
    connections: input.connections,
    threads: input.threads,
    threadOrder: input.threadOrder,
  };

  const units: RevealUnit[] = [];

  for (const node of buildSidebarTree(threadState)) {
    const cardIds = getFamilyCardIds(threadState, node.threadId);
    if (cardIds.length === 0) continue;
    const anchorX = Math.min(
      ...cardIds.map((id) => input.cards[id]?.position.x ?? Infinity),
    );
    if (!Number.isFinite(anchorX)) continue;
    units.push({ kind: "family", anchorX, cardIds });
  }

  for (const id of input.canvasArtifactOrder) {
    const node = input.canvasArtifactNodes[id];
    if (!node) continue;
    units.push({ kind: "artifact", id, anchorX: node.position.x });
  }

  units.sort((a, b) => a.anchorX - b.anchorX);

  const maxDelayMs =
    units.length <= 1
      ? 0
      : canvasLoadDelays.totalMs - canvasLoadDelays.slideDuration;
  const staggerStep =
    units.length <= 1 ? 0 : maxDelayMs / (units.length - 1);

  const delays: Record<string, number> = {};
  units.forEach((unit, index) => {
    const delay = index * staggerStep;
    if (unit.kind === "family") {
      for (const cardId of unit.cardIds) {
        delays[`card:${cardId}`] = delay;
      }
    } else {
      delays[`artifact:${unit.id}`] = delay;
    }
  });

  return { delays, unitCount: units.length, maxDelayMs };
}

export function canvasLoadRevealTotalMs(_plan?: CanvasLoadRevealPlan): number {
  return canvasLoadDelays.totalMs;
}
