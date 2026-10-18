"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { HomeView } from "@/components/home/HomeView";
import { ThemeApplier } from "@/components/ThemeApplier";

const CanvasWorkspace = dynamic(
  () => import("@/components/CanvasWorkspace").then((m) => m.CanvasWorkspace),
  { ssr: false },
);

export default function Page() {
  const [screen, setScreen] = useState<"home" | "canvas">("home");

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ThemeApplier />
      {screen === "home" ? (
        <HomeView onOpenCanvas={() => setScreen("canvas")} />
      ) : (
        <CanvasWorkspace onGoHome={() => setScreen("home")} />
      )}
    </main>
  );
}
