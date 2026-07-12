// Shared (client + server safe — no fs) types for the admin-curated model list.
//
// The three native Claude models are ALWAYS available to users (they run the
// native Anthropic path). This config only stores the OpenRouter subset an admin
// has selected + prioritised — up to MAX_OPENROUTER_MODELS, in display order.

export interface SelectableOpenRouterModel {
  /** OpenRouter slug sent verbatim to the API, e.g. "openai/gpt-4o". */
  id: string;
  /** Display label shown in the composer dropdown. */
  label: string;
  /** Whether the model reliably supports function/tool calling (artifacts). */
  supportsTools: boolean;
  /** Whether the model accepts image input. */
  supportsImages: boolean;
}

export interface PublishedModels {
  v: 1;
  /** Priority-ordered OpenRouter models exposed to users (max MAX_OPENROUTER_MODELS). */
  openrouterModels: SelectableOpenRouterModel[];
}

/** Admin may expose at most this many OpenRouter models to users. */
export const MAX_OPENROUTER_MODELS = 10;

export const EMPTY_PUBLISHED_MODELS: PublishedModels = {
  v: 1,
  openrouterModels: [],
};

/** Runtime guard + normaliser for a single stored/selected OpenRouter model. */
export function normalizeSelectableModel(
  value: unknown,
): SelectableOpenRouterModel | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || !v.id.trim()) return null;
  const label =
    typeof v.label === "string" && v.label.trim() ? v.label.trim() : v.id;
  return {
    id: v.id.trim(),
    label,
    supportsTools: v.supportsTools !== false,
    supportsImages: Boolean(v.supportsImages),
  };
}

/** Coerce an arbitrary parsed value into a valid PublishedModels object. */
export function normalizePublishedModels(parsed: unknown): PublishedModels {
  if (!parsed || typeof parsed !== "object") return EMPTY_PUBLISHED_MODELS;
  const p = parsed as Record<string, unknown>;
  if (p.v !== 1 || !Array.isArray(p.openrouterModels)) {
    return EMPTY_PUBLISHED_MODELS;
  }
  const seen = new Set<string>();
  const models: SelectableOpenRouterModel[] = [];
  for (const raw of p.openrouterModels) {
    const model = normalizeSelectableModel(raw);
    if (!model || seen.has(model.id)) continue;
    seen.add(model.id);
    models.push(model);
    if (models.length >= MAX_OPENROUTER_MODELS) break;
  }
  return { v: 1, openrouterModels: models };
}
