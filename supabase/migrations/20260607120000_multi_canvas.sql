-- Index for listing canvases by recency per owner
create index if not exists canvases_owner_updated_at_idx
  on public.canvases (owner_id, updated_at desc);

-- Create default canvas when a profile is created (empty snapshot; client seeds landing card)
create or replace function public.handle_new_user_canvas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.canvases (owner_id, title, state, is_default)
  values (
    new.id,
    'My canvas',
    jsonb_build_object('version', 1),
    true
  );
  return new;
end;
$$;

drop trigger if exists on_profile_created_canvas on public.profiles;
create trigger on_profile_created_canvas
  after insert on public.profiles
  for each row execute function public.handle_new_user_canvas();
