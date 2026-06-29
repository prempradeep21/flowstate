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
import type { SoundEventId, SoundMapping } from "@/lib/sounds/types";
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

const CATEGORY_LABELS: Record<string, string> = {
  canvas: "Canvas",
  branch: "Branch & plugs",
  artifact: "Artifacts",
  agent: "Agent",
  history: "History",
};

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

export function SoundMappingApp() {
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
    setStatusMessage("Reset to default mappings.");
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
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-canvas-title font-semibold text-canvas-ink">
              Flowstate sound mapping
            </h1>
            <p className="mt-1 max-w-2xl text-canvas-body-sm text-canvas-muted">
              Map seslen presets to UI interactions. Preview sounds from each dropdown,
              trigger specimens, then finalize to update the production registry.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-compact font-medium text-canvas-ink hover:border-canvas-muted"
            >
              Reset defaults
            </button>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-compact font-medium text-canvas-ink hover:border-canvas-muted"
            >
              Copy config
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-compact font-medium text-canvas-ink hover:border-canvas-muted"
            >
              Download registry.ts
            </button>
            <button
              type="button"
              onClick={() => setFinalizeOpen(true)}
              className="rounded-canvas border border-canvas-ink bg-canvas-ink px-3 py-1.5 text-canvas-compact font-medium text-canvas-card hover:opacity-90"
            >
              Finalize to product
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <section className="mb-8 rounded-canvas border border-canvas-border bg-canvas-card p-4">
          <h2 className="mb-3 text-canvas-body-sm font-semibold text-canvas-ink">
            Global controls
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex min-w-[200px] flex-1 items-center gap-3">
              <span className="text-canvas-compact text-canvas-muted">Master volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-canvas-compact tabular-nums text-canvas-ink">
                {Math.round(volume * 100)}
              </span>
            </label>
            <label className="flex items-center gap-2 text-canvas-compact text-canvas-ink">
              <input
                type="checkbox"
                checked={muted}
                onChange={(e) => handleMuteChange(e.target.checked)}
              />
              Mute
            </label>
            <span className="text-canvas-compact text-canvas-muted">
              Reduced motion: {reducedMotion ? "on (seslen auto-mutes)" : "off"}
              {engineMuted ? " · engine muted" : ""}
            </span>
          </div>
          {statusMessage && (
            <p className="mt-3 text-canvas-compact text-canvas-muted">{statusMessage}</p>
          )}
        </section>

        {[...groupedEvents.entries()].map(([category, events]) => (
          <section key={category} className="mb-10">
            <h2 className="mb-4 text-canvas-body font-semibold text-canvas-ink">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="grid gap-4">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="grid gap-4 rounded-canvas border border-canvas-border bg-canvas-card p-4 lg:grid-cols-[1fr_240px_1fr]"
                >
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
                  <div className="flex flex-col justify-center gap-2">
                    <span className="text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted">
                      Sound
                    </span>
                    <SoundPresetPicker
                      value={draftMap[event.id].preset}
                      previewGain={draftMap[event.id].volume}
                      onChange={(preset) => handlePresetChange(event.id, preset)}
                    />
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
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSpecimen(event.id)}
                      aria-expanded={expandedSpecimens.has(event.id)}
                      className="mb-2 flex w-full items-center justify-between gap-2 text-left text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted transition-colors hover:text-canvas-ink"
                    >
                      <span>Try it</span>
                      <span aria-hidden>{expandedSpecimens.has(event.id) ? "−" : "+"}</span>
                    </button>
                    {expandedSpecimens.has(event.id) ? (
                      <SpecimenDemo eventId={event.id} onTrigger={handleTrigger} />
                    ) : (
                      <p className="text-canvas-compact text-canvas-muted">
                        Expand to preview the interaction specimen.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {finalizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-ink/30 p-4">
          <div
            role="dialog"
            aria-labelledby="finalize-title"
            className="w-full max-w-md rounded-canvas border border-canvas-border bg-canvas-card p-5 shadow-card"
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
    </div>
  );
}
