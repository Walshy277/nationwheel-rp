import { supabase } from "./supabase";

const GOV_MULT = {
  "military dictatorship":2.0, "junta":2.0, "naval junta":2.0,
  "stratocracy":2.0, "colony - military govt":1.8,
  "fascist empire":1.5, "expansionist republic":1.5,
  "empire":1.2, "absolute monarchy":1.2, "monarchy":1.2,
  "traditional kingdom":1.2,
  "ritualistic kingdom":1.2, "magical empire":1.2, "clan empire":1.2,
  "constitutional monarchy":1.0, "republic":1.0, "democratic republic":1.0,
  "federal republic":1.0, "socialist republic":1.0, "authoritarian republic":1.0,
  "maritime democracy":1.0, "technocracy":0.8, "corporate confederation":0.8,
  "trade empire":0.8, "robotic dominion":0.8,
  "crypto-anarchy":0.6, "anarchist commune":0.6, "pirate confederation":0.6,
  "fallen empire":0.5,
  "colony - cybernetic regency":1.3, "colony - clan council":1.2,
  "progressive union":0.9, "protectorate":0.7, "guild republic":0.8,
  "federal empire":1.2,
};

const ECO = {
  food: {"agriculture":2.5,"ranching":2.0,"fish":2.0,"freshwater":2.0,
         "maritime":1.5,"textiles":1.5,"healthcare":0.8,"pharma":0.8,
         "biotech":0.8,"manufacturing":0.8,"general":1.0,
         "energy":0.6,"oil":0.6,"minerals":0.6,"gems":0.6,"heavy industry":0.6,
         "surveillance":0.5,"tourism":0.5,"innovation":0.4,"tech":0.4,
         "robotics":0.4,"ai":0.4,"cybernetics":0.4,"cloning":0.3,
         "space":0.4,"finance":0.3,"shadow banking":0.3,"casinos":0.3,
         "crypto":0.3,"bank":0.3,"tax haven":0.3,"piracy":0.4,
         "black market":0.3,"church tax":0.8,"guilds":0.7,"monopolies":0.5,
         "ritual":0.5,"magic":0.5,"shamanic":0.5},
  min:  {"minerals":2.5,"gems":2.5,"oil":2.5,"mining":2.5,"heavy industry":1.5,
         "manufacturing":1.5,"maritime":1.5,"general":1.0,
         "surveillance":0.5,"cloning":1.0,"monopolies":1.2,"guilds":0.8,
         "space":0.8,"energy":0.8,"textiles":1.0,
         "tech":0.3,"innovation":0.3,"robotics":0.3,"ai":0.3,
         "cybernetics":0.3,"biotech":0.3,"pharma":0.3,
         "finance":0.2,"shadow banking":0.2,"casinos":0.2,"bank":0.2,
         "crypto":0.2,"tax haven":0.2,"piracy":0.5,"black market":0.5,
         "church tax":0.3,"tourism":0.3,"healthcare":0.3,"magic":0.3,"shamanic":0.3,
         "ritual":0.3,"agriculture":0.8,"ranching":0.8,"fish":0.8,"freshwater":0.5},
  ene:  {"energy":2.5,"oil":2.5,"manufacturing":2.0,"heavy industry":2.0,
         "tech":1.5,"innovation":1.5,"robotics":1.5,"ai":1.5,
         "cybernetics":1.5,"biotech":1.5,"cloning":1.5,"maritime":1.5,
         "space":2.0,"monopolies":1.5,"gems":1.2,"minerals":1.2,
         "general":1.0,"textiles":1.0,"healthcare":1.0,"pharma":1.0,
         "surveillance":1.2,"magic":1.0,"ritual":0.8,"shamanic":0.8,
         "agriculture":0.8,"ranching":0.8,"fish":0.8,"freshwater":0.8,
         "finance":0.5,"shadow banking":0.5,"casinos":0.5,"bank":0.5,
         "crypto":0.5,"tax haven":0.5,"piracy":0.7,"black market":0.7,
         "church tax":0.5,"guilds":0.8,"tourism":0.6},
  tech: {"tech":3.0,"innovation":3.0,"ai":3.0,"robotics":3.0,
         "cybernetics":3.0,"biotech":3.0,"cloning":3.0,"space":2.5,
         "surveillance":2.5,"finance":2.0,"shadow banking":2.0,
         "casinos":2.0,"bank":2.0,"crypto":2.0,
         "manufacturing":1.5,"heavy industry":1.5,"pharma":1.5,"healthcare":1.5,
         "general":1.0,"monopolies":1.0,"guilds":1.0,
         "maritime":0.8,"energy":0.8,
         "piracy":0.6,"black market":0.8,"magic":0.5,"shamanic":0.3,"ritual":0.3,
         "agriculture":0.5,"ranching":0.5,"fish":0.5,"minerals":0.5,
         "gems":0.5,"oil":0.5,"textiles":0.5,"tourism":0.5,
         "tax haven":0.5,"church tax":0.3,"freshwater":0.3},
};

