import { useState } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, timeAgo } from "../lib/uiUtils";
import { AllianceFlag } from "../components/alliance/AllianceFlag";
import { AllianceFlagUploader } from "../components/alliance/AllianceFlagUploader";
import { NationPill } from "../components/nation/NationPill";

const TABS = ["overview","members","wars"];
const TAB_LABELS = { overview:"Overview", members:"Members", wars:"Wars" };

export const AllianceProfile = ({ alliance, allianceMembers, nations, wars, warParticipants, profiles, profile, userNation, isMod, onBack, onRefresh }) => {
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name:alliance?.name||"", description:alliance?.description||"", type:alliance?.type||"alliance" });
  const [statusMsg, setStatusMsg] = useState(null);
  const show = (msg, type="info") => { setStatusMsg({msg,type}); setTimeout(()=>setStatusMsg(null),4000); };

  if (!alliance) return (
    <div>
      <button onClick={onBack} style={{ ...mkBtn("ghost"), marginBottom:"1rem", fontSize:12 }}>Back</button>
      <div style={{ ...card, textAlign:"center", padding:"2.5rem" }}>
        <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:16 }}>Alliance not found.</div>
        <p style={{ margin:"0.35rem 0 0", color:"#8fa0bd", fontSize:13 }}>It may have been deleted or you followed a bad link.</p>
      </div>
    </div>
  );

  const members = allianceMembers.filter(m=>m.alliance_id===alliance.id).map(m=>{const n=nations.find(n=>n.id===m.nation_id);return{...m,nation:n};}).filter(m=>m.nation);
  const leaderIds = members.filter(m=>m.role==="leader").map(m=>m.nation_id);
  const isAllyLeader = userNation && leaderIds.includes(userNation.id);

  const allyWars = wars.filter(w =>
    w.aggressor_id && leaderIds.includes(w.aggressor_id) ||
    w.defender_id && leaderIds.includes(w.defender_id) ||
    warParticipants?.some(p=>p.war_id===w.id && (p.alliance_id===alliance.id || (p.nation_id && members.some(m=>m.nation_id===p.nation_id))))
  );

  const saveAlliance = async () => {
    const { error } = await supabase.from("alliances").update({name:editForm.name, description:editForm.description||null, type:editForm.type}).eq("id",alliance.id);
    if (error) show(error.message, "error"); else { setEditing(false); onRefresh(); show("Alliance updated"); }
  };

  const removeMember = async (m) => {
    if (!confirm(`Remove ${m.nation?.name||"this member"} from ${alliance.name}?`)) return;
    const { error } = await supabase.from("alliance_members").delete().eq("id",m.id);
    if (error) show(error.message, "error"); else { show("Member removed"); onRefresh(); }
  };

  return (
    <div>
      <button onClick={onBack} style={{ ...mkBtn("ghost"), marginBottom:"1rem", fontSize:12 }}>← Alliances</button>
      {statusMsg && <div style={{ padding:"0.6rem 1rem", marginBottom:"0.75rem", borderRadius:6, background:statusMsg.type==="error"?"rgba(231,76,60,0.12)":"rgba(46,204,113,0.12)", border:`1px solid ${statusMsg.type==="error"?"rgba(231,76,60,0.3)":"rgba(46,204,113,0.3)"}`, color:statusMsg.type==="error"?"#e74c3c":"#2ecc71", fontSize:12 }}>{statusMsg.msg}</div>}

      {/* Header */}
      <div style={{ ...card, border:"1px solid rgba(212,175,55,0.25)", marginBottom:"1rem", padding:"1.75rem", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(6,10,18,0.97),rgba(9,18,32,0.97))", pointerEvents:"none" }} />
        <div style={{ position:"relative", display:"flex", gap:"1.25rem", alignItems:"flex-start", flexWrap:"wrap" }}>
          <AllianceFlag alliance={alliance} size={72} />
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
              <h1 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:"clamp(1.3rem,3vw,1.8rem)", letterSpacing:"0.04em" }}>{alliance.name}</h1>
              <span style={{ fontSize:11, fontWeight:700, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:999, padding:"2px 10px" }}>{alliance.type?.toUpperCase()}</span>
              {(isMod || isAllyLeader) && <AllianceFlagUploader allianceId={alliance.id} currentUrl={alliance.flag_url} onUploaded={onRefresh} />}
            </div>
            {alliance.description && <p style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.7, margin:"0.5rem 0 0" }}>{alliance.description}</p>}
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginTop:"0.75rem", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#8fa0bd" }}>{members.length} member{members.length!==1?"s":""}</span>
              <span style={{ fontSize:12, color:"#8fa0bd" }}>·</span>
              <span style={{ fontSize:12, color:"#8fa0bd" }}>{leaderIds.length} leader{leaderIds.length!==1?"s":""}</span>
              {(isMod || isAllyLeader) && (
                <button onClick={()=>setEditing(!editing)} style={{ ...mkBtn("ghost"), fontSize:11 }}>{editing?"Cancel":"Edit"}</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ ...card, marginBottom:"1rem", border:"1px solid rgba(212,175,55,0.28)" }}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Edit Alliance</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            <input placeholder="Name" value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} style={inp} />
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

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.35rem", marginBottom:"1rem", flexWrap:"wrap", borderBottom:"1px solid rgba(78,128,190,0.12)", paddingBottom:"0.5rem" }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{TAB_LABELS[t]}{t==="members"?` (${members.length})`:""}{t==="wars"&&allyWars.length?` (${allyWars.length})`:""}</button>
        ))}
      </div>

      {/* Overview */}
      {tab==="overview" && (
        <div style={{ ...card }}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Members</h3>
          {members.length===0 ? (
            <p style={{ margin:0, color:"#8493ad", fontStyle:"italic", fontSize:13 }}>No members yet.</p>
          ) : (
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
              {members.map(m=>(
                <span key={m.id} style={{ display:"inline-flex", alignItems:"center", gap:"0.25rem" }}>
                  <NationPill nation={m.nation} />
                  {m.role==="leader" && <span style={{ fontSize:8, color:"#d4af37", fontWeight:700, background:"rgba(212,175,55,0.12)", borderRadius:4, padding:"1px 5px" }}>LEADER</span>}
                </span>
              ))}
            </div>
          )}
          {alliance.description && (
            <>
              <div style={{ borderTop:"1px solid rgba(78,128,190,0.12)", margin:"1rem 0 0.75rem" }} />
              <h3 style={{ margin:"0 0 0.5rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>About</h3>
              <p style={{ margin:0, color:"#b8c4d8", fontSize:13, lineHeight:1.7 }}>{alliance.description}</p>
            </>
          )}
        </div>
      )}

      {/* Members tab */}
      {tab==="members" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {members.length===0 ? (
            <div style={{ ...card, textAlign:"center", padding:"2rem", color:"#8493ad", fontStyle:"italic", fontSize:13 }}>No members.</div>
          ) : members.map(m=>(
            <div key={m.id} style={{ ...card, padding:"0.85rem", display:"flex", gap:"0.75rem", alignItems:"center" }}>
              <NationPill nation={m.nation} />
              <div style={{ flex:1, fontSize:11, color:"#8fa0bd" }}>
                {m.role==="leader" && <span style={{ color:"#d4af37", fontWeight:700, fontSize:10 }}>Alliance Leader</span>}
                {m.role==="member" && <span style={{ color:"#8fa0bd", fontSize:10 }}>Member</span>}
              </div>
              {(isMod || (isAllyLeader && !leaderIds.includes(m.nation_id))) && (
                <button onClick={()=>removeMember(m)} style={{ ...mkBtn("red"), fontSize:10, padding:"3px 8px", minHeight:26 }}>Remove</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Wars tab */}
      {tab==="wars" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {allyWars.length===0 ? (
            <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
              <div style={{ color:"#8493ad", fontStyle:"italic", fontSize:13 }}>No wars involving this alliance.</div>
            </div>
          ) : allyWars.map(w=>{
            const agg = nations.find(n=>n.id===w.aggressor_id);
            const def = nations.find(n=>n.id===w.defender_id);
            const participants = warParticipants?.filter(p=>p.war_id===w.id)||[];
            const side = participants.find(p=>p.alliance_id===alliance.id);
            const isAtk = side?.side==="attacker";
            return (
              <div key={w.id} style={card}>
                <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, color:"#edf4ff", fontSize:13 }}>{w.name || "Unnamed War"}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:"#e74c3c", border:"1px solid rgba(231,76,60,0.25)", borderRadius:3, padding:"1px 6px" }}>{w.status?.toUpperCase()}</span>
                  {side && <span style={{ fontSize:10, color:"#8fa0bd" }}>{isAtk?"Attacker":"Defender"}</span>}
                </div>
                <div style={{ fontSize:12, color:"#8fa0bd", marginTop:"0.3rem" }}>{agg?.name||"?"} vs {def?.name||"?"}</div>
                {w.casus_belli && <p style={{ margin:"0.3rem 0 0", color:"#9fb4d6", fontSize:12 }}>{w.casus_belli}</p>}
                {w.casualties && <div style={{ fontSize:11, color:"#8fa0bd", marginTop:"0.25rem" }}>Casualties: {w.casualties}</div>}
                <div style={{ fontSize:10, color:"#6f85a8", marginTop:"0.3rem" }}>{timeAgo(w.started_at)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
