import { getFontEmbedCSS, toCanvas } from "html-to-image";
import { computeCanvasContentBounds, type ContentBounds } from "@/lib/canvasContentBounds";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { getHiddenCardIds } from "@/lib/chatThreads";
import { isConversationCard } from "@/lib/conversationCard";
import { resolveConnectionRender } from "@/lib/connectionsGeometry";
import { setCaptureMountAllNodes } from "@/lib/canvasSnapshotThumbnail/captureMountAll";
import { useCanvasStore } from "@/lib/store";

/**
 * Output size. 16:10 to match the Home card's preview slot, and ~1.6x the
 * largest slot width so it stays crisp on a 2x display without being heavy.
 */
export const THUMBNAIL_WIDTH = 960;
export const THUMBNAIL_HEIGHT = 600;

/** Breathing room around the content, as a fraction of each side. */
const FIT_MARGIN = 0.06;
/**
 * Never zoom IN past 100% — a two-card canvas should look like two cards on a
 * canvas, not a poster of one card.
 */
const MAX_FIT_SCALE = 1;
/**
 * After every node mounts, charts/tables/todos play a short load-in animation
 * and images decode. Capturing before that settles freezes half-drawn charts.
 */
const MOUNT_SETTLE_MS = 1100;
const IMAGE_DECODE_TIMEOUT_MS = 2500;

/** Connector stroke in output pixels (screen-constant, like the live canvas). */
const CONNECTOR_STROKE_PX = 2.4;
/** Dot grid in output pixels — reads like the live grid once scaled into the card. */
const DOT_SPACING_PX = 28;
const DOT_RADIUS_PX = 1.7;

/** 1×1 transparent GIF — stands in for images that refuse a CORS fetch. */
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export class ThumbnailCaptureAborted extends Error {
  constructor() {
    super("Thumbnail capture aborted");
    this.name = "ThumbnailCaptureAborted";
  }
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new ThumbnailCaptureAborted();
}

/**
 * One paint — or 100ms, whichever comes first: rAF never fires in a hidden
 * tab, and a capture parked there would keep every node mounted until the
 * user came back.
 */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, 100);
    requestAnimationFrame(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new ThumbnailCaptureAborted());
      },
      { once: true },
    );
  });
}

/** Wait (bounded) for every <img> under `root` to finish loading. */
async function waitForImages(root: HTMLElement, timeoutMs: number) {
  const pending = Array.from(root.querySelectorAll("img"))
    .filter((img) => !img.complete)
    .map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    );
  if (pending.length === 0) return;
  await Promise.race([
    Promise.all(pending),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

/** Resolve a `--canvas-*` channel triple ("12 34 56") to an rgb() string. */
function themeColor(el: HTMLElement, cssVar: string, fallback: string): string {
  const raw = getComputedStyle(el).getPropertyValue(cssVar).trim();
  return raw ? `rgb(${raw.split(/\s+/).join(", ")})` : fallback;
}

/** How long a cross-origin image gets to prove it serves CORS headers. */
const CORS_PROBE_TIMEOUT_MS = 4000;
const corsProbeCache = new Map<string, Promise<boolean>>();

function isCrossOrigin(url: string): boolean {
  if (url.startsWith("data:") || url.startsWith("blob:")) return false;
  try {
    return new URL(url, window.location.href).origin !== window.location.origin;
  } catch {
    return true;
  }
}

/**
 * Whether html-to-image will be able to fetch `url`. Probed with an
 * `<img crossorigin>` rather than fetch(): a fetch that fails CORS rejects,
 * and fetch-patching browser extensions re-throw that as an uncaught error
 * even though html-to-image handles it. Results are cached per session.
 */
function probeCors(url: string): Promise<boolean> {
  let probe = corsProbeCache.get(url);
  if (!probe) {
    probe = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const timer = setTimeout(() => resolve(false), CORS_PROBE_TIMEOUT_MS);
      img.onload = () => {
        clearTimeout(timer);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };
      img.src = url;
    });
    corsProbeCache.set(url, probe);
  }
  return probe;
}

