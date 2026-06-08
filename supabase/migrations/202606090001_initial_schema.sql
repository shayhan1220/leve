create extension if not exists pgcrypto;

create type public.plan as enum ('free', 'plus', 'premium');
create type public.subscription_status as enum ('active', 'expired', 'canceled', 'grace');
create type public.verification_method as enum ('pass', 'telco', 'ipin');
create type public.reaction_type as enum ('like', 'super', 'pass');
create type public.gathering_status as enum ('pending_review', 'open', 'full', 'closed', 'canceled');
create type public.gathering_source as enum ('discover', 'queer', 'community', 'direct');
create type public.participant_status as enum ('applied', 'confirmed', 'rejected');

create table public.verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_verified boolean not null default false,
  is_female boolean not null default false,
  age integer check (age between 19 and 120),
  method public.verification_method,
  provider_ref text,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text unique,
  age integer check (age between 19 and 120),
  region text,
  height integer check (height between 120 and 220),
  job text,
  bio text,
  looking_for text[] not null default '{}',
  identity_tags text[] not null default '{}',
  queer_optin boolean not null default false,
  queer_visible_in_main boolean not null default true,
  completeness integer not null default 0 check (completeness between 0 and 100),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  storage_path text not null,
  order_idx integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, order_idx)
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  badge text not null check (badge in ('female_safe', 'identity', 'job', 'vip')),
  granted_at timestamptz not null default now(),
  unique (user_id, badge)
);

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan public.plan not null default 'free',
  status public.subscription_status not null default 'active',
  rc_customer_id text,
  store text,
  started_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.love_dna_responses (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  question_id integer not null,
  axis text not null check (axis in ('S', 'D', 'A', 'V', 'M')),
  value integer not null check (value between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.love_dna_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  code text not null,
  clan text not null check (clan in ('Explorer', 'Dreamer', 'Thinker', 'Caregiver', 'Protector', 'Builder')),
  axis_s numeric not null,
  axis_d numeric not null,
  axis_a numeric not null,
  axis_v numeric not null,
  axis_m numeric not null,
  answered_count integer not null,
  updated_at timestamptz not null default now()
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(user_id) on delete cascade,
  blocked_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.likes (
  from_user uuid not null references public.profiles(user_id) on delete cascade,
  to_user uuid not null references public.profiles(user_id) on delete cascade,
  type public.reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(user_id) on delete cascade,
  user_b uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(user_id) on delete cascade,
  type text not null check (type in ('text', 'image', 'date_proposal', 'system')),
  body text,
  storage_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.date_proposals (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  proposer_id uuid not null references public.profiles(user_id) on delete cascade,
  datetime timestamptz not null,
  place text not null,
  meetup_id uuid,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create table public.gatherings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  region text not null,
  capacity integer not null check (capacity between 2 and 100),
  start_at timestamptz not null,
  type text not null default 'meetup' check (type in ('meetup', 'flash')),
  status public.gathering_status not null,
  source public.gathering_source not null,
  is_queer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gathering_participants (
  id uuid primary key default gen_random_uuid(),
  gathering_id uuid not null references public.gatherings(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  status public.participant_status not null default 'applied',
  created_at timestamptz not null default now(),
  unique (gathering_id, user_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  start_at timestamptz not null,
  status text not null check (status in ('upcoming', 'live', 'ended', 'canceled')),
  qr_enabled boolean not null default false,
  promo_code text,
  is_queer boolean not null default false
);

create table public.event_attendance (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  qr_checkin_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  is_queer boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'moderator', 'owner')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(user_id) on delete cascade,
  target_user_id uuid references public.profiles(user_id) on delete set null,
  context text not null,
  reason text not null,
  detail text,
  status text not null default 'received',
  created_at timestamptz not null default now()
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(user_id) on delete set null,
  target_user_id uuid references public.profiles(user_id) on delete set null,
  action text not null,
  ref text,
  note text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  type text not null check (type in ('like', 'match', 'message', 'event', 'gathering', 'system')),
  title text not null,
  body text not null,
  data jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_verified_female(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.verifications
    where user_id = uid and is_verified = true and is_female = true and age >= 19
  );
$$;

create or replace function public.current_plan()
returns public.plan
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select plan from public.subscriptions
     where user_id = auth.uid()
       and status in ('active', 'grace')
       and (expires_at is null or expires_at > now())),
    'free'::public.plan
  );
$$;

alter table public.verifications enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_photos enable row level security;
alter table public.badges enable row level security;
alter table public.subscriptions enable row level security;
alter table public.love_dna_responses enable row level security;
alter table public.love_dna_profiles enable row level security;
alter table public.blocks enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.date_proposals enable row level security;
alter table public.gatherings enable row level security;
alter table public.gathering_participants enable row level security;
alter table public.events enable row level security;
alter table public.event_attendance enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_posts enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.notifications enable row level security;

create policy "verification self read" on public.verifications
for select using (user_id = auth.uid());

create policy "profiles verified read" on public.profiles
for select using (
  public.is_verified_female()
  and public.is_verified_female(user_id)
  and not exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = user_id)
       or (blocker_id = user_id and blocked_id = auth.uid())
  )
);
create policy "profile self insert" on public.profiles
for insert with check (user_id = auth.uid());
create policy "profile self update" on public.profiles
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "subscription self read" on public.subscriptions
for select using (user_id = auth.uid());
create policy "badges verified read" on public.badges
for select using (public.is_verified_female() and public.is_verified_female(user_id));
create policy "photos verified read" on public.profile_photos
for select using (public.is_verified_female() and public.is_verified_female(user_id));
create policy "photos self write" on public.profile_photos
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "dna response self" on public.love_dna_responses
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dna profile verified read" on public.love_dna_profiles
for select using (public.is_verified_female() and public.is_verified_female(user_id));

create policy "blocks self" on public.blocks
for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "likes self read" on public.likes
for select using (public.is_verified_female() and (from_user = auth.uid() or to_user = auth.uid()));
create policy "matches members read" on public.matches
for select using (public.is_verified_female() and auth.uid() in (user_a, user_b));
create policy "chats members read" on public.chats
for select using (
  public.is_verified_female() and exists (
    select 1 from public.matches m
    where m.id = match_id and auth.uid() in (m.user_a, m.user_b)
  )
);
create policy "messages members all" on public.messages
for all using (
  public.is_verified_female() and exists (
    select 1 from public.chats c join public.matches m on m.id = c.match_id
    where c.id = chat_id and auth.uid() in (m.user_a, m.user_b)
  )
) with check (
  sender_id = auth.uid() and public.is_verified_female() and exists (
    select 1 from public.chats c join public.matches m on m.id = c.match_id
    where c.id = chat_id and auth.uid() in (m.user_a, m.user_b)
  )
);

create policy "gatherings verified read" on public.gatherings
for select using (
  public.is_verified_female()
  and (not is_queer or source = 'queer' or exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.queer_optin
  ))
);
create policy "gatherings host update" on public.gatherings
for update using (host_id = auth.uid() and status <> 'canceled')
with check (host_id = auth.uid());
create policy "participants visible to self or host" on public.gathering_participants
for select using (
  public.is_verified_female()
  and (user_id = auth.uid() or exists (
    select 1 from public.gatherings g where g.id = gathering_id and g.host_id = auth.uid()
  ))
);
create policy "community verified events" on public.events
for select using (public.is_verified_female());
create policy "community verified groups" on public.groups
for select using (public.is_verified_female());
create policy "group members verified read" on public.group_members
for select using (public.is_verified_female());
create policy "group posts verified read" on public.group_posts
for select using (public.is_verified_female());
create policy "group posts member insert" on public.group_posts
for insert with check (
  author_id = auth.uid() and exists (
    select 1 from public.group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  )
);

create policy "reports self create" on public.reports
for insert with check (public.is_verified_female() and reporter_id = auth.uid());
create policy "reports self read" on public.reports
for select using (reporter_id = auth.uid());
create policy "notifications self read" on public.notifications
for select using (user_id = auth.uid());
create policy "notifications self update" on public.notifications
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

grant execute on function public.is_verified_female(uuid) to authenticated;
grant execute on function public.current_plan() to authenticated;
