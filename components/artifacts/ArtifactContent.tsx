"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CodeArtifactContent } from "@/components/artifacts/CodeArtifactContent";
import { CodeSidebarPreview } from "@/components/artifacts/CodeSidebarPreview";
import { CustomArtifactContent } from "@/components/artifacts/CustomArtifactContent";
import { ImagesArtifactContent } from "@/components/artifacts/ImagesArtifactContent";
import { TableArtifactContent } from "@/components/artifacts/TableArtifactContent";
import { ThreeDArtifactContent } from "@/components/artifacts/ThreeDArtifactContent";
import { CalendarArtifactContent } from "@/components/artifacts/CalendarArtifactContent";
import { TodoArtifactContent } from "@/components/artifacts/TodoArtifactContent";
import { TodoSidebarPreview } from "@/components/artifacts/TodoSidebarPreview";
import { WebsiteArtifactContent } from "@/components/artifacts/WebsiteArtifactContent";
import { GoogleWorkspaceArtifactContent } from "@/components/artifacts/GoogleWorkspaceArtifactContent";
import { EmbedArtifactContent } from "@/components/artifacts/EmbedArtifactContent";
import { RepoArtifactContent } from "@/components/artifacts/RepoArtifactContent";
import { TimelineArtifactContent } from "@/components/artifacts/TimelineArtifactContent";
import { AudioArtifactContent } from "@/components/artifacts/AudioArtifactContent";
import { StickyNoteArtifactContent } from "@/components/artifacts/StickyNoteArtifactContent";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import { payloadToArtifactKind } from "@/lib/artifactTypes";

const MapArtifactContent = dynamic(
  () =>
    import("@/components/artifacts/MapArtifactContent").then(
      (m) => m.MapArtifactContent,
    ),
  { ssr: false },
);

const StreetViewArtifactContent = dynamic(
  () =>
    import("@/components/artifacts/StreetViewArtifactContent").then(
      (m) => m.StreetViewArtifactContent,
    ),
  { ssr: false },
);

const ChartArtifactContent = dynamic(
  () =>
    import("@/components/artifacts/ChartArtifactContent").then(
      (m) => m.ChartArtifactContent,
    ),
  { ssr: false },
);

export type ArtifactLayout = "canvas" | "panel" | "sidebar";

