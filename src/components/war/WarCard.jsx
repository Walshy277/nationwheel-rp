import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { WarParticipantPill } from "./WarParticipantPill";
import { card, mkBtn, inp, ta, WAR_COL } from "../../lib/uiUtils";

export const WarCard = ({ war, nations, alliances = [], participants = [], isMod, onRefresh }) => {
  const agg = nations?.find(n=>n.id===war.aggressor_id) || war.aggressor;
  const def = nations?.find(n=>n.id===war.defender_id) || war.defender;
  const warParticipants = participants.filter(p=>p.war_id===war.id);
  const attackers = warParticipants.filter(p=>p.side==="attacker");
  const defenders = warParticipants.filter(p=>p.side==="defender");
  const hasParticipants = warParticipants.length > 0;
  const [addForm, setAddForm] = useState({ side:"attacker", type:"nation", id:"" });
  const [ceasefireDays, setCeasefireDays] = useState(war.ceasefire_days || 3);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ name:war.name||"", casus_belli:war.casus_belli||"", objective:war.objective||"", casualties:war.casualties||"", result:war.result||war.outcome||"" });

  const addParticipant = async () => {
    if (!addForm.id) return;
    const payload = {
      war_id: war.id,
      side: addForm.side,
      nation_id: addForm.type==="nation" ? addForm.id : null,
      alliance_id: addForm.type==="alliance" ? addForm.id : null,
    };
    const { error } = await supabase.from("war_participants").insert(payload);
    if (error) alert(error.message);
    else {
      setAddForm({ ...addForm, id:"" });
      onRefresh();
    }
  };

  const removeParticipant = async (id) => {
    const { error } = await supabase.from("war_participants").delete().eq("id", id);
    if (error) alert(error.message);
    else onRefresh();
  };

  const setWarStatus = async (status, extra = {}) => {
    const payload = { status, ...extra };
    let { error } = await supabase.from("wars").update(payload).eq("id", war.id);
    if (error && /ceasefire_days|ceasefire_until|schema cache|column/i.test(error.message || "")) {
      const fallback = { status };
      if ("ended_at" in payload) fallback.ended_at = payload.ended_at;
      if (status === "ceasefire") {
        fallback.outcome = `Ceasefire for ${payload.ceasefire_days} day${payload.ceasefire_days === 1 ? "" : "s"}${payload.ceasefire_until ? `, until ${new Date(payload.ceasefire_until).toLocaleDateString()}` : ""}`;
      }
      const retry = await supabase.from("wars").update(fallback).eq("id", war.id);
      error = retry.error;
      if (!error) {
        alert("Ceasefire status saved. Run supabase-war-participants-setup.sql to store ceasefire days and dates properly.");
      }
    }
    if (error) alert(error.message);
    else onRefresh();
  };

  const setCeasefire = async () => {
    const days = Math.max(1, parseInt(ceasefireDays, 10) || 1);
    const until = new Date(Date.now() + days * 86400000).toISOString();
    await setWarStatus("ceasefire", { ceasefire_days:days, ceasefire_until:until, ended_at:null });
  };

  const saveWar = async () => {
    let { error } = await supabase.from("wars").update({
      name:edit.name || null,
      casus_belli:edit.casus_belli || null,
      objective:edit.objective || null,
      casualties:edit.casualties || null,
      result:edit.result || null,
      outcome:edit.result || null,
    }).eq("id", war.id);
    if (error && /objective|casualties|result|schema cache|column/i.test(error.message || "")) {
      const retry = await supabase.from("wars").update({
        name:edit.name || null,
        casus_belli:edit.casus_belli || null,
        outcome:[edit.objective && `Objective: ${edit.objective}`, edit.casualties && `Casualties: ${edit.casualties}`, edit.result && `Result: ${edit.result}`].filter(Boolean).join("\n") || null,
      }).eq("id", war.id);
      error = retry.error;
      if (!error) alert("War saved using fallback fields. Run supabase-war-participants-setup.sql to enable structured objective, casualty, and result fields.");
    }
    if (error) alert(error.message);
    else { setEditing(false); onRefresh(); }
  };

  const deleteWar = async () => {
    if (!confirm("Delete this war?")) return;
    const { error } = await supabase.from("wars").delete().eq("id", war.id);
    if (error) alert(error.message);
    else onRefresh();
  };

  const Side = ({ title, color, fallback, items }) => (
    <div style={{ flex:1, minWidth:220 }}>
      <div style={{ fontSize:10, color:"#8fa0bd", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.45rem" }}>{title}</div>
      <div style={{ display:"flex", gap:"0.45rem", flexWrap:"wrap", alignItems:"center" }}>
        {items.length > 0
          ? items.map(p=>(
            <span key={p.id} style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
              <WarParticipantPill participant={p} nations={nations} alliances={alliances} />
              {isMod && <button onClick={()=>removeParticipant(p.id)} style={{ ...mkBtn("ghost"), minHeight:24, padding:"1px 6px", fontSize:10 }}>Remove</button>}
            </span>
          ))
          : fallback && <span style={{ fontFamily:"var(--display)", color, fontSize:13 }}>{fallback}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ ...card, border:`1px solid ${WAR_COL[war.status]||"#d4af37"}25` }}>
      <div style={{ display:"flex", gap:"1rem", alignItems:"flex-start", flexWrap:"wrap" }}>
        <Side title="Attackers" color="#e74c3c" fallback={agg?.name||"?"} items={attackers} />
        <span style={{ color:"#8493ad", fontFamily:"var(--display)", fontSize:18, alignSelf:"center" }}>vs</span>
        <Side title="Defenders" color="#d4af37" fallback={def?.name||"?"} items={defenders} />
        <div style={{ marginLeft:"auto", alignSelf:"center" }}>
          <span style={{ fontSize:10, fontWeight:800, color:WAR_COL[war.status] || "#d4af37", border:`1px solid ${WAR_COL[war.status] || "#d4af37"}`, borderRadius:3, padding:"2px 7px" }}>{war.status?.toUpperCase()}</span>
        </div>
      </div>
      {!hasParticipants && <div style={{ marginTop:"0.55rem", fontSize:11, color:"#8fa0bd" }}>Legacy two-nation war. Lore team can add participants below to convert it.</div>}
      {war.name && <div style={{ fontFamily:"var(--display)", color:"#d7e2f2", fontSize:12, marginTop:"0.5rem", fontStyle:"italic" }}>"{war.name}"</div>}
      {war.casus_belli && <p style={{ margin:"0.4rem 0 0", color:"#9fb4d6", fontSize:12 }}>{war.casus_belli}</p>}
      {(war.objective || war.casualties || war.result || (war.outcome && war.status !== "ceasefire")) && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"0.55rem", marginTop:"0.7rem" }}>
          {war.objective && <div><div style={{ fontSize:10, color:"#8fa0bd", textTransform:"uppercase" }}>Objective</div><div style={{ fontSize:12, color:"#d7e2f2" }}>{war.objective}</div></div>}
          {war.casualties && <div><div style={{ fontSize:10, color:"#8fa0bd", textTransform:"uppercase" }}>Casualties</div><div style={{ fontSize:12, color:"#d7e2f2" }}>{war.casualties}</div></div>}
          {(war.result || (war.outcome && war.status !== "ceasefire")) && <div><div style={{ fontSize:10, color:"#8fa0bd", textTransform:"uppercase" }}>Result</div><div style={{ fontSize:12, color:"#d7e2f2" }}>{war.result || war.outcome}</div></div>}
        </div>
      )}
      {war.status === "ceasefire" && (
        <p style={{ margin:"0.45rem 0 0", color:"#9fb4d6", fontSize:12 }}>
          {war.ceasefire_days || war.ceasefire_until
            ? <>Ceasefire{war.ceasefire_days ? ` for ${war.ceasefire_days} day${war.ceasefire_days === 1 ? "" : "s"}` : ""}{war.ceasefire_until ? `, until ${new Date(war.ceasefire_until).toLocaleDateString()}` : ""}</>
            : (war.outcome || "Ceasefire")}
        </p>
      )}
      {isMod && (
        <div style={{ marginTop:"0.9rem", display:"flex", flexDirection:"column", gap:"0.55rem" }}>
          <div className="war-participant-form" style={{ display:"grid", gridTemplateColumns:"120px 120px minmax(180px,1fr) auto", gap:"0.45rem", alignItems:"center" }}>
            <select value={addForm.side} onChange={e=>setAddForm({...addForm,side:e.target.value})} style={{ ...inp, fontSize:12 }}>
              <option value="attacker">Attacker</option>
              <option value="defender">Defender</option>
            </select>
            <select value={addForm.type} onChange={e=>setAddForm({...addForm,type:e.target.value,id:""})} style={{ ...inp, fontSize:12 }}>
              <option value="nation">Nation</option>
              <option value="alliance">Alliance</option>
            </select>
            <select value={addForm.id} onChange={e=>setAddForm({...addForm,id:e.target.value})} style={{ ...inp, fontSize:12 }}>
              <option value="">Select {addForm.type}</option>
              {addForm.type==="nation"
                ? nations.map(n=><option key={n.id} value={n.id}>{n.name}</option>)
                : alliances.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button onClick={addParticipant} style={{ ...mkBtn("ghost"), fontSize:11 }}>Add</button>
          </div>
          <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", alignItems:"center" }}>
            <button onClick={()=>setWarStatus("active", { ceasefire_days:null, ceasefire_until:null, ended_at:null })} style={{ ...mkBtn("red"), fontSize:11 }}>Active War</button>
            <button onClick={()=>setWarStatus("stalemate", { ceasefire_days:null, ceasefire_until:null, ended_at:null })} style={{ ...mkBtn("ghost"), fontSize:11 }}>Stalemate</button>
            <input type="number" min="1" value={ceasefireDays} onChange={e=>setCeasefireDays(e.target.value)} style={{ ...inp, width:92, fontSize:12, padding:"7px 9px" }} />
            <button onClick={setCeasefire} style={{ ...mkBtn("blue"), fontSize:11 }}>Ceasefire Days</button>
            <button onClick={()=>setWarStatus("peace", { ended_at:new Date().toISOString(), ceasefire_days:null, ceasefire_until:null })} style={{ ...mkBtn("green"), fontSize:11 }}>Peace</button>
            <button onClick={()=>setEditing(!editing)} style={{ ...mkBtn("ghost"), fontSize:11 }}>Edit War</button>
            <button onClick={deleteWar} style={{ ...mkBtn("red"), fontSize:11 }}>Delete War</button>
          </div>
          {editing && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"0.5rem" }}>
              <input placeholder="War name" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} style={inp} />
              <input placeholder="War objective" value={edit.objective} onChange={e=>setEdit({...edit,objective:e.target.value})} style={inp} />
              <input placeholder="Casualties" value={edit.casualties} onChange={e=>setEdit({...edit,casualties:e.target.value})} style={inp} />
              <input placeholder="End result / outcome" value={edit.result} onChange={e=>setEdit({...edit,result:e.target.value})} style={inp} />
              <textarea placeholder="Casus belli" value={edit.casus_belli} onChange={e=>setEdit({...edit,casus_belli:e.target.value})} style={{ ...ta, gridColumn:"1/-1", minHeight:60 }} />
              <button onClick={saveWar} style={{ ...mkBtn(), justifySelf:"start" }}>Save War</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
