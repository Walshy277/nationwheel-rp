-- User Settings & Preferences
-- Run after all previous setup files

create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null unique,
  notify_mentions boolean not null default true,
  notify_replies boolean not null default true,
  notify_wars boolean not null default true,
  notify_actions boolean not null default true,
  notify_diplomacy boolean not null default true,
  notify_assembly boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;

drop policy if exists "own_read_user_settings" on user_settings;
drop policy if exists "own_manage_user_settings" on user_settings;

create policy "own_read_user_settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "own_manage_user_settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "own_update_user_settings"
  on user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create settings for existing users
insert into user_settings (user_id)
select id from profiles
where id not in (select user_id from user_settings);
