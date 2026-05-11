-- Run this once on an existing Nationwheel Supabase project.
-- It enables forum reactions plus post/thread editing and moderation policies.

create or replace function public.is_lore_team(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and role in ('admin','lore','mod'));
$$;

create table if not exists forum_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references forum_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique (post_id, user_id, emoji)
);

alter table forum_reactions enable row level security;

drop policy if exists "pub_read" on forum_reactions;
drop policy if exists "auth_insert_fr" on forum_reactions;
drop policy if exists "own_delete_fr" on forum_reactions;
drop policy if exists "own_update_ft" on forum_threads;
drop policy if exists "own_delete_ft" on forum_threads;
drop policy if exists "own_update_fp" on forum_posts;
drop policy if exists "own_delete_fp" on forum_posts;
drop policy if exists "staff_manage_forum_threads" on forum_threads;
drop policy if exists "staff_manage_forum_posts" on forum_posts;
drop policy if exists "staff_manage_forum_reactions" on forum_reactions;

create policy "pub_read" on forum_reactions for select using (true);
create policy "auth_insert_fr" on forum_reactions for insert with check (auth.uid() = user_id);
create policy "own_delete_fr" on forum_reactions for delete using (auth.uid() = user_id);
create policy "own_update_ft" on forum_threads for update using (auth.uid() = author_id);
create policy "own_delete_ft" on forum_threads for delete using (auth.uid() = author_id);
create policy "own_update_fp" on forum_posts for update using (auth.uid() = author_id);
create policy "own_delete_fp" on forum_posts for delete using (auth.uid() = author_id);

create policy "staff_manage_forum_threads"
on forum_threads for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

create policy "staff_manage_forum_posts"
on forum_posts for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

create policy "staff_manage_forum_reactions"
on forum_reactions for all
using (public.is_lore_team(auth.uid()))
with check (public.is_lore_team(auth.uid()));

notify pgrst, 'reload schema';
