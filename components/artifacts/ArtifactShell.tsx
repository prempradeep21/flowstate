"use client";

import { useEffect, useMemo, useState } from "react";
import { ArtifactContent } from "@/components/artifacts/ArtifactContent";
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
  onExpand,
  onRemoveFromCanvas,
}: {
  sessionArtifact: SessionArtifact;
  versionId: string;
  onVersionChange: (versionId: string) => void;
  menuVariant: "canvas" | "panel";
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

  return (
    <>
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
      <div className="mt-4">
        <ArtifactContent
          payload={activeVersion.payload}
          onCodeActiveFileChange={
            sessionArtifact.kind === "code" ? setCodeTitleOverride : undefined
          }
        />
      </div>
    </>
  );
}
