"use client";

import { useCallback, useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import {
  buildStreetViewEmbedUrl,
  isGoogleMapsKeyConfigured,
} from "@/lib/googleMaps";
import { STREET_VIEW_ARTIFACT_HEIGHT } from "@/lib/streetViewArtifact";

export function StreetViewArtifactContent({
  payload,
  layout = "panel",
  forceInteractive = false,
}: {
  payload: Extract<ArtifactPayload, { type: "streetview" }>;
  layout?: "canvas" | "panel" | "sidebar";
  forceInteractive?: boolean;
}) {
  const [interactive, setInteractive] = useState(forceInteractive);
  const { place, heading, pitch, fov } = payload.data;
  const lat = place.lat;
  const lng = place.lng;
  const label = place.label ?? place.name;
  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);
  const keyReady = isGoogleMapsKeyConfigured();

  const enableInteraction = useCallback(() => {
    setInteractive(true);
  }, []);

  const isCanvas = layout === "canvas";
  const fill = isCanvas || layout === "sidebar";

  if (!hasCoords) {
    return (
      <ArtifactContentStage fill={fill} className="p-4">
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

  const height =
    layout === "canvas" ? "100%" : `${STREET_VIEW_ARTIFACT_HEIGHT}px`;

  return (
    <ArtifactContentStage fill={fill} className="relative overflow-hidden">
      {!keyReady ? (
        <div
          className="flex flex-col items-center justify-center gap-2 bg-canvas-bg p-6 text-center"
          style={{ minHeight: height }}
        >
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
        <>
          <iframe
            title={`Street View: ${label}`}
            src={embedUrl}
            className="h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{
              minHeight: height,
              pointerEvents: isCanvas && interactive ? "auto" : "none",
            }}
          />
          {isCanvas && !interactive && (
            <button
              type="button"
              data-no-drag
              onClick={enableInteraction}
              className="absolute inset-0 z-10 flex items-center justify-center bg-canvas-ink/0 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-ink/5"
            >
              Click to interact
            </button>
          )}
        </>
      )}
    </ArtifactContentStage>
  );
}
