-- Security hardening, remaining v1 RPCs, triggers, indexes, and storage policies.

create index if not exists likes_from_created_idx
  on public.likes (from_user, created_at desc);
create index if not exists likes_to_type_idx
  on public.likes (to_user, type, created_at desc);
create index if not exists messages_chat_created_idx
  on public.messages (chat_id, created_at desc);
create index if not exists gatherings_host_source_created_idx
  on public.gatherings (host_id, source, created_at desc);
create index if not exists gatherings_status_start_idx
  on public.gatherings (status, start_at);
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists blocks_blocked_idx
  on public.blocks (blocked_id, blocker_id);
create unique index if not exists verifications_provider_ref_idx
  on public.verifications (provider_ref)
  where provider_ref is not null;

alter table public.verifications drop constraint if exists verifications_age_check;
alter table public.verifications
  add constraint verifications_age_check check (age between 0 and 120);

revoke all on function public.is_verified_female(uuid) from public;
revoke all on function public.current_plan() from public;
revoke all on function public.can_create_gathering() from public;
revoke all on function public.create_gathering(jsonb) from public;
revoke all on function public.react(uuid, public.reaction_type) from public;
revoke all on function public.apply_gathering(uuid) from public;
revoke all on function public.block_user(uuid) from public;

alter function public.is_verified_female(uuid) set search_path = public, pg_temp;
alter function public.current_plan() set search_path = public, pg_temp;
alter function public.can_create_gathering() set search_path = public, pg_temp;

create or replace function public.current_plan()
returns public.plan
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select plan from public.subscriptions
      where user_id = auth.uid()
        and (
          status in ('active', 'grace')
          or (status = 'canceled' and expires_at > now())
        )
        and (expires_at is null or expires_at > now())
    ),
    'free'::public.plan
  );
$$;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles where user_id = uid and is_admin = true
  );
$$;

create or replace function public.is_not_blocked(target uuid, viewer uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.blocks
    where (blocker_id = viewer and blocked_id = target)
       or (blocker_id = target and blocked_id = viewer)
  );
$$;

drop policy if exists "profile self insert" on public.profiles;
drop policy if exists "profile self update" on public.profiles;
create policy "profile self insert restricted" on public.profiles
for insert with check (
  user_id = auth.uid()
  and is_admin = false
);
create policy "profile self update restricted" on public.profiles
for update using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and is_admin = public.is_admin()
);

revoke select, insert, update on public.profiles from authenticated;
grant select (
  user_id, nickname, age, region, height, job, bio, looking_for, identity_tags,
  queer_optin, queer_visible_in_main, completeness, created_at, updated_at
) on public.profiles to authenticated;
grant insert (
  user_id, nickname, age, region, height, job, bio, looking_for, identity_tags,
  queer_optin, queer_visible_in_main
) on public.profiles to authenticated;
grant update (
  nickname, region, height, job, bio, looking_for, identity_tags,
  queer_optin, queer_visible_in_main
) on public.profiles to authenticated;

revoke all on all tables in schema public from anon;
revoke all on public.verifications, public.profile_photos, public.badges,
  public.subscriptions, public.love_dna_responses, public.love_dna_profiles,
  public.blocks, public.likes, public.matches, public.chats, public.messages,
  public.date_proposals, public.gatherings, public.gathering_participants,
  public.events, public.event_attendance, public.groups, public.group_members,
  public.group_posts, public.reports, public.moderation_actions,
  public.notifications
from authenticated;

grant select on public.verifications, public.profile_photos, public.badges,
  public.subscriptions, public.love_dna_responses, public.love_dna_profiles,
  public.blocks, public.likes, public.matches, public.chats, public.messages,
  public.date_proposals, public.gatherings, public.gathering_participants,
  public.events, public.event_attendance, public.groups, public.group_members,
  public.group_posts, public.reports, public.moderation_actions,
  public.notifications
