import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, timeAgo, fmtDate, isMissingOptionalProfileSchema, ROLE_LABELS, ROLE_COLORS, getRoles } from "../lib/uiUtils";
import { NationPill } from "../components/nation/NationPill";
import { CommunityUsers } from "../components/profile/CommunityUsers";
import { ProfileMediaUploader } from "../components/profile/ProfileMediaUploader";

export const ProfilePage = ({ profile, profiles, userNation, onProfileUpdate, onViewProfile }) => {
  const [form, setForm] = useState({ username:profile?.username||"", bio:profile?.bio||"", signature_text:profile?.signature_text||"" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setForm({ username:profile?.username||"", bio:profile?.bio||"", signature_text:profile?.signature_text||"" });
  }, [profile?.username, profile?.bio, profile?.signature_text]);

  const save = async () => {
    if (!profile) return;
    const username = form.username.trim();
    if (!username) {
      setMsg("Username is required.");
      return;
    }
    setSaving(true);
    setMsg("");
    let nextMsg = "Profile saved.";
    let payload = { username, bio:form.bio.trim() || null, signature_text:form.signature_text.trim() || null };
    let { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profile.id)
      .select("*")
      .single();
    if (isMissingOptionalProfileSchema(error)) {
      const retry = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", profile.id)
        .select("*")
        .single();
      data = retry.data;
      error = retry.error;
      if (!error) nextMsg = "Username saved. Run supabase-profile-setup.sql to enable bios, avatars, and signatures.";
    }
    if (error) setMsg(error.message);
    else {
      onProfileUpdate(data);
      setMsg(nextMsg);
    }
    setSaving(false);
  };

  const removeSignatureImage = async () => {
    if (!confirm("Remove your forum signature image?")) return;
    const { error } = await supabase.from("profiles").update({ signature_url: null }).eq("id", profile.id).select("*").single();
    if (error) alert(error.message);
    else onProfileUpdate(error ? null : { ...profile, signature_url: null });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Profile</h2>
        {userNation && <NationPill nation={userNation} />}
      </div>

      <div className="profile-grid" style={{ display:"grid", gridTemplateColumns:"minmax(0, 1fr) 320px", gap:"1rem", alignItems:"start" }}>
        <div style={{ ...card, display:"flex", flexDirection:"column", gap:"0.8rem" }}>
          <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#edf4ff", fontSize:15 }}>Account Details</h3>
          <label style={{ display:"flex", flexDirection:"column", gap:"0.35rem", color:"#8fa0bd", fontSize:12 }}>
            Username
            <input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} style={inp} />
          </label>
          <label style={{ display:"flex", flexDirection:"column", gap:"0.35rem", color:"#8fa0bd", fontSize:12 }}>
            Bio
            <textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Short public profile bio" style={{ ...ta, minHeight:100 }} />
          </label>
          <label style={{ display:"flex", flexDirection:"column", gap:"0.35rem", color:"#8fa0bd", fontSize:12 }}>
            Forum Signature Text
            <textarea value={form.signature_text} onChange={e=>setForm({...form,signature_text:e.target.value})} placeholder="Text shown below your forum posts (plain text, supports BBCode)" style={{ ...ta, minHeight:60 }} />
          </label>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={save} disabled={saving} style={mkBtn()}>{saving ? "Saving" : "Save Profile"}</button>
            {msg && <span style={{ fontSize:12, color:msg==="Profile saved."?"#2ecc71":"#e74c3c" }}>{msg}</span>}
          </div>
        </div>

        <aside style={{ ...card, display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div>
            <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.6rem" }}>Avatar</div>
            <ProfileMediaUploader profileId={profile.id} field="avatar_url" currentUrl={profile.avatar_url} label="Avatar" onUploaded={onProfileUpdate} />
          </div>
          <div>
            <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.6rem" }}>Signature Image</div>
            <ProfileMediaUploader profileId={profile.id} field="signature_url" currentUrl={profile.signature_url} label="Signature" onUploaded={onProfileUpdate} ratio="5 / 1" />
            {profile.signature_url && (
              <button onClick={removeSignatureImage} style={{ ...mkBtn("red"), marginTop:"0.5rem", fontSize:10, padding:"4px 10px", minHeight:28 }}>Remove Signature Image</button>
            )}
          </div>
        </aside>
      </div>

      <div className="profile-preview" style={card}>
        <div style={{ display:"flex", gap:"1rem", alignItems:"flex-start", flexWrap:"wrap" }}>
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width:108, height:108, borderRadius:"50%", objectFit:"cover", border:"1px solid rgba(246,193,50,0.28)", boxShadow:"0 14px 35px rgba(0,0,0,0.35)" }} /> : <div style={{ width:108, height:108, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(246,193,50,0.18)" }} />}
          <div style={{ flex:1, minWidth:180 }}>
              <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:22, fontWeight:900 }}>{profile.username}</div>
              <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap" }}>
                {getRoles(profile).map(r => (
                  <span key={r} style={{ fontSize:9, fontWeight:700, color:ROLE_COLORS[r]||"#8fa0bd", border:`1px solid ${ROLE_COLORS[r]||"#8fa0bd"}33`, borderRadius:4, padding:"2px 7px", letterSpacing:"0.06em", textTransform:"uppercase" }}>
                    {ROLE_LABELS[r] || r}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ color:"#8fa0bd", fontSize:12, marginTop:4 }}>
              {profile.status && profile.status !== "active" ? `${profile.status} - ` : ""}{profile.last_active_at ? `Last active ${timeAgo(profile.last_active_at)}` : "Activity not recorded yet"}
            </div>
            {profile.bio && <p style={{ margin:"0.75rem 0 0", color:"#d7e2f2", lineHeight:1.75, fontSize:13, whiteSpace:"pre-wrap" }}>{profile.bio}</p>}
            {(profile.signature_url || profile.signature_text) && (
              <div style={{ marginTop:"0.85rem", paddingTop:"0.75rem", borderTop:"1px solid rgba(20,96,184,0.16)" }}>
                {profile.signature_text && <div style={{ fontSize:12, color:"#8fa0bd", fontStyle:"italic", marginBottom:profile.signature_url?"0.5rem":0 }}>{profile.signature_text}</div>}
                {profile.signature_url && <img src={profile.signature_url} alt="" style={{ maxWidth:"100%", maxHeight:110, objectFit:"contain" }} />}
              </div>
            )}
          </div>
        </div>
      </div>
      <CommunityUsers profiles={profiles} onViewProfile={onViewProfile} />
    </div>
  );
};
