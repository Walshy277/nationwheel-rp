import { card, timeAgo, fmtDate, isProfileActive } from "../../lib/uiUtils";
import { ProfileButton } from "./ProfileButton";

export const CommunityUsers = ({ profiles, onViewProfile }) => {
  const activeUsers = [...profiles]
    .filter(isProfileActive)
    .sort((a,b)=>new Date(b.last_active_at || 0) - new Date(a.last_active_at || 0))
    .slice(0, 8);
  const recentUsers = [...profiles]
    .sort((a,b)=>new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 8);
  const renderUser = (item, mode) => (
    <div key={`${mode}-${item.id}`} style={{ display:"flex", gap:"0.65rem", alignItems:"center", padding:"0.6rem 0", borderBottom:"1px solid rgba(78,128,190,0.12)" }}>
      {item.avatar_url ? <img src={item.avatar_url} alt="" style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover", border:"1px solid rgba(246,193,50,0.18)" }} /> : <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,0.055)", border:"1px solid rgba(246,193,50,0.12)" }} />}
      <div style={{ minWidth:0, flex:1 }}>
        <ProfileButton profile={item} onViewProfile={onViewProfile} style={{ color:"#edf4ff", fontSize:12, fontWeight:800, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }} />
        <div style={{ color:"#8fa0bd", fontSize:10 }}>{mode === "active" ? `Active ${timeAgo(item.last_active_at)}` : `Joined ${fmtDate(item.created_at)}`}</div>
      </div>
      {item.status && item.status !== "active" && <span style={{ color:"#ffb4b4", fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em" }}>{item.status}</span>}
    </div>
  );
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }} className="profile-community-grid">
      <div style={card}>
        <h3 style={{ margin:"0 0 0.45rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Active Users</h3>
        {(activeUsers.length ? activeUsers : profiles.slice(0, 4)).map(item=>renderUser(item, "active"))}
      </div>
      <div style={card}>
        <h3 style={{ margin:"0 0 0.45rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Newest Users</h3>
        {recentUsers.map(item=>renderUser(item, "recent"))}
      </div>
    </div>
  );
};
