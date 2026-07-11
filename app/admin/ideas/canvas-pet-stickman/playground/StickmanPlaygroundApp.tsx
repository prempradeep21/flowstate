"use client";

import { useCallback, useRef, useState } from "react";
import type { PetConfig, PetPose } from "@/lib/pet/types";
import { DesignControls } from "./DesignControls";
import { MotionControls } from "./MotionControls";
import { SampleCanvas } from "./SampleCanvas";
import type { SampleCanvasHandle } from "./SampleCanvas";
import "./stickman.css";

type Phase = "design" | "canvas";

const DEFAULT_CONFIG: PetConfig = {
  color: "#484744",
  size: 52,
};

export function StickmanPlaygroundApp() {
  const [phase, setPhase] = useState<Phase>("design");
  const [config, setConfig] = useState<PetConfig>(DEFAULT_CONFIG);
  const [pose, setPose] = useState<PetPose>("stand");
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showFootholds, setShowFootholds] = useState(false);

  // The engine reads speed from a ref so slider drags never re-render the pet.
  const speedRef = useRef(1);
  const canvasRef = useRef<SampleCanvasHandle | null>(null);

  const handleSpeedChange = useCallback((value: number) => {
    speedRef.current = value;
    setSpeed(value);
  }, []);

  const handleAutoChange = useCallback((enabled: boolean) => {
    setAuto(enabled);
    canvasRef.current?.commands.setAuto(enabled);
  }, []);

  return (
    <div className="mx-auto flex h-full max-w-[1100px] flex-col gap-4 overflow-y-auto p-4 sm:p-6">
      {/* Phase switcher */}
      <div className="flex items-center gap-1 self-start rounded-canvas border border-canvas-border bg-canvas-card p-1">
        {(
          [
            ["design", "1 · Design the stickman"],
            ["canvas", "2 · Sample canvas"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPhase(key)}
            className={
              phase === key
                ? "rounded-canvas-sm bg-canvas-accent px-3 py-1.5 text-canvas-body-sm font-medium text-white"
                : "rounded-canvas-sm px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-muted transition-colors hover:text-canvas-ink"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {phase === "design" ? (
        <DesignControls config={config} onChange={setConfig} />
      ) : (
        <div className="flex flex-col gap-3">
          <MotionControls
            pose={pose}
            auto={auto}
            speed={speed}
            showFootholds={showFootholds}
            disabled={auto}
            onRun={(d) => canvasRef.current?.commands.run(d)}
            onJump={(d) => canvasRef.current?.commands.jump(d)}
            onDance={() => canvasRef.current?.commands.dance()}
            onRest={() => canvasRef.current?.commands.rest()}
            onAutoChange={handleAutoChange}
            onSpeedChange={handleSpeedChange}
            onShowFootholdsChange={setShowFootholds}
          />
          <SampleCanvas
            ref={canvasRef}
            config={config}
            speedRef={speedRef}
            showFootholds={showFootholds}
            onPoseChange={setPose}
          />
          <p className="text-canvas-caption text-canvas-muted">
            The stickman knows every element&apos;s edges and width. Run takes
            it to the edge of its current foothold; Jump sprints to the edge
            and leaps a parabolic arc onto the neighbour. Auto hands control
            to a weighted-random brain — it wanders, dances, rests, and never
            walks off the ends.
          </p>
        </div>
      )}
    </div>
  );
}
