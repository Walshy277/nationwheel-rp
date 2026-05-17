import { useState } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, slugify, timeAgo, fmtDate, ROLE_LABELS, ROLE_COLORS, getRoles } from "../lib/uiUtils";
import { SITE_CODE_FILES, CHANGELOG_ENTRIES } from "../lib/constants";
import { Flag } from "../components/nation/Flag";

const ROLE_OPTIONS = [
  "admin",
  "lore_team",
  "nation_leader",
  "alliance_leader",
  "user",
];

export const AdminPanel = ({ nations, profiles, onRefresh, isAdmin }) => {
  const [tab, setTab] = useState("add");
  const blank = { name:"",government:"",ideology:"",population:"",gdp_usd:"",land_km2:"",army_rank:"",hdi:"",economy:"",bio:"",diplomatic_status:"",bloc:"" };
  const [nf, setNf] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [assignNId, setAssignNId] = useState(""); const [assignPId, setAssignPId] = useState("");
  const [roleId, setRoleId] = useState(""); const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedCodeFile, setSelectedCodeFile] = useState(Object.keys(SITE_CODE_FILES).sort()[0] || "");
  const [codeNote, setCodeNote] = useState("");
  const [userStatusId, setUserStatusId] = useState("");
  const [suspendDays, setSuspendDays] = useState("7");
  const [moderationReason, setModerationReason] = useState("");
  const selectedUser = profiles.find(p => p.id === userStatusId);

  const submitNation = async () => {
    if (!nf.name.trim()) return;
    const payload = { name:nf.name, slug:slugify(nf.name), government:nf.government||null, ideology:nf.ideology||null, population:nf.population?parseInt(nf.population):null, gdp_usd:nf.gdp_usd?parseInt(nf.gdp_usd):null, land_km2:nf.land_km2?parseInt(nf.land_km2):null, army_rank:nf.army_rank?parseInt(nf.army_rank):null, hdi:nf.hdi?parseFloat(nf.hdi):null, economy:nf.economy||null, bio:nf.bio||null, diplomatic_status:nf.diplomatic_status||null, bloc:nf.bloc||null };
    if (editId) { await supabase.from("nations").update(payload).eq("id",editId); setEditId(null); }
    else await supabase.from("nations").insert(payload);
    setNf(blank); onRefresh();
  };

  const loadEdit = n => { setEditId(n.id); setNf({ name:n.name||"",government:n.government||"",ideology:n.ideology||"",population:n.population||"",gdp_usd:n.gdp_usd||"",land_km2:n.land_km2||"",army_rank:n.army_rank||"",hdi:n.hdi||"",economy:n.economy||"",bio:n.bio||"",diplomatic_status:n.diplomatic_status||"",bloc:n.bloc||"" }); setTab("add"); window.scrollTo(0,0); };

  const assignNation = async () => {
    if (!assignNId || !assignPId) return;
    const { error } = await supabase.rpc("assign_nation_as_staff", { target_profile: assignPId, target_nation: assignNId });
    if (error) {
      alert(error.message);
      return;
    }
    setAssignNId("");
    setAssignPId("");
    onRefresh();
  };

  const fields = [["name","Nation Name *"],["government","Government"],["ideology","Ideology"],["population","Population"],["gdp_usd","GDP (USD number)"],["land_km2","Land km2"],["army_rank","Army Rank 0-11"],["hdi","HDI 0.00-1.00"],["economy","Economy Sectors"],["diplomatic_status","Diplomatic Status"],["bloc","Bloc / Alliance"]];
  const tabs = [["add",editId?"Edit Nation":"Add Nation"],["assign","Assign Nations"],...(isAdmin ? [["users","Users"],["roles","Manage Roles"],["code","Site Code"],["changes","Changelog"]] : []),["list","Nation List"]];
  const codeEntries = Object.entries(SITE_CODE_FILES).sort(([a],[b])=>a.localeCompare(b));
  const selectedCode = SITE_CODE_FILES[selectedCodeFile] || "";
  const setUserModeration = async (status) => {
    if (!userStatusId) return;
    const suspendedUntil = status === "suspended"
      ? new Date(Date.now() + Math.max(Number(suspendDays) || 1, 1) * 86400000).toISOString()
      : null;
    const { error } = await supabase
      .from("profiles")
      .update({
        status,
        suspended_until: suspendedUntil,
        ban_reason: status === "active" ? null : moderationReason.trim() || null,
      })
      .eq("id", userStatusId);
    if (error) alert(error.message);
    else {
      setModerationReason("");
      onRefresh();
    }
  };
  const saveCodeNote = async () => {
    if (!codeNote.trim()) return;
    const { error } = await supabase.from("site_code_notes").insert({
      file_path: selectedCodeFile,
      note: codeNote.trim(),
    });
    if (error) alert(error.message);
    else {
      setCodeNote("");
      alert("Code change note saved for deployment.");
    }
  };
  const removeMember = async () => {
    if (!userStatusId || !selectedUser) return;
    if (!confirm(`Permanently remove ${selectedUser.username} from the database? This deletes their auth account, profile, posts, actions, and related records.`)) return;
    const typed = prompt(`Type ${selectedUser.username} to confirm permanent removal.`);
    if (typed !== selectedUser.username) return;
    const { error } = await supabase.rpc("hard_delete_profile", { target_profile: userStatusId });
    if (error) alert(error.message);
    else {
      setUserStatusId("");
      setModerationReason("");
      onRefresh();
    }
  };
  const toggleRole = (r) => {
    setSelectedRoles(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  return (
    <div>
      <h2 style={{ margin:"0 0 1.25rem", fontFamily:"var(--display)", color:"#e74c3c", fontSize:20 }}>{isAdmin ? "Admin Panel" : "Lore Team Panel"}</h2>
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        {tabs.map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
        ))}
      </div>

      {tab==="add" && (
        <div style={card}>
          <h3 style={{ margin:"0 0 1rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>{editId?"Editing Nation":"Add New Nation"}</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.55rem" }}>
            {fields.map(([k,l])=>(
              <input key={k} placeholder={l} value={nf[k]} onChange={e=>setNf({...nf,[k]:e.target.value})} style={{ ...inp, ...(k==="name"?{gridColumn:"1/-1"}:{}) }} />
            ))}
            <textarea placeholder="Nation bio or lore" value={nf.bio} onChange={e=>setNf({...nf,bio:e.target.value})} style={{ ...ta, gridColumn:"1/-1", minHeight:65 }} />
            <p style={{ gridColumn:"1/-1", margin:"0.25rem 0 0", color:"#8fa0bd", fontSize:12 }}>Flags are uploaded by players as JPEG or PNG images from their nation profile.</p>
          </div>
          <div style={{ display:"flex", gap:"0.5rem", marginTop:"1rem" }}>
            <button onClick={submitNation} style={mkBtn()}>{editId?"Save Changes":"Add Nation"}</button>
            {editId && <button onClick={()=>{setEditId(null);setNf(blank);}} style={mkBtn("ghost")}>Cancel</button>}
          </div>
        </div>
      )}

      {tab==="assign" && (
        <div style={{ ...card, display:"flex", flexDirection:"column", gap:"0.75rem", maxWidth:480 }}>
          <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Assign Nation to Player</h3>
          <select value={assignNId} onChange={e=>setAssignNId(e.target.value)} style={inp}>
            <option value="">Select nation</option>
            {nations.map(n=><option key={n.id} value={n.id}>{n.name} {n.owner_id?"(assigned)":"(free)"}</option>)}
          </select>
          <select value={assignPId} onChange={e=>setAssignPId(e.target.value)} style={inp}>
            <option value="">Select player</option>
            {profiles.map(p=><option key={p.id} value={p.id}>{p.username} {p.nation_id?"(has nation)":""}</option>)}
          </select>
          <button onClick={assignNation} style={mkBtn()}>Assign Nation</button>
        </div>
      )}

      {isAdmin && tab==="roles" && (
        <div style={{ ...card, display:"flex", flexDirection:"column", gap:"0.75rem", maxWidth:480 }}>
          <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Manage Player Roles</h3>
          <select value={roleId} onChange={e=>{
            setRoleId(e.target.value);
            const p = profiles.find(x => x.id === e.target.value);
            setSelectedRoles(p ? getRoles(p) : []);
          }} style={inp}>
            <option value="">Select player</option>
            {profiles.map(p=><option key={p.id} value={p.id}>{p.username}</option>)}
          </select>
          {roleId && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
              <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", textTransform:"uppercase" }}>Current roles for {profiles.find(p=>p.id===roleId)?.username}</div>
              {ROLE_OPTIONS.map(r => (
                <label key={r} style={{ display:"flex", gap:"0.5rem", alignItems:"center", cursor:"pointer", color:"#edf4ff", fontSize:13 }}>
                  <input type="checkbox" checked={selectedRoles.includes(r)} onChange={()=>toggleRole(r)} style={{ accentColor:"#d4af37" }} />
                  <span style={{ color:ROLE_COLORS[r]||"#8fa0bd", fontWeight:700, fontSize:12 }}>{ROLE_LABELS[r] || r}</span>
                </label>
              ))}
              <button onClick={async()=>{
                if(!roleId)return;
                await supabase.from("profiles").update({roles:selectedRoles}).eq("id",roleId);
                setRoleId("");setSelectedRoles([]);onRefresh();
              }} style={{ ...mkBtn(), marginTop:"0.5rem" }}>Save Roles</button>
            </div>
          )}
        </div>
      )}

      {isAdmin && tab==="users" && (
        <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) 360px", gap:"1rem" }} className="admin-user-grid">
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>All Players ({profiles.length})</h3>
            {profiles.length === 0 && <div style={card}><p style={{ margin:0, color:"#8493ad", textAlign:"center", padding:"1rem", fontStyle:"italic" }}>No users registered yet.</p></div>}
            {profiles.map(p=>{
              const roles = getRoles(p);
              return (
                <div key={p.id} style={{ ...card, padding:"0.85rem", display:"flex", gap:"0.75rem", alignItems:"center" }}>
                  {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }} /> : <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#edf4ff", fontSize:13, fontWeight:800 }}>{p.username}</div>
                    <div style={{ color:"#8fa0bd", fontSize:11, display:"flex", gap:"0.25rem", flexWrap:"wrap" }}>
                      {roles.map(r => <span key={r} style={{ color:ROLE_COLORS[r]||"#8fa0bd", fontWeight:700, fontSize:9 }}>{ROLE_LABELS[r]||r}</span>)}
                      <span>· {p.status || "active"}{p.last_active_at ? ` · active ${timeAgo(p.last_active_at)}` : ""}</span>
                    </div>
                  </div>
                  <button onClick={()=>{setUserStatusId(p.id);window.scrollTo(0,document.body.scrollHeight);}} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>Mod</button>
                </div>
              );
            })}
          </div>
          <div style={{ ...card, display:"flex", flexDirection:"column", gap:"0.75rem", position:"sticky", top:"1rem" }}>
            <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>User Moderation</h3>
            <select value={userStatusId} onChange={e=>setUserStatusId(e.target.value)} style={inp}>
              <option value="">Select user</option>
              {profiles.map(p=><option key={p.id} value={p.id}>{p.username} — {p.status || "active"}</option>)}
            </select>
            <label style={{ color:"#8fa0bd", fontSize:11, display:"flex", flexDirection:"column", gap:"0.25rem" }}>
              Suspension duration (days)
              <input value={suspendDays} onChange={e=>setSuspendDays(e.target.value)} placeholder="7" style={inp} />
            </label>
            <textarea value={moderationReason} onChange={e=>setModerationReason(e.target.value)} placeholder="Reason for moderation action (stored as ban_reason)" style={{ ...ta, minHeight:90 }} />
            <div style={{ display:"flex", gap:"0.45rem", flexWrap:"wrap" }}>
              <button onClick={()=>setUserModeration("active")} style={mkBtn("green")}>Reinstate</button>
              <button onClick={()=>setUserModeration("suspended")} style={mkBtn("ghost")}>Suspend</button>
              <button onClick={()=>setUserModeration("banned")} style={mkBtn("red")}>Ban</button>
            </div>
            {selectedUser && (
              <div style={{ fontSize:12, color:"#8fa0bd", padding:"0.5rem", background:"rgba(255,255,255,0.03)", borderRadius:6 }}>
                Selected: <strong style={{ color:"#edf4ff" }}>{selectedUser.username}</strong> — {getRoles(selectedUser).map(r => ROLE_LABELS[r]||r).join(", ") || "user"} · {selectedUser.status || "active"}
              </div>
            )}
            <div style={{ borderTop:"1px solid rgba(231,76,60,0.22)", paddingTop:"0.75rem" }}>
              <div style={{ color:"#ff6b6b", fontSize:11, fontWeight:800, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"0.4rem" }}>Permanent Removal</div>
              <p style={{ margin:"0 0 0.65rem", color:"#9fb4d6", fontSize:12, lineHeight:1.6 }}>Deletes the auth user and cascades their profile-linked records. Requires the latest moderation SQL migration.</p>
              <button onClick={removeMember} disabled={!userStatusId} style={{ ...mkBtn("red"), width:"100%", opacity:userStatusId?1:0.4 }}>Remove Member Completely</button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && tab==="code" && (
        <div style={{ display:"grid", gridTemplateColumns:"280px minmax(0,1fr)", gap:"1rem" }} className="admin-code-grid">
          <div style={{ ...card, display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Site Code</h3>
            <select value={selectedCodeFile} onChange={e=>setSelectedCodeFile(e.target.value)} style={inp}>
              {codeEntries.map(([path])=><option key={path} value={path}>{path.replace("./", "src/")}</option>)}
            </select>
            <p style={{ margin:0, color:"#8fa0bd", fontSize:12, lineHeight:1.6 }}>
              This static app cannot safely rewrite deployed source files from the browser. Use this viewer to inspect code and save deployment notes for an admin/developer pass.
            </p>
            <textarea value={codeNote} onChange={e=>setCodeNote(e.target.value)} placeholder="Describe the code change to make in this file" style={{ ...ta, minHeight:150 }} />
            <button onClick={saveCodeNote} style={mkBtn()}>Save Code Change Note</button>
          </div>
          <pre style={{ ...card, margin:0, minHeight:520, maxHeight:"70vh", overflow:"auto", whiteSpace:"pre-wrap", color:"#d7e2f2", fontSize:11, lineHeight:1.65 }}>{selectedCode}</pre>
        </div>
      )}

      {isAdmin && tab==="changes" && (
        <div style={{ ...card, display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Changelog Management</h3>
          <p style={{ margin:0, color:"#9fb4d6", fontSize:13, lineHeight:1.7 }}>Current public changelog entries are maintained in the frontend release log so they ship with deployments.</p>
          {CHANGELOG_ENTRIES.map(entry=>(
            <div key={entry.title} style={{ borderTop:"1px solid rgba(78,128,190,0.16)", paddingTop:"0.75rem" }}>
              <strong style={{ color:"#edf4ff", fontSize:13 }}>{entry.title}</strong>
              <div style={{ color:"#8fa0bd", fontSize:11 }}>{fmtDate(entry.date)}</div>
            </div>
          ))}
        </div>
      )}

      {tab==="list" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {nations.map(n=>(
            <div key={n.id} style={{ ...card, padding:"0.9rem", display:"flex", gap:"0.75rem", alignItems:"center" }}>
              <Flag nation={n} size={28} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:"#edf4ff", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.name}</div>
                <div style={{ fontSize:11, color:"#8fa0bd" }}>{n.government||"?"} - {(n.owner || n.profiles)?(n.owner || n.profiles).username:"unassigned"}</div>
              </div>
              <button onClick={()=>loadEdit(n)} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>Edit</button>
              <button onClick={async()=>{if(!confirm("Delete this nation?"))return;await supabase.from("nations").delete().eq("id",n.id);onRefresh();}} style={{ ...mkBtn("red"), fontSize:11, padding:"5px 10px" }}>Del</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
