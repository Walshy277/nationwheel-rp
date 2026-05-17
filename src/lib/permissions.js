export const STAFF_ROLES = ["moderator", "mod", "lore", "lore_team", "admin", "owner"];
export const LEADER_ROLES = ["leader", ...STAFF_ROLES];
export const ROLE_LABELS = {
  guest: "Guest",
  player: "Player",
  leader: "Nation Leader",
  verified: "Verified Player",
  moderator: "Moderator",
  mod: "Moderator",
  lore: "Lore Team",
  lore_team: "Lore Team",
  admin: "Admin",
  owner: "Owner",
};

export const roleKey = profileOrRole =>
  String(typeof profileOrRole === "string" ? profileOrRole : profileOrRole?.role || "guest")
    .toLowerCase()
    .trim();

export const isAdminRole = profileOrRole => ["admin", "owner"].includes(roleKey(profileOrRole));

export const canAccessStaff = profileOrRole => STAFF_ROLES.includes(roleKey(profileOrRole));

export const canManageRoles = profileOrRole => isAdminRole(profileOrRole);

export const canManageWars = profileOrRole =>
  ["lore", "lore_team", "moderator", "mod", "admin", "owner"].includes(roleKey(profileOrRole));

export const canModerateBoard = profileOrRole => canAccessStaff(profileOrRole);

