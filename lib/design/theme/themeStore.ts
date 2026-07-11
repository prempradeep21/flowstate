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
  ThemePreset,
  ThemeState,
} from "@/lib/design/theme/types";

interface PublishedThemeResponse {
  activeDefaultId: string | null;
  defaultOverrides: ThemeState["overrides"] | null;
  customThemes: ThemePreset[];
}

interface ThemeStore {
  state: ThemeState;
  hydrated: boolean;
  /** Saved custom themes (fetched from the published file) — for the panel's grid. */
  customThemes: ThemePreset[];
  hydrate: () => void;
  refreshCustomThemes: () => Promise<void>;
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
function commit(state: ThemeState, customThemes: readonly ThemePreset[]): ThemeState {
  const resolved = resolveTheme(state, customThemes);
  const css = resolved.isDefault ? "" : resolved.css;
  applyThemeCss(css);
  persistTheme(state, css);
  return state;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  state: DEFAULT_THEME_STATE,
  hydrated: false,
  customThemes: [],
  hydrate: () => {
    if (get().hydrated) return;
    set({ hydrated: true });
    const persisted = loadPersistedThemeState();
    if (persisted) {
      set({ state: commit(persisted, get().customThemes) });
      // Still fetch custom themes for the panel grid, but don't let a
      // personal override be replaced by the published default.
      void get().refreshCustomThemes();
      return;
    }
    // No personal override — sync to whatever the server already rendered
    // (see app/layout.tsx) so the store doesn't snap back to factory
    // Flowstate on the user's first interaction.
    void fetch("/api/admin/theme/published")
      .then((res) => (res.ok ? (res.json() as Promise<PublishedThemeResponse>) : null))
      .then((published) => {
        if (!published) return;
        set({ customThemes: published.customThemes });
        if (published.activeDefaultId == null) return;
        const nextState: ThemeState = {
          presetId: published.activeDefaultId,
          mode: "light",
          overrides: published.defaultOverrides ?? {},
        };
        set({ state: commit(nextState, published.customThemes) });
      })
      .catch(() => {
        // Offline or route unavailable — factory default stands.
      });
  },
  refreshCustomThemes: async () => {
    try {
      const res = await fetch("/api/admin/theme/published");
      if (!res.ok) return;
      const published = (await res.json()) as PublishedThemeResponse;
      set({ customThemes: published.customThemes });
    } catch {
      // Ignore — panel just won't show custom themes until next load.
    }
  },
  setPreset: (presetId) => {
    const prev = get().state;
    // Switching presets discards color/radius tweaks — they were relative to
    // the previous preset's palette.
    set({ state: commit({ ...prev, presetId, overrides: {} }, get().customThemes) });
  },
  setMode: (mode) => {
    const prev = get().state;
    set({ state: commit({ ...prev, mode }, get().customThemes) });
  },
  setRoleColor: (role, hex) => {
    const prev = get().state;
    set({
      state: commit(
        { ...prev, overrides: { ...prev.overrides, [role]: hex } },
        get().customThemes,
      ),
    });
  },
  setCategoryColor: (category, hex) => {
    const prev = get().state;
    set({
      state: commit(
        {
          ...prev,
          overrides: {
            ...prev.overrides,
            categories: { ...prev.overrides.categories, [category]: hex },
          },
        },
        get().customThemes,
      ),
    });
  },
  setRadiusBase: (px) => {
    const prev = get().state;
    set({
      state: commit(
        { ...prev, overrides: { ...prev.overrides, radiusBase: px } },
        get().customThemes,
      ),
    });
  },
  resetToPreset: () => {
    const prev = get().state;
    set({ state: commit({ ...prev, overrides: {} }, get().customThemes) });
  },
}));
