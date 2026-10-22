"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { menuItemClass } from "@/components/MenuIcons";
import { useCanvasPortalAttr, useCanvasPortalClassName } from "@/components/canvasPortal";
import { useSelectableModels } from "@/hooks/useSelectableModels";
import { DEFAULT_MODEL_ID, type ModelInfo } from "@/lib/models";
import { useCanvasStore } from "@/lib/store";

/**
 * Compact model selector shown inline in the chat composer — so model choice is
 * available on every chat surface (new + follow-up), not just the sidebar.
 *
 * Backed by the global `selectedModel`, so the choice applies to all cards and
 * decides the provider: Claude ids run the native Anthropic path, everything
 * else routes through OpenRouter (see getModelProvider / app/api/chat/route.ts).
 *
 * When `restrictToAnthropic` is set (a PDF is attached — only the native
 * Anthropic path can read PDFs) the OpenRouter models are hidden and any
 * OpenRouter selection is forced back onto a Claude model.
 */
export function ComposerModelPicker({
  disabled = false,
  restrictToAnthropic = false,
}: {
  disabled?: boolean;
  restrictToAnthropic?: boolean;
}) {
  const selectedModel = useCanvasStore((s) => s.selectedModel);
  const setModel = useCanvasStore((s) => s.setModel);
  const models = useSelectableModels();
  const portalAttr = useCanvasPortalAttr();
  const packClassName = useCanvasPortalClassName();

  const anthropic = models.filter((m) => m.provider === "anthropic");
  const openrouter = restrictToAnthropic
    ? []
    : models.filter((m) => m.provider === "openrouter");

  // A PDF can only be read on the native Anthropic path — if an OpenRouter model
  // is selected when one is attached, switch to a Claude model.
  useEffect(() => {
    if (!restrictToAnthropic) return;
    const current = models.find((m) => m.id === selectedModel);
    if (!current || current.provider === "anthropic") return;
    const fallback =
      models.find(
        (m) => m.id === DEFAULT_MODEL_ID && m.provider === "anthropic",
      ) ?? models.find((m) => m.provider === "anthropic");
    if (fallback) setModel(fallback.id);
  }, [restrictToAnthropic, selectedModel, models, setModel]);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    right: number;
    top: number;
    above: boolean;
    maxHeight: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Portaled + fixed so the menu escapes the composer's overflow; opens above
  // the pill unless there's more room below.
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const above = rect.top > window.innerHeight - rect.bottom;
      setPos({
        right: window.innerWidth - rect.right,
        top: above ? rect.top - 8 : rect.bottom + 8,
        above,
        maxHeight: Math.min(
          420,
          (above ? rect.top : window.innerHeight - rect.bottom) - 24,
        ),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = models.find((m) => m.id === selectedModel);

  const renderItem = (m: ModelInfo) => {
    const selected = m.id === selectedModel;
    return (
      <button
        key={m.id}
        type="button"
        role="menuitemradio"
        aria-checked={selected}
        onClick={() => {
          setModel(m.id);
          setOpen(false);
        }}
        className={menuItemClass}
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-canvas-accent">
          {selected && <Check className="h-4 w-4" strokeWidth={2} />}
        </span>
        <span className="min-w-0 flex-1 truncate">{m.label}</span>
        {m.provider === "openrouter" && !m.supportsTools && (
          <span className="shrink-0 text-canvas-micro text-canvas-muted">
            Text only
          </span>
        )}
      </button>
    );
  };

  const sectionLabelClass =
    "px-3 pb-1 pt-2 text-canvas-micro font-medium uppercase tracking-wide text-canvas-muted";

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-label="Model"
        aria-haspopup="menu"
        aria-expanded={open}
        title={
          restrictToAnthropic
            ? "A PDF is attached — only Claude models can read PDFs"
            : "Model for this and future questions (Claude → Anthropic, others → OpenRouter)"
        }
        className={`flex max-w-[9.5rem] items-center gap-1.5 rounded-full border bg-canvas-bg py-1 pl-2.5 pr-2 text-canvas-micro outline-none transition-colors hover:border-canvas-muted hover:text-canvas-ink focus-visible:border-canvas-muted disabled:opacity-40 ${
          open
            ? "border-canvas-muted text-canvas-ink"
            : "border-canvas-border text-canvas-muted"
        }`}
      >
        <span className="min-w-0 truncate">{current?.label ?? "Model"}</span>
        <ChevronDown
          aria-hidden
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            // Portaled, but React still bubbles events to the card — whose
            // pointerdown starts a drag and swallows the click.
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Model"
            // On the canvas: follows the canvas style pack (8.4).
            {...portalAttr}
            data-canvas-menu=""
            className={`${packClassName} fixed z-[9999] w-[300px] overflow-y-auto rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card`}
            style={{
              right: pos.right,
              top: pos.top,
              maxHeight: pos.maxHeight,
              transform: pos.above ? "translateY(-100%)" : undefined,
            }}
          >
            <div className={sectionLabelClass}>Anthropic</div>
            {anthropic.map(renderItem)}
            {openrouter.length > 0 && (
              <>
                <div className="mx-3 my-1 border-t border-canvas-border" />
                <div className={sectionLabelClass}>OpenRouter</div>
                {openrouter.map(renderItem)}
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