to authenticated;
grant insert (user_id, storage_path, order_idx) on public.profile_photos to authenticated;
grant update (storage_path, order_idx) on public.profile_photos to authenticated;
grant delete on public.profile_photos, public.blocks to authenticated;
grant insert (user_id, question_id, axis, value) on public.love_dna_responses to authenticated;
grant update (axis, value) on public.love_dna_responses to authenticated;
grant insert (chat_id, sender_id, type, body, storage_path) on public.messages to authenticated;
grant insert (chat_id, proposer_id, datetime, place, meetup_id) on public.date_proposals
  to authenticated;
grant update (status) on public.date_proposals to authenticated;
grant update (
  title, description, category, region, capacity, start_at, type, is_queer
) on public.gatherings to authenticated;
grant insert (group_id, author_id, body) on public.group_posts to authenticated;
grant insert (reporter_id, target_user_id, context, reason, detail) on public.reports
  to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.calculate_profile_completeness()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  score integer := 0;
begin
  score := score + case when nullif(trim(new.nickname), '') is not null then 15 else 0 end;
  score := score + case when new.age is not null then 15 else 0 end;
  score := score + case when nullif(trim(new.region), '') is not null then 15 else 0 end;
  score := score + case when nullif(trim(new.bio), '') is not null then 15 else 0 end;
  score := score + case when cardinality(new.looking_for) > 0 then 20 else 0 end;
  score := score + case when cardinality(new.identity_tags) > 0 then 20 else 0 end;
  new.completeness := score;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_completeness on public.profiles;
create trigger profiles_completeness
before insert or update on public.profiles
for each row execute function public.calculate_profile_completeness();

drop trigger if exists gatherings_updated_at on public.gatherings;
create trigger gatherings_updated_at
before update on public.gatherings
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists love_dna_responses_updated_at on public.love_dna_responses;
create trigger love_dna_responses_updated_at
before update on public.love_dna_responses
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'subscriptions'
  ) then
    alter publication supabase_realtime add table public.subscriptions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

drop policy if exists "dna response self" on public.love_dna_responses;
create policy "dna response verified self" on public.love_dna_responses
for all using (
  user_id = auth.uid() and public.is_verified_female()
) with check (
  user_id = auth.uid() and public.is_verified_female()
);

drop policy if exists "badges verified read" on public.badges;
create policy "badges verified unblocked read" on public.badges
for select using (
  public.is_verified_female()
  and public.is_verified_female(user_id)
  and public.is_not_blocked(user_id)
);
drop policy if exists "photos verified read" on public.profile_photos;
create policy "photos verified unblocked read" on public.profile_photos
for select using (
  public.is_verified_female()
  and public.is_verified_female(user_id)
  and public.is_not_blocked(user_id)
);
drop policy if exists "dna profile verified read" on public.love_dna_profiles;
create policy "dna profile verified unblocked read" on public.love_dna_profiles
for select using (
  public.is_verified_female()
  and public.is_verified_female(user_id)
  and public.is_not_blocked(user_id)
);

create policy "date proposals members read" on public.date_proposals
for select using (
  public.is_verified_female() and exists (
    select 1
    from public.chats c
    join public.matches m on m.id = c.match_id
    where c.id = chat_id and auth.uid() in (m.user_a, m.user_b)
  )
);
create policy "date proposals proposer insert" on public.date_proposals
for insert with check (
  proposer_id = auth.uid()
  and status = 'proposed'
  and public.is_verified_female()
  and exists (
    select 1
    from public.chats c
    join public.matches m on m.id = c.match_id
    where c.id = chat_id and auth.uid() in (m.user_a, m.user_b)
  )
);
create policy "date proposals recipient update" on public.date_proposals
for update using (
  proposer_id <> auth.uid()
  and public.is_verified_female()
  and exists (
    select 1
    from public.chats c
    join public.matches m on m.id = c.match_id
    where c.id = chat_id and auth.uid() in (m.user_a, m.user_b)
  )
) with check (
  status in ('accepted', 'declined')
);

