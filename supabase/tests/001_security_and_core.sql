begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

insert into auth.users (id, aud, role, phone, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', '+821011111111', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', '+821022222222', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', '+821033333333', now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', '+821044444444', now(), now());

insert into public.profiles (user_id, nickname, region, bio, looking_for, identity_tags)
values
  ('00000000-0000-0000-0000-000000000001', '미인증', '서울', '테스트 프로필입니다.', '{연애}', '{레즈비언}'),
  ('00000000-0000-0000-0000-000000000002', '프리', '서울', '테스트 프로필입니다.', '{연애}', '{레즈비언}'),
  ('00000000-0000-0000-0000-000000000003', '상대', '서울', '테스트 프로필입니다.', '{연애}', '{바이}'),
  ('00000000-0000-0000-0000-000000000004', '프리미엄', '부산', '테스트 프로필입니다.', '{친구}', '{퀴어}');

insert into public.verifications (user_id, is_verified, is_female, age, method, provider_ref)
values
  ('00000000-0000-0000-0000-000000000001', false, false, 25, 'pass', 'test-unverified'),
  ('00000000-0000-0000-0000-000000000002', true, true, 26, 'pass', 'test-free'),
  ('00000000-0000-0000-0000-000000000003', true, true, 27, 'pass', 'test-target'),
  ('00000000-0000-0000-0000-000000000004', true, true, 28, 'pass', 'test-premium');

insert into public.subscriptions (user_id, plan, status)
values ('00000000-0000-0000-0000-000000000004', 'premium', 'active');

