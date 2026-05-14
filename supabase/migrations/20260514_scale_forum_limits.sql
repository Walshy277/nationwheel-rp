-- Scaling layer for a forum-style Supabase free-tier deployment.
-- Goal: no table-wide forum loads, no live-chat behavior, realtime only for notifications.

alter table forum_boards add column if not exists thread_count int not null default 0;
alter table forum_boards add column if not exists post_count int not null default 0;
alter table forum_boards add column if not exists last_thread_id uuid references forum_threads(id) on delete set null;
alter table forum_boards add column if not exists last_post_id uuid references forum_posts(id) on delete set null;
alter table forum_boards add column if not exists last_post_at timestamptz;
alter table forum_boards add column if not exists last_post_author_id uuid references profiles(id) on delete set null;

alter table forum_threads add column if not exists last_post_id uuid references forum_posts(id) on delete set null;
alter table forum_threads add column if not exists last_post_at timestamptz;
alter table forum_threads add column if not exists last_post_author_id uuid references profiles(id) on delete set null;

alter table forum_posts add column if not exists content_format text not null default 'bbcode'
  check (content_format in ('bbcode', 'plain'));

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  type text not null check (type in ('thread_reply', 'mention', 'moderation', 'system')),
  thread_id uuid references forum_threads(id) on delete cascade,
  post_id uuid references forum_posts(id) on delete cascade,
  title text not null,
  body_preview text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_forum_threads_board_page
  on forum_threads(board_id, is_deleted, is_pinned desc, last_post_at desc nulls last, created_at desc, id desc);
create index if not exists idx_forum_threads_board_created
  on forum_threads(board_id, is_deleted, created_at desc, id desc);
create index if not exists idx_forum_posts_thread_page
  on forum_posts(thread_id, is_deleted, post_number asc, id asc);
create index if not exists idx_forum_posts_author_created
  on forum_posts(author_id, created_at desc);
create index if not exists idx_forum_reactions_post
  on forum_reactions(post_id, emoji);
create index if not exists idx_thread_subscriptions_profile
  on thread_subscriptions(profile_id, notify_on_reply);
create index if not exists idx_notifications_recipient_unread
  on notifications(recipient_id, read_at, created_at desc);
create index if not exists idx_notifications_recipient_created
  on notifications(recipient_id, created_at desc);
create index if not exists idx_news_public_page
  on news(pinned desc, created_at desc, id desc);
create index if not exists idx_rp_posts_public_page
  on rp_posts(created_at desc, id desc);
create index if not exists idx_canon_actions_public_page
  on canon_actions(status, created_at desc, id desc);

create or replace view public.forum_board_summaries as
select
  b.id,
  b.category_id,
  b.parent_board_id,
  b.name,
  b.description,
  b.slug,
  b.icon,
  b.sort_order,
  b.visibility,
  b.is_locked,
  b.thread_count,
  b.post_count,
  b.last_thread_id,
  t.title as last_thread_title,
  b.last_post_id,
  b.last_post_at,
  p.username as last_post_author_username,
  p.avatar_url as last_post_author_avatar_url
from forum_boards b
left join forum_threads t on t.id = b.last_thread_id
left join profiles p on p.id = b.last_post_author_id
where b.visibility in ('public', 'members', 'archived')
   or public.is_lore_team(auth.uid());

create or replace view public.forum_thread_summaries as
select
  t.id,
  t.board_id,
  t.author_id,
  t.nation_id,
  t.title,
  t.slug,
  t.tags,
  t.created_at,
  t.is_pinned,
  coalesce(t.pinned, false) as legacy_pinned,
  t.is_locked,
  coalesce(t.locked, false) as legacy_locked,
  t.is_archived,
  t.is_deleted,
  t.is_canon,
  t.is_official,
  t.reply_count,
  t.view_count,
  t.last_post_id,
  coalesce(t.last_post_at, t.created_at) as last_post_at,
  author.username as author_username,
  author.avatar_url as author_avatar_url,
  last_author.username as last_post_author_username,
  last_author.avatar_url as last_post_author_avatar_url
