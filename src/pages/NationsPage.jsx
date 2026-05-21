import { useState } from "react";
import { NationProfile } from "./NationProfile";
import { card, inp, fmtPop, fmtGDP } from "../lib/uiUtils";
import { Flag } from "../components/nation/Flag";

export const NationsPage = ({ nations, posts, actions, wars, alliances, allianceMembers, profile, userNation, isMod, isAdmin, onRefresh }) => {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [govFilter, setGovFilter] = useState("");
  const [sort, setSort] = useState("name");

  if (selected) return (
    <NationProfile nation={selected} posts={posts} actions={actions} wars={wars} alliances={alliances} allianceMembers={allianceMembers} nations={nations} onBack={()=>setSelected(null)} profile={profile} userNation={userNation} isMod={isMod} isAdmin={isAdmin} onRefresh={onRefresh} />
  );

  const govs = [...new Set(nations.map(n=>n.government).filter(Boolean))].sort();
  let list = nations.filter(n =>
    (!search || n.name.toLowerCase().includes(search.toLowerCase()) || (n.government||"").toLowerCase().includes(search.toLowerCase()) || (n.bloc||"").toLowerCase().includes(search.toLowerCase())) &&
    (!govFilter || n.government===govFilter)
  );
  list.sort((a,b)=>{
    if (sort==="name") return a.name.localeCompare(b.name);
    if (sort==="gdp") return (b.gdp_usd||0)-(a.gdp_usd||0);
    if (sort==="pop") return (b.population||0)-(a.population||0);
    if (sort==="land") return (b.land_km2||0)-(a.land_km2||0);
    if (sort==="army") return (b.army_rank||0)-(a.army_rank||0);
    return 0;
  });

  return (
    <div>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Nations Registry <span style={{ fontSize:13, color:"#8fa0bd" }}>({list.length}/{nations.length})</span></h2>
      </div>
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem", flexWrap:"wrap" }}>
        <input placeholder="Search nations, governments, blocs" value={search} onChange={e=>setSearch(e.target.value)} style={{ ...inp, flex:1, minWidth:160, width:"auto" }} />
        <select value={govFilter} onChange={e=>setGovFilter(e.target.value)} style={{ ...inp, width:"auto", minWidth:155 }}>
          <option value="">All Governments</option>
          {govs.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{ ...inp, width:"auto" }}>
          {[["name","Name"],["gdp","GDP"],["pop","Population"],["land","Land"],["army","Army"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {nations.length === 0 && (
        <div style={{ ...card, textAlign:"center", padding:"2rem", border:"1px solid rgba(225,29,29,0.26)" }}>
          <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:16, marginBottom:"0.35rem" }}>No nations loaded</div>
          <p style={{ margin:0, color:"#8fa0bd", fontSize:13, lineHeight:1.6 }}>The directory is public, so this usually means the database seed has not been run on this Supabase project or the deployment is pointing at the wrong Supabase environment.</p>
        </div>
      )}
      {nations.length > 0 && list.length === 0 && (
        <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
          <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:16, marginBottom:"0.35rem" }}>No matches</div>
          <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>Clear the search or government filter to see all nations.</p>
        </div>
      )}
        <div className="nation-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(275px,1fr))", gap:"0.75rem" }}>
        {list.map(n=>(
          <div key={n.id} className="nation-card" style={{ ...card, cursor:"pointer", borderColor:"rgba(212,175,55,0.1)" }}
            onClick={()=>setSelected(n)}>
            <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.75rem" }}>
              <Flag nation={n} size={38} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.name}</div>
                <div style={{ fontSize:11, color:"#8fa0bd" }}>{n.government||"Unknown govt."}</div>
              </div>
              {!n.owner_id && <span style={{ fontSize:9, color:"#8493ad", border:"1px solid #8493ad", borderRadius:3, padding:"1px 5px", flexShrink:0 }}>UNASSIGNED</span>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.4rem" }}>
              {[["Pop",fmtPop(n.population)],["GDP",fmtGDP(n.gdp_usd)],["Army",n.army_rank!=null?`${n.army_rank}/11`:"-"]].map(([l,v])=>(
                <div key={l}>
                  <div style={{ fontSize:9, color:"#8493ad", textTransform:"uppercase", letterSpacing:"0.08em" }}>{l}</div>
                  <div style={{ fontSize:12, color:"#d7e2f2", fontWeight:700 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
