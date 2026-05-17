import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Flag } from "../nation/Flag";
import { NationPill } from "../nation/NationPill";
import { card, mkBtn, inp, ta, timeAgo, POST_COLS, POST_TYPES } from "../../lib/uiUtils";

export const PostCard = ({ post, nations, isMod, onRefresh }) => {
  const targetNation = nations?.find(n => n.id === post.target_nation_id);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title:post.title || "", body:post.body || "", post_type:post.post_type || "Dispatch" });
  const savePost = async () => {
    const { error } = await supabase.from("rp_posts").update(editForm).eq("id", post.id);
    if (error) alert(error.message);
    else { setEditing(false); onRefresh?.(); }
  };
  const deletePost = async () => {
    if (!confirm("Remove this dispatch permanently?")) return;
    const { error } = await supabase.from("rp_posts").delete().eq("id", post.id);
    if (error) alert(error.message);
    else onRefresh?.();
  };
  return (
    <div style={card}>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap", marginBottom:"0.75rem" }}>
        <Flag nation={post.nations} size={26} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontWeight:800, color:"#d4af37", fontSize:13 }}>{post.nations?.name||"Unknown"}</span>
            {targetNation && <><span style={{ color:"#8493ad", fontSize:12 }}>to</span><NationPill nation={targetNation} /></>}
            <span style={{ marginLeft:"auto", fontSize:11, color:"#8fa0bd" }}>{timeAgo(post.created_at)}</span>
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:POST_COLS[post.post_type]||"#d4af37", background:"rgba(0,0,0,0.5)", borderRadius:4, padding:"2px 8px", letterSpacing:"0.04em", border:`1px solid ${POST_COLS[post.post_type]||"#d4af37"}30` }}>{post.post_type}</span>
      </div>
      {editing ? (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem" }}>
          <input value={editForm.title} onChange={e=>setEditForm({...editForm,title:e.target.value})} style={inp} />
          <select value={editForm.post_type} onChange={e=>setEditForm({...editForm,post_type:e.target.value})} style={inp}>
            {POST_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <textarea value={editForm.body} onChange={e=>setEditForm({...editForm,body:e.target.value})} style={{ ...ta, minHeight:120 }} />
          <div style={{ display:"flex", gap:"0.4rem" }}>
            <button onClick={savePost} style={{ ...mkBtn(), fontSize:11 }}>Save Dispatch</button>
            <button onClick={()=>setEditing(false)} style={{ ...mkBtn("ghost"), fontSize:11 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <h3 style={{ margin:"0 0 0.6rem", color:"#f8fbff", fontFamily:"var(--display)", fontSize:15 }}>{post.title}</h3>
          <p style={{ margin:0, color:"#d7e2f2", lineHeight:1.85, fontSize:13, whiteSpace:"pre-wrap" }}>{post.body}</p>
        </>
      )}
      {isMod && !editing && (
        <div style={{ display:"flex", gap:"0.35rem", marginTop:"0.75rem", flexWrap:"wrap" }}>
          <button onClick={()=>setEditing(true)} style={{ ...mkBtn("ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Edit Dispatch</button>
          <button onClick={deletePost} style={{ ...mkBtn("red"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Remove Dispatch</button>
        </div>
      )}
    </div>
  );
};
