"use client";

import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { VARIANT_LABELS, type StudioArtifact } from "@/lib/artifactStudio/pool";
import { ARTIFACT_CATEGORY_META } from "@/lib/design/theme/artifactCategories";
import { ScaledStage, type StageMode } from "./ScaledStage";
import { hugsContent } from "./StudioGrids";
import {
  STYLE_FAMILIES,
  StyledArtifact,
  backdropOf,
  getStyleTheme,
  type ArtifactStyleFamily,
  type ChromeState,
  type QaState,
  type StudioMode,
  type StyleFamilyId,
} from "@/components/artifactStyles";
import { QA_STATES } from "@/components/artifactStyles/cards";
import { ModeToggle, Segmented } from "./StudioControls";
import { AccentPicker } from "./AccentPicker";
import { useDecisions, VERDICT_META, type Verdict } from "./useDecisions";
import { useArtifactElements } from "./artifactElements";
import { ElementsPanel } from "./ElementsPanel";
import { SPEC_EXEMPT_FAMILIES, checkSpec, textSpecFor } from "@/components/artifactStyles/textSpec";
import { ContentSlider } from "./ContentSlider";
import { FocusResizeFrame, type Offset, type Size } from "./FocusResizeFrame";
import { ORIGINAL_AMOUNT, canVaryContent, varyContent } from "@/lib/artifactStudio/contentVariants";

const STAGE_MODES: { id: StageMode; label: string; hint: string }[] = [
  { id: "natural", label: "50%", hint: "Half its canvas size — the studio default" },
  { id: "actual", label: "100%", hint: "Full canvas size" },
  { id: "fit", label: "Fit", hint: "Designed aspect, as large as the screen allows" },
  { id: "fill", label: "Fill", hint: "Same zoom, reflowed to fill the whole stage" },
];

const CHROME_STATES: { id: ChromeState; label: string }[] = [
  { id: "rest", label: "Rest" },
  { id: "hover", label: "Hover" },
  { id: "selected", label: "Selected" },
];

function IconButton({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-canvas-border bg-canvas-card text-canvas-ink transition-colors hover:border-canvas-accent/40 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={dir === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-canvas-micro uppercase tracking-wider text-canvas-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-canvas-body-sm text-canvas-ink">{value}</dd>
    </div>
  );
}

function DecisionPanel({ item, family, userSize, elementsPanel }: { item: StudioArtifact; family: ArtifactStyleFamily; userSize: Size | null; elementsPanel?: ReactNode }) {
  const { get, set, map, count } = useDecisions();
  const decision = get(family.id, item.uid);
  const [copied, setCopied] = useState(false);
  const meta = { title: item.artifact.title, variant: item.variant };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(map, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 overflow-y-auto border-t border-canvas-border bg-canvas-card px-5 py-5 lg:w-[320px] lg:border-l lg:border-t-0">
      <section>
        <p className="mb-2 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">Artifact</p>
        <dl className="divide-y divide-canvas-border/60">
          <DetailRow label="Variant" value={VARIANT_LABELS[item.variant]} />
          <DetailRow label="Family" value={ARTIFACT_CATEGORY_META[item.category].label} />
          <DetailRow label="Designed at" value={`${item.natural.w} × ${item.natural.h}`} />
          {userSize ? <DetailRow label="Resized to" value={`${Math.round(userSize.w)} × ${Math.round(userSize.h)}`} /> : null}
          <DetailRow label="Source" value={item.source} />
          <DetailRow label="Style" value={`${family.name}${family.status === "placeholder" ? " (placeholder)" : ""}`} />
        </dl>
      </section>

      {elementsPanel}

      <section>
        <p className="mb-2 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
          Decision · {family.name}
        </p>
        <div className="flex gap-2">
          {(Object.keys(VERDICT_META) as Verdict[]).map((v) => {
            const active = decision?.verdict === v;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={active}
                onClick={() => set(family.id, item.uid, { ...meta, verdict: active ? undefined : v })}
                className="flex-1 rounded-full border px-3 py-2 text-canvas-body-sm font-medium transition-colors"
                style={
                  active
                    ? { backgroundColor: VERDICT_META[v].color, borderColor: VERDICT_META[v].color, color: "white" }
                    : undefined
                }
              >
                {VERDICT_META[v].label}
              </button>
            );
          })}
        </div>
        <textarea
          key={`${family.id}::${item.uid}`}
          defaultValue={decision?.note ?? ""}
          onChange={(e) => set(family.id, item.uid, { ...meta, note: e.target.value })}
          placeholder="What works, what to change…"
          rows={6}
          className="mt-3 w-full resize-y rounded-[14px] border border-canvas-border bg-canvas-bg px-3 py-2.5 text-canvas-body-sm text-canvas-ink placeholder:text-canvas-muted focus:border-canvas-accent/50 focus:outline-none"
        />
      </section>

      <section className="mt-auto">
        <button
          type="button"
          onClick={copyAll}
          disabled={count === 0}
          className="w-full rounded-full border border-canvas-ink/15 bg-canvas-ink px-4 py-2.5 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {copied ? "Copied" : `Copy all decisions (${count})`}
        </button>
      </section>
    </aside>
  );
}

