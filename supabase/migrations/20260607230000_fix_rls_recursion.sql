-- Break RLS recursion cycles between canvas_invites, canvases, and profiles.
-- Cross-table policy subqueries re-triggered RLS (42P17). Use security definer helpers.

create or replace function public.user_owns_canvas(p_canvas_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.canvases c
    where c.id = p_canvas_id
      and c.owner_id = p_user_id
  );
$$;

create or replace function public.user_has_pending_canvas_invite(
  p_canvas_id uuid,
  p_email text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.canvas_invites ci
    where ci.canvas_id = p_canvas_id
      and ci.status = 'pending'
      and lower(ci.email) = lower(coalesce(nullif(trim(p_email), ''), ''))
  );
$$;

create or replace function public.user_has_pending_invite_from(
  p_inviter_id uuid,
  p_email text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.canvas_invites ci
    where ci.invited_by = p_inviter_id
      and ci.status = 'pending'
      and lower(ci.email) = lower(coalesce(nullif(trim(p_email), ''), ''))
  );
$$;

create or replace function public.user_pending_invite_matches(
  p_canvas_id uuid,
  p_email text,
  p_role text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.canvas_invites ci
    where ci.canvas_id = p_canvas_id
      and ci.status = 'pending'
      and lower(ci.email) = lower(coalesce(nullif(trim(p_email), ''), ''))
      and ci.role = p_role
  );
$$;

create or replace function public.canvas_has_active_share_link(p_canvas_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.canvas_share_links csl
    where csl.canvas_id = p_canvas_id
      and csl.revoked_at is null
  );
$$;

revoke all on function public.user_owns_canvas(uuid, uuid) from public;
revoke all on function public.user_has_pending_canvas_invite(uuid, text) from public;
revoke all on function public.user_has_pending_invite_from(uuid, text) from public;
revoke all on function public.user_pending_invite_matches(uuid, text, text) from public;
revoke all on function public.canvas_has_active_share_link(uuid) from public;

grant execute on function public.user_owns_canvas(uuid, uuid) to authenticated;
grant execute on function public.user_has_pending_canvas_invite(uuid, text) to authenticated;
grant execute on function public.user_has_pending_invite_from(uuid, text) to authenticated;
grant execute on function public.user_pending_invite_matches(uuid, text, text) to authenticated;
grant execute on function public.canvas_has_active_share_link(uuid) to authenticated;

-- canvas_invites
drop policy if exists "Owners manage canvas invites" on public.canvas_invites;
create policy "Owners manage canvas invites"
  on public.canvas_invites for all
  using (public.user_owns_canvas(canvas_id, auth.uid()))
  with check (public.user_owns_canvas(canvas_id, auth.uid()));

-- canvases
drop policy if exists "Invitees read invited canvases" on public.canvases;
create policy "Invitees read invited canvases"
  on public.canvases for select
  using (
    public.user_has_pending_canvas_invite(id, coalesce(auth.jwt() ->> 'email', ''))
  );

-- profiles
drop policy if exists "Invitees view inviter profiles" on public.profiles;
create policy "Invitees view inviter profiles"
  on public.profiles for select
  using (
    public.user_has_pending_invite_from(id, coalesce(auth.jwt() ->> 'email', ''))
  );

-- canvas_collaborators
drop policy if exists "Invitees accept pending invites" on public.canvas_collaborators;
create policy "Invitees accept pending invites"
  on public.canvas_collaborators for insert
  with check (
    user_id = auth.uid()
    and role in ('editor', 'viewer')
    and public.user_pending_invite_matches(
      canvas_id,
      coalesce(auth.jwt() ->> 'email', ''),
      role
    )
  );

drop policy if exists "Users join via active share link" on public.canvas_collaborators;
create policy "Users join via active share link"
  on public.canvas_collaborators for insert
  with check (
    user_id = auth.uid()
    and role = 'viewer'
    and public.canvas_has_active_share_link(canvas_id)
  );

drop policy if exists "Users read collaborators on accessible canvases" on public.canvas_collaborators;
create policy "Users read collaborators on accessible canvases"
  on public.canvas_collaborators for select
  using (
    public.user_canvas_role(canvas_id, auth.uid()) is not null
    or public.user_owns_canvas(canvas_id, auth.uid())
  );

drop policy if exists "Owners manage collaborators" on public.canvas_collaborators;
create policy "Owners manage collaborators"
  on public.canvas_collaborators for insert
  with check (
    public.user_owns_canvas(canvas_id, auth.uid())
    and role in ('editor', 'viewer')
  );

drop policy if exists "Owners update collaborators" on public.canvas_collaborators;
create policy "Owners update collaborators"
  on public.canvas_collaborators for update
  using (public.user_owns_canvas(canvas_id, auth.uid()));

drop policy if exists "Owners delete collaborators" on public.canvas_collaborators;
create policy "Owners delete collaborators"
  on public.canvas_collaborators for delete
  using (public.user_owns_canvas(canvas_id, auth.uid()));

-- canvas_share_links
drop policy if exists "Owners manage share links" on public.canvas_share_links;
create policy "Owners manage share links"
  on public.canvas_share_links for all
  using (public.user_owns_canvas(canvas_id, auth.uid()))
  with check (public.user_owns_canvas(canvas_id, auth.uid()));
