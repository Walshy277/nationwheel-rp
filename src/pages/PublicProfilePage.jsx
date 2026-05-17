import { card, mkBtn, timeAgo, STATUS_COL, ROLE_LABELS, ROLE_COLORS, getRoles } from "../lib/uiUtils";
import { NationPill } from "../components/nation/NationPill";

export const PublicProfilePage = ({ viewedProfile, nations, posts, actions, onBack }) => {
  const nation = viewedProfile?.nation_id ? nations.find(n => n.id === viewedProfile.nation_id) : null;
  const recentPosts = posts.filter(post => post.author_id === viewedProfile?.id).slice(0, 6);
  const recentActions = nation ? actions.filter(action => action.nation_id === nation.id).slice(0, 5) : [];

  if (!viewedProfile) {
    return (
      <div style={card}>
        <h2 style={{ margin:"0 0 0.5rem", color:"#d4af37", fontFamily:"var(--display)" }}>Profile Not Found</h2>
        <p style={{ margin:"0 0 1rem", color:"#9fb4d6", fontSize:13 }}>That user profile is not available.</p>
        <button onClick={onBack} style={mkBtn("ghost")}>Back</button>
      </div>
    );
  }

  const roles = getRoles(viewedProfile);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
      <button onClick={onBack} style={{ ...mkBtn("ghost"), alignSelf:"flex-start" }}>Back</button>

      <section style={{ ...card, border:"1px solid rgba(212,175,55,0.24)" }}>
        <div style={{ display:"flex", gap:"1rem", alignItems:"flex-start", flexWrap:"wrap" }}>
          {viewedProfile.avatar_url
            ? <img src={viewedProfile.avatar_url} alt="" style={{ width:112, height:112, borderRadius:"50%", objectFit:"cover", border:"1px solid rgba(246,193,50,0.28)" }} />
            : <div style={{ width:112, height:112, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(246,193,50,0.18)" }} />}
          <div style={{ flex:1, minWidth:220 }}>
            <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
              <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:26 }}>{viewedProfile.username}</h2>
              <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap" }}>
                {roles.length > 0 ? roles.map(r => (
                  <span key={r} style={{ fontSize:9, fontWeight:700, color:ROLE_COLORS[r]||"#8fa0bd", border:`1px solid ${ROLE_COLORS[r]||"#8fa0bd"}33`, borderRadius:4, padding:"2px 7px", letterSpacing:"0.06em", textTransform:"uppercase" }}>
                    {ROLE_LABELS[r] || r}
                  </span>
                )) : <span style={{ fontSize:9, fontWeight:700, color:"#8fa0bd", border:"1px solid rgba(143,160,189,0.3)", borderRadius:4, padding:"2px 7px", letterSpacing:"0.06em", textTransform:"uppercase" }}>User</span>}
              </div>
              {viewedProfile.status && viewedProfile.status !== "active" && <span style={{ color:"#ffb4b4", border:"1px solid rgba(231,76,60,0.32)", borderRadius:999, padding:"2px 8px", fontSize:10, textTransform:"uppercase" }}>{viewedProfile.status}</span>}
            </div>
            <div style={{ color:"#8fa0bd", fontSize:12, marginTop:5 }}>{viewedProfile.last_active_at ? `Last active ${timeAgo(viewedProfile.last_active_at)}` : "Activity not recorded yet"}</div>
            {nation && <div style={{ marginTop:"0.75rem" }}><NationPill nation={nation} /></div>}
            {viewedProfile.bio && <p style={{ margin:"0.85rem 0 0", color:"#d7e2f2", fontSize:13, lineHeight:1.75, whiteSpace:"pre-wrap" }}>{viewedProfile.bio}</p>}
            {(viewedProfile.signature_url || viewedProfile.signature_text) && (
              <div style={{ marginTop:"0.85rem", paddingTop:"0.75rem", borderTop:"1px solid rgba(20,96,184,0.16)" }}>
                {viewedProfile.signature_text && <div style={{ fontSize:12, color:"#8fa0bd", fontStyle:"italic", marginBottom:viewedProfile.signature_url?"0.5rem":0, lineHeight:1.6 }}>{viewedProfile.signature_text}</div>}
                {viewedProfile.signature_url && <img src={viewedProfile.signature_url} alt="" style={{ maxWidth:"100%", maxHeight:110, objectFit:"contain" }} />}
              </div>
            )}
          </div>
        </div>
      </section>

      <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)", gap:"1rem" }} className="profile-community-grid">
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Recent Dispatches</h3>
          {recentPosts.length === 0 && <p style={{ margin:0, color:"#8493ad", fontSize:13, fontStyle:"italic" }}>No dispatches posted.</p>}
          {recentPosts.map(post => (
            <div key={post.id} style={{ borderTop:"1px solid rgba(78,128,190,0.14)", paddingTop:"0.65rem", marginTop:"0.65rem" }}>
              <div style={{ color:"#edf4ff", fontSize:13, fontWeight:800 }}>{post.title}</div>
              <div style={{ color:"#8fa0bd", fontSize:11 }}>{post.post_type} - {timeAgo(post.created_at)}</div>
            </div>
          ))}
        </section>
        <section style={card}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Nation Actions</h3>
          {recentActions.length === 0 && <p style={{ margin:0, color:"#8493ad", fontSize:13, fontStyle:"italic" }}>No canon actions recorded.</p>}
          {recentActions.map(action => (
            <div key={action.id} style={{ borderTop:"1px solid rgba(78,128,190,0.14)", paddingTop:"0.65rem", marginTop:"0.65rem" }}>
              <div style={{ color:"#edf4ff", fontSize:13, fontWeight:800 }}>{action.title}</div>
              <div style={{ color:STATUS_COL[action.status] || "#8fa0bd", fontSize:11, textTransform:"uppercase" }}>{action.status}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};
