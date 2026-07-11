import type { ThemeMode, ThemeState } from "@/lib/design/theme/types";

/**
 * localStorage persistence for the theme. The resolved CSS is precomputed at
 * save time so the no-flash boot script (see noFlashScript.ts) can inject it
 * without importing any theme logic.
 */
export const THEME_STORAGE_KEY = "flowstate:theme:v1";
export const THEME_STYLE_ELEMENT_ID = "flowstate-theme-overrides";

interface PersistedTheme {
  v: 1;
  state: ThemeState;
  mode: ThemeMode;
  /** Resolved stylesheet; empty string when state is factory-default. */
  css: string;
}

export function persistTheme(state: ThemeState, css: string): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedTheme = { v: 1, state, mode: state.mode, css };
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage unavailable (private mode, quota) — theme stays session-only.
  }
}

export function loadPersistedThemeState(): ThemeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedTheme> | null;
    if (!parsed || parsed.v !== 1 || !parsed.state) return null;
    const state = parsed.state;
    if (typeof state.presetId !== "string") return null;
    return {
      presetId: state.presetId,
      mode: state.mode === "dark" ? "dark" : "light",
      overrides: state.overrides ?? {},
    };
  } catch {
    return null;
  }
}

export function clearPersistedTheme(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Upsert (or remove) the injected override stylesheet. */
export function applyThemeCss(css: string): void {
  if (typeof document === "undefined") return;
  let el = document.getElementById(THEME_STYLE_ELEMENT_ID);
  if (!css) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("style");
    el.id = THEME_STYLE_ELEMENT_ID;
    document.head.appendChild(el);
  }
  if (el.textContent !== css) el.textContent = css;
}
