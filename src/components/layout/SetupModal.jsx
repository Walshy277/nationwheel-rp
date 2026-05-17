import { card, mkBtn } from "../../lib/uiUtils";

export const SetupModal = ({ onClose }) => {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div style={{ ...card, maxWidth:700, width:"100%", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
          <h2 style={{ margin:0, color:"#f6c132", fontFamily:"var(--display)" }}>Supabase Setup</h2>
          <button onClick={onClose} style={{ ...mkBtn("ghost"), padding:"4px 10px" }}>Close</button>
        </div>
        <ol style={{ color:"#d7e2f2", lineHeight:2.2, paddingLeft:"1.2rem", fontSize:13 }}>
          <li>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{color:"#d4af37"}}>supabase.com</a>, then create a free project</li>
          <li>Settings, API, then copy <strong style={{color:"#f8fbff"}}>Project URL</strong> and <strong style={{color:"#f8fbff"}}>anon key</strong></li>
          <li>Paste into <code style={{color:"#d4af37",fontSize:11}}>VITE_SUPABASE_URL</code> / <code style={{color:"#d4af37",fontSize:11}}>VITE_SUPABASE_ANON_KEY</code> in <code style={{color:"#d4af37",fontSize:11}}>.env.local</code></li>
          <li>SQL Editor &gt; run the files in <code style={{color:"#d4af37",fontSize:11}}>supabase/</code> in this order: <code style={{color:"#d4af37",fontSize:11}}>schema.sql</code>, <code style={{color:"#d4af37",fontSize:11}}>functions.sql</code>, <code style={{color:"#d4af37",fontSize:11}}>migrations/20260513_forum_foundation.sql</code>, <code style={{color:"#d4af37",fontSize:11}}>migrations/20260514_scale_forum_limits.sql</code>, <code style={{color:"#d4af37",fontSize:11}}>policies.sql</code>, then <code style={{color:"#d4af37",fontSize:11}}>seed-forum.sql</code></li>
          <li>Authentication, Providers, then enable <strong style={{color:"#f8fbff"}}>Email</strong></li>
          <li>Storage: check the <strong style={{color:"#f8fbff"}}>flags</strong> and <strong style={{color:"#f8fbff"}}>profile-media</strong> buckets were created, or create them manually and set them to Public</li>
          <li>The SQL promotes the first registered user to <code style={{color:"#d4af37",fontSize:11}}>admin</code></li>
          <li>Deploy to Cloudflare with <code style={{color:"#d4af37",fontSize:11}}>npm run build</code> and <code style={{color:"#d4af37",fontSize:11}}>npx wrangler deploy</code></li>
        </ol>
        <div style={{ ...card, background:"rgba(255,255,255,0.035)", boxShadow:"none", marginTop:"1rem", padding:"0.9rem" }}>
          <div style={{ color:"#edf4ff", fontWeight:800, fontSize:13, marginBottom:"0.35rem" }}>SQL is no longer bundled into the website.</div>
          <p style={{ margin:0, color:"#9fb4d6", fontSize:12, lineHeight:1.7 }}>
            Open the project files under <code style={{color:"#d4af37",fontSize:11}}>supabase/</code>, paste each file into the Supabase SQL Editor, and run them once. This keeps database setup out of the public frontend bundle.
          </p>
          <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noreferrer" style={{ ...mkBtn("gold"), display:"inline-flex", alignItems:"center", textDecoration:"none", marginTop:"0.75rem" }}>Open Supabase SQL Editor</a>
        </div>
        <button onClick={onClose} style={{ ...mkBtn(), marginTop:"1.25rem" }}>Got it</button>
      </div>
    </div>
  );
};
