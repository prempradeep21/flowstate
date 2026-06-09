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
import {
  ARTIFACT_CHROME_ZONE_ATTR,
  ARTIFACT_INTERACTIVE_SURFACE_ATTR,
} from "@/lib/artifactChromeHover";
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
  const isCalendar = sessionArtifact.kind === "calendar";
  const isTimeline = sessionArtifact.kind === "timeline";
  const isVideo = activeVersion
    ? isVideoArtifactPayload(activeVersion.payload)
    : false;
  const canEditTodo = isTodo && isLatest && !canvasReadOnly;
  const canEditMap = isMap && isLatest && !canvasReadOnly;
  const canEditCalendar = isCalendar && isLatest && !canvasReadOnly;
  const canEditTimeline = isTimeline && isLatest && !canvasReadOnly;

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
  const isRepoCanvas = isCanvasLayout && sessionArtifact.kind === "repo";

  return (
    <div
      className={
        isCanvasLayout ? "flex min-h-0 flex-1 flex-col" : undefined
      }
    >
      {!isRepoCanvas ? (
      <div
        className={isCanvasLayout ? "pointer-events-auto shrink-0" : undefined}
        {...(isCanvasLayout ? { [ARTIFACT_CHROME_ZONE_ATTR]: "" } : {})}
      >
        <ArtifactPanelHeader
          kind={sessionArtifact.kind}
          isVideo={isVideo}
          title={title}
          artifactId={sessionArtifact.id}
          versions={sessionArtifact.versions}
          activeVersionId={activeVersion.id}
          onVersionChange={handleVersionChange}
          websiteUrl={
            sessionArtifact.kind === "website" &&
            activeVersion.payload.type === "website"
              ? activeVersion.payload.data.url
              : sessionArtifact.kind === "embed" &&
                  activeVersion.payload.type === "embed"
                ? activeVersion.payload.data.url
              : sessionArtifact.kind === "repo" &&
                  activeVersion.payload.type === "repo"
                ? activeVersion.payload.data.repoUrl
                : undefined
          }
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
      ) : null}
      <div
        className={
          isCanvasLayout
            ? `flex min-h-0 flex-1 flex-col overflow-visible rounded-canvas ${
                isRepoCanvas
                  ? "bg-transparent"
                  : sessionArtifact.kind === "table"
                    ? "bg-white"
                    : ""
              } ${isRepoCanvas ? "" : "mt-[22px]"}`
            : "mt-[22px]"
        }
        {...(isCanvasLayout ? { [ARTIFACT_INTERACTIVE_SURFACE_ATTR]: "" } : {})}
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
          calendarCanEdit={canEditCalendar}
          timelineCanEdit={canEditTimeline}
        />
      </div>
    </div>
  );
}
