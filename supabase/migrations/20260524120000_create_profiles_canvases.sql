-- profiles: extends auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- canvases: one row per canvas; v1 uses one default per owner
create table if not exists public.canvases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'My canvas',
  state jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists canvases_one_default_per_owner
  on public.canvases (owner_id)
  where is_default = true;

-- future collaboration (create now, unused in v1 UI)
create table if not exists public.canvas_collaborators (
  canvas_id uuid not null references public.canvases(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  invited_at timestamptz not null default now(),
  primary key (canvas_id, user_id)
);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists canvases_updated_at on public.canvases;
create trigger canvases_updated_at
  before update on public.canvases
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.canvases enable row level security;
alter table public.canvas_collaborators enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Owners can view own canvases" on public.canvases;
create policy "Owners can view own canvases"
  on public.canvases for select
  using (auth.uid() = owner_id);

drop policy if exists "Owners can insert own canvases" on public.canvases;
create policy "Owners can insert own canvases"
  on public.canvases for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update own canvases" on public.canvases;
create policy "Owners can update own canvases"
  on public.canvases for update
  using (auth.uid() = owner_id);

drop policy if exists "Owners can delete own canvases" on public.canvases;
create policy "Owners can delete own canvases"
  on public.canvases for delete
  using (auth.uid() = owner_id);
