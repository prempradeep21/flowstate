-- Allow invitees and share-link joiners to insert their own collaborator row.
-- Previously only canvas owners could INSERT, blocking accept/join flows.

drop policy if exists "Invitees accept pending invites" on public.canvas_collaborators;
create policy "Invitees accept pending invites"
  on public.canvas_collaborators for insert
  with check (
    user_id = auth.uid()
    and role in ('editor', 'viewer')
    and exists (
      select 1
      from public.canvas_invites ci
      where ci.canvas_id = canvas_id
        and ci.status = 'pending'
        and lower(ci.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and ci.role = canvas_collaborators.role
    )
  );

drop policy if exists "Users join via active share link" on public.canvas_collaborators;
create policy "Users join via active share link"
  on public.canvas_collaborators for insert
  with check (
    user_id = auth.uid()
    and role = 'viewer'
    and exists (
      select 1
      from public.canvas_share_links csl
      where csl.canvas_id = canvas_id
        and csl.revoked_at is null
    )
  );

-- Resolve share tokens without exposing all active links to authenticated users.
create or replace function public.join_canvas_via_share_token(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_canvas_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select canvas_id
  into v_canvas_id
  from public.canvas_share_links
  where token = p_token
    and revoked_at is null;

  if v_canvas_id is null then
    return null;
  end if;

  if public.user_canvas_role(v_canvas_id, v_user_id) is not null then
    return v_canvas_id;
  end if;

  insert into public.canvas_collaborators (canvas_id, user_id, role)
  values (v_canvas_id, v_user_id, 'viewer')
  on conflict (canvas_id, user_id) do nothing;

  return v_canvas_id;
end;
$$;

revoke all on function public.join_canvas_via_share_token(text) from public;
grant execute on function public.join_canvas_via_share_token(text) to authenticated;