drop policy if exists "gatherings verified read" on public.gatherings;
create policy "gatherings verified audience read" on public.gatherings
for select using (
  public.is_verified_female()
  and public.is_not_blocked(host_id)
  and (
    not is_queer
    or exists (
      select 1 from public.profiles viewer
      where viewer.user_id = auth.uid() and viewer.queer_optin
    )
  )
);
drop policy if exists "community verified events" on public.events;
create policy "events verified audience read" on public.events
for select using (
  public.is_verified_female()
  and (
    not is_queer
    or exists (
      select 1 from public.profiles viewer
      where viewer.user_id = auth.uid() and viewer.queer_optin
    )
  )
);
drop policy if exists "community verified groups" on public.groups;
create policy "groups verified audience read" on public.groups
for select using (
  public.is_verified_female()
  and (
    not is_queer
    or exists (
      select 1 from public.profiles viewer
      where viewer.user_id = auth.uid() and viewer.queer_optin
    )
  )
);
drop policy if exists "group members verified read" on public.group_members;
drop policy if exists "group membership self read" on public.group_members;
create policy "group members audience read" on public.group_members
for select using (
  public.is_verified_female()
  and exists (
    select 1 from public.groups g where g.id = group_id
  )
);
drop policy if exists "group posts verified read" on public.group_posts;
create policy "group posts audience read" on public.group_posts
for select using (
  public.is_verified_female()
  and exists (
    select 1 from public.groups g where g.id = group_id
  )
);

create policy "event attendance self read" on public.event_attendance
for select using (public.is_verified_female() and user_id = auth.uid());
create policy "moderation admin read" on public.moderation_actions
for select using (public.is_admin());

create or replace function public.compute_love_dna()
returns public.love_dna_profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.love_dna_profiles;
  answer_count integer;
  s numeric;
  d numeric;
  a numeric;
  v numeric;
  m numeric;
  dna_code text;
  dna_clan text;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  if coalesce((filters->>'queer')::boolean, false)
    and not exists (
      select 1 from public.profiles viewer
      where viewer.user_id = auth.uid() and viewer.queer_optin
    )
  then raise exception 'QUEER_OPTIN_REQUIRED'; end if;

  select
    count(*),
    coalesce(avg(value) filter (where axis = 'S'), 50),
    coalesce(avg(value) filter (where axis = 'D'), 50),
    coalesce(avg(value) filter (where axis = 'A'), 50),
    coalesce(avg(value) filter (where axis = 'V'), 50),
    coalesce(avg(value) filter (where axis = 'M'), 50)
  into answer_count, s, d, a, v, m
  from public.love_dna_responses
  where user_id = auth.uid();

  if answer_count < 40 then raise exception 'INSUFFICIENT_ANSWERS'; end if;

  dna_code :=
    case when s >= 50 then 'S' else 's' end ||
    case when d >= 50 then 'D' else 'd' end ||
    case when a >= 50 then 'A' else 'a' end ||
    case when v >= 50 then 'V' else 'v' end ||
    case when m >= 50 then 'M' else 'm' end;

  dna_clan := case
    when s >= 65 and m >= 55 then 'Explorer'
    when d >= 60 and v >= 55 then 'Dreamer'
    when a <= 45 and v >= 55 then 'Thinker'
    when a >= 60 and m >= 50 then 'Caregiver'
    when d <= 45 and a >= 55 then 'Protector'
    else 'Builder'
  end;

  insert into public.love_dna_profiles (
    user_id, code, clan, axis_s, axis_d, axis_a, axis_v, axis_m, answered_count
  ) values (
    auth.uid(), dna_code, dna_clan, round(s, 2), round(d, 2), round(a, 2),
    round(v, 2), round(m, 2), answer_count
  )
  on conflict (user_id) do update set
    code = excluded.code,
    clan = excluded.clan,
    axis_s = excluded.axis_s,
    axis_d = excluded.axis_d,
    axis_a = excluded.axis_a,
    axis_v = excluded.axis_v,
    axis_m = excluded.axis_m,
    answered_count = excluded.answered_count,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

