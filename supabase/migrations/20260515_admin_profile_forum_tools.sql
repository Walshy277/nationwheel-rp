-- Admin/profile/forum moderation pass.

alter table profiles add column if not exists status text not null default 'active'
  check (status in ('active', 'suspended', 'banned'));
alter table profiles add column if not exists suspended_until timestamptz;
alter table profiles add column if not exists ban_reason text;
alter table profiles add column if not exists last_active_at timestamptz;

alter table forum_posts add column if not exists canon_status text
  check (canon_status in ('canon', 'non_canon'));
alter table forum_posts add column if not exists canon_marked_by uuid references profiles(id) on delete set null;
alter table forum_posts add column if not exists canon_marked_at timestamptz;

create table if not exists site_code_notes (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,
  note text not null,
  created_by uuid references profiles(id) on delete set null default auth.uid(),
  created_at timestamptz default now(),
  status text not null default 'open' check (status in ('open', 'accepted', 'rejected', 'deployed'))
);

create table if not exists site_changelog (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references profiles(id) on delete set null default auth.uid(),
  published_at timestamptz default now()
);

alter table site_code_notes enable row level security;
alter table site_changelog enable row level security;

drop policy if exists "staff_manage_site_code_notes" on site_code_notes;
drop policy if exists "public_read_site_changelog" on site_changelog;
drop policy if exists "staff_manage_site_changelog" on site_changelog;

create policy "staff_manage_site_code_notes" on site_code_notes
  for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "public_read_site_changelog" on site_changelog
  for select using (true);
create policy "staff_manage_site_changelog" on site_changelog
  for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));

notify pgrst, 'reload schema';
