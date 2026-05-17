import { Flag } from "./Flag";

export const NationPill = ({ nation }) => nation ? (
  <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.18)", borderRadius:4, padding:"2px 8px 2px 4px" }}>
    <Flag nation={nation} size={16} />
    <span style={{ fontSize:11, color:"#d4af37", fontWeight:700 }}>{nation.name}</span>
  </span>
) : null;
