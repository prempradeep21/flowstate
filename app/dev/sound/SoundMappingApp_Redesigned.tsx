"use client";

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

// GRADIENT-HEAVY DESIGN WITH SOPHISTICATED COLOR BLENDING
// Smooth transitions, overlays, gradient text, and glowing effects
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; pill: string; gradient: string }> = {
  canvas: {
    // Ocean blues - deep water to sky with smooth gradient transitions
    bg: "bg-gradient-to-br from-blue-700/45 via-cyan-600/30 to-teal-500/35 hover:from-blue-600/50 hover:via-cyan-500/35 hover:to-teal-400/40 transition-all duration-500 ease-out",
    text: "bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 bg-clip-text text-transparent dark:from-cyan-300 dark:via-blue-300 dark:to-cyan-200 font-semibold",
    border: "border-transparent bg-gradient-to-r from-cyan-500/80 via-blue-400/60 to-teal-400/80 p-[1px] rounded-canvas",
    pill: "bg-gradient-to-r from-cyan-100 to-blue-100 text-blue-800 dark:from-cyan-900/70 dark:to-blue-900/60 dark:text-cyan-200 shadow-xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all duration-300",
    gradient: "from-blue-600 via-cyan-500 to-teal-400",
  },
  branch: {
    // Forest greens - rich earth to sage with dynamic blending
    bg: "bg-gradient-to-br from-green-700/45 via-emerald-600/30 to-teal-600/35 hover:from-green-600/50 hover:via-emerald-500/35 hover:to-teal-500/40 transition-all duration-500 ease-out",
    text: "bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent dark:from-emerald-300 dark:via-green-300 dark:to-teal-200 font-semibold",
    border: "border-transparent bg-gradient-to-r from-emerald-500/80 via-green-400/60 to-teal-400/80 p-[1px] rounded-canvas",
    pill: "bg-gradient-to-r from-emerald-100 to-green-100 text-green-800 dark:from-emerald-900/70 dark:to-green-900/60 dark:text-emerald-200 shadow-xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all duration-300",
    gradient: "from-green-600 via-emerald-500 to-teal-500",
  },
  artifact: {
    // Sunset oranges & warm terracottas with vibrant blending
    bg: "bg-gradient-to-br from-orange-600/45 via-amber-500/30 to-red-500/35 hover:from-orange-500/50 hover:via-amber-400/35 hover:to-red-400/40 transition-all duration-500 ease-out",
    text: "bg-gradient-to-r from-orange-600 via-amber-500 to-red-500 bg-clip-text text-transparent dark:from-orange-300 dark:via-amber-300 dark:to-red-300 font-semibold",
    border: "border-transparent bg-gradient-to-r from-orange-500/80 via-amber-400/60 to-red-400/80 p-[1px] rounded-canvas",
    pill: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 dark:from-orange-900/70 dark:to-amber-900/60 dark:text-orange-200 shadow-xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all duration-300",
    gradient: "from-orange-600 via-amber-500 to-red-500",
  },
  agent: {
    // Clay browns & earth tones with warm transitions
    bg: "bg-gradient-to-br from-amber-700/45 via-yellow-600/30 to-orange-600/35 hover:from-amber-600/50 hover:via-yellow-500/35 hover:to-orange-500/40 transition-all duration-500 ease-out",
    text: "bg-gradient-to-r from-amber-700 via-yellow-600 to-orange-600 bg-clip-text text-transparent dark:from-amber-300 dark:via-yellow-300 dark:to-orange-300 font-semibold",
    border: "border-transparent bg-gradient-to-r from-amber-600/80 via-yellow-500/60 to-orange-500/80 p-[1px] rounded-canvas",
    pill: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 dark:from-amber-900/70 dark:to-yellow-900/60 dark:text-amber-200 shadow-xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all duration-300",
    gradient: "from-amber-700 via-yellow-600 to-orange-600",
  },
  history: {
    // Warm terracotta & clay with smooth color blending
    bg: "bg-gradient-to-br from-rose-700/45 via-orange-600/30 to-amber-600/35 hover:from-rose-600/50 hover:via-orange-500/35 hover:to-amber-500/40 transition-all duration-500 ease-out",
    text: "bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-rose-300 dark:via-orange-300 dark:to-amber-300 font-semibold",
    border: "border-transparent bg-gradient-to-r from-rose-500/80 via-orange-400/60 to-amber-400/80 p-[1px] rounded-canvas",
    pill: "bg-gradient-to-r from-rose-100 to-orange-100 text-rose-800 dark:from-rose-900/70 dark:to-orange-900/60 dark:text-rose-200 shadow-xl shadow-rose-500/40 hover:shadow-rose-500/60 transition-all duration-300",
    gradient: "from-rose-600 via-orange-600 to-amber-600",
  },
};

