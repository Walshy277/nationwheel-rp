import { useState } from "react";
import { supabase } from "../lib/supabase";
import { card, mkBtn, inp, ta, timeAgo } from "../lib/uiUtils";
import { EVENT_CATEGORIES, EVENT_SEVERITY } from "../lib/constants";

const CATEGORY_ICONS = {
  natural_disaster: "🌪️", nomad_activity: "🐪", disease: "🦠",
  discovery: "🔬", economic: "💰", political: "🏛️", magical: "🔮", other: "❓",
};

const SEVERITY_COLORS = {
  minor: "#8fa0bd", moderate: "#f39c12", major: "#e74c3c", cataclysmic: "#9b59b6",
};

const STATUS_COLORS = {
  proposed: "#7f8c8d", approved: "#3498db", active: "#2ecc71", completed: "#2ecc71", rejected: "#e74c3c",
};

export const EventsPage = ({ profile, isMod, onRefresh }) => {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "natural_disaster", severity: "minor", affected_region: "" });
  const [managing, setManaging] = useState(null);
  const [loreNotes, setLoreNotes] = useState("");

  if (loading && !events) {
    supabase.from("global_events").select("*").order("created_at", { ascending: false }).limit(50).then(({ data }) => {
      setEvents(data || []);
      setLoading(false);
    });
  }

  const submit = async () => {
    if (!form.title.trim()) return;
    await supabase.from("global_events").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      severity: form.severity,
      affected_region: form.affected_region.trim() || null,
      proposed_by: profile?.id,
    });
    setForm({ title: "", description: "", category: "natural_disaster", severity: "minor", affected_region: "" });
    setShowForm(false);
    if (onRefresh) onRefresh();
    const { data } = await supabase.from("global_events").select("*").order("created_at", { ascending: false }).limit(50);
    setEvents(data || []);
  };

  const updateStatus = async (event, newStatus) => {
    const update = {
      status: newStatus,
      lore_notes: loreNotes.trim() || event.lore_notes,
    };
    if (newStatus === "approved" || newStatus === "active") {
      update.canonized_by = profile?.id;
      update.canonized_at = new Date().toISOString();
    }
    await supabase.from("global_events").update(update).eq("id", event.id);
    setManaging(null);
    setLoreNotes("");
    const { data } = await supabase.from("global_events").select("*").order("created_at", { ascending: false }).limit(50);
    setEvents(data || []);
  };

  const allEvents = events || [];
  const activeEvents = allEvents.filter(e => e.status === "active" || e.status === "approved");
  const proposedEvents = allEvents.filter(e => e.status === "proposed");
  const completedEvents = allEvents.filter(e => e.status === "completed" || e.status === "rejected");

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", fontFamily: "var(--display)", color: "#d4af37", fontSize: 22 }}>Global Events</h2>
          <p style={{ margin: 0, color: "#9fb4d6", fontSize: 13, lineHeight: 1.65 }}>
            World-shaking events — natural disasters, discoveries, plagues, and more.
          </p>
        </div>
        {isMod && (
          <button onClick={() => setShowForm(!showForm)} style={mkBtn()}>
            {showForm ? "Cancel" : "+ New Event"}
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#8493ad", fontSize: 13 }}>Loading events...</div>
      )}

      {showForm && isMod && (
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <h4 style={{ margin: "0 0 0.75rem", fontFamily: "var(--display)", color: "#f6c132", fontSize: 14 }}>Propose New Event</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <input placeholder="Event title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inp} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inp, flex: 1 }}>
                {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
              <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} style={{ ...inp, width: 130 }}>
                {EVENT_SEVERITY.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <input placeholder="Affected region (e.g. 'Eastern continent, Port cities')" value={form.affected_region} onChange={e => setForm({ ...form, affected_region: e.target.value })} style={inp} />
            <textarea placeholder="Event description — what happens, who is affected, lasting consequences..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...ta, minHeight: 100 }} />
            <button onClick={submit} disabled={!form.title.trim()} style={mkBtn("green")}>Submit Event</button>
          </div>
        </div>
      )}

      {!loading && activeEvents.length === 0 && proposedEvents.length === 0 && completedEvents.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9fb4d6", fontSize: 13 }}>
          No global events yet. {isMod ? "Use the button above to propose one." : ""}
        </div>
      )}

      {activeEvents.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontFamily: "var(--display)", color: "#2ecc71", fontSize: 15, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>🔴</span> Active Events
          </h3>
          {activeEvents.map(e => <EventCard key={e.id} event={e} isMod={isMod} profile={profile} managing={managing} setManaging={setManaging} loreNotes={loreNotes} setLoreNotes={setLoreNotes} updateStatus={updateStatus} />)}
        </section>
      )}

      {isMod && proposedEvents.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontFamily: "var(--display)", color: "#7f8c8d", fontSize: 15, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>📋</span> Proposed ({proposedEvents.length})
          </h3>
          {proposedEvents.map(e => <EventCard key={e.id} event={e} isMod={isMod} profile={profile} managing={managing} setManaging={setManaging} loreNotes={loreNotes} setLoreNotes={setLoreNotes} updateStatus={updateStatus} />)}
        </section>
      )}

      {completedEvents.length > 0 && (
        <section>
          <h3 style={{ margin: "0 0 0.75rem", fontFamily: "var(--display)", color: "#8fa0bd", fontSize: 15, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>📜</span> Historical Events
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {completedEvents.map(e => <EventCard key={e.id} event={e} isMod={isMod} profile={profile} managing={managing} setManaging={setManaging} loreNotes={loreNotes} setLoreNotes={setLoreNotes} updateStatus={updateStatus} />)}
          </div>
        </section>
      )}
    </div>
  );
};

