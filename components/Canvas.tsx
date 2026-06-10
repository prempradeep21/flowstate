"use client";

import {
  PointerEvent as ReactPointerEvent,
  MutableRefObject,
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  collectCanvasItemsInWorldRect,
  mergeCanvasSelections,
  type CanvasSelection,
} from "@/lib/canvasSelection";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import {
  allowSidebarDrop,
  parseSidebarDragPayload,
  uploadedToPending,
} from "@/lib/sidebarDnD";
import { DEFAULT_GIF_WIDTH } from "@/lib/canvasGifBounds";
import { DEFAULT_ASSET_IMAGE_WIDTH, getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import { CANVAS_SKILL_SIZE } from "@/lib/canvasSkillBounds";
import {
  uploadAssetFiles,
  type AssetUploadError,
} from "@/lib/attachments";
import {
  CANVAS_ARTIFACT_WIDTH,
  CANVAS_TEXT_LABEL_FONT_SIZE,
  useCanvasStore,
  type SpawnCanvasGifInput,
} from "@/lib/store";
import { getArtifactBounds } from "@/lib/canvasNodeBounds";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";
import { fetchYoutubeMeta, isYoutubeUrl } from "@/lib/youtube";
import {
  CanvasContextMenu,
  ContextMenuState,
} from "@/components/CanvasContextMenu";
import { CanvasLandingOverlay } from "@/components/CanvasLandingOverlay";
import { CanvasBackgroundLayer } from "@/components/canvasBackgrounds/CanvasBackgroundLayer";
import { CanvasViewport } from "@/components/CanvasViewport";
import { CanvasArtifactNode } from "@/components/CanvasArtifactNode";
import { CanvasAssetNode } from "@/components/CanvasAssetNode";
import { CanvasGifNode } from "@/components/CanvasGifNode";
import { CanvasSkillNode } from "@/components/CanvasSkillNode";
import { CanvasTextLabelNode } from "@/components/CanvasTextLabelNode";
import { Card } from "@/components/Card";
import { Connections } from "@/components/Connections";
import { ArtifactPlugConnections } from "@/components/plugs/ArtifactPlugConnections";
import { SkillPlugConnections } from "@/components/plugs/SkillPlugConnections";
import { PlugConnectorLayer } from "@/components/plugs/PlugConnectorLayer";
import { useCanvasFontLoader } from "@/hooks/useCanvasFontLoader";
import { usePlugDragSession } from "@/hooks/usePlugDragSession";
import { getCanvasFontPreviewStyles } from "@/lib/canvasFonts/previewStyles";
import { useCanvasPan } from "@/hooks/useCanvasPan";
import { useCanvasWheelZoom } from "@/hooks/useCanvasWheelZoom";
import { useViewportCulling } from "@/hooks/useViewportCulling";
import { focusCanvasArtifact } from "@/lib/canvasArtifacts";
import { createUrlArtifactFromText } from "@/lib/createUrlArtifact";
import {
  getImageFilesFromDataTransfer,
  isExternalImageDrag,
  resolveImageFileFromDataTransfer,
} from "@/lib/canvasImageImport";
import { focusCanvasCard } from "@/lib/canvasFocus";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { landingStackViewportCenter } from "@/lib/canvasOrigin";
import {
  isViewportBootstrapApplied,
  isViewportRestoredFromSnapshot,
  markViewportBootstrapApplied,
  resetViewportBootstrap,
} from "@/lib/canvasViewportBootstrap";
import {
  requestCanvasFocus,
} from "@/lib/canvasViewportGuard";
import { useHiddenCardIds } from "@/hooks/useHiddenCardIds";
import {
  getLandingCardId,
  shouldShowCanvasLanding,
} from "@/lib/canvasLandingState";
import { GroupBounds } from "@/components/GroupBounds";
import { GroupSummaryIcon } from "@/components/GroupSummaryIcon";
import { SelectionOverlay } from "@/components/SelectionOverlay";
import { SelectionToolbar } from "@/components/SelectionToolbar";
import { SendIconPreview } from "@/components/SendIconButton";
import {
  usePersistenceReady,
  useAuth,
  useCanEditCanvas,
} from "@/components/AuthProvider";
import { CanvasPieMenu } from "@/components/CanvasPieMenu";
import { useCanvasPieMenu } from "@/hooks/useCanvasPieMenu";
import { canvasLoadRevealTotalMs } from "@/lib/motion/canvasLoadReveal";
import { CollaboratorCursors } from "@/components/CollaboratorCursors";
const MARQUEE_MIN_DRAG_PX = 6;

interface PlacementState {
  x: number;
  y: number;
}

interface ImagePlacementState extends PlacementState {
  assetId: string;
  previewUrl: string;
  aspectRatio: number;
}

interface GifPlacementState extends SpawnCanvasGifInput, PlacementState {}

export function Canvas({
  containerRef: externalContainerRef,
}: {
  containerRef?: RefObject<HTMLDivElement | null>;
} = {}) {
  const persistenceReady = usePersistenceReady();
  const { user, activeCanvasId, presenceChannelRef, isSwitchingCanvas } =
    useAuth();
  const canvasLoadReveal = useCanvasStore((s) => s.canvasLoadReveal);
  const startCanvasLoadReveal = useCanvasStore((s) => s.startCanvasLoadReveal);
  const clearCanvasLoadReveal = useCanvasStore((s) => s.clearCanvasLoadReveal);
  const cards = useCanvasStore((s) => s.cards);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const createRootCard = useCanvasStore((s) => s.createRootCard);
  const updateCard = useCanvasStore((s) => s.updateCard);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const uploadedAttachments = useCanvasStore((s) => s.uploadedAttachments);
  const canvasAssets = useCanvasStore((s) => s.canvasAssets);
  const canvasAssetNodes = useCanvasStore((s) => s.canvasAssetNodes);
  const canvasAssetOrder = useCanvasStore((s) => s.canvasAssetOrder);
  const addCanvasAsset = useCanvasStore((s) => s.addCanvasAsset);
  const spawnCanvasAsset = useCanvasStore((s) => s.spawnCanvasAsset);
  const canvasSkillOrder = useCanvasStore((s) => s.canvasSkillOrder);
  const canvasSkillNodes = useCanvasStore((s) => s.canvasSkillNodes);
  const spawnCanvasSkill = useCanvasStore((s) => s.spawnCanvasSkill);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const canvasArtifactOrder = useCanvasStore((s) => s.canvasArtifactOrder);
  const canvasTextLabels = useCanvasStore((s) => s.canvasTextLabels);
  const canvasTextLabelOrder = useCanvasStore((s) => s.canvasTextLabelOrder);
  const canvasGifNodes = useCanvasStore((s) => s.canvasGifNodes);
  const canvasGifOrder = useCanvasStore((s) => s.canvasGifOrder);
  const selectedCanvasTextLabelId = useCanvasStore(
    (s) => s.selectedCanvasTextLabelId,
  );
  const spawnCanvasTextLabel = useCanvasStore((s) => s.spawnCanvasTextLabel);
  const spawnCanvasGif = useCanvasStore((s) => s.spawnCanvasGif);
  const setGifPickerOpen = useCanvasStore((s) => s.setGifPickerOpen);
  const imagePlacementAssetId = useCanvasStore((s) => s.imagePlacementAssetId);
  const gifPlacementRequest = useCanvasStore((s) => s.gifPlacementRequest);
  const removeCanvasTextLabel = useCanvasStore((s) => s.removeCanvasTextLabel);
  const createVideoArtifactFromUrl = useCanvasStore(
    (s) => s.createVideoArtifactFromUrl,
  );
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const groups = useCanvasStore((s) => s.groups);
  const groupList = Object.values(groups);
  const hiddenCardIds = useHiddenCardIds();
  const bodyFontId = useCanvasStore((s) => s.canvasPreviewBodyFontId);
  const displayFontId = useCanvasStore((s) => s.canvasPreviewDisplayFontId);
  useCanvasFontLoader(bodyFontId, displayFontId);
  const fontPreviewStyle = getCanvasFontPreviewStyles(bodyFontId, displayFontId);

  const showLanding = shouldShowCanvasLanding(cards, cardOrder);
  const landingCardId = getLandingCardId(cards, cardOrder);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { enabled: cullingEnabled, visible: visibleNodes } = useViewportCulling(
    containerRef,
    { landingCardId: showLanding ? landingCardId : null },
  );
  const setContainerRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (externalContainerRef) {
      (externalContainerRef as MutableRefObject<HTMLDivElement | null>).current =
        node;
    }
    setContainerReady(node !== null);
  };
  const landingViewportCenteredRef = useRef(false);
  const seedingRef = useRef(false);
  const [containerReady, setContainerReady] = useState(false);

  useEffect(() => {
    if (canvasLoadReveal?.phase !== "pending") return;
    if (!persistenceReady || isSwitchingCanvas) return;
    startCanvasLoadReveal();
  }, [
    canvasLoadReveal?.phase,
    persistenceReady,
    isSwitchingCanvas,
    startCanvasLoadReveal,
  ]);

  useEffect(() => {
    if (canvasLoadReveal?.phase !== "running") return;
    const totalMs = canvasLoadRevealTotalMs({
      delays: canvasLoadReveal.delays,
      unitCount: 0,
      maxDelayMs: canvasLoadReveal.maxDelayMs,
    });
    const timer = window.setTimeout(() => clearCanvasLoadReveal(), totalMs);
    return () => window.clearTimeout(timer);
  }, [
    canvasLoadReveal?.phase,
    canvasLoadReveal?.maxDelayMs,
    canvasLoadReveal?.delays,
    clearCanvasLoadReveal,
  ]);

  useEffect(() => {
    if (cardOrder.length === 0) {
      seedingRef.current = false;
      landingViewportCenteredRef.current = false;
    }
  }, [cardOrder.length]);

  usePlugDragSession(containerRef);
  useCanvasWheelZoom(containerRef);
  const queuePan = useCanvasPan();
  const panState = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(
    null,
  );
  const marqueeState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    /** Selection at marquee start — preserved for Shift/Ctrl additive mode. */
    baseSelection: CanvasSelection | null;
  } | null>(null);
  const spaceHeldRef = useRef(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [assetDropErrors, setAssetDropErrors] = useState<AssetUploadError[]>([]);
  const [marqueeRect, setMarqueeRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  // Latest cursor position in screen space, kept in a ref so a window keydown
  // listener can read it without re-binding on every mousemove.
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const canvasPointerRef = useRef<{ x: number; y: number } | null>(null);

  // Two-step Q placement: press Q -> ghost follows cursor; click -> anchor;
  // Esc -> cancel. Holding both state (for re-render) and a ref (for stable
  // handler closures).
  const [placement, setPlacement] = useState<PlacementState | null>(null);
  const [textPlacement, setTextPlacement] = useState<PlacementState | null>(
    null,
  );
  const [imagePlacement, setImagePlacement] =
    useState<ImagePlacementState | null>(null);
  const [gifPlacement, setGifPlacement] = useState<GifPlacementState | null>(
    null,
  );
  const [autoEditLabelId, setAutoEditLabelId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const placementRef = useRef<PlacementState | null>(null);
  const textPlacementRef = useRef<PlacementState | null>(null);
  const imagePlacementRef = useRef<ImagePlacementState | null>(null);
  const gifPlacementRef = useRef<GifPlacementState | null>(null);
  useEffect(() => {
    placementRef.current = placement;
  }, [placement]);
  useEffect(() => {
    textPlacementRef.current = textPlacement;
  }, [textPlacement]);
  useEffect(() => {
    imagePlacementRef.current = imagePlacement;
  }, [imagePlacement]);
  useEffect(() => {
    gifPlacementRef.current = gifPlacement;
  }, [gifPlacement]);

  const canvasPlacementRequest = useCanvasStore((s) => s.canvasPlacementRequest);

  const beginPlacementAtCursor = (tool: "question" | "text") => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvasPtr = canvasPointerRef.current;
    const cursor = cursorRef.current;
    const rawX = canvasPtr?.x ?? cursor?.x ?? rect.left + rect.width / 2;
    const rawY = canvasPtr?.y ?? cursor?.y ?? rect.top + rect.height / 2;
    const clientX = Math.min(rect.right, Math.max(rect.left, rawX));
    const clientY = Math.min(rect.bottom, Math.max(rect.top, rawY));
    const world = computeWorldFromClient(clientX, clientY);
    if (!world) return;
    const pos = placementWorld(world);
    setContextMenu(null);
    setImagePlacement(null);
    setGifPlacement(null);
    if (tool === "question") {
      setTextPlacement(null);
      setPlacement(pos);
    } else {
      setPlacement(null);
      setTextPlacement(pos);
    }
  };

  // Hold-Z pie menu — north fires question placement, west fires text
  // placement (same code path as the Q/T shortcuts and toolbar buttons).
  const canEditCanvas = useCanEditCanvas();
  const { pieState, pieStateRef, closePie } = useCanvasPieMenu({
    containerRef,
    enabled: canEditCanvas,
    isBlocked: () =>
      Boolean(
        placementRef.current ||
          textPlacementRef.current ||
          imagePlacementRef.current ||
          gifPlacementRef.current ||
          marqueeState.current ||
          panState.current ||
          useCanvasStore.getState().plugDrag,
      ),
    getCursor: () => canvasPointerRef.current ?? cursorRef.current,
    onSelect: (sector) => {
      if (sector === "north") beginPlacementAtCursor("question");
      else if (sector === "west") beginPlacementAtCursor("text");
    },
  });

  const beginImagePlacementAtCursor = (asset: {
    id: string;
    publicUrl: string;
    aspectRatio?: number;
  }) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvasPtr = canvasPointerRef.current;
    const cursor = cursorRef.current;
    const rawX = canvasPtr?.x ?? cursor?.x ?? rect.left + rect.width / 2;
    const rawY = canvasPtr?.y ?? cursor?.y ?? rect.top + rect.height / 2;
    const clientX = Math.min(rect.right, Math.max(rect.left, rawX));
    const clientY = Math.min(rect.bottom, Math.max(rect.top, rawY));
    const world = computeWorldFromClient(clientX, clientY);
    if (!world) return;
    const pos = placementWorld(world);
    setContextMenu(null);
    setPlacement(null);
    setTextPlacement(null);
    setGifPlacement(null);
    setImagePlacement({
      assetId: asset.id,
      previewUrl: asset.publicUrl,
      aspectRatio: asset.aspectRatio && asset.aspectRatio > 0 ? asset.aspectRatio : 1,
      ...pos,
    });
  };

  const beginGifPlacementAtCursor = (input: SpawnCanvasGifInput) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvasPtr = canvasPointerRef.current;
    const cursor = cursorRef.current;
    const rawX = canvasPtr?.x ?? cursor?.x ?? rect.left + rect.width / 2;
    const rawY = canvasPtr?.y ?? cursor?.y ?? rect.top + rect.height / 2;
    const clientX = Math.min(rect.right, Math.max(rect.left, rawX));
    const clientY = Math.min(rect.bottom, Math.max(rect.top, rawY));
    const world = computeWorldFromClient(clientX, clientY);
    if (!world) return;
    const pos = placementWorld(world);
    setContextMenu(null);
    setPlacement(null);
    setTextPlacement(null);
    setImagePlacement(null);
    setGifPlacement({ ...input, ...pos });
  };

  useEffect(() => {
    if (!canvasPlacementRequest) return;
    beginPlacementAtCursor(canvasPlacementRequest);
    useCanvasStore.setState({ canvasPlacementRequest: null });
  }, [canvasPlacementRequest]);

  useEffect(() => {
    if (!imagePlacementAssetId) return;
    const asset = useCanvasStore.getState().canvasAssets[imagePlacementAssetId];
    useCanvasStore.setState({ imagePlacementAssetId: null });
    if (!asset) return;
    beginImagePlacementAtCursor(asset);
  }, [imagePlacementAssetId]);

  useEffect(() => {
    if (!gifPlacementRequest) return;
    const input = gifPlacementRequest;
    useCanvasStore.setState({ gifPlacementRequest: null });
    beginGifPlacementAtCursor(input);
  }, [gifPlacementRequest]);

  useEffect(() => {
    const mode = placement
      ? "question"
      : textPlacement || imagePlacement || gifPlacement
        ? "text"
        : null;
    if (useCanvasStore.getState().activeCanvasPlacement !== mode) {
      useCanvasStore.setState({ activeCanvasPlacement: mode });
    }
  }, [placement, textPlacement, imagePlacement, gifPlacement]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
          return;
        }
      }
      e.preventDefault();
      spaceHeldRef.current = true;
      setSpaceHeld(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      spaceHeldRef.current = false;
      setSpaceHeld(false);
    };
    const onBlur = () => {
      spaceHeldRef.current = false;
      setSpaceHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const computeWorldFromClient = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const { x: vx, y: vy, scale } = useCanvasStore.getState().viewport;
    return {
      x: (clientX - rect.left - vx) / scale,
      y: (clientY - rect.top - vy) / scale,
    };
  };

  /** World coordinates are unbounded — cards stay where you place them on the canvas. */
  const placementWorld = (world: PlacementState): PlacementState => world;

  const rootCardPositionAtPointer = (worldX: number, worldY: number) => {
    const tuning = RESOLVED_CANVAS_TUNING;
    return {
      x: worldX - tuning.cardWidth / 2,
      y: worldY - tuning.emptyCardHeight / 2,
    };
  };

  const maybeFocusNewCard = (cardId: string) => {
    requestCanvasFocus(() => focusCanvasCard(cardId));
  };

  // Seed the home card as soon as the container has size (do not wait on cloud load).
  useLayoutEffect(() => {
    if (!containerReady) return;
    const el = containerRef.current;
    if (!el) return;

    const seedIfEmpty = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const state = useCanvasStore.getState();
      if (state.cardOrder.length > 0 || seedingRef.current) return;

      seedingRef.current = true;
      resetViewportBootstrap();
      createRootCard({ x: 0, y: 0 });
      const focal = landingStackViewportCenter(RESOLVED_CANVAS_TUNING);
      setViewport(
        viewportCenteredOnWorldPoint(
          focal.x,
          focal.y,
          rect.width,
          rect.height,
          1,
        ),
      );
      markViewportBootstrapApplied();
    };

    seedIfEmpty();
    const ro = new ResizeObserver(seedIfEmpty);
    ro.observe(el);
    return () => ro.disconnect();
  }, [
    cardOrder.length,
    containerReady,
    createRootCard,
    setViewport,
  ]);

  // After persistence hydrates, center on the first card if we have not yet.
  useEffect(() => {
    if (!persistenceReady) return;

    const el = containerRef.current;
    if (!el) return;
    if (isViewportBootstrapApplied()) return;

    const bootstrap = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const state = useCanvasStore.getState();
      if (state.cardOrder.length === 0) return;
      if (isViewportBootstrapApplied()) return;

      if (isViewportRestoredFromSnapshot()) {
        markViewportBootstrapApplied();
        return;
      }

      const landingId = getLandingCardId(state.cards, state.cardOrder);
      if (landingId) {
        const focal = landingStackViewportCenter(RESOLVED_CANVAS_TUNING);
        setViewport(
          viewportCenteredOnWorldPoint(
            focal.x,
            focal.y,
            rect.width,
            rect.height,
            1,
          ),
        );
        markViewportBootstrapApplied();
        return;
      }

      const first = state.cards[state.cardOrder[0]];
      if (!first) return;

      const { cardWidth, emptyCardHeight } = RESOLVED_CANVAS_TUNING;
      const w = first.size?.w ?? cardWidth;
      const h = first.size?.h ?? emptyCardHeight;
      setViewport(
        viewportCenteredOnWorldPoint(
          first.position.x + w / 2,
          first.position.y + h / 2,
          rect.width,
          rect.height,
          1,
        ),
      );
      markViewportBootstrapApplied();
    };

    bootstrap();
  }, [persistenceReady, setViewport]);

  // Snap follow-up chains to measured content height after hydrate / topology changes.
  useEffect(() => {
    if (!persistenceReady) return;
    if (cardOrder.length === 0) return;
    const t = window.setTimeout(() => {
      useCanvasStore.getState().relayoutCanvasFromDom();
    }, 150);
    return () => window.clearTimeout(t);
  }, [persistenceReady, cardOrder.length]);

  // Keep the landing stack in view when resuming an empty canvas (e.g. saved pan).
  useEffect(() => {
    if (!showLanding) {
      landingViewportCenteredRef.current = false;
      return;
    }
    if (landingViewportCenteredRef.current) return;

    const el = containerRef.current;
    if (!el) return;

    const centerLanding = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const scale = useCanvasStore.getState().viewport.scale;
      const tuning = RESOLVED_CANVAS_TUNING;
      const focal = landingStackViewportCenter(tuning);
      setViewport(
        viewportCenteredOnWorldPoint(
          focal.x,
          focal.y,
          rect.width,
          rect.height,
          scale,
        ),
      );
      landingViewportCenteredRef.current = true;
    };

    centerLanding();
    const ro = new ResizeObserver(centerLanding);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showLanding, setViewport]);

  // Prevent native page zoom (pinch / Ctrl+wheel) while interacting with the canvas.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventGesture = (e: Event) => e.preventDefault();
    el.addEventListener("gesturestart", preventGesture);
    el.addEventListener("gesturechange", preventGesture);
    el.addEventListener("gestureend", preventGesture);
    return () => {
      el.removeEventListener("gesturestart", preventGesture);
      el.removeEventListener("gesturechange", preventGesture);
      el.removeEventListener("gestureend", preventGesture);
    };
  }, []);

  // Track cursor position globally; also update ghost position when in placement.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
      if (placementRef.current) {
        const world = computeWorldFromClient(e.clientX, e.clientY);
        if (world) setPlacement(placementWorld(world));
      }
      if (textPlacementRef.current) {
        const world = computeWorldFromClient(e.clientX, e.clientY);
        if (world) setTextPlacement(placementWorld(world));
      }
      if (imagePlacementRef.current) {
        const world = computeWorldFromClient(e.clientX, e.clientY);
        if (world) {
          setImagePlacement((prev) =>
            prev ? { ...prev, ...placementWorld(world) } : prev,
          );
        }
      }
      if (gifPlacementRef.current) {
        const world = computeWorldFromClient(e.clientX, e.clientY);
        if (world) {
          setGifPlacement((prev) =>
            prev ? { ...prev, ...placementWorld(world) } : prev,
          );
        }
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Paste a YouTube URL onto the canvas background to create a video artifact.
  // Editable fields (textareas/inputs/contentEditable) keep native paste so the
  // text-component conversion and the question composer are not hijacked here.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        return;
      }
      const text = e.clipboardData?.getData("text/plain") ?? "";
      const url = text.trim();
      if (!isYoutubeUrl(url)) return;

      e.preventDefault();

      const cursor = cursorRef.current;
      const world = cursor
        ? computeWorldFromClient(cursor.x, cursor.y)
        : null;
      const center = useCanvasStore.getState().viewport;
      void (async () => {
        const meta = await fetchYoutubeMeta(url);
        const position = world
          ? {
              x: world.x - CANVAS_ARTIFACT_WIDTH / 2,
              y: world.y - 140,
            }
          : {
              x: -center.x / center.scale,
              y: -center.y / center.scale,
            };
        createVideoArtifactFromUrl(url, {
          title: meta.title,
          thumb: meta.thumb,
          position,
        });
      })();
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [createVideoArtifactFromUrl]);

  // Q (enter placement) / Esc (cancel placement). Capture phase so Q works as a
  // canvas tool shortcut even when an empty question field is focused.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Closing the pie consumes the press — it must not also clear the
        // canvas selection in the same keystroke.
        if (pieStateRef.current) {
          e.preventDefault();
          closePie();
          return;
        }
        if (placementRef.current) {
          e.preventDefault();
          setPlacement(null);
        }
        if (textPlacementRef.current) {
          e.preventDefault();
          setTextPlacement(null);
        }
        if (imagePlacementRef.current) {
          e.preventDefault();
          setImagePlacement(null);
        }
        if (gifPlacementRef.current) {
          e.preventDefault();
          setGifPlacement(null);
        }
        setContextMenu(null);
        useCanvasStore.getState().clearSelection();
        useCanvasStore.getState().selectCanvasTextLabel(null);
        return;
      }

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedCanvasTextLabelId
      ) {
        const target = e.target as HTMLElement | null;
        if (target) {
          const tag = target.tagName;
          if (
            tag === "INPUT" ||
            tag === "TEXTAREA" ||
            target.isContentEditable
          ) {
            return;
          }
        }
        e.preventDefault();
        removeCanvasTextLabel(selectedCanvasTextLabelId);
        return;
      }

      if (e.code !== "KeyQ" || e.repeat || e.ctrlKey || e.metaKey || e.altKey)
        return;

      // Pie accelerator — Q while the pie is held open fires the north
      // sector through this same code path; just dismiss the pie first.
      if (pieStateRef.current) closePie();

      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") {
          const field = target as HTMLInputElement | HTMLTextAreaElement;
          if (field.value.trim().length > 0) return;
        } else if (target.isContentEditable) {
          return;
        }
      }

      if (
        placementRef.current ||
        textPlacementRef.current ||
        imagePlacementRef.current ||
        gifPlacementRef.current
      ) {
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvasPtr = canvasPointerRef.current;
      const cursor = cursorRef.current;
      const rawX = canvasPtr?.x ?? cursor?.x ?? rect.left + rect.width / 2;
      const rawY = canvasPtr?.y ?? cursor?.y ?? rect.top + rect.height / 2;
      const clientX = Math.min(rect.right, Math.max(rect.left, rawX));
      const clientY = Math.min(rect.bottom, Math.max(rect.top, rawY));
      const world = computeWorldFromClient(clientX, clientY);
      if (!world) return;

      e.preventDefault();
      e.stopPropagation();
      setContextMenu(null);
      setTextPlacement(null);
      setImagePlacement(null);
      setGifPlacement(null);
      target?.blur();
      setPlacement(placementWorld(world));
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [closePie, pieStateRef, removeCanvasTextLabel, selectedCanvasTextLabelId]);

  // T (enter text placement) — same rules as Q for focused inputs.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyT" || e.repeat || e.ctrlKey || e.metaKey || e.altKey)
        return;

      // Pie accelerator — T fires the west sector via this same path.
      if (pieStateRef.current) closePie();

      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (target.isContentEditable) return;
      }

      if (
        placementRef.current ||
        textPlacementRef.current ||
        imagePlacementRef.current ||
        gifPlacementRef.current
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setContextMenu(null);
      setPlacement(null);
      target?.blur();
      beginPlacementAtCursor("text");
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [closePie, pieStateRef]);

  // Window-level click handler that finalises placement and consumes the event
  // so it doesn't focus inputs or trigger pan on the underlying surface.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      const gifPos = gifPlacementRef.current;
      if (gifPos) {
        e.preventDefault();
        e.stopPropagation();
        const aspect = gifPos.aspectRatio > 0 ? gifPos.aspectRatio : 1;
        const w = DEFAULT_GIF_WIDTH;
        spawnCanvasGif(
          {
            url: gifPos.url,
            previewUrl: gifPos.previewUrl,
            title: gifPos.title,
            category: gifPos.category,
            aspectRatio: aspect,
            sourceId: gifPos.sourceId,
          },
          {
            position: { x: gifPos.x - w / 2, y: gifPos.y - w / aspect / 2 },
            focus: true,
          },
        );
        setGifPlacement(null);
        return;
      }

      const imagePos = imagePlacementRef.current;
      if (imagePos) {
        e.preventDefault();
        e.stopPropagation();
        const asset = useCanvasStore.getState().canvasAssets[imagePos.assetId];
        if (asset) {
          const bounds = getCanvasAssetBounds({}, asset);
          spawnCanvasAsset(imagePos.assetId, {
            position: {
              x: imagePos.x - bounds.w / 2,
              y: imagePos.y - bounds.h / 2,
            },
            focus: true,
          });
        }
        setImagePlacement(null);
        return;
      }

      const textPos = textPlacementRef.current;
      if (textPos) {
        e.preventDefault();
        e.stopPropagation();
        const id = spawnCanvasTextLabel({
          x: textPos.x,
          y: textPos.y - CANVAS_TEXT_LABEL_FONT_SIZE / 2,
        });
        setAutoEditLabelId(id);
        setTextPlacement(null);
        return;
      }

      if (!placementRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const world =
        computeWorldFromClient(e.clientX, e.clientY) ?? placementRef.current;
      const cardId = createRootCard(
        rootCardPositionAtPointer(world.x, world.y),
      );
      maybeFocusNewCard(cardId);
      setPlacement(null);
    };
    // Capture phase so we run before any element's own listeners (including
    // textareas trying to receive focus on click).
    window.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      window.removeEventListener("pointerdown", onPointerDown, true);
  }, [createRootCard, spawnCanvasAsset, spawnCanvasGif, spawnCanvasTextLabel]);

  const placeCanvasAsset = (
    assetId: string,
    world: { x: number; y: number },
    index = 0,
  ) => {
    const asset = useCanvasStore.getState().canvasAssets[assetId];
    if (!asset) return;
    const bounds = getCanvasAssetBounds({}, asset);
    const offset = index * 28;
    spawnCanvasAsset(assetId, {
      position: {
        x: world.x - bounds.w / 2 + offset,
        y: world.y - bounds.h / 2 + offset,
      },
      focus: true,
    });
  };

  const importImagesAtWorld = async (
    files: File[],
    world: { x: number; y: number },
  ) => {
    if (!files.length) return false;
    const result = await uploadAssetFiles(
      files,
      user && activeCanvasId
        ? { userId: user.id, canvasId: activeCanvasId }
        : null,
    );
    result.assets.forEach((asset, index) => {
      addCanvasAsset(asset);
      placeCanvasAsset(asset.id, world, index);
    });
    if (result.errors.length > 0) {
      setAssetDropErrors(result.errors);
    }
    return result.assets.length > 0;
  };

  // Paste images or URLs on canvas at cursor.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (target.isContentEditable) return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvasPtr = canvasPointerRef.current;
      const cursor = cursorRef.current;
      const rawX = canvasPtr?.x ?? cursor?.x ?? rect.left + rect.width / 2;
      const rawY = canvasPtr?.y ?? cursor?.y ?? rect.top + rect.height / 2;
      const clientX = Math.min(rect.right, Math.max(rect.left, rawX));
      const clientY = Math.min(rect.bottom, Math.max(rect.top, rawY));
      const world = computeWorldFromClient(clientX, clientY);
      if (!world) return;

      const imageFiles = getImageFilesFromDataTransfer(e.clipboardData);
      if (imageFiles.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu(null);
        setPlacement(null);
        setImagePlacement(null);
        setGifPlacement(null);
        void importImagesAtWorld(imageFiles, world);
        return;
      }

      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text.trim()) return;

      if (!createUrlArtifactFromText(text, world)) return;

      e.preventDefault();
      e.stopPropagation();
      setContextMenu(null);
      setPlacement(null);
      setImagePlacement(null);
      setGifPlacement(null);
    };

    window.addEventListener("paste", onPaste, true);
    return () => window.removeEventListener("paste", onPaste, true);
  }, [user, activeCanvasId]);

  const handleNativeFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const world = computeWorldFromClient(e.clientX, e.clientY);
    if (!world) return;

    const imageFiles = getImageFilesFromDataTransfer(e.dataTransfer);
    if (imageFiles.length > 0) {
      await importImagesAtWorld(imageFiles, world);
      return;
    }

    const draggedImage = await resolveImageFileFromDataTransfer(e.dataTransfer);
    if (draggedImage) {
      const ok = await importImagesAtWorld([draggedImage], world);
      if (ok) return;
      setAssetDropErrors([
        {
          code: "upload-failed",
          message:
            "Could not import that image. Try saving it locally, then drag the file onto the canvas.",
        },
      ]);
      return;
    }

    if (e.dataTransfer.files.length > 0) {
      const result = await uploadAssetFiles(
        e.dataTransfer.files,
        user && activeCanvasId
          ? { userId: user.id, canvasId: activeCanvasId }
          : null,
      );
      result.assets.forEach((asset, index) => {
        addCanvasAsset(asset);
        placeCanvasAsset(asset.id, world, index);
      });
      setAssetDropErrors(result.errors);
    }
  };

  const handleSidebarDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = parseSidebarDragPayload(e.dataTransfer);
    if (!payload) return;

    if (payload.kind === "artifact") {
      const art = sessionArtifacts[payload.artifactId];
      if (!art) return;
      const world = computeWorldFromClient(e.clientX, e.clientY);
      if (!world) return;
      const { w: artWidth, h: artHeight } = getArtifactBounds({}, art);
      useCanvasStore.getState().ensureCanvasArtifactAt(
        payload.artifactId,
        payload.versionId,
        {
          x: world.x - artWidth / 2,
          y: world.y - artHeight / 2,
        },
      );
      requestCanvasFocus(() => focusCanvasArtifact(payload.artifactId));
      return;
    }

    if (payload.kind === "asset") {
      const world = computeWorldFromClient(e.clientX, e.clientY);
      if (!world) return;
      placeCanvasAsset(payload.assetId, world);
      return;
    }

    if (payload.kind === "skill") {
      const world = computeWorldFromClient(e.clientX, e.clientY);
      if (!world) return;
      spawnCanvasSkill(payload.skillId, {
        position: {
          x: world.x - CANVAS_SKILL_SIZE / 2,
          y: world.y - CANVAS_SKILL_SIZE / 2,
        },
        focus: true,
      });
      return;
    }

    if (payload.kind === "gif") {
      const world = computeWorldFromClient(e.clientX, e.clientY);
      if (!world) return;
      const aspect = payload.aspectRatio > 0 ? payload.aspectRatio : 1;
      const w = DEFAULT_GIF_WIDTH;
      spawnCanvasGif(
        {
          url: payload.url,
          previewUrl: payload.previewUrl,
          title: payload.title,
          category: payload.category,
          aspectRatio: aspect,
          sourceId: payload.sourceId,
        },
        {
          position: { x: world.x - w / 2, y: world.y - w / aspect / 2 },
          focus: true,
        },
      );
      setGifPickerOpen(false);
      return;
    }

    const world = computeWorldFromClient(e.clientX, e.clientY);
    if (!world) return;
    const att = uploadedAttachments.find((a) => a.id === payload.attachmentId);
    if (!att) return;
    const pos = rootCardPositionAtPointer(world.x, world.y);
    const cardId = createRootCard(pos);
    updateCard(cardId, {
      pendingFiles: [uploadedToPending(att)],
    });
    maybeFocusNewCard(cardId);
  };

  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("application/x-flowstate-item")) {
      allowSidebarDrop(e);
      return;
    }
    if (isExternalImageDrag(e.dataTransfer.types)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      return;
    }
    allowSidebarDrop(e);
  };

  const handleCanvasDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("application/x-flowstate-item")) {
      handleSidebarDrop(e);
      return;
    }
    if (
      e.dataTransfer.files.length > 0 ||
      isExternalImageDrag(e.dataTransfer.types)
    ) {
      await handleNativeFileDrop(e);
      return;
    }
    handleSidebarDrop(e);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (
      pieStateRef.current ||
      placementRef.current ||
      textPlacementRef.current ||
      imagePlacementRef.current ||
      gifPlacementRef.current
    ) {
      return;
    }
    if ((e.target as HTMLElement).closest("[data-canvas-card]")) return;
    if ((e.target as HTMLElement).closest("[data-canvas-artifact]")) return;
    if ((e.target as HTMLElement).closest("[data-canvas-asset]")) return;
    if ((e.target as HTMLElement).closest("[data-canvas-gif]")) return;
    if ((e.target as HTMLElement).closest("[data-canvas-skill]")) return;
    if ((e.target as HTMLElement).closest("[data-canvas-text-label]")) return;
    setContextMenu({ screenX: e.clientX, screenY: e.clientY });
  };

  const handleAddTextAtContextMenu = () => {
    if (!contextMenu) return;
    const world = computeWorldFromClient(
      contextMenu.screenX,
      contextMenu.screenY,
    );
    if (!world) return;
    const id = spawnCanvasTextLabel({
      x: world.x,
      y: world.y - CANVAS_TEXT_LABEL_FONT_SIZE / 2,
    });
    setAutoEditLabelId(id);
  };

  const applyMarqueeAt = (clientX: number, clientY: number) => {
    const ms = marqueeState.current;
    if (!ms) return;

    const x1 = Math.min(ms.startX, clientX);
    const y1 = Math.min(ms.startY, clientY);
    const x2 = Math.max(ms.startX, clientX);
    const y2 = Math.max(ms.startY, clientY);

    const w1 = computeWorldFromClient(x1, y1);
    const w2 = computeWorldFromClient(x2, y2);
    if (!w1 || !w2) return;

    const state = useCanvasStore.getState();
    const rectSelection = collectCanvasItemsInWorldRect(state, {
      x1: Math.min(w1.x, w2.x),
      y1: Math.min(w1.y, w2.y),
      x2: Math.max(w1.x, w2.x),
      y2: Math.max(w1.y, w2.y),
    });
    state.setCanvasSelection(
      ms.baseSelection
        ? mergeCanvasSelections(ms.baseSelection, rectSelection)
        : rectSelection,
    );
  };

  const isCanvasBackgroundTarget = (target: HTMLElement) =>
    !target.closest("[data-canvas-card]") &&
    !target.closest("[data-canvas-artifact]") &&
    !target.closest("[data-canvas-asset]") &&
    !target.closest("[data-canvas-gif]") &&
    !target.closest("[data-canvas-text-label]") &&
    !target.closest("[data-canvas-landing]") &&
    !target.closest("[data-group-summary-icon]");

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // While the pie is held open the gesture owns the pointer — no pan,
    // marquee, or selection clearing underneath.
    if (pieStateRef.current) return;
    if (
      placementRef.current ||
      textPlacementRef.current ||
      imagePlacementRef.current ||
      gifPlacementRef.current
    ) {
      return;
    }
    if (useCanvasStore.getState().plugDrag) return;
    const target = e.target as HTMLElement;
    if (!isCanvasBackgroundTarget(target)) return;
    setContextMenu(null);
    if (e.button !== 0) return;

    const el = e.currentTarget as HTMLDivElement;
    el.setPointerCapture(e.pointerId);

    if (spaceHeldRef.current) {
      panState.current = {
        pointerId: e.pointerId,
        lastX: e.clientX,
        lastY: e.clientY,
      };
      return;
    }

    const additive = e.shiftKey || e.ctrlKey || e.metaKey;
    marqueeState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseSelection: additive
        ? {
            familyRootIds: [
              ...useCanvasStore.getState().selectedFamilyRootIds,
            ],
            items: [...useCanvasStore.getState().canvasSelection],
          }
        : null,
    };
    setMarqueeRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
    if (!additive) clearSelection();
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    canvasPointerRef.current = { x: e.clientX, y: e.clientY };

    const ms = marqueeState.current;
    if (ms && ms.pointerId === e.pointerId) {
      const x = Math.min(ms.startX, e.clientX);
      const y = Math.min(ms.startY, e.clientY);
      const w = Math.abs(e.clientX - ms.startX);
      const h = Math.abs(e.clientY - ms.startY);
      setMarqueeRect({ x, y, w, h });
      if (w >= MARQUEE_MIN_DRAG_PX || h >= MARQUEE_MIN_DRAG_PX) {
        applyMarqueeAt(e.clientX, e.clientY);
      }
      return;
    }

    const ps = panState.current;
    if (!ps || ps.pointerId !== e.pointerId) return;
    const dx = e.clientX - ps.lastX;
    const dy = e.clientY - ps.lastY;
    ps.lastX = e.clientX;
    ps.lastY = e.clientY;
    queuePan(dx, dy);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const ms = marqueeState.current;
    if (ms && ms.pointerId === e.pointerId) {
      const w = Math.abs(e.clientX - ms.startX);
      const h = Math.abs(e.clientY - ms.startY);
      if (w >= MARQUEE_MIN_DRAG_PX || h >= MARQUEE_MIN_DRAG_PX) {
        applyMarqueeAt(e.clientX, e.clientY);
      } else if (!ms.baseSelection) {
        clearSelection();
      }
      marqueeState.current = null;
      setMarqueeRect(null);
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      return;
    }

    const ps = panState.current;
    if (!ps || ps.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    panState.current = null;
  };

  return (
    <div
      ref={setContainerRef}
      data-canvas-container
      style={fontPreviewStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={handleContextMenu}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      className={`absolute inset-0 overflow-hidden bg-canvas-bg font-sans select-none touch-none ${
        placement || textPlacement || imagePlacement || gifPlacement
          ? "cursor-crosshair"
          : spaceHeld
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-crosshair"
      }`}
    >
      <CanvasBackgroundLayer />
      <CanvasViewport>
        <PlugConnectorLayer />
        <ArtifactPlugConnections />
        <SkillPlugConnections />
        {groupList.map((group) => (
          <GroupBounds key={group.id} group={group} />
        ))}
        {cardOrder.map((id) => {
          const card = cards[id];
          if (!card) return null;
          if (hiddenCardIds.has(id)) return null;
          if (cullingEnabled && visibleNodes && !visibleNodes.cards.has(id)) {
            return null;
          }
          return <Card key={id} card={card} />;
        })}
        {canvasArtifactOrder.map((id) => {
          const node = canvasArtifactNodes[id];
          if (!node) return null;
          if (
            cullingEnabled &&
            visibleNodes &&
            !visibleNodes.artifacts.has(id)
          ) {
            return null;
          }
          return <CanvasArtifactNode key={id} node={node} />;
        })}
        {canvasAssetOrder.map((id) => {
          const node = canvasAssetNodes[id];
          if (!node) return null;
          if (cullingEnabled && visibleNodes && !visibleNodes.assets.has(id)) {
            return null;
          }
          return <CanvasAssetNode key={id} node={node} />;
        })}
        {canvasGifOrder.map((id) => {
          const node = canvasGifNodes[id];
          if (!node) return null;
          if (cullingEnabled && visibleNodes && !visibleNodes.gifs.has(id)) {
            return null;
          }
          return <CanvasGifNode key={id} node={node} />;
        })}
        {canvasSkillOrder.map((id) => {
          const node = canvasSkillNodes[id];
          if (!node) return null;
          if (cullingEnabled && visibleNodes && !visibleNodes.skills.has(id)) {
            return null;
          }
          return <CanvasSkillNode key={id} node={node} />;
        })}
        {canvasTextLabelOrder.map((id) => {
          const label = canvasTextLabels[id];
          if (!label) return null;
          if (cullingEnabled && visibleNodes && !visibleNodes.labels.has(id)) {
            return null;
          }
          return (
            <CanvasTextLabelNode
              key={id}
              label={label}
              startEditing={autoEditLabelId === id}
            />
          );
        })}
        {groupList.map((group) =>
          group.summaryMarkdown ? (
            <GroupSummaryIcon key={`summary-icon-${group.id}`} group={group} />
          ) : null,
        )}
        <Connections />
        {placement && <GhostCard world={placement} />}
        {textPlacement && <GhostTextLabel world={textPlacement} />}
        {imagePlacement && <GhostImage world={imagePlacement} />}
        {gifPlacement && <GhostGif world={gifPlacement} />}
      </CanvasViewport>
      {showLanding && !placement && landingCardId && (
        <CanvasLandingOverlay cardId={landingCardId} />
      )}
      <SelectionOverlay rect={marqueeRect} />
      {/* Hidden while a marquee drag is in progress — the bar only appears on mouse release. */}
      {!marqueeRect && <SelectionToolbar />}
      {assetDropErrors.length > 0 && (
        <div className="pointer-events-auto absolute left-1/2 top-4 z-50 max-w-md -translate-x-1/2 rounded-canvas border border-red-300/60 bg-red-50 px-3 py-2 text-canvas-body-sm text-red-700 shadow-card">
          {assetDropErrors.slice(0, 3).map((error, index) => (
            <p key={`${error.code}-${error.fileName ?? index}`}>
              {error.message}
            </p>
          ))}
          {assetDropErrors.length > 3 && (
            <p>{assetDropErrors.length - 3} more upload errors.</p>
          )}
          <button
            type="button"
            onClick={() => setAssetDropErrors([])}
            className="mt-1 text-canvas-body-sm font-medium text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}
      {contextMenu && (
        <CanvasContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onAddText={handleAddTextAtContextMenu}
        />
      )}
      <CollaboratorCursors
        containerRef={containerRef}
        channelRef={presenceChannelRef}
        currentUserId={user?.id}
      />
      <CanvasPieMenu state={pieState} />
    </div>
  );
}

function GhostTextLabel({ world }: { world: PlacementState }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute font-medium leading-tight text-canvas-ink/50"
      style={{
        left: world.x,
        top: world.y - CANVAS_TEXT_LABEL_FONT_SIZE / 2,
        fontSize: CANVAS_TEXT_LABEL_FONT_SIZE,
      }}
    >
      Text
    </div>
  );
}

function GhostImage({ world }: { world: ImagePlacementState }) {
  const w = DEFAULT_ASSET_IMAGE_WIDTH;
  const h = w / (world.aspectRatio > 0 ? world.aspectRatio : 1);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute overflow-hidden rounded-canvas opacity-50 ring-1 ring-dashed ring-canvas-border"
      style={{
        left: world.x - w / 2,
        top: world.y - h / 2,
        width: w,
        height: h,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={world.previewUrl}
        alt=""
        draggable={false}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

function GhostGif({ world }: { world: GifPlacementState }) {
  const w = DEFAULT_GIF_WIDTH;
  const h = w / (world.aspectRatio > 0 ? world.aspectRatio : 1);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute overflow-hidden rounded-canvas opacity-60 ring-1 ring-dashed ring-canvas-border"
      style={{
        left: world.x - w / 2,
        top: world.y - h / 2,
        width: w,
        height: h,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={world.previewUrl}
        alt=""
        draggable={false}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

function GhostCard({ world }: { world: PlacementState }) {
  const tuning = RESOLVED_CANVAS_TUNING;
  const pos = {
    x: world.x - tuning.cardWidth / 2,
    y: world.y - tuning.emptyCardHeight / 2,
  };
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute rounded-canvas border border-dashed border-canvas-border bg-canvas-card/85 shadow-card"
      style={{
        left: pos.x,
        top: pos.y,
        width: tuning.cardWidth,
      }}
    >
      <div className="floating-chrome-padding">
        <div className="flex items-center gap-0 rounded-canvas border border-dashed border-canvas-border/80 bg-canvas-card/90 px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas-bg text-canvas-heading font-light text-canvas-muted">
            +
          </span>
          <span className="mx-1 h-6 w-px shrink-0 bg-canvas-border" aria-hidden />
          <span className="min-w-0 flex-1 py-2 text-canvas-body text-canvas-muted/60">
            Ask anything
          </span>
          <SendIconPreview className="opacity-80" />
        </div>
        <p className="mt-2 text-center text-canvas-caption text-canvas-muted">
          Click to place, Esc to cancel
        </p>
      </div>
    </div>
  );
}
