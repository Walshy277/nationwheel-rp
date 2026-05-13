-- RLS policy layer. Run after schema.sql and functions.sql.

drop policy if exists "public_read_categories" on forum_categories;
drop policy if exists "staff_manage_categories" on forum_categories;
create policy "public_read_categories" on forum_categories for select using (visibility in ('public','members','archived') or public.is_lore_team(auth.uid()));
create policy "staff_manage_categories" on forum_categories for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));

drop policy if exists "public_read_permissions" on forum_permissions;
drop policy if exists "staff_manage_permissions" on forum_permissions;
create policy "public_read_permissions" on forum_permissions for select using (public.is_lore_team(auth.uid()));
create policy "staff_manage_permissions" on forum_permissions for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));

drop policy if exists "staff_read_moderation_logs" on moderation_logs;
drop policy if exists "staff_insert_moderation_logs" on moderation_logs;
create policy "staff_read_moderation_logs" on moderation_logs for select using (public.is_lore_team(auth.uid()));
create policy "staff_insert_moderation_logs" on moderation_logs for insert with check (public.is_lore_team(auth.uid()));

drop policy if exists "own_or_staff_read_reports" on reports;
drop policy if exists "auth_create_reports" on reports;
drop policy if exists "staff_manage_reports" on reports;
create policy "own_or_staff_read_reports" on reports for select using (reporter_id = auth.uid() or public.is_lore_team(auth.uid()));
create policy "auth_create_reports" on reports for insert with check (auth.uid() = reporter_id);
create policy "staff_manage_reports" on reports for update using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));

drop policy if exists "staff_read_revisions" on post_revisions;
drop policy if exists "staff_insert_revisions" on post_revisions;
create policy "staff_read_revisions" on post_revisions for select using (public.is_lore_team(auth.uid()));
create policy "staff_insert_revisions" on post_revisions for insert with check (public.is_lore_team(auth.uid()) or edited_by = auth.uid());

drop policy if exists "own_thread_views" on thread_views;
drop policy if exists "own_thread_view_upsert" on thread_views;
create policy "own_thread_views" on thread_views for select using (viewer_id = auth.uid() or public.is_lore_team(auth.uid()));
create policy "own_thread_view_upsert" on thread_views for insert with check (viewer_id = auth.uid());

drop policy if exists "own_thread_subscriptions" on thread_subscriptions;
drop policy if exists "own_thread_subscriptions_write" on thread_subscriptions;
create policy "own_thread_subscriptions" on thread_subscriptions for select using (profile_id = auth.uid() or public.is_lore_team(auth.uid()));
create policy "own_thread_subscriptions_write" on thread_subscriptions for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "own_forum_read_state" on forum_read_state;
drop policy if exists "own_forum_read_state_write" on forum_read_state;
create policy "own_forum_read_state" on forum_read_state for select using (profile_id = auth.uid() or public.is_lore_team(auth.uid()));
create policy "own_forum_read_state_write" on forum_read_state for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "own_thread_read_state" on thread_read_state;
drop policy if exists "own_thread_read_state_write" on thread_read_state;
create policy "own_thread_read_state" on thread_read_state for select using (profile_id = auth.uid() or public.is_lore_team(auth.uid()));
create policy "own_thread_read_state_write" on thread_read_state for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "staff_manage_wars" on wars;
drop policy if exists "staff_manage_war_participants" on war_participants;
create policy "staff_manage_wars" on wars for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_war_participants" on war_participants for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));

notify pgrst, 'reload schema';

