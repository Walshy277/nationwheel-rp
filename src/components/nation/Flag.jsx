export const Flag = ({ nation, size = 36 }) => {
  if (nation?.flag_url) {
    return (
      <img src={nation.flag_url} alt={nation.name}
        style={{ width:size, height:Math.round(size*0.65), objectFit:"cover", borderRadius:3, border:"1px solid rgba(255,255,255,0.1)", flexShrink:0 }} />
    );
  }
  const ab = nation?.name ? nation.name.slice(0,2).toUpperCase() : "??";
  return (
    <div style={{ width:size, height:Math.round(size*0.65), flexShrink:0, background:"rgba(255,255,255,0.06)", borderRadius:3, border:"1px solid rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.22, fontWeight:900, color:"#8fa0bd", userSelect:"none", letterSpacing:1 }}>{ab}</div>
  );
};
