-- Run once in Supabase SQL Editor

-- Enable storage
insert into storage.buckets (id, name, public) values ('flags', 'flags', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('profile-media', 'profile-media', true) on conflict do nothing;
drop policy if exists "Public flag read" on storage.objects;
drop policy if exists "Auth flag upload" on storage.objects;
drop policy if exists "Auth flag update" on storage.objects;
drop policy if exists "Public profile media read" on storage.objects;
drop policy if exists "Auth profile media upload" on storage.objects;
drop policy if exists "Auth profile media update" on storage.objects;
create policy "Public flag read" on storage.objects for select using (bucket_id = 'flags');
create policy "Auth flag upload" on storage.objects for insert with check (bucket_id = 'flags' AND auth.role() = 'authenticated');
create policy "Auth flag update" on storage.objects for update using (bucket_id = 'flags' AND auth.role() = 'authenticated');
create policy "Public profile media read" on storage.objects for select using (bucket_id = 'profile-media');
create policy "Auth profile media upload" on storage.objects for insert with check (bucket_id = 'profile-media' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);
create policy "Auth profile media update" on storage.objects for update using (bucket_id = 'profile-media' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  roles text[] default '{user}',
  nation_id uuid,
  avatar_url text,
  signature_url text,
  bio text,
  status text default 'active',
  suspended_until timestamptz,
  ban_reason text,
  last_active_at timestamptz,
  created_at timestamptz default now()
);

alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists signature_url text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists status text default 'active';
alter table profiles add column if not exists suspended_until timestamptz;
alter table profiles add column if not exists ban_reason text;
alter table profiles add column if not exists last_active_at timestamptz;
alter table profiles add column if not exists roles text[] default '{user}';
-- Migrate old single role to roles array
update profiles set roles = case
  when role is null or role = '' then '{user}'
  when role = 'guest' then '{user}'
  when role in ('admin','owner') then '{admin}'
  when role in ('lore','lore_team','mod','moderator') then '{lore_team}'
  when role = 'leader' then '{nation_leader}'
  else ('{' || role || '}')::text[]
end
where roles is null or roles = '{}';

notify pgrst, 'reload schema';

create table if not exists nations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  government text, ideology text,
  population bigint, gdp_usd bigint, land_km2 bigint,
  army_rank int default 0, hdi numeric(3,2),
  economy text, bio text,
  diplomatic_status text, bloc text,
  flag_url text,
  owner_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

do $$ begin
  alter table profiles add constraint fk_nation foreign key (nation_id) references nations(id) on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists rp_posts (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid references nations(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  post_type text not null,
  title text not null,
  body text not null,
  target_nation_id uuid references nations(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists canon_actions (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid references nations(id) on delete cascade,
  submitted_by uuid references profiles(id) on delete cascade,
  title text not null, description text not null,
  size text default 'medium',
  status text default 'pending',
  started_at timestamptz, estimated_days int,
  completed_at timestamptz, lore_notes text,
  created_at timestamptz default now()
);

create table if not exists action_updates (
  id uuid primary key default gen_random_uuid(),
  action_id uuid references canon_actions(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists wars (
  id uuid primary key default gen_random_uuid(),
  aggressor_id uuid references nations(id) on delete cascade,
  defender_id uuid references nations(id) on delete cascade,
  name text, status text default 'active', casus_belli text, outcome text,
  objective text, casualties text, result text,
  ceasefire_days int, ceasefire_until timestamptz,
  started_at timestamptz default now(), ended_at timestamptz
);

alter table wars add column if not exists ceasefire_days int;
alter table wars add column if not exists ceasefire_until timestamptz;
alter table wars add column if not exists objective text;
alter table wars add column if not exists casualties text;
alter table wars add column if not exists result text;

create table if not exists alliances (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text,
  flag_url text,
  type text default 'alliance', status text default 'active',
  created_at timestamptz default now()
);

alter table alliances add column if not exists flag_url text;

create table if not exists alliance_members (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid references alliances(id) on delete cascade,
  nation_id uuid references nations(id) on delete cascade,
  role text not null default 'member' check (role in ('member','leader'))
);

create table if not exists war_participants (
  id uuid primary key default gen_random_uuid(),
  war_id uuid references wars(id) on delete cascade,
  side text not null check (side in ('attacker','defender')),
  nation_id uuid references nations(id) on delete cascade,
  alliance_id uuid references alliances(id) on delete cascade,
  created_at timestamptz default now(),
  check (nation_id is not null or alliance_id is not null)
);

create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade,
  title text not null, body text not null,
  category text default 'announcement', pinned boolean default false,
  created_at timestamptz default now()
);

create table if not exists forum_boards (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text,
  slug text unique not null, icon text, sort_order int default 0
);

create table if not exists forum_threads (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references forum_boards(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  nation_id uuid references nations(id) on delete set null,
  title text not null, pinned boolean default false, locked boolean default false,
  created_at timestamptz default now()
);

create table if not exists forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references forum_threads(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  nation_id uuid references nations(id) on delete set null,
  body text not null,
  canon_status text,
  canon_marked_by uuid references profiles(id) on delete set null,
  canon_marked_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists site_code_notes (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,
  note text not null,
  created_by uuid references profiles(id) on delete set null default auth.uid(),
  created_at timestamptz default now(),
  status text default 'open'
);

create table if not exists site_changelog (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references profiles(id) on delete set null default auth.uid(),
  published_at timestamptz default now()
);

create table if not exists forum_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references forum_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique (post_id, user_id, emoji)
);

-- RLS (explicit so Supabase can see it before you expose the API)
alter table profiles enable row level security;
alter table nations enable row level security;
alter table rp_posts enable row level security;
alter table canon_actions enable row level security;
alter table action_updates enable row level security;
alter table wars enable row level security;
alter table war_participants enable row level security;
alter table alliances enable row level security;
alter table alliance_members enable row level security;
alter table news enable row level security;
alter table forum_boards enable row level security;
alter table forum_threads enable row level security;
alter table forum_posts enable row level security;
alter table forum_reactions enable row level security;
alter table site_code_notes enable row level security;
alter table site_changelog enable row level security;

drop policy if exists "pub_read" on profiles;
drop policy if exists "pub_read" on nations;
drop policy if exists "pub_read" on rp_posts;
drop policy if exists "pub_read" on canon_actions;
drop policy if exists "pub_read" on action_updates;
drop policy if exists "pub_read" on wars;
drop policy if exists "pub_read" on war_participants;
drop policy if exists "pub_read" on alliances;
drop policy if exists "pub_read" on alliance_members;
drop policy if exists "pub_read" on news;
drop policy if exists "pub_read" on forum_boards;
drop policy if exists "pub_read" on forum_threads;
drop policy if exists "pub_read" on forum_posts;
drop policy if exists "pub_read" on forum_reactions;
drop policy if exists "pub_read" on site_changelog;
create policy "pub_read" on profiles for select using (true);
create policy "pub_read" on nations for select using (true);
create policy "pub_read" on rp_posts for select using (true);
create policy "pub_read" on canon_actions for select using (true);
create policy "pub_read" on action_updates for select using (true);
create policy "pub_read" on wars for select using (true);
create policy "pub_read" on war_participants for select using (true);
create policy "pub_read" on alliances for select using (true);
create policy "pub_read" on alliance_members for select using (true);
create policy "pub_read" on news for select using (true);
create policy "pub_read" on forum_boards for select using (true);
create policy "pub_read" on forum_threads for select using (true);
create policy "pub_read" on forum_posts for select using (true);
create policy "pub_read" on forum_reactions for select using (true);
create policy "pub_read" on site_changelog for select using (true);

drop policy if exists "own_insert" on profiles;
drop policy if exists "own_update" on profiles;
drop policy if exists "auth_insert_rp" on rp_posts;
drop policy if exists "auth_insert_ca" on canon_actions;
drop policy if exists "auth_insert_au" on action_updates;
drop policy if exists "auth_insert_ft" on forum_threads;
drop policy if exists "auth_insert_fp" on forum_posts;
drop policy if exists "auth_insert_fr" on forum_reactions;
drop policy if exists "own_update_ft" on forum_threads;
drop policy if exists "own_delete_ft" on forum_threads;
drop policy if exists "own_update_fp" on forum_posts;
drop policy if exists "own_delete_fp" on forum_posts;
drop policy if exists "own_delete_fr" on forum_reactions;
drop policy if exists "auth_insert_wars" on wars;
drop policy if exists "auth_insert_war_participants" on war_participants;
create policy "own_insert" on profiles for insert with check (auth.uid()=id);
create policy "own_update" on profiles for update using (auth.uid()=id);
create policy "auth_insert_rp" on rp_posts for insert with check (auth.uid()=author_id);
create policy "auth_insert_ca" on canon_actions for insert with check (auth.uid()=submitted_by);
create policy "auth_insert_au" on action_updates for insert with check (auth.uid()=author_id);
create policy "auth_insert_ft" on forum_threads for insert with check (auth.uid()=author_id);
create policy "auth_insert_fp" on forum_posts for insert with check (auth.uid()=author_id);
create policy "auth_insert_fr" on forum_reactions for insert with check (auth.uid()=user_id);
create policy "own_update_ft" on forum_threads for update using (auth.uid()=author_id);
create policy "own_delete_ft" on forum_threads for delete using (auth.uid()=author_id);
create policy "own_update_fp" on forum_posts for update using (auth.uid()=author_id);
create policy "own_delete_fp" on forum_posts for delete using (auth.uid()=author_id);
create policy "own_delete_fr" on forum_reactions for delete using (auth.uid()=user_id);
create policy "auth_insert_wars" on wars for insert with check (auth.role()='authenticated');
create policy "auth_insert_war_participants" on war_participants for insert with check (auth.role()='authenticated');

-- Seed forum boards
insert into forum_boards (name,description,slug,icon,sort_order) values
('General','Cross-world discussion and community chat','general','ðŸ’¬',1),
('Diplomacy','Treaties, negotiations, and alliances','diplomacy','ðŸ¤',2),
('Canon Actions','Action discussion and lore clarification','canon-actions','ðŸ§­',3),
('War Room','Military strategy and battle reports','war-room','âš”ï¸',4),
('Intelligence','Espionage, leaks, and covert operations','intelligence','ðŸ”Ž',5),
('Trade','Economic deals, markets, and logistics','trade','ðŸ’±',6),
('Propaganda','State media and public messaging','propaganda','ðŸ“£',7),
('Cultural Exchange','Arts, religion, and soft power','cultural-exchange','ðŸŽ­',8),
('Newsroom','Reports and world event discussion','newsroom','ðŸ“°',9),
('Lore Library','World lore, canon rules, and timeline','lore-library','ðŸ“š',10),
('Nation Introductions','Introduce your nation to the world','nation-introductions','ðŸŒ',11),
('Season Archives','Completed seasons and historical records','season-archives','ðŸ—„ï¸',12),
('Support','Questions, onboarding, and site help','support','ðŸ›Ÿ',13)
on conflict (slug) do update set icon = excluded.icon;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and roles && array['admin']);
$$;

create or replace function public.is_lore_team(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and roles && array['admin','lore_team']);
$$;

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
      roles = case
        when not (roles @> array['nation_leader']) then roles || array['nation_leader']
        else roles
      end
  where id = target_profile;
end;
$$;

drop policy if exists "admin_manage_profiles" on profiles;
drop policy if exists "admin_manage_nations" on nations;
drop policy if exists "admin_manage_canon_actions" on canon_actions;
drop policy if exists "admin_manage_wars" on wars;
drop policy if exists "admin_manage_war_participants" on war_participants;
drop policy if exists "admin_manage_alliances" on alliances;
drop policy if exists "admin_manage_alliance_members" on alliance_members;
drop policy if exists "admin_manage_news" on news;
drop policy if exists "admin_manage_forum_boards" on forum_boards;
drop policy if exists "staff_manage_forum_threads" on forum_threads;
drop policy if exists "staff_manage_forum_posts" on forum_posts;
drop policy if exists "staff_manage_forum_reactions" on forum_reactions;
drop policy if exists "staff_manage_site_code_notes" on site_code_notes;
drop policy if exists "staff_manage_site_changelog" on site_changelog;
create policy "admin_manage_profiles" on profiles for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin_manage_nations" on nations for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_canon_actions" on canon_actions for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_wars" on wars for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_war_participants" on war_participants for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_alliances" on alliances for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_alliance_members" on alliance_members for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_news" on news for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_forum_boards" on forum_boards for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_forum_threads" on forum_threads for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_forum_posts" on forum_posts for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_forum_reactions" on forum_reactions for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_site_code_notes" on site_code_notes for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_site_changelog" on site_changelog for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));

insert into profiles (id, username, roles)
select u.id, split_part(u.email, '@', 1), array['admin']
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id)
order by u.created_at
limit 1
on conflict (id) do update set roles = array['admin'];

update profiles
set roles = array['admin']
where id = (
  select id from profiles order by created_at nulls last, username limit 1
);
