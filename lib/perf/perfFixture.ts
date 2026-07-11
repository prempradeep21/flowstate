import {
  buildCanvasSnapshot,
  type CanvasSnapshot,
} from "@/lib/canvasSnapshot";
import { createSessionArtifactFromPayload } from "@/lib/sessionArtifacts";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import type {
  CanvasTextLabel,
  Card,
  Connection,
  Thread,
} from "@/lib/store";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type { CanvasArtifactNode } from "@/lib/store";

export const PERF_FIXTURE_SIZES = [30, 100, 300] as const;
export type PerfFixtureSize = (typeof PERF_FIXTURE_SIZES)[number];

const THREAD_ACCENTS = [
  "#C17F59",
  "#6B7DB3",
  "#5B8C7A",
  "#8C7AA9",
  "#B8956B",
  "#9A8F7A",
];

/** Deterministic pseudo-random — fixture must be identical across runs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ANSWER_SNIPPETS = [
  "The core tradeoff is **latency vs consistency**. When the write path fans out to replicas, readers may observe stale rows until the sync completes.\n\n- Synchronous replication: safe, slower writes\n- Async replication: fast writes, read-your-writes hazards\n\n`Quorum reads` split the difference at the cost of coordination.",
  "Here is a quick summary:\n\n1. Parse the document into blocks\n2. Extract entities per block\n3. Link entities across blocks using co-reference\n\nThe final graph typically has ~2.3 edges per node for prose documents.",
  "**Short answer:** yes, but only if the index is covering.\n\nA covering index avoids the heap fetch entirely, which matters when the working set exceeds shared buffers. Otherwise you pay a random read per row.",
  "The three phases are:\n\n- **Discovery** — interviews, market sizing, competitive scan\n- **Definition** — PRD, wireframes, success metrics\n- **Delivery** — build, test, launch, iterate\n\nMost teams under-invest in discovery and pay for it in delivery.",
  "Compression helps here. With `zstd -3` the payload drops ~72% and decode stays under 2ms for 1MB inputs, which keeps the interaction budget intact.",
];

const QUESTIONS = [
  "How does replication affect read consistency?",
  "Summarize the entity extraction pipeline",
  "Will the planner use an index-only scan here?",
  "What are the phases of product development?",
  "Should we compress the snapshot payload?",
  "Compare the approaches for realtime sync",
  "Draft a rollout plan for the beta",
  "What breaks first at 10k users?",
];

function tablePayload(i: number): ArtifactPayload {
  return {
    type: "table",
    title: `Metrics table ${i}`,
    data: {
      columns: [
        { key: "metric", label: "Metric" },
        { key: "p50", label: "p50" },
        { key: "p95", label: "p95" },
        { key: "p99", label: "p99" },
      ],
      rows: Array.from({ length: 6 }, (_, r) => ({
        metric: `scenario-${r}`,
        p50: `${4 + r}ms`,
        p95: `${9 + r * 2}ms`,
        p99: `${15 + r * 3}ms`,
      })),
    },
  } as ArtifactPayload;
}

function stickyPayload(i: number): ArtifactPayload {
  return {
    type: "stickynote",
    title: `Note ${i}`,
    data: {
      text: `Perf fixture note ${i} — check pan/zoom smoothness around this cluster.`,
      colorId: "chalk",
    },
  } as ArtifactPayload;
}

/**
 * Deterministic benchmark canvas: a grid of Q&A cards in threads with
 * parent→child connections, plus table/sticky artifact nodes and text labels
 * (~1.5 connections per node, mixed content). No network-dependent nodes
 * (3D/GIF/iframe) so runs are reproducible offline.
 */
