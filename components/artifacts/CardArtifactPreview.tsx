"use client";

import { ArtifactPreviewPill } from "@/components/artifacts/ArtifactPreviewPill";
import {
  emittedToPayload,
  payloadToArtifactKind,
} from "@/lib/artifactTypes";
import { sortArtifactsByPriority } from "@/lib/artifactSpawnPriority";
import {
  resolveArtifactPreviewStatus,
  type ArtifactPreviewStatus,
} from "@/lib/materializeCardArtifact";
import type { ArtifactKind } from "@/lib/artifactTypes";
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
  resolveEditingArtifactId,
  resolvePreviewVersionNumber,
} from "@/lib/sessionArtifacts";
import { todoCompletionLabel } from "@/lib/todoArtifact";
import type { Card, CanvasArtifactNode, Connection } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

interface PreviewItem {
  key: string;
  kind: ReturnType<typeof payloadToArtifactKind>;
  title: string;
  versionNumber: number;
  artifactId: string;
  versionId?: string;
  nodeId?: string;
  subtitle?: string;
  status: ArtifactPreviewStatus;
}

interface PreviewContext {
  sessionArtifacts: ReturnType<typeof useCanvasStore.getState>["sessionArtifacts"];
  cards: Record<string, Card>;
  connections: Connection[];
  cardOrder: string[];
}

function previewVersionForCard(
  card: Card,
  ctx: PreviewContext,
  status: ArtifactPreviewStatus,
  committedNumber?: number,
): number {
  if (status === "generating" || status === "pending") {
    return resolvePreviewVersionNumber(
      card,
      ctx.sessionArtifacts,
      ctx.cards,
      ctx.connections,
      ctx.cardOrder,
    );
  }
  return committedNumber ?? 1;
}

function buildSessionPreviewItem(
  card: Card,
  artifactId: string,
  versionId: string | undefined,
  ctx: PreviewContext,
  status: ArtifactPreviewStatus,
): PreviewItem | null {
  const art = ctx.sessionArtifacts[artifactId];
  if (!art) return null;
  const ver =
    (versionId && getVersionById(art, versionId)) || getLatestVersion(art);
  if (!ver) return null;
  const todoSubtitle =
    art.kind === "todo" && ver.payload.type === "todo"
      ? todoCompletionLabel(ver.payload.data.items)
      : undefined;
  const versionNumber = previewVersionForCard(card, ctx, status, ver.number);
  return {
    key: `art:${artifactId}`,
    kind: art.kind,
    title: artifactDisplayTitle(art, ver),
    versionNumber,
    artifactId: art.id,
    versionId: status === "generating" ? undefined : ver.id,
    subtitle: todoSubtitle
      ? `Version ${versionNumber} · ${todoSubtitle}`
      : undefined,
    status,
  };
}

function buildPayloadPreviewItem(
  card: Card,
  payload: NonNullable<Card["artifactPayload"]>,
  ctx: PreviewContext,
  status: ArtifactPreviewStatus,
  keySuffix: string,
): PreviewItem {
  const kind = payloadToArtifactKind(payload);
  const title =
    kind === "code" && payload.type === "code"
      ? payload.data.files[0]?.path ?? payload.title
      : payload.title;
  return {
    key: `payload:${keySuffix}:${kind}:${title}`,
    kind,
    title,
    versionNumber: previewVersionForCard(card, ctx, status),
    artifactId: "",
    status,
  };
}

export function collectCardArtifactPreviewItems(
  card: Card,
  sessionArtifacts: ReturnType<typeof useCanvasStore.getState>["sessionArtifacts"],
  canvasArtifactNodes: Record<string, CanvasArtifactNode>,
  cards: Record<string, Card>,
  connections: Connection[],
  cardOrder: string[],
): PreviewItem[] {
  const ctx: PreviewContext = {
    sessionArtifacts,
    cards,
    connections,
    cardOrder,
  };
  const previewStatus = resolveArtifactPreviewStatus(card);
  const items: PreviewItem[] = [];
  const seenKinds = new Set<string>();

  const push = (item: PreviewItem | null) => {
    if (!item || items.some((i) => i.key === item.key)) return;
    items.push(item);
    seenKinds.add(item.kind);
  };

  if (card.outputArtifactId) {
    push(
      buildSessionPreviewItem(
        card,
        card.outputArtifactId,
        card.outputArtifactVersionId,
        ctx,
        previewStatus,
      ),
    );
  }

  for (const node of Object.values(canvasArtifactNodes)) {
    if (node.sourceCardId !== card.id) continue;
    if (node.permissionPreview) {
      const pp = node.permissionPreview;
      push({
        key: `perm:${node.id}`,
        kind: pp.kind,
        title: pp.title,
        versionNumber: previewVersionForCard(card, ctx, "pending"),
        artifactId: "",
        nodeId: node.id,
        subtitle: "Awaiting your approval",
        status: "pending",
      });
      continue;
    }
    if (node.generatingPreview) {
      const gp = node.generatingPreview;
      push({
        key: `gen:${node.id}`,
        kind: gp.kind,
        title: gp.title,
        versionNumber: previewVersionForCard(card, ctx, previewStatus),
        artifactId: "",
        nodeId: node.id,
        status: previewStatus === "ready" ? "generating" : previewStatus,
      });
      continue;
    }
    if (node.artifactId && node.artifactId !== card.outputArtifactId) {
      push(
        buildSessionPreviewItem(
          card,
          node.artifactId,
          node.versionId,
          ctx,
          previewStatus,
        ),
      );
    }
  }

  if (card.pendingEmittedArtifacts?.length) {
    const payloads = sortArtifactsByPriority(
      card.pendingEmittedArtifacts.map(emittedToPayload),
    );
    for (const payload of payloads) {
      const kind = payloadToArtifactKind(payload);
      if (seenKinds.has(kind)) continue;
      push(buildPayloadPreviewItem(card, payload, ctx, previewStatus, "pending"));
    }
  } else if (!card.outputArtifactId && card.artifactPayload && card.status !== "empty") {
    push(buildPayloadPreviewItem(card, card.artifactPayload, ctx, previewStatus, "single"));
  }

  if (
    card.images &&
    card.images.length > 0 &&
    (card.responseType === "image" || card.responseType === "images") &&
    !seenKinds.has("images")
  ) {
    if (card.outputArtifactId) {
      push(
        buildSessionPreviewItem(
          card,
          card.outputArtifactId,
          card.outputArtifactVersionId,
          ctx,
          previewStatus,
        ),
      );
    } else {
      push({
        key: "images:fallback",
        kind: "images",
        title: "Images",
        versionNumber: previewVersionForCard(card, ctx, previewStatus),
        artifactId: "",
        status: previewStatus,
      });
    }
  }

  return collapseEditingArtifactPreviews(card, items, ctx, previewStatus);
}

