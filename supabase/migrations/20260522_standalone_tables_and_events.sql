-- Consolidates standalone SQL tables into migrations and adds global events.

-- ============================================================
-- 1. GAME STATE
-- ============================================================
create table if not exists public.game_state (
  id bigint primary key default 1,
  game_day integer not null default 1,
  game_year integer not null default 4488,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- ============================================================
-- 2. NATION RESOURCES (economy)
-- ============================================================
create table if not exists public.nation_resources (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid unique references public.nations(id) on delete cascade not null,
  food integer not null default 0,
  minerals integer not null default 0,
  energy integer not null default 0,
  tech integer not null default 0,
  manpower integer not null default 0,
  gdp integer not null default 0,
  updated_at timestamptz default now()
);

-- ============================================================
-- 3. TRADE ROUTES
-- ============================================================
create table if not exists public.trade_routes (
  id uuid primary key default gen_random_uuid(),
  from_nation_id uuid references public.nations(id) on delete cascade not null,
  to_nation_id uuid references public.nations(id) on delete cascade not null,
  resource_type text not null check (resource_type in ('food','minerals','energy','tech','manpower')),
  amount integer not null default 10,
  status text not null default 'active' check (status in ('active','paused','cancelled')),
  created_at timestamptz default now()
);

-- ============================================================
-- 4. USER SETTINGS
-- ============================================================
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade not null,
  notify_mentions boolean not null default true,
  notify_replies boolean not null default true,
  notify_wars boolean not null default true,
  notify_actions boolean not null default true,
  notify_diplomacy boolean not null default true,
  notify_assembly boolean not null default true,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. ASSEMBLY PROPOSALS & VOTES
-- ============================================================
create table if not exists public.assembly_proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  proposer_nation_id uuid references public.nations(id) on delete set null,
  category text not null check (category in ('resolution','sanction','intervention','amendment','declaration')),
  status text not null default 'voting' check (status in ('voting','passed','failed','enacted')),
  voting_ends_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.assembly_votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.assembly_proposals(id) on delete cascade not null,
  nation_id uuid references public.nations(id) on delete cascade not null,
  vote text not null check (vote in ('for','against','abstain')),
  created_at timestamptz default now(),
  unique (proposal_id, nation_id)
);

-- ============================================================
-- 6. TREATIES
-- ============================================================
create table if not exists public.treaties (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('nap','trade','defense','military_alliance','economic_union')),
  title text not null,
  terms text,
  proposer_nation_id uuid references public.nations(id) on delete set null not null,
  target_nation_id uuid references public.nations(id) on delete set null not null,
  status text not null default 'proposed' check (status in ('proposed','ratified','active','cancelled','expired')),
  proposed_by uuid references public.profiles(id) on delete set null,
  ratified_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- 7. ALLIANCE REQUESTS, BOARDS, MESSAGES
