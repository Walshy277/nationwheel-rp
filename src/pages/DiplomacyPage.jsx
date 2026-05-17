import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, timeAgo } from "../lib/uiUtils";
import { NationPill } from "../components/nation/NationPill";

const TREATY_TYPES = [
  { id:"nap", label:"Non-Aggression Pact", desc:"Both parties agree not to attack each other." },
  { id:"trade", label:"Trade Agreement", desc:"Economic cooperation and trade route establishment." },
  { id:"defense", label:"Defense Pact", desc:"Mutual defense if either party is attacked." },
  { id:"military_alliance", label:"Military Alliance", desc:"Full military cooperation and coordination." },
  { id:"economic_union", label:"Economic Union", desc:"Deep economic integration and shared markets." },
];

const STATUS_COLORS = {
  proposed: "#7f8c8d",
  ratified: "#3498db",
  active: "#2ecc71",
  cancelled: "#e74c3c",
  expired: "#8fa0bd",
};

export const DiplomacyPage = ({ nations, profile, userNation, isMod, onRefresh }) => {
  const [treaties, setTreaties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPropose, setShowPropose] = useState(false);
  const [form, setForm] = useState({ title:"", type:"nap", target_nation_id:"", terms:"" });

  useEffect(() => {
    loadTreaties();
  }, []);

  const loadTreaties = async () => {
    setLoading(true);
    const { data } = await supabase.from("treaties").select("*").order("created_at", { ascending: false }).limit(100);
    if (data) setTreaties(data);
    setLoading(false);
  };

  const proposeTreaty = async () => {
    if (!form.title.trim() || !form.target_nation_id) return;
    const { error } = await supabase.from("treaties").insert({
      title: form.title,
      type: form.type,
      proposer_nation_id: userNation.id,
      target_nation_id: form.target_nation_id,
      terms: form.terms || null,
    });
    if (error) alert(error.message);
    else {
      setForm({ title:"", type:"nap", target_nation_id:"", terms:"" });
      setShowPropose(false);
      loadTreaties();
    }
  };

  const ratifyTreaty = async (treaty) => {
    const { error } = await supabase.from("treaties").update({
      status: "active",
      ratified_at: new Date().toISOString(),
    }).eq("id", treaty.id);
    if (error) alert(error.message);
    else loadTreaties();
  };

  const cancelTreaty = async (treaty) => {
    if (!confirm("Cancel this treaty?")) return;
    const { error } = await supabase.from("treaties").update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    }).eq("id", treaty.id);
    if (error) alert(error.message);
    else loadTreaties();
  };

  const typeLabel = (t) => TREATY_TYPES.find(x => x.id === t)?.label || t;

  return (
    <div>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Diplomacy & Treaties</h2>
        {userNation && <button onClick={()=>setShowPropose(!showPropose)} style={mkBtn()}>{showPropose ? "Cancel" : "Propose Treaty"}</button>}
      </div>

      {showPropose && (
        <div style={{ ...card, marginBottom:"1rem", border:"1px solid rgba(212,175,55,0.28)" }}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Propose Treaty — {userNation?.name}</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            <input placeholder="Treaty title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={inp} />
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inp}>
              {TREATY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <select value={form.target_nation_id} onChange={e=>setForm({...form,target_nation_id:e.target.value})} style={inp}>
              <option value="">Select target nation</option>
              {nations.filter(n => n.id !== userNation?.id).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <textarea placeholder="Terms and conditions of the treaty" value={form.terms} onChange={e=>setForm({...form,terms:e.target.value})} style={{ ...ta, minHeight:80 }} />
            <div style={{ color:"#8fa0bd", fontSize:12, fontStyle:"italic" }}>{TREATY_TYPES.find(t=>t.id===form.type)?.desc}</div>
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={proposeTreaty} style={mkBtn()}>Propose Treaty</button>
              <button onClick={()=>setShowPropose(false)} style={mkBtn("ghost")}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:"2rem", color:"#8493ad" }}>Loading treaties...</div>
      ) : treaties.length === 0 ? (
        <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
          <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:15, marginBottom:"0.35rem" }}>No treaties yet.</div>
          <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>The world is without formal agreements. Propose a treaty to begin diplomacy.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
          <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase" }}>{treaties.length} treaty{treaties.length !== 1 ? "ies" : ""} on record</div>
          {treaties.map(t => {
            const proposer = nations.find(n => n.id === t.proposer_nation_id);
            const target = nations.find(n => n.id === t.target_nation_id);
            const isProposer = userNation?.id === t.proposer_nation_id;
            const isTarget = userNation?.id === t.target_nation_id;
            const canRatify = t.status === "proposed" && isTarget;
            const canCancel = (isProposer || isTarget) && (t.status === "proposed" || t.status === "active");
            const canCancelStaff = t.status === "proposed" || t.status === "active";
            return (
              <div key={t.id} style={card}>
                <div style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start", flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
                      <strong style={{ color:"#edf4ff", fontSize:14 }}>{t.title}</strong>
                      <span style={{ fontSize:10, fontWeight:800, color:STATUS_COLORS[t.status]||"#8fa0bd", border:`1px solid ${STATUS_COLORS[t.status]||"#8fa0bd"}33`, borderRadius:4, padding:"2px 7px", letterSpacing:"0.04em" }}>{t.status?.toUpperCase()}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:999, padding:"2px 7px" }}>{typeLabel(t.type)}</span>
                    </div>
                    <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap", marginTop:"0.4rem" }}>
                      <NationPill nation={proposer} />
                      <span style={{ color:"#8fa0bd", fontSize:11 }}>→</span>
                      <NationPill nation={target} />
                      <span style={{ color:"#8fa0bd", fontSize:11, marginLeft:"0.5rem" }}>{timeAgo(t.created_at)}</span>
                    </div>
                    {t.terms && <p style={{ color:"#b8c4d8", fontSize:13, lineHeight:1.7, margin:"0.5rem 0 0" }}>{t.terms}</p>}
                  </div>
                  <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                    {canRatify && <button onClick={()=>ratifyTreaty(t)} style={{ ...mkBtn("green"), fontSize:10, padding:"5px 10px", minHeight:30 }}>Ratify</button>}
                    {canCancel && <button onClick={()=>cancelTreaty(t)} style={{ ...mkBtn("red"), fontSize:10, padding:"5px 10px", minHeight:30 }}>Cancel</button>}
                    {isMod && canCancelStaff && <button onClick={()=>cancelTreaty(t)} style={{ ...mkBtn("red"), fontSize:10, padding:"5px 10px", minHeight:30 }}>Staff Cancel</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
