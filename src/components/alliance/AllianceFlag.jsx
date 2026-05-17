export const AllianceFlag = ({ alliance, size = 34 }) => {
  if (alliance?.flag_url) {
    return <img src={alliance.flag_url} alt={alliance.name} style={{ width:size, height:size, objectFit:"cover", borderRadius:4, border:"1px solid rgba(255,255,255,0.12)", flexShrink:0 }} />;
  }
  const ab = alliance?.name ? alliance.name.slice(0,2).toUpperCase() : "??";
  return <div style={{ width:size, height:size, borderRadius:4, background:"rgba(52,152,219,0.12)", border:"1px solid rgba(52,152,219,0.24)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.26, fontWeight:900, color:"#6fb7ff", flexShrink:0 }}>{ab}</div>;
};
