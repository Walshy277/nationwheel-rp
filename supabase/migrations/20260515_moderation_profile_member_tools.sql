-- Moderation/profile/member-management tools.
-- Run after schema.sql and functions.sql.

drop policy if exists "staff_manage_rp_posts" on rp_posts;
drop policy if exists "staff_manage_news" on news;
drop policy if exists "staff_manage_canon_actions" on canon_actions;
drop policy if exists "staff_manage_nations" on nations;
drop policy if exists "admin_manage_profiles" on profiles;

create policy "staff_manage_rp_posts" on rp_posts
  for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_news" on news
  for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_canon_actions" on canon_actions
  for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_nations" on nations
  for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_profiles" on profiles
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create or replace function public.hard_delete_profile(target_profile uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can remove members';
  end if;

  if target_profile = auth.uid() then
    raise exception 'Admins cannot remove their own active account';
  end if;

  delete from auth.users where id = target_profile;
end;
$$;

notify pgrst, 'reload schema';
