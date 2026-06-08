"use client";

import { createSeslen, type SeslenInstance } from "seslen";
import { presetDefaults, presets } from "seslen/presets";
import { useCanvasStore } from "@/lib/store";
import { SOUND_MAP } from "./registry";
import type { SeslenPresetId, SoundEventId, SoundMapping } from "./types";

const THROTTLE_MS: Partial<Record<SoundEventId, number>> = {
  "card-drag-start": 150,
  "canvas-pan": 150,
};

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

export { formatSoundMapAsTypeScript } from "./export";
