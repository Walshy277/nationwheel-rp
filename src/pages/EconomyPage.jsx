import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, timeAgo } from "../lib/uiUtils";
import { NationPill } from "../components/nation/NationPill";

const RESOURCE_ICONS = {
  food: "Food",
  minerals: "Minerals",
  energy: "Energy",
  tech: "Tech",
  manpower: "Manpower",
};

export const EconomyPage = ({ nations, profile, userNation, onRefresh }) => {
  const [resources, setResources] = useState(null);
  const [tradeRoutes, setTradeRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [tradeForm, setTradeForm] = useState({ to_nation_id:"", resource_type:"food", amount:10 });

  useEffect(() => { loadData(); }, [userNation?.id]);

  const loadData = async () => {
    setLoading(true);
    if (userNation) {
      const { data: res } = await supabase.from("nation_resources").select("*").eq("nation_id", userNation.id).single();
      if (res) setResources(res);
      const { data: routes } = await supabase.from("trade_routes").select("*").or(`from_nation_id.eq.${userNation.id},to_nation_id.eq.${userNation.id}`).order("created_at",{ascending:false});
      if (routes) setTradeRoutes(routes);
    }
    setLoading(false);
  };

  const createTradeRoute = async () => {
    if (!tradeForm.to_nation_id) return;
    const { error } = await supabase.from("trade_routes").insert({
      from_nation_id: userNation.id,
      to_nation_id: tradeForm.to_nation_id,
      resource_type: tradeForm.resource_type,
      amount: tradeForm.amount,
    });
    if (error) alert(error.message);
    else {
      setTradeForm({ to_nation_id:"", resource_type:"food", amount:10 });
      setShowTradeForm(false);
      loadData();
    }
  };

  const cancelRoute = async (id) => {
    if (!confirm("Cancel this trade route?")) return;
    await supabase.from("trade_routes").update({ status:"cancelled" }).eq("id", id);
    loadData();
  };

  const resourceList = resources ? [
    { key:"food", value:resources.food, icon:"🌾" },
    { key:"minerals", value:resources.minerals, icon:"⛏️" },
    { key:"energy", value:resources.energy, icon:"⚡" },
    { key:"tech", value:resources.tech, icon:"🔬" },
    { key:"manpower", value:resources.manpower, icon:"👥" },
  ] : [];

  return (
    <div>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Economy & Trade</h2>
        {userNation && <button onClick={()=>setShowTradeForm(!showTradeForm)} style={mkBtn()}>{showTradeForm ? "Cancel" : "Establish Trade Route"}</button>}
      </div>

      {userNation ? (
        <>
          {loading ? (
            <div style={{ textAlign:"center", padding:"2rem", color:"#8493ad" }}>Loading economy data...</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              {resources && (
                <div style={card}>
                  <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Resources — {nations.find(n=>n.id===userNation.id)?.name}</h3>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:"0.6rem" }}>
                    {resourceList.map(r => (
                      <div key={r.key} style={{ background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"0.75rem", textAlign:"center" }}>
                        <div style={{ fontSize:20, marginBottom:"0.25rem" }}>{r.icon}</div>
                        <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", textTransform:"uppercase" }}>{RESOURCE_ICONS[r.key]}</div>
                        <div style={{ fontFamily:"var(--display)", fontSize:18, color:"#d4af37" }}>{r.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:"0.75rem", paddingTop:"0.75rem", borderTop:"1px solid rgba(78,128,190,0.16)", display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"#8fa0bd", fontSize:12 }}>Calculated GDP</span>
                    <span style={{ color:"#d4af37", fontWeight:700, fontSize:15 }}>${(resources.gdp || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {showTradeForm && (
                <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)" }}>
                  <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Establish Trade Route — {nations.find(n=>n.id===userNation.id)?.name}</h3>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                    <select value={tradeForm.to_nation_id} onChange={e=>setTradeForm({...tradeForm,to_nation_id:e.target.value})} style={inp}>
                      <option value="">Select partner nation</option>
                      {nations.filter(n => n.id !== userNation?.id).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                    <select value={tradeForm.resource_type} onChange={e=>setTradeForm({...tradeForm,resource_type:e.target.value})} style={inp}>
                      {Object.entries(RESOURCE_ICONS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input type="number" placeholder="Amount per day" value={tradeForm.amount} onChange={e=>setTradeForm({...tradeForm,amount:parseInt(e.target.value)||0})} style={inp} />
                    <button onClick={createTradeRoute} style={mkBtn()}>Establish Route</button>
                  </div>
                </div>
              )}

              <div style={card}>
                <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Trade Routes ({tradeRoutes.length})</h3>
                {tradeRoutes.length === 0 ? (
                  <p style={{ color:"#8493ad", fontStyle:"italic", fontSize:13 }}>No trade routes established.</p>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                    {tradeRoutes.map(tr => {
                      const from = nations.find(n => n.id === tr.from_nation_id);
                      const to = nations.find(n => n.id === tr.to_nation_id);
                      const isIncoming = tr.to_nation_id === userNation.id;
                      return (
                        <div key={tr.id} style={{ display:"flex", gap:"0.75rem", alignItems:"center", padding:"0.65rem", background:"rgba(255,255,255,0.03)", borderRadius:6 }}>
                          <span style={{ fontSize:11, color:"#8fa0bd", flex:1 }}>
                            {isIncoming ? "From" : "To"} <strong style={{ color:"#edf4ff" }}>{isIncoming ? from?.name : to?.name}</strong>
                            <span style={{ margin:"0 0.5rem" }}>→</span>
                            <span style={{ color:RESOURCE_ICONS[tr.resource_type]?"#d4af37":"#8fa0bd" }}>{tr.amount} {RESOURCE_ICONS[tr.resource_type] || tr.resource_type}/day</span>
                            <span style={{ marginLeft:"0.5rem", fontSize:10, color:"#8fa0bd" }}>{timeAgo(tr.created_at)}</span>
                          </span>
                          <span style={{ fontSize:10, fontWeight:700, color:tr.status==="active"?"#2ecc71":"#8fa0bd", border:`1px solid ${tr.status==="active"?"#2ecc71":"#8fa0bd"}33`, borderRadius:4, padding:"1px 6px" }}>{tr.status?.toUpperCase()}</span>
                          {tr.status === "active" && (tr.from_nation_id === userNation.id || tr.to_nation_id === userNation.id) && (
                            <button onClick={()=>cancelRoute(tr.id)} style={{ ...mkBtn("red"), fontSize:9, padding:"3px 8px", minHeight:24 }}>Cancel</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
          <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:15, marginBottom:"0.35rem" }}>No nation assigned.</div>
          <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>You need a nation to access the economy system.</p>
        </div>
      )}
    </div>
  );
};
