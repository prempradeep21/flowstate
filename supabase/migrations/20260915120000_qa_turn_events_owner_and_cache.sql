-- Phase 0 of per-user credit metering: make qa_turn_events cost-accurate and
-- attributable.
--
-- Two gaps this closes:
--   1. No owner. Per-user cost was only reconstructable offline by scraping
--      canvases.state, which cannot see unsaved or signed-out sessions.
--   2. No cache columns. Anthropic reports prompt-cache reads and writes in
--      separate buckets from input_tokens and bills them at ~0.1x and ~1.25x,
--      so a row without them understates real cost several-fold.

alter table public.qa_turn_events
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists cache_read_tokens int not null default 0,
  add column if not exists cache_creation_tokens int not null default 0;

comment on column public.qa_turn_events.owner_id is
  'Billing owner (auth user). Null for signed-out/guest turns.';
comment on column public.qa_turn_events.cache_read_tokens is
  'Anthropic prompt-cache reads, billed ~0.1x base input.';
comment on column public.qa_turn_events.cache_creation_tokens is
  'Anthropic prompt-cache writes, billed ~1.25x base input.';

-- Per-owner cost rollups over a time range are the main new query shape.
create index if not exists qa_turn_events_owner_created_at_idx
  on public.qa_turn_events (owner_id, created_at desc)
  where owner_id is not null;

-- RLS unchanged: service-role only, no public policies (see 20260701120000).