const CSS_URL_RE = /url\(\s*(['"]?)(.*?)\1\s*\)/g;

/** A 2d canvas that drew cross-origin pixels can't be read back — and one
 * unreadable canvas makes the whole thumbnail export throw. */
function isTaintedCanvas(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext("2d");
    if (ctx && canvas.width > 0 && canvas.height > 0) ctx.getImageData(0, 0, 1, 1);
    return false;
  } catch {
    return true;
  }
}

/**
 * Elements under `root` that would break or spam the capture: images and
 * CSS backgrounds whose host refuses cross-origin reads, cross-origin video
 * frames, and tainted canvases. They are left out of the clone — their node
 * keeps its frame, the picture inside is simply empty.
 */
async function findUnrenderableElements(root: HTMLElement): Promise<WeakSet<Element>> {
  const candidates = new Map<Element, string[]>();
  const urls = new Set<string>();
  const skip = new WeakSet<Element>();

  for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    if (el instanceof HTMLImageElement) {
      if (el.src && isCrossOrigin(el.src)) {
        candidates.set(el, [el.src]);
        urls.add(el.src);
      }
      continue;
    }
    if (el instanceof HTMLVideoElement) {
      const src = el.currentSrc || el.poster;
      if (src && isCrossOrigin(src)) skip.add(el);
      continue;
    }
    if (el instanceof HTMLCanvasElement) {
      if (isTaintedCanvas(el)) skip.add(el);
      continue;
    }
    const bg = getComputedStyle(el).backgroundImage;
    if (!bg || bg === "none" || !bg.includes("url(")) continue;
    const found: string[] = [];
    for (const match of bg.matchAll(CSS_URL_RE)) {
      const url = match[2];
      if (url && isCrossOrigin(url)) {
        found.push(url);
        urls.add(url);
      }
    }
    if (found.length > 0) candidates.set(el, found);
  }

  const verdicts = new Map<string, boolean>();
  await Promise.all(
    Array.from(urls, async (url) => verdicts.set(url, await probeCors(url))),
  );
  for (const [el, elUrls] of candidates) {
    if (elUrls.some((url) => !verdicts.get(url))) skip.add(el);
  }
  return skip;
}

/**
 * Nodes that never belong in a thumbnail: cross-origin iframes can't be
 * rasterized (and make html-to-image throw), anything already marked as
 * capture chrome for screenshots/exports is UI, not content, and `skip`
 * holds the unreadable media found by findUnrenderableElements.
 */
function keepNodeFilter(skip: WeakSet<Element>) {
  return (node: Node): boolean => {
    if (!(node instanceof HTMLElement)) return true;
    if (node.tagName === "IFRAME") return false;
    if (skip.has(node)) return false;
    const { dataset } = node;
    if (
      dataset.thumbnailCaptureExclude !== undefined ||
      dataset.feedbackCaptureExclude !== undefined ||
      dataset.artifactExportExclude !== undefined
    ) {
      return false;
    }
    return true;
  };
}

let fontEmbedCssPromise: Promise<string> | null = null;

/** Web fonts are inlined once per session — re-embedding per capture is slow. */
function fontEmbedCss(node: HTMLElement): Promise<string> {
  fontEmbedCssPromise ??= getFontEmbedCSS(node).catch(() => "");
  return fontEmbedCssPromise;
}

export interface ThumbnailFit {
  scale: number;
  tx: number;
  ty: number;
}

/** World → output transform that centres `bounds` in the thumbnail. */
export function fitBoundsToThumbnail(
  bounds: ContentBounds,
  width = THUMBNAIL_WIDTH,
  height = THUMBNAIL_HEIGHT,
): ThumbnailFit {
  const innerW = width * (1 - FIT_MARGIN * 2);
  const innerH = height * (1 - FIT_MARGIN * 2);
  const scale = Math.min(
    innerW / Math.max(bounds.w, 1),
    innerH / Math.max(bounds.h, 1),
    MAX_FIT_SCALE,
  );
  return {
    scale,
    tx: (width - bounds.w * scale) / 2 - bounds.x * scale,
    ty: (height - bounds.h * scale) / 2 - bounds.y * scale,
  };
}

type StoreState = ReturnType<typeof useCanvasStore.getState>;

export function canvasHasThumbnailContent(state: StoreState): boolean {
  return (
    state.cardOrder.length +
      state.canvasArtifactOrder.length +
      state.canvasAssetOrder.length +
      state.canvasGifOrder.length +
      state.canvas3DOrder.length +
      state.canvasSkillOrder.length +
      state.canvasTextLabelOrder.length +
      (state.canvasStrokeOrder?.length ?? 0) >
    0
  );
}

function contentBounds(state: StoreState): ContentBounds {
  return computeCanvasContentBounds({
    cards: state.cards,
    cardOrder: state.cardOrder,
    canvasArtifactNodes: state.canvasArtifactNodes,
    canvasArtifactOrder: state.canvasArtifactOrder,
    canvasAssets: state.canvasAssets,
    canvasAssetNodes: state.canvasAssetNodes,
    canvasAssetOrder: state.canvasAssetOrder,
    canvasGifNodes: state.canvasGifNodes,
    canvasGifOrder: state.canvasGifOrder,
    canvas3DNodes: state.canvas3DNodes,
    canvas3DOrder: state.canvas3DOrder,
    canvasSkills: state.canvasSkills,
    canvasSkillNodes: state.canvasSkillNodes,
    canvasSkillOrder: state.canvasSkillOrder,
    canvasTextLabels: state.canvasTextLabels,
    canvasTextLabelOrder: state.canvasTextLabelOrder,
    sessionArtifacts: state.sessionArtifacts,
  });
}

/**
 * The canvas backdrop in its current theme. The live dot grid is
 * viewport-synced (its spacing tracks zoom), so it is redrawn here at a fixed
 * thumbnail spacing; every other style is rendered from its own layer and
 * stretched to cover.
 */
async function paintBackground(
  ctx: CanvasRenderingContext2D,
  container: HTMLElement,
  backgroundStyle: StoreState["canvasBackgroundStyle"],
) {
  ctx.fillStyle = themeColor(container, "--canvas-bg", "#fafaf8");
  ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);

  if (backgroundStyle === "grid") {
    ctx.fillStyle = themeColor(container, "--canvas-grid-dot", "rgb(0, 0, 0)");
    const half = DOT_SPACING_PX / 2;
    for (let y = half; y < THUMBNAIL_HEIGHT; y += DOT_SPACING_PX) {
      for (let x = half; x < THUMBNAIL_WIDTH; x += DOT_SPACING_PX) {
        ctx.beginPath();
        ctx.arc(x, y, DOT_RADIUS_PX, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }

  const layer = container.querySelector<HTMLElement>(
    "[data-canvas-background-layer]",
  );
  if (!layer || layer.clientWidth === 0 || layer.clientHeight === 0) return;
  try {
    const unrenderable = await findUnrenderableElements(layer);
    const rendered = await toCanvas(layer, {
      pixelRatio: 1,
      filter: keepNodeFilter(unrenderable),
      cacheBust: false,
      includeQueryParams: true,
      imagePlaceholder: TRANSPARENT_PIXEL,
      skipFonts: true,
    });
    // object-fit: cover
    const s = Math.max(
      THUMBNAIL_WIDTH / rendered.width,
      THUMBNAIL_HEIGHT / rendered.height,
    );
    const w = rendered.width * s;
    const h = rendered.height * s;
    ctx.drawImage(
      rendered,
      (THUMBNAIL_WIDTH - w) / 2,
      (THUMBNAIL_HEIGHT - h) / 2,
      w,
      h,
    );
  } catch {
    // The flat theme colour already painted is a fine fallback.
  }
}

/**
 * Card connections live on a screen-space canvas2d layer outside the node
 * tree, so they are redrawn here from the same geometry the live renderer
 * uses (lib/connectionsGeometry), in each thread's accent.
 */
function paintConnections(
  ctx: CanvasRenderingContext2D,
  state: StoreState,
  fit: ThumbnailFit,
) {
  const geomState = {
    cards: state.cards,
    threads: state.threads,
    connectorStyle: state.connectorStyle,
    collapsedCardIds: state.collapsedCardIds,
    hiddenCardIds: getHiddenCardIds(state),
    hiddenCheckState: state,
  };
  ctx.save();
  ctx.setTransform(fit.scale, 0, 0, fit.scale, fit.tx, fit.ty);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = CONNECTOR_STROKE_PX / fit.scale;
  for (const conn of state.connections) {
    const render = resolveConnectionRender(
      conn,
      geomState,
      RESOLVED_CANVAS_TUNING,
      fit.scale,
    );
    if (!render) continue;
    ctx.globalAlpha = render.opacity;
    ctx.strokeStyle = render.stroke;
    ctx.setLineDash(render.dashed ? [6 / fit.scale, 5 / fit.scale] : []);
    ctx.stroke(new Path2D(render.d));
  }
  ctx.restore();
}

async function encode(canvas: HTMLCanvasElement): Promise<Blob | null> {
  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await toBlob("image/webp", 0.82);
  // Safari can't encode WebP and silently hands back a PNG — use JPEG there.
  if (webp && webp.type === "image/webp") return webp;
  return toBlob("image/jpeg", 0.86);
}

export interface CaptureCanvasThumbnailOptions {
  /** The canvas root (`[data-canvas-container]`). */
  container: HTMLElement;
  /** Aborts before the DOM is cloned — e.g. the user started interacting. */
  signal?: AbortSignal;
}

/**
 * Render the whole canvas, zoomed to fit, in its current theme — the Home
 * dashboard's Figma-style thumbnail. Returns null for an empty canvas.
 *
 * Runs entirely against the live DOM without moving the user's viewport: the
 * node layer is cloned by html-to-image with its transform swapped for the
 * fit transform, then composited over a redrawn backdrop and connectors.
 * Culling is suspended for the duration so offscreen nodes are in the tree.
 */
export async function captureCanvasThumbnail({
  container,
  signal,
}: CaptureCanvasThumbnailOptions): Promise<Blob | null> {
  const viewportEl = container.querySelector<HTMLElement>("[data-canvas-viewport]");
  if (!viewportEl) return null;

  const initial = useCanvasStore.getState();
  if (!canvasHasThumbnailContent(initial)) return null;

  throwIfAborted(signal);
  setCaptureMountAllNodes(true);
  try {
    await nextFrame();
    await nextFrame();
    throwIfAborted(signal);
    await waitForImages(viewportEl, IMAGE_DECODE_TIMEOUT_MS);
    await delay(MOUNT_SETTLE_MS, signal);
    throwIfAborted(signal);

    // Read state after settling: geometry may have moved while we waited.
    const state = useCanvasStore.getState();
    const fit = fitBoundsToThumbnail(contentBounds(state));
    const fontEmbedCSS = await fontEmbedCss(viewportEl);
    throwIfAborted(signal);
    const unrenderable = await findUnrenderableElements(viewportEl);
    throwIfAborted(signal);

    const nodesCanvas = await toCanvas(viewportEl, {
      width: THUMBNAIL_WIDTH,
      height: THUMBNAIL_HEIGHT,
      canvasWidth: THUMBNAIL_WIDTH,
      canvasHeight: THUMBNAIL_HEIGHT,
      pixelRatio: 1,
      skipAutoScale: true,
      cacheBust: false,
      includeQueryParams: true,
      imagePlaceholder: TRANSPARENT_PIXEL,
      fontEmbedCSS,
      filter: keepNodeFilter(unrenderable),
      style: {
        transform: `translate(${fit.tx}px, ${fit.ty}px) scale(${fit.scale})`,
        transformOrigin: "0 0",
        willChange: "auto",
      },
    });

    const out = document.createElement("canvas");
    out.width = THUMBNAIL_WIDTH;
    out.height = THUMBNAIL_HEIGHT;
    const ctx = out.getContext("2d");
    if (!ctx) return null;

    await paintBackground(ctx, container, state.canvasBackgroundStyle);
    // Mirror the live stacking: conversation canvases draw lines behind cards.
    const linesBehind = state.cardOrder.some((id) =>
      isConversationCard(state.cards[id]),
    );
    if (linesBehind) paintConnections(ctx, state, fit);
    ctx.drawImage(nodesCanvas, 0, 0);
    if (!linesBehind) paintConnections(ctx, state, fit);

    return await encode(out);
  } finally {
    setCaptureMountAllNodes(false);
  }
}
