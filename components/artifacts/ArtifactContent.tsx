"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CodeArtifactContent } from "@/components/artifacts/CodeArtifactContent";
import { CustomArtifactContent } from "@/components/artifacts/CustomArtifactContent";
import { ImagesArtifactContent } from "@/components/artifacts/ImagesArtifactContent";
import { TableArtifactContent } from "@/components/artifacts/TableArtifactContent";
import { ThreeDArtifactContent } from "@/components/artifacts/ThreeDArtifactContent";
import { TodoArtifactContent } from "@/components/artifacts/TodoArtifactContent";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import { payloadToArtifactKind } from "@/lib/artifactTypes";

const MapArtifactContent = dynamic(
  () =>
    import("@/components/artifacts/MapArtifactContent").then(
      (m) => m.MapArtifactContent,
    ),
  { ssr: false },
);

export type ArtifactLayout = "canvas" | "panel";

export function ArtifactContent({
  payload,
  layout = "panel",
  onCodeActiveFileChange,
  todoContext,
}: {
  payload: ArtifactPayload;
  layout?: ArtifactLayout;
  onCodeActiveFileChange?: (path: string) => void;
  todoContext?: {
    artifactId: string;
    versionId: string;
    latestVersionId: string;
    isEditing: boolean;
    onDirtyChange?: (dirty: boolean) => void;
    onActionsReady?: (actions: import("@/components/artifacts/TodoArtifactContent").TodoArtifactActions) => void;
    onSaved?: () => void;
  };
}) {
  const kind = payloadToArtifactKind(payload);
  const fill = layout === "canvas";

  switch (kind) {
    case "table":
      if (payload.type === "table") {
        return <TableArtifactContent payload={payload} fill={fill} />;
      }
      break;
    case "images":
      if (payload.type === "images") {
        return <ImagesArtifactContent payload={payload} fill={fill} />;
      }
      break;
    case "3d":
      if (payload.type === "3d") {
        return <ThreeDArtifactContent payload={payload} fill={fill} />;
      }
      break;
    case "custom":
      if (payload.type === "custom") {
        return <CustomArtifactContent payload={payload} fill={fill} />;
      }
      break;
    case "code":
      if (payload.type === "code") {
        return (
          <CodeArtifactContent
            payload={payload}
            fill={fill}
            onActiveFileChange={onCodeActiveFileChange}
          />
        );
      }
      break;
    case "map":
      if (payload.type === "map") {
        return <MapArtifactContent payload={payload} fill={fill} />;
      }
      break;
    case "todo":
      if (payload.type === "todo" && todoContext) {
        return (
          <TodoArtifactContent
            artifactId={todoContext.artifactId}
            payload={payload}
            versionId={todoContext.versionId}
            latestVersionId={todoContext.latestVersionId}
            isEditing={todoContext.isEditing}
            fill={fill}
            onDirtyChange={todoContext.onDirtyChange}
            onActionsReady={todoContext.onActionsReady}
            onSaved={todoContext.onSaved}
          />
        );
      }
      break;
  }

  return null;
}

/** Hook-friendly wrapper for panel header title sync on code tab change */
export function ArtifactContentWithCodeTitle({
  payload,
  onTitleOverride,
}: {
  payload: ArtifactPayload;
  onTitleOverride: (title: string) => void;
}) {
  const [, setTick] = useState(0);
  return (
    <ArtifactContent
      payload={payload}
      onCodeActiveFileChange={(path) => {
        onTitleOverride(path);
        setTick((t) => t + 1);
      }}
    />
  );
}
