"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArtifactContent, type ArtifactLayout } from "@/components/artifacts/ArtifactContent";
import { ArtifactPanelHeader } from "@/components/artifacts/ArtifactPanelHeader";
import type { TodoArtifactActions } from "@/components/artifacts/TodoArtifactContent";
import { useAuth } from "@/components/AuthProvider";
import { artifactContributorProfiles } from "@/lib/contributorProfiles";
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import { isVideoArtifactPayload } from "@/lib/artifactTypes";
import { useCanvasStore } from "@/lib/store";

export function ArtifactShell({
  sessionArtifact,
  versionId,
  onVersionChange,
  menuVariant,
  layout = "panel",
  onExpand,
  onRemoveFromCanvas,
  onTodoEditingChange,
}: {
  sessionArtifact: SessionArtifact;
  versionId: string;
  onVersionChange: (versionId: string) => void;
  menuVariant: "canvas" | "panel";
  layout?: ArtifactLayout;
  onExpand?: () => void;
  onRemoveFromCanvas?: () => void;
  onTodoEditingChange?: (editing: boolean) => void;
}) {
  const [codeTitleOverride, setCodeTitleOverride] = useState<string | null>(null);
  const [isTodoEditing, setIsTodoEditing] = useState(false);
  const [isTodoDirty, setIsTodoDirty] = useState(false);
  const todoActionsRef = useRef<TodoArtifactActions | null>(null);
  const { members, accessInfo } = useAuth();
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const collaborationHasEdits = useCanvasStore((s) => s.collaborationHasEdits);

  const contributorProfiles = useMemo(() => {
    if (members.length <= 1 || !collaborationHasEdits) return [];
    return artifactContributorProfiles(
      sessionArtifact,
      members,
      accessInfo?.ownerId,
    );
  }, [
    accessInfo?.ownerId,
    collaborationHasEdits,
    members,
    sessionArtifact,
  ]);

  const activeVersion = useMemo(() => {
    return (
      getVersionById(sessionArtifact, versionId) ??
      getLatestVersion(sessionArtifact)
    );
  }, [sessionArtifact, versionId]);

  const isLatest = versionId === sessionArtifact.latestVersionId;
  const isTodo = sessionArtifact.kind === "todo";
  const isMap = sessionArtifact.kind === "map";
  const isVideo = activeVersion
    ? isVideoArtifactPayload(activeVersion.payload)
    : false;
  const canEditTodo = isTodo && isLatest && !canvasReadOnly;
  const canEditMap = isMap && isLatest && !canvasReadOnly;

  useEffect(() => {
    setCodeTitleOverride(null);
    setIsTodoEditing(false);
    setIsTodoDirty(false);
  }, [sessionArtifact.id, versionId]);

  useEffect(() => {
    onTodoEditingChange?.(isTodoEditing);
  }, [isTodoEditing, onTodoEditingChange]);

  const handleVersionChange = useCallback(
    (nextVersionId: string) => {
      if (isTodoEditing && isTodoDirty) {
        const ok = window.confirm(
          "You have unsaved changes. Discard them and switch version?",
        );
        if (!ok) return;
        todoActionsRef.current?.discard();
      }
      setIsTodoEditing(false);
      setIsTodoDirty(false);
      onVersionChange(nextVersionId);
    },
    [isTodoDirty, isTodoEditing, onVersionChange],
  );

  const exitEditMode = useCallback(() => {
    setIsTodoEditing(false);
    setIsTodoDirty(false);
  }, []);

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
          isVideo={isVideo}
          title={title}
          artifactId={sessionArtifact.id}
          versions={sessionArtifact.versions}
          activeVersionId={activeVersion.id}
          onVersionChange={handleVersionChange}
          menuVariant={menuVariant}
          onExpand={onExpand}
          onRemoveFromCanvas={onRemoveFromCanvas}
          contributorProfiles={contributorProfiles}
          todoEditControls={
            canEditTodo
              ? {
                  canEdit: true,
                  isEditing: isTodoEditing,
                  isDirty: isTodoDirty,
                  onEdit: () => setIsTodoEditing(true),
                  onSave: () => {
                    todoActionsRef.current?.save();
                  },
                  onDiscard: () => {
                    todoActionsRef.current?.discard();
                  },
                  onCancelEdit: exitEditMode,
                }
              : undefined
          }
        />
      </div>
      <div
        className={
          isCanvasLayout
            ? `mt-[22px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-canvas ${
                sessionArtifact.kind === "table" ? "bg-white" : ""
              }`
            : "mt-[22px]"
        }
      >
        <ArtifactContent
          layout={layout}
          payload={activeVersion.payload}
          artifactId={sessionArtifact.id}
          versionId={activeVersion.id}
          onCodeActiveFileChange={
            sessionArtifact.kind === "code" ? setCodeTitleOverride : undefined
          }
          todoContext={
            isTodo
              ? {
                  artifactId: sessionArtifact.id,
                  versionId: activeVersion.id,
                  latestVersionId: sessionArtifact.latestVersionId,
                  isEditing: isTodoEditing,
                  onDirtyChange: setIsTodoDirty,
                  onActionsReady: (actions) => {
                    todoActionsRef.current = actions;
                  },
                  onSaved: exitEditMode,
                }
              : undefined
          }
          mapCanEdit={canEditMap}
        />
      </div>
    </div>
  );
}
