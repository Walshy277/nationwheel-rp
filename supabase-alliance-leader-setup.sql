-- Alliance requests, private boards, leader inbox, and leader role setup
-- Run this after supabase-admin-setup.sql and supabase-notifications-setup.sql

-- 0. Add role column to alliance_members for alliance-level leadership
alter table alliance_members add column if not exists role text not null default 'member';
-- Auto-promote first member of each alliance to leader
update alliance_members am
set role = 'leader'
where id in (
  select id from (
    select id, row_number() over (partition by alliance_id order by created_at) rn
    from alliance_members
  ) ranked where rn = 1
);

-- 1. Leader role: assign_nation_as_staff now also sets role='leader'
create or replace function public.assign_nation_as_staff(target_profile uuid, target_nation uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_lore_team(auth.uid()) then
    raise exception 'Only admin or lore team can assign nations';
  end if;

  update public.nations
  set owner_id = target_profile
  where id = target_nation;

  update public.profiles
  set nation_id = target_nation,
      role = 'leader'
  where id = target_profile;
end;
$$;

-- 2. Alliance join/leave requests
create table if not exists alliance_requests (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid references alliances(id) on delete cascade not null,
  nation_id uuid references nations(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now(),
  unique (alliance_id, nation_id)
);

alter table alliance_requests enable row level security;

drop policy if exists "anyone_read_alliance_requests" on alliance_requests;
drop policy if exists "leaders_insert_alliance_requests" on alliance_requests;
drop policy if exists "staff_manage_alliance_requests" on alliance_requests;

create policy "anyone_read_alliance_requests"
  on alliance_requests for select
  using (true);

create policy "leaders_insert_alliance_requests"
  on alliance_requests for insert
  with check (true);

create policy "staff_manage_alliance_requests"
  on alliance_requests for all
  using (public.is_lore_team(auth.uid()))
  with check (public.is_lore_team(auth.uid()));

-- 3. Alliance private discussion boards
create table if not exists alliance_boards (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid references alliances(id) on delete cascade not null,
  title text not null,
  created_at timestamptz default now()
);

alter table alliance_boards enable row level security;

create table if not exists alliance_board_posts (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references alliance_boards(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);

alter table alliance_board_posts enable row level security;

drop policy if exists "members_read_alliance_boards" on alliance_boards;
drop policy if exists "members_insert_alliance_boards" on alliance_boards;
drop policy if exists "staff_manage_alliance_boards" on alliance_boards;
drop policy if exists "members_read_alliance_board_posts" on alliance_board_posts;
drop policy if exists "members_insert_alliance_board_posts" on alliance_board_posts;
drop policy if exists "staff_manage_alliance_board_posts" on alliance_board_posts;

-- Board-level RLS: member can read if their nation is in the alliance
create policy "members_read_alliance_boards"
  on alliance_boards for select
  using (
    exists (
      select 1 from alliance_members am
      join profiles p on p.nation_id = am.nation_id
      where am.alliance_id = alliance_boards.alliance_id
        and p.id = auth.uid()
    )
    or public.is_lore_team(auth.uid())
  );

create policy "members_insert_alliance_boards"
  on alliance_boards for insert
  with check (
    exists (
      select 1 from alliance_members am
      join profiles p on p.nation_id = am.nation_id
      where am.alliance_id = alliance_boards.alliance_id
        and p.id = auth.uid()
        and p.role = 'leader'
    )
    or public.is_lore_team(auth.uid())
  );

create policy "staff_manage_alliance_boards"
  on alliance_boards for all
  using (public.is_lore_team(auth.uid()))
  with check (public.is_lore_team(auth.uid()));

-- Post-level RLS
create policy "members_read_alliance_board_posts"
  on alliance_board_posts for select
  using (
    exists (
      select 1 from alliance_boards ab
      join alliance_members am on am.alliance_id = ab.alliance_id
      join profiles p on p.nation_id = am.nation_id
      where ab.id = alliance_board_posts.board_id
        and p.id = auth.uid()
    )
    or public.is_lore_team(auth.uid())
  );

create policy "members_insert_alliance_board_posts"
  on alliance_board_posts for insert
  with check (
    exists (
      select 1 from alliance_boards ab
      join alliance_members am on am.alliance_id = ab.alliance_id
      join profiles p on p.nation_id = am.nation_id
      where ab.id = alliance_board_posts.board_id
        and p.id = auth.uid()
    )
    or public.is_lore_team(auth.uid())
  );

create policy "staff_manage_alliance_board_posts"
  on alliance_board_posts for all
  using (public.is_lore_team(auth.uid()))
  with check (public.is_lore_team(auth.uid()));

-- 4. Direct messages between leaders
create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid references profiles(id) on delete cascade not null,
  to_id uuid references profiles(id) on delete cascade not null,
  subject text,
  body text not null,
  read boolean not null default false,
  created_at timestamptz default now()
);

alter table direct_messages enable row level security;

drop policy if exists "dm_participant_access" on direct_messages;

create policy "dm_participant_access"
  on direct_messages for all
  using (auth.uid() in (from_id, to_id))
  with check (auth.uid() = from_id);

-- Add leader role to any profiles that already have a nation but not yet leader
update profiles
set role = 'leader'
where nation_id is not null
  and role not in ('admin','lore','mod','lore_team');

-- Allow leaders to insert into alliance_members (for join approval flow)
drop policy if exists "leaders_join_alliance" on alliance_members;
create policy "leaders_join_alliance"
  on alliance_members for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.nation_id = alliance_members.nation_id
        and p.role in ('leader','admin','lore','mod','lore_team')
    )
  );

drop policy if exists "leaders_leave_alliance" on alliance_members;
create policy "leaders_leave_alliance"
  on alliance_members for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.nation_id = alliance_members.nation_id
    )
    or public.is_lore_team(auth.uid())
  );
