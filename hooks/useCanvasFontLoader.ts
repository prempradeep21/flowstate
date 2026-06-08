"use client";

import { useEffect } from "react";
import {
  collectGoogleFontHrefs,
  getBodyFontOption,
  getDisplayFontOption,
} from "@/lib/canvasFonts/registry";

let preconnectInjected = false;

function ensureGooglePreconnect() {
  if (preconnectInjected || typeof document === "undefined") return;
  preconnectInjected = true;

  const google = document.createElement("link");
  google.rel = "preconnect";
  google.href = "https://fonts.googleapis.com";
  document.head.appendChild(google);

  const gstatic = document.createElement("link");
  gstatic.rel = "preconnect";
  gstatic.href = "https://fonts.gstatic.com";
  gstatic.crossOrigin = "";
  document.head.appendChild(gstatic);
}

function ensureGoogleStylesheet(href: string) {
  if (typeof document === "undefined") return;
  const id = `canvas-font-href-${href}`;
  if (document.getElementById(id)) return;

  ensureGooglePreconnect();

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function hrefsForFontIds(bodyId: string, displayId: string): string[] {
  const hrefs = new Set<string>();
  const body = getBodyFontOption(bodyId);
  const display = getDisplayFontOption(displayId);
  if (body?.googleFontsHref) hrefs.add(body.googleFontsHref);
  if (display?.googleFontsHref) hrefs.add(display.googleFontsHref);
  return [...hrefs];
}

/** Load Google Fonts needed for the current body/display preview selection. */
export function useCanvasFontLoader(bodyId: string, displayId: string) {
  useEffect(() => {
    for (const href of hrefsForFontIds(bodyId, displayId)) {
      ensureGoogleStylesheet(href);
    }
  }, [bodyId, displayId]);
}

/** Preload every Google font href used in the registry (popover row previews). */
export function preloadAllCanvasGoogleFonts() {
  for (const href of collectGoogleFontHrefs()) {
    ensureGoogleStylesheet(href);
  }
}
