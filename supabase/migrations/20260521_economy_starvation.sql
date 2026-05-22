-- Economy v3: starvation mechanics & recalculation RPC

-- Economy sector substring matcher (mirrors JS match() in economy.js)
create or replace function public.match_eco(eco_text text, resource_type text)
returns numeric
language plpgsql
immutable
as $$
declare
  v text := coalesce(lower(regexp_replace(eco_text, '[$,\d]', '', 'g')), '');
begin
  if resource_type = 'food' then
    if v like '%agriculture%' then return 2.5; end if;
    if v like '%ranching%' then return 2.0; end if;
    if v like '%fish%' then return 2.0; end if;
    if v like '%freshwater%' then return 2.0; end if;
    if v like '%maritime%' then return 1.5; end if;
    if v like '%textiles%' then return 1.5; end if;
    if v like '%healthcare%' then return 0.8; end if;
    if v like '%pharma%' then return 0.8; end if;
    if v like '%biotech%' then return 0.8; end if;
    if v like '%manufacturing%' then return 0.8; end if;
    if v like '%energy%' then return 0.6; end if;
    if v like '%oil%' then return 0.6; end if;
    if v like '%minerals%' then return 0.6; end if;
    if v like '%gems%' then return 0.6; end if;
    if v like '%heavy industry%' then return 0.6; end if;
    if v like '%surveillance%' then return 0.5; end if;
    if v like '%tourism%' then return 0.5; end if;
    if v like '%innovation%' then return 0.4; end if;
    if v like '%tech%' then return 0.4; end if;
    if v like '%robotics%' then return 0.4; end if;
    if v like '%ai%' then return 0.4; end if;
    if v like '%cybernetics%' then return 0.4; end if;
    if v like '%cloning%' then return 0.3; end if;
    if v like '%space%' then return 0.4; end if;
    if v like '%finance%' then return 0.3; end if;
    if v like '%shadow banking%' then return 0.3; end if;
    if v like '%casinos%' then return 0.3; end if;
    if v like '%crypto%' then return 0.3; end if;
    if v like '%bank%' then return 0.3; end if;
    if v like '%tax haven%' then return 0.3; end if;
    if v like '%piracy%' then return 0.4; end if;
    if v like '%black market%' then return 0.3; end if;
    if v like '%church tax%' then return 0.8; end if;
    if v like '%guilds%' then return 0.7; end if;
    if v like '%monopolies%' then return 0.5; end if;
    if v like '%ritual%' then return 0.5; end if;
    if v like '%magic%' then return 0.5; end if;
    if v like '%shamanic%' then return 0.5; end if;
    return 1.0;
  end if;
  if resource_type = 'min' then
    if v like '%minerals%' then return 2.5; end if;
    if v like '%gems%' then return 2.5; end if;
    if v like '%oil%' then return 2.5; end if;
    if v like '%mining%' then return 2.5; end if;
    if v like '%heavy industry%' then return 1.5; end if;
    if v like '%manufacturing%' then return 1.5; end if;
    if v like '%maritime%' then return 1.5; end if;
    if v like '%surveillance%' then return 0.5; end if;
    if v like '%cloning%' then return 1.0; end if;
    if v like '%monopolies%' then return 1.2; end if;
    if v like '%guilds%' then return 0.8; end if;
    if v like '%space%' then return 0.8; end if;
    if v like '%energy%' then return 0.8; end if;
    if v like '%textiles%' then return 1.0; end if;
    if v like '%tech%' then return 0.3; end if;
    if v like '%innovation%' then return 0.3; end if;
    if v like '%robotics%' then return 0.3; end if;
    if v like '%ai%' then return 0.3; end if;
    if v like '%cybernetics%' then return 0.3; end if;
    if v like '%biotech%' then return 0.3; end if;
    if v like '%pharma%' then return 0.3; end if;
    if v like '%finance%' then return 0.2; end if;
    if v like '%shadow banking%' then return 0.2; end if;
    if v like '%casinos%' then return 0.2; end if;
    if v like '%bank%' then return 0.2; end if;
    if v like '%crypto%' then return 0.2; end if;
    if v like '%tax haven%' then return 0.2; end if;
    if v like '%piracy%' then return 0.5; end if;
    if v like '%black market%' then return 0.5; end if;
    if v like '%church tax%' then return 0.3; end if;
    if v like '%tourism%' then return 0.3; end if;
    if v like '%healthcare%' then return 0.3; end if;
    if v like '%magic%' then return 0.3; end if;
    if v like '%shamanic%' then return 0.3; end if;
    if v like '%ritual%' then return 0.3; end if;
    if v like '%agriculture%' then return 0.8; end if;
    if v like '%ranching%' then return 0.8; end if;
    if v like '%fish%' then return 0.8; end if;
    if v like '%freshwater%' then return 0.5; end if;
    return 1.0;
  end if;
  if resource_type = 'ene' then
    if v like '%energy%' then return 2.5; end if;
    if v like '%oil%' then return 2.5; end if;
    if v like '%manufacturing%' then return 2.0; end if;
    if v like '%heavy industry%' then return 2.0; end if;
    if v like '%tech%' then return 1.5; end if;
    if v like '%innovation%' then return 1.5; end if;
    if v like '%robotics%' then return 1.5; end if;
    if v like '%ai%' then return 1.5; end if;
    if v like '%cybernetics%' then return 1.5; end if;
    if v like '%biotech%' then return 1.5; end if;
    if v like '%cloning%' then return 1.5; end if;
    if v like '%maritime%' then return 1.5; end if;
    if v like '%space%' then return 2.0; end if;
    if v like '%monopolies%' then return 1.5; end if;
    if v like '%gems%' then return 1.2; end if;
    if v like '%minerals%' then return 1.2; end if;
    if v like '%textiles%' then return 1.0; end if;
    if v like '%healthcare%' then return 1.0; end if;
    if v like '%pharma%' then return 1.0; end if;
    if v like '%surveillance%' then return 1.2; end if;
    if v like '%magic%' then return 1.0; end if;
    if v like '%ritual%' then return 0.8; end if;
    if v like '%shamanic%' then return 0.8; end if;
    if v like '%agriculture%' then return 0.8; end if;
    if v like '%ranching%' then return 0.8; end if;
    if v like '%fish%' then return 0.8; end if;
    if v like '%freshwater%' then return 0.8; end if;
    if v like '%finance%' then return 0.5; end if;
    if v like '%shadow banking%' then return 0.5; end if;
    if v like '%casinos%' then return 0.5; end if;
    if v like '%bank%' then return 0.5; end if;
    if v like '%crypto%' then return 0.5; end if;
    if v like '%tax haven%' then return 0.5; end if;
    if v like '%piracy%' then return 0.7; end if;
    if v like '%black market%' then return 0.7; end if;
    if v like '%church tax%' then return 0.5; end if;
    if v like '%guilds%' then return 0.8; end if;
    if v like '%tourism%' then return 0.6; end if;
    return 1.0;
  end if;
  if resource_type = 'tech' then
    if v like '%tech%' then return 3.0; end if;
    if v like '%innovation%' then return 3.0; end if;
    if v like '%ai%' then return 3.0; end if;
    if v like '%robotics%' then return 3.0; end if;
    if v like '%cybernetics%' then return 3.0; end if;
    if v like '%biotech%' then return 3.0; end if;
    if v like '%cloning%' then return 3.0; end if;
    if v like '%space%' then return 2.5; end if;
    if v like '%surveillance%' then return 2.5; end if;
    if v like '%finance%' then return 2.0; end if;
    if v like '%shadow banking%' then return 2.0; end if;
    if v like '%casinos%' then return 2.0; end if;
    if v like '%bank%' then return 2.0; end if;
    if v like '%crypto%' then return 2.0; end if;
    if v like '%manufacturing%' then return 1.5; end if;
    if v like '%heavy industry%' then return 1.5; end if;
    if v like '%pharma%' then return 1.5; end if;
    if v like '%healthcare%' then return 1.5; end if;
    if v like '%monopolies%' then return 1.0; end if;
    if v like '%guilds%' then return 1.0; end if;
    if v like '%maritime%' then return 0.8; end if;
    if v like '%energy%' then return 0.8; end if;
    if v like '%piracy%' then return 0.6; end if;
    if v like '%black market%' then return 0.8; end if;
    if v like '%magic%' then return 0.5; end if;
    if v like '%shamanic%' then return 0.3; end if;
    if v like '%ritual%' then return 0.3; end if;
    if v like '%agriculture%' then return 0.5; end if;
    if v like '%ranching%' then return 0.5; end if;
    if v like '%fish%' then return 0.5; end if;
    if v like '%minerals%' then return 0.5; end if;
    if v like '%gems%' then return 0.5; end if;
    if v like '%oil%' then return 0.5; end if;
    if v like '%textiles%' then return 0.5; end if;
    if v like '%tourism%' then return 0.5; end if;
    if v like '%tax haven%' then return 0.5; end if;
    if v like '%church tax%' then return 0.3; end if;
    if v like '%freshwater%' then return 0.3; end if;
    return 1.0;
  end if;
  return 1.0;
