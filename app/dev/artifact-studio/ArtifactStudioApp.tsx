"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  VARIANT_LABELS,
  VARIANT_ORDER,
  getStudioPool,
  type ArtifactVariant,
  type StudioArtifact,
} from "@/lib/artifactStudio/pool";
import {
  newRandomSeed,
  selectMix1,
  selectMix2,
  selectOneOfEach,
  selectRandomMix,
} from "@/lib/artifactStudio/selection";
import { KindFilter, ModeToggle, Segmented } from "./StudioControls";
import { AccentPicker } from "./AccentPicker";
import { StyleFontPickers } from "./FontPicker";
import { useFrostAccent } from "@/components/artifactStyles/styleD/accent";
import { StudioCanvas } from "./StudioCanvas";
import { StudioFocusView } from "./StudioFocusView";
import { BentoGrid, CompareStylesGrid, FamilySections } from "./StudioGrids";
import {
  STYLE_FAMILIES,
  backdropOf,
  getStyleFamily,
  getStyleTheme,
  isStyleFamilyId,
  type ChromeState,
  type StudioMode,
  type StyleFamilyId,
} from "@/components/artifactStyles";

type StudioView = "one" | "mix1" | "mix2" | "shuffle";
type OneLayout = "families" | "compare";

const VIEWS: StudioView[] = ["one", "mix1", "mix2", "shuffle"];

interface StudioUrlState {
  view: StudioView;
  style: StyleFamilyId;
  /** Colour theme of the chosen family, when it has several. */
  theme: string | null;
  /** Light or dark — every family's themes exist in both. */
  mode: StudioMode;
  seed: string;
  layout: OneLayout;
  focus: string | null;
  focusStyle: StyleFamilyId | "compare" | null;
  /** Artifact kinds switched off in the global filter — they leave every view. */
  hidden: ArtifactVariant[];
  /** The sample canvas is open over the studio. */
  canvas: boolean;
}

const HIDDEN_KEY = "artifact-studio:hidden-kinds";

function parseHidden(raw: string | null): ArtifactVariant[] {
  if (!raw) return [];
  return raw.split(",").filter((v): v is ArtifactVariant => (VARIANT_ORDER as string[]).includes(v));
}

function readStoredHidden(): string | null {
  try {
    return window.localStorage.getItem(HIDDEN_KEY);
  } catch {
    return null;
  }
}

function readUrlState(): StudioUrlState {
  const p = new URLSearchParams(window.location.search);
  const view = p.get("view") as StudioView | null;
  const style = p.get("style");
  const focusStyle = p.get("focusStyle");
  return {
    view: view && VIEWS.includes(view) ? view : "one",
    style: isStyleFamilyId(style) ? style : "current",
    theme: p.get("theme"),
    mode: p.get("mode") === "dark" ? "dark" : "light",
    seed: p.get("seed") || newRandomSeed(),
    layout: p.get("layout") === "compare" ? "compare" : "families",
    focus: p.get("focus"),
    focusStyle: focusStyle === "compare" || isStyleFamilyId(focusStyle) ? focusStyle : null,
    // The URL wins so a shared link reproduces its board; otherwise the last filter you used.
    hidden: parseHidden(p.has("hide") ? p.get("hide") : readStoredHidden()),
    canvas: p.get("canvas") === "1",
  };
}

