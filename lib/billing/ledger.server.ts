import { isBillingWriteEnabled } from "@/lib/billing/enforcement";
import {
  PRICING_VERSION,
  costUsdFor,
  creditsFor,
  type UsageFacts,
} from "@/lib/billing/pricing";
import type { Surface, TurnOutcome } from "@/lib/billing/types";
import type { Json } from "@/lib/supabase/database.types";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/serviceRole";

export interface RecordUsageInput extends UsageFacts {
  /** Billing owner. Null for guests (visitorId carries them instead). */
  ownerId?: string | null;
  visitorId?: string | null;
  surface: Surface;
  provider?: string | null;
  outcome: TurnOutcome;
  durationMs?: number | null;
  canvasId?: string | null;
  cardId?: string | null;
  metadata?: Json;
}

/**
 * Records one metered event. Fire-and-forget by design: mirrors
 * lib/qaTurnEvents.server.ts exactly — void return, errors swallowed and
 * logged. A billing write must NEVER be able to break a user's request.
 *
 * Phase 1 writes `kind: 'record'` — pure observation, no hold/settle cycle and
 * no balance check. The hold/settle path arrives with enforcement in Phase 3.
 */
export function recordUsage(input: RecordUsageInput): void {
  void insertUsageRecord(input).catch((err) => {
    console.error("[billing/ledger] record failed", err);
  });
}

/** Awaitable variant, for callers that need the write to land before responding. */
export async function recordUsageAwait(input: RecordUsageInput): Promise<void> {
  try {
    await insertUsageRecord(input);
  } catch (err) {
    console.error("[billing/ledger] record failed", err);
  }
}

async function insertUsageRecord(input: RecordUsageInput): Promise<void> {
  if (!isBillingWriteEnabled() || !isServiceRoleConfigured()) return;

  // Nothing was consumed (e.g. a turn that failed before the first token), so
  // there is nothing to bill and nothing worth a row.
  const costUsd = costUsdFor(input);
  if (costUsd <= 0 && input.outcome !== "success") return;

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("usage_ledger").insert({
    owner_id: input.ownerId ?? null,
    visitor_id: input.visitorId ?? null,
    // Phase 1 has no billing periods yet; bucket by month so the rows already
    // group the way usage_counters will once periods exist.
    period_start: startOfMonthIso(),
    kind: "record",
    credits: creditsFor(input),
    surface: input.surface,
    provider: input.provider ?? null,
    model: input.model ?? null,
    input_tokens: input.inputTokens ?? 0,
    output_tokens: input.outputTokens ?? 0,
    cache_read_tokens: input.cacheReadTokens ?? 0,
    cache_creation_tokens: input.cacheCreationTokens ?? 0,
    web_searches: input.webSearches ?? 0,
    units: (input.cursorRuns ?? 0) + (input.tavilySearches ?? 0),
    duration_ms: input.durationMs ?? null,
    cost_usd: costUsd,
    pricing_version: PRICING_VERSION,
    canvas_id: input.canvasId ?? null,
    card_id: input.cardId ?? null,
    outcome: input.outcome,
    metadata: input.metadata ?? {},
  });

  if (error) throw error;
}

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

/** Anthropic's usage shape, structurally typed so the SDK isn't a dependency here. */
export interface AnthropicUsageLike {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/**
 * Maps an Anthropic `message.usage` onto our facts. Exists so the four-field
 * mapping lives in exactly one place — dropping the two cache fields is the
 * precise bug that made every recorded cost several-fold low before.
 */
export function fromAnthropicUsage(
  usage: AnthropicUsageLike | null | undefined,
): UsageFacts {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cacheReadTokens: usage?.cache_read_input_tokens ?? 0,
    cacheCreationTokens: usage?.cache_creation_input_tokens ?? 0,
  };
}
