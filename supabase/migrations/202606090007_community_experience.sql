create or replace function public.community_feed(
  gathering_type text default null,
  page_size integer default 20
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  viewer public.profiles;
  result jsonb;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  if gathering_type is not null and gathering_type not in ('meetup', 'flash') then
    raise exception 'INVALID_GATHERING_TYPE';
  end if;

  select * into viewer from public.profiles where user_id = auth.uid();

  select jsonb_build_object(
    'gatherings',
    coalesce((
      select jsonb_agg(item order by (item->>'start_at')::timestamptz)
      from (
        select to_jsonb(g) || jsonb_build_object(
          'confirmed_count', count(gp.id) filter (where gp.status = 'confirmed'),
          'applied_count', count(gp.id) filter (where gp.status = 'applied'),
          'my_status', max(gp.status::text) filter (where gp.user_id = auth.uid())
        ) as item
        from public.gatherings g
        left join public.gathering_participants gp on gp.gathering_id = g.id
        where g.status = 'open'
          and (community_feed.gathering_type is null or g.type = community_feed.gathering_type)
          and public.is_not_blocked(g.host_id)
          and (not g.is_queer or viewer.queer_optin)
        group by g.id
        order by g.start_at
        limit least(greatest(page_size, 1), 50)
      ) feed
    ), '[]'::jsonb),
    'events',
    coalesce((
      select jsonb_agg(to_jsonb(e) order by e.start_at)
      from public.events e
      where e.status in ('upcoming', 'live')
        and (not e.is_queer or viewer.queer_optin)
    ), '[]'::jsonb),
    'groups',
    coalesce((
      select jsonb_agg(
        to_jsonb(g) || jsonb_build_object(
          'member_count', (select count(*) from public.group_members gm where gm.group_id = g.id),
          'is_member', exists (
            select 1 from public.group_members gm
            where gm.group_id = g.id and gm.user_id = auth.uid()
          )
        )
        order by g.created_at desc
      )
      from public.groups g
      where not g.is_queer or viewer.queer_optin
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function public.get_gathering_detail(target_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  gathering public.gatherings;
  viewer public.profiles;
  result jsonb;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;

  select * into gathering from public.gatherings where id = target_id;
  if gathering.id is null then raise exception 'GATHERING_NOT_FOUND'; end if;

  select * into viewer from public.profiles where user_id = auth.uid();
  if gathering.status <> 'open' and gathering.host_id <> auth.uid() then
    raise exception 'GATHERING_UNAVAILABLE';
  end if;
  if not public.is_not_blocked(gathering.host_id) then raise exception 'BLOCKED'; end if;
  if gathering.is_queer and not viewer.queer_optin then raise exception 'QUEER_OPTIN_REQUIRED'; end if;

  select to_jsonb(gathering) || jsonb_build_object(
    'host_nickname', host.nickname,
    'host_region', host.region,
    'confirmed_count', count(gp.id) filter (where gp.status = 'confirmed'),
    'applied_count', count(gp.id) filter (where gp.status = 'applied'),
    'my_status', max(gp.status::text) filter (where gp.user_id = auth.uid()),
    'is_host', gathering.host_id = auth.uid()
  )
  into result
  from public.profiles host
  left join public.gathering_participants gp on gp.gathering_id = gathering.id
  where host.user_id = gathering.host_id
  group by host.user_id;

  return result;
end;
$$;

create or replace function public.hosted_gatherings_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare result jsonb;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  select coalesce(jsonb_agg(item order by (item->>'created_at')::timestamptz desc), '[]'::jsonb)
  into result
  from (
    select to_jsonb(g) || jsonb_build_object(
      'confirmed_count', count(gp.id) filter (where gp.status = 'confirmed'),
      'applied_count', count(gp.id) filter (where gp.status = 'applied')
    ) as item
    from public.gatherings g
    left join public.gathering_participants gp on gp.gathering_id = g.id
    where g.host_id = auth.uid()
    group by g.id
  ) hosted;
  return result;
end;
$$;

create or replace function public.host_gathering_dashboard(target_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  gathering public.gatherings;
  result jsonb;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;

  select * into gathering
  from public.gatherings
  where id = target_id and host_id = auth.uid();
  if gathering.id is null then raise exception 'HOST_REQUIRED'; end if;

  select to_jsonb(gathering) || jsonb_build_object(
    'confirmed_count', count(gp.id) filter (where gp.status = 'confirmed'),
    'applied_count', count(gp.id) filter (where gp.status = 'applied'),
    'participants',
    coalesce((
      select jsonb_agg(
        to_jsonb(participant) || jsonb_build_object(
          'nickname', profile.nickname,
          'age', profile.age,
          'region', profile.region,
          'bio', profile.bio,
          'photo_path', (
            select pp.storage_path from public.profile_photos pp
            where pp.user_id = participant.user_id
            order by pp.order_idx
            limit 1
          )
        )
        order by participant.created_at
      )
      from public.gathering_participants participant
      join public.profiles profile on profile.user_id = participant.user_id
      where participant.gathering_id = gathering.id
    ), '[]'::jsonb)
  )
  into result
  from public.gathering_participants gp
  where gp.gathering_id = gathering.id;
  return result;
end;
$$;

create or replace function public.applications_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare result jsonb;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  select coalesce(jsonb_agg(
    to_jsonb(gp) || jsonb_build_object(
      'title', g.title,
      'start_at', g.start_at,
      'region', g.region,
      'gathering_status', g.status
    )
    order by gp.created_at desc
  ), '[]'::jsonb)
  into result
  from public.gathering_participants gp
  join public.gatherings g on g.id = gp.gathering_id
  where gp.user_id = auth.uid();
  return result;
end;
$$;

revoke all on function public.community_feed(text, integer) from public;
revoke all on function public.get_gathering_detail(uuid) from public;
revoke all on function public.hosted_gatherings_dashboard() from public;
revoke all on function public.host_gathering_dashboard(uuid) from public;
revoke all on function public.applications_dashboard() from public;

grant execute on function public.community_feed(text, integer) to authenticated;
grant execute on function public.get_gathering_detail(uuid) to authenticated;
grant execute on function public.hosted_gatherings_dashboard() to authenticated;
grant execute on function public.host_gathering_dashboard(uuid) to authenticated;
grant execute on function public.applications_dashboard() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'gathering_participants'
  ) then
    alter publication supabase_realtime add table public.gathering_participants;
  end if;
end;
$$;
