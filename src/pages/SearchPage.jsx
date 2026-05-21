import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, timeAgo, getPrimaryRole, ROLE_COLORS } from "../lib/uiUtils";

const SEARCH_LABELS = {
  nation: "Nations", dispatch: "Dispatches", news: "News",
  profile: "Profiles", alliance: "Alliances",
  forum_thread: "Forum Threads", event: "Global Events",
};

const SEARCH_ICONS = {
  nation: "🏛️", dispatch: "📜", news: "📰",
  profile: "👤", alliance: "🤝", forum_thread: "💬", event: "🌍",
};

export const SearchPage = ({ navigate }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async () => {
    const term = query.trim();
    if (!term) return;
    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase.rpc("search_all", { search_query: term });
      if (error) throw error;
      const grouped = {};
      for (const r of data || []) {
        if (!grouped[r.result_type]) grouped[r.result_type] = [];
        grouped[r.result_type].push(r);
      }
      setResults(grouped);
    } catch {
      const [nations, dispatches, news, profiles, alliances, threads, events] = await Promise.all([
        supabase.from("nations").select("id,name,slug,government").ilike("name", `%${term}%`).limit(5),
        supabase.from("rp_posts").select("id,title,post_type").ilike("title", `%${term}%`).limit(5),
        supabase.from("news").select("id,title,category").ilike("title", `%${term}%`).limit(5),
        supabase.from("profiles").select("id,username").ilike("username", `%${term}%`).limit(5),
        supabase.from("alliances").select("id,name,type").ilike("name", `%${term}%`).limit(5),
        supabase.from("forum_threads").select("id,title,board:board_id(name)").ilike("title", `%${term}%`).is("is_deleted", false).limit(5),
        supabase.from("global_events").select("id,title,category").ilike("title", `%${term}%`).limit(5),
      ]);
      const g = {};
      if (nations.data?.length) g.nation = nations.data.map(n => ({ result_type:"nation", result_id:n.id, title:n.name, subtitle:n.government, result_link:`/nation/${n.id}` }));
      if (dispatches.data?.length) g.dispatch = dispatches.data.map(d => ({ result_type:"dispatch", result_id:d.id, title:d.title, subtitle:d.post_type, result_link:"/dispatches" }));
      if (news.data?.length) g.news = news.data.map(n => ({ result_type:"news", result_id:n.id, title:n.title, subtitle:n.category, result_link:"/news" }));
      if (profiles.data?.length) g.profile = profiles.data.map(p => ({ result_type:"profile", result_id:p.id, title:p.username, subtitle:null, result_link:`/profile/${p.id}` }));
      if (alliances.data?.length) g.alliance = alliances.data.map(a => ({ result_type:"alliance", result_id:a.id, title:a.name, subtitle:a.type, result_link:"/alliances" }));
      if (threads.data?.length) g.forum_thread = threads.data.map(t => ({ result_type:"forum_thread", result_id:t.id, title:t.title, subtitle:t.board?.name, result_link:`/forums/thread/${t.id}` }));
      if (events.data?.length) g.event = events.data.map(e => ({ result_type:"event", result_id:e.id, title:e.title, subtitle:e.category, result_link:"/events" }));
      setResults(g);
    }
    setLoading(false);
  }, [query]);

  const handleKeyDown = (e) => { if (e.key === "Enter") doSearch(); };

  const totalResults = results ? Object.values(results).reduce((a, b) => a + b.length, 0) : 0;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 1.25rem", fontFamily: "var(--display)", color: "#d4af37", fontSize: 22 }}>Search</h2>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <input
          placeholder="Search nations, dispatches, news, forums..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ ...inp, flex: 1, fontSize: 14 }}
          autoFocus
        />
        <button onClick={doSearch} disabled={loading || !query.trim()} style={mkBtn()}>
          {loading ? "..." : "Search"}
        </button>
      </div>

      {searched && !loading && totalResults === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#9fb4d6", fontSize: 13 }}>
          No results found for "<strong style={{ color: "#edf4ff" }}>{query}</strong>".
        </div>
      )}

      {results && Object.entries(results).map(([type, items]) => (
        <div key={type} style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.6rem", fontFamily: "var(--display)", color: "#f6c132", fontSize: 14, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>{SEARCH_ICONS[type] || "🔍"}</span>
            {SEARCH_LABELS[type] || type}
            <span style={{ color: "#8fa0bd", fontSize: 11, fontWeight: 400 }}>({items.length})</span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {items.map(item => (
              <button
                key={`${type}-${item.result_id}`}
                onClick={() => navigateToResult(item, navigate)}
                style={{
                  ...card, cursor: "pointer", textAlign: "left", width: "100%", border: "1px solid transparent",
                  display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.6rem 0.85rem",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(78,128,190,0.35)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{SEARCH_ICONS[type] || "🔍"}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#edf4ff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                  {item.subtitle && <div style={{ color: "#8fa0bd", fontSize: 11, marginTop: "0.15rem" }}>{item.subtitle}</div>}
                </div>
                <span style={{ fontSize: 10, color: "#6f85a8", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{SEARCH_LABELS[type] || type}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

function navigateToResult(item, navigate) {
  if (item.result_link === "/dispatches") { navigate("rp"); return; }
  if (item.result_link === "/news") { navigate("news"); return; }
  if (item.result_link === "/alliances") { navigate("alliances"); return; }
  if (item.result_link === "/events") { navigate("events"); return; }
  if (item.result_link?.startsWith("/nation/")) {
    const id = item.result_link.replace("/nation/", "");
    navigate("nation");
    setTimeout(() => window.history.replaceState(null, "", item.result_link), 0);
    return;
  }
  if (item.result_link?.startsWith("/profile/")) {
    const id = item.result_link.replace("/profile/", "");
    navigate("profile");
    setTimeout(() => window.history.replaceState(null, "", item.result_link), 0);
    return;
  }
  if (item.result_link?.startsWith("/forums/thread/")) {
    navigate("forums");
    setTimeout(() => window.history.replaceState(null, "", item.result_link), 0);
    return;
  }
  if (item.result_link) {
    navigate(item.result_link.replace("/", ""));
  }
}
