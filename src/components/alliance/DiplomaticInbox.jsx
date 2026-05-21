import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { card, mkBtn, inp, ta, timeAgo } from "../../lib/uiUtils";

export function DiplomaticInbox({ profile, nations, showStatus }) {
  const [dms, setDms] = useState([]);
  const [dmLoading, setDmLoading] = useState(false);
  const [unreadDms, setUnreadDms] = useState(0);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  useEffect(() => {
    if (!profile) return;
    setDmLoading(true);
    supabase.from("direct_messages").select("*").or(`from_id.eq.${profile.id},to_id.eq.${profile.id}`).order("created_at", { ascending: false }).limit(50).then(({ data }) => {
      if (data) { setDms(data); setUnreadDms(data.filter(d => d.to_id === profile.id && !d.read).length); }
      setDmLoading(false);
    });
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendDm = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) return;
    const { error } = await supabase.from("direct_messages").insert({ from_id: profile.id, to_id: composeTo, subject: composeSubject, body: composeBody || null });
    if (error) showStatus(error.message, "error"); else { setShowCompose(false); setComposeTo(""); setComposeSubject(""); setComposeBody(""); showStatus("Message sent"); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--display)", color: "#d4af37", fontSize: 15, flex: 1 }}>
          Diplomatic Inbox{unreadDms ? ` (${unreadDms})` : ""}
        </h3>
        <button onClick={() => setShowCompose(!showCompose)} style={{ ...mkBtn(), fontSize: 11 }}>
          {showCompose ? "Cancel" : "Compose"}
        </button>
      </div>
      {showCompose && (
        <div style={{ ...card, marginBottom: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <select value={composeTo} onChange={e => setComposeTo(e.target.value)} style={inp}>
              <option value="">Select recipient (nation leader)...</option>
              {nations.filter(n => n.id).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <input placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} style={inp} />
            <textarea placeholder="Message" value={composeBody} onChange={e => setComposeBody(e.target.value)} style={{ ...ta, minHeight: 80 }} />
            <button onClick={sendDm} style={mkBtn()}>Send Message</button>
          </div>
        </div>
      )}
      {dmLoading ? (
        <div style={{ ...card, textAlign: "center", padding: "2rem", color: "#8493ad" }}>Loading messages...</div>
      ) : dms.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "2rem" }}>
          <div style={{ color: "#8493ad", fontStyle: "italic", fontSize: 13 }}>No messages yet.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {dms.map(dm => {
            const isIncoming = dm.to_id === profile?.id;
            return (
              <div key={dm.id} style={{ ...card, opacity: isIncoming && !dm.read ? 1 : 0.7 }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: 11, color: "#8fa0bd" }}>
                    {isIncoming ? "From" : "To"} <strong style={{ color: "#edf4ff" }}>{dm.from_id || dm.to_id}</strong>
                  </span>
                  {isIncoming && !dm.read && <span style={{ fontSize: 9, fontWeight: 700, color: "#f6c132", background: "rgba(246,193,50,0.12)", borderRadius: 3, padding: "1px 5px" }}>NEW</span>}
                  <span style={{ fontSize: 10, color: "#8fa0bd", marginLeft: "auto" }}>{timeAgo(dm.created_at)}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#edf4ff", marginBottom: "0.25rem" }}>{dm.subject}</div>
                {dm.body && <div style={{ fontSize: 12, color: "#b8c4d8", lineHeight: 1.6 }}>{dm.body}</div>}
                {isIncoming && !dm.read && (
                  <button onClick={async () => {
                    await supabase.from("direct_messages").update({ read: true }).eq("id", dm.id);
                    setDms(dms.map(d => d.id === dm.id ? { ...d, read: true } : d));
                  }} style={{ ...mkBtn("ghost"), fontSize: 10, padding: "3px 8px", marginTop: "0.4rem" }}>Mark Read</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
