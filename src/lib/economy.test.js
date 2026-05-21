import { describe, it, expect } from "vitest";
import { calcNationResources } from "./economy";

describe("calcNationResources", () => {
  it("returns resource values for a basic nation", () => {
    const nation = {
      population: 1000000,
      gdp_usd: 500000000000,
      land_km2: 500000,
      army_rank: 5,
      hdi: 0.8,
      government: "republic",
      economy: "manufacturing",
    };
    const res = calcNationResources(nation);
    expect(res).toHaveProperty("manpower");
    expect(res).toHaveProperty("food");
    expect(res).toHaveProperty("minerals");
    expect(res).toHaveProperty("energy");
    expect(res).toHaveProperty("tech");
    expect(res).toHaveProperty("gdp");
    expect(res.manpower).toBeGreaterThan(0);
    expect(res.food).toBeGreaterThan(0);
  });

  it("handles minimum values", () => {
    const nation = { population: 1, gdp_usd: 100, land_km2: 1 };
    const res = calcNationResources(nation);
    expect(res.manpower).toBeGreaterThanOrEqual(0);
    expect(res.tech).toBeGreaterThanOrEqual(1);
  });

  it("applies government multiplier for military dictatorship", () => {
    const military = calcNationResources({ population: 100000, gdp_usd: 1e9, land_km2: 10000, government: "military dictatorship", economy: "general" });
    const republic = calcNationResources({ population: 100000, gdp_usd: 1e9, land_km2: 10000, government: "republic", economy: "general" });
    expect(military.manpower).toBeGreaterThan(republic.manpower);
  });

  it("applies economy multiplier for agriculture", () => {
    const agri = calcNationResources({ population: 100000, gdp_usd: 1e9, land_km2: 10000, economy: "agriculture" });
    const tech = calcNationResources({ population: 100000, gdp_usd: 1e9, land_km2: 10000, economy: "tech" });
    expect(agri.food).toBeGreaterThan(tech.food);
  });
});
