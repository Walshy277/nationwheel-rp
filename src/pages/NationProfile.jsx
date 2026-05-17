import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, timeAgo, fmtGDP, fmtPop, fmtLand } from "../lib/uiUtils";
import { RichText } from "../lib/richText";
import { Flag } from "../components/nation/Flag";
import { NationPill } from "../components/nation/NationPill";
import { FlagUploader } from "../components/nation/FlagUploader";
import { PostCard } from "../components/rp/PostCard";
import { ActionCard } from "../components/action/ActionCard";
import { WarCard } from "../components/war/WarCard";

export const NationProfile = ({ nation, posts, actions, wars, alliances, allianceMembers, nations, onBack, profile, userNation, isMod, isAdmin, onRefresh }) => {
  const [tab, setTab] = useState("overview");
  const [editingNation, setEditingNation] = useState(false);
  const [nationForm, setNationForm] = useState({
    government:nation.government || "",
    ideology:nation.ideology || "",
    population:nation.population || "",
    gdp_usd:nation.gdp_usd || "",
    land_km2:nation.land_km2 || "",
    army_rank:nation.army_rank || "",
    hdi:nation.hdi || "",
    economy:nation.economy || "",
    diplomatic_status:nation.diplomatic_status || "",
    bloc:nation.bloc || "",
    bio:nation.bio || "",
  });
  const nPosts = posts.filter(p => p.nation_id === nation.id);
  const nActions = actions.filter(a => a.nation_id === nation.id);
  const nAllyIds = allianceMembers.filter(m => m.nation_id === nation.id).map(m => m.alliance_id);
  const nWars = wars.filter(w =>
    w.aggressor_id === nation.id ||
    w.defender_id === nation.id ||
    w.war_participants?.some(p => p.nation_id === nation.id || nAllyIds.includes(p.alliance_id))
  );
  const nAlliances = alliances.filter(a => nAllyIds.includes(a.id));
  const isOwner = profile?.nation_id === nation.id;
  const canEditNation = isMod || isAdmin;

  useEffect(() => {
    setEditingNation(false);
    setNationForm({
      government:nation.government || "",
      ideology:nation.ideology || "",
      population:nation.population || "",
      gdp_usd:nation.gdp_usd || "",
      land_km2:nation.land_km2 || "",
      army_rank:nation.army_rank || "",
      hdi:nation.hdi || "",
      economy:nation.economy || "",
      diplomatic_status:nation.diplomatic_status || "",
      bloc:nation.bloc || "",
      bio:nation.bio || "",
    });
  }, [nation.id, nation.government, nation.ideology, nation.population, nation.gdp_usd, nation.land_km2, nation.army_rank, nation.hdi, nation.economy, nation.diplomatic_status, nation.bloc, nation.bio]);

  const saveNationStats = async () => {
    const payload = {
      government:nationForm.government || null,
      ideology:nationForm.ideology || null,
      population:nationForm.population ? parseInt(nationForm.population) : null,
      gdp_usd:nationForm.gdp_usd ? parseInt(nationForm.gdp_usd) : null,
      land_km2:nationForm.land_km2 ? parseInt(nationForm.land_km2) : null,
      army_rank:nationForm.army_rank ? parseInt(nationForm.army_rank) : null,
      hdi:nationForm.hdi ? parseFloat(nationForm.hdi) : null,
      economy:nationForm.economy || null,
      diplomatic_status:nationForm.diplomatic_status || null,
      bloc:nationForm.bloc || null,
      bio:nationForm.bio || null,
    };
    const { error } = await supabase.from("nations").update(payload).eq("id", nation.id);
    if (error) alert(error.message);
    else { setEditingNation(false); onRefresh(); }
  };

  const stats = [
    ["Population", fmtPop(nation.population)],
    ["GDP", fmtGDP(nation.gdp_usd)],
    ["Land Area", fmtLand(nation.land_km2)],
    ["Army Rank", nation.army_rank != null ? `${nation.army_rank}/11` : "-"],
    ["HDI", nation.hdi || "-"],
    ["Economy", nation.economy || "-"],
    ["Bloc", nation.bloc || "None"],
    ["Status", nation.diplomatic_status || "-"],
  ];

  return (
    <div>
      <button onClick={onBack} style={{ ...mkBtn("ghost"), marginBottom:"1rem", fontSize:12 }}>Nations</button>

      <div style={{ ...card, border:"1px solid rgba(212,175,55,0.25)", marginBottom:"1rem", padding:"1.75rem", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(6,10,18,0.97),rgba(9,18,32,0.97))", pointerEvents:"none" }} />
        <div style={{ position:"relative", display:"flex", gap:"1.25rem", alignItems:"flex-start", flexWrap:"wrap" }}>
          <div style={{ position:"relative" }}>
            <Flag nation={nation} size={72} />
            {(isOwner || canEditNation) && (
              <FlagUploader nationId={nation.id} currentUrl={nation.flag_url}
                onUploaded={(url) => { nation.flag_url = url; onRefresh(); }} />
            )}
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <h1 style={{ margin:"0 0 0.25rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:"clamp(1.5rem,3vw,2.2rem)", letterSpacing:"0.04em" }}>{nation.name}</h1>
            <p style={{ margin:"0 0 0.5rem", color:"#b7c6dc", fontSize:13 }}>{nation.government}{nation.ideology ? ` - ${nation.ideology}` : ""}</p>
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
          {(nation.owner || nation.profiles) && <span style={{ fontSize:11, color:"#a9b7cf" }}>Owner: {(nation.owner || nation.profiles).username}</span>}
              {nation.diplomatic_status && <span style={{ fontSize:11, color:"#d4af37", border:"1px solid rgba(212,175,55,0.25)", borderRadius:4, padding:"1px 8px" }}>{nation.diplomatic_status}</span>}
              {nation.bloc && <span style={{ fontSize:11, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:4, padding:"1px 8px" }}>{nation.bloc}</span>}
            </div>
            {canEditNation && <button onClick={()=>setEditingNation(!editingNation)} style={{ ...mkBtn("ghost"), marginTop:"0.75rem", fontSize:11 }}>{editingNation ? "Close Nation Editor" : "Edit Nation Stats"}</button>}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:"0.35rem", marginBottom:"1rem", flexWrap:"wrap" }}>
        {[["overview","Overview"],["feed","RP Feed"],["actions","Actions"],["wars","Wars"],["alliances","Alliances"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
        ))}
      </div>

      {tab==="overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"0.65rem" }}>
          {editingNation && (
            <div style={{ ...card, gridColumn:"1/-1", border:"1px solid rgba(52,152,219,0.28)" }}>
              <h3 style={{ margin:"0 0 0.8rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Nation Stat Editor</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"0.55rem" }}>
                {[
                  ["government","Government"],
                  ["ideology","Ideology"],
                  ["population","Population"],
                  ["gdp_usd","GDP USD"],
                  ["land_km2","Land km2"],
                  ["army_rank","Army Rank"],
                  ["hdi","HDI"],
                  ["economy","Economy"],
                  ["diplomatic_status","Diplomatic Status"],
                  ["bloc","Bloc"],
                ].map(([key,label]) => (
                  <input key={key} placeholder={label} value={nationForm[key]} onChange={e=>setNationForm({...nationForm,[key]:e.target.value})} style={inp} />
                ))}
                <textarea placeholder="Nation bio or lore" value={nationForm.bio} onChange={e=>setNationForm({...nationForm,bio:e.target.value})} style={{ ...ta, gridColumn:"1/-1", minHeight:90 }} />
              </div>
              <div style={{ display:"flex", gap:"0.45rem", marginTop:"0.75rem" }}>
                <button onClick={saveNationStats} style={mkBtn()}>Save Nation Stats</button>
                <button onClick={()=>setEditingNation(false)} style={mkBtn("ghost")}>Cancel</button>
              </div>
            </div>
          )}
          {stats.map(([l,v])=>(
            <div key={l} style={{ ...card, padding:"1rem" }}>
              <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>{l}</div>
              <div style={{ fontFamily:"var(--display)", fontSize:"1.15rem", color:"#d4af37" }}>{v}</div>
            </div>
          ))}
          {nation.bio && (
            <div style={{ ...card, gridColumn:"1/-1" }}>
              <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"0.5rem" }}>Nation Profile</div>
              <RichText>{nation.bio}</RichText>
            </div>
          )}
        </div>
      )}

      {tab==="feed" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {nPosts.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No dispatches from this nation yet.</p>}
          {nPosts.map(p=><PostCard key={p.id} post={p} nations={nations} isMod={isMod} onRefresh={onRefresh} />)}
        </div>
      )}

      {tab==="actions" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {nActions.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No canon actions submitted yet.</p>}
          {nActions.map(a=><ActionCard key={a.id} action={a} nations={nations} expandable isMod={isMod} profile={profile} onRefresh={onRefresh} />)}
        </div>
      )}

      {tab==="wars" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {nWars.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No wars on record.</p>}
          {nWars.map(w=><WarCard key={w.id} war={w} nations={nations} alliances={alliances} participants={w.war_participants || []} />)}
        </div>
      )}

      {tab==="alliances" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {nAlliances.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>Not part of any alliance.</p>}
          {nAlliances.map(a=>{
            const members = allianceMembers.filter(m=>m.alliance_id===a.id).map(m=>nations.find(n=>n.id===m.nation_id)).filter(Boolean);
            return (
              <div key={a.id} style={card}>
                <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:15, marginBottom:"0.5rem" }}>{a.name}</div>
                <span style={{ fontSize:11, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:3, padding:"1px 7px", marginBottom:"0.75rem", display:"inline-block" }}>{a.type?.toUpperCase()}</span>
                <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                  {members.map(n=><NationPill key={n.id} nation={n} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
