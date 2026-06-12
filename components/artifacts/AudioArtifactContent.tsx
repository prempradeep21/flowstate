"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import {
  AUDIO_WAVEFORM_HEIGHT_PX,
  audioArtifactContentFloors,
  formatAudioDuration,
  waveformContentWidthPx,
} from "@/lib/audioArtifact";

function WaveformBars({
  peaks,
  widthPx,
  heightPx,
  progress = 0,
  interactive = false,
  onSeek,
}: {
  peaks: number[];
  widthPx: number;
  heightPx: number;
  progress?: number;
  interactive?: boolean;
  onSeek?: (ratio: number) => void;
}) {
  const barWidth = peaks.length > 0 ? widthPx / peaks.length : widthPx;
  const midY = heightPx / 2;

  const handlePointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!interactive || !onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(ratio);
  };

  return (
    <svg
      width={widthPx}
      height={heightPx}
      viewBox={`0 0 ${widthPx} ${heightPx}`}
      className={`block shrink-0 ${interactive ? "cursor-pointer" : ""}`}
      role={interactive ? "slider" : "img"}
      aria-label="Audio waveform"
      onPointerDown={handlePointer}
    >
      {peaks.map((peak, i) => {
        const barH = Math.max(2, peak * (heightPx - 8));
        const x = i * barWidth;
        const played = (i + 1) / peaks.length <= progress;
        return (
          <rect
            key={i}
            x={x + barWidth * 0.15}
            y={midY - barH / 2}
            width={Math.max(1, barWidth * 0.7)}
            height={barH}
            rx={barWidth * 0.2}
            className={played ? "fill-canvas-accent" : "fill-canvas-muted/50"}
          />
        );
      })}
    </svg>
  );
}

export function AudioArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  allowInteraction = false,
  artifactId,
  showControls = true,
}: {
  payload: Extract<ArtifactPayload, { type: "audio" }>;
  fill?: boolean;
  sidebar?: boolean;
  allowInteraction?: boolean;
  artifactId?: string;
  showControls?: boolean;
}) {
  const { peaks, durationMs, publicUrl } = payload.data;
  const waveformWidth = sidebar
    ? 200
    : waveformContentWidthPx(durationMs);
  const waveformHeight = sidebar ? 48 : AUDIO_WAVEFORM_HEIGHT_PX;
  const durationLabel = formatAudioDuration(durationMs);
  const contentFloors = audioArtifactContentFloors(durationMs);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setProgress(0);
    setPlaying(false);
  }, [publicUrl]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress(audio.currentTime / audio.duration);
  }, []);

  const seekToRatio = useCallback(
    (ratio: number) => {
      const audio = audioRef.current;
      if (!audio || !allowInteraction) return;
      audio.currentTime = ratio * (audio.duration || durationMs / 1000);
      setProgress(ratio);
    },
    [allowInteraction, durationMs],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !allowInteraction) return;
    if (audio.paused) {
      void audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, [allowInteraction]);

  const body = (
    <div
      className={`flex shrink-0 flex-col ${sidebar ? "gap-1 p-2" : "gap-2 p-3"}`}
      style={
        fill && !sidebar
          ? {
              minWidth: contentFloors.minWidth,
              minHeight: contentFloors.minHeight,
            }
          : undefined
      }
      data-no-drag={allowInteraction ? true : undefined}
    >
      {!sidebar && (
        <div className="flex items-center justify-between gap-2 text-canvas-caption text-canvas-muted">
          <span className="truncate">{payload.title}</span>
          <span className="shrink-0 tabular-nums">{durationLabel}</span>
        </div>
      )}
      {sidebar && (
        <div className="flex items-center justify-between gap-2 text-canvas-micro text-canvas-muted">
          <span className="truncate">{payload.title}</span>
          <span className="shrink-0 tabular-nums">{durationLabel}</span>
        </div>
      )}
      <div
        className={`overflow-x-auto ${sidebar ? "" : "rounded-canvas-sm bg-canvas-bg/40"}`}
      >
        <WaveformBars
          peaks={peaks}
          widthPx={waveformWidth}
          heightPx={waveformHeight}
          progress={progress}
          interactive={allowInteraction}
          onSeek={seekToRatio}
        />
      </div>
      {allowInteraction && publicUrl ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-no-drag
            className="rounded-canvas-sm bg-canvas-bg px-2 py-1 text-canvas-caption text-canvas-ink hover:bg-canvas-border/30"
            onClick={togglePlay}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <audio
            ref={audioRef}
            src={publicUrl}
            preload="metadata"
            className="hidden"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              setPlaying(false);
              setProgress(0);
            }}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          />
        </div>
      ) : null}
    </div>
  );

  if (sidebar) {
    return (
      <ArtifactContentStage
        artifactId={artifactId}
        fill={fill}
        showControls={false}
        className="min-h-0"
      >
        {body}
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage
      artifactId={artifactId}
      fill={fill}
      showControls={showControls}
      className={fill ? "flex min-h-0 flex-col" : "min-h-0"}
    >
      {body}
    </ArtifactContentStage>
  );
}
