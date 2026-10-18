"use client";

import { AnimatePresence, m } from "framer-motion";
import { FileText, MessageSquare, Paperclip, Search, Type } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { MotionOverlayPopover } from "@/components/motion/MotionOverlay";
import { Icon } from "@/components/ui/Icon";
import {
  buildCanvasSearchIndex,
  searchCanvasIndex,
  type CanvasSearchEntry,
  type CanvasSearchKind,
} from "@/lib/canvasSearch";
import { focusSearchResult } from "@/lib/canvasSearchFocus";
import { framerTransition } from "@/lib/motion/transitions";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import {
  pushSearchHistory,
  readSearchHistory,
} from "@/lib/canvasSearchHistory";
import { useCanvasStore } from "@/lib/store";

const KIND_ICON: Record<CanvasSearchKind, LucideIcon> = {
  artifact: FileText,
  chat: MessageSquare,
  asset: Paperclip,
  label: Type,
};

const KIND_LABEL: Record<CanvasSearchKind, string> = {
  artifact: "Artifact",
  chat: "Chat",
  asset: "Input",
  label: "Label",
};

/** What the empty input cycles through: "Search artifacts", "Search chats"… */
const ROLLING_TARGETS = ["artifacts", "chats", "inputs", "labels"];
const ROLL_INTERVAL_MS = 1800;

/**
 * Stands in for the input's placeholder: a fixed "Search" with the thing being
 * searched rolling up beneath it, so the scope reads without a help line.
 */
function RollingPlaceholder() {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % ROLLING_TARGETS.length),
      ROLL_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  if (reducedMotion) {
    return <>Search artifacts, chats, inputs and labels</>;
  }

  return (
    <span className="flex items-center gap-[0.3em]">
      Search
      <span className="relative inline-flex h-[1.4em] overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <m.span
            key={ROLLING_TARGETS[index]}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={framerTransition("standard", "easeMedium")}
            className="inline-block"
          >
            {ROLLING_TARGETS[index]}
          </m.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

const rowBase =
  "flex w-full items-center gap-2.5 rounded-canvas px-2.5 py-2 text-left text-canvas-body-sm text-canvas-ink transition-colors";

/** Closed: the 46px icon chip. Open: the same shell, eased wider. */
const OPEN_WIDTH = "min(18rem, 50vw)";
const CLOSED_WIDTH = "46px";

/**
 * One shell for both states, so opening reads as the icon chip widening into
 * the bar (panelExpand: CSS width, standard / easeMedium) and the field fading
 * in just behind it; closing fades the field fast, then narrows back.
 */
export function CanvasSearch() {
  const { activeCanvasId } = useAuth();
  const canvasId = activeCanvasId ?? "local";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * Snapshot, not a subscription — the canvas can't change while the user is
   * typing, so rebuilding on each open keeps this component fully decoupled from
   * node collections and pan/zoom.
   */
  const indexRef = useRef<CanvasSearchEntry[]>([]);

  const openSearch = useCallback(() => {
    indexRef.current = buildCanvasSearchIndex(useCanvasStore.getState());
    setHistory(readSearchHistory(canvasId));
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }, [canvasId]);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const results = useMemo(
    () => (open ? searchCanvasIndex(indexRef.current, query) : []),
    [open, query],
  );

  const commit = useCallback(
    (entry: CanvasSearchEntry) => {
      pushSearchHistory(canvasId, query);
      focusSearchResult(entry);
      closeSearch();
    },
    [canvasId, query, closeSearch],
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Dismiss on outside pointerdown (capture phase, ignoring our own shell).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (shellRef.current?.contains(e.target as Node)) return;
      closeSearch();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, closeSearch]);

  // Cmd/Ctrl+K opens search from anywhere on the canvas.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      if (open) inputRef.current?.focus();
      else openSearch();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, openSearch]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Stops bubble-phase canvas shortcuts. The bare-letter ones (Q, Z) listen in
    // the capture phase on window and can't be stopped from here — the shell's
    // data-canvas-hotkeys="off" is what turns those off.
    e.stopPropagation();

    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length > 0) setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) {
        setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = results[activeIndex];
      if (entry) commit(entry);
    }
  };

  const showHistory = query.trim().length === 0;
  const listId = "canvas-search-results";

  return (
    <div
      ref={shellRef}
      data-canvas-hotkeys={open ? "off" : undefined}
      className="pointer-events-auto relative"
    >
      <div
        className="flex h-[46px] items-center overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card transition-[width] duration-motion-standard ease-motion-medium"
        style={{ width: open ? OPEN_WIDTH : CLOSED_WIDTH }}
      >
        <button
          type="button"
          aria-label="Search canvas"
          aria-expanded={open}
          onClick={() => (open ? inputRef.current?.focus() : openSearch())}
          className="btn m-[4px] h-9 w-9 shrink-0 rounded-canvas-md text-canvas-muted hover:text-canvas-ink"
        >
          <Icon icon={Search} />
        </button>
        <div
          aria-hidden={!open}
          className={`relative flex min-w-0 flex-1 items-center pr-3 transition-opacity motion-reduce:transition-none ${
            open
              ? "opacity-100 delay-[60ms] duration-motion-standard ease-motion-medium"
              : "pointer-events-none opacity-0 duration-motion-instant"
          }`}
        >
          {open && query.length === 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center whitespace-nowrap text-canvas-body-sm text-canvas-muted"
            >
              <RollingPlaceholder />
            </span>
          )}
          <input
            ref={inputRef}
            value={query}
            tabIndex={open ? 0 : -1}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            aria-label="Search this canvas"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={results.length > 0 ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={results[activeIndex]?.id}
            className="min-w-0 flex-1 bg-transparent text-canvas-body-sm text-canvas-ink outline-none"
          />
        </div>
      </div>

      <MotionOverlayPopover
        isOpen={open && !(showHistory && history.length === 0)}
        className={`absolute left-0 top-full z-[60] mt-2 w-[min(18rem,50vw)] rounded-canvas border border-canvas-border bg-canvas-card p-1 shadow-card`}
        style={{ transformOrigin: "top left" }}
      >
        {showHistory ? (
          <>
            <p className="px-2.5 py-1.5 text-canvas-caption text-canvas-muted">
              Recent
            </p>
            <ul>
              {history.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(q);
                      setActiveIndex(0);
                      inputRef.current?.focus();
                    }}
                    className={`btn ${rowBase} hover:bg-canvas-bg`}
                  >
                    <Icon icon={Search} className="text-canvas-muted" />
                    <span className="min-w-0 flex-1 truncate">{q}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : results.length === 0 ? (
          <p className="px-2.5 py-2 text-canvas-body-sm text-canvas-muted">
            No matches on this canvas.
          </p>
        ) : (
          <ul id={listId} role="listbox" aria-label="Search results">
            {results.map((entry, i) => (
              <li key={entry.id}>
                <button
                  type="button"
                  id={entry.id}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => commit(entry)}
                  className={`btn ${rowBase} ${
                    i === activeIndex ? "bg-canvas-bg" : ""
                  }`}
                >
                  <Icon
                    icon={KIND_ICON[entry.kind]}
                    className="text-canvas-muted"
                  />
                  <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                  <span className="shrink-0 text-canvas-caption text-canvas-muted">
                    {KIND_LABEL[entry.kind]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </MotionOverlayPopover>
    </div>
  );
}
