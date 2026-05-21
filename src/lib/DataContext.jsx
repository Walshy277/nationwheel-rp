import { createContext, useContext, useState, useCallback } from "react";
import { supabase, SUPABASE_CONFIGURED } from "./supabase";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState({ nations:[], profiles:[], news:[], posts:[], actions:[], wars:[], warParticipants:[], alliances:[], allianceMembers:[], boards:[], threads:[], forumPosts:[], forumReactions:[], events:[] });
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }
    const issues = [];
    const run = async (label, query, fallback) => {
      const result = await query;
      if (!result.error) return result.data || [];
      issues.push(`${label}: ${result.error.message}`);
      if (!fallback) return [];
      const retry = await fallback(result.error);
      if (retry.error) {
        issues.push(`${label} fallback: ${retry.error.message}`);
        return [];
      }
      return retry.data || [];
    };
    const [nations, profiles, news, posts, actions, wars, warParticipants, alliances, allianceMembers, boards, events] = await Promise.all([
      run("Nations", supabase.from("nations").select("*, owner:owner_id(username)").order("name"),
        () => supabase.from("nations").select("*").order("name")),
      supabase.from("profiles").select("id,username,roles,nation_id,avatar_url,signature_url,bio,status,suspended_until,ban_reason,last_active_at,created_at").order("username").limit(1000),
      supabase.from("news").select("*").order("pinned",{ascending:false}).order("created_at",{ascending:false}).limit(25),
      supabase.from("rp_posts").select("*, nations(name,flag_url), target_nation_id").order("created_at",{ascending:false}).limit(100),
      supabase.from("canon_actions").select("*, nations(name,flag_url), action_updates(*, profiles(username))").order("created_at",{ascending:false}).limit(50),
      supabase.from("wars").select("*, aggressor:aggressor_id(name,flag_url), defender:defender_id(name,flag_url)").order("started_at",{ascending:false}).limit(50),
      run("War participants", supabase.from("war_participants").select("*").order("created_at").limit(500),
        error => /could not find|does not exist|schema cache/i.test(error.message || "") ? Promise.resolve({ data:[], error:null }) : Promise.resolve({ data:null, error })),
      supabase.from("alliances").select("*").order("created_at",{ascending:false}).limit(100),
      supabase.from("alliance_members").select("*").limit(1000),
      run("Forum boards", supabase.from("forum_board_summaries").select("*").order("sort_order"),
        () => supabase.from("forum_boards").select("*").order("sort_order")),
      supabase.from("global_events").select("*").order("created_at",{ascending:false}).limit(50),
    ]);
    const unwrap = result => Array.isArray(result) ? result : (result.data || []);
    const plainWars = unwrap(wars);
    const plainWarParticipants = warParticipants;
    const warsWithParticipants = plainWars.map(w => ({ ...w, war_participants: plainWarParticipants.filter(p => p.war_id === w.id) }));
    setData({ nations, profiles:unwrap(profiles), news:unwrap(news), posts:unwrap(posts), actions:unwrap(actions), wars:warsWithParticipants, warParticipants:plainWarParticipants, alliances:unwrap(alliances), allianceMembers:unwrap(allianceMembers), boards:unwrap(boards), threads:[], forumPosts:[], forumReactions:[], events:unwrap(events) });
    setLoading(false);
  }, []);

  return (
    <DataContext.Provider value={{ data, loading, setupRequired, setSetupRequired, fetchAll }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
