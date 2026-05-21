import { describe, it, expect } from "vitest";
import { isAdmin, isLoreTeam, isStaff, canManageRoles } from "./permissions";

describe("permissions", () => {
  it("isAdmin returns true for admin role", () => {
    expect(isAdmin({ roles: ["admin"] })).toBe(true);
  });

  it("isAdmin returns false for non-admin", () => {
    expect(isAdmin({ roles: ["user"] })).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin({})).toBe(false);
  });

  it("isLoreTeam returns true for admin or lore_team", () => {
    expect(isLoreTeam({ roles: ["admin"] })).toBe(true);
    expect(isLoreTeam({ roles: ["lore_team"] })).toBe(true);
    expect(isLoreTeam({ roles: ["user"] })).toBe(false);
  });

  it("isStaff matches isLoreTeam (admin or lore_team)", () => {
    expect(isStaff({ roles: ["admin"] })).toBe(true);
    expect(isStaff({ roles: ["lore_team"] })).toBe(true);
    expect(isStaff({ roles: ["user"] })).toBe(false);
    expect(isStaff(null)).toBe(false);
  });

  it("canManageRoles checks admin", () => {
    expect(canManageRoles({ roles: ["admin"] })).toBe(true);
    expect(canManageRoles({ roles: ["user"] })).toBe(false);
  });
});
