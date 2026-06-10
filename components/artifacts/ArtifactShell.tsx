"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArtifactTextSelection } from "@/components/ArtifactTextSelection";
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
import {
  isVideoArtifactPayload,
  payloadToArtifactKind,
} from "@/lib/artifactTypes";
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
  catalogPreview = false,
  sourceCardId,
}: {
  sessionArtifact: SessionArtifact;
  versionId: string;
  onVersionChange: (versionId: string) => void;
  menuVariant: "canvas" | "panel";
  layout?: ArtifactLayout;
  onExpand?: () => void;
  onRemoveFromCanvas?: () => void;
  onTodoEditingChange?: (editing: boolean) => void;
  /** Dev catalog: enable edits and interaction without canvas chrome. */
  catalogPreview?: boolean;
  /** Card that spawned this artifact — enables Ask a question from selection. */
  sourceCardId?: string | null;
}) {
  const [codeTitleOverride, setCodeTitleOverride] = useState<string | null>(null);
  const [isTodoEditing, setIsTodoEditing] = useState(catalogPreview);
  const [isTodoDirty, setIsTodoDirty] = useState(false);
  const todoActionsRef = useRef<TodoArtifactActions | null>(null);
  const { members, accessInfo } = useAuth();
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const collaborationHasEdits = useCanvasStore((s) => s.collaborationHasEdits);
  const readOnly = catalogPreview ? false : canvasReadOnly;

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

  const sourceCard = useCanvasStore((s) =>
    sourceCardId ? s.cards[sourceCardId] : undefined,
  );

  const activeVersion = useMemo(() => {
    return (
      getVersionById(sessionArtifact, versionId) ??
      getLatestVersion(sessionArtifact)
    );
  }, [sessionArtifact, versionId]);

  const streamingPayload = useMemo(() => {
    if (
      !sourceCard ||
      (sourceCard.status !== "thinking" && sourceCard.status !== "streaming")
    ) {
      return undefined;
    }
    const payload = sourceCard.artifactPayload;
    if (!payload) return undefined;
    if (payloadToArtifactKind(payload) !== sessionArtifact.kind) return undefined;
    return payload;
  }, [sessionArtifact.kind, sourceCard]);

  const displayPayload = streamingPayload ?? activeVersion?.payload;

  const isLatest = versionId === sessionArtifact.latestVersionId;
  const isTodo = sessionArtifact.kind === "todo";
  const isMap = sessionArtifact.kind === "map";
  const isCalendar = sessionArtifact.kind === "calendar";
  const isTimeline = sessionArtifact.kind === "timeline";
  const isVideo = activeVersion
    ? isVideoArtifactPayload(activeVersion.payload)
    : false;
  const canEditTodo = isTodo && isLatest && !readOnly;
  const canEditMap = isMap && isLatest && !readOnly;
  const canEditCalendar = isCalendar && isLatest && !readOnly;
  const canEditTimeline = isTimeline && isLatest && !readOnly;

  useEffect(() => {
    setCodeTitleOverride(null);
    setIsTodoEditing(catalogPreview && sessionArtifact.kind === "todo");
    setIsTodoDirty(false);
  }, [catalogPreview, sessionArtifact.id, sessionArtifact.kind, versionId]);

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

  if (!activeVersion || !displayPayload) return null;

  const title =
    sessionArtifact.kind === "code"
      ? codeTitleOverride ??
        artifactDisplayTitle(sessionArtifact, activeVersion)
      : streamingPayload?.title ||
        artifactDisplayTitle(sessionArtifact, activeVersion);

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
        {catalogPreview ? (
          <ArtifactContent
            layout={layout}
            payload={displayPayload}
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
            catalogPreview={catalogPreview}
          />
        ) : (
          <ArtifactTextSelection
            artifactId={sessionArtifact.id}
            sourceCardId={sourceCardId}
            enabled={!isTodoEditing}
            className={
              isCanvasLayout ? "flex min-h-0 flex-1 flex-col overflow-visible" : ""
            }
          >
            <ArtifactContent
              layout={layout}
              payload={displayPayload}
              artifactId={sessionArtifact.id}
              versionId={activeVersion.id}
              onCodeActiveFileChange={
                sessionArtifact.kind === "code"
                  ? setCodeTitleOverride
                  : undefined
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
              catalogPreview={catalogPreview}
            />
          </ArtifactTextSelection>
        )}
      </div>
    </div>
  );
}
