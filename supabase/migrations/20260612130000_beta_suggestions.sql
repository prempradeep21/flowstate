-- Beta suggestion inbox: persisted via submit_beta_suggestion RPC (security definer).

create table if not exists public.beta_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  user_email text not null default 'anonymous',
  page_url text,
  message text not null,
  image_urls text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  constraint beta_suggestions_message_length check (char_length(message) <= 4000)
);

create index if not exists beta_suggestions_created_at_idx
  on public.beta_suggestions (created_at desc);

alter table public.beta_suggestions enable row level security;

create or replace function public.submit_beta_suggestion(
  p_message text,
  p_page_url text default null,
  p_image_urls text[] default '{}'::text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_image_urls text[];
begin
  if p_message is null or length(trim(p_message)) = 0 then
    raise exception 'Message is required';
  end if;

  if length(trim(p_message)) > 4000 then
    raise exception 'Message is too long';
  end if;

  v_user_email := coalesce(nullif(trim(public.auth_user_email()), ''), 'anonymous');

  v_image_urls := coalesce(p_image_urls, '{}'::text[]);
  if coalesce(array_length(v_image_urls, 1), 0) > 3 then
    v_image_urls := v_image_urls[1:3];
  end if;

  insert into public.beta_suggestions (
    user_id,
    user_email,
    page_url,
    message,
    image_urls
  )
  values (
    v_user_id,
    v_user_email,
    nullif(trim(p_page_url), ''),
    trim(p_message),
    v_image_urls
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on table public.beta_suggestions from anon, authenticated;
grant execute on function public.submit_beta_suggestion(text, text, text[]) to anon, authenticated;
