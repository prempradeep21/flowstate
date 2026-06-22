"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArtifactContent } from "@/components/artifacts/ArtifactContent";
import { HideArtifactControlsContext } from "@/components/artifacts/ArtifactControlsVisibility";
import type { ArtifactPayload, CustomArtifactData } from "@/lib/artifactTypes";
import { buildCustomSrcdoc } from "@/lib/customArtifact";

/**
 * Stateless single-artifact renderer for the iOS WKWebView.
 * The native app passes the full payload as base64url JSON + theme in the URL
 * fragment: `#payload=…&theme=dark`.
 *
 * Rendering strategy (three buckets):
 *   1. custom HTML  → full-bleed sandboxed iframe (its own CSS owns layout).
 *   2. FULL_BLEED   → interactive / scrolling types (map, table, images, …)
 *                     fill the viewport and manage their own gestures/scroll.
 *   3. everything else (calendar, chart, timeline, todo, …) → rendered at a
 *      fixed design width at NATURAL height, then scaled to *fit* the viewport
 *      and centered. This respects each artifact's aspect ratio and avoids the
 *      "stretched with a black void" problem you get from force-filling a
 *      compact artifact into a tall phone screen.
 *
 * Pinch-zoom is enabled for every type so the user can zoom in past the fit
 * scale and the zoom level stays locked until they change it.
 */

/** Artifact width the "fit" bucket is laid out at before scaling to screen.
 *  Matches the comfortable artifact width used on the web canvas, so each
 *  component renders at the proportions it was designed for. */
const DESIGN_WIDTH = 680;

/** Types that should fill the viewport and own their gestures/scroll, rather
 *  than being scaled-to-fit. These either need the full screen (maps), scroll
 *  internally (tables, code), or run their own pan/zoom math that a CSS
 *  transform would break. */
const FULL_BLEED = new Set<ArtifactPayload["type"]>([
  "map",
  "streetview",
  "images",
  "3d",
  "website",
  "google-doc",
  "embed",
  "audio",
  "repo",
  "code",
  "table",
]);

function decode(): { payload: ArtifactPayload | null; theme: "light" | "dark" } {
  if (typeof window === "undefined") return { payload: null, theme: "light" };
  const params = new URLSearchParams(window.location.hash.slice(1));
  const theme = params.get("theme") === "dark" ? "dark" : "light";
  const raw = params.get("payload");
  if (!raw) return { payload: null, theme };
  try {
    // Swift emits base64url (RFC 4648 §5) to avoid URLSearchParams treating
    // '+' as a space. Normalize back to standard base64 before atob().
    const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(normalized);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return { payload: JSON.parse(new TextDecoder().decode(bytes)), theme };
  } catch {
    return { payload: null, theme };
  }
}

/** Allow pinch-zoom and let it stay locked at whatever the user picks. */
function enablePinchZoom() {
  const meta = document.querySelector('meta[name="viewport"]');
  meta?.setAttribute(
    "content",
    "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover",
  );
}

export default function MobileRenderPage() {
  const [payload, setPayload] = useState<ArtifactPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { payload, theme } = decode();

    const root = document.documentElement;
    if (theme === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;

    enablePinchZoom();

    setPayload(payload);
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!payload) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-canvas-bg p-6 text-center text-sm text-canvas-muted">
        Couldn&apos;t render this artifact.
      </div>
    );
  }

  // ── Custom HTML ──────────────────────────────────────────────────────────
  // sandbox="allow-scripts allow-same-origin" is required: the null-origin
  // sandbox created by allow-scripts alone blocks pointer events and keyboard
  // focus in WebKit (iOS WKWebView).
  if (payload.type === "custom") {
    return <MobileCustomView data={payload.data as CustomArtifactData} />;
  }

  // ── Full-bleed interactive / scrolling types ─────────────────────────────
  if (FULL_BLEED.has(payload.type)) {
    return (
      <HideArtifactControlsContext.Provider value={true}>
        <div className="flex h-dvh w-screen flex-col overflow-hidden bg-canvas-bg">
          <ArtifactContent
            payload={payload}
            layout="canvas"
            catalogPreview
            hideControls
          />
        </div>
      </HideArtifactControlsContext.Provider>
    );
  }

  // ── Fit-to-viewport (compact / document artifacts) ───────────────────────
  const todoContext =
    payload.type === "todo"
      ? {
          artifactId: "m",
          versionId: "m",
          latestVersionId: "m",
          isEditing: false,
        }
      : undefined;

  return (
    <HideArtifactControlsContext.Provider value={true}>
      <FitToViewport>
        <ArtifactContent
          payload={payload}
          layout="panel"
          catalogPreview
          hideControls
          todoContext={todoContext}
        />
      </FitToViewport>
    </HideArtifactControlsContext.Provider>
  );
}

// ── FitToViewport ────────────────────────────────────────────────────────────

/**
 * Renders children at a fixed DESIGN_WIDTH and natural height, then applies a
 * uniform CSS scale so the whole artifact fits inside the viewport, centered.
 * Aspect ratio is always preserved (single scale factor, no stretch). Re-fits
 * on resize / orientation change so it adapts when the phone is rotated.
 */
function FitToViewport({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const compute = () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;
      const vw = outer.clientWidth;
      const vh = outer.clientHeight;
      // Natural (unscaled) content size. innerRef has the transform applied, so
      // measure the un-transformed child to get true dimensions.
      const w = inner.offsetWidth;
      const h = inner.offsetHeight;
      if (!w || !h || !vw || !vh) return;
      // Contain within the viewport; cap upscaling so small artifacts grow but
      // never blow up past a sensible size (pinch-zoom handles further zoom).
      const fit = Math.min(vw / w, vh / h);
      setScale(Math.min(fit, 2));
    };

    compute();

    const ro = new ResizeObserver(compute);
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  return (
    <div
      ref={outerRef}
      className="flex h-dvh w-screen items-center justify-center overflow-hidden bg-canvas-bg"
    >
      <div
        ref={innerRef}
        style={{
          width: DESIGN_WIDTH,
          flex: "0 0 auto",
          transform: scale != null ? `scale(${scale})` : undefined,
          transformOrigin: "center center",
          // Hide until the first measurement so there's no flash of the
          // full-size (overflowing) artifact before it's scaled down.
          visibility: scale != null ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── MobileCustomView ─────────────────────────────────────────────────────────

function MobileCustomView({ data }: { data: CustomArtifactData }) {
  const srcdoc = useMemo(() => buildCustomSrcdoc(data), [data]);
  return (
    <div className="h-dvh w-screen overflow-hidden bg-white">
      <iframe
        title="Custom UI"
        sandbox="allow-scripts allow-same-origin"
        srcDoc={srcdoc}
        className="h-full w-full border-0"
        style={{ display: "block" }}
      />
    </div>
  );
}
