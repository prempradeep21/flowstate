"use client";

import { useState } from "react";
import { CodeArtifactContent } from "@/components/artifacts/CodeArtifactContent";
import { CustomArtifactContent } from "@/components/artifacts/CustomArtifactContent";
import { ImagesArtifactContent } from "@/components/artifacts/ImagesArtifactContent";
import { TableArtifactContent } from "@/components/artifacts/TableArtifactContent";
import { ThreeDArtifactContent } from "@/components/artifacts/ThreeDArtifactContent";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import { payloadToArtifactKind } from "@/lib/artifactTypes";

export type ArtifactLayout = "canvas" | "panel";

export function ArtifactContent({
  payload,
  layout = "panel",
  onCodeActiveFileChange,
}: {
  payload: ArtifactPayload;
  layout?: ArtifactLayout;
  onCodeActiveFileChange?: (path: string) => void;
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
