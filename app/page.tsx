"use client";

import { AppLeftPanel } from "@/components/AppLeftPanel";
import { AuthButton } from "@/components/AuthButton";
import { Canvas } from "@/components/Canvas";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ChatView } from "@/components/ChatView";
import { SaveStatusBadge } from "@/components/SaveStatusBadge";
import { UndoButton } from "@/components/UndoButton";
import { UsageBadge } from "@/components/UsageBadge";
import { useUndoKeyboard } from "@/hooks/useUndoKeyboard";
import { useCanvasStore } from "@/lib/store";

export default function Page() {
  const viewMode = useCanvasStore((s) => s.viewMode);
  useUndoKeyboard();

  return (
    <main className="flex h-full w-full overflow-hidden">
      <AppLeftPanel />
      <div className="relative min-w-0 flex-1">
        {viewMode === "canvas" ? <Canvas /> : <ChatView />}
        <ArtifactPanel />
        <div className="pointer-events-none absolute top-4 right-4 z-50 flex items-center gap-2">
          <SaveStatusBadge />
          <AuthButton />
          <UsageBadge />
          <UndoButton />
        </div>
      </div>
    </main>
  );
}
