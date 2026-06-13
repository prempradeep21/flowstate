"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArtifactTextSelection } from "@/components/ArtifactTextSelection";
import { ArtifactCanvasSizeReportProvider } from "@/components/artifacts/ArtifactCanvasSizeReportContext";
import type { ArtifactContentAreaSize } from "@/components/artifacts/ArtifactCanvasSizeReportContext";
import { ArtifactContent, type ArtifactLayout } from "@/components/artifacts/ArtifactContent";
import { ArtifactExportProvider } from "@/components/artifacts/ArtifactExportContext";
import { ArtifactPanelHeader } from "@/components/artifacts/ArtifactPanelHeader";
import type { TodoArtifactActions } from "@/components/artifacts/TodoArtifactContent";
import type { StickyNoteArtifactActions } from "@/components/artifacts/StickyNoteArtifactContent";
import { useAuth } from "@/components/AuthProvider";
import { artifactContributorProfiles } from "@/lib/contributorProfiles";
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import {
  ARTIFACT_CANVAS_SURFACE_FILL,
  artifactKindUsesCanvasSurfaceFill,
} from "@/lib/artifactCanvasChrome";
import {
  isVideoArtifactPayload,
  payloadToArtifactKind,
} from "@/lib/artifactTypes";
import { CANVAS_CONTENT_INERT_CLASS } from "@/lib/canvasNodeInteraction";
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
  onStickyEditingChange,
  catalogPreview = false,
  sourceCardId,
  onArtifactContentAreaSizeChange,
  contentInteractive = true,
}: {
  sessionArtifact: SessionArtifact;
  versionId: string;
  onVersionChange: (versionId: string) => void;
  menuVariant: "canvas" | "panel";
  layout?: ArtifactLayout;
  onExpand?: () => void;
  onRemoveFromCanvas?: () => void;
  onTodoEditingChange?: (editing: boolean) => void;
  onStickyEditingChange?: (editing: boolean) => void;
  /** Dev catalog: enable edits and interaction without canvas chrome. */
  catalogPreview?: boolean;
  /** Card that spawned this artifact — enables Ask a question from selection. */
  sourceCardId?: string | null;
  /** Canvas: reports stage content area so the node wraps font-scale / content growth. */
  onArtifactContentAreaSizeChange?: (size: ArtifactContentAreaSize) => void;
  /** Canvas: when false, artifact body is inert until the node is selected. */
  contentInteractive?: boolean;
}) {
  const [codeTitleOverride, setCodeTitleOverride] = useState<string | null>(null);
  const [isTodoEditing, setIsTodoEditing] = useState(catalogPreview);
  const [isTodoDirty, setIsTodoDirty] = useState(false);
  const [isStickyEditing, setIsStickyEditing] = useState(false);
  const [isStickyDirty, setIsStickyDirty] = useState(false);
  const todoActionsRef = useRef<TodoArtifactActions | null>(null);
  const stickyActionsRef = useRef<StickyNoteArtifactActions | null>(null);
  const { members, accessInfo } = useAuth();
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const collaborationHasEdits = useCanvasStore((s) => s.collaborationHasEdits);
  const readOnly = catalogPreview ? false : canvasReadOnly;

  const cards = useCanvasStore((s) => s.cards);
  const contributorProfiles = useMemo(() => {
    if (members.length <= 1 || !collaborationHasEdits) return [];
    return artifactContributorProfiles(
      sessionArtifact,
      members,
      accessInfo?.ownerId,
      cards,
    );
  }, [
    accessInfo?.ownerId,
    cards,
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
  const isSticky = sessionArtifact.kind === "stickynote";
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
    setIsStickyEditing(false);
    setIsStickyDirty(false);
  }, [catalogPreview, sessionArtifact.id, sessionArtifact.kind, versionId]);

  useEffect(() => {
    onTodoEditingChange?.(isTodoEditing);
  }, [isTodoEditing, onTodoEditingChange]);

  useEffect(() => {
    onStickyEditingChange?.(isStickyEditing);
  }, [isStickyEditing, onStickyEditingChange]);

  const handleVersionChange = useCallback(
    (nextVersionId: string) => {
      if (isTodoEditing && isTodoDirty) {
        const ok = window.confirm(
          "You have unsaved changes. Discard them and switch version?",
        );
        if (!ok) return;
        todoActionsRef.current?.discard();
      }
      if (isStickyEditing && isStickyDirty) {
        const ok = window.confirm(
          "You have unsaved changes. Discard them and switch version?",
        );
        if (!ok) return;
        stickyActionsRef.current?.discard();
      }
      setIsTodoEditing(false);
      setIsTodoDirty(false);
      setIsStickyEditing(false);
      setIsStickyDirty(false);
      onVersionChange(nextVersionId);
    },
    [isStickyDirty, isStickyEditing, isTodoDirty, isTodoEditing, onVersionChange],
  );

  const exitTodoEditMode = useCallback(() => {
    setIsTodoEditing(false);
    setIsTodoDirty(false);
  }, []);

  const exitStickyEditMode = useCallback(() => {
    setIsStickyEditing(false);
    setIsStickyDirty(false);
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
  const isStickyCanvas = isCanvasLayout && sessionArtifact.kind === "stickynote";
  const showPanelHeader = !isRepoCanvas && !isStickyCanvas;

  return (
    <ArtifactExportProvider>
    <div
      className={
        isCanvasLayout ? "flex min-h-0 flex-1 flex-col" : undefined
      }
    >
      {showPanelHeader ? (
      <div
        className={isCanvasLayout ? "pointer-events-auto shrink-0" : undefined}
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
              : sessionArtifact.kind === "google-doc" &&
                  activeVersion.payload.type === "google-doc"
                ? activeVersion.payload.data.url
              : sessionArtifact.kind === "embed" &&
                  activeVersion.payload.type === "embed"
                ? activeVersion.payload.data.url
              : sessionArtifact.kind === "repo" &&
                  activeVersion.payload.type === "repo"
                ? activeVersion.payload.data.repoUrl
                : undefined
          }
          googleFileKind={
            sessionArtifact.kind === "google-doc" &&
            activeVersion.payload.type === "google-doc"
              ? activeVersion.payload.data.fileKind
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
                  onCancelEdit: exitTodoEditMode,
                }
              : undefined
          }
          exportPayload={displayPayload}
        />
      </div>
      ) : null}
      <div
        className={
          isCanvasLayout
            ? `flex min-h-0 flex-1 flex-col overflow-visible rounded-canvas-sm ${
                isRepoCanvas
                  ? "bg-transparent"
                  : artifactKindUsesCanvasSurfaceFill(sessionArtifact.kind)
                    ? ARTIFACT_CANVAS_SURFACE_FILL
                    : ""
              } ${
                isRepoCanvas || isStickyCanvas
                  ? ""
                  : sessionArtifact.kind === "streetview"
                    ? "mt-0 min-h-0 flex-1"
                    : "mt-[22px]"
              } ${!contentInteractive ? CANVAS_CONTENT_INERT_CLASS : ""}`
            : "mt-[22px]"
        }
      >
        <ArtifactCanvasSizeReportProvider
          onContentAreaSizeChange={onArtifactContentAreaSizeChange}
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
                    onSaved: exitTodoEditMode,
                  }
                : undefined
            }
            stickyContext={
              isSticky
                ? {
                    isEditing: isStickyEditing,
                    onDirtyChange: setIsStickyDirty,
                    onActionsReady: (actions) => {
                      stickyActionsRef.current = actions;
                    },
                    onRequestEdit: () => setIsStickyEditing(true),
                    onDone: exitStickyEditMode,
                    onSaved: exitStickyEditMode,
                  }
                : undefined
            }
            mapCanEdit={canEditMap}
            calendarCanEdit={canEditCalendar}
            timelineCanEdit={canEditTimeline}
            catalogPreview={catalogPreview}
            canvasContentInteractive={contentInteractive}
          />
        ) : (
          <ArtifactTextSelection
            artifactId={sessionArtifact.id}
            sourceCardId={sourceCardId}
            enabled={!isTodoEditing && !isStickyEditing}
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
                      onSaved: exitTodoEditMode,
                    }
                  : undefined
              }
              stickyContext={
              isSticky
                ? {
                    isEditing: isStickyEditing,
                    onDirtyChange: setIsStickyDirty,
                    onActionsReady: (actions) => {
                      stickyActionsRef.current = actions;
                    },
                    onRequestEdit: () => setIsStickyEditing(true),
                    onDone: exitStickyEditMode,
                    onSaved: exitStickyEditMode,
                  }
                : undefined
            }
            mapCanEdit={canEditMap}
              calendarCanEdit={canEditCalendar}
              timelineCanEdit={canEditTimeline}
              catalogPreview={catalogPreview}
              canvasContentInteractive={contentInteractive}
            />
          </ArtifactTextSelection>
        )}
        </ArtifactCanvasSizeReportProvider>
      </div>
    </div>
    </ArtifactExportProvider>
  );
}
