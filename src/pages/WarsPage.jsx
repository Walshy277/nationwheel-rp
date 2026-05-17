import { useState } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta } from "../lib/uiUtils";
import { AllianceFlag } from "../components/alliance/AllianceFlag";
import { AllianceFlagUploader } from "../components/alliance/AllianceFlagUploader";
import { NationPill } from "../components/nation/NationPill";
import { WarCard } from "../components/war/WarCard";

export const WarsPage = ({ wars, alliances, allianceMembers, warParticipants, nations, profile, userNation, isMod, onRefresh }) => {
  const [tab, setTab] = useState("wars");
  const [showWarForm, setShowWarForm] = useState(false);
  const [showAllyForm, setShowAllyForm] = useState(false);
  const [wf, setWf] = useState({ target_type:"nation", target_id:"", name:"", casus_belli:"", objective:"", casualties:"", result:"" });
  const [af, setAf] = useState({ name:"", description:"", type:"alliance" });

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
    setWf({target_type:"nation",target_id:"",name:"",casus_belli:"",objective:"",casualties:"",result:""}); setShowWarForm(false); onRefresh();
  };
  const submitAlly = async () => {
    if (!af.name.trim()) return;
    const {data} = await supabase.from("alliances").insert({name:af.name,description:af.description,type:af.type}).select().single();
    if (data && userNation) await supabase.from("alliance_members").insert({alliance_id:data.id,nation_id:userNation.id});
    setAf({name:"",description:"",type:"alliance"}); setShowAllyForm(false); onRefresh();
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Wars & Alliances</h2>
        {userNation && tab==="wars" && <button onClick={()=>setShowWarForm(!showWarForm)} style={{ ...mkBtn("red"), fontSize:12 }}>Declare War</button>}
        {userNation && tab==="alliances" && <button onClick={()=>setShowAllyForm(!showAllyForm)} style={{ ...mkBtn(), fontSize:12 }}>Form Alliance</button>}
      </div>
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem" }}>
        {[["wars","Wars"],["alliances","Alliances"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
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
                  return (
                    <div key={a.id} style={card}>
                      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.75rem", flexWrap:"wrap" }}>
                        <AllianceFlag alliance={a} size={38} />
                        <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:15, flex:1 }}>{a.name}</div>
                        <span style={{ fontSize:11, fontWeight:700, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:999, padding:"2px 10px" }}>{a.type?.toUpperCase()}</span>
                        {isMod && <AllianceFlagUploader allianceId={a.id} currentUrl={a.flag_url} onUploaded={onRefresh} />}
                        {isMod && <button onClick={editAlliance} style={{ ...mkBtn("ghost"), fontSize:11 }}>Edit</button>}
                        {isMod && <button onClick={deleteAlliance} style={{ ...mkBtn("red"), fontSize:11 }}>Delete</button>}
                      </div>
                      {a.description && <p style={{ margin:"0 0 0.75rem", color:"#b8c4d8", fontSize:12, lineHeight:1.7 }}>{a.description}</p>}
                      <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", alignItems:"center" }}>
                        {members.length === 0 && <span style={{ fontSize:12, color:"#8493ad", fontStyle:"italic" }}>No members yet.</span>}
                        {members.map(n=><NationPill key={n.id} nation={n} />)}
                        {userNation && !members.find(m=>m.id===userNation.id) && (
                          <button onClick={async()=>{await supabase.from("alliance_members").insert({alliance_id:a.id,nation_id:userNation.id});onRefresh();}} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>+ Join</button>
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
    </div>
  );
};
