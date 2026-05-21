import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, timeAgo } from "../lib/uiUtils";

export const SettingsPage = ({ profile, onProfileUpdate }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const loadSettings = async () => {
    if (!profile) { setLoading(false); return; }
    setLoading(true);
    let { data } = await supabase.from("user_settings").select("*").eq("user_id", profile.id).single();
    if (!data) {
      const { data: inserted } = await supabase.from("user_settings").insert({ user_id: profile.id }).select().single();
      data = inserted;
    }
    if (data) setSettings(data);
    setLoading(false);
  };

  useEffect(() => { loadSettings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setMsg("");
    const { error } = await supabase.from("user_settings").update({
      notify_mentions: settings.notify_mentions,
      notify_replies: settings.notify_replies,
      notify_wars: settings.notify_wars,
      notify_actions: settings.notify_actions,
      notify_diplomacy: settings.notify_diplomacy,
      notify_assembly: settings.notify_assembly,
      updated_at: new Date().toISOString(),
    }).eq("user_id", profile.id);
    if (error) setMsg(error.message);
    else setMsg("Settings saved.");
    setSaving(false);
  };

  const notificationSettings = [
    { key: "notify_mentions", label: "@Mentions", desc: "When someone mentions you in a forum post or dispatch" },
    { key: "notify_replies", label: "Thread Replies", desc: "When someone replies to your forum thread" },
    { key: "notify_wars", label: "War Declarations", desc: "When your nation or alliance is involved in a war declaration" },
    { key: "notify_actions", label: "Action Status", desc: "When one of your actions changes status (approved/rejected/complete)" },
    { key: "notify_diplomacy", label: "Diplomacy", desc: "When someone proposes or ratifies a treaty with your nation" },
    { key: "notify_assembly", label: "World Assembly", desc: "When new resolutions are proposed in the World Assembly" },
  ];

  if (!profile) {
    return (
      <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
        <div style={{ color:"#8493ad", fontStyle:"italic" }}>Sign in to access settings.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:640, margin:"0 auto" }}>
      <h2 style={{ margin:"0 0 1.25rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:20 }}>Settings</h2>

      {loading ? (
        <div style={{ textAlign:"center", padding:"2rem", color:"#8493ad" }}>Loading settings...</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {/* Account Info */}
          <div style={card}>
            <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Account</h3>
            <div style={{ color:"#8fa0bd", fontSize:13, lineHeight:1.8 }}>
              <div><strong style={{ color:"#edf4ff" }}>Username:</strong> {profile.username}</div>
              <div><strong style={{ color:"#edf4ff" }}>Member since:</strong> {profile.created_at ? timeAgo(profile.created_at) : "—"}</div>
              <div><strong style={{ color:"#edf4ff" }}>Last active:</strong> {profile.last_active_at ? timeAgo(profile.last_active_at) : "—"}</div>
              {profile.nation_id && (
                <div><strong style={{ color:"#edf4ff" }}>Nation ID:</strong> {profile.nation_id}</div>
              )}
            </div>
          </div>

          {/* Notification Preferences */}
          <div style={card}>
            <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Notification Preferences</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {notificationSettings.map(ns => (
                <label key={ns.key} style={{ display:"flex", gap:"0.75rem", alignItems:"center", cursor:"pointer", padding:"0.5rem", borderRadius:6, background:"rgba(255,255,255,0.03)" }}>
                  <input
                    type="checkbox"
                    checked={settings ? settings[ns.key] : true}
                    onChange={() => toggleSetting(ns.key)}
                    style={{ accentColor:"#d4af37", width:16, height:16 }}
                  />
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#edf4ff", fontSize:13, fontWeight:600 }}>{ns.label}</div>
                    <div style={{ color:"#8fa0bd", fontSize:11 }}>{ns.desc}</div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:settings?.[ns.key]?"#2ecc71":"#8fa0bd", border:`1px solid ${settings?.[ns.key]?"#2ecc71":"#8fa0bd"}33`, borderRadius:4, padding:"2px 7px" }}>
                    {settings?.[ns.key] ? "ON" : "OFF"}
                  </span>
                </label>
              ))}
            </div>
            <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginTop:"1rem" }}>
              <button onClick={saveSettings} disabled={saving} style={mkBtn()}>{saving ? "Saving..." : "Save Preferences"}</button>
              {msg && <span style={{ fontSize:12, color:msg==="Settings saved."?"#2ecc71":"#e74c3c" }}>{msg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