function match(text, table) {
  if (!text) return 1.0;
  const t = text.toLowerCase().replace(/[$,\d]/g,"").trim();
  for (const [k,v] of Object.entries(table))
    if (t.includes(k)) return v;
  return 1.0;
}

export function calcNationResources(nation) {
  const pop = nation.population || 1;
  const gdp = nation.gdp_usd || Math.round(pop * 500);
  const land = nation.land_km2 || 1;
  const rank = nation.army_rank || 0;
  const hdi = nation.hdi != null ? nation.hdi : 0.5;
  const gov = nation.government || "";
  const eco = nation.economy || "";

  const PF = Math.sqrt(pop) / 100;
  const LF = Math.sqrt(land) / 100;
  const GF = Math.log10(gdp / 1e9 + 1);
  const hdiAdj = 1 - (hdi - 0.5) * 0.15;
  const hdiBonus = 1 + (hdi - 0.5) * 0.3;

  const manpower = Math.round(PF * 10 * match(gov, GOV_MULT) * (1 + rank * 0.08) * hdiAdj);
  const food = Math.round(Math.max(0, LF * 10 * match(eco, ECO.food) * hdiBonus + GF * 30 - PF * 1.5));
  const minerals = Math.round(Math.max(5, LF * 8 * match(eco, ECO.min) + GF * 20));
  const energy = Math.round(Math.max(5, PF * 5 * match(eco, ECO.ene) + GF * 15));
  const tech = Math.round(Math.max(1, PF * 3 * (hdi * 2) * match(eco, ECO.tech)));

  return { manpower, food, minerals, energy, tech, gdp: Math.round(gdp) };
}

export async function recalculateAllNations(nations) {
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  const results = await Promise.all(nations.map(async (nation) => {
    try {
      const res = calcNationResources(nation);
      const { error } = await supabase
        .from("nation_resources")
        .upsert({
          nation_id: nation.id,
          food: res.food,
          minerals: res.minerals,
          energy: res.energy,
          tech: res.tech,
          manpower: res.manpower,
          gdp: res.gdp,
          updated_at: new Date().toISOString(),
        }, { onConflict: "nation_id" });
      if (error) {
        console.warn("Failed to update", nation.name, error.message);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.warn("Error recalculating", nation.name, e);
      return { ok: false };
    }
  }));
  const updated = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  return { ok: true, updated, failed };
}

export async function processTradeRoutes() {
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  const { data: routes, error } = await supabase
    .from("trade_routes")
    .select("*")
    .eq("status", "active");
  if (error) return { ok: false, error: error.message };
  const results = [];
  for (const route of routes || []) {
    const fromRes = await supabase.from("nation_resources").select("*").eq("nation_id", route.from_nation_id).single();
    const toRes = await supabase.from("nation_resources").select("*").eq("nation_id", route.to_nation_id).single();
    if (fromRes.error || toRes.error) continue;
    const fromData = fromRes.data;
    const toData = toRes.data;
    const amount = Math.min(route.amount, fromData[route.resource_type] || 0);
    if (amount <= 0) continue;
    fromData[route.resource_type] = Math.max(0, fromData[route.resource_type] - amount);
    toData[route.resource_type] = (toData[route.resource_type] || 0) + amount;
    const { error: uErr } = await supabase.from("nation_resources").update({
      [route.resource_type]: fromData[route.resource_type],
      updated_at: new Date().toISOString(),
    }).eq("nation_id", route.from_nation_id);
    if (uErr) continue;
    await supabase.from("nation_resources").update({
      [route.resource_type]: toData[route.resource_type],
      updated_at: new Date().toISOString(),
    }).eq("nation_id", route.to_nation_id);
    results.push({ from: route.from_nation_id, to: route.to_nation_id, resource: route.resource_type, amount });
  }
  return { ok: true, processed: results.length, details: results };
}

export async function processAllStarvation(nations) {
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  const starving = [];
  const updates = nations
    .filter(n => n.population && n.population > 0)
    .map(async (nation) => {
      const res = calcNationResources(nation);
      if (res.food <= 0) {
        const newPop = Math.round(nation.population * 0.98);
        const newHdi = Math.max(0, Math.round(((nation.hdi || 0.5) - 0.1) * 100) / 100);
        starving.push({
          id: nation.id, name: nation.name, oldPop: nation.population, newPop,
          popLost: nation.population - newPop, oldHdi: nation.hdi || 0.5, newHdi,
        });
        const { error } = await supabase.from("nations")
          .update({ population: newPop, hdi: newHdi }).eq("id", nation.id);
        if (error) console.warn("Failed to update starvation for", nation.name, error.message);
      }
    });
  await Promise.all(updates);
  if (starving.length > 0) {
    const { data: freshNations } = await supabase.from("nations").select("*");
    const result = await recalculateAllNations(freshNations || nations);
    return { ok: true, starving, recalculated: result };
  }
  return { ok: true, starving: [], recalculated: null };
}
