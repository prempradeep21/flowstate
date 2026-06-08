"use client";

import { createSeslen, type SeslenInstance } from "seslen";
import { presetDefaults, presets } from "seslen/presets";
import { useCanvasStore } from "@/lib/store";
import { SOUND_MAP } from "./registry";
import type { SeslenPresetId, SoundEventId, SoundMapping } from "./types";

const THROTTLE_MS: Partial<Record<SoundEventId, number>> = {
  "card-drag-start": 150,
};

/** Screen pixels of viewport movement per scroll-tick (pan + zoom). */
const CANVAS_TICK_DISTANCE_PX = 10;
/** Matches seslen scroll-tick preset minInterval (ms). */
const CANVAS_TICK_MIN_INTERVAL_MS = 20;
const CANVAS_TICK_MAX_BURST = 4;
/** Converts log-scale zoom delta to equivalent pan pixels for tick spacing. */
const CANVAS_ZOOM_PIXEL_SCALE = 35;

let canvasTickAccum = 0;
let canvasTickLastAt = 0;

let ses: SeslenInstance | null = null;
const lastPlayedAt = new Map<SoundEventId, number>();

function getSes(): SeslenInstance {
  if (!ses) {
    ses = createSeslen({
      sources: presets,
      defaults: presetDefaults,
      volume: 0.7,
      respectReducedMotion: true,
      persist: "flowstate:sound-master",
    });
  }
  return ses;
}

export function isSoundEngineMuted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return getSes().isMuted();
  } catch {
    return false;
  }
}

export function isReducedMotionActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getMasterVolume(): number {
  return getSes().getVolume();
}

export function setMasterVolume(volume: number): void {
  getSes().setVolume(Math.max(0, Math.min(1, volume)));
}

export function setMasterMuted(muted: boolean): void {
  if (muted) getSes().mute();
  else getSes().unmute();
}

export function isMasterMuted(): boolean {
  return getSes().isMuted();
}

export function getActiveSoundMap(): SoundMapping {
  return SOUND_MAP;
}

function canPlay(): boolean {
  if (typeof window === "undefined") return false;
  return useCanvasStore.getState().soundEnabled;
}

export async function playPreset(
  presetId: SeslenPresetId,
  opts?: { force?: boolean; gain?: number },
): Promise<void> {
  if (!opts?.force && !canPlay()) return;
  const playOpts = opts?.gain != null ? { gain: opts.gain } : undefined;
  await getSes().play(presetId, playOpts);
}

export async function playSound(
  eventId: SoundEventId,
  opts?: { force?: boolean },
): Promise<void> {
  if (!opts?.force && !canPlay()) return;
  const config = SOUND_MAP[eventId];
  if (!config?.preset) return;
  await getSes().play(config.preset, { gain: config.volume });
}

export async function playSoundThrottled(eventId: SoundEventId): Promise<void> {
  const throttle = THROTTLE_MS[eventId];
  if (throttle) {
    const now = Date.now();
    const last = lastPlayedAt.get(eventId) ?? 0;
    if (now - last < throttle) return;
    lastPlayedAt.set(eventId, now);
  }
  await playSound(eventId);
}

/**
 * Plays canvas-pan scroll ticks from accumulated viewport movement so tick
 * rate tracks pan/zoom speed instead of a fixed time throttle.
 */
export function notifyCanvasViewportMovement(
  dx: number,
  dy: number,
  scaleRatio: number,
): void {
  if (!canPlay()) return;

  const panPx = Math.hypot(dx, dy);
  const zoomPx =
    scaleRatio > 0 && scaleRatio !== 1
      ? Math.abs(Math.log(scaleRatio)) * CANVAS_ZOOM_PIXEL_SCALE
      : 0;
  const movementPx = panPx + zoomPx;
  if (movementPx <= 0) return;

  canvasTickAccum += movementPx;

  const ticksNeeded = Math.floor(canvasTickAccum / CANVAS_TICK_DISTANCE_PX);
  if (ticksNeeded <= 0) return;

  const now = Date.now();
  const elapsed = canvasTickLastAt === 0 ? CANVAS_TICK_MIN_INTERVAL_MS : now - canvasTickLastAt;
  const ticksByTime = Math.max(1, Math.floor(elapsed / CANVAS_TICK_MIN_INTERVAL_MS));
  const ticksToPlay = Math.min(ticksNeeded, ticksByTime, CANVAS_TICK_MAX_BURST);

  for (let i = 0; i < ticksToPlay; i++) {
    void playSound("canvas-pan");
    canvasTickAccum -= CANVAS_TICK_DISTANCE_PX;
  }
  if (ticksToPlay > 0) {
    canvasTickLastAt = now;
  }

  const maxLag = CANVAS_TICK_DISTANCE_PX * CANVAS_TICK_MAX_BURST * 2;
  if (canvasTickAccum > maxLag) {
    canvasTickAccum = maxLag;
  }
}

export { formatSoundMapAsTypeScript } from "./export";
