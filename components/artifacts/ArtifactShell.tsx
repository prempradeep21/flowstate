"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArtifactTextSelection } from "@/components/ArtifactTextSelection";
import { ArtifactCanvasSizeReportProvider } from "@/components/artifacts/ArtifactCanvasSizeReportContext";
import type { ArtifactContentAreaSize } from "@/components/artifacts/ArtifactCanvasSizeReportContext";
import { ArtifactContent, type ArtifactLayout } from "@/components/artifacts/ArtifactContent";
import { ArtifactExportProvider } from "@/components/artifacts/ArtifactExportContext";
import { ArtifactMenuControlsProvider } from "@/components/artifacts/ArtifactMenuControlsContext";
import { ArtifactPanelHeader } from "@/components/artifacts/ArtifactPanelHeader";
import type { TodoArtifactActions } from "@/components/artifacts/TodoArtifactContent";
import { useAuth } from "@/components/AuthProvider";
import { artifactContributorProfiles } from "@/lib/contributorProfiles";
import {
  artifactDisplayTitle,
  artifactRenameTitle,
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
  onRemoveFromCanvas,
  onTodoEditingChange,
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
  onRemoveFromCanvas?: () => void;
  onTodoEditingChange?: (editing: boolean) => void;
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
  const todoActionsRef = useRef<TodoArtifactActions | null>(null);
  const { members, accessInfo } = useAuth();
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const collaborationHasEdits = useCanvasStore((s) => s.collaborationHasEdits);
  const renameSessionArtifactTitle = useCanvasStore(
    (s) => s.renameSessionArtifactTitle,
  );
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
  const isStreamingTitle = Boolean(streamingPayload?.title);
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

  const exitTodoEditMode = useCallback(() => {
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
  const isStickyCanvas = isCanvasLayout && sessionArtifact.kind === "stickynote";
  const showPanelHeader = !isRepoCanvas && !isStickyCanvas;
  const menuControlsEnabled =
    !catalogPreview && layout !== "sidebar" && layout !== "sidebar-preview";
  const showFontControls =
    menuControlsEnabled && sessionArtifact.kind !== "audio";

  return (
    <ArtifactExportProvider>
    <ArtifactMenuControlsProvider
      artifactId={sessionArtifact.id}
      showFontControls={showFontControls}
      menuControlsEnabled={menuControlsEnabled}
    >
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
          renameTitle={artifactRenameTitle(sessionArtifact)}
          canRenameTitle={!readOnly && !isStreamingTitle}
          onRenameTitle={(next) =>
            renameSessionArtifactTitle(sessionArtifact.id, next)
          }
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
          iconFaviconUrl={
            sessionArtifact.kind === "website" &&
            activeVersion.payload.type === "website"
              ? activeVersion.payload.data.faviconUrl
              : sessionArtifact.kind === "embed" &&
                  activeVersion.payload.type === "embed"
                ? activeVersion.payload.data.fallback?.faviconUrl
                : undefined
          }
          menuVariant={menuVariant}
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
            ? `flex min-h-0 flex-1 flex-col overflow-visible rounded-canvas ${
                isRepoCanvas
                  ? "bg-transparent"
                  : artifactKindUsesCanvasSurfaceFill(sessionArtifact.kind)
                    ? ARTIFACT_CANVAS_SURFACE_FILL
                    : ""
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
                      onSaved: exitTodoEditMode,
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
    </ArtifactMenuControlsProvider>
    </ArtifactExportProvider>
  );
}
