"use client";

import { AppLeftPanel } from "@/components/AppLeftPanel";
import { AppRightPanel } from "@/components/AppRightPanel";
import { AuthButton } from "@/components/AuthButton";
import { Canvas } from "@/components/Canvas";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ChatView } from "@/components/ChatView";
import { SaveStatusBadge } from "@/components/SaveStatusBadge";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { UndoButton } from "@/components/UndoButton";
import { UsageBadge } from "@/components/UsageBadge";
import { useAuth } from "@/components/AuthProvider";
import { useUndoKeyboard } from "@/hooks/useUndoKeyboard";
import { useCanvasStore } from "@/lib/store";

export default function Page() {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const { activeCanvasId } = useAuth();
  useUndoKeyboard();

  const canvasKey = activeCanvasId ?? "local";

  return (
    <main className="flex h-full w-full overflow-hidden">
      <AppLeftPanel />
      <div className="relative min-w-0 flex-1">
        {viewMode === "canvas" ? (
          <Canvas key={canvasKey} />
        ) : (
          <ChatView key={canvasKey} />
        )}
        <AppRightPanel />
        <ArtifactPanel />
        <div className="pointer-events-none absolute top-4 right-4 z-50 flex items-center gap-2">
          <SaveStatusBadge />
          <AuthButton />
          <UsageBadge />
          <UndoButton />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center">
          <CanvasBottomToolbar />
        </div>
      </div>
    </main>
  );
}
