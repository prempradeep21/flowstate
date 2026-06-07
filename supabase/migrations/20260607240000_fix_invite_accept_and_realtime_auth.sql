-- Reliable invite acceptance via security definer RPCs (JWT email is often empty
-- with Google OAuth) and Realtime authorization for canvas presence channels.

create or replace function public.auth_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(coalesce(
    nullif(trim(auth.jwt() ->> 'email'), ''),
    (select email from auth.users where id = auth.uid())
  ));
$$;

create or replace function public.accept_canvas_invite(p_invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := public.auth_user_email();
  v_invite record;
begin
  if v_user_id is null or v_email is null or v_email = '' then
    raise exception 'Not authenticated';
  end if;

  select * into v_invite
  from public.canvas_invites
  where id = p_invite_id
    and status = 'pending';

  if not found then
    raise exception 'Invite not found';
  end if;

  if lower(v_invite.email) <> v_email then
    raise exception 'Invite email does not match your account';
  end if;

  insert into public.canvas_collaborators (canvas_id, user_id, role)
  values (v_invite.canvas_id, v_user_id, v_invite.role)
  on conflict (canvas_id, user_id) do update set role = excluded.role;

  update public.canvas_invites
  set status = 'accepted'
  where id = p_invite_id;

  return v_invite.canvas_id;
end;
$$;

create or replace function public.process_pending_canvas_invites()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := public.auth_user_email();
  v_invite record;
begin
  if v_user_id is null or v_email is null or v_email = '' then
    return;
  end if;

  for v_invite in
    select id, canvas_id, role
    from public.canvas_invites
    where status = 'pending'
      and lower(email) = v_email
  loop
    insert into public.canvas_collaborators (canvas_id, user_id, role)
    values (v_invite.canvas_id, v_user_id, v_invite.role)
    on conflict (canvas_id, user_id) do update set role = excluded.role;

    update public.canvas_invites
    set status = 'accepted'
    where id = v_invite.id;
  end loop;
end;
$$;

create or replace function public.user_can_access_canvas_topic(
  p_topic text,
  p_user_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_canvas_id uuid;
begin
  if p_topic is null or p_user_id is null or p_topic not like 'canvas:%' then
    return false;
  end if;

  begin
    v_canvas_id := split_part(p_topic, ':', 2)::uuid;
  exception
    when others then
      return false;
  end;

  return public.user_canvas_role(v_canvas_id, p_user_id) is not null;
end;
$$;

revoke all on function public.auth_user_email() from public;
revoke all on function public.accept_canvas_invite(uuid) from public;
revoke all on function public.process_pending_canvas_invites() from public;
revoke all on function public.user_can_access_canvas_topic(text, uuid) from public;

grant execute on function public.auth_user_email() to authenticated;
grant execute on function public.accept_canvas_invite(uuid) to authenticated;
grant execute on function public.process_pending_canvas_invites() to authenticated;
grant execute on function public.user_can_access_canvas_topic(text, uuid) to authenticated;

-- Use auth.users email in invite-related read policies.
drop policy if exists "Invitees read invited canvases" on public.canvases;
create policy "Invitees read invited canvases"
  on public.canvases for select
  using (
    public.user_has_pending_canvas_invite(id, public.auth_user_email())
  );

drop policy if exists "Invitees view inviter profiles" on public.profiles;
create policy "Invitees view inviter profiles"
  on public.profiles for select
  using (
    public.user_has_pending_invite_from(id, public.auth_user_email())
  );

-- Realtime authorization for canvas presence/broadcast channels.
drop policy if exists "Canvas channel read" on realtime.messages;
create policy "Canvas channel read"
  on realtime.messages
  for select
  to authenticated
  using (
    (select realtime.topic()) like 'canvas:%'
    and public.user_can_access_canvas_topic(
      (select realtime.topic()),
      auth.uid()
    )
  );

drop policy if exists "Canvas channel write" on realtime.messages;
create policy "Canvas channel write"
  on realtime.messages
  for insert
  to authenticated
  with check (
    (select realtime.topic()) like 'canvas:%'
    and public.user_can_access_canvas_topic(
      (select realtime.topic()),
      auth.uid()
    )
  );
