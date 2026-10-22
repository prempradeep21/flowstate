"use client";

import {
  Component,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArtifactShell } from "@/components/artifacts/ArtifactShell";
import { ContextMenuItem, PencilIcon, TypeIcon } from "@/components/MenuIcons";
import { STYLE_D } from "@/components/artifactStyles/styleD";
import { resolveSlots } from "@/components/artifactStyles";
import { fontPairStyle } from "@/components/artifactStyles/fonts";
import type {
  ArtifactRenderContext,
  CanvasMenuActions,
  ChromeState,
} from "@/components/artifactStyles/types";
import { NEST_INSET } from "@/components/artifactStyles/styleD/tokens";
import type {
  ArtifactVariant,
  StudioArtifactItem,
} from "@/lib/artifactStudio/pool";
import {
  isVideoArtifactPayload,
  payloadToArtifactKind,
  type ArtifactKind,
  type ArtifactPayload,
} from "@/lib/artifactTypes";
import { HugContext } from "@/components/artifactStyles/hug";
import { focusCanvasWorldRect } from "@/lib/canvasFocus";
import { computeGroupBounds } from "@/lib/groupBounds";
import { getFrostDefaultArtifactSize } from "@/lib/canvasNodeBounds";
import { CANVAS_CONTENT_INERT_CLASS } from "@/lib/canvasNodeInteraction";
import { artifactCategoryOf } from "@/lib/design/theme/artifactCategories";
import {
  getLatestVersion,
  getVersionById,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import { normalizeStickyNotePayload } from "@/lib/stickyNoteArtifact";
import { useCanvasStore } from "@/lib/store";
import { FrostEmptyBody, FrostErrorBoundary, isEmptyPayload } from "./FrostStates";

/**
 * Frost on the canvas — every artifact node drawn through Artifact Studio's
 * Style D frame and bodies (components/artifactStyles/styleD is the one
 * source of truth for how a Frost artifact looks; this file only adapts a
 * canvas node to the studio's render context).
 *
 *   Rest / selected — the Frost body: the title set inside the graphic, hero
 *                     kinds on flat lime / ink / sage, the ⋯ corner circle.
 *   Edit            — editable kinds (double-click or ⋯ → Edit) swap the body
 *                     for the live editor inside the same frost frame; Frost
 *                     CSS restyles it (app/styles/frost/frost-artifacts.css).
 *   Live kinds      — kinds without a Frost body (map, 3D, embed, custom…) set
 *                     their live content in a well (Style D's InsetBody).
 *
 * Spec: docs/design-system/frost-canvas-readiness-audit.md ("Decisions").
 */

/**
 * Frost's least card width per kind (canvas px). Stats get room for a title
 * and figure to sit on fewer lines than the vanilla 380.
 */
export const FROST_MIN_WIDTH: Partial<Record<ArtifactKind, number>> = {
  stat: 440,
  // The explorer's stage is REPO_ARTIFACT_WIDTH (1080) wide; the card adds
  // the media inset (24) on both sides so nothing on the stage is clipped.
  repo: 1080 + 2 * 24,
};

/**
 * The least width a card can be drawn at before a table inside it overflows
 * and gets cropped: the table's narrowest layout (its longest words) plus the
 * card's own padding around it. 0 when the card holds no table.
 */
function tableMinCardWidth(card: HTMLElement): number {
  let least = 0;
  for (const table of card.querySelectorAll("table")) {
    const parent = table.parentElement;
    if (!parent) continue;
    const prev = table.style.width;
    table.style.width = "0px";
    const tableMin = table.offsetWidth;
    table.style.width = prev;
    const around = card.offsetWidth - parent.clientWidth;
    least = Math.max(least, Math.ceil(tableMin + around));
  }
  return least;
}

/**
 * The scale a masthead artifact (the episode, its links) is drawn at under
 * Frost — node box and content together, as vanilla draws it at
 * MASTHEAD_ARTIFACT_SCALE. Frost type is about twice vanilla's, so it needs
 * a little over half the blow-up to read at the same size.
 */
export const FROST_MASTHEAD_ZOOM = 1.4;

/** Frame a group on the canvas — an episode's chapter row pressed. */
function focusCanvasGroup(groupId: string) {
  const state = useCanvasStore.getState();
  const group = state.groups[groupId];
  if (!group) return;
  const bounds = computeGroupBounds(state, group);
  if (!bounds) return;
  state.setActiveGroupId(groupId);
  focusCanvasWorldRect(bounds, { maxScale: 1 });
}

/** Kinds whose content can be edited — they get Edit (double-click / ⋯). */
export const FROST_EDITABLE_KINDS = new Set<ArtifactKind>([
  "table",
  "todo",
  "calendar",
  "timeline",
  "stickynote",
  "code",
]);

const FROST_FONTS: CSSProperties = fontPairStyle(STYLE_D.fonts);

/** Kind plus the sub-shape that renders differently (as the studio pool does). */
export function frostVariantOf(payload: ArtifactPayload): ArtifactVariant {
  if (payload.type === "chart") return `chart:${payload.data.chartType}`;
  if (payload.type === "video" || isVideoArtifactPayload(payload)) return "video";
  return payloadToArtifactKind(payload) as ArtifactVariant;
}

/** A canvas artifact as the studio item every Style D body reads. */
export function frostItemOf(
  uid: string,
  art: SessionArtifact,
  payload: ArtifactPayload,
  size: { w: number; h: number },
): StudioArtifactItem {
  const variant = frostVariantOf(payload);
  return {
    uid,
    artifact: art,
    payload,
    kind: art.kind,
    variant,
    category: artifactCategoryOf(variant === "video" ? "video" : art.kind),
    natural: size,
    source: "canvas",
    richness: 1,
  };
}

/**
 * A Frost body that throws (an unexpected payload shape) falls back to the
 * live content in a well — the artifact is still readable and editable.
 */
class FrostBodyBoundary extends Component<
  { resetKey: unknown; fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: { resetKey: unknown }) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** One Style D card: the frame, its body, the Frost fonts. */
export function FrostCard({
  ctx,
  body,
  className = "",
  style,
  hug = null,
  naturalFloor = 0,
  onHugHeight,
}: {
  ctx: ArtifactRenderContext;
  /** Overrides the variant's body (edit mode, skeletons, errors). */
  body?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /**
   * Hug the content (artifacts-frost.md §5): the least height the card is
   * drawn at (0 = pure content), or null to fill the node's fixed box.
   */
  hug?: number | null;
  /**
   * The least height the card's own content asks for (the style's floor),
   * without any row or user floor — what `natural` is measured against.
   */
  naturalFloor?: number;
  /**
   * Called with the card's own height whenever it changes (hugging only),
   * the least width it can be drawn at without cropping a table, the height
   * its content needs without any floor above `naturalFloor`, and the width
   * it was measured at.
   */
  onHugHeight?: (h: number, minW: number, natural: number, w: number) => void;
}) {
  const { Frame, Body } = resolveSlots(STYLE_D, ctx);
  const inert = !ctx.interactive ? CANVAS_CONTENT_INERT_CLASS : "";
  const hugging = hug != null;
  const rootRef = useRef<HTMLDivElement>(null);
  const onHugHeightRef = useRef(onHugHeight);
  onHugHeightRef.current = onHugHeight;
  const naturalFloorRef = useRef(naturalFloor);
  naturalFloorRef.current = naturalFloor;
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!hugging || !el) return;
    // offsetHeight is the layout height, untouched by the viewport transform.
    let last = "";
    const report = () => {
      const h = el.offsetHeight;
      const w = el.offsetWidth;
      const minW = tableMinCardWidth(el);
      // The content's own height: drop any floor above the style's for one
      // synchronous layout, then put it back.
      const prevMin = el.style.minHeight;
      el.style.minHeight = `${naturalFloorRef.current}px`;
      const natural = el.offsetHeight;
      el.style.minHeight = prevMin;
      const key = [h, w, minW, natural].map(Math.round).join(",");
      if (key === last) return;
      last = key;
      onHugHeightRef.current?.(h, minW, natural, w);
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hugging]);
  return (
    <div
      ref={rootRef}
      data-frost-node
      data-frost-variant={ctx.item.variant}
      {...(hugging ? { "data-frost-hug": "" } : {})}
      className={`relative w-full ${hugging ? "flex shrink-0 flex-col" : "h-full"} ${className}`}
      style={{ ...FROST_FONTS, ...(hugging ? { minHeight: hug } : null), ...style }}
    >
      <HugContext.Provider value={hugging}>
      <Frame
        ctx={ctx}
        header={null}
        body={
          <div className={`flex min-h-0 flex-1 flex-col ${inert}`}>
            {body ?? <Body ctx={ctx} />}
          </div>
        }
      />
      </HugContext.Provider>
    </div>
  );
}

