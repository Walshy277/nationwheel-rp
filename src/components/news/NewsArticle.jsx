import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { RichText } from "../../lib/richText";
import { card, mkBtn, inp, ta, timeAgo, NEWS_CATS, NEWS_COL } from "../../lib/uiUtils";

export const NewsArticle = ({ article, isMod, onRefresh }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title:article.title || "",
    body:article.body || "",
    category:article.category || "announcement",
    pinned:Boolean(article.pinned),
  });
  const save = async () => {
    const { error } = await supabase.from("news").update(form).eq("id", article.id);
    if (error) alert(error.message);
    else { setEditing(false); onRefresh(); }
  };
  const remove = async () => {
    if (!confirm("Remove this news article permanently?")) return;
    const { error } = await supabase.from("news").delete().eq("id", article.id);
    if (error) alert(error.message);
    else onRefresh();
  };
  return (
    <div style={card}>
      {editing ? (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={inp} />
          <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap" }}>
            {NEWS_CATS.map(category=><button key={category} onClick={()=>setForm({...form,category})} style={{ ...mkBtn(form.category===category?"gold":"ghost"), fontSize:11 }}>{category}</button>)}
          </div>
          <textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})} style={{ ...ta, minHeight:140 }} />
          <label style={{ display:"flex", gap:"0.5rem", alignItems:"center", color:"#b7c6dc", fontSize:12, cursor:"pointer" }}>
            <input type="checkbox" checked={form.pinned} onChange={e=>setForm({...form,pinned:e.target.checked})} /> Pin this article
          </label>
          <div style={{ display:"flex", gap:"0.45rem" }}>
            <button onClick={save} style={mkBtn()}>Save Article</button>
            <button onClick={()=>setEditing(false)} style={mkBtn("ghost")}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"0.6rem", flexWrap:"wrap" }}>
            <span style={{ fontSize:10, fontWeight:800, color:"#0a0806", background:NEWS_COL[article.category]||"#d4af37", borderRadius:3, padding:"2px 8px" }}>{article.category?.toUpperCase()}</span>
            {article.pinned && <span style={{ fontSize:10, fontWeight:800, color:"#d4af37", border:"1px solid rgba(212,175,55,0.25)", borderRadius:3, padding:"2px 8px" }}>PINNED</span>}
            <span style={{ marginLeft:"auto", fontSize:11, color:"#8fa0bd" }}>{timeAgo(article.created_at)}</span>
          </div>
          <h3 style={{ margin:"0 0 0.6rem", fontFamily:"var(--display)", color:"#f8fbff", fontSize:17 }}>{article.title}</h3>
          <RichText>{article.body}</RichText>
          {isMod && (
            <div style={{ display:"flex", gap:"0.35rem", marginTop:"0.75rem", flexWrap:"wrap" }}>
              <button onClick={()=>setEditing(true)} style={{ ...mkBtn("ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Edit Article</button>
              <button onClick={remove} style={{ ...mkBtn("red"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Remove Article</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
