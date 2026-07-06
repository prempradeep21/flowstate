"use client";

import type { UIChartType } from "@/lib/chartTypes";
import {
  getStylesForUIChartType,
  UI_CHART_TYPE_LABELS,
  UI_CHART_TYPES,
} from "@/lib/chartStyles";
import type { TimelineScale } from "@/lib/artifactTypes";
import {
  ARTIFACT_FONT_SCALE_MAX,
  ARTIFACT_FONT_SCALE_MIN,
  stepArtifactFontScale,
} from "@/lib/artifactFontScale";
import {
  AUDIO_PLAYBACK_RATES,
  formatPlaybackRate,
  type AudioPlaybackRate,
} from "@/components/artifacts/AudioPlaybackControls";
import {
  artifactMenuFieldLabelClass,
  artifactMenuSelectClass,
  ArtifactNestedMenuSection,
} from "@/components/artifacts/ArtifactNestedMenu";

const stepperBtnClass =
  "flex h-8 w-8 items-center justify-center rounded-canvas-md border border-canvas-border bg-canvas-bg text-canvas-body leading-none text-canvas-ink transition-colors hover:bg-canvas-border/40 disabled:cursor-default disabled:opacity-35";

export function ArtifactMenuFontScaleRow({
  scale,
  onScaleChange,
}: {
  scale: number;
  onScaleChange: (scale: number) => void;
}) {
  const atMin = scale <= ARTIFACT_FONT_SCALE_MIN;
  const atMax = scale >= ARTIFACT_FONT_SCALE_MAX;

  return (
    <ArtifactNestedMenuSection title="Text size">
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Artifact text size"
        data-no-drag
      >
        <span
          className="flex h-8 w-10 shrink-0 items-center justify-center text-canvas-compact font-semibold text-canvas-muted"
          aria-hidden
        >
          Aa
        </span>
        <button
          type="button"
          disabled={atMin}
          onClick={() => onScaleChange(stepArtifactFontScale(scale, -1))}
          aria-label="Decrease text size"
          className={stepperBtnClass}
          data-no-drag
        >
          −
        </button>
        <button
          type="button"
          disabled={atMax}
          onClick={() => onScaleChange(stepArtifactFontScale(scale, 1))}
          aria-label="Increase text size"
          className={stepperBtnClass}
          data-no-drag
        >
          +
        </button>
      </div>
    </ArtifactNestedMenuSection>
  );
}

export function ArtifactMenuChartControls({
  chartType,
  styleId,
  compatibleTypes,
  onChartTypeChange,
  onStyleChange,
}: {
  chartType: UIChartType;
  styleId: string;
  compatibleTypes: UIChartType[];
  onChartTypeChange: (type: UIChartType) => void;
  onStyleChange: (styleId: string) => void;
}) {
  const styles = getStylesForUIChartType(chartType);

  return (
    <ArtifactNestedMenuSection title="Chart">
      <label className="block" data-no-drag>
        <span className={artifactMenuFieldLabelClass}>Type</span>
        <select
          value={chartType}
          onChange={(e) => onChartTypeChange(e.target.value as UIChartType)}
          className={artifactMenuSelectClass}
          data-no-drag
        >
          {UI_CHART_TYPES.map((t) => (
            <option
              key={t}
              value={t}
              disabled={!compatibleTypes.includes(t)}
            >
              {UI_CHART_TYPE_LABELS[t]}
              {!compatibleTypes.includes(t) ? " (needs data)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="block" data-no-drag>
        <span className={artifactMenuFieldLabelClass}>Style</span>
        <select
          value={styleId}
          onChange={(e) => onStyleChange(e.target.value)}
          className={artifactMenuSelectClass}
          data-no-drag
        >
          {styles.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </ArtifactNestedMenuSection>
  );
}

const TIMELINE_SCALE_OPTIONS: { value: TimelineScale; label: string }[] = [
  { value: "year", label: "Years" },
  { value: "month", label: "Months" },
  { value: "day", label: "Days" },
];

export function ArtifactMenuTimelineControls({
  scale,
  onScaleChange,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  disabled,
  zoomDisabled,
}: {
  scale: TimelineScale;
  onScaleChange: (scale: TimelineScale) => void;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  disabled?: boolean;
  zoomDisabled?: boolean;
}) {
  const zoomLocked = zoomDisabled ?? disabled;

  return (
    <>
      <ArtifactNestedMenuSection title="Timeline">
        <label className="block" data-no-drag>
          <span className={artifactMenuFieldLabelClass}>Time scale</span>
          <select
            value={scale}
            disabled={disabled}
            onChange={(e) => onScaleChange(e.target.value as TimelineScale)}
            className={artifactMenuSelectClass}
            data-no-drag
          >
            {TIMELINE_SCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </ArtifactNestedMenuSection>
      <ArtifactNestedMenuSection title="Zoom">
        <div className="flex items-center gap-2" data-no-drag>
          <button
            type="button"
            disabled={zoomLocked}
            onClick={onZoomOut}
            aria-label="Zoom out timeline"
            className={stepperBtnClass}
            data-no-drag
          >
            −
          </button>
          <span className="min-w-[3rem] flex-1 text-center text-canvas-body-sm tabular-nums text-canvas-muted">
            {zoomPercent}%
          </span>
          <button
            type="button"
            disabled={zoomLocked}
            onClick={onZoomIn}
            aria-label="Zoom in timeline"
            className={stepperBtnClass}
            data-no-drag
          >
            +
          </button>
        </div>
      </ArtifactNestedMenuSection>
    </>
  );
}

export function ArtifactMenuAudioSpeedRow({
  rate,
  onRateChange,
  disabled = false,
}: {
  rate: AudioPlaybackRate;
  onRateChange: (rate: AudioPlaybackRate) => void;
  disabled?: boolean;
}) {
  return (
    <ArtifactNestedMenuSection title="Playback">
      <label className="block" data-no-drag>
        <span className={artifactMenuFieldLabelClass}>Speed</span>
        <select
          value={rate}
          disabled={disabled}
          onChange={(e) =>
            onRateChange(Number(e.target.value) as AudioPlaybackRate)
          }
          className={`${artifactMenuSelectClass} tabular-nums`}
          data-no-drag
        >
          {AUDIO_PLAYBACK_RATES.map((option) => (
            <option key={option} value={option}>
              {formatPlaybackRate(option)}
            </option>
          ))}
        </select>
      </label>
    </ArtifactNestedMenuSection>
  );
}
