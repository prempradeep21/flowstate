"use client";

import { Landing2Nav } from "@/components/landing2/Landing2Nav";
import { Landing2ProgressRail } from "@/components/landing2/Landing2ProgressRail";
import { ArtifactOrbitScene } from "@/components/landing2/scenes/ArtifactOrbitScene";
import { CanvasBreakScene } from "@/components/landing2/scenes/CanvasBreakScene";
import { ChatTrapScene } from "@/components/landing2/scenes/ChatTrapScene";
import { FinaleScene } from "@/components/landing2/scenes/FinaleScene";
import { InputsScene } from "@/components/landing2/scenes/InputsScene";
import { PrologueScene } from "@/components/landing2/scenes/PrologueScene";
import { ShareScene } from "@/components/landing2/scenes/ShareScene";
import { ThreePainsScene } from "@/components/landing2/scenes/ThreePainsScene";

export function Landing2Story() {
  return (
    <main>
      <PrologueScene />
      <ChatTrapScene />
      <ThreePainsScene />
      <CanvasBreakScene />
      <ArtifactOrbitScene />
      <InputsScene />
      <ShareScene />
      <FinaleScene />
    </main>
  );
}