export function StudioFocusView({
  items,
  index,
  familyId,
  themeId,
  mode,
  onModeChange,
  onThemeChange,
  onFamilyChange,
  onNavigate,
  onClose,
}: {
  items: StudioArtifact[];
  index: number;
  familyId: StyleFamilyId | "compare";
  themeId: string | null;
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  onThemeChange: (id: string) => void;
  onFamilyChange: (id: StyleFamilyId | "compare") => void;
  onNavigate: (index: number) => void;
  onClose: () => void;
}) {
  const baseItem = items[index]!;
  const [amount, setAmount] = useState(ORIGINAL_AMOUNT);
  const [seed, setSeed] = useState("0");
  const deferredAmount = useDeferredValue(amount);
  const item = useMemo(() => varyContent(baseItem, deferredAmount, seed), [baseItem, deferredAmount, seed]);
  const contentKey = `${deferredAmount.toFixed(3)}:${seed}`;
  const randomize = () => {
    setAmount(Math.round(Math.random() * 100) / 100);
    setSeed(Math.random().toString(36).slice(2, 8));
  };
  const [stage, setStage] = useState<StageMode>("natural");
  const [chromeState, setChromeState] = useState<ChromeState>("rest");
  const [hovered, setHovered] = useState(false);
  // A corner resize, as on the canvas: once set, the artifact is a fixed box
  // (content growth no longer hugs it) and stays where the grips left it.
  const [userSize, setUserSize] = useState<Size | null>(null);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [lockScale, setLockScale] = useState<number | null>(null);
  const resetSize = () => {
    setUserSize(null);
    setOffset({ x: 0, y: 0 });
  };
  const liveChrome: ChromeState = chromeState === "rest" && hovered ? "hover" : chromeState;
  // A Q&A card's turn (typing → thinking → answering → done); other kinds are always done.
  const [qaState, setQaState] = useState<QaState>("done");
  const isQa = item.variant === "qa";
  const [panelOpen, setPanelOpen] = useState(true);
  const comparing = familyId === "compare";
  const family = STYLE_FAMILIES.find((f) => f.id === familyId) ?? STYLE_FAMILIES[0]!;
  const theme = getStyleTheme(family, themeId);
  const backdrop = backdropOf(family, theme?.id, mode);
  const dark = mode === "dark";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable)) return;
      if (e.key === "Escape") {
        // As on the canvas, Escape first lets go of the selection.
        if (chromeState === "selected") setChromeState("rest");
        else onClose();
      }
      else if (e.key === "ArrowRight") onNavigate((index + 1) % items.length);
      else if (e.key === "ArrowLeft") onNavigate((index - 1 + items.length) % items.length);
      else if (/^[1-9]$/.test(e.key)) {
        const f = STYLE_FAMILIES[Number(e.key) - 1];
        if (f) onFamilyChange(f.id);
      } else if (e.key.toLowerCase() === "t" && family.themes?.length) {
        const i = family.themes.findIndex((t) => t.id === theme?.id);
        onThemeChange(family.themes[(i + 1) % family.themes.length]!.id);
      } else if (e.key.toLowerCase() === "c") onFamilyChange("compare");
      else if (e.key.toLowerCase() === "d") onModeChange(dark ? "light" : "dark");
      else if (e.key.toLowerCase() === "r" && canVaryContent(baseItem)) randomize();
      else if (e.key === "0") setAmount(ORIGINAL_AMOUNT);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onFamilyChange, onNavigate, onThemeChange, onModeChange, dark, family, theme, baseItem, chromeState]);

  useEffect(() => {
    setAmount(ORIGINAL_AMOUNT);
    setSeed("0");
    setUserSize(null);
    setOffset({ x: 0, y: 0 });
  }, [baseItem.uid]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const elements = useArtifactElements(`${item.uid}:${familyId}:${theme?.id ?? ""}:${mode}:${isQa ? qaState : ""}`);
  // A card mid-turn has no answer yet (or only part of one) — the spec describes the finished card.
  const specExempt = SPEC_EXEMPT_FAMILIES.has(family.id) || (isQa && qaState !== "done");
  const specCheck = useMemo(() => (elements.elements.length ? checkSpec(item, elements.elements) : null), [item, elements.elements]);
  // Read by scratch/text-parity.mjs, which sweeps every family against the spec.
  useEffect(() => {
    (window as unknown as { __studioFocus?: unknown }).__studioFocus = {
      uid: item.uid,
      variant: item.variant,
      family: family.id,
      spec: textSpecFor(item),
      elements: elements.elements,
      check: specCheck,
    };
  }, [item, family.id, elements.elements, specCheck]);
  // As on the canvas, content is live only once selected — until then the first
  // press anywhere on the artifact selects it rather than landing on its text.
  const ctx = { item, interactive: chromeState === "selected" || (isQa && qaState === "typing"), surface: "focus" as const, chromeState: liveChrome, themeId: theme?.id ?? null, mode, qaState: isQa ? qaState : undefined };

  return (
    <div role="dialog" aria-modal="true" aria-label={item.artifact.title} className="fixed inset-0 z-[200] flex flex-col bg-canvas-bg">
      <header className="relative z-20 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-b border-canvas-border bg-canvas-card/95 px-4 py-3 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-full border border-canvas-border bg-canvas-card px-3.5 py-2 text-canvas-body-sm font-medium text-canvas-ink hover:border-canvas-accent/40"
        >
          <Chevron dir="left" /> Back
        </button>
        <div className="flex items-center gap-2">
          <IconButton label="Previous (←)" onClick={() => onNavigate((index - 1 + items.length) % items.length)}>
            <Chevron dir="left" />
          </IconButton>
          <span className="min-w-[64px] text-center text-canvas-body-sm tabular-nums text-canvas-muted">
            {index + 1} / {items.length}
          </span>
          <IconButton label="Next (→)" onClick={() => onNavigate((index + 1) % items.length)}>
            <Chevron dir="right" />
          </IconButton>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-medium text-canvas-ink">{item.artifact.title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Style"
            value={familyId}
            onChange={onFamilyChange}
            options={[
              ...STYLE_FAMILIES.map((f) => ({ id: f.id, label: f.name })),
              { id: "compare" as const, label: "Compare" },
            ]}
          />
          <ModeToggle mode={mode} onChange={onModeChange} />
          {!comparing && family.id === "style-d" ? <AccentPicker /> : null}
          {!comparing && family.themes?.length ? (
            <Segmented
              label="Theme"
              value={theme?.id ?? family.themes[0]!.id}
              onChange={onThemeChange}
              options={family.themes.map((t) => ({ id: t.id, label: t.name, hint: t.hint }))}
            />
          ) : null}
          <Segmented label="Size" value={stage} onChange={setStage} options={STAGE_MODES} />
          {userSize && !comparing ? (
            <button
              type="button"
              onClick={resetSize}
              title="Back to the designed size, centred"
              className="rounded-full border border-canvas-border bg-canvas-card px-3.5 py-2 text-canvas-body-sm font-medium text-canvas-ink hover:border-canvas-accent/40"
            >
              Reset size
            </button>
          ) : null}
          <Segmented label="State" value={chromeState} onChange={setChromeState} options={CHROME_STATES} />
          {isQa ? <Segmented label="Turn" value={qaState} onChange={setQaState} options={QA_STATES} /> : null}
          {comparing ? null : (
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            aria-pressed={panelOpen}
            className="rounded-full border border-canvas-border bg-canvas-card px-3.5 py-2 text-canvas-body-sm font-medium text-canvas-ink hover:border-canvas-accent/40"
          >
            {panelOpen ? "Hide notes" : "Notes"}
          </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative min-h-[60vh] min-w-0 flex-1 lg:min-h-0">
          {comparing ? (
            <div className="grid h-full grid-cols-1 gap-6 overflow-y-auto p-4 sm:p-8 md:grid-cols-3 xl:grid-cols-4">
              {STYLE_FAMILIES.map((f) => (
                <div key={f.id} className={`flex min-h-[320px] min-w-0 flex-col gap-3 rounded-canvas p-3${dark ? " theme-scope-dark" : ""}`} style={{ background: backdropOf(f, themeId, mode)?.background }}>
                  <button
                    type="button"
                    onClick={() => onFamilyChange(f.id)}
                    className="self-start font-display text-canvas-body-sm font-medium text-canvas-ink hover:text-canvas-accent"
                  >
                    {f.name}
                    {f.status === "placeholder" ? <span className="ml-2 text-canvas-micro text-canvas-muted">placeholder</span> : null}
                  </button>
                  <div className="min-h-[280px] flex-1">
                    <ScaledStage natural={item.natural} mode={stage} hug={hugsContent(item, f)}>
                      <StyledArtifact key={contentKey} family={f} ctx={{ ...ctx, themeId: getStyleTheme(f, themeId)?.id ?? null }} />
                    </ScaledStage>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`absolute inset-0 p-4 sm:p-10${dark ? " theme-scope-dark" : ""}`}
              style={backdrop ? { background: backdrop.background } : undefined}
              // Pressing empty stage lets go of the selection (the frame stops its own presses).
              onPointerDown={(e) => {
                if (e.button === 0 && chromeState === "selected") setChromeState("rest");
              }}
            >
              <ScaledStage
                key={`${item.uid}:${family.id}`}
                natural={userSize ?? item.natural}
                mode={stage}
                hug={userSize ? null : hugsContent(item, family)}
                lockScale={lockScale}
                offset={stage === "fill" ? undefined : offset}
                onOffsetSettle={setOffset}
              >
                <FocusResizeFrame
                  kind={item.card ? undefined : item.kind}
                  // Fill reflows the artifact to the stage, so its size isn't the artifact's to set.
                  resizable={!item.card && stage !== "fill"}
                  chromeVisible={liveChrome !== "rest"}
                  offset={offset}
                  onSelect={(how) => setChromeState((s) => (how === "toggle" && s === "selected" ? "rest" : "selected"))}
                  onHover={setHovered}
                  onResizeStart={setLockScale}
                  onResize={(size, next) => {
                    setUserSize(size);
                    setOffset(next);
                  }}
                  onResizeEnd={() => setLockScale(null)}
                >
                  <div ref={elements.rootRef} className="flex h-full w-full flex-1 flex-col">
                    <StyledArtifact key={contentKey} family={family} ctx={ctx} />
                  </div>
                </FocusResizeFrame>
              </ScaledStage>
            </div>
          )}
          {!baseItem.card && !item.card && canVaryContent(baseItem) ? (
            <ContentSlider
              original={baseItem.payload}
              varied={item.payload}
              amount={amount}
              onAmountChange={setAmount}
              onRandomize={randomize}
            />
          ) : null}
        </main>
        {panelOpen && !comparing ? (
          <DecisionPanel
            item={item}
            family={family}
            userSize={userSize}
            elementsPanel={
              <ElementsPanel
                elements={elements.elements}
                hidden={elements.hidden}
                onToggle={elements.toggle}
                onShowAll={elements.showAll}
                onHideAll={elements.hideAll}
                onHighlight={elements.highlight}
                specCheck={specExempt ? null : specCheck}
                specExempt={specExempt}
              />
            }
          />
        ) : null}
      </div>
    </div>
  );
}
