create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and roles && array['admin']);
$$;

create or replace function public.is_lore_team(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and roles && array['admin','lore_team']);
$$;

create or replace function public.assign_nation_as_staff(target_profile uuid, target_nation uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_lore_team(auth.uid()) then
    raise exception 'Only staff can assign nations';
  end if;

  update public.nations set owner_id = target_profile where id = target_nation;
  update public.profiles set nation_id = target_nation,
    roles = case
      when not (roles @> array['nation_leader']) then roles || array['nation_leader']
      else roles
    end
  where id = target_profile;
end;
$$;

create or replace function public.log_moderation_action(
  target_type text,
  target_id uuid,
  action text,
  reason text default null,
  metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  log_id uuid;
begin
  if not public.is_lore_team(auth.uid()) then
    raise exception 'Only staff can create moderation logs';
  end if;

  insert into public.moderation_logs (moderator_id, target_type, target_id, action, reason, metadata)
  values (auth.uid(), target_type, target_id, action, reason, metadata)
  returning id into log_id;

  return log_id;
end;
$$;
