import { NationPill } from "../nation/NationPill";

export const WarParticipantPill = ({ participant, nations, alliances }) => {
  const nation = participant.nation_id ? nations.find(n=>n.id===participant.nation_id) : null;
  const alliance = participant.alliance_id ? alliances.find(a=>a.id===participant.alliance_id) : null;
  if (nation) return <NationPill nation={nation} />;
  if (alliance) return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(52,152,219,0.09)", border:"1px solid rgba(52,152,219,0.22)", borderRadius:4, padding:"4px 8px" }}>
      <span style={{ color:"#6fb7ff", fontSize:12, fontWeight:800 }}>{alliance.name}</span>
      <span style={{ color:"#8fa0bd", fontSize:10 }}>{alliance.type}</span>
    </span>
  );
  return null;
};
