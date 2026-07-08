export type QaTurnOutcome = "success" | "timeout" | "error" | "cancelled";

export interface QaTurnFailureRow {
  id: string;
  created_at: string;
  card_id: string | null;
  question: string | null;
  model: string | null;
  duration_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  tool_turns: number | null;
  pause_turns: number | null;
  web_search_blocks: number | null;
  artifact_kind: string | null;
  outcome: string;
  error_message: string | null;
}