function EventCard({ event, isMod, profile, managing, setManaging, loreNotes, setLoreNotes, updateStatus }) {
  const isManaging = managing === event.id;
  return (
    <div style={{ ...card, marginBottom: "0.5rem", borderLeft: `3px solid ${SEVERITY_COLORS[event.severity] || "#8fa0bd"}` }}>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
        <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[event.category] || "❓"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <h4 style={{ margin: 0, fontFamily: "var(--display)", color: "#edf4ff", fontSize: 15 }}>{event.title}</h4>
            <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLORS[event.status] || "#8fa0bd", border: `1px solid ${STATUS_COLORS[event.status] || "#8fa0bd"}44`, borderRadius: 3, padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{event.status}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: SEVERITY_COLORS[event.severity] || "#8fa0bd", border: `1px solid ${SEVERITY_COLORS[event.severity] || "#8fa0bd"}44`, borderRadius: 3, padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{event.severity}</span>
          </div>
          <div style={{ color: "#9fb4d6", fontSize: 11, marginTop: "0.2rem" }}>
            {event.category.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            {event.affected_region && <span> &middot; {event.affected_region}</span>}
            <span> &middot; {timeAgo(event.created_at)}</span>
          </div>
          {event.description && (
            <p style={{ color: "#d7e2f2", fontSize: 13, lineHeight: 1.7, margin: "0.5rem 0 0" }}>{event.description}</p>
          )}
          {event.canonized_by && event.status !== "proposed" && (
            <p style={{ color: "#8fa0bd", fontSize: 11, margin: "0.35rem 0 0" }}>
              Canonized by staff {event.canonized_at ? timeAgo(event.canonized_at) : ""}
            </p>
          )}
          {event.lore_notes && isMod && (
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 4, padding: "0.4rem 0.6rem", marginTop: "0.5rem", fontSize: 12, color: "#b8c4d8" }}>
              <strong style={{ color: "#8fa0bd" }}>Staff notes:</strong> {event.lore_notes}
            </div>
          )}
        </div>
      </div>

      {isMod && isManaging && (
        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(78,128,190,0.15)" }}>
          <textarea placeholder="Staff notes (visible to staff only)" value={loreNotes} onChange={e => setLoreNotes(e.target.value)} style={{ ...ta, minHeight: 50, fontSize: 12 }} />
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            {event.status === "proposed" && (
              <>
                <button onClick={() => updateStatus(event, "approved")} style={mkBtn("blue")}>Approve</button>
                <button onClick={() => updateStatus(event, "active")} style={mkBtn("green")}>Approve & Activate</button>
                <button onClick={() => updateStatus(event, "rejected")} style={mkBtn("red")}>Reject</button>
              </>
            )}
            {event.status === "approved" && (
              <>
                <button onClick={() => updateStatus(event, "active")} style={mkBtn("green")}>Activate</button>
                <button onClick={() => updateStatus(event, "completed")} style={mkBtn()}>Complete</button>
                <button onClick={() => updateStatus(event, "rejected")} style={mkBtn("red")}>Reject</button>
              </>
            )}
            {event.status === "active" && (
              <button onClick={() => updateStatus(event, "completed")} style={mkBtn("green")}>Mark Completed</button>
            )}
            <button onClick={() => { setManaging(null); setLoreNotes(""); }} style={mkBtn("ghost")}>Cancel</button>
          </div>
        </div>
      )}

      {isMod && !isManaging && (
        <div style={{ marginTop: "0.5rem" }}>
          <button onClick={() => { setManaging(event.id); setLoreNotes(event.lore_notes || ""); }} style={{ ...mkBtn("ghost"), fontSize: 11, padding: "3px 8px" }}>
            {event.status === "proposed" ? "Review" : "Manage"}
          </button>
        </div>
      )}
    </div>
  );
}
