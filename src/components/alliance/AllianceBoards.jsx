import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { card, mkBtn, inp, ta, timeAgo } from "../../lib/uiUtils";

export function AllianceBoards({ allianceMembers, userNation, profile, alliances, showStatus }) {
  const [boards, setBoards] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [boardPosts, setBoardPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardAllianceId, setNewBoardAllianceId] = useState("");

  const loadBoards = async () => {
    const ids = allianceMembers.filter(m => m.nation_id === userNation?.id).map(m => m.alliance_id);
    if (!ids.length) { setBoards([]); return; }
    setBoardLoading(true);
    const { data } = await supabase.from("alliance_boards").select("*, alliances:alliance_id(name)").in("alliance_id", ids).order("created_at", { ascending: false });
    setBoards(data || []);
    setBoardLoading(false);
  };

  useEffect(() => { loadBoards(); }, [userNation?.id, allianceMembers]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBoardPosts = async (boardId) => {
    setSelectedBoard(boardId);
    setBoardPosts([]);
    const { data } = await supabase.from("alliance_board_posts").select("*").eq("board_id", boardId).order("created_at", { ascending: true });
    setBoardPosts(data || []);
  };

  const postToBoard = async () => {
    if (!newPost.trim() || !selectedBoard) return;
    const { error } = await supabase.from("alliance_board_posts").insert({ board_id: selectedBoard, author_id: profile.id, body: newPost });
    if (error) showStatus(error.message, "error"); else { setNewPost(""); loadBoardPosts(selectedBoard); }
  };

  const createBoard = async () => {
    if (!newBoardName.trim() || !newBoardAllianceId) return;
    const { error } = await supabase.from("alliance_boards").insert({ alliance_id: newBoardAllianceId, title: newBoardName });
    if (error) showStatus(error.message, "error"); else { setShowNewBoard(false); setNewBoardName(""); setNewBoardAllianceId(""); loadBoards(); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--display)", color: "#d4af37", fontSize: 15, flex: 1 }}>
          {selectedBoard ? "Board Posts" : "Alliance Boards"}
        </h3>
        {selectedBoard ? (
          <button onClick={() => setSelectedBoard(null)} style={{ ...mkBtn("ghost"), fontSize: 11 }}>Back</button>
        ) : (
          <button onClick={() => setShowNewBoard(!showNewBoard)} style={{ ...mkBtn(), fontSize: 11 }}>
            {showNewBoard ? "Cancel" : "New Board"}
          </button>
        )}
      </div>
      {showNewBoard && !selectedBoard && (
        <div style={{ ...card, marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <select value={newBoardAllianceId} onChange={e => setNewBoardAllianceId(e.target.value)} style={{ ...inp, width: "auto", flex: 1 }}>
              <option value="">Select alliance...</option>
              {allianceMembers.filter(m => m.nation_id === userNation?.id && m.role === "leader")
                .map(m => {
                  const a = alliances?.find(al => al.id === m.alliance_id);
                  return a ? <option key={a.id} value={a.id}>{a.name}</option> : null;
                })}
            </select>
            <input placeholder="Board title" value={newBoardName} onChange={e => setNewBoardName(e.target.value)} style={{ ...inp, flex: 1 }} />
            <button onClick={createBoard} style={mkBtn()}>Create</button>
          </div>
        </div>
      )}
      {!selectedBoard && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {boardLoading ? (
            <div style={{ ...card, textAlign: "center", padding: "2rem", color: "#8493ad" }}>Loading boards...</div>
          ) : boards.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: "2rem" }}>
              <div style={{ color: "#8493ad", fontStyle: "italic", fontSize: 13 }}>No discussion boards for your alliances.</div>
            </div>
          ) : boards.map(b => (
            <div key={b.id} style={{ ...card, cursor: "pointer", padding: "0.85rem" }} onClick={() => loadBoardPosts(b.id)}>
              <div style={{ fontSize: 13, color: "#edf4ff", fontWeight: 700 }}>{b.title}</div>
              <div style={{ fontSize: 11, color: "#8fa0bd" }}>{b.alliances?.name || "?"}</div>
            </div>
          ))}
        </div>
      )}
      {selectedBoard && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {boardPosts.length === 0 && <div style={{ ...card, textAlign: "center", padding: "1.5rem", color: "#8493ad", fontStyle: "italic", fontSize: 13 }}>No posts yet.</div>}
          {boardPosts.map(p => (
            <div key={p.id} style={card}>
              <div style={{ fontSize: 11, color: "#8fa0bd", marginBottom: "0.35rem" }}>{p.author_id} · {timeAgo(p.created_at)}</div>
              <div className="rich-post">{p.body}</div>
            </div>
          ))}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Write a post..." style={{ ...ta, flex: 1, minHeight: 60 }} />
            <button onClick={postToBoard} style={{ ...mkBtn(), alignSelf: "flex-end" }}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}
