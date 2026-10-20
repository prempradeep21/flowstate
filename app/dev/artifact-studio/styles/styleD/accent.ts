"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Frost's accent, swappable live. Every Frost body paints its accent through
 * `--sd-lime` (and the type on it through `--sd-lime-ink`), so changing the
 * accent is two CSS variables on the document — no re-render of the bodies.
 * The choice is remembered per browser.
 */

export const FROST_ACCENT_DEFAULT = "#DDF23F";
const KEY = "flowstate.artifactStudio.frostAccent";
const EVENT = "artifact-studio:frost-accent";

/** A few starting points to audition; the colour wheel covers the rest. */
export const FROST_ACCENT_PRESETS = [
  { hex: "#DDF23F", name: "Lime" },
  { hex: "#FF7A2F", name: "Tangerine" },
  { hex: "#FF5C7A", name: "Coral" },
  { hex: "#FFD23F", name: "Sun" },
  { hex: "#7ED8C4", name: "Mint" },
  { hex: "#8EC5FF", name: "Sky" },
  { hex: "#3D5AFE", name: "Cobalt" },
  { hex: "#B49CFF", name: "Lilac" },
];

const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hex: string): number {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}

/** Ink or white — whichever reads better on the accent. */
export function inkOn(hex: string): string {
  const L = luminance(hex);
  const ink = (L + 0.05) / (0.0128 + 0.05); // contrast vs #1C1C1E
  const white = 1.05 / (L + 0.05);
  return ink >= white ? "#1C1C1E" : "#FFFFFF";
}

function read(): string {
  try {
    const v = window.localStorage.getItem(KEY);
    return v && HEX.test(v) ? v : FROST_ACCENT_DEFAULT;
  } catch {
    return FROST_ACCENT_DEFAULT;
  }
}

function apply(hex: string) {
  const root = document.documentElement.style;
  root.setProperty("--sd-lime", hex);
  root.setProperty("--sd-lime-ink", inkOn(hex));
}

/** The current accent and a setter; every caller stays in sync. Mount once anywhere to apply the saved accent. */
export function useFrostAccent() {
  const [accent, setAccentState] = useState(FROST_ACCENT_DEFAULT);

  useEffect(() => {
    const sync = () => {
      const v = read();
      setAccentState(v);
      apply(v);
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setAccent = useCallback((hex: string | null, persist = true) => {
    const v = hex && HEX.test(hex) ? hex : FROST_ACCENT_DEFAULT;
    apply(v);
    setAccentState(v);
    if (!persist) return;
    try {
      if (v === FROST_ACCENT_DEFAULT) window.localStorage.removeItem(KEY);
      else window.localStorage.setItem(KEY, v);
    } catch {
      // Blocked storage — the colour still applies for this visit.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { accent, setAccent, changed: accent.toLowerCase() !== FROST_ACCENT_DEFAULT.toLowerCase() };
}