select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select is(public.is_verified_female(), false, 'unverified account fails the hard gate');
select is((select count(*)::integer from public.profiles), 0, 'unverified account cannot read profiles');
select throws_ok(
  $$ select public.discover_feed() $$,
  'P0001',
  'VERIFICATION_REQUIRED',
  'unverified account cannot call discovery'
);
select throws_ok(
  $$ select public.compute_love_dna() $$,
  'P0001',
  'VERIFICATION_REQUIRED',
  'unverified account cannot compute Love DNA'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select is(public.current_plan(), 'free'::public.plan, 'missing subscription resolves to free');
select throws_ok(
  $$ select public.compute_love_dna() $$,
  'P0001',
  'INSUFFICIENT_ANSWERS',
  'Love DNA requires forty answers'
);
insert into public.love_dna_responses (user_id, question_id, axis, value)
select
  '00000000-0000-0000-0000-000000000002',
  question_id,
  case
    when question_id <= 8 then 'S'
    when question_id <= 16 then 'D'
    when question_id <= 24 then 'A'
    when question_id <= 32 then 'V'
    else 'M'
  end,
  75
from generate_series(1, 40) question_id;
select is(
  (public.compute_love_dna()).code,
  'SDAVM',
  'Love DNA computes the five-axis code'
);
select is(
  (public.compute_love_dna()).clan,
  'Explorer',
  'Love DNA assigns the expected clan'
);
select is(
  (public.compute_love_dna()).answered_count,
  40,
  'Love DNA records answer accuracy'
);
select is(
  (select count(*)::integer from public.discover_feed()),
  2,
  'verified discovery returns eligible profiles'
);
select is(
  (public.create_gathering(jsonb_build_object(
    'title', '검토 모임',
    'description', '검토가 필요한 충분히 긴 모임 설명입니다.',
    'category', '친목',
    'region', '서울',
    'capacity', 5,
    'start_at', now() + interval '7 days'
  ))).status,
  'pending_review'::public.gathering_status,
  'free gathering waits for review'
);
select is(
  (public.react('00000000-0000-0000-0000-000000000003', 'like'))->>'matched',
  'false',
  'one-way like does not create a match'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
select is(
  (public.react('00000000-0000-0000-0000-000000000002', 'like'))->>'matched',
  'true',
  'mutual like creates a match'
);
select is((select count(*)::integer from public.matches), 1, 'exactly one match exists');
select is((select count(*)::integer from public.chats), 1, 'match creates exactly one chat');
select is(
  jsonb_array_length(public.list_matches()),
  1,
  'match list returns the mutual match'
);
select is(
  (public.list_matches()->0->>'nickname'),
  '프리',
  'match list returns the other member'
);
select is(
  public.can_access_chat((select id from public.chats limit 1)),
  true,
  'matched member can access the chat'
);
select lives_ok(
  $$ insert into public.messages (chat_id, sender_id, type, body)
     values (
       (select id from public.chats limit 1),
       '00000000-0000-0000-0000-000000000003',
       'text',
       '안녕하세요'
     ) $$,
  'matched member can send a message'
);
select is(
  (select count(*)::integer from public.notifications
   where user_id = '00000000-0000-0000-0000-000000000002' and type = 'message'),
  1,
  'new message creates a recipient notification'
);
select lives_ok(
  $$ select public.create_date_proposal(
       (select id from public.chats limit 1),
       now() + interval '4 days',
       '성수 전시',
       null
     ) $$,
  'matched member can atomically create a date proposal'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select is(
  public.mark_read((select id from public.chats limit 1)),
  1,
  'recipient can mark incoming messages read'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
select is(
  (select read_at is null from public.list_chat_messages(
    (select id from public.chats limit 1), null, 30
  ) limit 1),
  true,
  'free member cannot see read receipts'
);
insert into public.subscriptions (user_id, plan, status)
values ('00000000-0000-0000-0000-000000000003', 'plus', 'active');
select is(
  (select read_at is not null from public.list_chat_messages(
    (select id from public.chats limit 1), null, 30
  ) limit 1),
  true,
  'plus member can see read receipts'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$ update public.date_proposals set status = 'accepted'
     where proposer_id = '00000000-0000-0000-0000-000000000003' $$,
  'proposal recipient can accept a date'
);
select public.block_user('00000000-0000-0000-0000-000000000003');
select is(
  public.can_access_chat((select id from public.chats limit 1)),
  false,
  'blocking a member closes existing chat access'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', true);
select is(public.current_plan(), 'premium'::public.plan, 'active premium subscription is returned');
select is(
  (public.create_gathering(jsonb_build_object(
    'title', '직접 모임 1',
    'description', '프리미엄 직접 등록을 검증하는 모임 설명입니다.',
    'category', '친목',
    'region', '부산',
    'capacity', 5,
    'start_at', now() + interval '8 days'
  ))).status,
  'open'::public.gathering_status,
  'premium gathering opens immediately'
);

select lives_ok(
  $$ select public.create_gathering(jsonb_build_object(
    'title', '직접 모임 2',
    'description', '두 번째 직접 등록을 위한 충분한 설명입니다.',
    'category', '친목',
    'region', '부산',
    'capacity', 5,
    'start_at', now() + interval '9 days'
  )) $$,
  'second premium gathering is accepted'
);
select lives_ok(
  $$ select public.create_gathering(jsonb_build_object(
    'title', '직접 모임 3',
    'description', '세 번째 직접 등록을 위한 충분한 설명입니다.',
    'category', '친목',
    'region', '부산',
    'capacity', 5,
    'start_at', now() + interval '10 days'
  )) $$,
  'third premium gathering is accepted'
);
select is(
  ((public.can_create_gathering())->>'used')::integer,
  3,
  'weekly direct gathering usage reaches three'
);
select throws_ok(
  $$ select public.create_gathering(jsonb_build_object(
    'title', '직접 모임 4',
    'description', '네 번째 직접 등록은 반드시 거부되어야 합니다.',
    'category', '친목',
    'region', '부산',
    'capacity', 5,
    'start_at', now() + interval '11 days'
  )) $$,
  'P0001',
  'WEEKLY_LIMIT',
  'fourth premium direct gathering is rejected'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$ update public.profiles set is_admin = true
     where user_id = '00000000-0000-0000-0000-000000000002' $$,
  '42501',
  null,
  'member cannot grant herself admin privileges'
);

select * from finish();
rollback;
