"use client";

import { LandingComposerInputDemo } from "@/components/landing-page/shared/LandingComposerInputDemo";
import { LANDING2_COPY } from "@/components/landing2/landing2Copy";
import {
  Landing2PinnedSection,
  Landing2SceneTitle,
} from "@/components/landing2/shared/Landing2PinnedSection";
import { Landing2EdgeBleed, Landing2SceneShell } from "@/components/landing2/shared/Landing2SceneShell";
import { LANDING2_ACCENTS, LANDING2_SCENE_WASH } from "@/lib/landing2/landing2Theme";
import { LANDING_COMPOSER_INPUTS } from "@/lib/landingComposerInputs";
import { playSound } from "@/lib/sounds/engine";
import { useState } from "react";
import { m, useTransform, type MotionValue } from "framer-motion";

function InputsContent({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const copy = LANDING2_COPY.inputs;
  const accent = LANDING2_SCENE_WASH.inputs.accent;
  const [activeId, setActiveId] = useState(LANDING_COMPOSER_INPUTS[0]!.id);
  const active = LANDING_COMPOSER_INPUTS.find((i) => i.id === activeId)!;
  const activeIndex = LANDING_COMPOSER_INPUTS.findIndex((i) => i.id === activeId);

  const opacity = useTransform(scrollYProgress, [0, 0.2], [0.5, 1]);

  return (
    <Landing2SceneShell sceneId="inputs">
      <m.div
        className="flex h-full w-full flex-col justify-center px-6 py-12 sm:px-12 lg:px-16"
        style={{ opacity }}
      >
        <Landing2SceneTitle
          variant="hero"
          eyebrow={copy.kicker}
          title={copy.headline}
          body={copy.body}
          accentColour={accent}
          className="max-w-2xl"
        />

        <Landing2EdgeBleed className="mt-10">
          <div className="flex gap-2 overflow-x-auto px-6 pb-2 sm:px-12 lg:px-16">
            {LANDING_COMPOSER_INPUTS.map((input, i) => {
              const chipAccent = LANDING2_ACCENTS[i % LANDING2_ACCENTS.length]!;
              const isActive = activeId === input.id;
              return (
                <button
                  key={input.id}
                  type="button"
                  onClick={() => {
                    setActiveId(input.id);
                    void playSound("plug-connect");
                  }}
                  className="shrink-0 rounded-full px-4 py-2 text-canvas-compact font-medium transition-transform hover:scale-105"
                  style={
                    isActive
                      ? { background: chipAccent, color: "#fff" }
                      : {
                          background: `${chipAccent}18`,
                          color: chipAccent,
                          border: `1px solid ${chipAccent}44`,
                        }
                  }
                >
                  {input.label}
                </button>
              );
            })}
          </div>
        </Landing2EdgeBleed>

        <div
          className="mt-6 rounded-canvas border p-6 shadow-artifact sm:p-8"
          style={{
            borderColor: `${LANDING2_ACCENTS[activeIndex % LANDING2_ACCENTS.length]}44`,
            background: `${LANDING2_ACCENTS[activeIndex % LANDING2_ACCENTS.length]}08`,
          }}
        >
          <p className="text-canvas-body-lg text-canvas-muted">{active.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <LandingComposerInputDemo input={active} />
          </div>
        </div>
      </m.div>
    </Landing2SceneShell>
  );
}

export function InputsScene() {
  return (
    <Landing2PinnedSection sceneId="inputs">
      {({ scrollYProgress }) => <InputsContent scrollYProgress={scrollYProgress} />}
    </Landing2PinnedSection>
  );
}
