-- Notifications and in-game calendar tables
-- Run this in Supabase SQL Editor after the other setup files.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  type text not null default 'mention',
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_profile on notifications(profile_id, created_at desc);

alter table notifications enable row level security;

drop policy if exists "users_read_own_notifications" on notifications;
drop policy if exists "system_insert_notifications" on notifications;
drop policy if exists "users_mark_read_notifications" on notifications;

create policy "users_read_own_notifications"
  on notifications for select
  using (auth.uid() = profile_id);

create policy "system_insert_notifications"
  on notifications for insert
  with check (true);

create policy "users_mark_read_notifications"
  on notifications for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- In-game calendar/state (single row)
create table if not exists game_state (
  id integer primary key default 1 check (id = 1),
  game_day integer not null default 1,
  game_year integer not null default 4488,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

alter table game_state enable row level security;

drop policy if exists "anyone_read_game_state" on game_state;
drop policy if exists "staff_update_game_state" on game_state;

create policy "anyone_read_game_state"
  on game_state for select
  using (true);

create policy "staff_update_game_state"
  on game_state for all
  using (public.is_lore_team(auth.uid()))
  with check (public.is_lore_team(auth.uid()));

-- Insert initial game state if not present
insert into game_state (id, game_day, game_year)
select 1, 44, 4488
where not exists (select 1 from game_state where id = 1);

-- Helper function to advance game day
create or replace function public.advance_game_day(amount int default 1)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  current_day int;
  current_year int;
  new_day int;
  new_year int;
begin
  if not public.is_lore_team(auth.uid()) then
    raise exception 'Only lore team can advance the game day';
  end if;

  select game_day, game_year into current_day, current_year
  from game_state where id = 1;

  new_day := current_day + amount;
  new_year := current_year;

  while new_day > 365 loop
    new_day := new_day - 365;
    new_year := new_year + 1;
  end loop;

  update game_state
  set game_day = new_day,
      game_year = new_year,
      updated_at = now()
  where id = 1;

  return json_build_object('day', new_day, 'year', new_year);
end;
$$;

-- Helper: auto-create notifications for mention tags in post bodies
create or replace function public.create_mention_notifications(
  post_body text,
  source_title text,
  source_link text,
  source_type text default 'forum'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m_user text[];
  m_nation text[];
  pid uuid;
begin
  -- Extract user mentions: [mention=user:UUID]text[/mention]
  for m_user in
    select regexp_matches(post_body, '\[mention=user:([a-f0-9\-]+)\](.*?)\[\/mention\]', 'gi')
  loop
    insert into notifications (profile_id, type, title, body, link)
    values (
      m_user[1]::uuid,
      source_type || '_mention',
      'You were mentioned in ' || source_title,
      m_user[2],
      source_link
    )
    on conflict do nothing;
  end loop;

  -- Extract nation mentions: [mention=nation:UUID]text[/mention]
  -- Send to all members of that nation (if we have the info) — for now, skip
  -- as we'd need a secondary query. Users can be @mentioned directly.
end;
$$;

alter table profiles add column if not exists signature_text text;
