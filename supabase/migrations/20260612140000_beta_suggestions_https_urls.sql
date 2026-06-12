-- Tighten feedback image URL validation to HTTPS-only (matches API route).

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
  v_image_urls text[] := '{}'::text[];
  v_url text;
begin
  if p_message is null or length(trim(p_message)) = 0 then
    raise exception 'Message is required';
  end if;

  if length(trim(p_message)) > 4000 then
    raise exception 'Message is too long';
  end if;

  v_user_email := coalesce(nullif(trim(public.auth_user_email()), ''), 'anonymous');

  if p_image_urls is not null then
    foreach v_url in array p_image_urls loop
      v_url := trim(v_url);
      if v_url <> '' and v_url like 'https://%' then
        v_image_urls := array_append(v_image_urls, v_url);
      end if;
      exit when coalesce(array_length(v_image_urls, 1), 0) >= 3;
    end loop;
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

grant execute on function public.submit_beta_suggestion(text, text, text[]) to anon, authenticated;
