"use client";

import { normalizeSoundMapping } from "./config";
import { DEFAULT_SOUND_MAP } from "./registry";
import type {
  SoundEventId,
  SoundMapping,
  SoundPresetSelection,
} from "./types";

export const SOUND_MAP_DRAFT_KEY = "flowstate:sound-map-draft";

export function loadDraftSoundMap(): SoundMapping | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SOUND_MAP_DRAFT_KEY);
    if (!raw) return null;
    return normalizeSoundMapping(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveDraftSoundMap(map: SoundMapping): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_MAP_DRAFT_KEY, JSON.stringify(map));
}

export function clearDraftSoundMap(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SOUND_MAP_DRAFT_KEY);
}

export function createInitialDraftMap(): SoundMapping {
  const draft = loadDraftSoundMap();
  if (!draft) return { ...DEFAULT_SOUND_MAP };
  return { ...DEFAULT_SOUND_MAP, ...draft };
}

export function mergeDraftPreset(
  map: SoundMapping,
  eventId: SoundEventId,
  preset: SoundPresetSelection,
): SoundMapping {
  return {
    ...map,
    [eventId]: { ...map[eventId], preset },
  };
}

export function mergeDraftVolume(
  map: SoundMapping,
  eventId: SoundEventId,
  volume: number,
): SoundMapping {
  return {
    ...map,
    [eventId]: { ...map[eventId], volume },
  };
}
