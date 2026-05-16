"use client";

import { Canvas } from "@/components/Canvas";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ModelSelector } from "@/components/ModelSelector";

export default function Page() {
  return (
    <main className="fixed inset-0">
      <Canvas />
      <ArtifactPanel />
      <div className="pointer-events-none fixed top-4 right-4 z-50">
        <ModelSelector />
      </div>
    </main>
  );
}
