import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Flag } from "../nation/Flag";
import { card, mkBtn, ta, timeAgo, ACTION_SIZES, STATUS_COL } from "../../lib/uiUtils";
import { notifyActionStatus } from "../../lib/notifications";

export const ActionCard = ({ action, nations, expandable, isMod, onRefresh, profile }) => {
  const [open, setOpen] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [loreNotes, setLoreNotes] = useState(action.lore_notes || "");
  const nation = nations?.find(n=>n.id===action.nation_id) || action.nations;

  const addUpdate = async () => {
    if (!updateText.trim()) return;
    await supabase.from("action_updates").insert({ action_id:action.id, author_id:profile?.id, body:updateText });
    setUpdateText(""); if (onRefresh) onRefresh();
  };
  const updateStatus = async (status, extra={}) => {
    await supabase.from("canon_actions").update({ status, lore_notes:loreNotes.trim() || null, ...extra }).eq("id", action.id);
    notifyActionStatus({ action, newStatus:status, nationId:action.nation_id });
    if (onRefresh) onRefresh();
  };
  const saveLoreNotes = async () => {
    const { error } = await supabase.from("canon_actions").update({ lore_notes:loreNotes.trim() || null }).eq("id", action.id);
    if (error) alert(error.message);
    else onRefresh?.();
  };

  return (
    <div style={{ ...card, border:`1px solid ${ACTION_SIZES[action.size]?.color||"#d4af37"}22` }}>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", cursor:expandable?"pointer":"default", flexWrap:"wrap" }}
        onClick={()=>expandable&&setOpen(!open)}>
        <Flag nation={nation} size={26} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{action.title}</div>
          <div style={{ fontSize:11, color:"#8fa0bd" }}>{nation?.name} - {timeAgo(action.created_at)}</div>
        </div>
        <div style={{ display:"flex", gap:"0.4rem", alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:10, fontWeight:800, color:"#0a0806", background:ACTION_SIZES[action.size]?.color||"#d4af37", borderRadius:3, padding:"2px 7px" }}>{action.size?.toUpperCase()}</span>
          <span style={{ fontSize:10, fontWeight:800, color:STATUS_COL[action.status], border:`1px solid ${STATUS_COL[action.status]}`, borderRadius:3, padding:"2px 7px" }}>{action.status?.toUpperCase()}</span>
          {action.estimated_days && <span style={{ fontSize:11, color:"#a9b7cf" }}>{action.estimated_days}d</span>}
          {expandable && <span style={{ color:"#8fa0bd", fontSize:13 }}>{open?"^":"v"}</span>}
        </div>
      </div>

      {(open || !expandable) && (
        <div style={{ marginTop:"1rem", paddingTop:"1rem", borderTop:"1px solid rgba(255,215,0,0.06)" }}>
          <p style={{ margin:"0 0 0.75rem", color:"#d7e2f2", fontSize:13, lineHeight:1.8 }}>{action.description}</p>
          {action.lore_notes && (
            <div style={{ background:"rgba(52,152,219,0.04)", border:"1px solid rgba(52,152,219,0.12)", borderRadius:6, padding:"0.7rem", marginBottom:"0.75rem" }}>
              <div style={{ fontSize:10, color:"#3498db", letterSpacing:"0.1em", marginBottom:3 }}>LORE TEAM NOTES</div>
              <div style={{ fontSize:13, color:"#90bcd8" }}>{action.lore_notes}</div>
            </div>
          )}
          {action.action_updates?.length > 0 && (
            <div style={{ marginBottom:"0.75rem" }}>
              <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", marginBottom:"0.5rem", textTransform:"uppercase" }}>Progress Log</div>
              {action.action_updates.map(u=>(
                <div key={u.id} style={{ borderLeft:"2px solid rgba(212,175,55,0.25)", paddingLeft:"0.75rem", marginBottom:"0.5rem" }}>
                  <div style={{ fontSize:11, color:"#8fa0bd" }}>{timeAgo(u.created_at)} - {u.profiles?.username}</div>
                  <div style={{ fontSize:13, color:"#d7e2f2" }}>{u.body}</div>
                </div>
              ))}
            </div>
          )}
          {isMod && profile && (
            <div style={{ borderTop:"1px solid rgba(255,215,0,0.07)", paddingTop:"0.75rem", display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", textTransform:"uppercase" }}>Lore Team Controls</div>
              <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                {action.status==="pending" && <button onClick={()=>updateStatus("active",{started_at:new Date().toISOString()})} style={{ ...mkBtn("blue"), fontSize:11 }}>Approve</button>}
                {action.status==="pending" && <button onClick={()=>updateStatus("cancelled")} style={{ ...mkBtn("red"), fontSize:11 }}>Reject</button>}
                {action.status==="active" && <button onClick={()=>updateStatus("complete",{completed_at:new Date().toISOString()})} style={{ ...mkBtn("green"), fontSize:11 }}>Complete</button>}
                <button onClick={()=>updateStatus("cancelled")} style={{ ...mkBtn("red"), fontSize:11 }}>Cancel</button>
              </div>
              <textarea placeholder="Private lore notes, approval conditions, or rejection reason" value={loreNotes} onChange={e=>setLoreNotes(e.target.value)} style={{ ...ta, minHeight:70 }} />
              <button onClick={saveLoreNotes} style={{ ...mkBtn("ghost"), alignSelf:"flex-start" }}>Save Lore Notes</button>
              <textarea placeholder="Post visible progress update" value={updateText} onChange={e=>setUpdateText(e.target.value)} style={{ ...ta, minHeight:55 }} />
              <button onClick={addUpdate} style={{ ...mkBtn(), alignSelf:"flex-start" }}>Post Update</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
