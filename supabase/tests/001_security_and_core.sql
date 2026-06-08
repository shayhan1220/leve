begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

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

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select is(public.current_plan(), 'free'::public.plan, 'missing subscription resolves to free');
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