export function ArtifactContent({
  payload,
  layout = "panel",
  artifactId,
  versionId,
  onCodeActiveFileChange,
  todoContext,
  mapCanEdit = false,
  calendarCanEdit = false,
  timelineCanEdit = false,
  catalogPreview = false,
  canvasContentInteractive = true,
}: {
  payload: ArtifactPayload;
  layout?: ArtifactLayout;
  artifactId?: string;
  versionId?: string;
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
  mapCanEdit?: boolean;
  calendarCanEdit?: boolean;
  timelineCanEdit?: boolean;
  catalogPreview?: boolean;
  /** Canvas: artifact body is interactable only when the node is selected. */
  canvasContentInteractive?: boolean;
}) {
  const kind = payloadToArtifactKind(payload);
  const isSidebar = layout === "sidebar";
  const isCanvas = layout === "canvas";
  const fill = isCanvas || isSidebar;
  const canvasInteractive = catalogPreview || canvasContentInteractive;

  switch (kind) {
    case "table":
      if (payload.type === "table") {
        return (
          <TableArtifactContent
            payload={payload}
            artifactId={artifactId}
            versionId={versionId}
            fill={fill}
            sidebar={isSidebar}
            showControls={!isSidebar}
          />
        );
      }
      break;
    case "images":
      if (payload.type === "images") {
        return (
          <ImagesArtifactContent
            payload={payload}
            fill={fill}
            sidebar={isSidebar}
            allowMediaInteraction={catalogPreview || !isCanvas || canvasInteractive}
            artifactId={artifactId}
            showControls={!isSidebar}
          />
        );
      }
      break;
    case "3d":
      if (payload.type === "3d") {
        return (
          <ThreeDArtifactContent
            payload={payload}
            fill={fill}
            sidebar={isSidebar}
            artifactId={artifactId}
            showControls={!isSidebar}
            allowInteraction={catalogPreview || !isCanvas || canvasInteractive}
          />
        );
      }
      break;
    case "custom":
      if (payload.type === "custom") {
        return (
          <CustomArtifactContent
            payload={payload}
            fill={fill}
            sidebar={isSidebar}
            layout={layout}
            artifactId={artifactId}
            showControls={!isSidebar}
          />
        );
      }
      break;
    case "code":
      if (payload.type === "code") {
        if (isSidebar) {
          return <CodeSidebarPreview payload={payload} />;
        }
        return (
          <CodeArtifactContent
            payload={payload}
            fill={fill}
            onActiveFileChange={onCodeActiveFileChange}
            artifactId={artifactId}
            showControls={!isSidebar}
          />
        );
      }
      break;
    case "map":
      if (payload.type === "map") {
        return (
          <MapArtifactContent
            payload={payload}
            artifactId={artifactId}
            canEdit={mapCanEdit && !isSidebar}
            fill={fill}
            sidebar={isSidebar}
            layout={layout}
          />
        );
      }
      break;
    case "streetview":
      if (payload.type === "streetview") {
        const streetView = (
          <StreetViewArtifactContent
            payload={payload}
            layout={layout}
            forceInteractive={canvasInteractive}
            artifactId={artifactId}
            showControls={!isSidebar}
          />
        );
        return layout === "canvas" ? (
          <div className="flex min-h-0 w-full flex-1 flex-col">{streetView}</div>
        ) : (
          streetView
        );
      }
      break;
    case "calendar":
      if (payload.type === "calendar") {
        return (
          <CalendarArtifactContent
            payload={payload}
            artifactId={artifactId}
            canEdit={calendarCanEdit && !isSidebar}
            fill={fill}
            sidebar={isSidebar}
            layout={layout}
          />
        );
      }
      break;
    case "todo":
      if (payload.type === "todo") {
        if (isSidebar) {
          return <TodoSidebarPreview payload={payload} />;
        }
        if (todoContext) {
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
      }
      break;
    case "website":
      if (payload.type === "website") {
        return (
          <WebsiteArtifactContent
            payload={payload}
            fill={fill}
            sidebar={isSidebar}
            artifactId={artifactId}
            showControls={!isSidebar}
          />
        );
      }
      break;
    case "google-doc":
      if (payload.type === "google-doc") {
        return (
          <GoogleWorkspaceArtifactContent
            payload={payload}
            fill={fill}
            sidebar={isSidebar}
            layout={layout}
            artifactId={artifactId}
            forceInteractive={canvasInteractive}
          />
        );
      }
      break;
    case "repo":
      if (payload.type === "repo") {
        return (
          <RepoArtifactContent
            payload={payload}
            fill={fill}
            sidebar={isSidebar}
            artifactId={artifactId}
          />
        );
      }
      break;
    case "embed":
      if (payload.type === "embed") {
        return (
          <EmbedArtifactContent
            payload={payload}
            fill={fill}
            sidebar={isSidebar}
            layout={layout}
            artifactId={artifactId}
            versionId={versionId}
            forceInteractive={canvasInteractive}
          />
        );
      }
      break;
    case "timeline":
      if (payload.type === "timeline") {
        return (
          <TimelineArtifactContent
            payload={payload}
            artifactId={artifactId}
            canEdit={timelineCanEdit && !isSidebar}
            fill={fill}
            sidebar={isSidebar}
            layout={layout}
          />
        );
      }
      break;
    case "chart":
      if (payload.type === "chart") {
        return (
          <ChartArtifactContent
            payload={payload}
            fill={fill}
            sidebar={isSidebar}
            artifactId={artifactId}
          />
        );
      }
      break;
    case "audio":
      if (payload.type === "audio") {
        return (
          <AudioArtifactContent
            payload={payload}
            fill={fill}
            sidebar={isSidebar}
            allowInteraction={catalogPreview || !isCanvas || canvasInteractive}
            artifactId={artifactId}
            showControls={!isSidebar}
          />
        );
      }
      break;
    case "stickynote":
      if (payload.type === "stickynote") {
        return (
          <StickyNoteArtifactContent
            payload={payload}
            artifactId={artifactId}
            fill={fill}
            sidebar={isSidebar}
            canvasContentInteractive={canvasInteractive}
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
