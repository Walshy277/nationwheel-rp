-- Nationwheel profile setup / repair script.
-- Run this in Supabase SQL Editor when profiles, bios, avatars, signatures,
-- or the profile-media bucket are missing.
--
-- Safe to run more than once.

-- Required for gen_random_uuid() in older Supabase projects.
create extension if not exists pgcrypto;

-- Profile table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text default 'player',
  nation_id uuid,
  avatar_url text,
  signature_url text,
  bio text,
  custom_title text,
  warning_count int default 0,
  last_active_at timestamptz,
  privacy jsonb default '{}'::jsonb,
  status text default 'active',
  suspended_until timestamptz,
  ban_reason text,
  suspension_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists role text default 'player';
alter table public.profiles add column if not exists nation_id uuid;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists signature_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists custom_title text;
alter table public.profiles add column if not exists warning_count int default 0;
alter table public.profiles add column if not exists last_active_at timestamptz;
alter table public.profiles add column if not exists privacy jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists status text default 'active';
alter table public.profiles add column if not exists suspended_until timestamptz;
alter table public.profiles add column if not exists ban_reason text;
alter table public.profiles add column if not exists suspension_reason text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

alter table public.profiles alter column role set default 'player';
alter table public.profiles alter column warning_count set default 0;
alter table public.profiles alter column privacy set default '{}'::jsonb;
alter table public.profiles alter column status set default 'active';
alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column updated_at set default now();

-- Backfill usernames for any partially-created rows.
update public.profiles
set username = coalesce(nullif(username, ''), 'player_' || left(id::text, 8))
where username is null or username = '';

-- Add the nation foreign key only when the nations table exists.
do $$
begin
  if to_regclass('public.nations') is not null then
    begin
      alter table public.profiles
        add constraint profiles_nation_id_fkey
        foreign key (nation_id) references public.nations(id) on delete set null;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;

-- Useful profile indexes.
create unique index if not exists profiles_username_key on public.profiles (username);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_nation_id_idx on public.profiles (nation_id);

-- Keep updated_at current.
create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_profile_updated_at();

-- Staff helpers used by policies.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles
    where id = uid
      and role in ('admin', 'owner')
  );
$$;

create or replace function public.is_lore_team(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles
    where id = uid
      and role in ('admin', 'owner', 'lore', 'lore_team', 'mod', 'moderator')
  );
$$;

create or replace function public.profile_role(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = uid;
$$;

-- Create profiles for existing auth users.
insert into public.profiles (id, username, role, created_at)
select
  u.id,
  coalesce(
    nullif(regexp_replace(split_part(u.email, '@', 1), '[^a-zA-Z0-9_]+', '_', 'g'), ''),
    'player_' || left(u.id::text, 8)
  ),
  'player',
  coalesce(u.created_at, now())
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- Promote the first profile to admin if no admin/owner exists yet.
update public.profiles
set role = 'admin'
where id = (
  select id
  from public.profiles
  order by created_at nulls last, username
  limit 1
)
and not exists (
  select 1
  from public.profiles
  where role in ('admin', 'owner')
);

-- RLS for profiles.
alter table public.profiles enable row level security;

drop policy if exists "profiles_public_read" on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_admin_manage" on public.profiles;
drop policy if exists "pub_read" on public.profiles;
drop policy if exists "own_insert" on public.profiles;
drop policy if exists "own_update" on public.profiles;
drop policy if exists "admin_manage_profiles" on public.profiles;

create policy "profiles_public_read"
on public.profiles
for select
using (true);

create policy "profiles_self_insert"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_self_update"
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = public.profile_role(auth.uid())
);

create policy "profiles_admin_manage"
on public.profiles
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Public profile media bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public profile media read" on storage.objects;
drop policy if exists "Auth profile media upload" on storage.objects;
drop policy if exists "Auth profile media update" on storage.objects;
drop policy if exists "Auth profile media delete" on storage.objects;

create policy "Public profile media read"
on storage.objects
for select
using (bucket_id = 'profile-media');

create policy "Auth profile media upload"
on storage.objects
for insert
with check (
  bucket_id = 'profile-media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Auth profile media update"
on storage.objects
for update
using (
  bucket_id = 'profile-media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Auth profile media delete"
on storage.objects
for delete
using (
  bucket_id = 'profile-media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

notify pgrst, 'reload schema';