function writeUrlState(s: StudioUrlState) {
  const p = new URLSearchParams();
  p.set("view", s.view);
  p.set("style", s.style);
  if (s.theme) p.set("theme", s.theme);
  if (s.mode === "dark") p.set("mode", "dark");
  if (s.view === "shuffle") p.set("seed", s.seed);
  if (s.view === "one" && s.layout === "compare") p.set("layout", "compare");
  if (s.focus) p.set("focus", s.focus);
  if (s.focus && s.focusStyle && s.focusStyle !== s.style) p.set("focusStyle", s.focusStyle);
  if (s.hidden.length) p.set("hide", s.hidden.join(","));
  if (s.canvas) p.set("canvas", "1");
  window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  try {
    window.localStorage.setItem(HIDDEN_KEY, s.hidden.join(","));
  } catch {
    // Private window / blocked storage — the URL still carries the filter.
  }
}

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M2 4.5h2.5c1.6 0 2.6.8 3.5 2.2l1 1.6c.9 1.4 1.9 2.2 3.5 2.2H14M2 11.5h2.5c1 0 1.8-.3 2.4-.9M10 5.4c.6-.6 1.4-.9 2.5-.9H14M12.5 2.8 14 4.5l-1.5 1.7M12.5 9.8l1.5 1.7-1.5 1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArtifactStudioApp() {
  const [state, setState] = useState<StudioUrlState | null>(null);
  const [chromeState, setChromeState] = useState<ChromeState>("rest");
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setState(readUrlState()), []);
  useEffect(() => {
    if (state) writeUrlState(state);
  }, [state]);

  // Sticky sub-headers sit under the bar, whatever its wrapped height.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      document.documentElement.style.setProperty("--studio-bar-h", `${el.offsetHeight}px`),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [state === null]);

  const fullPool = useMemo(() => getStudioPool(), []);
  const kindOptions = useMemo(() => {
    const counts = new Map<ArtifactVariant, number>();
    for (const a of fullPool) counts.set(a.variant, (counts.get(a.variant) ?? 0) + 1);
    return VARIANT_ORDER.filter((v) => counts.has(v)).map((v) => ({
      id: v,
      label: VARIANT_LABELS[v],
      count: counts.get(v)!,
    }));
  }, [fullPool]);
  const hiddenKey = state?.hidden.join(",") ?? "";
  const hidden = useMemo(() => new Set(hiddenKey ? (hiddenKey.split(",") as ArtifactVariant[]) : []), [hiddenKey]);
  // Every view selects from the filtered pool, so mixes and Randomize fill
  // their boards with only the kinds that are switched on.
  const pool = useMemo(() => fullPool.filter((a) => !hidden.has(a.variant)), [fullPool, hidden]);
  const oneOfEach = useMemo(() => selectOneOfEach(pool), [pool]);
  const mix1 = useMemo(() => selectMix1(pool), [pool]);
  const mix2 = useMemo(() => selectMix2(pool), [pool]);
  const shuffle = useMemo(
    () => (state ? selectRandomMix(pool, state.seed) : []),
    [pool, state?.seed], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const update = useCallback(
    (patch: Partial<StudioUrlState>) => setState((s) => (s ? { ...s, ...patch } : s)),
    [],
  );

  // Applies Style D's saved accent in every view, picker shown or not.
  useFrostAccent();

  if (!state) return <main className="min-h-screen bg-canvas-bg" />;

  const items: StudioArtifact[] =
    state.view === "one" ? oneOfEach : state.view === "mix1" ? mix1 : state.view === "mix2" ? mix2 : shuffle;
  const family = getStyleFamily(state.style);
  const theme = getStyleTheme(family, state.theme);
  const backdrop = backdropOf(family, theme?.id, state.mode);
  const dark = state.mode === "dark";
  // Compare shows every family at once — a family's own controls don't apply.
  const comparingStyles = state.view === "one" && state.layout === "compare";
  const focusIndex = state.focus ? items.findIndex((i) => i.uid === state.focus) : -1;

  const open = (uid: string, focusStyle?: StyleFamilyId) =>
    update({ focus: uid, focusStyle: focusStyle ?? state.style });
  const randomize = () => update({ view: "shuffle", seed: newRandomSeed(), focus: null });

  const viewOptions: { id: StudioView; label: string; hint: string }[] = [
    { id: "one", label: "One of each", hint: "The richest artifact of every kind, by visual family" },
    { id: "mix1", label: "Mix 1", hint: "Balanced bento — every kind, visual-heavy ones doubled" },
    { id: "mix2", label: "Mix 2", hint: "Reading bento — transcript extracts and data, no repeats from Mix 1" },
  ];

  return (
    <main className="min-h-screen bg-canvas-bg text-canvas-ink">
      <div
        ref={barRef}
        className="z-[90] border-b sm:sticky sm:top-0 border-canvas-border/70 bg-canvas-bg/85 px-4 py-3 backdrop-blur-md sm:px-8"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">Flowstate</p>
            <h1 className="font-display text-xl font-medium leading-tight">Artifact Studio</h1>
          </div>
          <button
            type="button"
            onClick={() => update({ canvas: true, focus: null })}
            title="A blank canvas to ask questions on and watch the turn play out in the current style"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-canvas-accent px-4 py-2 text-canvas-body-sm font-medium text-white shadow-card transition-opacity hover:opacity-90"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
              <rect x="2" y="2.5" width="12" height="11" rx="2.5" />
              <path d="M8 5.8v4.4M5.8 8h4.4" strokeLinecap="round" />
            </svg>
            New canvas
          </button>
          <Segmented label="View" value={state.view} onChange={(view) => update({ view, focus: null })} options={viewOptions} />
          <KindFilter
            kinds={kindOptions}
            hidden={hidden}
            onChange={(next) =>
              update({ hidden: VARIANT_ORDER.filter((v) => next.has(v)), focus: null, focusStyle: null })
            }
          />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Segmented
              label="Style family"
              value={state.style}
              onChange={(style) => update({ style, theme: null })}
              options={STYLE_FAMILIES.map((f) => ({
                id: f.id,
                label: f.status === "placeholder" ? <span className="opacity-80">{f.name}</span> : f.name,
                hint: f.summary,
              }))}
            />
            <button
              type="button"
              onClick={randomize}
              aria-pressed={state.view === "shuffle"}
              title="A random bento from the kinds switched on — click again to reroll"
              className={`inline-flex items-center gap-2 rounded-full border border-canvas-ink/15 bg-canvas-ink px-4 py-2 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90 ${
                state.view === "shuffle" ? "ring-2 ring-canvas-accent ring-offset-2 ring-offset-canvas-bg" : ""
              }`}
            >
              <ShuffleIcon /> Randomize
              {state.view === "shuffle" ? <span className="font-normal tabular-nums opacity-70">· {state.seed}</span> : null}
            </button>
            <ModeToggle mode={state.mode} onChange={(mode) => update({ mode })} />
          </div>
        </div>
      </div>

      <div
        className="px-4 pb-24 pt-6 transition-colors sm:px-8"
        style={
          backdrop && !comparingStyles
            ? ({
                background: backdrop.background,
                "--studio-label-ink": backdrop.ink,
                "--studio-label-muted": backdrop.muted,
              } as CSSProperties)
            : undefined
        }
      >
        <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {family.id === "style-d" ? <AccentPicker /> : null}
            {family.themes?.length ? (
              <Segmented
                label="Theme"
                value={theme?.id ?? family.themes[0]!.id}
                onChange={(id) => update({ theme: id })}
                options={family.themes.map((t) => ({ id: t.id, label: t.name, hint: t.hint }))}
              />
            ) : null}
            {comparingStyles ? null : <StyleFontPickers family={family} />}
            {state.view === "one" ? (
              <Segmented
                label="Layout"
                value={state.layout}
                onChange={(layout) => update({ layout })}
                options={[
                  { id: "families", label: "By family" },
                  { id: "compare", label: "Compare styles" },
                ]}
              />
            ) : null}
            <Segmented
              label="Chrome state"
              value={chromeState}
              onChange={setChromeState}
              options={[
                { id: "rest", label: "Rest" },
                { id: "hover", label: "Hover" },
                { id: "selected", label: "Selected" },
              ]}
            />
          </div>
        </div>

        {/* The board alone takes the canvas's dark tokens, so the Current family and the tile chrome follow the mode while the studio's controls above never do. */}
        <div className={dark && !comparingStyles ? "theme-scope-dark" : undefined}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-32 text-center">
            <p className="font-display text-lg text-[color:var(--studio-label-ink,rgb(var(--canvas-ink)))]">No artifact kinds switched on</p>
            <p className="text-canvas-body-sm text-[color:var(--studio-label-muted,rgb(var(--canvas-muted)))]">
              Pick some from the Artifacts dropdown, or{" "}
              <button type="button" className="underline underline-offset-2" onClick={() => update({ hidden: [] })}>
                show them all
              </button>
              .
            </p>
          </div>
        ) : comparingStyles ? (
          <CompareStylesGrid items={items} chromeState={chromeState} themeId={theme?.id ?? null} mode={state.mode} onOpen={open} />
        ) : state.view === "one" ? (
          <FamilySections items={items} family={family} themeId={theme?.id ?? null} mode={state.mode} chromeState={chromeState} onOpen={(uid) => open(uid)} />
        ) : (
          <BentoGrid
            key={`${state.view}:${state.seed}:${hiddenKey}`}
            items={items}
            family={family}
            themeId={theme?.id ?? null}
            mode={state.mode}
            chromeState={chromeState}
            onOpen={(uid) => open(uid)}
          />
        )}
        </div>
      </div>

      {state.canvas ? (
        <StudioCanvas
          family={family}
          themeId={theme?.id ?? null}
          mode={state.mode}
          onFamilyChange={(style) => update({ style, theme: null })}
          onThemeChange={(id) => update({ theme: id })}
          onModeChange={(mode) => update({ mode })}
          onClose={() => update({ canvas: false })}
        />
      ) : null}

      {focusIndex >= 0 ? (
        <StudioFocusView
          items={items}
          index={focusIndex}
          familyId={state.focusStyle ?? state.style}
          themeId={theme?.id ?? null}
          mode={state.mode}
          onModeChange={(mode) => update({ mode })}
          onThemeChange={(id) => update({ theme: id })}
          onFamilyChange={(focusStyle) => update({ focusStyle, theme: null })}
          onNavigate={(i) => update({ focus: items[i]!.uid })}
          onClose={() => update({ focus: null, focusStyle: null })}
        />
      ) : null}
    </main>
  );
}
