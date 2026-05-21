import { supabase } from "./supabase";
import { PAGE_PATHS } from "./constants";

export const timeAgo = ts => {
  if (!ts) return "";
  const d = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
};
export const fmtGDP = n => { if (!n) return "-"; if (n>=1e12) return `$${(n/1e12).toFixed(1)}T`; if (n>=1e9) return `$${(n/1e9).toFixed(1)}B`; if (n>=1e6) return `$${(n/1e6).toFixed(0)}M`; return `$${n}`; };
export const fmtPop = n => { if (!n) return "-"; if (n>=1e9) return `${(n/1e9).toFixed(2)}B`; if (n>=1e6) return `${(n/1e6).toFixed(0)}M`; if (n>=1e3) return `${(n/1e3).toFixed(0)}K`; return `${n}`; };
export const fmtLand = n => n ? `${Number(n).toLocaleString()} km2` : "-";
export const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export const fmtDate = ts => ts ? new Date(ts).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "";

export const profileName = (user, preferred) => {
  const base = (preferred || user?.email?.split("@")[0] || "player")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return base || `player_${user?.id?.slice(0, 6) || Date.now()}`;
};

export const ensureProfile = async (user, preferredUsername) => {
  if (!user || !supabase) return null;
  const existing = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (existing.data) return existing.data;
  if (existing.error && existing.error.code !== "PGRST116") throw existing.error;
  const username = profileName(user, preferredUsername);
  const inserted = await supabase.from("profiles").insert({ id:user.id, username }).select("*").single();
  if (inserted.error && inserted.error.code === "23505") {
    const fallback = `${username}_${user.id.slice(0, 6)}`.slice(0, 28);
    const retry = await supabase.from("profiles").insert({ id:user.id, username:fallback }).select("*").single();
    if (retry.error) throw retry.error;
    return retry.data;
  }
  if (inserted.error) throw inserted.error;
  return inserted.data;
};

export const isMissingOptionalProfileSchema = error =>
  error?.code === "42703" ||
  /profiles(_\d+)?\.(bio|avatar_url|signature_url)|column .*profiles.* does not exist|schema cache/i.test(error?.message || "");
export const isMissingProfileMediaBucket = error =>
  /bucket not found|not found/i.test(error?.message || "");

export const isProfileActive = profile => {
  if (!profile?.last_active_at) return false;
  return Date.now() - new Date(profile.last_active_at).getTime() < 1000 * 60 * 60 * 24 * 7;
};
export const isProfileBlocked = profile =>
  profile?.status === "banned" ||
  (profile?.status === "suspended" && (!profile.suspended_until || new Date(profile.suspended_until) > new Date()));

export const mergeThreadPostPages = (current, nextRows) => {
  const seen = new Set();
  return [...current, ...nextRows].filter(post => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
};

export const parseRoute = () => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const [, section, sub, id] = path.split("/");
  if (section === "forums" && sub === "board" && id) {
    return { page: "forums", forumRoute: { type: "board", boardSlug: decodeURIComponent(id) } };
  }
  if (section === "forums" && sub === "thread" && id) {
    return { page: "forums", forumRoute: { type: "thread", threadId: decodeURIComponent(id) } };
  }
  if (section === "profile" && sub) {
    return { page: "profile", profileId: decodeURIComponent(sub), forumRoute: { type: "boards" } };
  }
  if (section === "nation" && sub) {
    return { page: "nation", nationId: decodeURIComponent(sub), forumRoute: { type: "boards" } };
  }
  const page = Object.entries(PAGE_PATHS).find(([, pagePath]) => pagePath === path)?.[0] || "forums";
  return { page, forumRoute: { type: "boards" } };
};

export const writeRoute = (path) => {
  if (window.location.pathname + window.location.hash !== path) {
    window.history.pushState({}, "", path);
  }
};

export const inp = { background:"rgba(255,255,255,0.055)", border:"1px solid rgba(21,96,181,0.42)", borderRadius:6, padding:"11px 13px", color:"#f5f8ff", fontSize:16, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };
export const ta  = { ...inp, resize:"vertical", minHeight:80 };
export const mkBtn = (v="gold") => ({
  background: v==="gold"?"#f6c132": v==="red"?"#b91616": v==="blue"?"#145bb0": v==="green"?"#1f8f43":"rgba(255,255,255,0.055)",
  color: v==="gold"?"#050505":"#f5f8ff",
  border: v==="ghost"?"1px solid rgba(246,193,50,0.24)":"none",
  borderRadius:6, padding:"9px 14px", cursor:"pointer", fontWeight:700, fontSize:13,
  letterSpacing:"0.04em", fontFamily:"inherit", transition:"opacity 0.15s, transform 0.1s",
  whiteSpace:"nowrap",
});
export const card = { background:"linear-gradient(180deg,rgba(10,16,27,0.97),rgba(3,7,13,0.96))", border:"1px solid rgba(78,128,190,0.24)", borderRadius:8, padding:"1.25rem", boxShadow:"0 18px 45px rgba(0,0,0,0.35)" };

// Re-export constants for convenience
export { ACTION_SIZES, STATUS_COL, WAR_COL, POST_TYPES, POST_COLS, NEWS_CATS, NEWS_COL, PAGE_PATHS, FORUM_PAGE_SIZE, LOGO_SRC, TURNSTILE_SITE_KEY, CHANGELOG_ENTRIES, REACT_EMOJIS, fmtGameDate } from "./constants";
export { ROLE_LABELS, canManageWars, isAdmin, isLoreTeam, isNationLeader, isAllianceLeader, canEditNationStats, canEditNationProfile, isOwnerOfNation, hasRole, getRoles, getPrimaryRole, ROLE_ADMIN, ROLE_LORE_TEAM, ROLE_NATION_LEADER, ROLE_ALLIANCE_LEADER, ROLE_USER, ROLE_GUEST, ROLE_COLORS } from "./permissions";
