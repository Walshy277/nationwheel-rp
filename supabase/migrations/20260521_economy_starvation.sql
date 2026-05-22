-- Economy v3: starvation mechanics & recalculation RPC

-- Recalculate resources for all nations using v3 formula
-- This is a simplified SQL fallback; the primary recalculation runs from JS.
create or replace function public.recalculate_nation_resources()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  pf numeric;
  lf numeric;
  gf numeric;
  hdi_adj numeric;
  hdi_bonus numeric;
  gov_mult numeric;
  v_man integer;
  v_food integer;
  v_min integer;
  v_ene integer;
  v_tech integer;
  v_gdp bigint;
  updated int := 0;
  failed int := 0;
begin
  if not public.is_lore_team(auth.uid()) then
    raise exception 'Only lore team can recalculate resources';
  end if;

  for rec in select * from nations loop
    begin
      pf := sqrt(greatest(coalesce(rec.population, 1)::numeric, 1)) / 100.0;
      lf := sqrt(greatest(coalesce(rec.land_km2, 1)::numeric, 1)) / 100.0;
      gf := log10(greatest(coalesce(rec.gdp_usd, rec.population * 500)::numeric, 1) / 1e9 + 1);
      hdi_adj := 1.0 - (coalesce(rec.hdi, 0.5) - 0.5) * 0.15;
      hdi_bonus := 1.0 + (coalesce(rec.hdi, 0.5) - 0.5) * 0.3;

      gov_mult := case lower(rec.government)
        when 'military dictatorship' then 2.0 when 'junta' then 2.0
        when 'naval junta' then 2.0 when 'stratocracy' then 2.0
        when 'colony - military govt' then 1.8
        when 'fascist empire' then 1.5 when 'expansionist republic' then 1.5
        when 'empire' then 1.2 when 'absolute monarchy' then 1.2
        when 'monarchy' then 1.2 when 'traditional kingdom' then 1.2
        when 'ritualistic kingdom' then 1.2 when 'magical empire' then 1.2
        when 'clan empire' then 1.2 when 'constitutional monarchy' then 1.0
        when 'republic' then 1.0 when 'democratic republic' then 1.0
        when 'federal republic' then 1.0 when 'socialist republic' then 1.0
        when 'authoritarian republic' then 1.0 when 'maritime democracy' then 1.0
        when 'technocracy' then 0.8 when 'corporate confederation' then 0.8
        when 'trade empire' then 0.8 when 'robotic dominion' then 0.8
        when 'crypto-anarchy' then 0.6 when 'anarchist commune' then 0.6
        when 'pirate confederation' then 0.6 when 'fallen empire' then 0.5
        when 'colony - cybernetic regency' then 1.3
        when 'colony - clan council' then 1.2
        when 'progressive union' then 0.9 when 'protectorate' then 0.7
        when 'guild republic' then 0.8 when 'federal empire' then 1.2
        else 1.0
      end;

      v_man := round(pf * 10 * gov_mult * (1 + coalesce(rec.army_rank, 0) * 0.08) * hdi_adj)::int;
      v_food := greatest(0, round(lf * 10 * 1.0 * hdi_bonus + gf * 30 - pf * 1.5))::int;
      v_min := greatest(5, round(lf * 8 * 1.0 + gf * 20))::int;
      v_ene := greatest(5, round(pf * 5 * 1.0 + gf * 15))::int;
      v_tech := greatest(1, round(pf * 3 * (coalesce(rec.hdi, 0.5) * 2) * 1.0))::int;
      v_gdp := greatest(0, round(coalesce(rec.gdp_usd, 0)))::bigint;

      insert into nation_resources (nation_id, food, minerals, energy, tech, manpower, gdp, updated_at)
      values (rec.id, v_food, v_min, v_ene, v_tech, v_man, v_gdp, now())
      on conflict (nation_id)
      do update set
        food = excluded.food,
        minerals = excluded.minerals,
        energy = excluded.energy,
        tech = excluded.tech,
        manpower = excluded.manpower,
        gdp = excluded.gdp,
        updated_at = now();

      updated := updated + 1;
    exception when others then
      failed := failed + 1;
    end;
  end loop;

  return json_build_object('updated', updated, 'failed', failed);
end;
$$;

-- Process starvation: reduce pop (-2%) and HDI (-0.1) for nations with food ≤ 0
create or replace function public.process_starvation()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  if not public.is_lore_team(auth.uid()) then
    raise exception 'Only lore team can process starvation';
  end if;

  update nations n
  set
    population = greatest(1, round(n.population * 0.98)),
    hdi = greatest(0, round((coalesce(n.hdi::numeric, 0.5) - 0.1)::numeric, 2))
  where n.id in (
    select nr.nation_id from nation_resources nr
    where nr.food <= 0
  );

  get diagnostics affected = rowcount;

  -- Recalculate resources after population/HDI changes
  if affected > 0 then
    perform public.recalculate_nation_resources();
  end if;

  return json_build_object('starving', affected);
end;
$$;

-- NOTE: advance_game_day is kept as-is in supabase-notifications-setup.sql
-- (calendar only, no starvation). Starvation is triggered manually by
-- lore team via the admin panel "Process Starvation Day" button.
