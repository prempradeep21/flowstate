"use client";

import { Canvas } from "@/components/Canvas";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ChatView } from "@/components/ChatView";
import { ModelSelector } from "@/components/ModelSelector";
import { UndoButton } from "@/components/UndoButton";
import { UsageBadge } from "@/components/UsageBadge";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { useUndoKeyboard } from "@/hooks/useUndoKeyboard";
import { useCanvasStore } from "@/lib/store";

export default function Page() {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const openGroupArtifactId = useCanvasStore((s) => s.openGroupArtifactId);
  useUndoKeyboard();

  return (
    <main className="fixed inset-0">
      {viewMode === "canvas" ? <Canvas /> : <ChatView />}
      <ArtifactPanel />
      <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <UsageBadge />
          <UndoButton />
          <ViewModeToggle />
        </div>
        {!openGroupArtifactId && <ModelSelector />}
      </div>
    </main>
  );
}
