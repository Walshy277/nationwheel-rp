import { useState } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, ACTION_SIZES } from "../lib/uiUtils";
import { ActionCard } from "../components/action/ActionCard";

export const ActionsPage = ({ actions, profile, userNation, nations, isMod, onRefresh }) => {
  const [tab, setTab] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", description:"", size:"medium" });

  const filtered = actions.filter(a=>tab==="active"?["pending","active"].includes(a.status):["complete","cancelled"].includes(a.status));

  const submit = async () => {
    if (!form.title.trim()||!form.description.trim()||!userNation) return;
    await supabase.from("canon_actions").insert({ nation_id:userNation.id, submitted_by:profile.id, ...form, estimated_days:ACTION_SIZES[form.size]?.days });
    setForm({ title:"", description:"", size:"medium" }); setShowForm(false); onRefresh();
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Canon Actions</h2>
        {userNation && <button onClick={()=>setShowForm(!showForm)} style={mkBtn()}>+ Submit Action</button>}
      </div>

      {showForm && (
        <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1.25rem" }}>
          <h3 style={{ margin:"0 0 1rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Submit Canon Action - {userNation?.name}</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            <input placeholder="Action title (e.g. Construct orbital station above Aesyl)" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={inp} />
            <textarea placeholder="Describe the action in full detail" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={ta} />
            <div>
              <div style={{ fontSize:10, color:"#8fa0bd", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.4rem" }}>Action Size - determines canon duration</div>
              <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                {Object.entries(ACTION_SIZES).map(([k,v])=>(
                  <button key={k} onClick={()=>setForm({...form,size:k})} style={{ ...mkBtn(form.size===k?"gold":"ghost"), fontSize:11, borderLeft:form.size===k?`3px solid ${v.color}`:"" }}>
                    {v.label} - {v.days}d
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={submit} style={mkBtn()}>Submit Action</button>
              <button onClick={()=>setShowForm(false)} style={mkBtn("ghost")}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem" }}>
        {[["active","Active / Pending"],["archive","Completed Archive"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {filtered.length===0 ? (
          <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
            <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:15, marginBottom:"0.35rem" }}>{tab==="active" ? "No active actions" : "No completed actions"}</div>
            <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>{tab==="active" ? "Submit a new action using the button above." : "Completed and cancelled actions will appear here."}</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase" }}>{filtered.length} action{filtered.length!==1?"s":""}</div>
            {filtered.map(a=><ActionCard key={a.id} action={a} nations={nations} expandable isMod={isMod} profile={profile} onRefresh={onRefresh} />)}
          </>
        )}
      </div>
    </div>
  );
};
