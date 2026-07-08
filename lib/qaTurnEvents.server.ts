import type {
  QaTurnFailureRow,
  QaTurnOutcome,
} from "@/lib/admin/qaTurnEventsTypes";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export type { QaTurnFailureRow } from "@/lib/admin/qaTurnEventsTypes";

export interface QaTurnEventInput {
  cardId?: string | null;
  canvasId?: string | null;
  question?: string | null;
  model?: string | null;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  toolTurns: number;
  pauseTurns: number;
  webSearchBlocks: number;
  artifactKind?: string | null;
  outcome: QaTurnOutcome;
  errorMessage?: string | null;
}

const MAX_QUESTION_CHARS = 2000;

/** Fire-and-forget insert; never blocks the chat response. */
export function logQaTurnEvent(input: QaTurnEventInput): void {
  void insertQaTurnEvent(input).catch((err) => {
    console.error("[qaTurnEvents] insert failed", err);
  });
}

async function insertQaTurnEvent(input: QaTurnEventInput): Promise<void> {
  const supabase = createServiceRoleClient();
  const question =
    input.question && input.question.length > MAX_QUESTION_CHARS
      ? `${input.question.slice(0, MAX_QUESTION_CHARS)}…`
      : input.question;

  const { error } = await supabase.from("qa_turn_events").insert({
    card_id: input.cardId ?? null,
    canvas_id: input.canvasId ?? null,
    question: question ?? null,
    model: input.model ?? null,
    duration_ms: input.durationMs,
    input_tokens: input.inputTokens,
    output_tokens: input.outputTokens,
    tool_turns: input.toolTurns,
    pause_turns: input.pauseTurns,
    web_search_blocks: input.webSearchBlocks,
    artifact_kind: input.artifactKind ?? null,
    outcome: input.outcome,
    error_message: input.errorMessage ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function fetchRecentQaTurnFailures(
  limit = 20,
): Promise<QaTurnFailureRow[]> {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("qa_turn_events")
    .select(
      "id, created_at, card_id, question, model, duration_ms, input_tokens, output_tokens, tool_turns, pause_turns, web_search_blocks, artifact_kind, outcome, error_message",
    )
    .neq("outcome", "success")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as QaTurnFailureRow[];
}
