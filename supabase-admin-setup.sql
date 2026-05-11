create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and role = 'admin');
$$;

create or replace function public.is_lore_team(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and role in ('admin','lore','mod'));
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
  set nation_id = target_nation
  where id = target_profile;
end;
$$;

create table if not exists war_participants (
  id uuid primary key default gen_random_uuid(),
  war_id uuid references wars(id) on delete cascade,
  side text not null check (side in ('attacker','defender')),
  nation_id uuid references nations(id) on delete cascade,
  alliance_id uuid references alliances(id) on delete cascade,
  created_at timestamptz default now(),
  check (nation_id is not null or alliance_id is not null)
);

alter table war_participants enable row level security;
alter table wars add column if not exists ceasefire_days int;
alter table wars add column if not exists ceasefire_until timestamptz;

drop policy if exists "admin_manage_profiles" on profiles;
drop policy if exists "admin_manage_nations" on nations;
drop policy if exists "admin_manage_canon_actions" on canon_actions;
drop policy if exists "admin_manage_wars" on wars;
drop policy if exists "admin_manage_war_participants" on war_participants;
drop policy if exists "admin_manage_alliances" on alliances;
drop policy if exists "admin_manage_alliance_members" on alliance_members;
drop policy if exists "admin_manage_news" on news;
drop policy if exists "admin_manage_forum_boards" on forum_boards;

create policy "admin_manage_profiles"
on profiles for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_manage_nations"
on nations for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

create policy "admin_manage_canon_actions"
on canon_actions for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

create policy "admin_manage_wars"
on wars for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

create policy "admin_manage_war_participants"
on war_participants for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

create policy "admin_manage_alliances"
on alliances for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

create policy "admin_manage_alliance_members"
on alliance_members for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

create policy "admin_manage_news"
on news for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

create policy "admin_manage_forum_boards"
on forum_boards for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

insert into profiles (id, username, role)
select u.id, split_part(u.email, '@', 1), 'admin'
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id)
order by u.created_at
limit 1
on conflict (id) do update set role = 'admin';

update profiles
set role = 'admin'
where id = (
  select id from profiles order by created_at nulls last, username limit 1
);
