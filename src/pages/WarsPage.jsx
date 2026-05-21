import { useState } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, isNationLeader } from "../lib/uiUtils";
import { AllianceFlag } from "../components/alliance/AllianceFlag";
import { AllianceFlagUploader } from "../components/alliance/AllianceFlagUploader";
import { NationPill } from "../components/nation/NationPill";
import { WarCard } from "../components/war/WarCard";
import { AllianceBoards } from "../components/alliance/AllianceBoards";
import { DiplomaticInbox } from "../components/alliance/DiplomaticInbox";
import { notifyWarDeclare, createMentionNotifications } from "../lib/notifications";
import { useToast } from "../lib/ToastContext";

export const WarsPage = ({ wars, alliances, allianceMembers, warParticipants, nations, profiles, profile, userNation, isMod, onRefresh, onViewAlliance, mode }) => {
  const [tab, setTab] = useState(mode === "alliances" ? "alliances" : mode === "wars" ? "wars" : "wars");
  const showStatus = useToast();

  const [showWarForm, setShowWarForm] = useState(false);
  const [wf, setWf] = useState({ target_type:"nation", target_id:"", name:"", casus_belli:"", objective:"", casualties:"", result:"" });
  const [showAllyForm, setShowAllyForm] = useState(false);
  const [af, setAf] = useState({ name:"", description:"", type:"alliance" });
  const [allySubmitting, setAllySubmitting] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [allyRequests, setAllyRequests] = useState([]);
  const [assignLeaderFor, setAssignLeaderFor] = useState(null);
  const [assignLeaderId, setAssignLeaderId] = useState("");

  const myAllyIds = allianceMembers.filter(m=>m.nation_id===userNation?.id).map(m=>m.alliance_id);
  const isLeader = profile && isNationLeader(profile);

  const getTabs = () => {
    if (mode === "alliances") {
      const items = [["alliances","Alliances"]];
      if (isLeader && myAllyIds.length) items.push(["board","Boards"], ["inbox","Inbox"]);
      return items;
    }
    if (mode === "wars") return [["wars","Wars"]];
    const items = [["wars","Wars"], ["alliances","Alliances"]];
    if (isLeader) items.push(["board","Boards"], ["inbox","Inbox"]);
    return items;
  };

  const submitWar = async () => {
    if (!wf.target_id || !userNation) return showStatus("Select a target", "error");
    const legacyDefender = wf.target_type === "nation" ? wf.target_id : null;
    let { data, error } = await supabase.from("wars").insert({
      aggressor_id:userNation.id, defender_id:legacyDefender, name:wf.name, casus_belli:wf.casus_belli,
      objective:wf.objective||null, casualties:wf.casualties||null, result:wf.result||null, outcome:wf.result||null,
    }).select().single();
    if (error && /objective|casualties|result|schema cache|column/i.test(error.message || "")) {
      const retry = await supabase.from("wars").insert({
        aggressor_id:userNation.id, defender_id:legacyDefender, name:wf.name, casus_belli:wf.casus_belli,
        outcome:[wf.objective&&`Objective: ${wf.objective}`,wf.casualties&&`Casualties: ${wf.casualties}`,wf.result&&`Result: ${wf.result}`].filter(Boolean).join("\n"),
      }).select().single();
      data = retry.data; error = retry.error;
    }
    if (error) { showStatus(error.message, "error"); return; }
    await supabase.from("war_participants").insert([
      { war_id:data.id, side:"attacker", nation_id:userNation.id, alliance_id:null },
      { war_id:data.id, side:"defender", nation_id:wf.target_type==="nation"?wf.target_id:null, alliance_id:wf.target_type==="alliance"?wf.target_id:null },
    ]);
    notifyWarDeclare({ war:data, aggressorNationName:userNation.name, allProfiles:profiles||[] });
    createMentionNotifications({ body:wf.casus_belli, sourceTitle:data.name||`War: ${userNation.name}`, sourceLink:"/wars", sourceType:"war" });
    setWf({target_type:"nation",target_id:"",name:"",casus_belli:"",objective:"",casualties:"",result:""});
    setShowWarForm(false); showStatus("War declared", "success"); onRefresh();
  };

  const submitAlly = async () => {
    if (!af.name.trim()) return showStatus("Enter an alliance name", "error");
    if (!isLeader) return showStatus("Only nation leaders can form alliances", "error");
    setAllySubmitting(true);
    try {
      const { data, error } = await supabase.from("alliances").insert({
        name:af.name, description:af.description||null, type:af.type,
      }).select().single();
      if (error) { showStatus(error.message, "error"); setAllySubmitting(false); return; }
      if (data && userNation) {
        await supabase.from("alliance_members").insert({
          alliance_id:data.id, nation_id:userNation.id, role:"leader",
        });
      }
      setAf({name:"",description:"",type:"alliance"}); setShowAllyForm(false);
      showStatus(`Alliance "${af.name}" formed!`, "success"); onRefresh();
    } catch (e) { showStatus(e.message, "error"); }
    setAllySubmitting(false);
  };

  const requestJoin = async (a) => {
    const { error } = await supabase.from("alliance_requests").insert({alliance_id:a.id, nation_id:userNation.id});
    if (error) showStatus(error.message, "error"); else showStatus("Join request sent", "success");
  };

  const leaveAlliance = async (a) => {
    if (!confirm(`Leave ${a.name}?`)) return;
    const { error } = await supabase.from("alliance_members").delete().eq("alliance_id",a.id).eq("nation_id",userNation.id);
    if (error) showStatus(error.message, "error"); else { showStatus(`Left ${a.name}`, "success"); onRefresh(); }
  };

  const editAlliance = async (a) => {
    const name = prompt("Alliance name", a.name); if (!name) return;
    const desc = prompt("Description", a.description||"") ?? a.description;
    const type = prompt("Type", a.type||"alliance") || a.type;
    const { error } = await supabase.from("alliances").update({name,description:desc,type}).eq("id",a.id);
    if (error) showStatus(error.message, "error"); else onRefresh();
  };

  const deleteAlliance = async (a) => {
    if (!confirm(`Delete ${a.name}?`)) return;
    const { error } = await supabase.from("alliances").delete().eq("id",a.id);
    if (error) showStatus(error.message, "error"); else { showStatus("Alliance deleted", "success"); onRefresh(); }
  };

  const getMembers = (a) => allianceMembers.filter(m=>m.alliance_id===a.id).map(m=>({...m, nation:nations.find(n=>n.id===m.nation_id)})).filter(m=>m.nation);
  const getLeaders = (a) => getMembers(a).filter(m=>m.role==="leader");
  const isMember = (a) => getMembers(a).some(m=>m.nation_id===userNation?.id);
  const isAllyLeader = (a) => getLeaders(a).some(m=>m.nation_id===userNation?.id);

  const loadRequests = async () => {
    const ids = allianceMembers.filter(m=>m.nation_id===userNation?.id&&m.role==="leader").map(m=>m.alliance_id);
    if (!ids.length) { setAllyRequests([]); return; }
    const { data } = await supabase.from("alliance_requests").select("*, nations!alliance_requests_nation_id_fkey(name,flag_url)").in("alliance_id",ids).eq("status","pending").order("created_at",{ascending:false});
    setAllyRequests(data||[]);
  };

  const approveRequest = async (r) => {
    await supabase.from("alliance_members").insert({alliance_id:r.alliance_id, nation_id:r.nation_id, role:"member"});
    await supabase.from("alliance_requests").update({status:"approved"}).eq("id",r.id);
    loadRequests(); onRefresh();
  };

  const rejectRequest = async (r) => {
    await supabase.from("alliance_requests").update({status:"rejected"}).eq("id",r.id);
    loadRequests();
  };

  const tabs = getTabs();

  return (
    <div>
      <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>{mode==="alliances"?"Alliances":"Wars"}</h2>
        <div style={{ fontSize:11, color:"#8fa0bd", display:"flex", gap:"0.35rem" }}>
          {mode!=="alliances" && <span>{wars.filter(w=>w.status!=="peace").length} active</span>}
          {mode!=="alliances" && mode!=="wars" && <span>|</span>}
          {mode!=="wars" && <span>{alliances.length} alliances</span>}
        </div>
        {userNation && tab==="wars" && isLeader && (
          <button onClick={()=>setShowWarForm(!showWarForm)} style={{ ...mkBtn("red"), fontSize:12 }}>{showWarForm?"Cancel":"Declare War"}</button>
        )}
        {userNation && tab==="alliances" && isLeader && (
          <button onClick={()=>setShowAllyForm(!showAllyForm)} style={{ ...mkBtn(), fontSize:12 }}>{showAllyForm?"Cancel":"Form Alliance"}</button>
        )}
      </div>

      {tabs.length > 1 && (
        <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem", flexWrap:"wrap" }}>
          {tabs.map(([t,l])=>(
            <button key={t} onClick={()=>{setTab(t);}} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
          ))}
        </div>
      )}

      {tab==="wars" && (
        <div>
          {showWarForm && (
            <div style={{ ...card, border:"1px solid rgba(231,76,60,0.25)", marginBottom:"1rem" }}>
              <h3 style={{ margin:"0 0 1rem", fontFamily:"var(--display)", color:"#e74c3c", fontSize:14 }}>Declare War — {userNation?.name}</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                <select value={wf.target_type} onChange={e=>setWf({...wf,target_type:e.target.value,target_id:""})} style={inp}>
                  <option value="nation">Target nation</option>
                  <option value="alliance">Target alliance</option>
                </select>
                <select value={wf.target_id} onChange={e=>setWf({...wf,target_id:e.target.value})} style={inp}>
                  <option value="">Select {wf.target_type}</option>
                  {wf.target_type==="nation"?nations.filter(n=>n.id!==userNation?.id).map(n=><option key={n.id} value={n.id}>{n.name}</option>):alliances.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <input placeholder="War name (optional)" value={wf.name} onChange={e=>setWf({...wf,name:e.target.value})} style={inp} />
                <input placeholder="Objective" value={wf.objective} onChange={e=>setWf({...wf,objective:e.target.value})} style={inp} />
                <input placeholder="Expected casualties" value={wf.casualties} onChange={e=>setWf({...wf,casualties:e.target.value})} style={inp} />
                <input placeholder="End result / terms" value={wf.result} onChange={e=>setWf({...wf,result:e.target.value})} style={inp} />
                <textarea placeholder="Casus belli — justification" value={wf.casus_belli} onChange={e=>setWf({...wf,casus_belli:e.target.value})} style={{ ...ta, minHeight:60 }} />
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button onClick={submitWar} style={mkBtn("red")}>Declare War</button>
                  <button onClick={()=>setShowWarForm(false)} style={mkBtn("ghost")}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {wars.length===0 ? (
              <div style={{ ...card, textAlign:"center", padding:"2.5rem" }}>
                <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:16, marginBottom:"0.35rem" }}>The world is at peace.</div>
                <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>No wars recorded. Declare one using the button above.</p>
              </div>
            ) : (
              <>
                {wars.filter(w=>w.status==="active"||w.status==="ceasefire"||w.status==="stalemate").map(w=><WarCard key={w.id} war={w} nations={nations} alliances={alliances} participants={warParticipants} isMod={isMod} onRefresh={onRefresh} />)}
                {wars.filter(w=>w.status==="peace"||w.status==="frozen").length>0 && (
                  <><div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:"0.75rem" }}>Historical</div>
                  {wars.filter(w=>w.status==="peace"||w.status==="frozen").map(w=><WarCard key={w.id} war={w} nations={nations} alliances={alliances} participants={warParticipants} isMod={isMod} onRefresh={onRefresh} />)}</>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {tab==="alliances" && (
        <div>
          {showAllyForm && (
            <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1rem" }}>
              <h3 style={{ margin:"0 0 1rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Form Alliance</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                <input placeholder="Alliance name" value={af.name} onChange={e=>setAf({...af,name:e.target.value})} style={inp} />
                <select value={af.type} onChange={e=>setAf({...af,type:e.target.value})} style={inp}>
                  {["alliance","trade","defence","non-aggression"].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)} Pact</option>)}
                </select>
                <textarea placeholder="Description or terms" value={af.description} onChange={e=>setAf({...af,description:e.target.value})} style={{ ...ta, minHeight:60 }} />
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button onClick={submitAlly} disabled={allySubmitting} style={{ ...mkBtn(), opacity:allySubmitting?0.6:1 }}>{allySubmitting?"Creating...":"Form Alliance"}</button>
                  <button onClick={()=>setShowAllyForm(false)} style={mkBtn("ghost")}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {alliances.length===0 ? (
              <div style={{ ...card, textAlign:"center", padding:"2.5rem" }}>
                <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:16, marginBottom:"0.35rem" }}>No alliances yet.</div>
                <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>Nation leaders can form pacts using the button above.</p>
              </div>
            ) : (
              alliances.map(a => {
                const members = getMembers(a);
                const leaders = getLeaders(a);
                const isMem = isMember(a);
                const isLead = isAllyLeader(a);
                return (
                  <div key={a.id} style={card}>
                    <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.75rem", flexWrap:"wrap" }}>
                      <AllianceFlag alliance={a} size={38} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:15 }}>{a.name}</div>
                        <div style={{ fontSize:11, color:"#8fa0bd" }}>{members.length} member{members.length!==1?"s":""}</div>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:999, padding:"2px 10px" }}>{a.type?.toUpperCase()}</span>
                      {isMod && <AllianceFlagUploader allianceId={a.id} currentUrl={a.flag_url} onUploaded={onRefresh} />}
                    </div>
                    {a.description && <p style={{ margin:"0 0 0.75rem", color:"#b8c4d8", fontSize:12, lineHeight:1.7 }}>{a.description}</p>}
                    <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", alignItems:"center" }}>
                      {members.map(m=>(
                        <span key={m.id} style={{ display:"inline-flex", alignItems:"center", gap:"0.25rem" }}>
                          <NationPill nation={m.nation} />
                          {m.role==="leader" && <span style={{ fontSize:8, color:"#d4af37", fontWeight:700, background:"rgba(212,175,55,0.12)", borderRadius:4, padding:"1px 5px" }}>LEADER</span>}
                        </span>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.75rem", flexWrap:"wrap", borderTop:"1px solid rgba(78,128,190,0.12)", paddingTop:"0.65rem" }}>
                      {userNation && !isMem && isLeader && <button onClick={()=>requestJoin(a)} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>+ Request to Join</button>}
                      {userNation && isMem && !isLead && <button onClick={()=>leaveAlliance(a)} style={{ ...mkBtn("red"), fontSize:11, padding:"5px 10px" }}>Leave</button>}
                      {onViewAlliance && <button onClick={()=>onViewAlliance(a.id)} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>View Profile</button>}
                      {isLead && (
                        <>
                          <button onClick={()=>editAlliance(a)} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>Edit</button>
                          <button onClick={()=>deleteAlliance(a)} style={{ ...mkBtn("red"), fontSize:11, padding:"5px 10px" }}>Delete</button>
                          <button onClick={async()=>{ await loadRequests(); setShowRequests(true); }} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>
                            Requests{allyRequests.filter(r=>r.alliance_id===a.id).length ? ` (${allyRequests.filter(r=>r.alliance_id===a.id).length})` : ""}
                          </button>
                          {assignLeaderFor===a.id ? (
                            <span style={{ display:"flex", gap:"0.3rem", alignItems:"center" }}>
                              <select value={assignLeaderId} onChange={e=>setAssignLeaderId(e.target.value)} style={{ ...inp, width:"auto", fontSize:11, padding:"3px 6px" }}>
                                <option value="">Select member...</option>
                                {members.filter(m=>!leaders.find(l=>l.nation_id===m.nation_id)).map(m=>{
                                  const p = profiles?.find(p=>p.nation_id===m.nation_id);
                                  return p?<option key={m.nation_id} value={p.id}>{m.nation?.name}</option>:null;
                                })}
                              </select>
                              <button onClick={async()=>{ if(!assignLeaderId)return; const p = profiles?.find(p=>p.id===assignLeaderId); if(!p)return; await supabase.from("alliance_members").update({role:"leader"}).eq("alliance_id",a.id).eq("nation_id",p.nation_id); setAssignLeaderFor(null); setAssignLeaderId(""); onRefresh(); }} style={{ ...mkBtn(), fontSize:10, padding:"3px 8px", minHeight:26 }}>Assign</button>
                              <button onClick={()=>{setAssignLeaderFor(null);setAssignLeaderId("");}} style={{ ...mkBtn("red"), fontSize:10, padding:"3px 8px", minHeight:26 }}>×</button>
                            </span>
                          ) : (
                            <button onClick={()=>setAssignLeaderFor(a.id)} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>+ Assign Leader</button>
                          )}
                        </>
                      )}
                      {isMod && !isLead && (
                        <button onClick={()=>editAlliance(a)} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>Edit</button>
                      )}
                      {isMod && !isLead && (
                        <button onClick={()=>deleteAlliance(a)} style={{ ...mkBtn("red"), fontSize:11, padding:"5px 10px" }}>Delete</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {showRequests && (
        <div style={{ position:"fixed", inset:0, zIndex:5000, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={()=>setShowRequests(false)}>
          <div style={{ ...card, maxWidth:500, width:"100%", maxHeight:"80vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"0.75rem" }}>
              <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:14, flex:1 }}>Join Requests</h3>
              <button onClick={()=>setShowRequests(false)} style={{ ...mkBtn("ghost"), fontSize:11, padding:"4px 8px" }}>Close</button>
            </div>
            {allyRequests.length===0 ? (
              <p style={{ margin:0, color:"#8fa0bd", fontSize:13, fontStyle:"italic" }}>No pending requests.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {allyRequests.map(r=>{
                  const reqNation = nations.find(n=>n.id===r.nation_id);
                  return (
                    <div key={r.id} style={{ display:"flex", gap:"0.5rem", alignItems:"center", padding:"0.5rem", background:"rgba(255,255,255,0.03)", borderRadius:6 }}>
                      <span style={{ flex:1, fontSize:12, color:"#edf4ff" }}>{reqNation?.name||"?"} → {r.alliances?.name||"?"}</span>
                      <button onClick={()=>approveRequest(r)} style={{ ...mkBtn("green"), fontSize:10, padding:"3px 8px" }}>Approve</button>
                      <button onClick={()=>rejectRequest(r)} style={{ ...mkBtn("red"), fontSize:10, padding:"3px 8px" }}>Reject</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab==="board" && (
        <AllianceBoards allianceMembers={allianceMembers} userNation={userNation} profile={profile} alliances={alliances} showStatus={showStatus} />
      )}

      {tab==="inbox" && (
        <DiplomaticInbox profile={profile} nations={nations} showStatus={showStatus} />
      )}
    </div>
  );
};
