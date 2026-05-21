import { describe, it, expect } from "vitest";
import { isAdmin, isLoreTeam, isStaff, canManageRoles, getPrimaryRole } from "./permissions";

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

  it("getPrimaryRole returns highest priority role", () => {
    expect(getPrimaryRole({ roles: ["admin", "nation_leader"] })).toBe("admin");
    expect(getPrimaryRole({ roles: ["nation_leader", "alliance_leader"] })).toBe("nation_leader");
    expect(getPrimaryRole({ roles: ["user", "lore_team"] })).toBe("lore_team");
    expect(getPrimaryRole({ roles: ["user"] })).toBe("user");
    expect(getPrimaryRole(null)).toBe("guest");
    expect(getPrimaryRole({})).toBe("guest");
  });
});
