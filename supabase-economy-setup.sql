-- Economy & Resource Tracking system
-- Run after all previous setup files

create table if not exists nation_resources (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid references nations(id) on delete cascade not null unique,
  food integer not null default 100,
  minerals integer not null default 100,
  energy integer not null default 100,
  tech integer not null default 10,
  manpower integer not null default 100,
  gdp bigint not null default 0,
  updated_at timestamptz default now()
);

alter table nation_resources enable row level security;

create table if not exists trade_routes (
  id uuid primary key default gen_random_uuid(),
  from_nation_id uuid references nations(id) on delete cascade not null,
  to_nation_id uuid references nations(id) on delete cascade not null,
  resource_type text not null check (resource_type in ('food','minerals','energy','tech','manpower')),
  amount integer not null default 10,
  status text not null default 'active' check (status in ('active','paused','cancelled')),
  created_at timestamptz default now()
);

alter table trade_routes enable row level security;

drop policy if exists "pub_read_nation_resources" on nation_resources;
drop policy if exists "nation_leader_update_resources" on nation_resources;
drop policy if exists "staff_manage_resources" on nation_resources;
drop policy if exists "pub_read_trade_routes" on trade_routes;
drop policy if exists "nation_leader_manage_trade_routes" on trade_routes;
drop policy if exists "staff_manage_trade_routes" on trade_routes;

create policy "pub_read_nation_resources"
  on nation_resources for select
  using (true);

create policy "nation_leader_update_resources"
  on nation_resources for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.nation_id = nation_resources.nation_id
        and p.roles && array['nation_leader']
    )
  );

create policy "staff_manage_resources"
  on nation_resources for all
  using (public.is_lore_team(auth.uid()))
  with check (public.is_lore_team(auth.uid()));

create policy "pub_read_trade_routes"
  on trade_routes for select
  using (true);

create policy "nation_leader_manage_trade_routes"
  on trade_routes for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.nation_id = trade_routes.from_nation_id
        and p.roles && array['nation_leader']
    )
  );

create policy "staff_manage_trade_routes"
  on trade_routes for all
  using (public.is_lore_team(auth.uid()))
  with check (public.is_lore_team(auth.uid()));

-- Auto-create resources for nations that don't have them
insert into nation_resources (nation_id, food, minerals, energy, tech, manpower, gdp)
select n.id, 100, 100, 100, 10, 100, 5000000
from nations n
left join nation_resources nr on nr.nation_id = n.id
where nr.id is null;
