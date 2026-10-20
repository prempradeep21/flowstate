"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Finds every element of a rendered artifact that carries text or
 * iconography — title, subheading, figures, legend, axis labels, footnotes,
 * icons — so the focus view can switch each one off and on. Style-only
 * layers (rules, panels, glows, backgrounds), media and plots are left out:
 * they are the style, not the content.
 *
 * It reads the DOM rather than relying on each style family to declare its
 * parts, so it works on every family, including ones still being written.
 * A family can still name a part precisely with `data-el="Name"` (on the
 * element or any ancestor inside the artifact); every text or icon under one
 * name is one switch. Everything else is named by role from its tag, type
 * size, position and content. Text drawn inside an SVG (axis ticks, point
 * labels) counts as text; an SVG is itself an icon only when it is icon-sized.
 * Glyphs (→, “ ”, ‹ ›, ▼) and anything marked `data-el-kind="icon"` (avatar
 * initials) are iconography. A tagged element with an `aria-label` and no
 * text of its own (a dot-matrix numeral) is text, read from the label.
 * Text clipped out of view by an overflow box isn't there to the reader, so
 * it isn't listed.
 *
 * Repeated structures (table rows, list items, calendar days, ruler ticks,
 * chart dots) collapse into one switch per part of the repeated item — e.g.
 * "Chapter numbers ×5" and "Chapter labels ×5" — instead of one per row.
 */

export interface ArtifactElement {
  /** Stable across re-scans while the artifact's structure is unchanged. */
  key: string;
  name: string;
  /** What it says, or what it is — so two "Text" rows can be told apart. */
  snippet: string;
  count: number;
  kind: "text" | "icon";
  /** Named by the family with `data-el` — a part of the text spec (textSpec.ts). */
  tagged: boolean;
}

/** Media we never look inside — a map's tiles and attribution are not the artifact's text. */
const MEDIA = "video, iframe, canvas, picture, audio, model-viewer, .leaflet-container, .maplibregl-map, .mapboxgl-map, [data-el-opaque]";
/** Larger than this, an SVG or image is a plot or picture, not an icon. */
const ICON_MAX = 44;
const OFF_ATTR = "data-studio-off";
const HL_ATTR = "data-studio-hl";
const KEY_ATTR = "data-studio-el";

/** Injected once: how switched-off and hovered elements look. */
function ensureStyles() {
  if (document.getElementById("studio-element-styles")) return;
  const style = document.createElement("style");
  style.id = "studio-element-styles";
  style.textContent = `
    [${OFF_ATTR}] { display: none !important; }
    [${HL_ATTR}] { outline: 2px solid #2F7BFF !important; outline-offset: 2px; background-color: rgba(47,123,255,0.08); }
  `;
  document.head.appendChild(style);
}

const isVisible = (el: Element, root: Element) => {
  if (el.closest(`[${OFF_ATTR}]`)) return true; // switched off by us — still a part of the artifact
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return false;
  const cs = getComputedStyle(el);
  if (cs.visibility === "hidden" || Number(cs.opacity) <= 0.01) return false;
  // Clipped out of view by a scroll or overflow box between it and the artifact.
  for (let p = el.parentElement; p && p !== root.parentElement; p = p.parentElement) {
    const pcs = getComputedStyle(p);
    if (pcs.overflowX === "visible" && pcs.overflowY === "visible") continue;
    const pr = p.getBoundingClientRect();
    const w = Math.min(r.right, pr.right) - Math.max(r.left, pr.left);
    const h = Math.min(r.bottom, pr.bottom) - Math.max(r.top, pr.top);
    if (w < 1 || h < Math.min(4, r.height / 2)) return false;
  }
  return true;
};

/** Arrows, quote marks, chevrons, bullets — marks, not words. */
const GLYPH = /^[^\p{L}\p{N}]{1,3}$/u;

const ownText = (el: Element) =>
  Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent ?? "")
    .join("")
    .trim();

const fullText = (el: Element) => (el.textContent ?? "").replace(/\s+/g, " ").trim();

/** Siblings with the same tag, classes and declared name are copies of one part. */
const signature = (el: Element) => `${el.tagName}|${el.getAttribute("class") ?? ""}|${el.getAttribute("data-el") ?? ""}`;

/** Path of child indices from root, with repeated levels wildcarded. */
function pathOf(el: Element, root: Element): { exact: string; group: string; repeated: boolean } {
  const exact: string[] = [];
  const group: string[] = [];
  let repeated = false;
  let cur: Element | null = el;
  while (cur && cur !== root) {
    const parent: Element | null = cur.parentElement;
    if (!parent) break;
    const siblings = Array.from(parent.children);
    const idx = siblings.indexOf(cur);
    const sig = signature(cur);
    const alike = siblings.filter((s) => signature(s) === sig).length;
    exact.unshift(String(idx));
    if (alike >= 3) {
      group.unshift("*");
      repeated = true;
    } else group.unshift(String(idx));
    cur = parent;
  }
  return { exact: exact.join("."), group: group.join("."), repeated };
}

