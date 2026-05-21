import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, timeAgo, isNationLeader, isAllianceLeader } from "../lib/uiUtils";
import { AllianceFlag } from "../components/alliance/AllianceFlag";
import { AllianceFlagUploader } from "../components/alliance/AllianceFlagUploader";
import { NationPill } from "../components/nation/NationPill";
import { WarCard } from "../components/war/WarCard";
import { notifyWarDeclare, createMentionNotifications } from "../lib/notifications";

const WAR_TABS = { wars:"Wars", alliances:"Alliances" };

export const WarsPage = ({ wars, alliances, allianceMembers, warParticipants, nations, profiles, profile, userNation, isMod, onRefresh, onViewAlliance, initialTab, mode }) => {
  const [tab, setTab] = useState(initialTab || "wars");
  const [statusMsg, setStatusMsg] = useState(null);
  const showStatus = (msg, type="info") => { setStatusMsg({ msg, type }); setTimeout(()=>setStatusMsg(null), 4000); };
  const lockedTab = mode === "alliances" ? "alliances" : mode === "wars" ? "wars" : null;

  // War form
  const [showWarForm, setShowWarForm] = useState(false);
  const [wf, setWf] = useState({ target_type:"nation", target_id:"", name:"", casus_belli:"", objective:"", casualties:"", result:"" });

  // Alliance form
  const [showAllyForm, setShowAllyForm] = useState(false);
  const [af, setAf] = useState({ name:"", description:"", type:"alliance" });
  const [allySubmitting, setAllySubmitting] = useState(false);

  // Alliance info helpers
  const myAllyIds = allianceMembers.filter(m=>m.nation_id===userNation?.id).map(m=>m.alliance_id);
  const myAlliances = alliances.filter(a=>myAllyIds.includes(a.id));
  const isLeader = profile && isNationLeader(profile);

  // Alliance boards
  const [allyBoards, setAllyBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [boardPosts, setBoardPosts] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardAllianceId, setNewBoardAllianceId] = useState("");

  // Alliance requests
  const [allyRequests, setAllyRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  // DM inbox
  const [dms, setDms] = useState([]);
  const [dmLoading, setDmLoading] = useState(false);
  const [unreadDms, setUnreadDms] = useState(0);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  // Assign leader
  const [assignLeaderFor, setAssignLeaderFor] = useState(null);
  const [assignLeaderId, setAssignLeaderId] = useState("");

  // === Loaders ===
  useEffect(() => {
    if (tab !== "board" || !userNation) return;
    setBoardLoading(true);
    const ids = allianceMembers.filter(m=>m.nation_id===userNation.id).map(m=>m.alliance_id);
    if (!ids.length) { setBoardLoading(false); return; }
    supabase.from("alliance_boards").select("*, alliances:alliance_id(name)").in("alliance_id",ids).order("created_at",{ascending:false}).then(({data})=>{setAllyBoards(data||[]);setBoardLoading(false);});
  }, [tab, userNation?.id, allianceMembers]);

  useEffect(() => {
    if (tab !== "inbox" || !profile) return;
    setDmLoading(true);
    supabase.from("direct_messages").select("*").or(`from_id.eq.${profile.id},to_id.eq.${profile.id}`).order("created_at",{ascending:false}).limit(50).then(({data})=>{
      if (data) { setDms(data); setUnreadDms(data.filter(d=>d.to_id===profile.id&&!d.read).length); }
      setDmLoading(false);
    });
  }, [tab, profile?.id]);

  // === Actions ===
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
    setShowWarForm(false); showStatus("War declared"); onRefresh();
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
        const { error: memErr } = await supabase.from("alliance_members").insert({
          alliance_id:data.id, nation_id:userNation.id, role:"leader",
        });
        if (memErr) { showStatus(memErr.message, "error"); setAllySubmitting(false); return; }
      }
      setAf({name:"",description:"",type:"alliance"}); setShowAllyForm(false);
      showStatus(`Alliance "${af.name}" formed!`); onRefresh();
    } catch (e) { showStatus(e.message, "error"); }
    setAllySubmitting(false);
  };

  const requestJoin = async (a) => {
    const { error } = await supabase.from("alliance_requests").insert({alliance_id:a.id, nation_id:userNation.id});
    if (error) showStatus(error.message, "error"); else showStatus("Join request sent");
  };

  const leaveAlliance = async (a) => {
    if (!confirm(`Leave ${a.name}?`)) return;
    const { error } = await supabase.from("alliance_members").delete().eq("alliance_id",a.id).eq("nation_id",userNation.id);
    if (error) showStatus(error.message, "error"); else { showStatus(`Left ${a.name}`); onRefresh(); }
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
    if (error) showStatus(error.message, "error"); else { showStatus("Alliance deleted"); onRefresh(); }
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

  const loadRequests = async () => {
    const ids = allianceMembers.filter(m=>m.nation_id===userNation?.id&&m.role==="leader").map(m=>m.alliance_id);
    if (!ids.length) { setAllyRequests([]); return; }
    const { data } = await supabase.from("alliance_requests").select("*, nations!alliance_requests_nation_id_fkey(name,flag_url)").in("alliance_id",ids).eq("status","pending").order("created_at",{ascending:false});
    setAllyRequests(data||[]);
  };

  const loadBoardPosts = async (boardId) => {
    setSelectedBoard(boardId);
    setBoardPosts([]);
    const { data } = await supabase.from("alliance_board_posts").select("*").eq("board_id",boardId).order("created_at",{ascending:true});
    setBoardPosts(data||[]);
  };

  const postToBoard = async () => {
    if (!newPost.trim() || !selectedBoard) return;
    const { error } = await supabase.from("alliance_board_posts").insert({board_id:selectedBoard, author_id:profile.id, body:newPost});
    if (error) showStatus(error.message, "error"); else { setNewPost(""); loadBoardPosts(selectedBoard); }
  };

  const createBoard = async () => {
    if (!newBoardName.trim() || !newBoardAllianceId) return;
    const { error } = await supabase.from("alliance_boards").insert({alliance_id:newBoardAllianceId, title:newBoardName});
    if (error) showStatus(error.message, "error"); else { setShowNewBoard(false); setNewBoardName(""); setNewBoardAllianceId(""); loadAllyBoards(); }
  };

  const loadAllyBoards = async () => {
    const ids = allianceMembers.filter(m=>m.nation_id===userNation?.id).map(m=>m.alliance_id);
    if (!ids.length) return;
    const { data } = await supabase.from("alliance_boards").select("*, alliances:alliance_id(name)").in("alliance_id",ids).order("created_at",{ascending:false});
    setAllyBoards(data||[]);
  };

  const sendDm = async () => {
    if (!composeTo.trim()||!composeSubject.trim()) return;
    const { error } = await supabase.from("direct_messages").insert({from_id:profile.id, to_id:composeTo, subject:composeSubject, body:composeBody||null});
    if (error) showStatus(error.message, "error"); else { setShowCompose(false); setComposeTo(""); setComposeSubject(""); setComposeBody(""); showStatus("Message sent"); }
  };

  // === Alliance helpers ===
  const getMembers = (a) => allianceMembers.filter(m=>m.alliance_id===a.id).map(m=>({...m, nation:nations.find(n=>n.id===m.nation_id)})).filter(m=>m.nation);
  const getLeaders = (a) => getMembers(a).filter(m=>m.role==="leader");
  const isMember = (a) => getMembers(a).some(m=>m.nation_id===userNation?.id);
  const isAllyLeader = (a) => getLeaders(a).some(m=>m.nation_id===userNation?.id);

  // === Nav items ===
  const getTabs = () => {
    const items = [["wars","Wars"], ["alliances","Alliances"]];
    if (isLeader) items.push(["board","Boards"], ["inbox",`Inbox${unreadDms?` (${unreadDms})`:""}`]);
    return items;
  };

  // ==== RENDER ====
  return (
    <div>
      <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>{mode==="alliances"?"Alliances":"Wars"}</h2>
        <div style={{ fontSize:11, color:"#8fa0bd", display:"flex", gap:"0.35rem" }}>
          {mode!=="alliances" && <span>{wars.filter(w=>w.status!=="peace").length} active</span>}
          {mode!=="alliances" && mode!=="wars" && <span>|</span>}
          {mode!=="wars" && <span>{alliances.length} alliances</span>}
        </div>
        {userNation && !lockedTab && tab==="wars" && isLeader && (
          <button onClick={()=>setShowWarForm(!showWarForm)} style={{ ...mkBtn("red"), fontSize:12 }}>{showWarForm?"Cancel":"Declare War"}</button>
        )}
        {userNation && !lockedTab && tab==="alliances" && isLeader && (
          <button onClick={()=>setShowAllyForm(!showAllyForm)} style={{ ...mkBtn(), fontSize:12 }}>{showAllyForm?"Cancel":"Form Alliance"}</button>
        )}
      </div>

      {statusMsg && <div style={{ padding:"0.6rem 1rem", marginBottom:"0.75rem", borderRadius:6, background:statusMsg.type==="error"?"rgba(231,76,60,0.12)":"rgba(46,204,113,0.12)", border:`1px solid ${statusMsg.type==="error"?"rgba(231,76,60,0.3)":"rgba(46,204,113,0.3)"}`, color:statusMsg.type==="error"?"#e74c3c":"#2ecc71", fontSize:12 }}>{statusMsg.msg}</div>}

      {/* Tabs */}
      {!lockedTab && (
        <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem", flexWrap:"wrap" }}>
          {getTabs().map(([t,l])=>(
            <button key={t} onClick={()=>{setTab(t);if(t==="board")loadAllyBoards();if(t==="inbox")setDmLoading(true);}} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
          ))}
        </div>
      )}

      {/* ===== WARS TAB ===== */}
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

      {/* ===== ALLIANCES TAB ===== */}
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
                          <button onClick={async()=>{
                            await loadRequests();
                            setShowRequests(true);
                          }} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>
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
                              <button onClick={async()=>{
                                if(!assignLeaderId)return;
                                const p = profiles?.find(p=>p.id===assignLeaderId);
                                if(!p)return;
                                await supabase.from("alliance_members").update({role:"leader"}).eq("alliance_id",a.id).eq("nation_id",p.nation_id);
                                setAssignLeaderFor(null); setAssignLeaderId(""); onRefresh();
                              }} style={{ ...mkBtn(), fontSize:10, padding:"3px 8px", minHeight:26 }}>Assign</button>
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

      {/* ===== REQUESTS MODAL ===== */}
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

      {/* ===== BOARDS TAB ===== */}
      {tab==="board" && (
        <div>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap" }}>
            <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:15, flex:1 }}>{selectedBoard?"Board Posts":"Alliance Boards"}</h3>
            {selectedBoard ? (
              <button onClick={()=>setSelectedBoard(null)} style={{ ...mkBtn("ghost"), fontSize:11 }}>Back</button>
            ) : (
              <button onClick={()=>setShowNewBoard(!showNewBoard)} style={{ ...mkBtn(), fontSize:11 }}>{showNewBoard?"Cancel":"New Board"}</button>
            )}
          </div>
          {showNewBoard && !selectedBoard && (
            <div style={{ ...card, marginBottom:"1rem" }}>
              <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                <select value={newBoardAllianceId} onChange={e=>setNewBoardAllianceId(e.target.value)} style={{ ...inp, width:"auto", flex:1 }}>
                  <option value="">Select alliance...</option>
                  {myAlliances.filter(a=>isAllyLeader(a)).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <input placeholder="Board title" value={newBoardName} onChange={e=>setNewBoardName(e.target.value)} style={{ ...inp, flex:1 }} />
                <button onClick={createBoard} style={mkBtn()}>Create</button>
              </div>
            </div>
          )}
          {!selectedBoard && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {boardLoading ? (
                <div style={{ ...card, textAlign:"center", padding:"2rem", color:"#8493ad" }}>Loading boards...</div>
              ) : allyBoards.length===0 ? (
                <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
                  <div style={{ color:"#8493ad", fontStyle:"italic", fontSize:13 }}>No discussion boards for your alliances.</div>
                </div>
              ) : allyBoards.map(b=>(
                <div key={b.id} style={{ ...card, cursor:"pointer", padding:"0.85rem" }} onClick={()=>loadBoardPosts(b.id)}>
                  <div style={{ fontSize:13, color:"#edf4ff", fontWeight:700 }}>{b.title}</div>
                  <div style={{ fontSize:11, color:"#8fa0bd" }}>{b.alliances?.name||"?"}</div>
                </div>
              ))}
            </div>
          )}
          {selectedBoard && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              {boardPosts.length===0 && <div style={{ ...card, textAlign:"center", padding:"1.5rem", color:"#8493ad", fontStyle:"italic", fontSize:13 }}>No posts yet.</div>}
              {boardPosts.map(p=>{
                const author = profiles?.find(pr=>pr.id===p.author_id);
                return (
                  <div key={p.id} style={card}>
                    <div style={{ fontSize:11, color:"#8fa0bd", marginBottom:"0.35rem" }}>{author?.username||"?"} · {timeAgo(p.created_at)}</div>
                    <div className="rich-post">{p.body}</div>
                  </div>
                );
              })}
              <div style={{ display:"flex", gap:"0.5rem" }}>
                <textarea value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="Write a post..." style={{ ...ta, flex:1, minHeight:60 }} />
                <button onClick={postToBoard} style={{ ...mkBtn(), alignSelf:"flex-end" }}>Post</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== INBOX TAB ===== */}
      {tab==="inbox" && (
        <div>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap" }}>
            <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:15, flex:1 }}>Diplomatic Inbox</h3>
            <button onClick={()=>setShowCompose(!showCompose)} style={{ ...mkBtn(), fontSize:11 }}>{showCompose?"Cancel":"Compose"}</button>
          </div>
          {showCompose && (
            <div style={{ ...card, marginBottom:"1rem" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                <select value={composeTo} onChange={e=>setComposeTo(e.target.value)} style={inp}>
                  <option value="">Select recipient (nation leader)...</option>
                  {nations.filter(n=>n.id!==userNation?.id).map(n=>{
                    const lp = profiles?.find(p=>p.nation_id===n.id);
                    return lp?<option key={n.id} value={lp.id}>{n.name} ({lp.username})</option>:null;
                  })}
                </select>
                <input placeholder="Subject" value={composeSubject} onChange={e=>setComposeSubject(e.target.value)} style={inp} />
                <textarea placeholder="Message" value={composeBody} onChange={e=>setComposeBody(e.target.value)} style={{ ...ta, minHeight:80 }} />
                <button onClick={sendDm} style={mkBtn()}>Send Message</button>
              </div>
            </div>
          )}
          {dmLoading ? (
            <div style={{ ...card, textAlign:"center", padding:"2rem", color:"#8493ad" }}>Loading messages...</div>
          ) : dms.length===0 ? (
            <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
              <div style={{ color:"#8493ad", fontStyle:"italic", fontSize:13 }}>No messages yet.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {dms.map(dm=>{
                const from = profiles?.find(p=>p.id===dm.from_id);
                const to = profiles?.find(p=>p.id===dm.to_id);
                const isIncoming = dm.to_id===profile?.id;
                return (
                  <div key={dm.id} style={{ ...card, opacity:isIncoming&&!dm.read?1:0.7 }}>
                    <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"0.3rem" }}>
                      <span style={{ fontSize:11, color:"#8fa0bd" }}>{isIncoming?"From":"To"} <strong style={{ color:"#edf4ff" }}>{isIncoming?from?.username:to?.username}</strong></span>
                      {isIncoming && !dm.read && <span style={{ fontSize:9, fontWeight:700, color:"#f6c132", background:"rgba(246,193,50,0.12)", borderRadius:3, padding:"1px 5px" }}>NEW</span>}
                      <span style={{ fontSize:10, color:"#8fa0bd", marginLeft:"auto" }}>{timeAgo(dm.created_at)}</span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:12, color:"#edf4ff", marginBottom:"0.25rem" }}>{dm.subject}</div>
                    {dm.body && <div style={{ fontSize:12, color:"#b8c4d8", lineHeight:1.6 }}>{dm.body}</div>}
                    {isIncoming && !dm.read && (
                      <button onClick={async()=>{await supabase.from("direct_messages").update({read:true}).eq("id",dm.id); setDms(dms.map(d=>d.id===dm.id?{...d,read:true}:d));}} style={{ ...mkBtn("ghost"), fontSize:10, padding:"3px 8px", marginTop:"0.4rem" }}>Mark Read</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
