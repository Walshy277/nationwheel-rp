import { useState } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, NEWS_CATS } from "../lib/uiUtils";
import { NewsArticle } from "../components/news/NewsArticle";

export const NewsPage = ({ news, profile, isMod, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", body:"", category:"announcement", pinned:false });

  const submit = async () => {
    if (!form.title.trim()||!form.body.trim()) return;
    await supabase.from("news").insert({ author_id:profile.id, ...form });
    setForm({title:"",body:"",category:"announcement",pinned:false}); setShowForm(false); onRefresh();
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>World News</h2>
        {isMod && <button onClick={()=>setShowForm(!showForm)} style={mkBtn()}>+ Publish News</button>}
      </div>
      {showForm && (
        <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1.25rem" }}>
          <h3 style={{ margin:"0 0 1rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Publish World News</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            <input placeholder="Headline" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={inp} />
            <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap" }}>
              {NEWS_CATS.map(c=><button key={c} onClick={()=>setForm({...form,category:c})} style={{ ...mkBtn(form.category===c?"gold":"ghost"), fontSize:11 }}>{c}</button>)}
            </div>
            <textarea placeholder="Full story. BBCode is supported: [b], [i], [quote], [url], [img]. Basic HTML tags like <b> and <blockquote> are also allowed." value={form.body} onChange={e=>setForm({...form,body:e.target.value})} style={{ ...ta, minHeight:120 }} />
            <label style={{ display:"flex", gap:"0.5rem", alignItems:"center", color:"#b7c6dc", fontSize:12, cursor:"pointer" }}>
              <input type="checkbox" checked={form.pinned} onChange={e=>setForm({...form,pinned:e.target.checked})} /> Pin this article
            </label>
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={submit} style={mkBtn()}>Publish</button>
              <button onClick={()=>setShowForm(false)} style={mkBtn("ghost")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {news.filter(n=>n.pinned).length>0 && (
        <div style={{ marginBottom:"1.25rem" }}>
          <div style={{ fontSize:10, color:"#8fa0bd", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:"0.5rem" }}>Pinned</div>
          {news.filter(n=>n.pinned).map(n=>(
            <div key={n.id} style={{ marginBottom:"0.75rem" }}><NewsArticle article={n} isMod={isMod} onRefresh={onRefresh} /></div>
          ))}
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {news.filter(n=>!n.pinned).length===0 && news.filter(n=>n.pinned).length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No news published yet.</p>}
        {news.filter(n=>!n.pinned).map(n=>(
          <NewsArticle key={n.id} article={n} isMod={isMod} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
};
