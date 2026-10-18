"use client";

import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useSelectableModels } from "@/hooks/useSelectableModels";
import { DEFAULT_MODEL_ID } from "@/lib/models";
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

  // The native arrow hugs the right edge of the pill, so it's hidden
  // (appearance-none) and drawn here with matching inset on both sides.
  return (
    <div className="relative shrink-0">
      <select
        value={selectedModel}
        onChange={(e) => setModel(e.target.value)}
        disabled={disabled}
        aria-label="Model"
        title={
          restrictToAnthropic
            ? "A PDF is attached — only Claude models can read PDFs"
            : "Model for this and future questions (Claude → Anthropic, others → OpenRouter)"
        }
        className="block max-w-[9.5rem] cursor-pointer appearance-none truncate rounded-full border border-canvas-border bg-canvas-bg py-1 pl-2.5 pr-7 text-canvas-micro text-canvas-muted outline-none transition-colors hover:border-canvas-muted hover:text-canvas-ink focus:border-canvas-muted disabled:opacity-40"
      >
        <optgroup label="Anthropic">
          {anthropic.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </optgroup>
        {openrouter.length > 0 && (
          <optgroup label="OpenRouter">
            {openrouter.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
                {m.supportsTools ? "" : " (text only)"}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-canvas-muted"
        strokeWidth={2}
      />
    </div>
  );
}