create or replace function public.discover_feed(
  filters jsonb default '{}'::jsonb,
  cursor timestamptz default null
)
returns table (
  user_id uuid,
  nickname text,
  age integer,
  region text,
  bio text,
  identity_tags text[],
  photo_path text,
  compatibility integer,
  score_breakdown jsonb,
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

  return query
  select
    p.user_id,
    p.nickname,
    p.age,
    p.region,
    p.bio,
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
    )))::integer as compatibility,
    jsonb_build_object(
      'S', 100 - abs(coalesce(me.axis_s, 50) - coalesce(them.axis_s, 50)),
      'D', 100 - abs(coalesce(me.axis_d, 50) - coalesce(them.axis_d, 50)),
      'A', 100 - abs(coalesce(me.axis_a, 50) - coalesce(them.axis_a, 50)),
      'V', 100 - abs(coalesce(me.axis_v, 50) - coalesce(them.axis_v, 50)),
      'M', 100 - abs(coalesce(me.axis_m, 50) - coalesce(them.axis_m, 50))
    ),
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
    8 desc,
    p.created_at desc
  limit greatest(1, least(coalesce((filters->>'limit')::integer, 20), 50));
end;
$$;

create or replace function public.get_profile(target_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare result jsonb;
begin
  if not public.is_verified_female()
    or not public.is_verified_female(get_profile.target_id)
  then
    raise exception 'VERIFICATION_REQUIRED';
  end if;
  if exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = get_profile.target_id)
       or (blocker_id = get_profile.target_id and blocked_id = auth.uid())
  ) then raise exception 'BLOCKED'; end if;

  select jsonb_build_object(
    'profile', to_jsonb(p) - 'is_admin',
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object('storage_path', storage_path, 'order_idx', order_idx)
                       order by order_idx)
      from public.profile_photos pp
      where pp.user_id = get_profile.target_id
    ), '[]'::jsonb),
    'badges', coalesce((
      select jsonb_agg(b.badge order by b.badge)
      from public.badges b where b.user_id = get_profile.target_id
    ), '[]'::jsonb),
    'love_dna', (
      select to_jsonb(ld) from public.love_dna_profiles ld
      where ld.user_id = get_profile.target_id
    )
  ) into result
  from public.profiles p
  where p.user_id = get_profile.target_id;

  if result is null then raise exception 'PROFILE_NOT_FOUND'; end if;
  return result;
end;
$$;

create or replace function public.who_liked_me()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  total_count integer;
  people jsonb;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;

  select count(*) into total_count
  from public.likes l
  where l.to_user = auth.uid()
    and l.type in ('like', 'super')
    and not exists (
      select 1 from public.likes mine
      where mine.from_user = auth.uid() and mine.to_user = l.from_user
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = l.from_user)
         or (b.blocker_id = l.from_user and b.blocked_id = auth.uid())
    );

  if public.current_plan() = 'free' then
    return jsonb_build_object('count', total_count, 'revealed', false, 'people', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', p.user_id,
    'nickname', p.nickname,
    'age', p.age,
    'region', p.region,
    'type', l.type,
    'created_at', l.created_at,
    'photo_path', photo.storage_path
  ) order by l.created_at desc), '[]'::jsonb)
  into people
  from public.likes l
  join public.profiles p on p.user_id = l.from_user
  left join lateral (
    select storage_path from public.profile_photos pp
    where pp.user_id = p.user_id order by order_idx limit 1
  ) photo on true
  where l.to_user = auth.uid()
    and l.type in ('like', 'super')
    and public.is_verified_female(l.from_user)
    and not exists (
      select 1 from public.likes mine
      where mine.from_user = auth.uid() and mine.to_user = l.from_user
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = l.from_user)
         or (b.blocker_id = l.from_user and b.blocked_id = auth.uid())
    );

  return jsonb_build_object('count', total_count, 'revealed', true, 'people', people);
end;
$$;