const CATEGORY_EMOJI: Record<string, string> = {
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
        // Create gradient for active waveform
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.9)");
        gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.8)");
        gradient.addColorStop(1, "rgba(34, 197, 94, 0.9)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
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
        // Gradient for inactive waveform
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, "rgba(180, 140, 100, 0.2)");
        gradient.addColorStop(1, "rgba(200, 160, 120, 0.15)");

        ctx.strokeStyle = gradient;
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
      className="rounded border border-gradient-to-r from-slate-300/50 to-slate-200/50 bg-gradient-to-br from-slate-100/80 to-slate-50/80 dark:from-slate-800/60 dark:to-slate-900/70 dark:border-slate-700/50"
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
    <div className="flex items-center gap-3 rounded-canvas border border-transparent bg-gradient-to-r from-slate-200/60 to-slate-100/60 dark:from-slate-800/50 dark:to-slate-900/40 p-3 hover:from-slate-200/80 hover:to-slate-100/80 dark:hover:from-slate-800/70 dark:hover:to-slate-900/60 transition-all duration-300 hover:shadow-lg hover:shadow-slate-400/20 dark:hover:shadow-slate-600/30">
      <button
        onClick={handlePlay}
        disabled={isPlaying}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-canvas border border-transparent bg-gradient-to-br from-blue-500/80 to-cyan-500/80 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-blue-500/40 text-white"
      >
        <span className="text-sm">{isPlaying ? "⏸" : "▶"}</span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-canvas-compact font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-200 dark:to-slate-100 bg-clip-text text-transparent">{chain.name}</p>
        <p className="text-canvas-micro text-slate-600 dark:text-slate-400 truncate">{chain.description}</p>
      </div>
      <WaveformVisualizer isPlaying={isPlaying} height={32} />
    </div>
  );
}