from forum_threads t
join forum_boards b on b.id = t.board_id
left join profiles author on author.id = t.author_id
left join profiles last_author on last_author.id = t.last_post_author_id
where t.is_deleted is not true
  and (
    b.visibility in ('public', 'members', 'archived')
    or public.is_lore_team(auth.uid())
  );

create or replace function public.refresh_forum_counts()
returns void
language sql
security definer
set search_path = public
as $$
  with thread_counts as (
    select
      b.id as board_id,
      count(t.id)::int as thread_count
    from forum_boards b
    left join forum_threads t on t.board_id = b.id and t.is_deleted is not true
    group by b.id
  ),
  post_counts as (
    select
      t.board_id,
      count(p.id)::int as post_count
    from forum_threads t
    join forum_posts p on p.thread_id = t.id and p.is_deleted is not true
    where t.is_deleted is not true
    group by t.board_id
  ),
  latest as (
    select distinct on (t.board_id)
      t.board_id,
      t.id as last_thread_id,
      p.id as last_post_id,
      p.created_at as last_post_at,
      p.author_id as last_post_author_id
    from forum_threads t
    join forum_posts p on p.thread_id = t.id
    where t.is_deleted is not true and p.is_deleted is not true
    order by t.board_id, p.created_at desc, p.id desc
  )
  update forum_boards b
  set
    thread_count = coalesce(tc.thread_count, 0),
    post_count = coalesce(pc.post_count, 0),
    last_thread_id = latest.last_thread_id,
    last_post_id = latest.last_post_id,
    last_post_at = latest.last_post_at,
    last_post_author_id = latest.last_post_author_id
  from thread_counts tc
  left join post_counts pc on pc.board_id = tc.board_id
  left join latest on latest.board_id = tc.board_id
  where b.id = tc.board_id;

  with latest as (
    select distinct on (p.thread_id)
      p.thread_id,
      p.id as last_post_id,
      p.created_at as last_post_at,
      p.author_id as last_post_author_id
    from forum_posts p
    where p.is_deleted is not true
    order by p.thread_id, p.created_at desc, p.id desc
  ),
  counts as (
    select
      t.id as thread_id,
      greatest(count(p.id)::int - 1, 0) as reply_count
    from forum_threads t
    left join forum_posts p on p.thread_id = t.id and p.is_deleted is not true
    group by t.id
  )
  update forum_threads t
  set
    reply_count = coalesce(c.reply_count, 0),
    last_post_id = latest.last_post_id,
    last_post_at = latest.last_post_at,
    last_post_author_id = latest.last_post_author_id
  from counts c
  left join latest on latest.thread_id = c.thread_id
  where t.id = c.thread_id;
$$;

create or replace function public.assign_post_number()
returns trigger
language plpgsql
as $$
begin
  if new.post_number is null then
    select coalesce(max(post_number), 0) + 1
    into new.post_number
    from forum_posts
    where thread_id = new.thread_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_post_number on forum_posts;
create trigger trg_assign_post_number
before insert on forum_posts
for each row execute function public.assign_post_number();

with numbered_posts as (
  select
    id,
    row_number() over (partition by thread_id order by created_at asc, id asc)::int as next_post_number
  from forum_posts
  where post_number is null
)
update forum_posts p
set post_number = numbered_posts.next_post_number
from numbered_posts
where p.id = numbered_posts.id;

create or replace function public.after_forum_post_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  thread_board uuid;
  thread_title text;
