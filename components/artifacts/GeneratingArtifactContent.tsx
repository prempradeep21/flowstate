"use client";

import { ArtifactContent } from "@/components/artifacts/ArtifactContent";
import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import { payloadToArtifactKind } from "@/lib/artifactTypes";
import type { Card } from "@/lib/store";

function placeholderPayload(
  kind: ArtifactKind,
  title: string,
): ArtifactPayload {
  if (kind === "table") {
    return { type: "table", title, data: { columns: [], rows: [] } };
  }
  if (kind === "chart") {
    return {
      type: "chart",
      title,
      data: {
        chartType: "line",
        categories: ["…"],
        series: [{ name: "Loading", data: [0] }],
      },
    };
  }
  return {
    type: "custom",
    title,
    data: {
      html: '<div class="pending">Preparing component…</div>',
      css: ".pending { padding: 1rem; color: #6b7280; font: 14px/1.5 system-ui,sans-serif; }",
    },
  };
}

export function GeneratingArtifactContent({
  kind,
  title,
  sourceCard,
}: {
  kind: ArtifactKind;
  title: string;
  sourceCard?: Card;
}) {
  const streamingPayload =
    sourceCard?.artifactPayload &&
    payloadToArtifactKind(sourceCard.artifactPayload) === kind
      ? sourceCard.artifactPayload
      : placeholderPayload(kind, title);

  return (
    <ArtifactContent payload={streamingPayload} layout="canvas" />
  );
}
