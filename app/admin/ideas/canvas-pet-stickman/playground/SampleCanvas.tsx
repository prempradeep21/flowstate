"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  CalendarRange,
  FileText,
  Image as ImageIcon,
  MessageCircle,
} from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { sortFootholds } from "@/lib/pet/stickmanEngine";
import type { Foothold, PetConfig, PetPose } from "@/lib/pet/types";
import { StickmanFigure } from "./StickmanFigure";
import { useStickmanEngine } from "./useStickmanEngine";
import type { StickmanCommands } from "./useStickmanEngine";

/**
 * Mock canvas elements the stickman uses as footholds. Positions are
 * percentages of the stage width at varied heights so jumps go up AND down.
 * Order here is left→right; the engine re-sorts by measured centers anyway.
 */
const STAGE_ELEMENTS: {
  id: string;
  label: string;
  left: string; // CSS left %
  top: number; // px from stage top
  width: number;
  height: number;
  icon: typeof FileText;
  body: ReactNode;
}[] = [
  {
    id: "artifact",
    label: "Artifact",
    left: "2%",
    top: 200,
    width: 180,
    height: 130,
    icon: FileText,
    body: (
      <div className="space-y-1.5">
        <div className="h-2 w-4/5 rounded-full bg-canvas-border" />
        <div className="h-2 w-full rounded-full bg-canvas-border" />
        <div className="h-2 w-3/5 rounded-full bg-canvas-border" />
      </div>
    ),
  },
  {
    id: "chart",
    label: "Chart",
    left: "24%",
    top: 130,
    width: 160,
    height: 120,
    icon: BarChart3,
    body: (
      <div className="flex h-14 items-end gap-1.5">
        {[40, 70, 55, 90, 62, 78].map((h, i) => (
          <div
            key={i}
            className="w-4 rounded-t-sm bg-canvas-accent/60"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    ),
  },
  {
    id: "image",
    label: "Image asset",
    left: "44%",
    top: 250,
    width: 150,
    height: 110,
    icon: ImageIcon,
    body: (
      <div className="flex h-12 items-center justify-center rounded-canvas-sm bg-canvas-border/50">
        <Icon icon={ImageIcon} size="hero" className="text-canvas-muted" />
      </div>
    ),
  },
  {
    id: "timeline",
    label: "Timeline",
    left: "62%",
    top: 170,
    width: 210,
    height: 100,
    icon: CalendarRange,
    body: (
      <div className="relative mt-3 h-8">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-canvas-border" />
        {["12%", "38%", "64%", "88%"].map((l) => (
          <div
            key={l}
            className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-canvas-accent bg-canvas-card"
            style={{ left: l }}
          />
        ))}
      </div>
    ),
  },
  {
    id: "chat",
    label: "Chat",
    left: "87%",
    top: 280,
    width: 150,
    height: 90,
    icon: MessageCircle,
    body: (
      <p className="text-canvas-caption text-canvas-muted">
        Nice moves up there.
      </p>
    ),
  },
];

const STAGE_HEIGHT = 430;

export interface SampleCanvasHandle {
  commands: StickmanCommands;
}

export const SampleCanvas = forwardRef<
  SampleCanvasHandle,
  {
    config: PetConfig;
    speedRef: React.MutableRefObject<number>;
    showFootholds: boolean;
    onPoseChange?: (pose: PetPose) => void;
  }
>(function SampleCanvas({ config, speedRef, showFootholds, onPoseChange }, ref) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const petRef = useRef<HTMLDivElement | null>(null);
  const footholdsRef = useRef<Foothold[]>([]);
  // State copy exists ONLY for the debug overlay; motion reads the ref.
  const [debugFootholds, setDebugFootholds] = useState<Foothold[]>([]);

  const getFootholds = useCallback(() => footholdsRef.current, []);

  const commands = useStickmanEngine({
    petRef,
    getFootholds,
    size: config.size,
    speedRef,
    onPoseChange,
  });

  useImperativeHandle(ref, () => ({ commands }), [commands]);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const holds: Foothold[] = [];
    stage
      .querySelectorAll<HTMLElement>("[data-foothold]")
      .forEach((el) => {
        const rect = el.getBoundingClientRect();
        holds.push({
          id: el.dataset.foothold ?? "",
          left: rect.left - stageRect.left,
          right: rect.right - stageRect.left,
          surfaceY: rect.top - stageRect.top,
        });
      });
    footholdsRef.current = sortFootholds(holds);
    setDebugFootholds(footholdsRef.current);
  }, []);

  // Measure once on mount + whenever the stage resizes; re-seat the pet so
  // it never floats when percentage-positioned elements shift.
  useEffect(() => {
    measure();
    commands.reseat();
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => {
      measure();
      commands.reseat();
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [commands, measure, config.size]);

  return (
    <div
      ref={stageRef}
      className="relative w-full overflow-hidden rounded-canvas border border-canvas-border bg-canvas-bg"
      style={{
        height: STAGE_HEIGHT,
        backgroundImage:
          "radial-gradient(rgb(var(--canvas-dot) / 0.5) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {STAGE_ELEMENTS.map((el) => (
        <div
          key={el.id}
          data-foothold={el.id}
          className="absolute rounded-canvas border border-canvas-border bg-canvas-card p-3 shadow-artifact"
          style={{ left: el.left, top: el.top, width: el.width, height: el.height }}
        >
          <div className="mb-2 flex items-center gap-1.5 text-canvas-compact font-medium text-canvas-ink">
            <Icon icon={el.icon} size="inline" className="text-canvas-accent" />
            {el.label}
          </div>
          {el.body}
        </div>
      ))}

      {showFootholds
        ? debugFootholds.map((f) => (
            <div
              key={f.id}
              className="pointer-events-none absolute border-t-2 border-dashed border-canvas-accent"
              style={{
                left: f.left,
                width: f.right - f.left,
                top: f.surfaceY - 1,
              }}
            >
              <span className="absolute -top-5 left-0 rounded bg-canvas-accent px-1 text-[10px] font-medium text-white">
                {f.id}
              </span>
            </div>
          ))
        : null}

      {/* The pet: position + pose driven imperatively by the engine. */}
      <div ref={petRef} className="sm-pet" data-pose="stand" data-facing="1">
        <div className="sm-facing">
          <StickmanFigure color={config.color} size={config.size} />
        </div>
      </div>
    </div>
  );
});