create or replace function public.mark_read(chat_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare updated_count integer;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  if not exists (
    select 1 from public.chats c
    join public.matches m on m.id = c.match_id
    where c.id = mark_read.chat_id and auth.uid() in (m.user_a, m.user_b)
  ) then raise exception 'CHAT_FORBIDDEN'; end if;

  update public.messages
  set read_at = coalesce(read_at, now())
  where messages.chat_id = mark_read.chat_id
    and sender_id <> auth.uid()
    and read_at is null;
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.review_participant(
  participant_id uuid,
  decision text
)
returns public.gathering_participants
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  participant public.gathering_participants;
  gathering public.gatherings;
  confirmed_count integer;
begin
  if decision not in ('confirm', 'reject') then raise exception 'INVALID_DECISION'; end if;
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;

  select gp.* into participant
  from public.gathering_participants gp
  where gp.id = review_participant.participant_id
  for update;
  if participant.id is null then raise exception 'PARTICIPANT_NOT_FOUND'; end if;

  select g.* into gathering from public.gatherings g
  where g.id = participant.gathering_id and g.host_id = auth.uid()
  for update;
  if gathering.id is null then raise exception 'HOST_REQUIRED'; end if;
  if gathering.status = 'canceled' then raise exception 'GATHERING_CANCELED'; end if;

  if decision = 'confirm' then
    select count(*) into confirmed_count
    from public.gathering_participants gp
    where gp.gathering_id = gathering.id and gp.status = 'confirmed';
    if confirmed_count >= gathering.capacity then raise exception 'CAPACITY_REACHED'; end if;
    update public.gathering_participants set status = 'confirmed'
    where id = review_participant.participant_id returning * into participant;
  else
    update public.gathering_participants set status = 'rejected'
    where id = review_participant.participant_id returning * into participant;
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    participant.user_id,
    'gathering',
    case when decision = 'confirm' then '모임 참여가 확정됐어요' else '모임 신청 결과가 도착했어요' end,
    gathering.title,
    jsonb_build_object('gathering_id', gathering.id, 'status', participant.status)
  );
  return participant;
end;
$$;

create or replace function public.cancel_gathering(id uuid)
returns public.gatherings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare canceled public.gatherings;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  update public.gatherings
  set status = 'canceled'
  where gatherings.id = cancel_gathering.id
    and host_id = auth.uid()
    and status <> 'canceled'
  returning * into canceled;
  if canceled.id is null then raise exception 'GATHERING_NOT_CANCELABLE'; end if;

  insert into public.notifications (user_id, type, title, body, data)
  select gp.user_id, 'gathering', '모임이 취소됐어요', canceled.title,
    jsonb_build_object('gathering_id', canceled.id, 'status', 'canceled')
  from public.gathering_participants gp
  where gp.gathering_id = canceled.id and gp.status in ('applied', 'confirmed');
  return canceled;
end;
$$;

