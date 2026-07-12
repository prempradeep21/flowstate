"use client";

import { useEffect, useState } from "react";
import { MODELS, type ModelInfo } from "@/lib/models";
import {
  normalizePublishedModels,
  type PublishedModels,
} from "@/lib/modelConfig/publishedModelsTypes";

/** Native Claude models are always available (they run the Anthropic path). */
const ANTHROPIC_MODELS: ModelInfo[] = MODELS.filter(
  (m) => m.provider === "anthropic",
);

/** Fallback OpenRouter set (the static registry) if nothing is published yet. */
const FALLBACK_OPENROUTER: ModelInfo[] = MODELS.filter(
  (m) => m.provider === "openrouter",
);

function toModelInfo(published: PublishedModels): ModelInfo[] {
  return published.openrouterModels.map((m) => ({
    id: m.id,
    label: m.label,
    provider: "openrouter" as const,
    supportsTools: m.supportsTools,
    supportsImages: m.supportsImages,
  }));
}

// Module-level cache so many composer instances share a single fetch.
let cache: ModelInfo[] | null = null;
let inFlight: Promise<ModelInfo[]> | null = null;

async function loadModels(): Promise<ModelInfo[]> {
  if (cache) return cache;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/admin/models/published");
      const published = normalizePublishedModels(await res.json());
      const openrouter =
        published.openrouterModels.length > 0
          ? toModelInfo(published)
          : FALLBACK_OPENROUTER;
      cache = [...ANTHROPIC_MODELS, ...openrouter];
    } catch {
      cache = [...ANTHROPIC_MODELS, ...FALLBACK_OPENROUTER];
    } finally {
      inFlight = null;
    }
    return cache!;
  })();
  return inFlight;
}

/** Invalidate the shared cache (e.g. after an admin publishes). */
export function refreshSelectableModels(): void {
  cache = null;
  inFlight = null;
}

/**
 * The models a user may pick in the composer: native Claude (always) followed by
 * the admin-published OpenRouter selection. Renders synchronously from a static
 * fallback first, then swaps to the published list once fetched.
 */
export function useSelectableModels(): ModelInfo[] {
  const [models, setModels] = useState<ModelInfo[]>(
    () => cache ?? [...ANTHROPIC_MODELS, ...FALLBACK_OPENROUTER],
  );

  useEffect(() => {
    let active = true;
    void loadModels().then((next) => {
      if (active) setModels(next);
    });
    return () => {
      active = false;
    };
  }, []);

  return models;
}
