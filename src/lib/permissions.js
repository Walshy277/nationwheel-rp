export const ROLE_ADMIN = "admin";
export const ROLE_LORE_TEAM = "lore_team";
export const ROLE_NATION_LEADER = "nation_leader";
export const ROLE_ALLIANCE_LEADER = "alliance_leader";
export const ROLE_USER = "user";
export const ROLE_GUEST = "guest";

export const ROLE_LABELS = {
  admin: "Admin",
  lore_team: "Lore Team",
  nation_leader: "Nation Leader",
  alliance_leader: "Alliance Leader",
  user: "User",
  guest: "Guest",
};

export const ROLE_COLORS = {
  admin: "#e74c3c",
  lore_team: "#3498db",
  nation_leader: "#d4af37",
  alliance_leader: "#2ecc71",
  user: "#8fa0bd",
  guest: "#6f85a8",
};

export const getRoles = profile =>
  (profile && Array.isArray(profile.roles) ? profile.roles : []);

export const hasRole = (profile, role) =>
  getRoles(profile).includes(role);

const ROLE_PRIORITY = ["admin", "lore_team", "nation_leader", "alliance_leader", "user", "guest"];

export const getPrimaryRole = profile => {
  const roles = getRoles(profile);
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return r;
  }
  return "guest";
};

export const isAdmin = profile =>
  hasRole(profile, ROLE_ADMIN);

export const isLoreTeam = profile =>
  hasRole(profile, ROLE_LORE_TEAM) || isAdmin(profile);

export const isNationLeader = profile =>
  hasRole(profile, ROLE_NATION_LEADER);

export const isAllianceLeader = profile =>
  hasRole(profile, ROLE_ALLIANCE_LEADER);

export const isStaff = profile =>
  isLoreTeam(profile);

export const canManageRoles = profile =>
  isAdmin(profile);

export const roleKey = profileOrRole => {
  if (!profileOrRole) return ROLE_GUEST;
  if (typeof profileOrRole === "string") return profileOrRole.toLowerCase().trim();
  const roles = getRoles(profileOrRole);
  if (roles.includes(ROLE_ADMIN)) return ROLE_ADMIN;
  if (roles.includes(ROLE_LORE_TEAM)) return ROLE_LORE_TEAM;
  if (roles.includes(ROLE_NATION_LEADER)) return ROLE_NATION_LEADER;
  if (roles.includes(ROLE_ALLIANCE_LEADER)) return ROLE_ALLIANCE_LEADER;
  if (roles.includes(ROLE_USER)) return ROLE_USER;
  return ROLE_GUEST;
};

export const canAccessStaff = profile =>
  isLoreTeam(profile);

export const canManageWars = profile =>
  isLoreTeam(profile) || isNationLeader(profile);

export const canModerateBoard = profile =>
  isLoreTeam(profile);

export const canEditNationStats = profile =>
  isLoreTeam(profile);

export const isOwnerOfNation = (profile, nationId) =>
  Boolean(profile?.nation_id === nationId && isNationLeader(profile));

export const canEditNationProfile = (profile, nationId) =>
  isOwnerOfNation(profile, nationId) || isLoreTeam(profile);
