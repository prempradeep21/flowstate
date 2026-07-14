"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { AppLeftPanel } from "@/components/AppLeftPanel";
import { AppRightPanel } from "@/components/AppRightPanel";
import { Canvas } from "@/components/Canvas";
import { CanvasMinimap } from "@/components/CanvasMinimap";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ChatView } from "@/components/ChatView";
import { FocusView } from "@/components/FocusView";
import { CardAskOrchestrator } from "@/components/CardAskOrchestrator";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { CanvasVideoPlayerLayer } from "@/components/CanvasVideoPlayerLayer";
import { CoachMarkTour } from "@/components/onboarding/CoachMarkTour";
import { ShareModal } from "@/components/ShareModal";
import { useAuth } from "@/components/AuthProvider";
import { useUndoKeyboard } from "@/hooks/useUndoKeyboard";
import { useCanvasStore } from "@/lib/store";
import { useVideoPipStore } from "@/lib/videoPipStore";

const CanvasSwitchOverlay = dynamic(
  () =>
    import("@/components/CanvasSwitchOverlay").then((m) => m.CanvasSwitchOverlay),
  { ssr: false },
);

/**
 * The full canvas working area and its floating chrome. Lazy-loaded from the
 * app root so the Home screen doesn't pull the heavy canvas bundle into its
 * first compile / initial load. `onGoHome` returns to the Home grid.
 */
export function CanvasWorkspace({ onGoHome }: { onGoHome: () => void }) {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const { activeCanvasId, isSwitchingCanvas, switchingCanvasTitle } = useAuth();
  const setLeftPanelCollapsed = useCanvasStore((s) => s.setLeftPanelCollapsed);
  useUndoKeyboard();

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
          <Canvas key={canvasKey} containerRef={canvasContainerRef} />
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
          canvasTitle={switchingCanvasTitle}
        />

      </div>
      <AppLeftPanel onGoHome={onGoHome} />
      <AppRightPanel />
      <ArtifactPanel />
      <ShareModal />
      <CoachMarkTour />
      {viewMode === "canvas" && (
        <CanvasMinimap containerRef={canvasContainerRef} canvasKey={canvasKey} />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center">
        <CanvasBottomToolbar />
      </div>
      {viewMode === "canvas" && <CanvasVideoPlayerLayer />}
    </div>
  );
}
