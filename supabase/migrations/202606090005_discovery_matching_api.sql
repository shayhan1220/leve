drop function if exists public.discover_feed(jsonb, timestamptz);

create function public.discover_feed(
  filters jsonb default '{}'::jsonb,
  cursor timestamptz default null
)
returns table (
  user_id uuid,
  nickname text,
  age integer,
  region text,
  bio text,
  looking_for text[],
  identity_tags text[],
  photo_path text,
  compatibility integer,
  score_breakdown jsonb,
  love_dna_clan text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  precise_filter_requested boolean :=
    filters ? 'max_distance_km' or filters ? 'verified_only';
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  if precise_filter_requested and public.current_plan() = 'free' then
    raise exception 'PLAN_REQUIRED';
  end if;
  if coalesce((filters->>'queer')::boolean, false)
    and not exists (
      select 1 from public.profiles viewer
      where viewer.user_id = auth.uid() and viewer.queer_optin
    )
  then raise exception 'QUEER_OPTIN_REQUIRED'; end if;

  return query
  select
    p.user_id,
    p.nickname,
    p.age,
    p.region,
    p.bio,
    p.looking_for,
    case
      when p.queer_optin and not p.queer_visible_in_main then '{}'::text[]
      else p.identity_tags
    end,
    photo.storage_path,
    greatest(0, least(100, round(
      100 - (
        abs(coalesce(me.axis_s, 50) - coalesce(them.axis_s, 50)) +
        abs(coalesce(me.axis_d, 50) - coalesce(them.axis_d, 50)) +
        abs(coalesce(me.axis_a, 50) - coalesce(them.axis_a, 50)) +
        abs(coalesce(me.axis_v, 50) - coalesce(them.axis_v, 50)) +
        abs(coalesce(me.axis_m, 50) - coalesce(them.axis_m, 50))
      ) / 5
    )))::integer,
    jsonb_build_object(
      'S', 100 - abs(coalesce(me.axis_s, 50) - coalesce(them.axis_s, 50)),
      'D', 100 - abs(coalesce(me.axis_d, 50) - coalesce(them.axis_d, 50)),
      'A', 100 - abs(coalesce(me.axis_a, 50) - coalesce(them.axis_a, 50)),
      'V', 100 - abs(coalesce(me.axis_v, 50) - coalesce(them.axis_v, 50)),
      'M', 100 - abs(coalesce(me.axis_m, 50) - coalesce(them.axis_m, 50))
    ),
    them.clan,
    p.created_at
  from public.profiles p
  join public.verifications verification
    on verification.user_id = p.user_id
   and verification.is_verified
   and verification.is_female
   and verification.age >= 19
  left join public.love_dna_profiles me on me.user_id = auth.uid()
  left join public.love_dna_profiles them on them.user_id = p.user_id
  left join lateral (
    select pp.storage_path
    from public.profile_photos pp
    where pp.user_id = p.user_id
    order by pp.order_idx
    limit 1
  ) photo on true
  where p.user_id <> auth.uid()
    and (cursor is null or p.created_at < cursor)
    and (not filters ? 'region' or p.region = filters->>'region')
    and (
      not p.queer_optin
      or p.queer_visible_in_main
      or coalesce((filters->>'queer')::boolean, false)
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.user_id)
         or (b.blocker_id = p.user_id and b.blocked_id = auth.uid())
    )
    and not exists (
      select 1 from public.likes l
      where l.from_user = auth.uid() and l.to_user = p.user_id
    )
  order by
    case when public.current_plan() = 'premium' then
      exists (
        select 1 from public.subscriptions s
        where s.user_id = p.user_id and s.plan = 'premium'
          and s.status in ('active', 'grace')
          and (s.expires_at is null or s.expires_at > now())
      )
    else false end desc,
    9 desc,
    p.created_at desc
  limit greatest(1, least(coalesce((filters->>'limit')::integer, 20), 50));
end;
$$;

create or replace function public.list_matches()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare result jsonb;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'match_id', m.id,
    'chat_id', c.id,
    'matched_at', m.created_at,
    'user_id', other.user_id,
    'nickname', other.nickname,
    'age', other.age,
    'region', other.region,
    'bio', other.bio,
    'photo_path', photo.storage_path,
    'last_message', latest.body,
    'last_message_at', latest.created_at,
    'unread_count', coalesce(unread.count, 0)
  ) order by coalesce(latest.created_at, m.created_at) desc), '[]'::jsonb)
  into result
  from public.matches m
  join public.chats c on c.match_id = m.id
  join public.profiles other
    on other.user_id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  left join lateral (
    select pp.storage_path from public.profile_photos pp
    where pp.user_id = other.user_id order by pp.order_idx limit 1
  ) photo on true
  left join lateral (
    select msg.body, msg.created_at
    from public.messages msg
    where msg.chat_id = c.id
    order by msg.created_at desc
    limit 1
  ) latest on true
  left join lateral (
    select count(*)::integer
    from public.messages msg
    where msg.chat_id = c.id
      and msg.sender_id <> auth.uid()
      and msg.read_at is null
  ) unread on true
  where auth.uid() in (m.user_a, m.user_b)
    and public.is_verified_female(other.user_id)
    and public.is_not_blocked(other.user_id);

  return result;
end;
$$;

revoke all on function public.discover_feed(jsonb, timestamptz) from public;
revoke all on function public.list_matches() from public;
grant execute on function public.discover_feed(jsonb, timestamptz) to authenticated;
grant execute on function public.list_matches() to authenticated;