end;
$$;

-- Recalculate resources for all nations using v3 formula
-- Mirrors calcNationResources() in economy.js
create or replace function public.recalculate_nation_resources()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  pop_f numeric;
  gdp_f numeric;
  land_f numeric;
  rank_f numeric;
  hdi_f numeric;
  gov_mult numeric;
  eco_food numeric;
  eco_min  numeric;
  eco_ene  numeric;
  eco_tech numeric;
  scale constant numeric := 900000;
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
      pop_f  := least(greatest(sqrt(coalesce(rec.population, 1)::numeric / 1e9), 0), 1);
      gdp_f  := least(greatest(sqrt(coalesce(rec.gdp_usd, rec.population * 500)::numeric / 1e13), 0), 1);
      land_f := least(greatest(sqrt(coalesce(rec.land_km2, 1)::numeric / 1e7), 0), 1);
      rank_f := coalesce(rec.army_rank, 0)::numeric / 11.0;
      hdi_f  := coalesce(rec.hdi, 0.5)::numeric;

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

      eco_food := public.match_eco(rec.economy, 'food');
      eco_min  := public.match_eco(rec.economy, 'min');
      eco_ene  := public.match_eco(rec.economy, 'ene');
      eco_tech := public.match_eco(rec.economy, 'tech');

      v_man := least(greatest(round(pop_f * (
        0.50 * gov_mult +
        0.25 * rank_f +
        0.25 * (1 - hdi_f)
      ) * scale)::int, 0), 999999);

      v_food := least(greatest(round((
        0.45 * land_f * eco_food +
        0.20 * hdi_f +
        0.20 * gdp_f +
        0.15 * eco_food -
        0.10 * pop_f
      ) * scale)::int, 0), 999999);

      v_min := least(greatest(round((
        0.40 * land_f * eco_min +
        0.30 * gdp_f +
        0.20 * eco_min +
        0.10 * pop_f
      ) * scale)::int, 0), 999999);

      v_ene := least(greatest(round((
        0.35 * pop_f * eco_ene +
        0.30 * gdp_f +
        0.20 * eco_ene +
        0.15 * land_f
      ) * scale)::int, 0), 999999);

      v_tech := least(greatest(round((
        0.35 * hdi_f * eco_tech +
        0.25 * gdp_f +
        0.20 * eco_tech +
        0.20 * pop_f
      ) * scale)::int, 0), 999999);

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
