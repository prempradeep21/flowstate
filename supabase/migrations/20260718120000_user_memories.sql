-- Cross-canvas user memory: one compact markdown doc of durable facts per user.
-- pending_notes buffers recent user questions between extraction runs so no
-- facts are lost while extraction is throttled to every K exchanges.
create table if not exists public.user_memories (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null default '',
  pending_notes text not null default '',
  turn_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_memories_updated_at on public.user_memories;
create trigger user_memories_updated_at
  before update on public.user_memories
  for each row execute function public.set_updated_at();

alter table public.user_memories enable row level security;

drop policy if exists "Users can view own memory" on public.user_memories;
create policy "Users can view own memory"
  on public.user_memories for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own memory" on public.user_memories;
create policy "Users can insert own memory"
  on public.user_memories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own memory" on public.user_memories;
create policy "Users can update own memory"
  on public.user_memories for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own memory" on public.user_memories;
create policy "Users can delete own memory"
  on public.user_memories for delete
  using (auth.uid() = user_id);
