import { mkBtn } from "../../lib/uiUtils";

export const StaffTools = ({ isAdmin, page, navigate, counts }) => (
  <div className="staff-tools" style={{ position:"sticky", top:50, zIndex:150, background:"rgba(3,7,13,0.96)", borderBottom:"1px solid rgba(78,128,190,0.24)", backdropFilter:"blur(16px)" }}>
    <div style={{ maxWidth:980, margin:"0 auto", padding:"0.45rem 1rem", display:"flex", gap:"0.4rem", alignItems:"center", overflowX:"auto", scrollbarWidth:"none" }}>
      <span style={{ fontSize:10, color:"#8fa0bd", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0 }}>{isAdmin ? "Admin Tools" : "Lore Tools"}</span>
      {[
        ["admin", isAdmin ? "Admin Panel" : "Lore Panel"],
        ["nations", `Nations ${counts.nations}`],
        ["wars", `Wars ${counts.wars}`],
        ["actions", `Actions ${counts.actions}`],
        ["news", "News"],
      ].map(([id,label])=>(
        <button key={id} onClick={()=>navigate(id)} style={{ ...mkBtn(page===id?"gold":"ghost"), minHeight:30, padding:"5px 9px", fontSize:10.5 }}>{label}</button>
      ))}
    </div>
  </div>
);
