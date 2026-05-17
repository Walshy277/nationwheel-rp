-- World Assembly system
-- Run after all previous setup files

create table if not exists assembly_proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  proposer_nation_id uuid references nations(id) on delete cascade not null,
  category text not null default 'resolution' check (category in ('resolution','sanction','intervention','amendment','declaration')),
  status text not null default 'voting' check (status in ('voting','passed','failed','enacted')),
  votes_for integer not null default 0,
  votes_against integer not null default 0,
  votes_abstain integer not null default 0,
  voting_ends_at timestamptz,
  enacted_at timestamptz,
  created_at timestamptz default now()
);

alter table assembly_proposals enable row level security;

create table if not exists assembly_votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references assembly_proposals(id) on delete cascade not null,
  nation_id uuid references nations(id) on delete cascade not null,
  vote text not null check (vote in ('for','against','abstain')),
  created_at timestamptz default now(),
  unique (proposal_id, nation_id)
);

alter table assembly_votes enable row level security;

drop policy if exists "pub_read_assembly_proposals" on assembly_proposals;
drop policy if exists "nation_leader_insert_proposals" on assembly_proposals;
drop policy if exists "staff_manage_assembly_proposals" on assembly_proposals;
drop policy if exists "pub_read_assembly_votes" on assembly_votes;
drop policy if exists "nation_leader_insert_votes" on assembly_votes;
drop policy if exists "nation_leader_update_votes" on assembly_votes;

create policy "pub_read_assembly_proposals"
  on assembly_proposals for select
  using (true);

create policy "nation_leader_insert_proposals"
  on assembly_proposals for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.nation_id = assembly_proposals.proposer_nation_id
        and p.roles && array['nation_leader']
    )
  );

create policy "staff_manage_assembly_proposals"
  on assembly_proposals for all
  using (public.is_lore_team(auth.uid()))
  with check (public.is_lore_team(auth.uid()));

create policy "pub_read_assembly_votes"
  on assembly_votes for select
  using (true);

create policy "nation_leader_insert_votes"
  on assembly_votes for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.nation_id = assembly_votes.nation_id
        and p.roles && array['nation_leader']
    )
  );

create policy "nation_leader_update_votes"
  on assembly_votes for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.nation_id = assembly_votes.nation_id
    )
  );
