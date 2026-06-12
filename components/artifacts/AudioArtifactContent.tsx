"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import {
  AudioPlaybackControls,
  type AudioPlaybackRate,
} from "@/components/artifacts/AudioPlaybackControls";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import {
  AUDIO_WAVEFORM_HEIGHT_PX,
  audioArtifactContentFloors,
  formatAudioDuration,
  waveformContentWidthPx,
} from "@/lib/audioArtifact";

function PlayPauseIcon({ playing }: { playing: boolean }) {
  if (playing) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <rect x="3.5" y="3" width="3" height="10" rx="0.75" fill="currentColor" />
        <rect x="9.5" y="3" width="3" height="10" rx="0.75" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M5.5 3.2c0-.9 1-.4 1-.4l5.8 3.4c.6.4.6 1.2 0 1.6l-5.8 3.4s-1 .5-1-.4V3.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
    e.preventDefault();
    e.stopPropagation();
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
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      onPointerDown={handlePointer}
    >
      {peaks.map((peak, i) => {
        const barH = Math.max(2, peak * (heightPx - 10));
        const x = i * barWidth;
        const played = (i + 1) / peaks.length <= progress;
        return (
          <rect
            key={i}
            x={x + barWidth * 0.12}
            y={midY - barH / 2}
            width={Math.max(1, barWidth * 0.76)}
            height={barH}
            rx={Math.max(0.5, barWidth * 0.18)}
            className={
              played ? "fill-canvas-accent" : "fill-canvas-muted/35"
            }
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
  const wasPlayingBeforeSeekRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<AudioPlaybackRate>(1);

  const syncFromAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const duration = audio.duration;
    if (Number.isFinite(duration) && duration > 0) {
      setProgress(audio.currentTime / duration);
      setCurrentTimeMs(Math.round(audio.currentTime * 1000));
    }
    setPlaying(!audio.paused && !audio.ended);
  }, []);

  useEffect(() => {
    setProgress(0);
    setPlaying(false);
    setCurrentTimeMs(0);
    setPlaybackRate(1);
  }, [publicUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate, publicUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !publicUrl) return;

    const onTimeUpdate = () => syncFromAudio();
    const onPlay = () => syncFromAudio();
    const onPause = () => syncFromAudio();
    const onEnded = () => {
      audio.currentTime = 0;
      setProgress(0);
      setCurrentTimeMs(0);
      setPlaying(false);
    };
    const onLoadedMetadata = () => syncFromAudio();

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [publicUrl, syncFromAudio]);

  const togglePlay = useCallback(async () => {
    if (!allowInteraction) return;
    const audio = audioRef.current;
    if (!audio || !publicUrl) return;
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
      syncFromAudio();
    } catch {
      setPlaying(false);
    }
  }, [allowInteraction, publicUrl, syncFromAudio]);

  const seekToRatio = useCallback(
    (ratio: number) => {
      const audio = audioRef.current;
      if (!audio || !allowInteraction || !publicUrl) return;
      const duration = audio.duration || durationMs / 1000;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const nextTime = ratio * duration;
      audio.currentTime = nextTime;
      setProgress(ratio);
      setCurrentTimeMs(Math.round(nextTime * 1000));

      if (wasPlayingBeforeSeekRef.current) {
        void audio.play().catch(() => setPlaying(false));
      }
    },
    [allowInteraction, durationMs, publicUrl],
  );

  const handleWaveformPointerDown = useCallback(
    (ratio: number) => {
      const audio = audioRef.current;
      wasPlayingBeforeSeekRef.current = Boolean(
        audio && !audio.paused && !audio.ended,
      );
      seekToRatio(ratio);
    },
    [seekToRatio],
  );

  const elapsedLabel = formatAudioDuration(currentTimeMs);
  const canControl = allowInteraction && Boolean(publicUrl);

  const transportRow = (
    <div
      className={`flex min-w-0 items-stretch gap-3 ${
        sidebar ? "" : "rounded-canvas-sm border border-canvas-border/40 bg-canvas-bg/50 p-2"
      }`}
    >
      <button
        type="button"
        data-no-drag
        disabled={!canControl}
        aria-label={playing ? "Pause audio" : "Play audio"}
        onClick={() => void togglePlay()}
        className={`flex shrink-0 items-center justify-center self-center rounded-full transition-colors ${
          sidebar ? "h-8 w-8" : "h-11 w-11"
        } ${
          canControl
            ? playing
              ? "bg-canvas-accent text-white shadow-sm hover:bg-canvas-accent/90"
              : "bg-canvas-accent/15 text-canvas-accent hover:bg-canvas-accent/25"
            : "cursor-not-allowed bg-canvas-border/20 text-canvas-muted/50"
        }`}
      >
        <PlayPauseIcon playing={playing} />
      </button>

      <div className="min-w-0 flex-1 overflow-x-auto">
        <WaveformBars
          peaks={peaks}
          widthPx={waveformWidth}
          heightPx={waveformHeight}
          progress={progress}
          interactive={canControl}
          onSeek={handleWaveformPointerDown}
        />
      </div>
    </div>
  );

  const body = (
    <div
      className={`flex shrink-0 flex-col ${sidebar ? "gap-1.5 p-2" : "gap-2.5 p-3"}`}
      style={
        fill && !sidebar
          ? {
              minWidth: contentFloors.minWidth,
              minHeight: contentFloors.minHeight,
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-3 text-canvas-caption text-canvas-muted">
        <span className={`truncate ${sidebar ? "text-canvas-micro" : ""}`}>
          {payload.title}
        </span>
        <span className="shrink-0 tabular-nums text-canvas-ink/70">
          {elapsedLabel}
          <span className="text-canvas-muted/60"> / </span>
          {durationLabel}
        </span>
      </div>

      {transportRow}

      {publicUrl ? (
        <audio
          ref={audioRef}
          src={publicUrl}
          preload="auto"
          className="sr-only"
          playsInline
        />
      ) : (
        <p className="text-canvas-caption text-canvas-muted">
          Audio preview unavailable.
        </p>
      )}
    </div>
  );

  if (sidebar) {
    return (
      <ArtifactContentStage
        artifactId={artifactId}
        fill={fill}
        showControls={false}
        showFontControls={false}
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
      showFontControls={false}
      className={fill ? "flex min-h-0 flex-col" : "min-h-0"}
      controls={
        <AudioPlaybackControls
          rate={playbackRate}
          onRateChange={setPlaybackRate}
          disabled={!canControl}
        />
      }
    >
      {body}
    </ArtifactContentStage>
  );
}
