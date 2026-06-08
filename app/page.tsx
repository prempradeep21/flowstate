"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { AppLeftPanel } from "@/components/AppLeftPanel";
import { AppRightPanel } from "@/components/AppRightPanel";
import { Canvas } from "@/components/Canvas";
import { CanvasMinimap } from "@/components/CanvasMinimap";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ChatView } from "@/components/ChatView";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { ShareModal } from "@/components/ShareModal";
import { useAuth } from "@/components/AuthProvider";
import { useUndoKeyboard } from "@/hooks/useUndoKeyboard";
import { useCanvasStore } from "@/lib/store";

const CanvasSwitchOverlay = dynamic(
  () =>
    import("@/components/CanvasSwitchOverlay").then((m) => m.CanvasSwitchOverlay),
  { ssr: false },
);
export default function Page() {
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

  return (
    <main className="relative h-full w-full overflow-hidden">
      <div className="relative h-full w-full">
        <div className="relative h-full w-full">
          {viewMode === "canvas" ? (
            <Canvas key={canvasKey} containerRef={canvasContainerRef} />
          ) : (
            <ChatView key={canvasKey} />
          )}
          {isSwitchingCanvas && (
            <CanvasSwitchOverlay
              visible={isSwitchingCanvas}
              canvasTitle={switchingCanvasTitle}
            />
          )}
        </div>
        <AppLeftPanel />
        <AppRightPanel />
        <ArtifactPanel />
        <ShareModal />
        {viewMode === "canvas" && (
          <CanvasMinimap containerRef={canvasContainerRef} />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center">
          <CanvasBottomToolbar />
        </div>
      </div>
    </main>
  );
}
