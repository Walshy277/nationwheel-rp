import { useState } from "react";
import { card, mkBtn, fmtGDP, fmtPop, fmtLand } from "../lib/uiUtils";
import { Flag } from "../components/nation/Flag";

export const LeaderboardsPage = ({ nations }) => {
  const [metric, setMetric] = useState("gdp");
  const metrics = {
    gdp:  { label:"GDP",       key:"gdp_usd",    fmt:fmtGDP },
    pop:  { label:"Population",key:"population", fmt:fmtPop },
    land: { label:"Land Area", key:"land_km2",   fmt:fmtLand },
    army: { label:"Army Rank", key:"army_rank",  fmt:v=>v!=null?`${v}/11`:"-" },
    hdi:  { label:"HDI",       key:"hdi",        fmt:v=>v||"-" },
  };
  const m = metrics[metric];
  const sorted = [...nations].filter(n=>n[m.key]!=null&&n[m.key]!==0).sort((a,b)=>(b[m.key]||0)-(a[m.key]||0));
  const max = sorted[0]?.[m.key]||1;

  if (!nations || nations.length === 0) return (
    <div>
      <h2 style={{ margin:"0 0 1.25rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:20 }}>Leaderboards</h2>
      <div style={{ ...card, textAlign:"center", padding:"2.5rem", color:"#8493ad" }}>
        <div style={{ fontFamily:"var(--display)", fontSize:16, color:"#edf4ff", marginBottom:"0.35rem" }}>No nations yet.</div>
        <p style={{ margin:0, fontSize:13 }}>Leaderboards will populate once nations are created.</p>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ margin:"0 0 1.25rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:20 }}>Leaderboards</h2>
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        {Object.entries(metrics).map(([k,v])=>(
          <button key={k} onClick={()=>setMetric(k)} style={{ ...mkBtn(metric===k?"gold":"ghost"), fontSize:12 }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
        {sorted.map((n,i)=>{
          const val = n[m.key];
          const pct = max>0?(val/max)*100:0;
          return (
            <div key={n.id} style={{ ...card, padding:"0.9rem 1.25rem" }}>
              <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.45rem" }}>
                <span style={{ fontFamily:"var(--display)", color:i<3?"#d4af37":"#8493ad", fontSize:14, width:26, textAlign:"center" }}>#{i+1}</span>
                <Flag nation={n} size={26} />
                <span style={{ flex:1, fontSize:14, color:"#edf4ff", fontWeight:700 }}>{n.name}</span>
                <span style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:15 }}>{m.fmt(val)}</span>
              </div>
              <div style={{ height:3, background:"rgba(255,255,255,0.03)", borderRadius:2, marginLeft:26+26+12, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:i===0?"#f6c132":"rgba(246,193,50,0.35)", borderRadius:2 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
