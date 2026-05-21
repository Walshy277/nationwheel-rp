import { useState } from "react";
import { mkBtn, fmtGameDate } from "../../lib/uiUtils";
import { advanceGameDay } from "../../lib/notifications";

export const StaffTools = ({ isAdmin, page, navigate, counts, gameState, onGameDayAdvance }) => {
  const [advancing, setAdvancing] = useState(false);
  const handleAdvance = async () => {
    if (advancing) return;
    setAdvancing(true);
    const result = await advanceGameDay(1);
    if (result) onGameDayAdvance?.(result);
    setAdvancing(false);
  };
  return (
    <div className="staff-tools" style={{ position:"sticky", top:50, zIndex:150, background:"rgba(3,7,13,0.96)", borderBottom:"1px solid rgba(78,128,190,0.24)", backdropFilter:"blur(16px)" }}>
      <div style={{ maxWidth:980, margin:"0 auto", padding:"0.45rem 1rem", display:"flex", gap:"0.4rem", alignItems:"center", overflowX:"auto", scrollbarWidth:"none" }}>
        <span style={{ fontSize:10, color:"#8fa0bd", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0 }}>{isAdmin ? "Admin Tools" : "Lore Tools"}</span>
        {gameState && (
          <span style={{ fontSize:10, color:"#d4af37", fontWeight:800, border:"1px solid rgba(212,175,55,0.2)", borderRadius:4, padding:"2px 7px", letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
            {fmtGameDate(gameState.game_day, gameState.game_year)}
          </span>
        )}
        <button onClick={handleAdvance} disabled={advancing} style={{ ...mkBtn("ghost"), minHeight:28, padding:"3px 8px", fontSize:10 }}>
          {advancing ? "..." : "+1 Day"}
        </button>
        {[
          ["admin", isAdmin ? "Admin Panel" : "Lore Panel"],
          ["nations", `Nations ${counts.nations}`],
          ["wars", `Wars ${counts.wars}`],
          ["actions", `Actions ${counts.actions}`],
          ["events", "Events"],
          ["news", "News"],
        ].map(([id,label])=>(
          <button key={id} onClick={()=>navigate(id)} style={{ ...mkBtn(page===id?"gold":"ghost"), minHeight:30, padding:"5px 9px", fontSize:10.5 }}>{label}</button>
        ))}
      </div>
    </div>
  );
};