create or replace function public.join_event(event_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  if not exists (
    select 1 from public.events e
    where e.id = join_event.event_id and e.status in ('upcoming', 'live')
  ) then raise exception 'EVENT_UNAVAILABLE'; end if;
  insert into public.event_attendance (event_id, user_id)
  values (join_event.event_id, auth.uid()) on conflict do nothing;
end;
$$;

create or replace function public.join_group(group_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  if not exists (
    select 1 from public.groups g where g.id = join_group.group_id
  ) then
    raise exception 'GROUP_NOT_FOUND';
  end if;
  insert into public.group_members (group_id, user_id)
  values (join_group.group_id, auth.uid()) on conflict do nothing;
end;
$$;

create or replace function public.request_job_verification(storage_path text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare action_id uuid;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  if storage_path !~ ('^job-verifications/' || auth.uid()::text || '/[^/]+$') then
    raise exception 'INVALID_STORAGE_PATH';
  end if;
  insert into public.moderation_actions (target_user_id, action, ref, note)
  values (auth.uid(), 'job_verification_requested', storage_path, 'pending')
  returning id into action_id;
  return action_id;
end;
$$;

create or replace function public.moderate(
  target uuid,
  action text,
  ref text default null,
  note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare action_id uuid;
begin
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  insert into public.moderation_actions (actor_id, target_user_id, action, ref, note)
  values (auth.uid(), target, action, ref, note)
  returning id into action_id;
  return action_id;
end;
$$;

create or replace function public.my_applications()
returns setof public.gathering_participants
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select gp.* from public.gathering_participants gp
  where gp.user_id = auth.uid() and public.is_verified_female()
  order by gp.created_at desc;
$$;

create or replace function public.my_hosted_gatherings()
returns setof public.gatherings
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select g.* from public.gatherings g
  where g.host_id = auth.uid() and public.is_verified_female()
  order by g.created_at desc;
$$;

create or replace function public.mark_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare updated_count integer;
begin
  update public.notifications set read_at = coalesce(read_at, now())
  where user_id = auth.uid() and read_at is null;
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- Replace quota-sensitive RPCs with transaction-scoped locks.
create or replace function public.create_gathering(payload jsonb)
returns public.gatherings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_plan public.plan;
  used_count integer;
  created public.gatherings;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  if coalesce(length(trim(payload->>'title')), 0) < 2
    or coalesce(length(trim(payload->>'description')), 0) < 10
    or coalesce((payload->>'capacity')::integer, 0) not between 2 and 100
    or (payload->>'start_at')::timestamptz <= now()
  then raise exception 'INVALID_GATHERING_PAYLOAD'; end if;

  caller_plan := public.current_plan();
  if caller_plan = 'premium' then
    perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':gathering', 0));
    select count(*) into used_count
    from public.gatherings
    where host_id = auth.uid()
      and source = 'direct'
      and created_at >= date_trunc('week', now())
      and created_at < date_trunc('week', now()) + interval '7 days';
    if used_count >= 3 then raise exception 'WEEKLY_LIMIT'; end if;
  end if;

  insert into public.gatherings (
    host_id, title, description, category, region, capacity, start_at, type,
    status, source, is_queer
  ) values (
    auth.uid(), trim(payload->>'title'), trim(payload->>'description'),
    trim(payload->>'category'), trim(payload->>'region'),
    (payload->>'capacity')::integer, (payload->>'start_at')::timestamptz,
    coalesce(payload->>'type', 'meetup'),
    case when caller_plan = 'premium' then 'open'::public.gathering_status
         else 'pending_review'::public.gathering_status end,
    case when caller_plan = 'premium' then 'direct'::public.gathering_source
         else 'community'::public.gathering_source end,
    coalesce((payload->>'is_queer')::boolean, false)
  ) returning * into created;
  return created;
end;
$$;

create or replace function public.react(to_user uuid, type public.reaction_type)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  matched_id uuid;
  chat_id uuid;
  daily_count integer;
  existing_type public.reaction_type;
  caller_plan public.plan;
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

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':reaction', 0));
  select likes.type into existing_type from public.likes
  where from_user = auth.uid() and likes.to_user = react.to_user;
  caller_plan := public.current_plan();

  if type = 'super' and caller_plan = 'free' then raise exception 'PLAN_REQUIRED'; end if;
  if existing_type is null or existing_type not in ('like', 'super') then
    if type in ('like', 'super') and caller_plan = 'free' then
      select count(*) into daily_count from public.likes
      where from_user = auth.uid() and likes.type in ('like', 'super')
        and created_at >= date_trunc('day', now());
      if daily_count >= 10 then raise exception 'DAILY_LIMIT'; end if;
    end if;
  end if;
  if type = 'super' and existing_type is distinct from 'super' then
    select count(*) into daily_count from public.likes
    where from_user = auth.uid() and likes.type = 'super'
      and created_at >= date_trunc('day', now());
    if daily_count >= 5 then raise exception 'SUPER_DAILY_LIMIT'; end if;
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
    insert into public.notifications (user_id, type, title, body, data)
    values (
      to_user, 'match', '새로운 매칭이 생겼어요', '서로의 마음이 닿았어요.',
      jsonb_build_object('match_id', matched_id, 'chat_id', chat_id)
    );
    return jsonb_build_object('matched', true, 'match_id', matched_id, 'chat_id', chat_id);
  end if;
  return jsonb_build_object('matched', false);
end;
$$;

