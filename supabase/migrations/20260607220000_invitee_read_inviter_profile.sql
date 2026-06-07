-- Invitees can read inviter profiles and invited canvas metadata before accepting.

drop policy if exists "Invitees view inviter profiles" on public.profiles;
create policy "Invitees view inviter profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.canvas_invites ci
      where ci.invited_by = id
        and ci.status = 'pending'
        and lower(ci.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "Invitees read invited canvases" on public.canvases;
create policy "Invitees read invited canvases"
  on public.canvases for select
  using (
    exists (
      select 1
      from public.canvas_invites ci
      where ci.canvas_id = id
        and ci.status = 'pending'
        and lower(ci.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
