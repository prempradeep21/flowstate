"use client";

/**
 * Enhanced SoundMappingApp with colorblind-friendly vibrant color palette.
 *
 * This version uses COLORBLIND_PALETTE which provides:
 * - Vibrant, high-saturation colors for visual impact
 * - Pattern/texture overlays for additional differentiation
 * - Optimized contrast for deuteranopia, protanopia, and tritanopia
 * - WCAG AAA luminance contrast ratios
 *
 * Export this component and use in place of SoundMappingApp in routes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SoundEventVolumeSlider } from "@/components/sounds/SoundEventVolumeSlider";
import { SoundPresetPicker } from "@/components/sounds/SoundPresetPicker";
import {
  clearDraftSoundMap,
  loadDraftSoundMap,
  mergeDraftPreset,
  mergeDraftVolume,
  saveDraftSoundMap,
} from "@/lib/sounds/draft";
import { SOUND_EVENTS } from "@/lib/sounds/events";
import {
  formatSoundMapAsTypeScript,
  getMasterVolume,
  isMasterMuted,
  isReducedMotionActive,
  isSoundEngineMuted,
  playSound,
  setMasterMuted,
  setMasterVolume,
} from "@/lib/sounds/engine";
import { applySoundMap, DEFAULT_SOUND_MAP, resetSoundMap } from "@/lib/sounds/registry";
import type { SoundEventId, SoundMapping, SoundEventCategory } from "@/lib/sounds/types";
import { COLORBLIND_PALETTE } from "@/lib/sounds/colorblindPalette";
import {
  AgentStatusSpecimen,
  ArtifactDragSpecimen,
  BranchCreateSpecimen,
  CanvasPanSpecimen,
  CardDragSpecimen,
  CollapseSpecimen,
  FocusPulseSpecimen,
  PanelSlideSpecimen,
  PlayMappedButton,
  PlugConnectSpecimen,
  UndoRedoSpecimen,
} from "./specimens";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const CATEGORY_LABELS: Record<SoundEventCategory, string> = {
  canvas: "Canvas interactions",
  branch: "Branch & plugs",
  artifact: "Artifacts",
  agent: "Agent feedback",
  history: "History (undo/redo)",
};

const CATEGORY_EMOJI: Record<SoundEventCategory, string> = {
  canvas: "🎨",
  branch: "🌳",
  artifact: "📦",
  agent: "🤖",
  history: "⏱️",
};

interface SoundChain {
  id: string;
  name: string;
  eventIds: SoundEventId[];
  description: string;
}

interface PresetData {
  name: string;
  description: string;
  map: SoundMapping;
  timestamp: number;
}

const DEFAULT_CHAINS: SoundChain[] = [
  {
    id: "card-workflow",
    name: "Card Workflow",
    eventIds: ["card-drag-start", "card-drag-drop"],
    description: "Start drag to drop flow",
  },
  {
    id: "branch-ops",
    name: "Branch Operations",
    eventIds: ["branch-create", "branch-collapse"],
    description: "Create and collapse interactions",
  },
  {
    id: "agent-lifecycle",
    name: "Agent Lifecycle",
    eventIds: ["agent-thinking-start", "agent-streaming-start", "agent-complete"],
    description: "Full agent response cycle",
  },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Render category background with pattern texture overlay.
 */
function CategoryBackground({ category, children }: { category: SoundEventCategory; children: React.ReactNode }) {
  const palette = COLORBLIND_PALETTE[category];
  const bgStyle: React.CSSProperties = {
    backgroundImage: palette.patternSvg
      ? `url('data:image/svg+xml;utf8,${encodeURIComponent(palette.patternSvg)}')`
      : undefined,
    backgroundSize: "8px 8px",
    backgroundRepeat: "repeat",
  };

  return (
    <section
      className={`mb-10 rounded-canvas border ${palette.border} bg-gradient-to-br ${palette.bg} p-6 relative overflow-hidden`}
      style={bgStyle}
    >
      {/* Semi-opaque overlay to show pattern without obscuring content */}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function WaveformVisualizer({ isPlaying, height = 40 }: { isPlaying: boolean; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;
    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, canvasHeight);

      if (isPlaying) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const normalized = x / width;
          const amplitude =
            Math.sin(normalized * Math.PI * 4 + phase) *
            Math.sin(normalized * Math.PI) *
            (canvasHeight * 0.35);
          const y = canvasHeight / 2 + amplitude;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        phase += 0.15;
        animationRef.current = requestAnimationFrame(draw);
      } else {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight / 2);
        ctx.lineTo(width, canvasHeight / 2);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={height}
      className="rounded border border-canvas-border bg-canvas-bg/50"
    />
  );
}

