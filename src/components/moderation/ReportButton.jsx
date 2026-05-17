import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { mkBtn, ta } from "../../lib/uiUtils";

export const ReportButton = ({ targetType, targetId, profile, label }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitReport = async () => {
    if (!reason.trim() || !profile) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: profile.id,
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim(),
    });
    if (error) alert(error.message);
    else {
      setSubmitted(true);
      setReason("");
      setTimeout(() => { setOpen(false); setSubmitted(false); }, 2000);
    }
  };

  if (!profile) return null;

  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem" }}>
      <button onClick={()=>setOpen(!open)} style={{ ...mkBtn("ghost"), minHeight:26, padding:"2px 7px", fontSize:10, color:"#8fa0bd" }}>
        {label || "Report"}
      </button>
      {open && (
        <span style={{ display:"inline-flex", gap:"0.35rem", alignItems:"flex-start" }}>
          {submitted ? (
            <span style={{ fontSize:11, color:"#2ecc71" }}>Reported</span>
          ) : (
            <>
              <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Why are you reporting this?" style={{ ...ta, minHeight:40, width:200, fontSize:11, padding:"5px 8px" }} />
              <button onClick={submitReport} style={{ ...mkBtn("red"), minHeight:26, padding:"3px 8px", fontSize:10 }}>Submit</button>
            </>
          )}
        </span>
      )}
    </span>
  );
};
