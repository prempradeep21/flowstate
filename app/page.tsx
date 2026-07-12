"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { HomeView } from "@/components/home/HomeView";
import { ThemeApplier } from "@/components/ThemeApplier";
import { ArtifactStyleScope } from "@/components/ArtifactStyleScope";
import { useCanvasStore } from "@/lib/store";

const CanvasWorkspace = dynamic(
  () => import("@/components/CanvasWorkspace").then((m) => m.CanvasWorkspace),
  { ssr: false },
);

export default function Page() {
  const [screen, setScreen] = useState<"home" | "canvas">("home");
  const canvasArtifactStyle = useCanvasStore((s) => s.canvasArtifactStyle);

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ThemeApplier />
      {screen === "home" ? (
        <HomeView onOpenCanvas={() => setScreen("canvas")} />
      ) : (
        <ArtifactStyleScope styleId={canvasArtifactStyle}>
          <CanvasWorkspace onGoHome={() => setScreen("home")} />
        </ArtifactStyleScope>
      )}
    </main>
  );
}
