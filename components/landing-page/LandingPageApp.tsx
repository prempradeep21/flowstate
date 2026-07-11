"use client";

import { LandingFooter } from "@/components/landing-page/LandingFooter";
import { LandingNav } from "@/components/landing-page/LandingNav";
import { LandingSoundControl } from "@/components/landing-page/shared/LandingSoundControl";
import { ArtifactsSection } from "@/components/landing-page/sections/ArtifactsSection";
import { InputsSection } from "@/components/landing-page/sections/InputsSection";
import { LandingCanvasHeroSection } from "@/components/landing-page/sections/LandingCanvasHeroSection";
import { UseCasesSection } from "@/components/landing-page/sections/UseCasesSection";

export function LandingPageApp() {
  return (
    <div className="font-sans text-canvas-ink">
      <LandingNav />
      <main>
        <LandingCanvasHeroSection />
        <ArtifactsSection />
        <InputsSection />
        <UseCasesSection />
      </main>
      <LandingFooter />
      <LandingSoundControl />
    </div>
  );
}
