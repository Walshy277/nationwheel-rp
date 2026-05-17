import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, timeAgo } from "../lib/uiUtils";
import { AllianceFlag } from "../components/alliance/AllianceFlag";
import { AllianceFlagUploader } from "../components/alliance/AllianceFlagUploader";
import { NationPill } from "../components/nation/NationPill";
import { isLoreTeam, isNationLeader, isAllianceLeader, canEditNationStats } from "../lib/uiUtils";

export const AllianceProfile = ({ alliance, allianceMembers, nations, wars, warParticipants, profiles, profile, userNation, isMod, onBack, onRefresh }) => {
  const [tab, setTab] = useState("overview");
  const members = allianceMembers.filter(m => m.alliance_id === alliance.id).map(m => {
    const n = nations.find(n => n.id === m.nation_id);
    return { ...m, nation: n };
  }).filter(m => m.nation);
  const leaderIds = members.filter(m => m.role === "leader").map(m => m.nation_id);
  const isAllyLeaderForThis = userNation && leaderIds.includes(userNation.id);
  const allyWars = wars.filter(w =>
    w.aggressor_id && leaderIds.includes(w.aggressor_id) ||
    w.defender_id && leaderIds.includes(w.defender_id) ||
    warParticipants?.some(p => p.alliance_id === alliance.id) ||
    warParticipants?.some(p => p.nation_id && members.some(m => m.nation_id === p.nation_id))
  );

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: alliance.name || "",
    description: alliance.description || "",
    type: alliance.type || "alliance",
  });

  const saveAlliance = async () => {
    const { error } = await supabase.from("alliances").update({
      name: editForm.name,
      description: editForm.description || null,
      type: editForm.type,
    }).eq("id", alliance.id);
    if (error) alert(error.message);
    else { setEditing(false); onRefresh(); }
  };

  return (
    <div>
      <button onClick={onBack} style={{ ...mkBtn("ghost"), marginBottom:"1rem", fontSize:12 }}>Alliances</button>

      <div style={{ ...card, border:"1px solid rgba(212,175,55,0.25)", marginBottom:"1rem", padding:"1.75rem", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(6,10,18,0.97),rgba(9,18,32,0.97))", pointerEvents:"none" }} />
        <div style={{ position:"relative", display:"flex", gap:"1.25rem", alignItems:"flex-start", flexWrap:"wrap" }}>
          <div style={{ position:"relative" }}>
            <AllianceFlag alliance={alliance} size={72} />
            {(isMod || isAllyLeaderForThis) && (
              <AllianceFlagUploader allianceId={alliance.id} currentUrl={alliance.flag_url} onUploaded={onRefresh} />
            )}
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
              <h1 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:"clamp(1.3rem,3vw,1.8rem)", letterSpacing:"0.04em" }}>{alliance.name}</h1>
              <span style={{ fontSize:11, fontWeight:700, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:999, padding:"2px 10px" }}>{alliance.type?.toUpperCase()}</span>
            </div>
            {alliance.description && <p style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.7, margin:"0.5rem 0 0" }}>{alliance.description}</p>}
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginTop:"0.75rem" }}>
              <span style={{ fontSize:12, color:"#8fa0bd" }}>{members.length} member{members.length !== 1 ? "s" : ""}</span>
              {(isMod || isAllyLeaderForThis) && (
                <button onClick={() => setEditing(!editing)} style={{ ...mkBtn("ghost"), fontSize:11 }}>
                  {editing ? "Cancel" : "Edit Alliance"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div style={{ ...card, marginBottom:"1rem", border:"1px solid rgba(212,175,55,0.28)" }}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Edit Alliance</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            <input placeholder="Alliance name" value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} style={inp} />
            <select value={editForm.type} onChange={e=>setEditForm({...editForm,type:e.target.value})} style={inp}>
              {["alliance","trade","defence","non-aggression"].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)} Pact</option>)}
            </select>
            <textarea placeholder="Description or terms" value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})} style={{ ...ta, minHeight:80 }} />
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={saveAlliance} style={mkBtn()}>Save</button>
              <button onClick={()=>setEditing(false)} style={mkBtn("ghost")}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:"0.35rem", marginBottom:"1rem", flexWrap:"wrap", borderBottom:"1px solid rgba(78,128,190,0.12)", paddingBottom:"0.5rem" }}>
        {[["overview","Overview"],["members",`Members (${members.length})`],["wars",`Wars${allyWars.length?` (${allyWars.length})`:""}`]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
        ))}
      </div>

      {tab==="overview" && (
        <div>
          <div style={{ ...card, marginBottom:"1rem" }}>
            <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Members</h3>
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
              {members.map(m => (
                <span key={m.id} style={{ display:"inline-flex", alignItems:"center", gap:"0.25rem" }}>
                  <NationPill nation={m.nation} />
                  {m.role === "leader" ? <span style={{ fontSize:8, color:"#d4af37", fontWeight:700, background:"rgba(212,175,55,0.12)", borderRadius:4, padding:"1px 5px" }}>LEADER</span> : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="members" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {members.map(m => (
            <div key={m.id} style={{ ...card, padding:"0.85rem", display:"flex", gap:"0.75rem", alignItems:"center" }}>
              <NationPill nation={m.nation} />
              <div style={{ fontSize:11, color:"#8fa0bd", flex:1 }}>
                {m.role === "leader" && <span style={{ color:"#d4af37", fontWeight:700, fontSize:10 }}>Alliance Leader</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="wars" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {allyWars.length === 0 ? (
            <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
              <div style={{ color:"#8493ad", fontStyle:"italic", fontSize:13 }}>No wars involving this alliance.</div>
            </div>
          ) : allyWars.map(w => {
            const aggressor = nations.find(n => n.id === w.aggressor_id);
            const defender = nations.find(n => n.id === w.defender_id);
            return (
              <div key={w.id} style={card}>
                <div style={{ fontWeight:700, color:"#edf4ff" }}>{w.name || "War"}</div>
                <div style={{ fontSize:12, color:"#8fa0bd" }}>{aggressor?.name || "?"} vs {defender?.name || "?"}</div>
                <div style={{ fontSize:11, color:"#e74c3c", marginTop:"0.25rem" }}>{w.status?.toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
