create or replace function public.can_access_chat(
  target_chat_id uuid,
  viewer_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select viewer_id is not null
    and viewer_id = auth.uid()
    and public.is_verified_female(viewer_id)
    and exists (
      select 1
      from public.chats c
      join public.matches m on m.id = c.match_id
      where c.id = target_chat_id
        and viewer_id in (m.user_a, m.user_b)
        and public.is_verified_female(
          case when m.user_a = viewer_id then m.user_b else m.user_a end
        )
        and public.is_not_blocked(
          case when m.user_a = viewer_id then m.user_b else m.user_a end,
          viewer_id
        )
    );
$$;

create or replace function public.list_chat_messages(
  target_chat_id uuid,
  before_at timestamptz default null,
  page_size integer default 30
)
returns table (
  id uuid,
  chat_id uuid,
  sender_id uuid,
  type text,
  body text,
  storage_path text,
  read_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.can_access_chat(target_chat_id) then
    raise exception 'CHAT_FORBIDDEN';
  end if;

  return query
  select
    msg.id,
    msg.chat_id,
    msg.sender_id,
    msg.type,
    msg.body,
    msg.storage_path,
    case
      when msg.sender_id = auth.uid() and public.current_plan() in ('plus', 'premium')
        then msg.read_at
      else null
    end,
    msg.created_at
  from public.messages msg
  where msg.chat_id = target_chat_id
    and (before_at is null or msg.created_at < before_at)
  order by msg.created_at desc
  limit greatest(1, least(page_size, 50));
end;
$$;

drop policy if exists "chats members read" on public.chats;
create policy "chats verified unblocked members read" on public.chats
for select using (public.can_access_chat(id));

drop policy if exists "messages members all" on public.messages;
create policy "messages verified unblocked members read" on public.messages
for select using (public.can_access_chat(chat_id));
create policy "messages verified unblocked members insert" on public.messages
for insert with check (
  sender_id = auth.uid()
  and public.can_access_chat(chat_id)
  and (
    (type = 'text' and nullif(trim(body), '') is not null and storage_path is null)
    or (type = 'image' and body is null and nullif(trim(storage_path), '') is not null)
  )
);

drop policy if exists "date proposals members read" on public.date_proposals;
drop policy if exists "date proposals proposer insert" on public.date_proposals;
drop policy if exists "date proposals recipient update" on public.date_proposals;
create policy "date proposals verified unblocked members read" on public.date_proposals
for select using (public.can_access_chat(chat_id));
create policy "date proposals verified unblocked proposer insert" on public.date_proposals
for insert with check (
  proposer_id = auth.uid()
  and status = 'proposed'
  and public.can_access_chat(chat_id)
);
create policy "date proposals verified unblocked recipient update" on public.date_proposals
for update using (
  proposer_id <> auth.uid()
  and status = 'proposed'
  and public.can_access_chat(chat_id)
) with check (
  proposer_id <> auth.uid()
  and status in ('accepted', 'declined')
  and public.can_access_chat(chat_id)
);

create or replace function public.mark_read(chat_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare updated_count integer;
begin
  if not public.can_access_chat(mark_read.chat_id) then
    raise exception 'CHAT_FORBIDDEN';
  end if;

  update public.messages
  set read_at = coalesce(read_at, now())
  where messages.chat_id = mark_read.chat_id
    and sender_id <> auth.uid()
    and read_at is null;
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.create_date_proposal(
  target_chat_id uuid,
  proposed_at timestamptz,
  proposed_place text,
  note text default null
)
returns public.date_proposals
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare proposal public.date_proposals;
begin
  if not public.can_access_chat(target_chat_id) then
    raise exception 'CHAT_FORBIDDEN';
  end if;
  if proposed_at <= now() then raise exception 'INVALID_DATETIME'; end if;
  if length(trim(proposed_place)) not between 2 and 120 then
    raise exception 'INVALID_PLACE';
  end if;
  if note is not null and length(trim(note)) > 500 then
    raise exception 'INVALID_NOTE';
  end if;

  insert into public.date_proposals (chat_id, proposer_id, datetime, place)
  values (target_chat_id, auth.uid(), proposed_at, trim(proposed_place))
  returning * into proposal;

  if nullif(trim(note), '') is not null then
    insert into public.messages (chat_id, sender_id, type, body)
    values (target_chat_id, auth.uid(), 'text', trim(note));
  end if;

  return proposal;
end;
$$;

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare recipient_id uuid;
begin
  select case when m.user_a = new.sender_id then m.user_b else m.user_a end
  into recipient_id
  from public.chats c
  join public.matches m on m.id = c.match_id
  where c.id = new.chat_id;

  if recipient_id is not null then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      recipient_id,
      'message',
      '새 메시지가 도착했어요',
      case when new.type = 'image' then '사진을 보냈어요.' else left(new.body, 80) end,
      jsonb_build_object('chat_id', new.chat_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists messages_notify_recipient on public.messages;
create trigger messages_notify_recipient
after insert on public.messages
for each row execute function public.notify_new_message();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'date_proposals'
  ) then
    alter publication supabase_realtime add table public.date_proposals;
  end if;
end;
$$;

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'
  ]
where id = 'message-images';

drop policy if exists "message images members read" on storage.objects;
drop policy if exists "message images members write" on storage.objects;
drop policy if exists "message images owner delete" on storage.objects;
create policy "message images unblocked members read" on storage.objects
for select to authenticated using (
  bucket_id = 'message-images'
  and public.can_access_chat((storage.foldername(name))[1]::uuid)
);
create policy "message images unblocked members write" on storage.objects
for insert to authenticated with check (
  bucket_id = 'message-images'
  and public.can_access_chat((storage.foldername(name))[1]::uuid)
);
create policy "message images owner delete" on storage.objects
for delete to authenticated using (
  bucket_id = 'message-images'
  and owner_id = auth.uid()::text
);

revoke all on public.messages from authenticated;
grant select (id, chat_id, sender_id, type, body, storage_path, created_at)
  on public.messages to authenticated;
grant insert (chat_id, sender_id, type, body, storage_path)
  on public.messages to authenticated;

revoke all on function public.can_access_chat(uuid, uuid) from public;
revoke all on function public.list_chat_messages(uuid, timestamptz, integer) from public;
revoke all on function public.create_date_proposal(uuid, timestamptz, text, text) from public;
grant execute on function public.can_access_chat(uuid, uuid) to authenticated;
grant execute on function public.list_chat_messages(uuid, timestamptz, integer) to authenticated;
grant execute on function public.create_date_proposal(uuid, timestamptz, text, text)
  to authenticated;
