-- Nightly usage analysis snapshots (admin-only, service role reads/writes).

create table if not exists public.usage_analysis_snapshots (
  id uuid primary key default gen_random_uuid(),
  computed_at timestamptz not null default now(),
  timezone text not null default 'Asia/Kolkata',
  payload jsonb not null,
  stats jsonb not null default '{}'::jsonb
);

create index if not exists usage_analysis_snapshots_computed_at_idx
  on public.usage_analysis_snapshots (computed_at desc);

alter table public.usage_analysis_snapshots enable row level security;

revoke all on table public.usage_analysis_snapshots from anon, authenticated;
