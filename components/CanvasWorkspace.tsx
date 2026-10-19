"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { AdminPortalButton } from "@/components/AdminPortalButton";
import { AppLeftPanel } from "@/components/AppLeftPanel";
import { AppRightPanel } from "@/components/AppRightPanel";
import { ArtifactStyleScope } from "@/components/ArtifactStyleScope";
import { Canvas } from "@/components/Canvas";
import { CanvasMinimap } from "@/components/CanvasMinimap";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ChatView } from "@/components/ChatView";
import { FocusView } from "@/components/FocusView";
import { CardAskOrchestrator } from "@/components/CardAskOrchestrator";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { CanvasVideoPlayerLayer } from "@/components/CanvasVideoPlayerLayer";
import { McpApprovalDock } from "@/components/mcp/McpApprovalPopup";
import { CoachMarkTour } from "@/components/onboarding/CoachMarkTour";
import { ShareModal } from "@/components/ShareModal";
import { GuestWall } from "@/components/billing/GuestWall";
import { useAuth } from "@/components/AuthProvider";
import { useCanvasLayoutOutlineCache } from "@/hooks/useCanvasLayoutOutlineCache";
import { useCanvasSnapshotThumbnailCapture } from "@/hooks/useCanvasSnapshotThumbnailCapture";
import { useUndoKeyboard } from "@/hooks/useUndoKeyboard";
import { useCanvasStore } from "@/lib/store";
import { useVideoPipStore } from "@/lib/videoPipStore";

const CanvasSwitchOverlay = dynamic(
  () =>
    import("@/components/CanvasSwitchOverlay").then(
      (m) => m.CanvasSwitchOverlay,
    ),
  { ssr: false },
);

/**
 * The full canvas working area and its floating chrome. Lazy-loaded from the
 * app root so the Home screen doesn't pull the heavy canvas bundle into its
 * first compile / initial load. `onGoHome` returns to the Home grid.
 */
export function CanvasWorkspace({ onGoHome }: { onGoHome: () => void }) {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const canvasArtifactStyle = useCanvasStore((s) => s.canvasArtifactStyle);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const {
    activeCanvasId,
    isSwitchingCanvas,
    switchingCanvasId,
    switchingCanvasTitle,
  } = useAuth();
  const setLeftPanelCollapsed = useCanvasStore((s) => s.setLeftPanelCollapsed);
  useUndoKeyboard();
  useCanvasLayoutOutlineCache(activeCanvasId, isSwitchingCanvas);
  useCanvasSnapshotThumbnailCapture(canvasContainerRef);

  const canvasKey = activeCanvasId ?? "local";

  useEffect(() => {
    if (!isSwitchingCanvas) return;
    setLeftPanelCollapsed(true);
  }, [isSwitchingCanvas, setLeftPanelCollapsed]);

  // Stop any floating video when the canvas changes — a session belongs to the
  // node on the canvas it started on, so it must not follow across switches.
  useEffect(() => {
    useVideoPipStore.getState().stop();
  }, [activeCanvasId]);

  return (
    <div className="relative h-full w-full">
      <div className="relative h-full w-full">
        {viewMode === "canvas" ? (
          // Style packs reach the canvas only; the floating UI below stays on brand.
          <ArtifactStyleScope styleId={canvasArtifactStyle}>
            <Canvas key={canvasKey} containerRef={canvasContainerRef} />
          </ArtifactStyleScope>
        ) : viewMode === "focus" ? (
          <>
            <FocusView key={canvasKey} />
            <CardAskOrchestrator />
          </>
        ) : (
          <>
            <ChatView key={canvasKey} />
            <CardAskOrchestrator />
          </>
        )}
        <CanvasSwitchOverlay
          visible={isSwitchingCanvas}
          canvasId={switchingCanvasId}
          canvasTitle={switchingCanvasTitle}
        />
      </div>
      <AppLeftPanel onGoHome={onGoHome} />
      <AppRightPanel />
      <div className="pointer-events-auto absolute bottom-5 left-3 z-30">
        <AdminPortalButton />
      </div>
      <ArtifactPanel />
      <ShareModal />
      <GuestWall />
      <CoachMarkTour />
      {viewMode === "canvas" && (
        <CanvasMinimap
          containerRef={canvasContainerRef}
          canvasKey={canvasKey}
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center">
        <CanvasBottomToolbar />
      </div>
      <McpApprovalDock />
      {viewMode === "canvas" && <CanvasVideoPlayerLayer />}
    </div>
  );
}
