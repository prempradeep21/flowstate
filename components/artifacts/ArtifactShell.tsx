"use client";

import { useEffect, useMemo, useState } from "react";
import { ArtifactContent, type ArtifactLayout } from "@/components/artifacts/ArtifactContent";
import { ArtifactPanelHeader } from "@/components/artifacts/ArtifactPanelHeader";
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";

export function ArtifactShell({
  sessionArtifact,
  versionId,
  onVersionChange,
  menuVariant,
  layout = "panel",
  onExpand,
  onRemoveFromCanvas,
}: {
  sessionArtifact: SessionArtifact;
  versionId: string;
  onVersionChange: (versionId: string) => void;
  menuVariant: "canvas" | "panel";
  layout?: ArtifactLayout;
  onExpand?: () => void;
  onRemoveFromCanvas?: () => void;
}) {
  const [codeTitleOverride, setCodeTitleOverride] = useState<string | null>(null);

  const activeVersion = useMemo(() => {
    return (
      getVersionById(sessionArtifact, versionId) ??
      getLatestVersion(sessionArtifact)
    );
  }, [sessionArtifact, versionId]);

  useEffect(() => {
    setCodeTitleOverride(null);
  }, [sessionArtifact.id, versionId]);

  if (!activeVersion) return null;

  const title =
    sessionArtifact.kind === "code"
      ? codeTitleOverride ??
        artifactDisplayTitle(sessionArtifact, activeVersion)
      : artifactDisplayTitle(sessionArtifact, activeVersion);

  const isCanvasLayout = layout === "canvas";

  return (
    <div
      className={
        isCanvasLayout ? "flex min-h-0 flex-1 flex-col" : undefined
      }
    >
      <div className={isCanvasLayout ? "shrink-0" : undefined}>
        <ArtifactPanelHeader
          kind={sessionArtifact.kind}
          title={title}
          versions={sessionArtifact.versions}
          activeVersionId={activeVersion.id}
          onVersionChange={onVersionChange}
          menuVariant={menuVariant}
          onExpand={onExpand}
          onRemoveFromCanvas={onRemoveFromCanvas}
        />
      </div>
      <div
        className={
          isCanvasLayout
            ? "mt-4 flex min-h-0 flex-1 flex-col"
            : "mt-4"
        }
      >
        <ArtifactContent
          layout={layout}
          payload={activeVersion.payload}
          onCodeActiveFileChange={
            sessionArtifact.kind === "code" ? setCodeTitleOverride : undefined
          }
        />
      </div>
    </div>
  );
}
