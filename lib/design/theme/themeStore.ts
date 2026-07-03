"use client";

import { create } from "zustand";
import {
  DEFAULT_THEME_STATE,
  resolveTheme,
} from "@/lib/design/theme/resolveTheme";
import {
  applyThemeCss,
  loadPersistedThemeState,
  persistTheme,
} from "@/lib/design/theme/themeStorage";
import type {
  ArtifactCategoryId,
  ThemeMode,
  ThemeState,
} from "@/lib/design/theme/types";

interface ThemeStore {
  state: ThemeState;
  hydrated: boolean;
  hydrate: () => void;
  setPreset: (presetId: string) => void;
  setMode: (mode: ThemeMode) => void;
  setRoleColor: (
    role: "primary" | "secondary" | "tertiary",
    hex: string | undefined,
  ) => void;
  setCategoryColor: (
    category: ArtifactCategoryId,
    hex: string | undefined,
  ) => void;
  setRadiusBase: (px: number | undefined) => void;
  resetToPreset: () => void;
}

/** Resolve + inject + persist in one step; the store is the single writer. */
function commit(state: ThemeState): ThemeState {
  const resolved = resolveTheme(state);
  const css = resolved.isDefault ? "" : resolved.css;
  applyThemeCss(css);
  persistTheme(state, css);
  return state;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  state: DEFAULT_THEME_STATE,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const persisted = loadPersistedThemeState();
    set({
      hydrated: true,
      state: persisted ? commit(persisted) : DEFAULT_THEME_STATE,
    });
  },
  setPreset: (presetId) => {
    const prev = get().state;
    // Switching presets discards color/radius tweaks — they were relative to
    // the previous preset's palette.
    set({ state: commit({ ...prev, presetId, overrides: {} }) });
  },
  setMode: (mode) => {
    const prev = get().state;
    set({ state: commit({ ...prev, mode }) });
  },
  setRoleColor: (role, hex) => {
    const prev = get().state;
    set({
      state: commit({
        ...prev,
        overrides: { ...prev.overrides, [role]: hex },
      }),
    });
  },
  setCategoryColor: (category, hex) => {
    const prev = get().state;
    set({
      state: commit({
        ...prev,
        overrides: {
          ...prev.overrides,
          categories: { ...prev.overrides.categories, [category]: hex },
        },
      }),
    });
  },
  setRadiusBase: (px) => {
    const prev = get().state;
    set({
      state: commit({
        ...prev,
        overrides: { ...prev.overrides, radiusBase: px },
      }),
    });
  },
  resetToPreset: () => {
    const prev = get().state;
    set({ state: commit({ ...prev, overrides: {} }) });
  },
}));
