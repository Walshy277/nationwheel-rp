-- Treaties & Diplomacy system
-- Run after all previous setup files

create table if not exists treaties (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('nap','trade','defense','military_alliance','economic_union')),
  title text not null,
  proposer_nation_id uuid references nations(id) on delete cascade not null,
  target_nation_id uuid references nations(id) on delete cascade not null,
  terms text,
  status text not null default 'proposed' check (status in ('proposed','ratified','active','cancelled','expired')),
  proposed_at timestamptz default now(),
  ratified_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table treaties enable row level security;

drop policy if exists "pub_read_treaties" on treaties;
drop policy if exists "nation_leader_insert_treaties" on treaties;
drop policy if exists "nation_leader_update_treaties" on treaties;
drop policy if exists "staff_manage_treaties" on treaties;

create policy "pub_read_treaties"
  on treaties for select
  using (true);

create policy "nation_leader_insert_treaties"
  on treaties for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.nation_id = treaties.proposer_nation_id
        and p.roles && array['nation_leader']
    )
  );

create policy "nation_leader_update_treaties"
  on treaties for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.nation_id in (treaties.proposer_nation_id, treaties.target_nation_id))
        and p.roles && array['nation_leader']
    )
  );

create policy "staff_manage_treaties"
  on treaties for all
  using (public.is_lore_team(auth.uid()))
  with check (public.is_lore_team(auth.uid()));