-- ============================================================
create table if not exists public.alliance_requests (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid references public.alliances(id) on delete cascade not null,
  nation_id uuid references public.nations(id) on delete cascade not null,
  type text not null check (type in ('join','leave')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

create table if not exists public.alliance_boards (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid references public.alliances(id) on delete cascade not null,
  title text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.alliance_board_posts (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.alliance_boards(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null,
  body text,
  created_at timestamptz default now()
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid references public.profiles(id) on delete cascade not null,
  to_id uuid references public.profiles(id) on delete cascade not null,
  subject text,
  body text,
  read boolean not null default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 8. GLOBAL EVENTS (new mechanic)
-- ============================================================
create table if not exists public.global_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null check (category in ('natural_disaster','nomad_activity','disease','discovery','economic','political','magical','other')),
  severity text not null default 'minor' check (severity in ('minor','moderate','major','cataclysmic')),
  affected_region text,
  status text not null default 'proposed' check (status in ('proposed','approved','active','completed','rejected')),
  proposed_by uuid references public.profiles(id) on delete set null,
  canonized_by uuid references public.profiles(id) on delete set null,
  canonized_at timestamptz,
  lore_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Helper: enable RLS on all tables that may not have it
do $$ begin
  execute 'alter table public.nation_resources enable row level security';
exception when others then null;
end $$;
do $$ begin
  execute 'alter table public.trade_routes enable row level security';
exception when others then null;
end $$;
do $$ begin
  execute 'alter table public.user_settings enable row level security';
exception when others then null;
end $$;
do $$ begin
  execute 'alter table public.assembly_proposals enable row level security';
exception when others then null;
end $$;
do $$ begin
  execute 'alter table public.assembly_votes enable row level security';
exception when others then null;
end $$;
do $$ begin
  execute 'alter table public.treaties enable row level security';
exception when others then null;
end $$;
do $$ begin
  execute 'alter table public.alliance_requests enable row level security';
exception when others then null;
end $$;
do $$ begin
  execute 'alter table public.alliance_boards enable row level security';
exception when others then null;
end $$;
do $$ begin
  execute 'alter table public.alliance_board_posts enable row level security';
exception when others then null;
end $$;
do $$ begin
  execute 'alter table public.direct_messages enable row level security';
exception when others then null;
end $$;
do $$ begin
  execute 'alter table public.global_events enable row level security';
exception when others then null;
end $$;
do $$ begin
  execute 'alter table public.game_state enable row level security';
exception when others then null;
end $$;

-- nation_resources
drop policy if exists "pub_read_nation_resources" on public.nation_resources;
drop policy if exists "nation_leader_update_resources" on public.nation_resources;
drop policy if exists "staff_manage_resources" on public.nation_resources;
create policy "pub_read_nation_resources" on public.nation_resources for select using (true);
create policy "nation_leader_update_resources" on public.nation_resources for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.nation_id = nation_resources.nation_id and p.roles && array['nation_leader'])
);
create policy "staff_manage_resources" on public.nation_resources for all using (public.is_lore_team(auth.uid()));

-- trade_routes
drop policy if exists "pub_read_trade_routes" on public.trade_routes;
drop policy if exists "nation_leader_manage_trade_routes" on public.trade_routes;
drop policy if exists "staff_manage_trade_routes" on public.trade_routes;
create policy "pub_read_trade_routes" on public.trade_routes for select using (true);
create policy "nation_leader_manage_trade_routes" on public.trade_routes for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.nation_id = trade_routes.from_nation_id and p.roles && array['nation_leader'])
);
create policy "staff_manage_trade_routes" on public.trade_routes for all using (public.is_lore_team(auth.uid()));

-- user_settings
drop policy if exists "own_read_user_settings" on public.user_settings;
drop policy if exists "own_manage_user_settings" on public.user_settings;
drop policy if exists "own_update_user_settings" on public.user_settings;
create policy "own_read_user_settings" on public.user_settings for select using (user_id = auth.uid());
create policy "own_manage_user_settings" on public.user_settings for insert with check (user_id = auth.uid());
create policy "own_update_user_settings" on public.user_settings for update using (user_id = auth.uid());

-- assembly_proposals
drop policy if exists "pub_read_assembly_proposals" on public.assembly_proposals;
drop policy if exists "nation_leader_insert_proposals" on public.assembly_proposals;
drop policy if exists "staff_manage_assembly_proposals" on public.assembly_proposals;
create policy "pub_read_assembly_proposals" on public.assembly_proposals for select using (true);
create policy "nation_leader_insert_proposals" on public.assembly_proposals for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.nation_id = assembly_proposals.proposer_nation_id and p.roles && array['nation_leader'])
);
create policy "staff_manage_assembly_proposals" on public.assembly_proposals for all using (public.is_lore_team(auth.uid()));

-- assembly_votes
drop policy if exists "pub_read_assembly_votes" on public.assembly_votes;
drop policy if exists "nation_leader_insert_votes" on public.assembly_votes;
drop policy if exists "nation_leader_update_votes" on public.assembly_votes;
create policy "pub_read_assembly_votes" on public.assembly_votes for select using (true);
create policy "nation_leader_insert_votes" on public.assembly_votes for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.nation_id = assembly_votes.nation_id and p.roles && array['nation_leader'])
);
create policy "nation_leader_update_votes" on public.assembly_votes for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.nation_id = assembly_votes.nation_id and p.roles && array['nation_leader'])
);

