"use client";

import { AppLeftPanel } from "@/components/AppLeftPanel";
import { AppRightPanel } from "@/components/AppRightPanel";
import { Canvas } from "@/components/Canvas";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ChatView } from "@/components/ChatView";
import { CanvasBottomToolbar } from "@/components/CanvasBottomToolbar";
import { CollaboratorAvatarStack } from "@/components/CollaboratorAvatarStack";
import { ShareModal } from "@/components/ShareModal";
import { UsageBadge } from "@/components/UsageBadge";
import { useAuth } from "@/components/AuthProvider";
import { useUndoKeyboard } from "@/hooks/useUndoKeyboard";
import { useCanvasStore } from "@/lib/store";

export default function Page() {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const {
    activeCanvasId,
    members,
    onlineUserIds,
    setShareModalOpen,
  } = useAuth();
  useUndoKeyboard();

  const canvasKey = activeCanvasId ?? "local";

  return (
    <main className="relative h-full w-full overflow-hidden">
      <div className="relative h-full w-full">
        {viewMode === "canvas" ? (
          <Canvas key={canvasKey} />
        ) : (
          <ChatView key={canvasKey} />
        )}
        <AppLeftPanel />
        <AppRightPanel />
        <ArtifactPanel />
        <ShareModal />
        <div className="pointer-events-none absolute top-4 right-4 z-50 flex items-center gap-2">
          <CollaboratorAvatarStack
            members={members}
            onlineUserIds={onlineUserIds}
            onClick={() => setShareModalOpen(true)}
          />
          <UsageBadge />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center">
          <CanvasBottomToolbar />
        </div>
      </div>
    </main>
  );
}
