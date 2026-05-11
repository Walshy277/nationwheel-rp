-- Run this once on an existing Nationwheel Supabase project.
-- It enables multi-nation and alliance wars.

create or replace function public.is_lore_team(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and role in ('admin','lore','mod'));
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

drop policy if exists "pub_read" on war_participants;
drop policy if exists "auth_insert_wars" on wars;
drop policy if exists "auth_insert_war_participants" on war_participants;
drop policy if exists "admin_manage_war_participants" on war_participants;

create policy "pub_read"
on war_participants
for select
using (true);

create policy "auth_insert_wars"
on wars
for insert
with check (auth.role() = 'authenticated');

create policy "auth_insert_war_participants"
on war_participants
for insert
with check (auth.role() = 'authenticated');

create policy "admin_manage_war_participants"
on war_participants
for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

insert into war_participants (war_id, side, nation_id)
select id, 'attacker', aggressor_id
from wars
where aggressor_id is not null
  and not exists (
    select 1 from war_participants wp
    where wp.war_id = wars.id and wp.side = 'attacker' and wp.nation_id = wars.aggressor_id
  );

insert into war_participants (war_id, side, nation_id)
select id, 'defender', defender_id
from wars
where defender_id is not null
  and not exists (
    select 1 from war_participants wp
    where wp.war_id = wars.id and wp.side = 'defender' and wp.nation_id = wars.defender_id
  );

notify pgrst, 'reload schema';