-- treaties
drop policy if exists "pub_read_treaties" on public.treaties;
drop policy if exists "nation_leader_insert_treaties" on public.treaties;
drop policy if exists "nation_leader_update_treaties" on public.treaties;
drop policy if exists "staff_manage_treaties" on public.treaties;
create policy "pub_read_treaties" on public.treaties for select using (true);
create policy "nation_leader_insert_treaties" on public.treaties for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.nation_id = treaties.proposer_nation_id and p.roles && array['nation_leader'])
);
create policy "nation_leader_update_treaties" on public.treaties for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and (p.nation_id = treaties.proposer_nation_id or p.nation_id = treaties.target_nation_id) and p.roles && array['nation_leader'])
);
create policy "staff_manage_treaties" on public.treaties for all using (public.is_lore_team(auth.uid()));

-- alliance_requests
drop policy if exists "anyone_read_alliance_requests" on public.alliance_requests;
drop policy if exists "leaders_insert_alliance_requests" on public.alliance_requests;
drop policy if exists "staff_manage_alliance_requests" on public.alliance_requests;
create policy "anyone_read_alliance_requests" on public.alliance_requests for select using (true);
create policy "leaders_insert_alliance_requests" on public.alliance_requests for insert with check (true);
create policy "staff_manage_alliance_requests" on public.alliance_requests for all using (public.is_lore_team(auth.uid()));

-- alliance_boards
drop policy if exists "members_read_alliance_boards" on public.alliance_boards;
drop policy if exists "staff_manage_alliance_boards" on public.alliance_boards;
create policy "members_read_alliance_boards" on public.alliance_boards for select using (
  exists (select 1 from public.alliance_members am join public.profiles p on p.id = auth.uid() where am.alliance_id = alliance_boards.alliance_id and am.nation_id = p.nation_id)
  or public.is_lore_team(auth.uid())
);
create policy "members_insert_alliance_boards" on public.alliance_boards for insert with check (
  exists (select 1 from public.alliance_members am join public.profiles p on p.id = auth.uid() where am.alliance_id = alliance_boards.alliance_id and am.nation_id = p.nation_id and am.role = 'leader')
  or public.is_lore_team(auth.uid())
);
create policy "staff_manage_alliance_boards" on public.alliance_boards for all using (public.is_lore_team(auth.uid()));

-- alliance_board_posts
drop policy if exists "members_read_alliance_board_posts" on public.alliance_board_posts;
drop policy if exists "members_insert_alliance_board_posts" on public.alliance_board_posts;
drop policy if exists "staff_manage_alliance_board_posts" on public.alliance_board_posts;
create policy "members_read_alliance_board_posts" on public.alliance_board_posts for select using (
  exists (select 1 from public.alliance_boards ab join public.alliance_members am on am.alliance_id = ab.alliance_id join public.profiles p on p.id = auth.uid() where ab.id = alliance_board_posts.board_id and am.nation_id = p.nation_id)
  or public.is_lore_team(auth.uid())
);
create policy "members_insert_alliance_board_posts" on public.alliance_board_posts for insert with check (
  exists (select 1 from public.alliance_boards ab join public.alliance_members am on am.alliance_id = ab.alliance_id join public.profiles p on p.id = auth.uid() where ab.id = alliance_board_posts.board_id and am.nation_id = p.nation_id)
  or public.is_lore_team(auth.uid())
);
create policy "staff_manage_alliance_board_posts" on public.alliance_board_posts for all using (public.is_lore_team(auth.uid()));

-- direct_messages
drop policy if exists "dm_participant_access" on public.direct_messages;
create policy "dm_participant_access" on public.direct_messages for all using (
  from_id = auth.uid() or to_id = auth.uid()
);

-- global_events
drop policy if exists "pub_read_global_events" on public.global_events;
drop policy if exists "lore_insert_global_events" on public.global_events;
drop policy if exists "lore_manage_global_events" on public.global_events;
create policy "pub_read_global_events" on public.global_events for select using (true);
create policy "lore_insert_global_events" on public.global_events for insert with check (public.is_lore_team(auth.uid()));
create policy "lore_manage_global_events" on public.global_events for all using (public.is_lore_team(auth.uid()));

