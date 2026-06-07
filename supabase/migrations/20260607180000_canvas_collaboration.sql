-- Canvas collaboration: invites, share links, RLS, collaborator cap

create extension if not exists pgcrypto with schema extensions;

alter table public.canvases
  add column if not exists allow_viewer_duplicate boolean not null default false;

create table if not exists public.canvas_invites (
  id uuid primary key default gen_random_uuid(),
  canvas_id uuid not null references public.canvases(id) on delete cascade,
  email text not null,
  role text not null check (role in ('editor', 'viewer')),
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (canvas_id, email)
);

create index if not exists canvas_invites_email_idx
  on public.canvas_invites (lower(email))
  where status = 'pending';

create table if not exists public.canvas_share_links (
  id uuid primary key default gen_random_uuid(),
  canvas_id uuid not null references public.canvases(id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  created_by uuid not null references public.profiles(id) on delete cascade,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (canvas_id)
);

create or replace function public.user_canvas_role(p_canvas_id uuid, p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.canvases c
      where c.id = p_canvas_id and c.owner_id = p_user_id
    ) then 'owner'
    when exists (
      select 1 from public.canvas_collaborators cc
      where cc.canvas_id = p_canvas_id and cc.user_id = p_user_id and cc.role = 'editor'
    ) then 'editor'
    when exists (
      select 1 from public.canvas_collaborators cc
      where cc.canvas_id = p_canvas_id and cc.user_id = p_user_id and cc.role = 'viewer'
    ) then 'viewer'
    else null
  end;
$$;

create or replace function public.users_share_canvas(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.canvases c
    where c.owner_id = p_user_a and (
      c.owner_id = p_user_b
      or exists (
        select 1 from public.canvas_collaborators cc
        where cc.canvas_id = c.id and cc.user_id = p_user_b
      )
    )
  )
  or exists (
    select 1
    from public.canvases c
    where c.owner_id = p_user_b and (
      c.owner_id = p_user_a
      or exists (
        select 1 from public.canvas_collaborators cc
        where cc.canvas_id = c.id and cc.user_id = p_user_a
      )
    )
  )
  or exists (
    select 1
    from public.canvas_collaborators cc1
    join public.canvas_collaborators cc2 on cc1.canvas_id = cc2.canvas_id
    where cc1.user_id = p_user_a and cc2.user_id = p_user_b
  );
$$;

create or replace function public.enforce_canvas_collaborator_cap()
returns trigger
language plpgsql
as $$
declare
  collab_count integer;
begin
  select count(*) into collab_count
  from public.canvas_collaborators
  where canvas_id = coalesce(new.canvas_id, old.canvas_id);

  if collab_count > 4 then
    raise exception 'Canvas collaborator limit reached (max 5 including owner)';
  end if;
  return new;
end;
$$;

drop trigger if exists canvas_collaborators_cap on public.canvas_collaborators;
create trigger canvas_collaborators_cap
  after insert or update on public.canvas_collaborators
  for each row execute function public.enforce_canvas_collaborator_cap();

alter table public.canvas_invites enable row level security;

drop policy if exists "Owners manage canvas invites" on public.canvas_invites;
create policy "Owners manage canvas invites"
  on public.canvas_invites for all
  using (
    exists (
      select 1 from public.canvases c
      where c.id = canvas_id and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.canvases c
      where c.id = canvas_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "Invitees read own pending invites" on public.canvas_invites;
create policy "Invitees read own pending invites"
  on public.canvas_invites for select
  using (
    status = 'pending'
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Invitees update own pending invites" on public.canvas_invites;
create policy "Invitees update own pending invites"
  on public.canvas_invites for update
  using (
    status = 'pending'
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

alter table public.canvas_share_links enable row level security;

drop policy if exists "Owners manage share links" on public.canvas_share_links;
create policy "Owners manage share links"
  on public.canvas_share_links for all
  using (
    exists (
      select 1 from public.canvases c
      where c.id = canvas_id and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.canvases c
      where c.id = canvas_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "Collaborators read share links" on public.canvas_share_links;
create policy "Collaborators read share links"
  on public.canvas_share_links for select
  using (
    public.user_canvas_role(canvas_id, auth.uid()) is not null
  );

drop policy if exists "Users read collaborators on accessible canvases" on public.canvas_collaborators;
create policy "Users read collaborators on accessible canvases"
  on public.canvas_collaborators for select
  using (
    public.user_canvas_role(canvas_id, auth.uid()) is not null
    or exists (
      select 1 from public.canvases c
      where c.id = canvas_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners manage collaborators" on public.canvas_collaborators;
create policy "Owners manage collaborators"
  on public.canvas_collaborators for insert
  with check (
    exists (
      select 1 from public.canvases c
      where c.id = canvas_id and c.owner_id = auth.uid()
    )
    and role in ('editor', 'viewer')
  );

drop policy if exists "Owners update collaborators" on public.canvas_collaborators;
create policy "Owners update collaborators"
  on public.canvas_collaborators for update
  using (
    exists (
      select 1 from public.canvases c
      where c.id = canvas_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners delete collaborators" on public.canvas_collaborators;
create policy "Owners delete collaborators"
  on public.canvas_collaborators for delete
  using (
    exists (
      select 1 from public.canvases c
      where c.id = canvas_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "Collaborators leave canvas" on public.canvas_collaborators;
create policy "Collaborators leave canvas"
  on public.canvas_collaborators for delete
  using (user_id = auth.uid());

drop policy if exists "Users view co-canvas profiles" on public.profiles;
create policy "Users view co-canvas profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.users_share_canvas(auth.uid(), id)
  );

drop policy if exists "Owners can view own canvases" on public.canvases;
create policy "Owners can view own canvases"
  on public.canvases for select
  using (
    auth.uid() = owner_id
    or public.user_canvas_role(id, auth.uid()) is not null
  );

drop policy if exists "Owners can update own canvases" on public.canvases;
create policy "Owners can update own canvases"
  on public.canvases for update
  using (
    auth.uid() = owner_id
    or public.user_canvas_role(id, auth.uid()) = 'editor'
  );

do $$
begin
  alter publication supabase_realtime add table public.canvases;
exception
  when duplicate_object then null;
end $$;