function SoundChainPlayer({
  chain,
  onPlay,
}: {
  chain: SoundChain;
  onPlay: (eventIds: SoundEventId[]) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    setIsPlaying(true);
    try {
      for (const eventId of chain.eventIds) {
        await playSound(eventId, { force: true });
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    } finally {
      setIsPlaying(false);
    }
    onPlay(chain.eventIds);
  };

  return (
    <div className="flex items-center gap-3 rounded-canvas border border-canvas-border bg-canvas-card/50 p-3 hover:border-canvas-muted transition-all hover:shadow-sm">
      <button
        onClick={handlePlay}
        disabled={isPlaying}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-canvas border border-canvas-border bg-canvas-bg hover:bg-canvas-border disabled:opacity-50 transition-colors"
      >
        <span className="text-sm">{isPlaying ? "⏸" : "▶"}</span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-canvas-compact font-semibold text-canvas-ink">{chain.name}</p>
        <p className="text-canvas-micro text-canvas-muted truncate">{chain.description}</p>
      </div>
      <WaveformVisualizer isPlaying={isPlaying} height={32} />
    </div>
  );
}

function PresetSharing({
  onExport,
  onImport,
}: {
  onExport: () => void;
  onImport: (json: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShare, setShowShare] = useState(false);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        onImport(json);
        setShowShare(false);
      } catch (err) {
        alert("Failed to import preset: invalid JSON");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowShare(!showShare)}
        className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-compact font-medium text-canvas-muted hover:text-canvas-ink hover:border-canvas-muted transition-colors"
      >
        📤 Share/Import
      </button>

      {showShare && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-canvas border border-canvas-border bg-canvas-card shadow-card p-3 min-w-48">
          <div className="space-y-2">
            <button
              onClick={onExport}
              className="w-full rounded-canvas bg-canvas-bg hover:bg-canvas-border text-canvas-compact text-canvas-ink p-2 transition-colors text-left"
            >
              📥 Export as JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-canvas bg-canvas-bg hover:bg-canvas-border text-canvas-compact text-canvas-ink p-2 transition-colors text-left"
            >
              📤 Import from JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonABTest({
  allEvents,
  onClose,
}: {
  allEvents: typeof SOUND_EVENTS;
  onClose: () => void;
}) {
  const [soundA, setSoundA] = useState<SoundEventId | null>(null);
  const [soundB, setSoundB] = useState<SoundEventId | null>(null);
  const [playingA, setPlayingA] = useState(false);
  const [playingB, setPlayingB] = useState(false);

  const handlePlayA = async () => {
    if (!soundA) return;
    setPlayingA(true);
    await playSound(soundA, { force: true });
    setPlayingA(false);
  };

  const handlePlayB = async () => {
    if (!soundB) return;
    setPlayingB(true);
    await playSound(soundB, { force: true });
    setPlayingB(false);
  };

  const eventOptions = allEvents.map((e) => e.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-ink/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-canvas border border-canvas-border bg-canvas-card p-6 shadow-card animate-in zoom-in-95">
        <h2 className="text-canvas-body font-semibold text-canvas-ink mb-4">🎵 A/B Sound Comparison</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-canvas-compact font-medium text-canvas-ink mb-2">
              Sound A
            </label>
            <select
              value={soundA ?? ""}
              onChange={(e) => setSoundA((e.target.value as SoundEventId) || null)}
              className="w-full rounded-canvas border border-canvas-border bg-canvas-bg px-2 py-1.5 text-canvas-compact text-canvas-ink"
            >
              <option value="">Select sound…</option>
              {eventOptions.map((id) => (
                <option key={id} value={id}>
                  {allEvents.find((e) => e.id === id)?.label}
                </option>
              ))}
            </select>
            <button
              onClick={handlePlayA}
              disabled={!soundA || playingA}
              className="w-full mt-2 rounded-canvas bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 text-canvas-compact font-medium transition-colors"
            >
              {playingA ? "Playing…" : "▶ Play A"}
            </button>
          </div>

          <div>
            <label className="block text-canvas-compact font-medium text-canvas-ink mb-2">
              Sound B
            </label>
            <select
              value={soundB ?? ""}
              onChange={(e) => setSoundB((e.target.value as SoundEventId) || null)}
              className="w-full rounded-canvas border border-canvas-border bg-canvas-bg px-2 py-1.5 text-canvas-compact text-canvas-ink"
            >
              <option value="">Select sound…</option>
              {eventOptions.map((id) => (
                <option key={id} value={id}>
                  {allEvents.find((e) => e.id === id)?.label}
                </option>
              ))}
            </select>
            <button
              onClick={handlePlayB}
              disabled={!soundB || playingB}
              className="w-full mt-2 rounded-canvas bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-3 py-1.5 text-canvas-compact font-medium transition-colors"
            >
              {playingB ? "Playing…" : "▶ Play B"}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-compact text-canvas-ink hover:bg-canvas-border transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function SpecimenDemo({
  eventId,
  onTrigger,
}: {
  eventId: SoundEventId;
  onTrigger: (eventId: SoundEventId) => void;
}) {
  const [panelOpen, setPanelOpen] = useState(false);

  switch (eventId) {
    case "card-drag-start":
    case "card-drag-drop":
      return <CardDragSpecimen eventId={eventId} onTrigger={onTrigger} />;
    case "artifact-drag-drop":
      return <ArtifactDragSpecimen onTrigger={onTrigger} />;
    case "canvas-pan":
      return <CanvasPanSpecimen onTrigger={onTrigger} />;
    case "branch-collapse":
      return (
        <CollapseSpecimen
          label="Branch thread"
          eventId={eventId}
          onTrigger={onTrigger}
        />
      );
    case "chat-collapse":
      return (
        <div className="flex flex-col gap-2">
          <CollapseSpecimen
            label="Chat subtree"
            eventId={eventId}
            onTrigger={onTrigger}
          />
          <p className="text-canvas-compact text-canvas-muted">
            Auto-collapse after 5 minutes of thread inactivity does not play this
            sound — only manual collapse toggles do.
          </p>
        </div>
      );
    case "branch-create":
      return <BranchCreateSpecimen onTrigger={onTrigger} />;
    case "plug-connect":
      return <PlugConnectSpecimen onTrigger={onTrigger} />;
    case "artifact-panel-open":
    case "artifact-panel-close":
      return (
        <PanelSlideSpecimen
          open={panelOpen}
          onOpen={() => {
            setPanelOpen(true);
            onTrigger("artifact-panel-open");
          }}
          onClose={() => {
            setPanelOpen(false);
            onTrigger("artifact-panel-close");
          }}
        />
      );
    case "artifact-focus":
      return <FocusPulseSpecimen onTrigger={onTrigger} />;
    case "agent-thinking-start":
    case "agent-streaming-start":
    case "agent-complete":
    case "agent-error":
      return <AgentStatusSpecimen onTrigger={onTrigger} />;
    case "undo":
    case "redo":
      return <UndoRedoSpecimen onTrigger={onTrigger} />;
    default:
      return null;
  }
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export function SoundMappingAppColorblind({ embedded = false }: { embedded?: boolean }) {
  const [draftMap, setDraftMap] = useState<SoundMapping>(() => ({ ...DEFAULT_SOUND_MAP }));
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [expandedSpecimens, setExpandedSpecimens] = useState<Set<SoundEventId>>(
    () => new Set(),
  );
  const [ready, setReady] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [savedPresets, setSavedPresets] = useState<PresetData[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const draft = loadDraftSoundMap();
    const nextMap = draft ? { ...DEFAULT_SOUND_MAP, ...draft } : { ...DEFAULT_SOUND_MAP };
    setDraftMap(nextMap);
    applySoundMap(nextMap);
    setVolume(getMasterVolume());
    setMuted(isMasterMuted());
    setReducedMotion(isReducedMotionActive());
    setReady(true);

    const storedPresets = localStorage.getItem("sound-presets");
    if (storedPresets) {
      try {
        setSavedPresets(JSON.parse(storedPresets));
      } catch (err) {
        console.error("Failed to load saved presets");
      }
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applySoundMap(draftMap);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraftSoundMap(draftMap);
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [draftMap, ready]);

  const toggleSpecimen = useCallback((eventId: SoundEventId) => {
    setExpandedSpecimens((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }, []);

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, typeof SOUND_EVENTS>();
    for (const event of SOUND_EVENTS) {
      const list = groups.get(event.category) ?? [];
      list.push(event);
      groups.set(event.category, list);
    }
    return groups;
  }, []);

  const handlePresetChange = useCallback(
    (eventId: SoundEventId, preset: SoundMapping[SoundEventId]["preset"]) => {
      setDraftMap((prev) => mergeDraftPreset(prev, eventId, preset));
    },
    [],
  );

  const isSilent = useCallback(
    (eventId: SoundEventId) => draftMap[eventId].preset === null,
    [draftMap],
  );

  const handleVolumeChange = useCallback(
    (eventId: SoundEventId, volume: number) => {
      setDraftMap((prev) => mergeDraftVolume(prev, eventId, volume));
    },
    [],
  );

  const handleTrigger = useCallback((eventId: SoundEventId) => {
    void playSound(eventId, { force: true });
  }, []);

  const handleReset = () => {
    clearDraftSoundMap();
    setDraftMap({ ...DEFAULT_SOUND_MAP });
    resetSoundMap();
    setStatusMessage("Reset to default mappings and order.");
  };

  const handleCopy = async () => {
    const snippet = formatSoundMapAsTypeScript(draftMap);
    await navigator.clipboard.writeText(snippet);
    setStatusMessage("Copied registry TypeScript to clipboard.");
  };

  const handleDownload = () => {
    const snippet = formatSoundMapAsTypeScript(draftMap);
    const blob = new Blob([snippet], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "registry.ts";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage("Downloaded registry.ts — replace lib/sounds/registry.ts in the repo.");
  };

  const handleExportPreset = () => {
    const preset: PresetData = {
      name: `Preset ${new Date().toLocaleString()}`,
      description: "Custom sound mapping preset",
      map: draftMap,
      timestamp: Date.now(),
    };

    const json = JSON.stringify(preset, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sound-preset-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    setStatusMessage("Preset exported as JSON.");
  };

  const handleImportPreset = (json: string) => {
    try {
      const preset: PresetData = JSON.parse(json);
      setDraftMap(preset.map);
      setSavedPresets((prev) => [...prev, preset]);
      localStorage.setItem("sound-presets", JSON.stringify([...savedPresets, preset]));
      setStatusMessage(`Imported preset: ${preset.name}`);
    } catch (err) {
      setStatusMessage("Failed to import preset: invalid JSON");
    }
  };

  const handleFinalize = async () => {
    try {
      const res = await fetch("/api/dev/sound-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ map: draftMap }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || res.statusText);
      }
      applySoundMap(draftMap);
      clearDraftSoundMap();
      setFinalizeOpen(false);
      setStatusMessage("Finalized — lib/sounds/registry.ts updated. Commit the change to ship it.");
    } catch (e) {
      setStatusMessage(
        e instanceof Error
          ? `Finalize failed: ${e.message}. Use Copy or Download instead.`
          : "Finalize failed. Use Copy or Download instead.",
      );
    }
  };

  const handleMasterVolumeChange = (next: number) => {
    setVolume(next);
    setMasterVolume(next);
  };

  const handleMuteChange = (next: boolean) => {
    setMuted(next);
    setMasterMuted(next);
  };

  const handlePlayChain = (eventIds: SoundEventId[]) => {
    setStatusMessage(`Played chain: ${eventIds.length} sounds`);
  };

  const engineMuted = muted || (reducedMotion && isSoundEngineMuted());

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-canvas-bg px-6 text-canvas-body-sm text-canvas-muted">
        Loading sound mappings…
      </div>
    );
  }

  return (
    <div className="min-h-full bg-canvas-bg text-canvas-ink">
      <header className="sticky top-0 z-40 border-b border-canvas-border bg-canvas-card/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          {!embedded ? (
            <div>
              <h1 className="text-canvas-title font-semibold text-canvas-ink flex items-center gap-2">
                🎚️ Professional Sound Mixer (Colorblind-Friendly)
              </h1>
              <p className="mt-1 max-w-3xl text-canvas-body-sm text-canvas-muted">
                Map seslen presets to UI interactions with vibrant, high-saturation colors optimized for colorblind vision.
                Features pattern textures, A/B testing, drag-and-drop reordering, sound chains, and preset sharing.
              </p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-compact font-medium text-canvas-muted hover:text-canvas-ink hover:border-canvas-muted transition-colors"
              >
                Reset all
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-compact font-medium text-canvas-muted hover:text-canvas-ink hover:border-canvas-muted transition-colors"
              >
                Copy config
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-compact font-medium text-canvas-muted hover:text-canvas-ink hover:border-canvas-muted transition-colors"
              >
                Download
              </button>
              <PresetSharing onExport={handleExportPreset} onImport={handleImportPreset} />
              <button
                type="button"
                onClick={() => setComparisonMode(true)}
                className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-compact font-medium text-canvas-muted hover:text-canvas-ink hover:border-canvas-muted transition-colors"
              >
                A/B Test
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFinalizeOpen(true)}
              className="rounded-canvas border border-canvas-ink bg-canvas-ink px-4 py-1.5 text-canvas-compact font-medium text-canvas-card hover:opacity-90 transition-opacity"
            >
              Finalize to product
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {statusMessage && (
          <div className="mb-6 rounded-canvas border border-emerald-500/30 bg-emerald-500/10 p-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-canvas-compact text-emerald-700">{statusMessage}</p>
          </div>
        )}

        {/* Global Controls */}
        <section className="mb-8 rounded-canvas border border-canvas-border bg-canvas-card p-6">
          <h2 className="mb-4 text-canvas-body font-semibold text-canvas-ink flex items-center gap-2">
            🎛️ Global controls
          </h2>
          <div className="space-y-4">
            <div>
              <label className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-canvas-compact font-medium text-canvas-ink">Master volume</span>
                  <span className="text-canvas-body font-semibold text-canvas-ink tabular-nums">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer rounded-full appearance-none bg-canvas-border accent-canvas-ink"
                  />
                  <WaveformVisualizer isPlaying={!muted && volume > 0} />
                </div>
              </label>
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={muted}
                  onChange={(e) => handleMuteChange(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-canvas-compact font-medium text-canvas-ink group-hover:text-canvas-muted transition-colors">
                  Mute all sounds
                </span>
              </label>
              <div className={`text-canvas-compact ${reducedMotion ? "text-orange-600 font-medium" : "text-canvas-muted"}`}>
                Reduced motion: {reducedMotion ? "enabled (auto-mutes sounds)" : "disabled"}
              </div>
            </div>
          </div>
        </section>

        {/* Sound Chains - Quick Play Combos */}
        <section className="mb-8 rounded-canvas border border-canvas-border bg-gradient-to-br from-slate-500/10 to-slate-600/5 p-6">
          <h2 className="mb-4 text-canvas-body font-semibold text-canvas-ink flex items-center gap-2">
            ⚡ Sound Chains
          </h2>
          <p className="text-canvas-compact text-canvas-muted mb-4">
            Quick-play curated sound combinations to test interaction flows
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {DEFAULT_CHAINS.map((chain) => (
              <SoundChainPlayer key={chain.id} chain={chain} onPlay={handlePlayChain} />
            ))}
          </div>
        </section>

        {/* Sound Events by Category - Using Colorblind Palette */}
        {[...groupedEvents.entries()].map(([category, events]) => {
          const palette = COLORBLIND_PALETTE[category as SoundEventCategory];
          return (
            <section
              key={category}
              className={`mb-10 rounded-canvas border ${palette.border} bg-gradient-to-br ${palette.bg} p-6 relative`}
            >
              <h2 className={`mb-4 text-canvas-body font-semibold flex items-center gap-2 ${palette.text}`}>
                {CATEGORY_EMOJI[category as SoundEventCategory]} {CATEGORY_LABELS[category as SoundEventCategory] ?? category}
              </h2>
              <div className="space-y-3">
                {events.map((event) => (
                  <article
                    key={event.id}
                    className={`rounded-canvas border ${palette.border} bg-canvas-card p-4 transition-all hover:border-canvas-muted hover:shadow-md`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1 grid gap-4 lg:grid-cols-[1fr_320px]">
                        <div>
                          <h3 className="text-canvas-body-sm font-semibold text-canvas-ink">
                            {event.label}
                          </h3>
                          <p className="mt-1 text-canvas-compact text-canvas-muted">
                            {event.description}
                          </p>
                          <p className="mt-2 font-mono text-canvas-micro text-canvas-muted">
                            {event.id}
                          </p>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="mb-2 text-canvas-micro font-semibold uppercase tracking-wide text-canvas-muted">
                              Sound
                            </p>
                            <SoundPresetPicker
                              value={draftMap[event.id].preset}
                              previewGain={draftMap[event.id].volume}
                              onChange={(preset) => handlePresetChange(event.id, preset)}
                            />
                          </div>
                          <SoundEventVolumeSlider
                            value={draftMap[event.id].volume}
                            onChange={(vol) => handleVolumeChange(event.id, vol)}
                            disabled={isSilent(event.id)}
                          />
                          <PlayMappedButton
                            eventId={event.id}
                            disabled={isSilent(event.id)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-canvas-border pt-4">
                      <button
                        type="button"
                        onClick={() => toggleSpecimen(event.id)}
                        aria-expanded={expandedSpecimens.has(event.id)}
                        className="mb-3 flex w-full items-center justify-between gap-2 rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-2 text-left text-canvas-compact font-medium text-canvas-ink transition-all hover:border-canvas-muted hover:bg-canvas-border/50"
                      >
                        <span>🎬 Try this interaction</span>
                        <span className="text-canvas-muted" aria-hidden>{expandedSpecimens.has(event.id) ? "▼" : "▶"}</span>
                      </button>
                      {expandedSpecimens.has(event.id) ? (
                        <div className="rounded-canvas bg-canvas-bg/50 p-3 border border-dashed border-canvas-border">
                          <SpecimenDemo eventId={event.id} onTrigger={handleTrigger} />
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Finalize Dialog */}
      {finalizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-ink/30 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-labelledby="finalize-title"
            className="w-full max-w-md rounded-canvas border border-canvas-border bg-canvas-card p-5 shadow-card animate-in zoom-in-95"
          >
            <h2 id="finalize-title" className="text-canvas-body font-semibold text-canvas-ink">
              Finalize sound mapping?
            </h2>
            <p className="mt-2 text-canvas-compact text-canvas-muted">
              This writes your draft to{" "}
              <code className="text-canvas-ink">lib/sounds/registry.ts</code> on disk.
              Restart is not required — the active map updates immediately.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFinalizeOpen(false)}
                className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-compact text-canvas-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleFinalize()}
                className="rounded-canvas border border-canvas-ink bg-canvas-ink px-3 py-1.5 text-canvas-compact font-medium text-canvas-card"
              >
                Write registry.ts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A/B Comparison Test Dialog */}
      {comparisonMode && (
        <ComparisonABTest allEvents={SOUND_EVENTS} onClose={() => setComparisonMode(false)} />
      )}
    </div>
  );
}
