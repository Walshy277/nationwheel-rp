import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, timeAgo, isLoreTeam, isNationLeader, isAllianceLeader } from "../lib/uiUtils";
import { AllianceFlag } from "../components/alliance/AllianceFlag";
import { AllianceFlagUploader } from "../components/alliance/AllianceFlagUploader";
import { NationPill } from "../components/nation/NationPill";
import { WarCard } from "../components/war/WarCard";
import { notifyWarDeclare, createMentionNotifications } from "../lib/notifications";

export const WarsPage = ({ wars, alliances, allianceMembers, warParticipants, nations, profiles, profile, userNation, isMod, onRefresh }) => {
  const [tab, setTab] = useState("wars");
  const [showWarForm, setShowWarForm] = useState(false);
  const [showAllyForm, setShowAllyForm] = useState(false);
  const [wf, setWf] = useState({ target_type:"nation", target_id:"", name:"", casus_belli:"", objective:"", casualties:"", result:"" });
  const [af, setAf] = useState({ name:"", description:"", type:"alliance" });
  const isLeader = profile && isNationLeader(profile);
  const myAllyIds = allianceMembers.filter(m=>m.nation_id===userNation?.id).map(m=>m.alliance_id);
  const myAlliances = alliances.filter(a=>myAllyIds.includes(a.id));
  const isAllyLeader = allianceMembers.some(m=>m.nation_id===userNation?.id && m.role==="leader");

  // Inbox state
  const [dms, setDms] = useState([]);
  const [dmLoading, setDmLoading] = useState(false);
  const [showComposeDm, setShowComposeDm] = useState(false);
  const [dmTo, setDmTo] = useState("");
  const [dmSubject, setDmSubject] = useState("");
  const [dmBody, setDmBody] = useState("");
  const [unreadDms, setUnreadDms] = useState(0);

  // Alliance boards state
  const [allyBoards, setAllyBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [boardPosts, setBoardPosts] = useState([]);
  const [newBoardPost, setNewBoardPost] = useState("");
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardAllianceId, setNewBoardAllianceId] = useState("");
  const [newBoardTitle, setNewBoardTitle] = useState("");

  // Alliance requests state
  const [allyRequests, setAllyRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  // Assign alliance leader state
  const [assignLeaderFor, setAssignLeaderFor] = useState(null);
  const [assignLeaderProfileId, setAssignLeaderProfileId] = useState("");

  const loadDms = async () => {
    if (!profile) return;
    setDmLoading(true);
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`from_id.eq.${profile.id},to_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error && !/does not exist|could not find/i.test(error.message || "")) console.warn(error.message);
    setDms(data || []);
    setUnreadDms((data || []).filter(d => d.to_id === profile.id && !d.read).length);
    setDmLoading(false);
  };

  const loadAllyRequests = async () => {
    const myAllyIds = allianceMembers.filter(m => m.nation_id === userNation?.id).map(m => m.alliance_id);
    if (!myAllyIds.length) return;
    const { data, error } = await supabase
      .from("alliance_requests")
      .select("*, nations:alliance_id(name)")
      .in("alliance_id", myAllyIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error && !/does not exist|could not find/i.test(error.message || "")) console.warn(error.message);
    setAllyRequests(data || []);
  };

  const loadAllyBoards = async () => {
    const myAllyIds = allianceMembers.filter(m => m.nation_id === userNation?.id).map(m => m.alliance_id);
    if (!myAllyIds.length) return;
    const { data, error } = await supabase
      .from("alliance_boards")
      .select("*, alliances:alliance_id(name)")
      .in("alliance_id", myAllyIds)
      .order("created_at", { ascending: false });
    if (error && !/does not exist|could not find/i.test(error.message || "")) console.warn(error.message);
    setAllyBoards(data || []);
  };

  useEffect(() => {
    if (tab === "board") {
      setSelectedBoard(null);
      const myIds = allianceMembers.filter(m => m.nation_id === userNation?.id).map(m => m.alliance_id);
      if (myIds.length) supabase.from("alliance_boards").select("*, alliances:alliance_id(name)").in("alliance_id", myIds).order("created_at",{ascending:false}).then(({data})=>setAllyBoards(data||[]));
    }
    if (tab === "inbox" && profile) {
      supabase.from("direct_messages").select("*").or(`from_id.eq.${profile.id},to_id.eq.${profile.id}`).order("created_at",{ascending:false}).limit(50).then(({data})=>{
        if (data) { setDms(data); setUnreadDms(data.filter(d=>d.to_id===profile.id&&!d.read).length); }
      });
    }
  }, [tab, profile?.id, userNation?.id, allianceMembers, profile]);

  const submitWar = async () => {
    if (!wf.target_id||!userNation) return;
    const legacyDefender = wf.target_type === "nation" ? wf.target_id : null;
    let { data, error } = await supabase.from("wars").insert({ aggressor_id:userNation.id, defender_id:legacyDefender, name:wf.name, casus_belli:wf.casus_belli, objective:wf.objective||null, casualties:wf.casualties||null, result:wf.result||null, outcome:wf.result||null }).select().single();
    if (error && /objective|casualties|result|schema cache|column/i.test(error.message || "")) {
      const retry = await supabase.from("wars").insert({
        aggressor_id:userNation.id,
        defender_id:legacyDefender,
        name:wf.name,
        casus_belli:wf.casus_belli,
        outcome:[wf.objective && `Objective: ${wf.objective}`, wf.casualties && `Casualties: ${wf.casualties}`, wf.result && `Result: ${wf.result}`].filter(Boolean).join("\n") || null,
      }).select().single();
      data = retry.data;
      error = retry.error;
    }
    if (error) {
      alert(error.message);
      return;
    }
    const participants = [
      { war_id:data.id, side:"attacker", nation_id:userNation.id, alliance_id:null },
      { war_id:data.id, side:"defender", nation_id:wf.target_type==="nation" ? wf.target_id : null, alliance_id:wf.target_type==="alliance" ? wf.target_id : null },
    ];
    const inserted = await supabase.from("war_participants").insert(participants);
    if (inserted.error) alert(inserted.error.message);
    notifyWarDeclare({ war:data, aggressorNationName:userNation?.name || "Unknown", allProfiles:profiles || [] });
    createMentionNotifications({ body:wf.casus_belli, sourceTitle:data.name || `War: ${userNation?.name}`, sourceLink:"/wars", sourceType:"war" });
    setWf({target_type:"nation",target_id:"",name:"",casus_belli:"",objective:"",casualties:"",result:""}); setShowWarForm(false); onRefresh();
  };
  const submitAlly = async () => {
    if (!af.name.trim()) return;
    const {data} = await supabase.from("alliances").insert({name:af.name,description:af.description,type:af.type}).select().single();
    if (data && userNation) await supabase.from("alliance_members").insert({alliance_id:data.id,nation_id:userNation.id,role:"leader"});
    setAf({name:"",description:"",type:"alliance"}); setShowAllyForm(false); onRefresh();
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Wars & Alliances</h2>
        {userNation && tab==="wars" && <button onClick={()=>setShowWarForm(!showWarForm)} style={{ ...mkBtn("red"), fontSize:12 }}>Declare War</button>}
        {userNation && tab==="alliances" && <button onClick={()=>setShowAllyForm(!showAllyForm)} style={{ ...mkBtn(), fontSize:12 }}>Form Alliance</button>}
      </div>
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem", flexWrap:"wrap" }}>
        {[["wars","Wars"],["alliances","Alliances"], ...(isLeader ? [["board","Alliance Boards"],["inbox",`Inbox${unreadDms?` (${unreadDms})`:""}`]] : [])].map(([t,l])=>(
          <button key={t} onClick={()=>{setTab(t);if(t==="board")loadAllyBoards();if(t==="inbox")loadDms();}} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
        ))}
      </div>

      {tab==="wars" && (
        <div>
          {showWarForm && (
            <div style={{ ...card, border:"1px solid rgba(231,76,60,0.25)", marginBottom:"1rem" }}>
              <h3 style={{ margin:"0 0 1rem", fontFamily:"var(--display)", color:"#e74c3c", fontSize:14 }}>Declare War - {userNation?.name}</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                <select value={wf.target_type} onChange={e=>setWf({...wf,target_type:e.target.value,target_id:""})} style={inp}>
                  <option value="nation">Target nation</option>
                  <option value="alliance">Target alliance</option>
                </select>
                <select value={wf.target_id} onChange={e=>setWf({...wf,target_id:e.target.value})} style={inp}>
                  <option value="">Select target {wf.target_type}</option>
                  {wf.target_type==="nation"
                    ? nations.filter(n=>n.id!==userNation?.id).map(n=><option key={n.id} value={n.id}>{n.name}</option>)
                    : alliances.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <input placeholder="War name (optional)" value={wf.name} onChange={e=>setWf({...wf,name:e.target.value})} style={inp} />
                <input placeholder="War objective" value={wf.objective} onChange={e=>setWf({...wf,objective:e.target.value})} style={inp} />
                <input placeholder="Expected casualties / losses" value={wf.casualties} onChange={e=>setWf({...wf,casualties:e.target.value})} style={inp} />
                <input placeholder="End result / terms (optional)" value={wf.result} onChange={e=>setWf({...wf,result:e.target.value})} style={inp} />
                <textarea placeholder="Casus belli - justification for war" value={wf.casus_belli} onChange={e=>setWf({...wf,casus_belli:e.target.value})} style={{ ...ta, minHeight:60 }} />
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button onClick={submitWar} style={mkBtn("red")}>Declare War</button>
                  <button onClick={()=>setShowWarForm(false)} style={mkBtn("ghost")}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {wars.length===0 ? (
              <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
                <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:16, marginBottom:"0.35rem" }}>The world is at peace.</div>
                <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>No active wars recorded. Declare one using the button above.</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"-0.25rem" }}>{wars.length} war{wars.length!==1?"s":""} recorded</div>
                {wars.filter(w=>w.status==="active"||w.status==="ceasefire"||w.status==="stalemate").map(w=><WarCard key={w.id} war={w} nations={nations} alliances={alliances} participants={warParticipants} isMod={isMod} onRefresh={onRefresh} />)}
                {wars.filter(w=>w.status==="peace"||w.status==="frozen").length > 0 && (
                  <>
                    <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:"0.75rem" }}>Historical Wars</div>
                    {wars.filter(w=>w.status==="peace"||w.status==="frozen").map(w=><WarCard key={w.id} war={w} nations={nations} alliances={alliances} participants={warParticipants} isMod={isMod} onRefresh={onRefresh} />)}
                  </>
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
                  <button onClick={submitAlly} style={mkBtn()}>Form Alliance</button>
                  <button onClick={()=>setShowAllyForm(false)} style={mkBtn("ghost")}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {alliances.length===0 ? (
              <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
                <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:16, marginBottom:"0.35rem" }}>No alliances yet.</div>
                <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>No pacts or alliances have been formed. Create one using the button above.</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase" }}>{alliances.length} alliance{alliances.length!==1?"s":""} formed</div>
                {alliances.map(a=>{
                  const members = allianceMembers.filter(m=>m.alliance_id===a.id).map(m=>nations.find(n=>n.id===m.nation_id)).filter(Boolean);
                  const isMember = members.some(m => m.id === userNation?.id);
                  const aLeaderIds = allianceMembers.filter(m=>m.alliance_id===a.id&&m.role==="leader").map(m=>m.nation_id);
                  const isAllyLeaderForThis = userNation && aLeaderIds.includes(userNation.id);
                  const editAlliance = async () => {
                    const name = prompt("Alliance name", a.name);
                    if (!name) return;
                    const description = prompt("Alliance description", a.description || "") ?? a.description;
                    const type = prompt("Alliance type", a.type || "alliance") || a.type;
                    const { error } = await supabase.from("alliances").update({ name, description, type }).eq("id", a.id);
                    if (error) alert(error.message); else onRefresh();
                  };
                  const deleteAlliance = async () => {
                    if (!confirm("Delete this alliance?")) return;
                    const { error } = await supabase.from("alliances").delete().eq("id", a.id);
                    if (error) alert(error.message); else onRefresh();
                  };
                  const requestJoin = async () => {
                    const { error } = await supabase.from("alliance_requests").insert({alliance_id:a.id,nation_id:userNation.id});
                    if (error) alert(error.message);
                    else alert("Join request sent to alliance leadership.");
                  };
                  const leaveAlliance = async () => {
                    if (!confirm(`Leave ${a.name}?`)) return;
                    const { error } = await supabase.from("alliance_members").delete().eq("alliance_id", a.id).eq("nation_id", userNation.id);
                    if (error) alert(error.message); else onRefresh();
                  };
                  return (
                    <div key={a.id} style={card}>
                      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.75rem", flexWrap:"wrap" }}>
                        <AllianceFlag alliance={a} size={38} />
                        <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:15, flex:1 }}>{a.name}</div>
                        <span style={{ fontSize:11, fontWeight:700, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:999, padding:"2px 10px" }}>{a.type?.toUpperCase()}</span>
                        {isMod && <AllianceFlagUploader allianceId={a.id} currentUrl={a.flag_url} onUploaded={onRefresh} />}
                        {isMod && <button onClick={editAlliance} style={{ ...mkBtn("ghost"), fontSize:11 }}>Edit</button>}
                        {isMod && <button onClick={deleteAlliance} style={{ ...mkBtn("red"), fontSize:11 }}>Delete</button>}
                        {isAllyLeaderForThis && (
                          <>
                            {assignLeaderFor===a.id ? (
                              <div style={{ display:"flex", gap:"0.4rem", alignItems:"center" }}>
                                <select value={assignLeaderProfileId} onChange={e=>setAssignLeaderProfileId(e.target.value)} style={{ ...inp, width:"auto", fontSize:11, padding:"3px 6px" }}>
                                  <option value="">Select member...</option>
                                  {members.map(n=>{
                                    const mProfile = profiles?.find(p=>p.nation_id===n.id);
                                    const alreadyLeader = aLeaderIds.includes(n.id);
                                    return mProfile && !alreadyLeader ? <option key={n.id} value={mProfile.id}>{n.name}</option> : null;
                                  })}
                                </select>
                                <button onClick={async()=>{
                                  if(!assignLeaderProfileId)return;
                                  await supabase.from("alliance_members").update({role:"leader"}).eq("alliance_id",a.id).eq("nation_id",profiles?.find(p=>p.id===assignLeaderProfileId)?.nation_id);
                                  setAssignLeaderFor(null);setAssignLeaderProfileId("");onRefresh();
                                }} style={{ ...mkBtn(), fontSize:10, padding:"3px 8px", minHeight:26 }}>Assign</button>
                                <button onClick={()=>{setAssignLeaderFor(null);setAssignLeaderProfileId("");}} style={{ ...mkBtn("red"), fontSize:10, padding:"3px 8px", minHeight:26 }}>×</button>
                              </div>
                            ) : (
                              <button onClick={()=>setAssignLeaderFor(a.id)} style={{ ...mkBtn("ghost"), fontSize:11 }}>+ Assign Leader</button>
                            )}
                          </>
                        )}
                      </div>
                      {a.description && <p style={{ margin:"0 0 0.75rem", color:"#b8c4d8", fontSize:12, lineHeight:1.7 }}>{a.description}</p>}
                      <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", alignItems:"center" }}>
                        {members.length === 0 && <span style={{ fontSize:12, color:"#8493ad", fontStyle:"italic" }}>No members yet.</span>}
                        {members.map(n=><span key={n.id} style={{ display:"inline-flex", alignItems:"center", gap:"0.25rem" }}><NationPill nation={n} />{aLeaderIds.includes(n.id) ? <span style={{ fontSize:8, color:"#d4af37", fontWeight:700, letterSpacing:"0.05em", background:"rgba(212,175,55,0.12)",borderRadius:4,padding:"1px 5px" }}>LEADER</span> : null}</span>)}
                        {userNation && !isMember && isLeader && (
                          <button onClick={requestJoin} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>+ Request to Join</button>
                        )}
                        {userNation && isMember && (
                          <button onClick={leaveAlliance} style={{ ...mkBtn("red"), fontSize:11, padding:"5px 10px" }}>Leave</button>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:"#8fa0bd", marginTop:"0.5rem" }}>{members.length} member{members.length!==1?"s":""}</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {tab==="board" && (
        <div>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap" }}>
            <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:15, flex:1 }}>Alliance Discussion Boards</h3>
            {showRequests && isAllyLeader && (
              <button onClick={()=>setShowRequests(false)} style={{ ...mkBtn("ghost"), fontSize:11 }}>Back to Boards</button>
            )}
          </div>
          {showRequests ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase" }}>Pending Join Requests</div>
              {allyRequests.length === 0 && <p style={{ color:"#8493ad", fontStyle:"italic", fontSize:13 }}>No pending requests.</p>}
              {allyRequests.map(r => {
                const reqNation = nations.find(n => n.id === r.nation_id);
                const reqAlliance = alliances.find(a => a.id === r.alliance_id);
                const approveRequest = async () => {
                  await supabase.from("alliance_members").insert({alliance_id:r.alliance_id,nation_id:r.nation_id});
                  await supabase.from("alliance_requests").update({status:"approved"}).eq("id", r.id);
                  onRefresh();
                };
                const rejectRequest = async () => {
                  await supabase.from("alliance_requests").update({status:"rejected"}).eq("id", r.id);
                  onRefresh();
                };
                return (
                  <div key={r.id} style={{ ...card, padding:"0.85rem", display:"flex", alignItems:"center", gap:"0.75rem" }}>
                    <div style={{ flex:1 }}><strong style={{ color:"#edf4ff" }}>{reqNation?.name || "?"}</strong> wants to join <span style={{ color:"#d4af37" }}>{reqAlliance?.name || "?"}</span></div>
                    <button onClick={approveRequest} style={{ ...mkBtn("green"), fontSize:11, minHeight:30 }}>Approve</button>
                    <button onClick={rejectRequest} style={{ ...mkBtn("red"), fontSize:11, minHeight:30 }}>Reject</button>
                  </div>
                );
              })}
            </div>
          ) : selectedBoard ? (
            <div>
              <button onClick={()=>setSelectedBoard(null)} style={{ ...mkBtn("ghost"), marginBottom:"0.75rem", fontSize:11 }}>← Back to Boards</button>
              <div style={{ ...card, marginBottom:"0.75rem" }}>
                <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>{selectedBoard.title}</h3>
                <div style={{ display:"flex", gap:"0.4rem" }}>
                  <textarea value={newBoardPost} onChange={e=>setNewBoardPost(e.target.value)} placeholder="Write a post..." style={{ ...ta, minHeight:60, flex:1 }} />
                  <button onClick={async()=>{if(!newBoardPost.trim())return;await supabase.from("alliance_board_posts").insert({board_id:selectedBoard.id,author_id:profile.id,body:newBoardPost});setNewBoardPost("");loadAllyBoards();}} style={{ ...mkBtn(), alignSelf:"flex-end" }}>Post</button>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {boardPosts.length === 0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"1rem", fontStyle:"italic" }}>No posts in this board yet.</p>}
                {boardPosts.map(p => (
                  <div key={p.id} style={{ ...card, padding:"0.85rem" }}>
                    <div style={{ fontSize:11, color:"#8fa0bd", marginBottom:"0.35rem" }}>{(profiles?.find(pr=>pr.id===p.author_id)?.username||"?")} · {timeAgo(p.created_at)}</div>
                    <div style={{ color:"#d7e2f2", fontSize:13, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{p.body}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              {isAllyLeader && <button onClick={async()=>{setShowRequests(true);await loadAllyRequests();}} style={{ ...mkBtn("ghost"), alignSelf:"flex-start", fontSize:11 }}>View Pending Join Requests</button>}
              {showNewBoardForm && (
                <div style={{ ...card, padding:"0.85rem", border:"1px solid rgba(212,175,55,0.28)" }}>
                  <div style={{ fontSize:11, color:"#8fa0bd", marginBottom:"0.5rem" }}>Create a new board</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                    <select value={newBoardAllianceId} onChange={e=>setNewBoardAllianceId(e.target.value)} style={inp}>
                      <option value="">Select alliance...</option>
                      {myAlliances.map(a => {
                        const leaderIds = allianceMembers.filter(m=>m.alliance_id===a.id&&m.role==="leader").map(m=>m.nation_id);
                        const isLeaderForThis = userNation && leaderIds.includes(userNation.id);
                        return isLeaderForThis ? <option key={a.id} value={a.id}>{a.name}</option> : null;
                      })}
                    </select>
                    <input placeholder="Board title" value={newBoardTitle} onChange={e=>setNewBoardTitle(e.target.value)} style={inp} />
                    <div style={{ display:"flex", gap:"0.5rem" }}>
                      <button onClick={async()=>{
                        if(!newBoardAllianceId||!newBoardTitle.trim())return;
                        await supabase.from("alliance_boards").insert({alliance_id:newBoardAllianceId,title:newBoardTitle});
                        setNewBoardAllianceId("");setNewBoardTitle("");setShowNewBoardForm(false);
                        loadAllyBoards();
                      }} style={{ ...mkBtn(), fontSize:11 }}>Create Board</button>
                      <button onClick={()=>{setShowNewBoardForm(false);setNewBoardAllianceId("");setNewBoardTitle("");}} style={{ ...mkBtn("ghost"), fontSize:11 }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              {allyBoards.length === 0 && !showNewBoardForm && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No alliance boards yet.</p>}
              {allyBoards.map(b => (
                <div key={b.id} style={{ ...card, cursor:"pointer", padding:"0.85rem" }}
                  onClick={async()=>{
                    setSelectedBoard(b);
                    const {data} = await supabase.from("alliance_board_posts").select("*, profiles:author_id(username)").eq("board_id",b.id).order("created_at",{ascending:false});
                    setBoardPosts(data||[]);
                  }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#edf4ff" }}>{b.title}</div>
                  <div style={{ fontSize:11, color:"#8fa0bd", marginTop:2 }}>{b.alliances?.name || "Alliance board"}</div>
                </div>
              ))}
              {isAllyLeader && !showNewBoardForm && (
                <button onClick={()=>setShowNewBoardForm(true)} style={{ ...mkBtn("ghost"), alignSelf:"center", fontSize:11 }}>+ New Board</button>
              )}
            </div>
          )}
        </div>
      )}

      {tab==="inbox" && (
        <div>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap" }}>
            <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:15, flex:1 }}>Leader Inbox{unreadDms>0?<span style={{ color:"#e74c3c", fontSize:13 }}> ({unreadDms} unread)</span>:""}</h3>
            <button onClick={()=>setShowComposeDm(!showComposeDm)} style={{ ...mkBtn(), fontSize:11 }}>{showComposeDm?"Cancel":"Compose"}</button>
          </div>
          {showComposeDm && (
            <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1rem" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                <select value={dmTo} onChange={e=>setDmTo(e.target.value)} style={inp}>
                  <option value="">Select recipient (leader)</option>
                  {profiles?.filter(p=>p.id!==profile?.id && isNationLeader(p)).map(p=>{
                    const nat = nations.find(n=>n.id===p.nation_id);
                    return <option key={p.id} value={p.id}>{p.username}{nat?` (${nat.name})`:""}</option>;
                  })}
                </select>
                <input placeholder="Subject" value={dmSubject} onChange={e=>setDmSubject(e.target.value)} style={inp} />
                <textarea placeholder="Message" value={dmBody} onChange={e=>setDmBody(e.target.value)} style={{ ...ta, minHeight:90 }} />
                <button onClick={async()=>{if(!dmTo||!dmBody.trim())return;await supabase.from("direct_messages").insert({from_id:profile.id,to_id:dmTo,subject:dmSubject.trim()||null,body:dmBody});setDmTo("");setDmSubject("");setDmBody("");setShowComposeDm(false);loadDms();}} style={mkBtn()}>Send Message</button>
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {dmLoading && <p style={{ color:"#8493ad", textAlign:"center", padding:"1rem" }}>Loading...</p>}
            {!dmLoading && dms.length === 0 && (
              <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
                <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:15, marginBottom:"0.35rem" }}>No messages yet.</div>
                <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>Send a message to another nation leader using the Compose button.</p>
              </div>
            )}
            {dms.map(dm => {
              const other = dm.from_id === profile?.id
                ? profiles?.find(p => p.id === dm.to_id)
                : profiles?.find(p => p.id === dm.from_id);
              const isUnread = dm.to_id === profile?.id && !dm.read;
              return (
                <div key={dm.id} style={{ ...card, padding:"0.85rem", borderLeft: isUnread ? "3px solid #d4af37" : "1px solid rgba(78,128,190,0.24)", cursor:"pointer" }}
                  onClick={async()=>{if(isUnread){await supabase.from("direct_messages").update({read:true}).eq("id",dm.id);loadDms();}}}>
                  <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
                    <strong style={{ color:"#d4af37", fontSize:13 }}>{other?.username || "?"}</strong>
                    {dm.subject && <span style={{ color:"#edf4ff", fontWeight:isUnread?700:500, fontSize:13 }}>{dm.subject}</span>}
                    <span style={{ marginLeft:"auto", fontSize:10, color:"#8fa0bd" }}>{timeAgo(dm.created_at)}{dm.from_id===profile?.id?" (sent)":""}</span>
                  </div>
                  <div style={{ color:"#8fa0bd", fontSize:12, marginTop:"0.25rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{dm.body}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
