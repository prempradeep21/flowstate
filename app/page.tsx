"use client";

import { useRef } from "react";
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

export default function Page() {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const { activeCanvasId } = useAuth();
  useUndoKeyboard();

  const canvasKey = activeCanvasId ?? "local";

  return (
    <main className="relative h-full w-full overflow-hidden">
      <div className="relative h-full w-full">
        {viewMode === "canvas" ? (
          <Canvas key={canvasKey} containerRef={canvasContainerRef} />
        ) : (
          <ChatView key={canvasKey} />
        )}
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
