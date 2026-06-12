"use client";

import { LandingNav } from "@/components/landing-page/LandingNav";
import { LandingSoundControl } from "@/components/landing-page/shared/LandingSoundControl";
import { ArtifactsSection } from "@/components/landing-page/sections/ArtifactsSection";
import { CtaSection } from "@/components/landing-page/sections/CtaSection";
import { HeroSection } from "@/components/landing-page/sections/HeroSection";
import { HowItWorksSection } from "@/components/landing-page/sections/HowItWorksSection";
import { InputsSection } from "@/components/landing-page/sections/InputsSection";
import { ProblemSection } from "@/components/landing-page/sections/ProblemSection";
import { VisionSection } from "@/components/landing-page/sections/VisionSection";

export function LandingPageApp() {
  return (
    <div className="font-sans text-canvas-ink">
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <VisionSection />
        <HowItWorksSection />
        <ArtifactsSection />
        <InputsSection />
        <CtaSection />
      </main>
      <footer className="border-t border-canvas-border/60 px-6 py-12 text-center">
        <p className="text-canvas-caption text-canvas-muted">
          Flowstate — your spatial thinking canvas
        </p>
      </footer>
      <LandingSoundControl />
    </div>
  );
}
