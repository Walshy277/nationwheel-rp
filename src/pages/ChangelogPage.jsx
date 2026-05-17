import { card, fmtDate } from "../lib/uiUtils";
import { CHANGELOG_ENTRIES } from "../lib/constants";

export const ChangelogPage = () => (
  <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
    <div style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap" }}>
      <div>
        <h2 style={{ margin:"0 0 0.35rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:22 }}>Changelog</h2>
        <p style={{ margin:0, color:"#9fb4d6", fontSize:13, lineHeight:1.65 }}>Recent site changes, forum fixes, and staff tooling updates.</p>
      </div>
    </div>
    {CHANGELOG_ENTRIES.map(entry=>(
      <article key={`${entry.date}-${entry.title}`} style={card}>
        <div style={{ color:"#8fa0bd", fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.35rem" }}>{fmtDate(entry.date)}</div>
        <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#edf4ff", fontSize:16 }}>{entry.title}</h3>
        <ul style={{ margin:0, paddingLeft:"1.1rem", color:"#d7e2f2", fontSize:13, lineHeight:1.8 }}>
          {entry.items.map(item=><li key={item}>{item}</li>)}
        </ul>
      </article>
    ))}
  </div>
);
