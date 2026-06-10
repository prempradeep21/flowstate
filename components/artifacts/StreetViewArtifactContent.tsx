"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import {
  buildStreetViewEmbedUrl,
  isGoogleMapsKeyConfigured,
} from "@/lib/googleMaps";
import { STREET_VIEW_ARTIFACT_HEIGHT } from "@/lib/streetViewArtifact";

function useInscribedCircleSize() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const next = Math.max(0, Math.min(width, height));
      setSize(next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { containerRef, size };
}

function StreetViewCircleFrame({
  children,
  fill,
  minHeight,
}: {
  children: ReactNode;
  fill: boolean;
  minHeight?: string;
}) {
  const { containerRef, size } = useInscribedCircleSize();

  return (
    <div
      className={`relative w-full ${fill ? "min-h-0 flex-1 self-stretch" : ""}`}
      style={minHeight ? { minHeight } : undefined}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        {size > 0 ? (
          <div
            data-no-drag
            className="relative shrink-0 overflow-hidden rounded-full"
            style={{ width: size, height: size }}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

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

  const stageClassName = fill
    ? "relative flex min-h-0 w-full flex-1 flex-col !rounded-none !bg-transparent overflow-hidden"
    : "relative flex !rounded-none !bg-transparent overflow-visible";

  if (!hasCoords) {
    return (
      <ArtifactContentStage fill={fill} className={`${stageClassName} p-4`}>
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
    layout === "canvas" ? undefined : `${STREET_VIEW_ARTIFACT_HEIGHT}px`;

  return (
    <ArtifactContentStage fill={fill} className={stageClassName}>
      <StreetViewCircleFrame fill={fill} minHeight={panelMinHeight}>
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
          <>
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
            {isCanvas && !interactive && (
              <button
                type="button"
                data-no-drag
                onClick={enableInteraction}
                className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-canvas-ink/0 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-ink/5"
              >
                Click to interact
              </button>
            )}
          </>
        )}
      </StreetViewCircleFrame>
    </ArtifactContentStage>
  );
}
