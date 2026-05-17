import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { mkBtn, timeAgo } from "../../lib/uiUtils";
import { fetchUnreadCount, fetchNotifications, markAsRead, markAllAsRead } from "../../lib/notifications";

export const NotificationsBell = ({ profile, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  const loadCount = useCallback(async () => {
    const c = await fetchUnreadCount(profile?.id);
    setUnread(c);
  }, [profile?.id]);

  const openDropdown = async () => {
    setOpen(true);
    setLoading(true);
    const items = await fetchNotifications(profile?.id);
    setNotifs(items);
    setLoading(false);
  };

  useEffect(() => {
    if (!profile?.id) return;
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [profile?.id, loadCount]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkRead = async (n) => {
    await markAsRead(n.id);
    setNotifs(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleMarkAll = async () => {
    await markAllAsRead(profile?.id);
    setNotifs(prev => prev.map(item => ({ ...item, read: true })));
    setUnread(0);
  };

  const handleClick = (n) => {
    if (!n.read) handleMarkRead(n);
    setOpen(false);
    if (n.link && onNavigate) onNavigate(n.link);
  };

  if (!profile?.id) return null;

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-flex" }}>
      <button
        onClick={() => open ? setOpen(false) : openDropdown()}
        style={{
          background:"transparent", border:"none", cursor:"pointer", position:"relative",
          minHeight:32, padding:"4px 6px", fontSize:18, lineHeight:1, color:"#9fb4d6",
        }}
        title="Notifications"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
      >
        {"\u{1F514}"}
        {unread > 0 && (
          <span style={{
            position:"absolute", top:-2, right:-2, minWidth:16, height:16,
            background:"#e74c3c", borderRadius:"50%", fontSize:9, fontWeight:900,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"#fff", padding:"0 3px", lineHeight:1,
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div style={{
          position:"absolute", top:"100%", right:0, width:340, maxHeight:420,
          background:"#0b1422", border:"1px solid rgba(78,128,190,0.3)", borderRadius:8,
          boxShadow:"0 18px 55px rgba(0,0,0,0.55)", zIndex:300, overflow:"hidden",
          display:"flex", flexDirection:"column", marginTop:4,
        }}>
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"0.65rem 0.85rem", borderBottom:"1px solid rgba(78,128,190,0.15)",
          }}>
            <span style={{ fontSize:12, fontWeight:800, color:"#d4af37", letterSpacing:"0.06em" }}>
              Notifications {unread > 0 && <span style={{ color:"#e74c3c" }}>({unread})</span>}
            </span>
            {unread > 0 && (
              <button onClick={handleMarkAll} style={{ ...mkBtn("ghost"), minHeight:26, padding:"3px 8px", fontSize:10 }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ overflowY:"auto", flex:1 }}>
            {loading && <div style={{ padding:"1rem", textAlign:"center", color:"#8fa0bd", fontSize:12 }}>Loading...</div>}
            {!loading && notifs.length === 0 && (
              <div style={{ padding:"2rem", textAlign:"center", color:"#8fa0bd", fontSize:13, fontStyle:"italic" }}>
                No notifications yet.
              </div>
            )}
            {!loading && notifs.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding:"0.7rem 0.85rem", cursor:"pointer", fontSize:12, lineHeight:1.5,
                  borderBottom:"1px solid rgba(78,128,190,0.08)",
                  background: n.read ? "transparent" : "rgba(212,175,55,0.06)",
                  transition:"background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(78,128,190,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(212,175,55,0.06)"}
              >
                <div style={{ fontWeight: n.read ? 500 : 700, color:"#edf4ff" }}>{n.title}</div>
                {n.body && <div style={{ color:"#8fa0bd", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.body}</div>}
                <div style={{ fontSize:10, color:"#6a7e9f", marginTop:3 }}>{timeAgo(n.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
