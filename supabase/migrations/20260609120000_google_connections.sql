-- Per-user Google Workspace OAuth tokens (encrypted at rest by the app).
create table if not exists public.google_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  google_email text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  expires_at timestamptz not null,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_connections enable row level security;

create policy "Users read own google connection"
  on public.google_connections for select
  using (auth.uid() = user_id);

create policy "Users insert own google connection"
  on public.google_connections for insert
  with check (auth.uid() = user_id);

create policy "Users update own google connection"
  on public.google_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own google connection"
  on public.google_connections for delete
  using (auth.uid() = user_id);

create index if not exists google_connections_expires_at_idx
  on public.google_connections (expires_at);