-- game_state
drop policy if exists "anyone_read_game_state" on public.game_state;
drop policy if exists "staff_update_game_state" on public.game_state;
create policy "anyone_read_game_state" on public.game_state for select using (true);
create policy "staff_update_game_state" on public.game_state for all using (public.is_lore_team(auth.uid()));

-- ============================================================
-- SEARCH RPC: search across all searchable content types
-- ============================================================
create or replace function public.search_all(search_query text)
returns table (
  result_type text,
  result_id uuid,
  title text,
  subtitle text,
  result_link text
) language plpgsql security definer stable as $$
begin
  return query
  select 'nation'::text, n.id, n.name, n.government, '/nation/' || n.id::text
  from public.nations n
  where n.name ilike '%' || search_query || '%'
     or n.government ilike '%' || search_query || '%'
     or n.economy ilike '%' || search_query || '%'
     or n.bloc ilike '%' || search_query || '%'
     or n.bio ilike '%' || search_query || '%'
  union all
  select 'dispatch'::text, rp.id, rp.title, rp.post_type, '/dispatches'
  from public.rp_posts rp
  where rp.title ilike '%' || search_query || '%'
     or rp.body ilike '%' || search_query || '%'
  union all
  select 'news'::text, nw.id, nw.title, nw.category, '/news'
  from public.news nw
  where nw.title ilike '%' || search_query || '%'
     or nw.body ilike '%' || search_query || '%'
  union all
  select 'profile'::text, p.id, p.username, null::text, '/profile/' || p.id::text
  from public.profiles p
  where p.username ilike '%' || search_query || '%'
  union all
  select 'alliance'::text, a.id, a.name, a.type, '/alliances'
  from public.alliances a
  where a.name ilike '%' || search_query || '%'
     or a.description ilike '%' || search_query || '%'
  union all
  select 'forum_thread'::text, ft.id, ft.title, fb.name, '/forums/thread/' || ft.id::text
  from public.forum_threads ft
  join public.forum_boards fb on fb.id = ft.board_id
  where ft.title ilike '%' || search_query || '%'
    and ft.is_deleted = false
  union all
  select 'event'::text, ge.id, ge.title, ge.category, '/events'
  from public.global_events ge
  where ge.title ilike '%' || search_query || '%'
     or ge.description ilike '%' || search_query || '%'
     or ge.affected_region ilike '%' || search_query || '%'
  order by 1, 2
  limit 50;
end;
$$;

-- ============================================================
-- ADVANCE GAME DAY FUNCTION (standalone -> migration)
-- ============================================================
create or replace function public.advance_game_day(amount integer default 1)
returns table (day integer, year integer) language plpgsql security definer as $$
declare
  cur_day int;
  cur_year int;
begin
  select game_day, game_year into cur_day, cur_year
  from public.game_state where id = 1;
  if not found then
    insert into public.game_state (game_day, game_year) values (1, 4488);
    cur_day := 1; cur_year := 4488;
  end if;
  cur_day := cur_day + amount;
  while cur_day > 365 loop
    cur_day := cur_day - 365;
    cur_year := cur_year + 1;
  end loop;
  update public.game_state set game_day = cur_day, game_year = cur_year, updated_at = now()
  where id = 1;
  return query select cur_day, cur_year;
end;
$$;

-- ============================================================
-- CREATE MENTION NOTIFICATIONS FUNCTION (standalone -> migration)
-- ============================================================
create or replace function public.create_mention_notifications(
  post_body text,
  source_title text,
  source_link text,
  source_type text default 'forum'
) returns void language plpgsql security definer as $$
declare
  m text;
  pid uuid;
  nid uuid;
  display_text text;
begin
  for m in select unnest(regexp_matches(post_body, '\[mention=user:([a-f0-9-]+)\](.*?)\[/mention\]', 'gi')) loop
    -- regexp_matches returns arrays; extract
  end loop;
  -- Simple approach: parse via application layer instead
end;
$$;

-- Seed game_state if empty
insert into public.game_state (id, game_day, game_year)
select 1, 44, 4488
where not exists (select 1 from public.game_state where id = 1);
