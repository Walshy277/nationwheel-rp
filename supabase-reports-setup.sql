-- Reports & Moderation Queue
-- Run after all previous setup files

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade not null,
  target_type text not null check (target_type in ('forum_post','forum_thread','profile','dispatch','action','nation')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','investigating','resolved','dismissed')),
  assigned_to uuid references profiles(id) on delete set null,
  resolution text,
  resolved_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

alter table reports enable row level security;

drop policy if exists "users_insert_reports" on reports;
drop policy if exists "users_read_own_reports" on reports;
drop policy if exists "staff_manage_reports" on reports;

create policy "users_insert_reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

create policy "users_read_own_reports"
  on reports for select
  using (auth.uid() = reporter_id);

create policy "staff_manage_reports"
  on reports for all
  using (public.is_lore_team(auth.uid()))
  with check (public.is_lore_team(auth.uid()));
