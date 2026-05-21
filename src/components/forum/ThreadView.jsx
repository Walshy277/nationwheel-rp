import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { RichText } from "../../lib/richText";
import { card, mkBtn, inp, ta, timeAgo, isProfileBlocked, mergeThreadPostPages } from "../../lib/uiUtils";
import { FORUM_PAGE_SIZE, REACT_EMOJIS } from "../../lib/constants";
import { Flag } from "../nation/Flag";
import BBCodeToolbar from "./BBCodeToolbar";
import { createMentionNotifications, notifyThreadReply } from "../../lib/notifications";
import { useToast } from "../../lib/ToastContext";

function ProfileButton({ profile, onViewProfile, children, style = {} }) {
  if (!profile?.id || !onViewProfile) return <span style={style}>{children || profile?.username || "Unknown"}</span>;
  return (
    <button onClick={(e) => { e.stopPropagation(); onViewProfile(profile.id); }}
      style={{ background: "transparent", border: "none", padding: 0, minHeight: 0, color: "inherit", cursor: "pointer", font: "inherit", textAlign: "left", ...style }}>
      {children || profile.username || "Unknown"}
    </button>
  );
}

function PostCard({ post, postNumber, thread, reactions, profile, nations, isMod, onViewProfile, onRefresh, replySort }) {
  const showStatus = useToast();
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const pNation = nations.find(n => n.id === post.nation_id);
  const authorAvatar = post.profiles?.avatar_url;
  const authorName = post.profiles?.username || "Unknown";
  const canonStatus = post.canon_status || null;

  const toggleReaction = async (emoji) => {
    if (!profile) return;
    const existing = reactions.find(r => r.post_id === post.id && r.user_id === profile.id && r.emoji === emoji);
    const result = existing
      ? await supabase.from("forum_reactions").delete().eq("id", existing.id)
      : await supabase.from("forum_reactions").insert({ post_id: post.id, user_id: profile.id, emoji });
    if (result.error) showStatus(result.error.message, "error"); else onRefresh();
  };

  const savePost = async () => {
    const { error } = await supabase.from("forum_posts").update({ body: editBody }).eq("id", post.id);
    if (error) showStatus(error.message, "error");
    else { setEditing(false); onRefresh(); }
  };

  const deletePost = async () => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("forum_posts").delete().eq("id", post.id);
    if (error) showStatus(error.message, "error");
    else { await supabase.rpc("refresh_forum_counts"); onRefresh(); }
  };

  const setCanonStatus = async (status) => {
    const { error } = await supabase.from("forum_posts").update({
      canon_status: status, canon_marked_by: profile?.id || null, canon_marked_at: new Date().toISOString(),
    }).eq("id", post.id);
    if (error) showStatus(error.message, "error"); else onRefresh();
  };

  const postLink = () => `${window.location.origin}/forums/thread/${thread.id}#post-${post.post_number || post.id}`;

  return (
    <div id={`post-${post.post_number || post.id}`} className="post-card forum-post-layout" style={{
      ...card, borderLeft: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)",
      padding: "1.25rem", scrollMarginTop: 70
    }}>
      <aside className="post-author" style={{ width: 150, flexShrink: 0 }}>
        {authorAvatar
          ? <img src={authorAvatar} alt="" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(246,193,50,0.2)" }} />
          : pNation
            ? <Flag nation={pNation} size={96} />
            : <div style={{ width: 96, height: 96, background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />
        }
        <ProfileButton profile={post.profiles} onViewProfile={onViewProfile} style={{ marginTop: "0.65rem", fontSize: 13, color: "#d4af37", fontWeight: 800, lineHeight: 1.35, display: "block" }}>{authorName}</ProfileButton>
        {pNation && <div style={{ marginTop: "0.25rem", fontSize: 11, color: "#8fa0bd", lineHeight: 1.35 }}>{pNation.name}</div>}
        <a href={`/forums/thread/${thread.id}#post-${post.post_number || post.id}`} style={{ display: "inline-block", marginTop: "0.45rem", fontSize: 11, color: "#8fa0bd", textDecoration: "none" }}>
          #{post.post_number || postNumber} - {timeAgo(post.created_at)}
        </a>
      </aside>
      <div className="post-body" style={{ flex: 1, minWidth: 0 }}>
        {canonStatus && (
          <div style={{ display: "inline-flex", marginBottom: "0.75rem", color: canonStatus === "canon" ? "#111" : "#f5f8ff", background: canonStatus === "canon" ? "#f6c132" : "rgba(231,76,60,0.2)", border: `1px solid ${canonStatus === "canon" ? "rgba(246,193,50,0.35)" : "rgba(231,76,60,0.35)"}`, borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {canonStatus === "canon" ? "Canon" : "Non-Canon"}
          </div>
        )}
        {editing ? (
          <div>
            <textarea value={editBody} onChange={e => setEditBody(e.target.value)} style={{ ...ta, minHeight: 120 }} />
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
              <button onClick={savePost} style={{ ...mkBtn(), fontSize: 11 }}>Save</button>
              <button onClick={() => setEditing(false)} style={{ ...mkBtn("ghost"), fontSize: 11 }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "14px", lineHeight: "1.7", color: "#d6deeb", maxWidth: "720px", marginTop: "0.5rem" }}>
            <RichText>{post.body}</RichText>
            {(post.profiles?.signature_url || post.profiles?.signature_text) && (
              <div style={{ marginTop: "0.75rem", paddingTop: "0.65rem", borderTop: "1px solid rgba(20,96,184,0.14)" }}>
                {post.profiles?.signature_text && <div style={{ fontSize: 11, color: "#8fa0bd", fontStyle: "italic", marginBottom: post.profiles?.signature_url ? "0.4rem" : 0, lineHeight: 1.6 }}>{post.profiles.signature_text}</div>}
                {post.profiles?.signature_url && <img className="post-signature" src={post.profiles.signature_url} alt="" style={{ maxWidth: "100%", opacity: 0.9 }} />}
              </div>
            )}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.9rem", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid rgba(78,128,190,0.12)" }}>
          <span style={{ fontSize: 10, color: "#8fa0bd", marginRight: "0.25rem" }}>React:</span>
          {REACT_EMOJIS.map(e => {
            const count = reactions.filter(r => r.post_id === post.id && r.emoji === e).length;
            const active = reactions.some(r => r.post_id === post.id && r.user_id === profile?.id && r.emoji === e);
            return <button key={e} onClick={() => toggleReaction(e)} style={{ ...mkBtn(active ? "gold" : "ghost"), minHeight: 28, padding: "2px 6px", fontSize: 13, lineHeight: 1 }}>{e}{count > 0 ? <span style={{ fontSize: 10, marginLeft: 2 }}>{count}</span> : ""}</button>;
          })}
          <span style={{ width: 1, height: 20, background: "rgba(78,128,190,0.2)", margin: "0 0.25rem" }} />
          {(isMod || post.author_id === profile?.id) && <button onClick={() => { setEditing(true); setEditBody(post.body); }} style={{ ...mkBtn("ghost"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Edit</button>}
          {(isMod || post.author_id === profile?.id) && <button onClick={deletePost} style={{ ...mkBtn("red"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Delete</button>}
          {isMod && <span style={{ width: 1, height: 20, background: "rgba(78,128,190,0.2)", margin: "0 0.25rem" }} />}
          {isMod && <button onClick={() => setCanonStatus("canon")} style={{ ...mkBtn(canonStatus === "canon" ? "gold" : "ghost"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Canon</button>}
          {isMod && <button onClick={() => setCanonStatus("non_canon")} style={{ ...mkBtn(canonStatus === "non_canon" ? "red" : "ghost"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Non-Canon</button>}
          {isMod && canonStatus && <button onClick={() => setCanonStatus(null)} style={{ ...mkBtn("ghost"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Clear Tag</button>}
          <button onClick={() => navigator.clipboard?.writeText(postLink())} style={{ ...mkBtn("ghost"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Copy Link</button>
        </div>
      </div>
    </div>
  );
}

export function ThreadView({ thread, board, profile, userNation, nations, isMod, onBack, onRefresh, onViewProfile }) {
  const showStatus = useToast();
  const [posts, setPosts] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replySort, setReplySort] = useState("desc");
  const [editorTab, setEditorTab] = useState("write");
  const [hasMore, setHasMore] = useState(false);

  const composerTextarea = { ...ta, minHeight: 240, lineHeight: 1.7, padding: "1rem", fontSize: 16 };
  const appendBBCode = (open, close) => setReplyBody(current => `${current}${open}${close}`);

  const normalizePost = p => ({
    ...p,
    profiles: p.profiles || { id: p.author_id, username: p.author_username, avatar_url: p.author_avatar_url, signature_url: p.author_signature_url, bio: p.author_bio },
    nations: p.nations || { name: p.nation_name, flag_url: p.nation_flag_url },
  });

  const loadPosts = useCallback(async (replyOffset = 0, append = false, sortOrder = "desc") => {
    if (!thread) return;
    setLoading(true); setError("");
    const postSelect = "*, profiles:author_id(id,username,role,status,avatar_url,signature_url,bio,last_active_at,created_at,nation_id), nations:nation_id(name,flag_url)";
    const openingResult = await supabase.from("forum_posts").select(postSelect).eq("thread_id", thread.id)
      .or("is_deleted.is.null,is_deleted.eq.false").order("created_at", { ascending: true }).order("id", { ascending: true }).limit(1).maybeSingle();
    if (openingResult.error) { setError(openingResult.error.message); setLoading(false); return; }
    const openingPost = openingResult.data ? normalizePost(openingResult.data) : null;
    let replyQuery = supabase.from("forum_posts").select(postSelect).eq("thread_id", thread.id).or("is_deleted.is.null,is_deleted.eq.false");
    if (openingPost?.id) replyQuery = replyQuery.neq("id", openingPost.id);
    const replyResult = await replyQuery.order("created_at", { ascending: sortOrder === "asc" }).order("id", { ascending: sortOrder === "asc" }).range(replyOffset, replyOffset + FORUM_PAGE_SIZE - 1);
    if (replyResult.error) {
      const fallback = await supabase.from("forum_posts").select("*, profiles:author_id(id,username,role,status,avatar_url,signature_url,bio,last_active_at,created_at,nation_id)")
        .eq("thread_id", thread.id).or("is_deleted.is.null,is_deleted.eq.false").order("created_at", { ascending: sortOrder === "asc" }).range(replyOffset, replyOffset + FORUM_PAGE_SIZE - 1);
      if (fallback.error) { setError(fallback.error.message); setLoading(false); return; }
      const rows = (fallback.data || []).map(normalizePost);
      const merged = openingPost ? [openingPost, ...rows.filter(p => p.id !== openingPost.id)] : rows;
      setPosts(current => append ? mergeThreadPostPages(current, merged) : merged);
      setHasMore(rows.filter(p => p.id !== openingPost?.id).length === FORUM_PAGE_SIZE);
      loadReactions(merged.map(p => p.id), append);
      setLoading(false); return;
    }
    const replyRows = (replyResult.data || []).map(normalizePost);
    const nextRows = openingPost ? [openingPost, ...replyRows] : replyRows;
    setPosts(current => append ? mergeThreadPostPages(current, nextRows) : nextRows);
    setHasMore(replyRows.length === FORUM_PAGE_SIZE);
    loadReactions(nextRows.map(p => p.id), append);
    setLoading(false);
  }, [thread]);

  const loadReactions = async (postIds, append = false) => {
    if (!postIds.length) { if (!append) setReactions([]); return; }
    const { data } = await supabase.from("forum_reactions").select("*").in("post_id", postIds);
    if (data) setReactions(current => append ? [...current.filter(r => !postIds.includes(r.post_id)), ...data] : data);
  };

  useEffect(() => { loadPosts(0, false, replySort); }, [loadPosts, replySort]);

  const submitReply = async () => {
    if (!replyBody.trim()) return;
    if (isProfileBlocked(profile)) { showStatus("Your account is not currently allowed to reply.", "error"); return; }
    const { error } = await supabase.from("forum_posts").insert({ thread_id: thread.id, author_id: profile.id, nation_id: userNation?.id || null, body: replyBody });
    if (error) { showStatus(`Reply failed: ${error.message}`, "error"); return; }
    createMentionNotifications({ body: replyBody, sourceTitle: thread.title, sourceLink: window.location.href, sourceType: "forum", allProfiles: [] });
    notifyThreadReply({ thread, replyAuthorId: profile?.id, replyBody, replyLink: window.location.href, threadAuthorId: thread.author_id || thread.profiles?.id });
    setReplyBody("");
    onRefresh();
  };

  const setThreadLocked = async (locked) => {
    const { error } = await supabase.from("forum_threads").update({ locked }).eq("id", thread.id);
    if (error) showStatus(error.message, "error"); else onRefresh();
  };

  const deleteThread = async () => {
    if (!confirm("Delete this thread and all posts?")) return;
    const { error } = await supabase.from("forum_threads").delete().eq("id", thread.id);
    if (error) showStatus(error.message, "error"); else { await supabase.rpc("refresh_forum_counts"); onBack(); }
  };

  const canManage = isMod || thread.author_id === profile?.id;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <button onClick={onBack} style={{ ...mkBtn("ghost"), marginBottom: "0.75rem", fontSize: 12 }}>← {board?.name || "All Boards"}</button>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 auto", minWidth: 180 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--display)", color: "#d4af37", fontSize: 18, lineHeight: 1.4 }}>{thread.title}</h2>
          <div style={{ fontSize: 11, color: "#8fa0bd", marginTop: "0.3rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span>Reply #{Number(thread.reply_count || 0)}</span>
            {thread.last_post_at && <span>· Last active {timeAgo(thread.last_post_at)}</span>}
            {thread.pinned && <span style={{ color: "#d4af37" }}>· Pinned</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
          <span style={{ color: "#8fa0bd", fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>Sort:</span>
          <select value={replySort} onChange={e => setReplySort(e.target.value)} style={{ ...inp, width: "auto", minHeight: 36, padding: "7px 28px 7px 10px", fontSize: 12 }}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          {canManage && <button onClick={() => setThreadLocked(!thread.locked)} style={{ ...mkBtn("ghost"), fontSize: 11 }}>{thread.locked ? "🔓 Open" : "🔒 Close"}</button>}
          {canManage && <button onClick={deleteThread} style={{ ...mkBtn("red"), fontSize: 11 }}>Delete</button>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {error && <p style={{ color: "#ff9d9d", textAlign: "center", padding: "1rem" }}>{error}</p>}
        {posts.length > 0 && (() => {
          const original = posts[0];
          const replies = posts.slice(1);
          return (
            <>
              <div style={{ ...card, border: "1px solid rgba(212,175,55,0.32)", background: "rgba(212,175,55,0.06)", padding: "1.5rem", scrollMarginTop: 70 }}
                id={`post-${original.post_number || original.id}`}>
                <div className="forum-post-layout" style={{ display: "flex", gap: "1.25rem" }}>
                  <aside className="post-author" style={{ width: 150, flexShrink: 0 }}>
                    {original.profiles?.avatar_url
                      ? <img src={original.profiles.avatar_url} alt="" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(246,193,50,0.2)" }} />
                      : (() => { const on = nations.find(n => n.id === original.nation_id); return on ? <Flag nation={on} size={96} /> : <div style={{ width: 96, height: 96, background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />; })()
                    }
                    <ProfileButton profile={original.profiles} onViewProfile={onViewProfile} style={{ marginTop: "0.65rem", fontSize: 13, color: "#d4af37", fontWeight: 800, lineHeight: 1.35, display: "block" }}>
                      {original.profiles?.username || "Unknown"}
                    </ProfileButton>
                    {(() => { const on = nations.find(n => n.id === original.nation_id); return on && <div style={{ marginTop: "0.25rem", fontSize: 11, color: "#8fa0bd", lineHeight: 1.35 }}>{on.name}</div>; })()}
                    <div style={{ display: "inline-block", marginTop: "0.5rem", fontSize: 10, fontWeight: 900, color: "#111", background: "#d4af37", borderRadius: 3, padding: "2px 6px", letterSpacing: "0.06em" }}>ORIGINAL POST</div>
                    <a href={`/forums/thread/${thread.id}#post-${original.post_number || original.id}`} style={{ display: "inline-block", marginTop: "0.45rem", fontSize: 11, color: "#8fa0bd", textDecoration: "none" }}>
                      #{original.post_number || 1} - {timeAgo(original.created_at)}
                    </a>
                  </aside>
                  <div className="post-body" style={{ flex: 1, minWidth: 0 }}>
                    {original.canon_status && (
                      <div style={{ display: "inline-flex", marginBottom: "0.75rem", color: original.canon_status === "canon" ? "#111" : "#f5f8ff", background: original.canon_status === "canon" ? "#f6c132" : "rgba(231,76,60,0.2)", border: `1px solid ${original.canon_status === "canon" ? "rgba(246,193,50,0.35)" : "rgba(231,76,60,0.35)"}`, borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {original.canon_status === "canon" ? "Canon" : "Non-Canon"}
                      </div>
                    )}
                    <RichText>{original.body}</RichText>
                    {(original.profiles?.signature_url || original.profiles?.signature_text) && (
                      <div style={{ marginTop: "0.75rem", paddingTop: "0.65rem", borderTop: "1px solid rgba(20,96,184,0.14)" }}>
                        {original.profiles?.signature_text && <div style={{ fontSize: 11, color: "#8fa0bd", fontStyle: "italic", marginBottom: original.profiles?.signature_url ? "0.4rem" : 0, lineHeight: 1.6 }}>{original.profiles.signature_text}</div>}
                        {original.profiles?.signature_url && <img className="post-signature" src={original.profiles.signature_url} alt="" style={{ maxWidth: "100%", opacity: 0.9 }} />}
                      </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.9rem", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid rgba(78,128,190,0.12)" }}>
                      <span style={{ fontSize: 10, color: "#8fa0bd", marginRight: "0.25rem" }}>React:</span>
                      {REACT_EMOJIS.map(e => {
                        const count = reactions.filter(r => r.post_id === original.id && r.emoji === e).length;
                        const active = reactions.some(r => r.post_id === original.id && r.user_id === profile?.id && r.emoji === e);
                        return <button key={e} onClick={() => { if (!profile) return; const existing = reactions.find(r => r.post_id === original.id && r.user_id === profile.id && r.emoji === e); (async () => { const result = existing ? await supabase.from("forum_reactions").delete().eq("id", existing.id) : await supabase.from("forum_reactions").insert({ post_id: original.id, user_id: profile.id, emoji: e }); if (result.error) showStatus(result.error.message, "error"); else { loadReactions(posts.map(p => p.id)); onRefresh(); } })(); }} style={{ ...mkBtn(active ? "gold" : "ghost"), minHeight: 28, padding: "2px 6px", fontSize: 13, lineHeight: 1 }}>{e}{count > 0 ? <span style={{ fontSize: 10, marginLeft: 2 }}>{count}</span> : ""}</button>;
                      })}
                      <span style={{ width: 1, height: 20, background: "rgba(78,128,190,0.2)", margin: "0 0.25rem" }} />
                      {(isMod || original.author_id === profile?.id) && <button onClick={() => { const body = prompt("Edit post:", original.body); if (body) { supabase.from("forum_posts").update({ body }).eq("id", original.id).then(({ error }) => { if (error) showStatus(error.message, "error"); else onRefresh(); }); } }} style={{ ...mkBtn("ghost"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Edit</button>}
                      {(isMod || original.author_id === profile?.id) && <button onClick={async () => { if (!confirm("Delete this post?")) return; const { error } = await supabase.from("forum_posts").delete().eq("id", original.id); if (error) showStatus(error.message, "error"); else { await supabase.rpc("refresh_forum_counts"); onRefresh(); } }} style={{ ...mkBtn("red"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Delete</button>}
                      {isMod && <span style={{ width: 1, height: 20, background: "rgba(78,128,190,0.2)", margin: "0 0.25rem" }} />}
                      {isMod && <button onClick={() => { supabase.from("forum_posts").update({ canon_status: "canon", canon_marked_by: profile?.id, canon_marked_at: new Date().toISOString() }).eq("id", original.id).then(({ error }) => { if (error) showStatus(error.message, "error"); else onRefresh(); }); }} style={{ ...mkBtn(original.canon_status === "canon" ? "gold" : "ghost"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Canon</button>}
                      {isMod && <button onClick={() => { supabase.from("forum_posts").update({ canon_status: "non_canon", canon_marked_by: profile?.id, canon_marked_at: new Date().toISOString() }).eq("id", original.id).then(({ error }) => { if (error) showStatus(error.message, "error"); else onRefresh(); }); }} style={{ ...mkBtn(original.canon_status === "non_canon" ? "red" : "ghost"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Non-Canon</button>}
                      {isMod && original.canon_status && <button onClick={() => { supabase.from("forum_posts").update({ canon_status: null, canon_marked_by: null, canon_marked_at: null }).eq("id", original.id).then(({ error }) => { if (error) showStatus(error.message, "error"); else onRefresh(); }); }} style={{ ...mkBtn("ghost"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Clear Tag</button>}
                      <button onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/forums/thread/${thread.id}#post-${original.post_number || original.id}`)} style={{ ...mkBtn("ghost"), minHeight: 28, padding: "3px 7px", fontSize: 10 }}>Copy Link</button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#8fa0bd", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Replies ({replies.length})</div>
                {replies.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {replies.map((p, i) => <PostCard key={p.id} post={p} postNumber={i + 2} thread={thread} reactions={reactions} profile={profile} nations={nations} isMod={isMod} onViewProfile={onViewProfile} onRefresh={() => loadPosts(0, false, replySort)} replySort={replySort} />)}
                  </div>
                ) : <p style={{ color: "#8493ad", textAlign: "center", padding: "1.5rem", fontStyle: "italic", fontSize: 13 }}>No replies yet. Be the first to respond!</p>}
              </div>
            </>
          );
        })()}
        {loading && <div style={{ textAlign: "center", padding: "1.5rem" }}><span className="forum-spinner" style={{ display: "inline-block", width: 24, height: 24, border: "2px solid rgba(212,175,55,0.15)", borderTopColor: "#d4af37", borderRadius: "50%", animation: "forumSpin 0.7s linear infinite" }} /></div>}
        {hasMore && <button onClick={() => loadPosts(Math.max(posts.length - 1, 0), true, replySort)} style={{ ...mkBtn("ghost"), alignSelf: "center", minHeight: 40, padding: "10px 24px", fontSize: 12 }}>Load More Replies</button>}
      </div>
      {profile && !thread.locked && !isProfileBlocked(profile) && (
        <div className="forum-composer-card" style={{ ...card, border: "1px solid rgba(212,175,55,0.18)" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontFamily: "var(--display)", color: "#d4af37", fontSize: 14 }}>Post Reply</h3>
          <div className="editor-tabs">
            <button onClick={() => setEditorTab("write")} style={{ ...mkBtn(editorTab === "write" ? "gold" : "ghost"), fontSize: 11 }}>Write</button>
            <button onClick={() => setEditorTab("preview")} style={{ ...mkBtn(editorTab === "preview" ? "gold" : "ghost"), fontSize: 11 }}>Preview</button>
          </div>
          <BBCodeToolbar onInsert={appendBBCode} mkBtn={mkBtn} />
          {editorTab === "write"
            ? <textarea className="forum-composer-textarea" placeholder="Write your reply. BBCode is supported." value={replyBody} onChange={e => setReplyBody(e.target.value)} style={composerTextarea} />
            : <div className="post-preview"><RichText>{replyBody || "Nothing to preview yet."}</RichText></div>}
          <button onClick={submitReply} style={{ ...mkBtn(), marginTop: "0.75rem" }}>Post Reply</button>
        </div>
      )}
      {profile && !thread.locked && isProfileBlocked(profile) && <div style={{ ...card, textAlign: "center", color: "#ffb4b4", fontSize: 13 }}>Your account is not currently allowed to reply.</div>}
      {thread.locked && <div style={{ ...card, textAlign: "center", color: "#8fa0bd", fontSize: 13, fontStyle: "italic" }}>This thread is locked.</div>}
    </div>
  );
}
