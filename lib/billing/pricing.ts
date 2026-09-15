// Cost model. Converts raw provider usage into USD, then into "credits".
//
// The whole design rests on one property: credits are a pure function of raw
// upstream cost. Margin lives in the PLAN PRICE, never here. Swap a model for
// a cheaper one and the same question simply costs fewer credits — no
// repricing, no code change, no user-visible churn.

/** Bump when any rate below changes, so historical rows stay recomputable. */
export const PRICING_VERSION = "v1";

/** 1 credit == $0.002 of raw upstream cost. */
export const USD_PER_CREDIT = 0.002;

/**
 * Prompt-cache multipliers, relative to base input price.
 * Verified 2026-09-11 against platform.claude.com/docs/en/about-claude/pricing.
 * These match the values already used by lib/admin/usageAnalysisTypes.ts.
 */
export const CACHE_READ_MULTIPLIER = 0.1;
export const CACHE_WRITE_MULTIPLIER = 1.25;

export interface ModelRate {
  /** USD per 1M input tokens. */
  inputPerMTok: number;
  /** USD per 1M output tokens. */
  outputPerMTok: number;
  /** Defaults to inputPerMTok * CACHE_READ_MULTIPLIER. */
  cacheReadPerMTok?: number;
  /** Defaults to inputPerMTok * CACHE_WRITE_MULTIPLIER. */
  cacheWritePerMTok?: number;
}

/**
 * USD per 1M tokens, keyed by model-id PREFIX so dated ids resolve
 * (claude-haiku-4-5-20251001 -> claude-haiku-4-5). Longest prefix wins.
 *
 * Anthropic rates verified 2026-09-11 against the official pricing page.
 * OpenRouter rates are indicative — OpenRouter's /models endpoint returns live
 * per-model pricing and should eventually hydrate these (see TODO below).
 */
export const MODEL_RATES: Record<string, ModelRate> = {
  // --- Anthropic (verified) ---
  "claude-opus-5": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-8": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-7": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-6": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-sonnet-5": { inputPerMTok: 2, outputPerMTok: 10 },
  "claude-sonnet-4-6": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5 },

  // --- OpenRouter (indicative; verify before enforcement) ---
  "openai/gpt-4o": { inputPerMTok: 2.5, outputPerMTok: 10 },
  "google/gemini-2.0-flash-001": { inputPerMTok: 0.1, outputPerMTok: 0.4 },
  "deepseek/deepseek-chat": { inputPerMTok: 0.3, outputPerMTok: 1.2 },
};

/**
 * Fallback for an unrecognised model id. Deliberately EXPENSIVE: an unmapped
 * model should overcharge loudly rather than bleed money silently. The admin
 * dashboard alarms on rows that land here.
 */
export const UNKNOWN_MODEL_RATE: ModelRate = {
  inputPerMTok: 5,
  outputPerMTok: 25,
};

/** Flat USD costs for spend that isn't measured in tokens. */
export const NON_TOKEN_USD = {
  /** Anthropic hosted web search: $10 per 1,000 searches. Verified 2026-09-11. */
  webSearch: 0.01,
  /**
   * One Cursor composer run. The SDK surfaces NO usage, so this is a flat
   * estimate, not a measurement. Calibrate in Phase 4.5 from:
   *   (Cursor invoice for the period) / (count of ledger rows, surface='custom-ui')
   */
  cursorRun: 0.3,
  /** Tavily search (lib/chartDataFetch.ts). Indicative. */
  tavilySearch: 0.005,
} as const;

/** Longest-prefix match against MODEL_RATES. */
export function rateForModel(modelId: string | null | undefined): ModelRate {
  if (!modelId) return UNKNOWN_MODEL_RATE;
  const id = modelId.trim();
  let best: { len: number; rate: ModelRate } | null = null;
  for (const [prefix, rate] of Object.entries(MODEL_RATES)) {
    if (id.startsWith(prefix) && (!best || prefix.length > best.len)) {
      best = { len: prefix.length, rate };
    }
  }
  return best?.rate ?? UNKNOWN_MODEL_RATE;
}

/** True when the id fell through to UNKNOWN_MODEL_RATE (drives the admin alarm). */
export function isUnknownModel(modelId: string | null | undefined): boolean {
  return rateForModel(modelId) === UNKNOWN_MODEL_RATE;
}

export interface UsageFacts {
  model?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  /** Anthropic hosted web_search invocations. */
  webSearches?: number;
  /** Cursor composer runs. */
  cursorRuns?: number;
  tavilySearches?: number;
}

const PER_MTOK = 1_000_000;

/** Raw upstream cost in USD. The only place provider rates are applied. */
export function costUsdFor(facts: UsageFacts): number {
  const rate = rateForModel(facts.model);
  const cacheRead =
    rate.cacheReadPerMTok ?? rate.inputPerMTok * CACHE_READ_MULTIPLIER;
  const cacheWrite =
    rate.cacheWritePerMTok ?? rate.inputPerMTok * CACHE_WRITE_MULTIPLIER;

  const tokens =
    (facts.inputTokens ?? 0) * rate.inputPerMTok +
    (facts.outputTokens ?? 0) * rate.outputPerMTok +
    (facts.cacheReadTokens ?? 0) * cacheRead +
    (facts.cacheCreationTokens ?? 0) * cacheWrite;

  const nonToken =
    (facts.webSearches ?? 0) * NON_TOKEN_USD.webSearch +
    (facts.cursorRuns ?? 0) * NON_TOKEN_USD.cursorRun +
    (facts.tavilySearches ?? 0) * NON_TOKEN_USD.tavilySearch;

  return tokens / PER_MTOK + nonToken;
}

/**
 * Credits for a unit of work, rounded to 4dp to match numeric(12,4) in
 * Postgres. Never accumulate credits in JS — the running total lives in the
 * database so it cannot drift.
 */
export function creditsFor(facts: UsageFacts): number {
  return Math.round((costUsdFor(facts) / USD_PER_CREDIT) * 10_000) / 10_000;
}

// TODO(Phase 4.5): hydrate the OpenRouter entries from its /models endpoint,
// which returns live per-model pricing, so those models are self-pricing.

export interface EstimateInput {
  model: string;
  /** Characters of prompt we are about to send (system + history + question). */
  promptChars: number;
  /** The route's output token budget. */
  maxTokens: number;
  /** Tool loops re-send the transcript; caching absorbs most but not all of it. */
  expectedToolTurns?: number;
  webSearchEnabled?: boolean;
}

/** ~4 characters per token is close enough for a pre-flight estimate. */
const CHARS_PER_TOKEN = 4;

/**
 * Rough pre-flight cost estimate, used only to decide whether a request fits
 * inside the remaining balance. Deliberately NOT exact: the true cost is only
 * knowable after the call, and is recorded then. Anthropic's count_tokens
 * endpoint is rejected here on purpose — a network round-trip on every request
 * to refine a number that gets reconciled anyway.
 */
export function estimateCredits(input: EstimateInput): number {
  const inputTokens = Math.ceil(input.promptChars / CHARS_PER_TOKEN);
  // Assume output lands around 60% of the budget rather than hitting the cap.
  const outputTokens = Math.ceil(input.maxTokens * 0.6);
  const turnMultiplier = 1 + (input.expectedToolTurns ?? 0) * 0.5;

  return creditsFor({
    model: input.model,
    inputTokens: Math.ceil(inputTokens * turnMultiplier),
    outputTokens,
    webSearches: input.webSearchEnabled ? 2 : 0,
  });
}