/** The nearest `data-el` name inside the artifact, if a style named this part. */
function declaredName(el: Element, root: Element): string | null {
  const named = el.closest("[data-el]");
  return named && root.contains(named) ? named.getAttribute("data-el") : null;
}

interface Atom {
  el: Element;
  kind: ArtifactElement["kind"];
  text: string;
  fontSize: number;
  top: number;
  height: number;
  tag: string;
  upper: boolean;
  name: string | null;
}

const NUMERIC = /^[\s~≈+\-−$€£₹]*[\d.,:]+\s*(?:%|[kKmMbB]n?|x|×)?\s*$/;

function roleOf(a: Atom, ctx: { maxFont: number; rootTop: number; rootH: number; rootW: number; titleTaken: boolean }, repeated: boolean): string {
  if (a.name) return a.name;
  const y = (a.top - ctx.rootTop) / Math.max(1, ctx.rootH);
  if (a.kind === "icon") return repeated ? "Icons" : "Icon";
  const t = a.text;
  if (a.tag === "TEXT" || a.tag === "TSPAN") {
    if (NUMERIC.test(t)) return repeated ? "Axis values" : "Value label";
    return repeated ? "Axis labels" : "Chart label";
  }
  if (a.tag === "BLOCKQUOTE") return "Quote";
  if (a.tag === "TH") return "Column header";
  if (a.tag === "BUTTON") return "Button";
  if (a.tag === "A") return "Link";
  if (a.tag === "PRE" || a.tag === "CODE") return "Code";
  if (NUMERIC.test(t)) return a.fontSize >= ctx.maxFont * 0.8 && a.fontSize >= 22 ? "Figure" : repeated ? "Numbers" : "Number";
  if (repeated) {
    if (a.el.closest("li")) return "List items";
    if (a.tag === "TD" || a.el.closest("td")) return "Cells";
    return a.fontSize <= 13 ? "Captions" : "Labels";
  }
  if (!ctx.titleTaken && a.fontSize >= ctx.maxFont * 0.92 && y < 0.5) return "Title";
  if (a.upper && a.fontSize <= 15) return y > 0.8 ? "Footer label" : "Kicker";
  if (y > 0.82) return a.fontSize >= 18 ? "Footer title" : "Footnote";
  if (a.tag.match(/^H[1-6]$/) || a.fontSize >= ctx.maxFont * 0.8) return "Heading";
  if (a.tag === "TD") return "Cell";
  if (t.length > 70) return y < 0.45 ? "Description" : "Body text";
  if (y < 0.35 && a.fontSize >= 14) return "Subheading";
  if (a.fontSize <= 13) return repeated ? "Captions" : "Caption";
  return repeated ? "Labels" : "Text";
}

export function scanArtifact(root: Element): { elements: ArtifactElement[]; nodes: Map<string, Element[]> } {
  const rootRect = root.getBoundingClientRect();
  const atoms: Atom[] = [];
  const atomSet = new Set<Element>();

  for (const el of Array.from(root.querySelectorAll("*"))) {
    if (el.tagName === "STYLE" || el.tagName === "SCRIPT" || el.tagName === "BR") continue;
    if (el.parentElement?.closest(MEDIA) || el.matches(MEDIA)) continue;
    // Inside a text or icon already taken whole.
    let p: Element | null = el.parentElement;
    let skip = false;
    while (p && p !== root) {
      if (atomSet.has(p)) {
        skip = true;
        break;
      }
      p = p.parentElement;
    }
    if (skip) continue;
    const tag = el.tagName.toLowerCase();
    const inSvg = tag !== "svg" && !!el.closest("svg");
    // Inside an SVG only its text is content; the marks are the plot.
    if (inSvg && tag !== "text") continue;
    if (!isVisible(el, root)) continue;

    const r = el.getBoundingClientRect();
    const iconSized = r.width <= ICON_MAX && r.height <= ICON_MAX;
    let kind: Atom["kind"] | null = null;
    let label = "";
    if (tag === "svg" || tag === "img") {
      if (!iconSized) continue; // a plot or picture — look for text inside an SVG plot
      kind = "icon";
    } else if (el.getAttribute("data-el-kind") === "icon") kind = "icon";
    else if (tag === "text" ? fullText(el) : ownText(el)) kind = GLYPH.test(fullText(el)) ? "icon" : "text";
    else if (el.hasAttribute("data-el") && el.getAttribute("aria-label")) {
      kind = "text";
      label = el.getAttribute("aria-label")!;
    }
    if (!kind) continue;

    atomSet.add(el);
    const cs = getComputedStyle(el);
    atoms.push({
      el,
      kind,
      text: label || (kind === "text" || tag !== "svg" ? fullText(el) : "") || el.getAttribute("aria-label") || el.getAttribute("alt") || el.getAttribute("title") || "",
      fontSize: parseFloat(cs.fontSize) || 0,
      top: r.top + r.height / 2,
      height: r.height,
      tag: el.tagName.toUpperCase(),
      upper: cs.textTransform === "uppercase" || (kind === "text" && /^[^a-z]*[A-Z][^a-z]*$/.test(fullText(el)) && fullText(el).length > 2),
      name: declaredName(el, root),
    });
  }

  const textAtoms = atoms.filter((a) => a.kind === "text" && !a.el.closest(`[${OFF_ATTR}]`));
  const maxFont = Math.max(12, ...textAtoms.map((a) => a.fontSize));

  // Group atoms by their wildcarded path: one switch per part of a repeated item.
  const groups = new Map<string, { atoms: Atom[]; repeated: boolean }>();
  for (const a of atoms) {
    const p = pathOf(a.el, root);
    // Everything a family named as one part is one switch, wherever it sits.
    const key = a.name ? `n:${a.name}` : p.repeated ? `g:${p.group}` : `e:${p.exact}`;
    const g = groups.get(key) ?? { atoms: [], repeated: p.repeated };
    g.atoms.push(a);
    groups.set(key, g);
  }

  const elements: ArtifactElement[] = [];
  const nodes = new Map<string, Element[]>();
  let titleTaken = false;
  const used = new Map<string, number>();
  for (const [key, g] of groups) {
    const first = g.atoms[0]!;
    const ctx = { maxFont, rootTop: rootRect.top, rootH: rootRect.height, rootW: rootRect.width, titleTaken };
    const name = roleOf(first, ctx, g.repeated && g.atoms.length > 1);
    if (name === "Title") titleTaken = true;
    const n = (used.get(name) ?? 0) + 1;
    used.set(name, n);
    const texts = g.atoms.map((a) => a.text).filter(Boolean);
    const snippet =
      texts.length > 1
        ? texts.slice(0, 3).join(" · ") + (texts.length > 3 ? " …" : "")
        : texts[0] ?? "";
    elements.push({ key, name: name + (n > 1 ? ` ${n}` : ""), snippet, count: g.atoms.length, kind: first.kind, tagged: !!first.name });
    nodes.set(key, g.atoms.map((a) => a.el));
  }
  return { elements, nodes };
}

