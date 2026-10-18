"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { useArtifactMenuDisplayExtras } from "@/components/artifacts/ArtifactMenuControlsContext";
import { ArtifactMenuStreetViewControls } from "@/components/artifacts/menu/ArtifactMenuControlRows";
import type { ArtifactPayload, StreetViewMode } from "@/lib/artifactTypes";
import {
  buildStreetViewEmbedUrl,
  isGoogleMapsKeyConfigured,
} from "@/lib/googleMaps";
import {
  DEFAULT_STREET_VIEW_MODE,
  normalizeStreetViewArtifactData,
  streetViewArtifactHeightForWidth,
} from "@/lib/streetViewArtifact";
import { CANVAS_ARTIFACT_WIDTH } from "@/lib/canvasNodeBounds";
import { useCanvasStore } from "@/lib/store";

function StreetViewFrame({
  children,
  fill,
  minHeight,
  circle,
  interactive,
}: {
  children: ReactNode;
  fill: boolean;
  minHeight?: string;
  circle: boolean;
  interactive: boolean;
}) {
  // Only claim pointer input (exempt from the canvas inert layer) once the
  // node is selected; until then a click selects and a scroll pans the canvas.
  const noDrag = interactive ? { "data-no-drag": true } : {};
  const panelSizeStyle =
    !fill && minHeight ? { minHeight, height: minHeight } : undefined;

  if (circle) {
    return (
      <div
        className={
          fill
            ? "h-full min-h-0 w-full flex-1 [container-type:size]"
            : "w-full [container-type:size]"
        }
        style={panelSizeStyle}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div
            {...noDrag}
            className="relative aspect-square max-h-full max-w-full shrink-0 overflow-hidden rounded-full [width:min(100cqw,100cqh)]"
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Rectangle: the Street View (and its native controls) fills the whole body.
  return (
    <div
      className={fill ? "h-full min-h-0 w-full flex-1" : "w-full"}
      style={panelSizeStyle}
    >
      <div
        {...noDrag}
        className="relative h-full w-full overflow-hidden rounded-2xl"
      >
        {children}
      </div>
    </div>
  );
}

export function StreetViewArtifactContent({
  payload,
  layout = "panel",
  forceInteractive = false,
  artifactId,
  canEdit = false,
  sidebar = false,
}: {
  payload: Extract<ArtifactPayload, { type: "streetview" }>;
  layout?: "canvas" | "panel" | "sidebar";
  forceInteractive?: boolean;
  artifactId?: string;
  canEdit?: boolean;
  sidebar?: boolean;
}) {
  const saveStreetViewArtifactVersion = useCanvasStore(
    (s) => s.saveStreetViewArtifactVersion,
  );

  // Live only while the canvas node is selected — the embed iframe swallows
  // every wheel event, so it must stay inert until then.
  const interactive = forceInteractive;

  const data = payload.data;
  const [viewMode, setViewMode] = useState<StreetViewMode>(
    data.viewMode ?? DEFAULT_STREET_VIEW_MODE,
  );
  useEffect(() => {
    setViewMode(data.viewMode ?? DEFAULT_STREET_VIEW_MODE);
  }, [data.viewMode, payload]);

  const handleViewModeChange = useCallback(
    (next: StreetViewMode) => {
      setViewMode(next);
      // Persist the shape as a new version for editors; viewers still get the
      // local visual switch above.
      if (canEdit && artifactId && next !== data.viewMode) {
        saveStreetViewArtifactVersion(artifactId, {
          ...payload,
          data: normalizeStreetViewArtifactData({ ...data, viewMode: next }),
        });
      }
    },
    [artifactId, canEdit, data, payload, saveStreetViewArtifactVersion],
  );

  useArtifactMenuDisplayExtras(
    !sidebar,
    () => (
      <ArtifactMenuStreetViewControls
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
    ),
    [viewMode, handleViewModeChange, sidebar],
  );

  const { place, heading, pitch, fov } = data;
  const lat = place.lat;
  const lng = place.lng;
  const label = place.label ?? place.name;
  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);
  const keyReady = isGoogleMapsKeyConfigured();

  const isCanvas = layout === "canvas";
  const fill = isCanvas || layout === "sidebar";
  const isCircle = viewMode === "circle";

  const stageClassName = fill
    ? "relative flex min-h-0 w-full flex-1 flex-col !rounded-none !bg-transparent overflow-hidden"
    : "relative flex !rounded-none !bg-transparent overflow-visible";

  if (!hasCoords) {
    return (
      <ArtifactContentStage
        fill={fill}
        artifactId={artifactId}
        className={`${stageClassName} p-4`}
      >
        <p className="text-canvas-body-sm text-canvas-muted">
          Street View location could not be loaded.
        </p>
      </ArtifactContentStage>
    );
  }

  const embedUrl = buildStreetViewEmbedUrl({
    lat,
    lng,
    heading,
    pitch,
    fov,
  });

  const panelMinHeight =
    layout === "canvas"
      ? undefined
      : `${streetViewArtifactHeightForWidth(CANVAS_ARTIFACT_WIDTH, viewMode)}px`;

  return (
    <ArtifactContentStage
      fill={fill}
      artifactId={artifactId}
      className={stageClassName}
    >
      <StreetViewFrame
        fill={fill}
        minHeight={panelMinHeight}
        circle={isCircle}
        interactive={isCanvas && interactive}
      >
        {!keyReady ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-canvas-artifactStage p-6 text-center">
            <p className="text-canvas-body-sm font-medium text-canvas-ink">
              {label}
            </p>
            <p className="font-mono text-canvas-caption text-canvas-muted">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
            <p className="mt-2 max-w-xs text-canvas-body-sm text-canvas-muted">
              Add{" "}
              <code className="rounded bg-canvas-bg px-1 py-0.5 text-canvas-caption">
                NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY
              </code>{" "}
              to enable Street View.
            </p>
          </div>
        ) : (
          <iframe
            title={`Street View: ${label}`}
            src={embedUrl}
            className="h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{
              pointerEvents: isCanvas && interactive ? "auto" : "none",
            }}
          />
        )}
      </StreetViewFrame>
    </ArtifactContentStage>
  );
}
