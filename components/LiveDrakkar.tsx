"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { ArtefactIcon, ChatBubbleIcon } from "@/components/MenuIcons";
import { computeLiveDrakkarCounts } from "@/lib/liveDrakkar";
import { useCanvasStore } from "@/lib/store";

function DrakkarStat({
  icon,
  count,
  label,
}: {
  icon: ReactNode;
  count: number;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 text-canvas-ink"
      title={`${count} ${label} in progress`}
      aria-label={`${count} ${label} in progress`}
    >
      <span className="text-canvas-muted">{icon}</span>
      <span className="tabular-nums text-canvas-body-sm font-medium">{count}</span>
    </div>
  );
}

export function LiveDrakkar() {
  const cards = useCanvasStore((state) => state.cards);
  const cardOrder = useCanvasStore((state) => state.cardOrder);
  const sessionArtifacts = useCanvasStore((state) => state.sessionArtifacts);
  const canvasArtifactNodes = useCanvasStore((state) => state.canvasArtifactNodes);
  const connections = useCanvasStore((state) => state.connections);

  const counts = useMemo(
    () =>
      computeLiveDrakkarCounts({
        cards,
        cardOrder,
        sessionArtifacts,
        canvasArtifactNodes,
        connections,
      }),
    [cards, cardOrder, sessionArtifacts, canvasArtifactNodes, connections],
  );

  if (counts.chatsInProgress === 0 && counts.artifactsInProgress === 0) {
    return null;
  }

  return (
    <div
      className="shrink-0 rounded-canvas border border-canvas-border bg-canvas-card shadow-card"
      aria-live="polite"
      aria-label={`${counts.chatsInProgress} chats and ${counts.artifactsInProgress} artifacts in progress`}
    >
      <div className="floating-chrome-padding flex items-center gap-3">
        <DrakkarStat
          icon={<ChatBubbleIcon />}
          label="chats"
          count={counts.chatsInProgress}
        />
        <span className="h-4 w-px shrink-0 bg-canvas-border" aria-hidden />
        <DrakkarStat
          icon={<ArtefactIcon />}
          label="artifacts"
          count={counts.artifactsInProgress}
        />
      </div>
    </div>
  );
}
