"use client";

import { Canvas } from "@/components/Canvas";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ModelSelector } from "@/components/ModelSelector";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { UsageBadge } from "@/components/UsageBadge";

export default function Page() {
  return (
    <main className="fixed inset-0">
      <ApiKeyGate>
        <Canvas />
        <ArtifactPanel />
        <div className="pointer-events-none fixed top-4 right-4 z-50 flex items-center gap-2">
          <UsageBadge />
          <ModelSelector />
        </div>
      </ApiKeyGate>
    </main>
  );
}
