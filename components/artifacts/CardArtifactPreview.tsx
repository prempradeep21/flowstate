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
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
} from "@/lib/sessionArtifacts";
import { todoCompletionLabel } from "@/lib/todoArtifact";
import type { Card, CanvasArtifactNode } from "@/lib/store";
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

function buildSessionPreviewItem(
  artifactId: string,
  versionId: string | undefined,
  sessionArtifacts: ReturnType<typeof useCanvasStore.getState>["sessionArtifacts"],
  status: ArtifactPreviewStatus,
): PreviewItem | null {
  const art = sessionArtifacts[artifactId];
  if (!art) return null;
  const ver =
    (versionId && getVersionById(art, versionId)) || getLatestVersion(art);
  if (!ver) return null;
  const todoSubtitle =
    art.kind === "todo" && ver.payload.type === "todo"
      ? todoCompletionLabel(ver.payload.data.items)
      : undefined;
  return {
    key: `art:${artifactId}`,
    kind: art.kind,
    title: artifactDisplayTitle(art, ver),
    versionNumber: ver.number,
    artifactId: art.id,
    versionId: ver.id,
    subtitle: todoSubtitle
      ? `Version ${ver.number} · ${todoSubtitle}`
      : undefined,
    status,
  };
}

function buildPayloadPreviewItem(
  payload: NonNullable<Card["artifactPayload"]>,
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
    versionNumber: 1,
    artifactId: "",
    status,
  };
}

export function collectCardArtifactPreviewItems(
  card: Card,
  sessionArtifacts: ReturnType<typeof useCanvasStore.getState>["sessionArtifacts"],
  canvasArtifactNodes: Record<string, CanvasArtifactNode>,
): PreviewItem[] {
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
        card.outputArtifactId,
        card.outputArtifactVersionId,
        sessionArtifacts,
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
        versionNumber: 1,
        artifactId: "",
        nodeId: node.id,
        subtitle: "Awaiting your approval",
        status: "pending",
      });
      continue;
    }
    if (node.artifactId && node.artifactId !== card.outputArtifactId) {
      push(
        buildSessionPreviewItem(
          node.artifactId,
          node.versionId,
          sessionArtifacts,
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
      push(buildPayloadPreviewItem(payload, previewStatus, "pending"));
    }
  } else if (!card.outputArtifactId && card.artifactPayload && card.status !== "empty") {
    push(buildPayloadPreviewItem(card.artifactPayload, previewStatus, "single"));
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
          card.outputArtifactId,
          card.outputArtifactVersionId,
          sessionArtifacts,
          previewStatus,
        ),
      );
    } else {
      push({
        key: "images:fallback",
        kind: "images",
        title: "Images",
        versionNumber: 1,
        artifactId: "",
        status: previewStatus,
      });
    }
  }

  return items;
}

export function CardArtifactPreview({ card }: { card: Card }) {
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const items = collectCardArtifactPreviewItems(
    card,
    sessionArtifacts,
    canvasArtifactNodes,
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
          versionNumber={1}
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
