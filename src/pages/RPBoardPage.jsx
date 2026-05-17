import { useState } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, POST_TYPES } from "../lib/uiUtils";
import { Flag } from "../components/nation/Flag";
import { PostCard } from "../components/rp/PostCard";
import { createMentionNotifications } from "../lib/notifications";

export const RPBoardPage = ({ posts, profile, userNation, nations, isMod, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [pType, setPType] = useState("Dispatch");
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [targetId, setTargetId] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = filter==="all" ? posts : posts.filter(p=>p.post_type===filter);

  const submit = async () => {
    if (!title.trim()||!body.trim()||!userNation) return;
    await supabase.from("rp_posts").insert({ nation_id:userNation.id, author_id:profile.id, post_type:pType, title, body, target_nation_id:targetId||null });
    createMentionNotifications({ body, sourceTitle:title, sourceLink:"/dispatches", sourceType:"dispatch" });
    setTitle(""); setBody(""); setShowForm(false); onRefresh();
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Dispatch Board</h2>
        {userNation && <button onClick={()=>setShowForm(!showForm)} style={mkBtn()}>+ New Dispatch</button>}
        {!userNation && profile && <span style={{ fontSize:12, color:"#8fa0bd", fontStyle:"italic" }}>You need an assigned nation to post</span>}
      </div>
      <div style={{ display:"flex", gap:"0.35rem", marginBottom:"1rem", flexWrap:"wrap" }}>
        <button onClick={()=>setFilter("all")} style={{ ...mkBtn(filter==="all"?"gold":"ghost"), fontSize:11 }}>All</button>
        {POST_TYPES.map(t=><button key={t} onClick={()=>setFilter(t)} style={{ ...mkBtn(filter===t?"gold":"ghost"), fontSize:11 }}>{t}</button>)}
      </div>
      {showForm && (
        <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1.25rem" }}>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1rem" }}>
            <Flag nation={userNation} size={26} />
            <span style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>{userNation?.name}</span>
          </div>
          <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap", marginBottom:"0.75rem" }}>
            {POST_TYPES.map(t=><button key={t} onClick={()=>setPType(t)} style={{ ...mkBtn(pType===t?"gold":"ghost"), fontSize:11, padding:"5px 10px" }}>{t}</button>)}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            <input placeholder="Title / Subject" value={title} onChange={e=>setTitle(e.target.value)} style={inp} />
            <select value={targetId} onChange={e=>setTargetId(e.target.value)} style={inp}>
              <option value="">Addressed to: World (public)</option>
              {nations.filter(n=>n.id!==userNation?.id).map(n=><option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <textarea placeholder="Write your in-character dispatch" value={body} onChange={e=>setBody(e.target.value)} style={{ ...ta, minHeight:110 }} />
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={submit} style={mkBtn()}>Transmit</button>
              <button onClick={()=>setShowForm(false)} style={mkBtn("ghost")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {filtered.length===0 ? (
          <div style={{ ...card, textAlign:"center", padding:"2.5rem" }}>
            <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:16, marginBottom:"0.35rem" }}>No dispatches yet.</div>
            <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>{filter==="all" ? "The world waits for the first dispatch." : `No dispatches in the "${filter}" category.`}</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase" }}>{filtered.length} dispatch{filtered.length!==1?"es":""}</div>
            {filtered.map(p=><PostCard key={p.id} post={p} nations={nations} isMod={isMod} onRefresh={onRefresh} />)}
          </>
        )}
      </div>
    </div>
  );
};
