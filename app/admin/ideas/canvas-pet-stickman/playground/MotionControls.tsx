"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bed,
  Brain,
  Music,
  Redo2,
  Ruler,
  Undo2,
} from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import type { PetPose } from "@/lib/pet/types";

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-canvas-md border border-canvas-border bg-canvas-card px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:border-canvas-accent/40 disabled:cursor-not-allowed disabled:opacity-40";

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-canvas-md border border-canvas-accent bg-canvas-accent px-3 py-1.5 text-canvas-body-sm font-medium text-white transition-opacity hover:opacity-90"
          : buttonClass
      }
    >
      {children}
    </button>
  );
}

export function MotionControls({
  pose,
  auto,
  speed,
  showFootholds,
  disabled,
  onRun,
  onJump,
  onDance,
  onRest,
  onAutoChange,
  onSpeedChange,
  onShowFootholdsChange,
}: {
  pose: PetPose;
  auto: boolean;
  speed: number;
  showFootholds: boolean;
  /** Manual controls lock while Auto is driving. */
  disabled: boolean;
  onRun: (direction: -1 | 1) => void;
  onJump: (direction: -1 | 1) => void;
  onDance: () => void;
  onRest: () => void;
  onAutoChange: (enabled: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onShowFootholdsChange: (show: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-canvas border border-canvas-border bg-canvas-card p-3">
      <div className="flex items-center gap-2">
        <span className="text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted">
          Run
        </span>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled}
          onClick={() => onRun(-1)}
          title="Run to the left edge"
        >
          <Icon icon={ArrowLeft} size="inline" />
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled}
          onClick={() => onRun(1)}
          title="Run to the right edge"
        >
          <Icon icon={ArrowRight} size="inline" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted">
          Jump
        </span>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled}
          onClick={() => onJump(-1)}
          title="Jump to the element on the left"
        >
          <Icon icon={Undo2} size="inline" />
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled}
          onClick={() => onJump(1)}
          title="Jump to the element on the right"
        >
          <Icon icon={Redo2} size="inline" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={disabled}
          onClick={onDance}
        >
          <Icon icon={Music} size="inline" />
          Dance
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled}
          onClick={onRest}
        >
          <Icon icon={Bed} size="inline" />
          Rest
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted">
          Speed
        </span>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-28 accent-[rgb(var(--canvas-accent))]"
        />
        <span className="w-8 font-mono text-canvas-caption text-canvas-muted">
          {speed.toFixed(1)}×
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ToggleButton active={auto} onClick={() => onAutoChange(!auto)}>
          <Icon
            icon={Brain}
            size="inline"
            className={auto ? "text-white" : undefined}
          />
          Auto
        </ToggleButton>
        <ToggleButton
          active={showFootholds}
          onClick={() => onShowFootholdsChange(!showFootholds)}
        >
          <Icon
            icon={Ruler}
            size="inline"
            className={showFootholds ? "text-white" : undefined}
          />
          Footholds
        </ToggleButton>
        <span
          className="w-16 text-right font-mono text-canvas-caption text-canvas-muted"
          aria-live="polite"
        >
          {pose}
        </span>
      </div>
    </div>
  );
}