/** ⋯ → Rename: the row turns into the title field. */
function RenameRow({
  art,
  close,
}: {
  art: SessionArtifact;
  close: () => void;
}) {
  const rename = useCanvasStore((s) => s.renameSessionArtifactTitle);
  const [draft, setDraft] = useState<string | null>(null);
  if (draft === null) {
    return (
      <ContextMenuItem
        icon={<TypeIcon />}
        label="Rename"
        onClick={() => setDraft(art.title)}
      />
    );
  }
  const commit = () => {
    const next = draft.trim();
    if (next && next !== art.title) rename(art.id, next);
    close();
  };
  return (
    <div className="px-2 py-1">
      <input
        autoFocus
        aria-label="Artifact title"
        data-frost-rename
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") commit();
          if (e.key === "Escape") close();
        }}
        onBlur={commit}
        className="w-full rounded-full px-3 py-1.5 text-[13px] outline-none"
      />
    </div>
  );
}

export function FrostArtifactNode({
  nodeId,
  art,
  versionId,
  size,
  isSelected,
  hovered,
  contentInteractive,
  editing,
  onEditingChange,
  sourceCardId,
  onVersionChange,
  onRemove,
  onTodoEditingChange,
  onArtifactContentAreaSizeChange,
  hug = false,
  sized = false,
  minHeight = 0,
  onHugHeight,
}: {
  nodeId: string;
  art: SessionArtifact;
  versionId: string;
  size: { w: number; h: number };
  isSelected: boolean;
  hovered: boolean;
  contentInteractive: boolean;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  sourceCardId: string;
  onVersionChange: (versionId: string) => void;
  onRemove: () => void;
  onTodoEditingChange: (editing: boolean) => void;
  onArtifactContentAreaSizeChange?: Parameters<
    typeof ArtifactShell
  >[0]["onArtifactContentAreaSizeChange"];
  /**
   * The card hugs its content and reports its height so the node follows it
   * (artifacts-frost.md §5 — every Frost card shows everything it holds).
   * `sized` says whether the user or a layout gave the node its size: then
   * picture kinds keep that height as their floor; otherwise the kind's
   * default height is.
   */
  hug?: boolean;
  sized?: boolean;
  /**
   * The height the user dragged the node to. The card fills at least this
   * much, and still grows past it when its content needs the room.
   */
  minHeight?: number;
  onHugHeight?: (h: number, minW: number, natural: number, w: number) => void;
}) {
  const mode = useCanvasStore((s) => s.canvasTheme);
  const readOnly = useCanvasStore((s) => s.canvasReadOnly);
  const saveTodoArtifactVersion = useCanvasStore(
    (s) => s.saveTodoArtifactVersion,
  );
  const saveStickyNoteArtifactVersion = useCanvasStore(
    (s) => s.saveStickyNoteArtifactVersion,
  );
  const restHRef = useRef(0);
  const version = getVersionById(art, versionId) ?? getLatestVersion(art);
  const payload = version?.payload;
  const isLatest = version?.id === art.latestVersionId;
  const editable = FROST_EDITABLE_KINDS.has(art.kind) && !readOnly;

  const chromeState: ChromeState = isSelected
    ? "selected"
    : hovered
      ? "hover"
      : "rest";

  const item = useMemo(
    () => (payload ? frostItemOf(nodeId, art, payload, size) : null),
    // Size only feeds `natural`, which bodies don't lay out from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodeId, art, payload],
  );

  const shell = (headless: boolean) => (
    <ArtifactShell
      layout="canvas"
      headless={headless}
      sessionArtifact={art}
      versionId={versionId}
      sourceCardId={sourceCardId}
      contentInteractive={contentInteractive}
      onVersionChange={onVersionChange}
      menuVariant="canvas"
      onRemoveFromCanvas={onRemove}
      onTodoEditingChange={onTodoEditingChange}
      onArtifactContentAreaSizeChange={onArtifactContentAreaSizeChange}
    />
  );

  const canvasMenu: CanvasMenuActions = {
    activeVersionId: versionId,
    onVersionChange,
    onRemove,
    extraRows: (close) => (
      <>
        {!readOnly ? <RenameRow art={art} close={close} /> : null}
        {editable && !editing ? (
          <ContextMenuItem
            icon={<PencilIcon />}
            label="Edit"
            onClick={() => {
              close();
              onEditingChange(true);
            }}
          />
        ) : null}
      </>
    ),
  };

  if (!item || !payload) return null;

  // The least height a hugging card is drawn at: Style D's floor for the kind
  // (its canvas height for charts / media, 0 = pure content for the rest),
  // judged against the kind's default canvas size, not the node's current one.
  const styleFloor = hug
    ? (STYLE_D.hug?.({
        ...item,
        // Picture kinds floor at the taller of their default and the node's
        // own height — a repo or an embed sizes its node from what it holds.
        natural: sized
          ? size
          : {
              w: size.w,
              h: Math.max(getFrostDefaultArtifactSize(art.kind, payload).h, size.h),
            },
      }) ?? null)
    : null;
  const hugFloor = hug ? Math.max(styleFloor ?? 0, minHeight) : null;

  const ctx: ArtifactRenderContext = {
    item,
    interactive: contentInteractive,
    surface: "focus",
    chromeState,
    mode,
    liveBody: shell(true),
    canvasMenu,
    focusGroup: focusCanvasGroup,
    editing,
    onPayloadChange:
      isLatest && !readOnly
        ? art.kind === "todo"
          ? (next) => {
              if (next.type === "todo") saveTodoArtifactVersion(art.id, next);
            }
          : art.kind === "stickynote"
            ? (next) => {
                if (next.type === "stickynote") {
                  saveStickyNoteArtifactVersion(art.id, normalizeStickyNotePayload(next));
                }
              }
            : undefined
        : undefined,
  };
  // A note is written on in place (styleD StickyBody): Edit only hands it
  // the caret, never swaps the vanilla editor in.
  const editsInPlace = art.kind === "stickynote";
  // The card's last height at rest — the floor the editor opens at.
  const reportRest: typeof onHugHeight = (h, minW, natural, w) => {
    restHRef.current = h;
    onHugHeight?.(h, minW, natural, w);
  };

  if (!editing && isEmptyPayload(payload)) {
    return (
      <FrostCard
        ctx={ctx}
        hug={hugFloor}
        naturalFloor={styleFloor ?? 0}
        onHugHeight={reportRest}
        body={
          <FrostEmptyBody
            payload={payload}
            onAdd={editable && isLatest ? () => onEditingChange(true) : undefined}
          />
        }
      />
    );
  }

  if (editing && !editsInPlace) {
    return (
      <FrostCard
        ctx={{ ...ctx, interactive: true }}
        className="frost-live-editor"
        // The editor hugs too (never crops a row): at least as tall as the
        // card was at rest, so Edit never jumps the card smaller.
        hug={hug ? Math.max(hugFloor ?? 0, restHRef.current) : null}
        naturalFloor={styleFloor ?? 0}
        onHugHeight={onHugHeight}
        body={
          <div
            data-frost-editor
            className="flex min-h-0 flex-1 flex-col"
            style={{ padding: NEST_INSET }}
          >
            <FrostErrorBoundary title={art.title} resetKey={payload}>
              {shell(false)}
            </FrostErrorBoundary>
          </div>
        }
      />
    );
  }

  // Double-click → Edit is wired on the node root (CanvasArtifactNode): the
  // node captures the pointer on press, so dblclick is retargeted there.
  return (
    <div className="contents">
      <FrostBodyBoundary
        resetKey={payload}
        fallback={
          <FrostCard
            ctx={ctx}
            body={
              <div
                data-frost-editor
                className="flex min-h-0 flex-1 flex-col"
                style={{ padding: NEST_INSET }}
              >
                <FrostErrorBoundary title={art.title} resetKey={payload}>
                  {shell(false)}
                </FrostErrorBoundary>
              </div>
            }
          />
        }
      >
        {/* Keyed by version: bodies seed local state (todo checks) from the
            payload. A note keeps one card across the versions its own
            typing saves, or the field would lose the caret on every save. */}
        <FrostCard key={editsInPlace ? art.id : version.id} ctx={ctx} hug={hugFloor} naturalFloor={styleFloor ?? 0} onHugHeight={reportRest} />
      </FrostBodyBoundary>
    </div>
  );
}
