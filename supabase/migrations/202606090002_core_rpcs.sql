create or replace function public.can_create_gathering()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  used_count integer;
  week_start timestamptz := date_trunc('week', now());
begin
  if not public.is_verified_female() then
    raise exception 'VERIFICATION_REQUIRED';
  end if;
  if public.current_plan() <> 'premium' then
    return jsonb_build_object('allowed', false, 'used', 0, 'limit', 3, 'week_start', week_start);
  end if;

  select count(*) into used_count
  from public.gatherings
  where host_id = auth.uid()
    and source = 'direct'
    and created_at >= week_start
    and created_at < week_start + interval '7 days';

  return jsonb_build_object(
    'allowed', used_count < 3,
    'used', used_count,
    'limit', 3,
    'week_start', week_start
  );
end;
$$;

create or replace function public.create_gathering(payload jsonb)
returns public.gatherings
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_plan public.plan;
  quota jsonb;
  created public.gatherings;
begin
  if not public.is_verified_female() then
    raise exception 'VERIFICATION_REQUIRED';
  end if;

  caller_plan := public.current_plan();
  if caller_plan = 'premium' then
    quota := public.can_create_gathering();
    if not (quota->>'allowed')::boolean then
      raise exception 'WEEKLY_LIMIT';
    end if;
  end if;

  insert into public.gatherings (
    host_id, title, description, category, region, capacity, start_at, type,
    status, source, is_queer
  ) values (
    auth.uid(),
    payload->>'title',
    payload->>'description',
    payload->>'category',
    payload->>'region',
    (payload->>'capacity')::integer,
    (payload->>'start_at')::timestamptz,
    coalesce(payload->>'type', 'meetup'),
    case when caller_plan = 'premium' then 'open'::public.gathering_status
         else 'pending_review'::public.gathering_status end,
    case when caller_plan = 'premium' then 'direct'::public.gathering_source
         else 'community'::public.gathering_source end,
    coalesce((payload->>'is_queer')::boolean, false)
  )
  returning * into created;

  return created;
end;
$$;

create or replace function public.react(to_user uuid, type public.reaction_type)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_id uuid;
  chat_id uuid;
  daily_count integer;
  a uuid;
  b uuid;
begin
  if not public.is_verified_female() or not public.is_verified_female(to_user) then
    raise exception 'VERIFICATION_REQUIRED';
  end if;
  if to_user = auth.uid() then raise exception 'INVALID_TARGET'; end if;
  if exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = to_user)
       or (blocker_id = to_user and blocked_id = auth.uid())
  ) then raise exception 'BLOCKED'; end if;

  if type = 'super' and public.current_plan() = 'free' then
    raise exception 'PLAN_REQUIRED';
  end if;
  if type in ('like', 'super') and public.current_plan() = 'free' then
    select count(*) into daily_count from public.likes
    where from_user = auth.uid()
      and type in ('like', 'super')
      and created_at >= date_trunc('day', now());
    if daily_count >= 10 then raise exception 'DAILY_LIMIT'; end if;
  end if;

  insert into public.likes (from_user, to_user, type)
  values (auth.uid(), to_user, type)
  on conflict (from_user, to_user) do update set type = excluded.type, created_at = now();

  if type in ('like', 'super') and exists (
    select 1 from public.likes
    where from_user = to_user and likes.to_user = auth.uid() and likes.type in ('like', 'super')
  ) then
    a := least(auth.uid(), to_user);
    b := greatest(auth.uid(), to_user);
    insert into public.matches (user_a, user_b) values (a, b)
    on conflict (user_a, user_b) do update set user_a = excluded.user_a
    returning id into matched_id;
    insert into public.chats (match_id) values (matched_id)
    on conflict (match_id) do update set match_id = excluded.match_id
    returning id into chat_id;
    return jsonb_build_object('matched', true, 'match_id', matched_id, 'chat_id', chat_id);
  end if;

  return jsonb_build_object('matched', false);
end;
$$;

create or replace function public.apply_gathering(gathering_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare participant_id uuid;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  if not exists (
    select 1 from public.gatherings where id = gathering_id and status = 'open'
  ) then raise exception 'GATHERING_UNAVAILABLE'; end if;
  insert into public.gathering_participants (gathering_id, user_id)
  values (gathering_id, auth.uid())
  on conflict (gathering_id, user_id) do update set status = 'applied'
  returning id into participant_id;
  return participant_id;
end;
$$;

create or replace function public.block_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), target)
  on conflict do nothing;
end;
$$;

grant execute on function public.can_create_gathering() to authenticated;
grant execute on function public.create_gathering(jsonb) to authenticated;
grant execute on function public.react(uuid, public.reaction_type) to authenticated;
grant execute on function public.apply_gathering(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
