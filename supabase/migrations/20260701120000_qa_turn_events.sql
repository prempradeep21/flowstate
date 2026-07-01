-- Structured Q&A turn telemetry for admin debugging (failures, latency, search counts).

create table if not exists public.qa_turn_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  card_id text,
  canvas_id uuid references public.canvases(id) on delete set null,
  question text,
  model text,
  duration_ms int,
  input_tokens int,
  output_tokens int,
  tool_turns int default 0,
  pause_turns int default 0,
  web_search_blocks int default 0,
  artifact_kind text,
  outcome text not null check (outcome in ('success', 'timeout', 'error', 'cancelled')),
  error_message text
);

create index if not exists qa_turn_events_created_at_idx
  on public.qa_turn_events (created_at desc);

create index if not exists qa_turn_events_outcome_idx
  on public.qa_turn_events (outcome, created_at desc);

alter table public.qa_turn_events enable row level security;

-- No public policies: service role only (same pattern as usage_analysis_snapshots).
