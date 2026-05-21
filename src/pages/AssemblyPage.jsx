import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, timeAgo } from "../lib/uiUtils";
import { NationPill } from "../components/nation/NationPill";

const CATEGORY_LABELS = {
  resolution: "Resolution",
  sanction: "Sanction",
  intervention: "Intervention",
  amendment: "Amendment",
  declaration: "Declaration",
};

const CATEGORY_COLORS = {
  resolution: "#3498db",
  sanction: "#e74c3c",
  intervention: "#e67e22",
  amendment: "#9b59b6",
  declaration: "#d4af37",
};

export const AssemblyPage = ({ nations, profile, userNation, onRefresh }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPropose, setShowPropose] = useState(false);
  const [form, setForm] = useState({ title:"", description:"", category:"resolution" });
  const [userVotes, setUserVotes] = useState({});

  const loadProposals = async () => {
    setLoading(true);
    const { data } = await supabase.from("assembly_proposals").select("*").order("created_at", { ascending: false }).limit(50);
    if (data) {
      setProposals(data);
      if (userNation) {
        const { data: votes } = await supabase.from("assembly_votes").select("*").in("proposal_id", data.map(p => p.id));
        if (votes) {
          const voteMap = {};
          votes.forEach(v => { if (v.nation_id === userNation.id) voteMap[v.proposal_id] = v.vote; });
          setUserVotes(voteMap);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadProposals(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const proposeResolution = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    const { error } = await supabase.from("assembly_proposals").insert({
      title: form.title,
      description: form.description,
      proposer_nation_id: userNation.id,
      category: form.category,
      voting_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    if (error) alert(error.message);
    else {
      setForm({ title:"", description:"", category:"resolution" });
      setShowPropose(false);
      loadProposals();
    }
  };

  const castVote = async (proposalId, vote) => {
    const existing = userVotes[proposalId];
    if (existing) {
      const { error } = await supabase.from("assembly_votes").update({ vote }).eq("proposal_id", proposalId).eq("nation_id", userNation.id);
      if (error) { alert(error.message); return; }
    } else {
      const { error } = await supabase.from("assembly_votes").insert({ proposal_id: proposalId, nation_id: userNation.id, vote });
      if (error) { alert(error.message); return; }
    }
    loadProposals();
  };

  const totalNations = nations.length;

  return (
    <div>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>World Assembly</h2>
        {userNation && <button onClick={()=>setShowPropose(!showPropose)} style={mkBtn()}>{showPropose ? "Cancel" : "Propose Resolution"}</button>}
      </div>
      <p style={{ color:"#9fb4d6", fontSize:13, lineHeight:1.7, marginBottom:"1rem" }}>
        The World Assembly is the global forum where all nations have a voice. Propose resolutions, vote on matters of international concern, and shape the world order. Each nation gets one vote per proposal.
      </p>

      {showPropose && (
        <div style={{ ...card, marginBottom:"1rem", border:"1px solid rgba(212,175,55,0.28)" }}>
          <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Propose Resolution — {nations.find(n=>n.id===userNation?.id)?.name}</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            <input placeholder="Resolution title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={inp} />
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={inp}>
              {Object.entries(CATEGORY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <textarea placeholder="Describe your resolution in detail" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{ ...ta, minHeight:100 }} />
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={proposeResolution} style={mkBtn()}>Submit to Assembly</button>
              <button onClick={()=>setShowPropose(false)} style={mkBtn("ghost")}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:"2rem", color:"#8493ad" }}>Loading assembly...</div>
      ) : proposals.length === 0 ? (
        <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
          <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:15, marginBottom:"0.35rem" }}>The Assembly is silent.</div>
          <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>No resolutions have been proposed. Be the first to address the world.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase" }}>{proposals.length} proposal{proposals.length !== 1 ? "s" : ""} before the Assembly</div>
          {proposals.map(p => {
            const proposer = nations.find(n => n.id === p.proposer_nation_id);
            const total = p.votes_for + p.votes_against + p.votes_abstain;
            const forPct = total > 0 ? Math.round((p.votes_for / total) * 100) : 0;
            const againstPct = total > 0 ? Math.round((p.votes_against / total) * 100) : 0;

            return (
              <div key={p.id} style={card}>
                <div style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start", flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
                      <strong style={{ color:"#edf4ff", fontSize:14 }}>{p.title}</strong>
                      <span style={{ fontSize:9, fontWeight:800, color:CATEGORY_COLORS[p.category]||"#8fa0bd", border:`1px solid ${CATEGORY_COLORS[p.category]||"#8fa0bd"}33`, borderRadius:4, padding:"2px 7px" }}>{CATEGORY_LABELS[p.category]?.toUpperCase()}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:p.status==="passed"?"#2ecc71":p.status==="failed"?"#e74c3c":p.status==="enacted"?"#3498db":"#f39c12", border:`1px solid ${p.status==="passed"?"#2ecc71":p.status==="failed"?"#e74c3c":p.status==="enacted"?"#3498db":"#f39c12"}33`, borderRadius:4, padding:"2px 7px" }}>{p.status?.toUpperCase()}</span>
                    </div>
                    <div style={{ margin:"0.35rem 0", color:"#b8c4d8", fontSize:13, lineHeight:1.7 }}>{p.description}</div>
                    <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
                      {proposer && <NationPill nation={proposer} />}
                      <span style={{ color:"#8fa0bd", fontSize:11 }}>· {timeAgo(p.created_at)}</span>
                      <span style={{ color:"#8fa0bd", fontSize:11 }}>· {total}/{totalNations} nations voted ({forPct}% for)</span>
                    </div>

                    {total > 0 && (
                      <div style={{ marginTop:"0.5rem", display:"flex", gap:"0.25rem", alignItems:"center" }}>
                        <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden", display:"flex" }}>
                          <div style={{ width:`${forPct}%`, background:"#2ecc71", transition:"width 0.3s" }} />
                          <div style={{ width:`${againstPct}%`, background:"#e74c3c", transition:"width 0.3s" }} />
                        </div>
                        <span style={{ fontSize:10, color:"#8fa0bd" }}>{p.votes_for}F/{p.votes_against}A</span>
                      </div>
                    )}
                  </div>

                  {userNation && p.status === "voting" && (
                    <div style={{ display:"flex", gap:"0.3rem", flexDirection:"column" }}>
                      <button onClick={()=>castVote(p.id, "for")} style={{ ...mkBtn(userVotes[p.id]==="for"?"green":"ghost"), fontSize:10, padding:"3px 9px", minHeight:26 }}>For</button>
                      <button onClick={()=>castVote(p.id, "against")} style={{ ...mkBtn(userVotes[p.id]==="against"?"red":"ghost"), fontSize:10, padding:"3px 9px", minHeight:26 }}>Against</button>
                      <button onClick={()=>castVote(p.id, "abstain")} style={{ ...mkBtn(userVotes[p.id]==="abstain"?"gold":"ghost"), fontSize:10, padding:"3px 9px", minHeight:26 }}>Abstain</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