/**
 * Scans the artifact under `rootRef` whenever its structure changes and
 * applies the switched-off set. `resetKey` changes when the artifact or style
 * does — the hidden set and list start over.
 */
export function useArtifactElements(resetKey: string) {
  // A callback ref: the stage mounts the artifact only after measuring itself.
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const rootRef = useCallback((node: HTMLDivElement | null) => setRoot(node), []);
  const [elements, setElements] = useState<ArtifactElement[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const nodesRef = useRef<Map<string, Element[]>>(new Map());
  const hiddenRef = useRef(hidden);
  hiddenRef.current = hidden;

  const apply = useCallback(() => {
    for (const [key, els] of nodesRef.current) {
      const off = hiddenRef.current.has(key);
      for (const el of els) {
        el.setAttribute(KEY_ATTR, key);
        if (off) el.setAttribute(OFF_ATTR, "");
        else el.removeAttribute(OFF_ATTR);
      }
    }
  }, []);

  const scan = useCallback(() => {
    if (!root || !root.isConnected) return;
    const { elements: found, nodes } = scanArtifact(root);
    nodesRef.current = nodes;
    apply();
    setElements((prev) => {
      // Keep names that were given while an element was visible: switching
      // something off moves its neighbours, which would rename them.
      const prevByKey = new Map(prev.map((e) => [e.key, e]));
      return found.map((e) => (hiddenRef.current.has(e.key) && prevByKey.has(e.key) ? { ...prevByKey.get(e.key)!, count: e.count } : e));
    });
  }, [apply, root]);

  useLayoutEffect(() => {
    ensureStyles();
    setHidden(new Set());
    setElements([]);
    nodesRef.current = new Map();
  }, [resetKey]);

  useEffect(() => {
    if (!root) return;
    let t: number | undefined;
    let firstPending = 0;
    // Debounced, but never put off for more than a second — maps and live
    // widgets mutate continuously and would otherwise postpone it forever.
    const schedule = (ms: number) => {
      const now = performance.now();
      if (!firstPending) firstPending = now;
      window.clearTimeout(t);
      const wait = Math.max(0, Math.min(ms, firstPending + 1000 - now));
      t = window.setTimeout(() => {
        firstPending = 0;
        scan();
      }, wait);
    };
    schedule(350);
    // Charts lay out after measuring, media loads late — rescan on structure changes only.
    const mo = new MutationObserver(() => schedule(300));
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      window.clearTimeout(t);
      mo.disconnect();
    };
  }, [resetKey, root, scan]);

  useEffect(() => {
    apply();
  }, [hidden, apply]);

  const toggle = useCallback((key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const showAll = useCallback(() => setHidden(new Set()), []);
  const hideAll = useCallback(() => setHidden(new Set(nodesRef.current.keys())), []);

  const highlight = useCallback((key: string | null) => {
    root?.querySelectorAll(`[${HL_ATTR}]`).forEach((el) => el.removeAttribute(HL_ATTR));
    if (!key) return;
    for (const el of nodesRef.current.get(key) ?? []) el.setAttribute(HL_ATTR, "");
  }, [root]);

  return { rootRef, elements, hidden, toggle, showAll, hideAll, highlight };
}
