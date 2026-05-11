create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and role = 'admin');
$$;

drop policy if exists "admin_manage_profiles" on profiles;
drop policy if exists "admin_manage_nations" on nations;
drop policy if exists "admin_manage_news" on news;
drop policy if exists "admin_manage_forum_boards" on forum_boards;

create policy "admin_manage_profiles"
on profiles for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_manage_nations"
on nations for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_manage_news"
on news for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "admin_manage_forum_boards"
on forum_boards for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

insert into profiles (id, username, role)
select u.id, split_part(u.email, '@', 1), 'admin'
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id)
order by u.created_at
limit 1
on conflict (id) do update set role = 'admin';

update profiles
set role = 'admin'
where id = (
  select id from profiles order by created_at nulls last, username limit 1
);