begin
  select board_id, title into thread_board, thread_title
  from forum_threads
  where id = new.thread_id;

  update forum_threads
  set
    reply_count = greatest(new.post_number - 1, 0),
    last_post_id = new.id,
    last_post_at = new.created_at,
    last_post_author_id = new.author_id
  where id = new.thread_id;

  update forum_boards
  set
    post_count = post_count + 1,
    last_thread_id = new.thread_id,
    last_post_id = new.id,
    last_post_at = new.created_at,
    last_post_author_id = new.author_id
  where id = thread_board;

  insert into notifications (recipient_id, actor_id, type, thread_id, post_id, title, body_preview)
  select
    s.profile_id,
    new.author_id,
    'thread_reply',
    new.thread_id,
    new.id,
    thread_title,
    left(regexp_replace(new.body, '\s+', ' ', 'g'), 180)
  from thread_subscriptions s
  where s.thread_id = new.thread_id
    and s.notify_on_reply
    and s.profile_id <> new.author_id
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_after_forum_post_insert on forum_posts;
create trigger trg_after_forum_post_insert
after insert on forum_posts
for each row execute function public.after_forum_post_insert();

create or replace function public.after_forum_thread_insert()
returns trigger
language plpgsql
as $$
begin
  update forum_boards
  set thread_count = thread_count + 1
  where id = new.board_id;
  return new;
end;
$$;

drop trigger if exists trg_after_forum_thread_insert on forum_threads;
create trigger trg_after_forum_thread_insert
after insert on forum_threads
for each row execute function public.after_forum_thread_insert();

create or replace function public.list_board_threads(
  p_board_slug text,
  p_cursor_is_pinned boolean default null,
  p_cursor_last_post_at timestamptz default null,
  p_cursor_id uuid default null,
  p_limit int default 25
)
returns setof public.forum_thread_summaries
language sql
stable
security definer
set search_path = public
as $$
  select s.*
  from public.forum_thread_summaries s
  join forum_boards b on b.id = s.board_id
  where b.slug = p_board_slug
    and (
      p_cursor_last_post_at is null
      or (s.is_pinned, s.last_post_at, s.id) < (p_cursor_is_pinned, p_cursor_last_post_at, p_cursor_id)
    )
  order by s.is_pinned desc, s.last_post_at desc, s.id desc
  limit least(greatest(p_limit, 1), 50);
$$;

create or replace function public.list_thread_posts(
  p_thread_id uuid,
  p_after_post_number int default 0,
  p_limit int default 25
)
returns table (
  id uuid,
  thread_id uuid,
  author_id uuid,
  nation_id uuid,
  post_number int,
  body text,
  content_format text,
  created_at timestamptz,
  edited_at timestamptz,
  is_deleted boolean,
  author_username text,
  author_avatar_url text,
  author_signature_url text,
  author_bio text,
  nation_name text,
  nation_flag_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.thread_id,
    p.author_id,
    p.nation_id,
    p.post_number,
    p.body,
    p.content_format,
    p.created_at,
    p.edited_at,
    p.is_deleted,
    prof.username,
    prof.avatar_url,
    prof.signature_url,
    prof.bio,
    n.name,
    n.flag_url
  from forum_posts p
  join forum_threads t on t.id = p.thread_id
  join forum_boards b on b.id = t.board_id
  left join profiles prof on prof.id = p.author_id
  left join nations n on n.id = p.nation_id
  where p.thread_id = p_thread_id
    and p.is_deleted is not true
    and p.post_number > p_after_post_number
    and (
      b.visibility in ('public', 'members', 'archived')
      or public.is_lore_team(auth.uid())
    )
  order by p.post_number asc
  limit least(greatest(p_limit, 1), 50);
$$;

create or replace function public.mark_notifications_read(p_before timestamptz default now())
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  changed int;
begin
  update notifications
  set read_at = now()
  where recipient_id = auth.uid()
    and read_at is null
    and created_at <= p_before;

  get diagnostics changed = row_count;
  return changed;
end;
$$;

alter table notifications enable row level security;

drop policy if exists "own_notifications_read" on notifications;
drop policy if exists "own_notifications_update" on notifications;
drop policy if exists "staff_insert_notifications" on notifications;
create policy "own_notifications_read" on notifications
  for select using (recipient_id = auth.uid() or public.is_lore_team(auth.uid()));
create policy "own_notifications_update" on notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "staff_insert_notifications" on notifications
  for insert with check (public.is_lore_team(auth.uid()));

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

select public.refresh_forum_counts();
notify pgrst, 'reload schema';
