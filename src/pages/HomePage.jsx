import { card, timeAgo, fmtGDP, NEWS_COL, ACTION_SIZES } from "../lib/uiUtils";
import { Flag } from "../components/nation/Flag";

const Section = ({ title, children, empty }) => (
  <div style={card}>
    <h3 style={{ margin:"0 0 0.9rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14, letterSpacing:"0.05em" }}>{title}</h3>
    {children && Array.isArray(children) && children.length === 0
      ? <p style={{ color:"#8493ad", fontSize:13, margin:0, fontStyle:"italic" }}>{empty}</p>
      : children || <p style={{ color:"#8493ad", fontSize:13, margin:0, fontStyle:"italic" }}>{empty}</p>}
  </div>
);

export const HomePage = ({ nations, news, actions, wars }) => {
  const topGDP = [...nations].sort((a,b)=>(b.gdp_usd||0)-(a.gdp_usd||0)).slice(0,5);
  const activeWars = wars.filter(w=>w.status==="active");
  const activeActions = actions.filter(a=>a.status==="active").slice(0,5);
  const recentNews = news.slice(0,4);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
      <div style={{ ...card, background:"linear-gradient(120deg,rgba(6,10,18,0.98),rgba(9,18,32,0.98))", border:"1px solid rgba(212,175,55,0.25)", padding:"1.75rem 2rem", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:"auto 0 0 0", height:3, background:"linear-gradient(90deg,#145bb0,#f6c132,#1f8f43)", pointerEvents:"none" }} />
        <div style={{ display:"flex", gap:"2.5rem", flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ flex:1, minWidth:180 }}>
            <p style={{ margin:"0 0 0.3rem", fontSize:11, letterSpacing:"0.12em", color:"#8fa0bd", textTransform:"uppercase" }}>Season 2 - Living World</p>
            <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:"clamp(1.4rem,3vw,2rem)" }}>World at a Glance</h2>
          </div>
          <div style={{ display:"flex", gap:"2rem", flexWrap:"wrap" }}>
            {[{l:"Nations",v:nations.length},{l:"Active Wars",v:activeWars.length,c:activeWars.length>0?"#e74c3c":undefined},{l:"Active Actions",v:activeActions.length}].map(s=>(
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"var(--display)", fontSize:"clamp(1.8rem,3.5vw,2.4rem)", color:s.c||"#d4af37", lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", marginTop:3, textTransform:"uppercase" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:"1rem" }}>
        <Section title="Latest News" empty="No news yet.">
          {recentNews.map(n=>(
            <div key={n.id} style={{ padding:"0.65rem 0", borderBottom:"1px solid rgba(255,215,0,0.05)" }}>
              <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                <span style={{ fontSize:10, fontWeight:800, color:"#0a0806", background:NEWS_COL[n.category]||"#d4af37", borderRadius:3, padding:"1px 6px", letterSpacing:"0.04em" }}>{n.category?.toUpperCase()}</span>
                <span style={{ fontSize:11, color:"#8fa0bd" }}>{timeAgo(n.created_at)}</span>
              </div>
              <div style={{ fontSize:13, color:"#edf4ff", fontWeight:700, marginTop:3 }}>{n.title}</div>
            </div>
          ))}
        </Section>

        <Section title="Active Actions" empty="No active actions.">
          {activeActions.map(a=>(
            <div key={a.id} style={{ padding:"0.6rem 0", borderBottom:"1px solid rgba(255,215,0,0.05)", display:"flex", gap:"0.5rem", alignItems:"center" }}>
              <span style={{ fontSize:10, fontWeight:800, color:"#0a0806", background:ACTION_SIZES[a.size]?.color||"#d4af37", borderRadius:3, padding:"1px 6px" }}>{a.size?.toUpperCase()}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:"#edf4ff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</div>
                <div style={{ fontSize:11, color:"#8fa0bd" }}>{a.nations?.name}</div>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Active Conflicts" empty="The world is at peace.">
          {activeWars.map(w=>(
            <div key={w.id} style={{ padding:"0.6rem 0", borderBottom:"1px solid rgba(255,215,0,0.05)", fontSize:13 }}>
              <span style={{ color:"#e74c3c", fontWeight:700 }}>{w.aggressor?.name||"?"}</span>
              <span style={{ color:"#8fa0bd", margin:"0 0.5rem" }}>vs</span>
              <span style={{ color:"#edf4ff", fontWeight:700 }}>{w.defender?.name||"?"}</span>
              {w.name && <div style={{ fontSize:11, color:"#a9b7cf", fontStyle:"italic" }}>"{w.name}"</div>}
            </div>
          ))}
        </Section>

        <Section title="Top GDP Nations" empty="No nation data.">
          {topGDP.map((n,i)=>(
            <div key={n.id} style={{ display:"flex", gap:"0.75rem", alignItems:"center", padding:"0.45rem 0", borderBottom:"1px solid rgba(255,215,0,0.05)" }}>
              <span style={{ fontFamily:"var(--display)", color:i===0?"#d4af37":i<3?"#d7e2f2":"#8493ad", fontSize:13, width:20, textAlign:"center" }}>#{i+1}</span>
              <Flag nation={n} size={24} />
              <span style={{ flex:1, fontSize:13, color:"#edf4ff" }}>{n.name}</span>
              <span style={{ fontSize:12, color:"#d4af37", fontWeight:700 }}>{fmtGDP(n.gdp_usd)}</span>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
};