create or replace function public.apply_gathering(gathering_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare participant_id uuid;
declare gathering public.gatherings;
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  select * into gathering from public.gatherings
  where id = apply_gathering.gathering_id and status = 'open' for update;
  if gathering.id is null then raise exception 'GATHERING_UNAVAILABLE'; end if;
  if gathering.host_id = auth.uid() then raise exception 'HOST_CANNOT_APPLY'; end if;
  insert into public.gathering_participants (gathering_id, user_id)
  values (apply_gathering.gathering_id, auth.uid())
  on conflict (gathering_id, user_id) do update
    set status = case
      when gathering_participants.status = 'rejected' then gathering_participants.status
      else 'applied'::public.participant_status
    end
  returning id into participant_id;
  return participant_id;
end;
$$;

create or replace function public.block_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_verified_female() then raise exception 'VERIFICATION_REQUIRED'; end if;
  if target = auth.uid() or not public.is_verified_female(target) then
    raise exception 'INVALID_TARGET';
  end if;
  insert into public.blocks (blocker_id, blocked_id)
  values (auth.uid(), target) on conflict do nothing;
end;
$$;

insert into storage.buckets (id, name, public)
values
  ('profile-photos', 'profile-photos', false),
  ('message-images', 'message-images', false),
  ('job-verifications', 'job-verifications', false)
on conflict (id) do nothing;

create policy "profile photos verified read" on storage.objects
for select to authenticated using (
  bucket_id = 'profile-photos'
  and public.is_verified_female()
  and public.is_verified_female((storage.foldername(name))[1]::uuid)
  and public.is_not_blocked((storage.foldername(name))[1]::uuid)
);
create policy "profile photos self write" on storage.objects
for insert to authenticated with check (
  bucket_id = 'profile-photos'
  and public.is_verified_female()
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "profile photos self update" on storage.objects
for update to authenticated using (
  bucket_id = 'profile-photos' and owner_id = auth.uid()::text
) with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "profile photos self delete" on storage.objects
for delete to authenticated using (
  bucket_id = 'profile-photos' and owner_id = auth.uid()::text
);

create policy "message images members read" on storage.objects
for select to authenticated using (
  bucket_id = 'message-images'
  and public.is_verified_female()
  and exists (
    select 1 from public.chats c
    join public.matches m on m.id = c.match_id
    where c.id = (storage.foldername(name))[1]::uuid
      and auth.uid() in (m.user_a, m.user_b)
  )
);
create policy "message images members write" on storage.objects
for insert to authenticated with check (
  bucket_id = 'message-images'
  and public.is_verified_female()
  and exists (
    select 1 from public.chats c
    join public.matches m on m.id = c.match_id
    where c.id = (storage.foldername(name))[1]::uuid
      and auth.uid() in (m.user_a, m.user_b)
  )
);

create policy "job verification self write" on storage.objects
for insert to authenticated with check (
  bucket_id = 'job-verifications'
  and public.is_verified_female()
  and (storage.foldername(name))[1] = auth.uid()::text
);

grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_not_blocked(uuid, uuid) to authenticated;
grant execute on function public.compute_love_dna() to authenticated;
grant execute on function public.discover_feed(jsonb, timestamptz) to authenticated;
grant execute on function public.get_profile(uuid) to authenticated;
grant execute on function public.who_liked_me() to authenticated;
grant execute on function public.mark_read(uuid) to authenticated;
grant execute on function public.review_participant(uuid, text) to authenticated;
grant execute on function public.cancel_gathering(uuid) to authenticated;
grant execute on function public.join_event(uuid) to authenticated;
grant execute on function public.join_group(uuid) to authenticated;
grant execute on function public.request_job_verification(text) to authenticated;
grant execute on function public.moderate(uuid, text, text, text) to authenticated;
grant execute on function public.my_applications() to authenticated;
grant execute on function public.my_hosted_gatherings() to authenticated;
grant execute on function public.mark_notifications_read() to authenticated;

revoke all on function public.is_admin(uuid) from public;
revoke all on function public.is_not_blocked(uuid, uuid) from public;
revoke all on function public.compute_love_dna() from public;
revoke all on function public.discover_feed(jsonb, timestamptz) from public;
revoke all on function public.get_profile(uuid) from public;
revoke all on function public.who_liked_me() from public;
revoke all on function public.mark_read(uuid) from public;
revoke all on function public.review_participant(uuid, text) from public;
revoke all on function public.cancel_gathering(uuid) from public;
revoke all on function public.join_event(uuid) from public;
revoke all on function public.join_group(uuid) from public;
revoke all on function public.request_job_verification(text) from public;
revoke all on function public.moderate(uuid, text, text, text) from public;
revoke all on function public.my_applications() from public;
revoke all on function public.my_hosted_gatherings() from public;
revoke all on function public.mark_notifications_read() from public;
