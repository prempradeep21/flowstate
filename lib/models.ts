// Central registry of selectable LLM models across providers.
//
// Claude models run on the native Anthropic path (full prompt caching / PDF /
// streaming). Everything else routes through OpenRouter's OpenAI-compatible
// API. Artifact emission needs reliable function calling, so each model
// declares `supportsTools`; the UI/route fall back to text for models without.

export type ModelProvider = "anthropic" | "openrouter";

export interface ModelInfo {
  /** Sent verbatim to the provider as the model id. */
  id: string;
  label: string;
  provider: ModelProvider;
  /** Whether the model reliably supports function/tool calling (artifacts). */
  supportsTools: boolean;
  /** Whether the model accepts image input. */
  supportsImages: boolean;
}

/** A model id is free-form (Claude ids or OpenRouter slugs like "openai/gpt-4o"). */
export type ModelId = string;

export const MODELS: ModelInfo[] = [
  // --- Anthropic (native path) ---
  { id: "claude-opus-4-7", label: "Claude Opus 4.7", provider: "anthropic", supportsTools: true, supportsImages: true },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic", supportsTools: true, supportsImages: true },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic", supportsTools: true, supportsImages: true },

  // --- OpenRouter (OpenAI-compatible path) ---
  { id: "openai/gpt-4o", label: "GPT-4o (OpenRouter)", provider: "openrouter", supportsTools: true, supportsImages: true },
  { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash (OpenRouter)", provider: "openrouter", supportsTools: true, supportsImages: true },
  { id: "deepseek/deepseek-chat", label: "DeepSeek Chat (OpenRouter)", provider: "openrouter", supportsTools: true, supportsImages: false },
];

export const DEFAULT_MODEL_ID: ModelId = "claude-sonnet-4-6";

const MODELS_BY_ID = new Map(MODELS.map((m) => [m.id, m]));

export function getModel(id: string): ModelInfo | undefined {
  return MODELS_BY_ID.get(id);
}

export function isKnownModel(id: string): boolean {
  return MODELS_BY_ID.has(id);
}

/**
 * Provider for a model id. Falls back to a heuristic for unknown ids so future
 * OpenRouter slugs work without a registry entry: `claude-*` is Anthropic,
 * a `vendor/model` slug is OpenRouter.
 */
export function getModelProvider(id: string): ModelProvider {
  const known = MODELS_BY_ID.get(id);
  if (known) return known.provider;
  return id.startsWith("claude-") ? "anthropic" : "openrouter";
}

export function modelSupportsTools(id: string): boolean {
  return getModel(id)?.supportsTools ?? true;
}