export function buildPerfFixtureSnapshot(
  nodeCount: PerfFixtureSize | number = 100,
): CanvasSnapshot {
  const rand = mulberry32(1337 + nodeCount);

  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const threads: Record<string, Thread> = {};
  const threadOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];
  const canvasTextLabels: Record<string, CanvasTextLabel> = {};
  const canvasTextLabelOrder: string[] = [];

  // ~78% cards, ~16% artifact nodes, ~6% labels.
  const cardCount = Math.max(4, Math.round(nodeCount * 0.78));
  const artifactCount = Math.max(2, Math.round(nodeCount * 0.16));
  const labelCount = Math.max(1, nodeCount - cardCount - artifactCount);

  const threadCount = Math.max(2, Math.round(cardCount / 8));
  for (let t = 0; t < threadCount; t++) {
    const id = `perf-thread-${t}`;
    threads[id] = {
      id,
      accentColour: THREAD_ACCENTS[t % THREAD_ACCENTS.length],
    };
    threadOrder.push(id);
  }

  // Cards laid out in thread columns: each thread is a vertical chain,
  // chains arranged on a grid. Card pitch ~ (520w + 160gap, 380h + 140gap).
  const chainLength = Math.ceil(cardCount / threadCount);
  const COL_W = 680;
  const ROW_H = 520;
  const chainsPerRow = Math.max(3, Math.ceil(Math.sqrt(threadCount * 1.6)));

  let made = 0;
  for (let t = 0; t < threadCount && made < cardCount; t++) {
    const colX = (t % chainsPerRow) * COL_W;
    const rowY = Math.floor(t / chainsPerRow) * (ROW_H * (chainLength + 0.5));
    let parentId: string | null = null;
    for (let c = 0; c < chainLength && made < cardCount; c++) {
      const id = `perf-card-${t}-${c}`;
      const jitterX = Math.round((rand() - 0.5) * 80);
      cards[id] = {
        id,
        threadId: `perf-thread-${t}`,
        question: QUESTIONS[made % QUESTIONS.length],
        answer: ANSWER_SNIPPETS[made % ANSWER_SNIPPETS.length],
        status: "done",
        position: { x: colX + jitterX, y: rowY + c * ROW_H },
        parentCardId: parentId,
        parentConversationId: parentId,
      };
      cardOrder.push(id);
      if (parentId) {
        connections.push({
          id: `perf-conn-${t}-${c}`,
          from: parentId,
          to: id,
          fromSide: "bottom",
          toSide: "top",
        });
      }
      parentId = id;
      made += 1;
    }
  }

  // Lateral connections between chains (~extra 0.4/card) to exercise the
  // connections layer with cross-links, matching real branching canvases.
  // Invariant (matches product): a card never branches twice into the same
  // target thread — BranchCollapseToggle keys by threadId per side.
  const lateralCount = Math.round(cardCount * 0.4);
  const lateralPairs = new Set<string>();
  for (let i = 0; i < lateralCount; i++) {
    const a = cardOrder[Math.floor(rand() * cardOrder.length)];
    const b = cardOrder[Math.floor(rand() * cardOrder.length)];
    if (!a || !b || a === b) continue;
    const pairKey = `${a}->${cards[b]?.threadId}`;
    if (lateralPairs.has(pairKey)) continue;
    lateralPairs.add(pairKey);
    connections.push({
      id: `perf-lateral-${i}`,
      from: a,
      to: b,
      fromSide: "right",
      toSide: "left",
    });
  }

  // Artifact nodes scattered near chains: alternating tables and stickies.
  for (let i = 0; i < artifactCount; i++) {
    const payload = i % 2 === 0 ? tablePayload(i) : stickyPayload(i);
    const sourceCard = cardOrder[i % cardOrder.length];
    const artifact = createSessionArtifactFromPayload(payload, sourceCard);
    sessionArtifacts[artifact.id] = artifact;
    const nodeId = `perf-artifact-node-${i}`;
    const anchor = cards[sourceCard]?.position ?? { x: 0, y: 0 };
    canvasArtifactNodes[nodeId] = {
      id: nodeId,
      artifactId: artifact.id,
      versionId: artifact.versions[0]?.id ?? "",
      sourceCardId: sourceCard,
      position: {
        x: anchor.x + 560 + Math.round(rand() * 60),
        y: anchor.y + Math.round((rand() - 0.5) * 200),
      },
    };
    canvasArtifactOrder.push(nodeId);
  }

  for (let i = 0; i < labelCount; i++) {
    const id = `perf-label-${i}`;
    const anchor =
      cards[cardOrder[(i * 7) % cardOrder.length]]?.position ?? { x: 0, y: 0 };
    canvasTextLabels[id] = {
      id,
      text: `Cluster ${i + 1}`,
      position: { x: anchor.x - 40, y: anchor.y - 120 },
      fontSize: 28,
    };
    canvasTextLabelOrder.push(id);
  }

  return buildCanvasSnapshot({
    viewport: { x: 120, y: 120, scale: 0.55 },
    cards,
    cardOrder,
    connections,
    threads,
    threadOrder,
    groups: {},
    connectorStyle: "curvy",
    canvasBackgroundStyle: "grid",
    canvasTheme: "light",
    selectedModel: "claude-sonnet-4-6",
    viewMode: "canvas",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    canvasTextLabels,
    canvasTextLabelOrder,
    uploadedAttachments: [],
    collaborationHasEdits: false,
  });
}

/** Center of the fixture content, for initial viewport fitting. */
export function perfFixtureContentCenter(snapshot: CanvasSnapshot): {
  x: number;
  y: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const card of Object.values(snapshot.cards)) {
    minX = Math.min(minX, card.position.x);
    minY = Math.min(minY, card.position.y);
    maxX = Math.max(maxX, card.position.x + 520);
    maxY = Math.max(maxY, card.position.y + 380);
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0 };
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}