function EventDragHandle({
  eventId,
  onDragStart,
  onDragEnd,
}: {
  eventId: SoundEventId;
  onDragStart: (eventId: SoundEventId, e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(eventId, e)}
      onDragEnd={onDragEnd}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded cursor-grab active:cursor-grabbing border border-dashed border-slate-400/60 dark:border-slate-600/60 hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300"
      title="Drag to reorder"
    >
      <span className="text-slate-500 dark:text-slate-500 text-sm">⋮⋮</span>
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
        className="rounded-canvas border border-slate-300/70 dark:border-slate-600/70 px-3 py-1.5 text-canvas-compact font-medium text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-200/60 hover:to-slate-100/60 dark:hover:from-slate-800/50 dark:hover:to-slate-900/50 transition-all duration-300"
      >
        📤 Share/Import
      </button>

      {showShare && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-canvas border border-slate-300/70 dark:border-slate-600/70 bg-gradient-to-br from-slate-50/95 to-white/95 dark:from-slate-900/95 dark:to-slate-950/95 shadow-2xl shadow-slate-400/30 dark:shadow-slate-600/40 p-3 min-w-48 backdrop-blur-sm">
          <div className="space-y-2">
            <button
              onClick={onExport}
              className="w-full rounded-canvas bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-canvas-compact text-slate-900 dark:text-slate-100 p-2 transition-all duration-300 text-left border border-blue-400/30 hover:border-blue-400/50"
            >
              📥 Export as JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-canvas bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-canvas-compact text-slate-900 dark:text-slate-100 p-2 transition-all duration-300 text-left border border-emerald-400/30 hover:border-emerald-400/50"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/40 via-slate-800/35 to-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-canvas border border-transparent bg-gradient-to-br from-slate-100/95 to-white/95 dark:from-slate-900/95 dark:to-slate-950/95 p-6 shadow-2xl shadow-slate-400/50 dark:shadow-slate-700/60 animate-in zoom-in-95">
        <h2 className="text-canvas-body font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-300 dark:to-blue-300 bg-clip-text text-transparent mb-4">🎵 A/B Sound Comparison</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-canvas-compact font-medium text-slate-900 dark:text-slate-100 mb-2">
              Sound A
            </label>
            <select
              value={soundA ?? ""}
              onChange={(e) => setSoundA((e.target.value as SoundEventId) || null)}
              className="w-full rounded-canvas border border-blue-400/50 dark:border-blue-600/50 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/50 dark:to-cyan-900/50 px-2 py-1.5 text-canvas-compact text-slate-900 dark:text-slate-100"
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
              className="w-full mt-2 rounded-canvas border border-transparent bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 disabled:opacity-50 text-white px-3 py-1.5 text-canvas-compact font-medium transition-all duration-300 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60"
            >
              {playingA ? "Playing…" : "▶ Play A"}
            </button>
          </div>

          <div>
            <label className="block text-canvas-compact font-medium text-slate-900 dark:text-slate-100 mb-2">
              Sound B
            </label>
            <select
              value={soundB ?? ""}
              onChange={(e) => setSoundB((e.target.value as SoundEventId) || null)}
              className="w-full rounded-canvas border border-orange-400/50 dark:border-orange-600/50 bg-gradient-to-br from-orange-100/80 to-amber-100/80 dark:from-orange-900/50 dark:to-amber-900/50 px-2 py-1.5 text-canvas-compact text-slate-900 dark:text-slate-100"
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
              className="w-full mt-2 rounded-canvas border border-transparent bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:via-amber-700 hover:to-orange-700 disabled:opacity-50 text-white px-3 py-1.5 text-canvas-compact font-medium transition-all duration-300 shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60"
            >
              {playingB ? "Playing…" : "▶ Play B"}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-canvas border border-slate-400/50 dark:border-slate-600/50 px-3 py-1.5 text-canvas-compact text-slate-900 dark:text-slate-100 hover:bg-gradient-to-r hover:from-slate-200/60 hover:to-slate-100/60 dark:hover:from-slate-800/50 dark:hover:to-slate-900/50 transition-all duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SPECIMEN DEMO
// ============================================================================

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

export function SoundMappingApp({ embedded = false }: { embedded?: boolean }) {
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
  const [eventOrder, setEventOrder] = useState<SoundEventId[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<SoundEventId | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [savedPresets, setSavedPresets] = useState<PresetData[]>([]);
  const [playingChainEvent, setPlayingChainEvent] = useState<SoundEventId | null>(null);
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

    const initialOrder = SOUND_EVENTS.map((e) => e.id);
    setEventOrder(initialOrder);

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
    const orderedEvents = [...SOUND_EVENTS].sort((a, b) => {
      const aIndex = eventOrder.indexOf(a.id);
      const bIndex = eventOrder.indexOf(b.id);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    for (const event of orderedEvents) {
      const list = groups.get(event.category) ?? [];
      list.push(event);
      groups.set(event.category, list);
    }
    return groups;
  }, [eventOrder]);

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

  const handleDragStart = (eventId: SoundEventId, e: React.DragEvent) => {
    setDraggedEvent(eventId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetId: SoundEventId, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedEvent || draggedEvent === targetId) return;

    const draggedIndex = eventOrder.indexOf(draggedEvent);
    const targetIndex = eventOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...eventOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedEvent);
    setEventOrder(newOrder);
  };

  const handleReset = () => {
    clearDraftSoundMap();
    setDraftMap({ ...DEFAULT_SOUND_MAP });
    resetSoundMap();
    setEventOrder(SOUND_EVENTS.map((e) => e.id));
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
      <div className="flex min-h-[50vh] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 px-6 text-canvas-body-sm text-slate-500 dark:text-slate-400">
        Loading sound mappings…
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 via-slate-950 dark:to-slate-900 text-canvas-ink">
      <header className="sticky top-0 z-40 border-b border-gradient-to-r from-slate-300/50 via-slate-200/50 to-slate-300/50 dark:from-slate-700/50 dark:via-slate-600/50 dark:to-slate-700/50 bg-gradient-to-br from-white/80 via-slate-50/80 to-white/80 dark:from-slate-900/80 dark:via-slate-950/80 dark:to-slate-900/80 px-6 py-4 backdrop-blur-md shadow-lg shadow-slate-400/10 dark:shadow-slate-700/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          {!embedded ? (
            <div>
              <h1 className="text-canvas-title font-semibold bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-slate-100 dark:via-blue-300 dark:to-slate-100 bg-clip-text text-transparent flex items-center gap-2">
                🎚️ Professional Sound Mixer
              </h1>
              <p className="mt-1 max-w-3xl text-canvas-body-sm text-slate-600 dark:text-slate-400">
                Map seslen presets to UI interactions with waveform visualization, A/B testing,
                drag-and-drop reordering, sound chains, and preset sharing. Then finalize to update production.
              </p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-canvas border border-slate-400/60 dark:border-slate-600/60 px-3 py-1.5 text-canvas-compact font-medium text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-200/70 hover:to-slate-100/70 dark:hover:from-slate-800/60 dark:hover:to-slate-900/60 transition-all duration-300"
              >
                Reset all
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="rounded-canvas border border-slate-400/60 dark:border-slate-600/60 px-3 py-1.5 text-canvas-compact font-medium text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-200/70 hover:to-slate-100/70 dark:hover:from-slate-800/60 dark:hover:to-slate-900/60 transition-all duration-300"
              >
                Copy config
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-canvas border border-slate-400/60 dark:border-slate-600/60 px-3 py-1.5 text-canvas-compact font-medium text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-200/70 hover:to-slate-100/70 dark:hover:from-slate-800/60 dark:hover:to-slate-900/60 transition-all duration-300"
              >
                Download
              </button>
              <PresetSharing onExport={handleExportPreset} onImport={handleImportPreset} />
              <button
                type="button"
                onClick={() => setComparisonMode(true)}
                className="rounded-canvas border border-slate-400/60 dark:border-slate-600/60 px-3 py-1.5 text-canvas-compact font-medium text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-200/70 hover:to-slate-100/70 dark:hover:from-slate-800/60 dark:hover:to-slate-900/60 transition-all duration-300"
              >
                A/B Test
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFinalizeOpen(true)}
              className="rounded-canvas border border-transparent bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-4 py-1.5 text-canvas-compact font-medium text-white transition-all duration-300 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60"
            >
              Finalize to product
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {statusMessage && (
          <div className="mb-6 rounded-canvas border border-gradient-to-r from-emerald-500/50 to-teal-500/50 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 p-4 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-emerald-500/20">
            <p className="text-canvas-compact text-emerald-800 dark:text-emerald-200 font-medium">{statusMessage}</p>
          </div>
        )}

        {/* Global Controls */}
        <section className="mb-8 rounded-canvas border border-gradient-to-r from-slate-300/50 to-slate-200/50 dark:from-slate-700/50 dark:to-slate-600/50 bg-gradient-to-br from-white/70 via-slate-50/70 to-white/70 dark:from-slate-900/70 dark:via-slate-950/70 dark:to-slate-900/70 p-6 shadow-lg shadow-slate-400/10 dark:shadow-slate-700/20">
          <h2 className="mb-4 text-canvas-body font-semibold bg-gradient-to-r from-slate-900 to-cyan-700 dark:from-slate-100 dark:to-cyan-300 bg-clip-text text-transparent flex items-center gap-2">
            🎛️ Global controls
          </h2>
          <div className="space-y-4">
            <div>
              <label className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-canvas-compact font-medium text-slate-900 dark:text-slate-100">Master volume</span>
                  <span className="text-canvas-body font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent tabular-nums">
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
                    className="h-2 flex-1 cursor-pointer rounded-full appearance-none bg-gradient-to-r from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-600"
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
                <span className="text-canvas-compact font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  Mute all sounds
                </span>
              </label>
              <div className={`text-canvas-compact ${reducedMotion ? "bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent font-medium" : "text-slate-600 dark:text-slate-400"}`}>
                Reduced motion: {reducedMotion ? "enabled (auto-mutes sounds)" : "disabled"}
              </div>
            </div>
          </div>
        </section>

        {/* Sound Chains - Quick Play Combos */}
        <section className="mb-8 rounded-canvas border border-gradient-to-r from-amber-500/50 to-orange-500/50 bg-gradient-to-br from-amber-600/20 via-orange-500/15 to-yellow-500/20 dark:from-amber-900/40 dark:via-orange-900/30 dark:to-yellow-900/40 p-6 shadow-lg shadow-amber-500/20 dark:shadow-amber-700/30">
          <h2 className="mb-4 text-canvas-body font-semibold bg-gradient-to-r from-amber-700 to-orange-600 dark:from-amber-300 dark:to-orange-300 bg-clip-text text-transparent flex items-center gap-2">
            ⚡ Sound Chains
          </h2>
          <p className="text-canvas-compact text-amber-800/80 dark:text-amber-200/80 mb-4 font-medium">
            Quick-play curated sound combinations to test interaction flows
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {DEFAULT_CHAINS.map((chain) => (
              <SoundChainPlayer key={chain.id} chain={chain} onPlay={handlePlayChain} />
            ))}
          </div>
        </section>

        {/* Sound Events by Category */}
        {[...groupedEvents.entries()].map(([category, events]) => (
          <section key={category} className={`mb-10 rounded-canvas border border-transparent bg-gradient-to-br ${CATEGORY_COLORS[category]?.bg || ""} p-6 shadow-lg shadow-slate-400/15 dark:shadow-slate-700/25 transition-all duration-500`}>
            <h2 className={`mb-4 text-canvas-body font-semibold flex items-center gap-2 ${CATEGORY_COLORS[category]?.text || ""}`}>
              {CATEGORY_EMOJI[category]} {CATEGORY_LABELS[category as SoundEventCategory] ?? category}
            </h2>
            <div className="space-y-3">
              {events.map((event) => (
                <article
                  key={event.id}
                  draggable
                  onDragStart={(e) => handleDragStart(event.id, e)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(event.id, e)}
                  className={`rounded-canvas border border-transparent bg-gradient-to-br from-white/80 via-slate-50/80 to-white/80 dark:from-slate-900/80 dark:via-slate-950/80 dark:to-slate-900/80 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-slate-400/25 dark:hover:shadow-slate-700/35 cursor-move group ${draggedEvent === event.id ? "opacity-50" : ""}`}
                >
                  <div className="flex gap-3">
                    <EventDragHandle
                      eventId={event.id}
                      onDragStart={handleDragStart}
                      onDragEnd={() => setDraggedEvent(null)}
                    />
                    <div className="flex-1 grid gap-4 lg:grid-cols-[1fr_320px]">
                      <div>
                        <h3 className="text-canvas-body-sm font-semibold text-slate-900 dark:text-slate-100">
                          {event.label}
                        </h3>
                        <p className="mt-1 text-canvas-compact text-slate-600 dark:text-slate-400">
                          {event.description}
                        </p>
                        <p className="mt-2 font-mono text-canvas-micro text-slate-500 dark:text-slate-500">
                          {event.id}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="mb-2 text-canvas-micro font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
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
                  <div className="mt-4 border-t border-gradient-to-r from-slate-300/50 to-slate-200/50 dark:from-slate-700/50 dark:to-slate-600/50 pt-4">
                    <button
                      type="button"
                      onClick={() => toggleSpecimen(event.id)}
                      aria-expanded={expandedSpecimens.has(event.id)}
                      className="mb-3 flex w-full items-center justify-between gap-2 rounded-canvas border border-transparent bg-gradient-to-r from-slate-200/60 to-slate-100/60 dark:from-slate-800/60 dark:to-slate-900/60 px-3 py-2 text-left text-canvas-compact font-medium text-slate-900 dark:text-slate-100 transition-all duration-300 hover:from-slate-200/80 hover:to-slate-100/80 dark:hover:from-slate-800/80 dark:hover:to-slate-900/80 hover:shadow-md hover:shadow-slate-400/20 dark:hover:shadow-slate-700/30"
                    >
                      <span>🎬 Try this interaction</span>
                      <span className="text-slate-500 dark:text-slate-500" aria-hidden>{expandedSpecimens.has(event.id) ? "▼" : "▶"}</span>
                    </button>
                    {expandedSpecimens.has(event.id) ? (
                      <div className="rounded-canvas bg-gradient-to-br from-slate-100/50 via-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:via-slate-950/50 dark:to-slate-900/50 p-3 border border-dashed border-slate-300/40 dark:border-slate-700/40">
                        <SpecimenDemo eventId={event.id} onTrigger={handleTrigger} />
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Finalize Dialog */}
      {finalizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/40 via-slate-800/35 to-slate-900/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-labelledby="finalize-title"
            className="w-full max-w-md rounded-canvas border border-transparent bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-950/95 dark:to-slate-900/95 p-5 shadow-2xl shadow-slate-400/50 dark:shadow-slate-700/60 animate-in zoom-in-95"
          >
            <h2 id="finalize-title" className="text-canvas-body font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">
              Finalize sound mapping?
            </h2>
            <p className="mt-2 text-canvas-compact text-slate-700 dark:text-slate-300">
              This writes your draft to{" "}
              <code className="font-mono text-slate-900 dark:text-slate-100 bg-slate-200/70 dark:bg-slate-800/70 px-1 py-0.5 rounded">lib/sounds/registry.ts</code> on disk.
              Restart is not required — the active map updates immediately.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFinalizeOpen(false)}
                className="rounded-canvas border border-slate-400/60 dark:border-slate-600/60 px-3 py-1.5 text-canvas-compact text-slate-900 dark:text-slate-100 hover:bg-gradient-to-r hover:from-slate-200/70 hover:to-slate-100/70 dark:hover:from-slate-800/60 dark:hover:to-slate-900/60 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleFinalize()}
                className="rounded-canvas border border-transparent bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-3 py-1.5 text-canvas-compact font-medium text-white transition-all duration-300 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60"
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