function isEphemeralEditPreview(item: PreviewItem, kind: ArtifactKind): boolean {
  return (
    item.kind === kind &&
    (item.artifactId === "" ||
      item.key.startsWith("gen:") ||
      item.key.startsWith("payload:"))
  );
}

/** One preview per artifact — follow-up edits reuse the original, not a second pill. */
function collapseEditingArtifactPreviews(
  card: Card,
  items: PreviewItem[],
  ctx: PreviewContext,
  previewStatus: ArtifactPreviewStatus,
): PreviewItem[] {
  const editingId = resolveEditingArtifactId(
    card,
    ctx.cards,
    ctx.connections,
    ctx.cardOrder,
  );
  if (!editingId) return items;

  const art = ctx.sessionArtifacts[editingId];
  if (!art) return items;

  const canonical =
    buildSessionPreviewItem(
      card,
      editingId,
      card.outputArtifactVersionId ?? art.latestVersionId,
      ctx,
      previewStatus,
    ) ?? null;

  const ephemeral = items.filter((item) => isEphemeralEditPreview(item, art.kind));
  if (ephemeral.length === 0 && !items.some((item) => item.artifactId === editingId)) {
    return items;
  }

  const nodeId =
    ephemeral.find((item) => item.nodeId)?.nodeId ??
    items.find((item) => item.artifactId === editingId)?.nodeId;

  const merged = canonical
    ? {
        ...canonical,
        nodeId: canonical.nodeId ?? nodeId,
        artifactId: editingId,
      }
    : null;

  const rest = items.filter(
    (item) =>
      item.artifactId !== editingId && !isEphemeralEditPreview(item, art.kind),
  );

  return merged ? [merged, ...rest] : rest;
}

export function CardArtifactPreview({ card }: { card: Card }) {
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const items = collectCardArtifactPreviewItems(
    card,
    sessionArtifacts,
    canvasArtifactNodes,
    cards,
    connections,
    cardOrder,
  );

  if (items.length === 0) {
    if (card.outputArtifactId) {
      const kind = card.artifactPayload
        ? payloadToArtifactKind(card.artifactPayload)
        : "custom";
      const title =
        card.artifactPayload?.title ??
        card.question.slice(0, 48) ??
        "Artifact";
      return (
        <ArtifactPreviewPill
          kind={kind}
          title={title}
          versionNumber={resolvePreviewVersionNumber(
            card,
            sessionArtifacts,
            cards,
            connections,
            cardOrder,
          )}
          artifactId=""
          status="failed"
        />
      );
    }
    return null;
  }

  if (items.length === 1) {
    const item = items[0];
    return (
      <div
        className={
          item.status === "generating"
            ? "pointer-events-none max-w-md opacity-90"
            : "max-w-md"
        }
      >
        <ArtifactPreviewPill
          kind={item.kind}
          title={item.title}
          versionNumber={item.versionNumber}
          artifactId={item.artifactId}
          versionId={item.versionId}
          nodeId={item.nodeId}
          subtitle={item.subtitle}
          status={item.status}
        />
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.key}
          className={
            item.status === "generating"
              ? "pointer-events-none opacity-90"
              : undefined
          }
        >
          <ArtifactPreviewPill
            kind={item.kind}
            title={item.title}
            versionNumber={item.versionNumber}
            artifactId={item.artifactId}
            versionId={item.versionId}
            nodeId={item.nodeId}
            subtitle={item.subtitle}
            status={item.status}
            compact
          />
        </div>
      ))}
    </div>
  );
}
