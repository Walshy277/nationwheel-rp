import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { RichText } from "../lib/richText";
import { card, mkBtn, inp, ta, timeAgo, isProfileBlocked, mergeThreadPostPages, writeRoute } from "../lib/uiUtils";
import { BOARD_ICONS, FORUM_BOARDS } from "../lib/forumUtils";
import { FORUM_PAGE_SIZE, REACT_EMOJIS } from "../lib/constants";
import BBCodeToolbar from "../components/forum/BBCodeToolbar";
import ForumIndex from "./ForumIndex";
import { createMentionNotifications, notifyThreadReply } from "../lib/notifications";

export const ForumsPage = ({ boards, route, onRouteChange, profile, userNation, nations, isMod, onRefresh, onRequireAuth, onViewProfile }) => {
  const [view, setView] = useState({ type:"boards" });
  const [boardThreads, setBoardThreads] = useState([]);
  const [threadPosts, setThreadPosts] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [forumLoading, setForumLoading] = useState(false);
  const [forumError, setForumError] = useState("");
  const [hasMoreThreads, setHasMoreThreads] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [threadForm, setThreadForm] = useState({ title:"", body:"" });
  const [replyBody, setReplyBody] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [threadEditorTab, setThreadEditorTab] = useState("write");
  const [replyEditorTab, setReplyEditorTab] = useState("write");
  const [replySort, setReplySort] = useState("desc");
  const composerTextarea = { ...ta, minHeight:240, lineHeight:1.7, padding:"1rem", fontSize:16 };
  const appendThreadBBCode = (open, close) => setThreadForm(current => ({ ...current, body:`${current.body}${open}${close}` }));
  const appendReplyBBCode = (open, close) => setReplyBody(current => `${current}${open}${close}`);
  const normalizeThread = thread => ({
    ...thread,
    pinned: thread.pinned ?? thread.legacy_pinned ?? thread.is_pinned ?? false,
    locked: thread.locked ?? thread.legacy_locked ?? thread.is_locked ?? false,
    profiles: thread.profiles || { id: thread.author_id, username: thread.author_username, avatar_url: thread.author_avatar_url },
  });
  const normalizePost = post => ({
    ...post,
    profiles: post.profiles || {
      id: post.author_id,
      username: post.author_username,
      avatar_url: post.author_avatar_url,
      signature_url: post.author_signature_url,
      bio: post.author_bio,
    },
    nations: post.nations || {
      name: post.nation_name,
      flag_url: post.nation_flag_url,
    },
  });
  const pushForumRoute = nextView => {
    setView(nextView);
    if (nextView.type === "boards") {
      writeRoute("/forums");
      onRouteChange({ type:"boards" });
    }
    if (nextView.type === "board") {
      writeRoute(`/forums/board/${encodeURIComponent(nextView.board.slug)}`);
      onRouteChange({ type:"board", boardSlug:nextView.board.slug });
    }
    if (nextView.type === "thread") {
      writeRoute(`/forums/thread/${encodeURIComponent(nextView.thread.id)}`);
      onRouteChange({ type:"thread", threadId:nextView.thread.id });
    }
  };
  const postLink = post => `${window.location.origin}/forums/thread/${view.thread.id}#post-${post.post_number || post.id}`;

  const loadBoardThreads = useCallback(async (board, cursor = null, append = false, offset = 0) => {
    if (!board || !supabase) return;
    setForumLoading(true);
    setForumError("");
    const rpc = await supabase.rpc("list_board_threads", {
      p_board_slug: board.slug,
      p_cursor_is_pinned: cursor?.pinned ?? cursor?.is_pinned ?? null,
      p_cursor_last_post_at: cursor?.last_post_at ?? null,
      p_cursor_id: cursor?.id ?? null,
      p_limit: FORUM_PAGE_SIZE,
    });
    let rows = rpc.data;
    let error = rpc.error;
    if (error) {
      const fallback = await supabase
        .from("forum_threads")
        .select("*, profiles:author_id(id,username,avatar_url)")
        .eq("board_id", board.id)
        .order("pinned", { ascending:false })
        .order("created_at", { ascending:false })
        .range(append ? offset : 0, append ? offset + FORUM_PAGE_SIZE - 1 : FORUM_PAGE_SIZE - 1);
      rows = fallback.data;
      error = fallback.error;
    }
    if (error) {
      setForumError(error.message);
    } else {
      const nextRows = (rows || []).map(normalizeThread);
      setBoardThreads(current => append ? [...current, ...nextRows] : nextRows);
      setHasMoreThreads(nextRows.length === FORUM_PAGE_SIZE);
    }
    setForumLoading(false);
  }, []);

  const loadPostReactions = useCallback(async (postIds, append = false) => {
    if (!postIds.length) {
      if (!append) setReactions([]);
      return;
    }
    const reactionResult = await supabase.from("forum_reactions").select("*").in("post_id", postIds);
    if (!reactionResult.error) {
      const nextReactions = reactionResult.data || [];
      setReactions(current => append
        ? [...current.filter(reaction => !postIds.includes(reaction.post_id)), ...nextReactions]
        : nextReactions);
    }
  }, []);

  const loadThreadPosts = useCallback(async (thread, replyOffset = 0, append = false, sortOrder = "desc") => {
    if (!thread || !supabase) return;
    setForumLoading(true);
    setForumError("");
    const postSelect = "*, profiles:author_id(id,username,role,status,avatar_url,signature_url,bio,last_active_at,created_at,nation_id), nations:nation_id(name,flag_url)";
    const openingResult = await supabase
      .from("forum_posts")
      .select(postSelect)
      .eq("thread_id", thread.id)
      .or("is_deleted.is.null,is_deleted.eq.false")
      .order("created_at", { ascending:true })
      .order("id", { ascending:true })
      .limit(1)
      .maybeSingle();
    if (openingResult.error) {
      setForumError(openingResult.error.message);
      setForumLoading(false);
      return;
    }
    const openingPost = openingResult.data ? normalizePost(openingResult.data) : null;
    let replyQuery = supabase
      .from("forum_posts")
      .select(postSelect)
      .eq("thread_id", thread.id)
      .or("is_deleted.is.null,is_deleted.eq.false");
    if (openingPost?.id) replyQuery = replyQuery.neq("id", openingPost.id);
    const replyResult = await replyQuery
      .order("created_at", { ascending:sortOrder === "asc" })
      .order("id", { ascending:sortOrder === "asc" })
      .range(replyOffset, replyOffset + FORUM_PAGE_SIZE - 1);
    if (replyResult.error) {
      const legacyFallback = await supabase
        .from("forum_posts")
        .select("*, profiles:author_id(id,username,role,status,avatar_url,signature_url,bio,last_active_at,created_at,nation_id)")
        .eq("thread_id", thread.id)
        .or("is_deleted.is.null,is_deleted.eq.false")
        .order("created_at", { ascending:sortOrder === "asc" })
        .range(replyOffset, replyOffset + FORUM_PAGE_SIZE - 1);
      if (legacyFallback.error) {
        setForumError(legacyFallback.error.message);
        setForumLoading(false);
        return;
      }
      const legacyRows = (legacyFallback.data || []).map(normalizePost);
      const legacyOpening = openingPost || legacyRows[0] || null;
      const legacyReplies = legacyRows.filter(post => post.id !== legacyOpening?.id);
      const merged = legacyOpening ? [legacyOpening, ...legacyReplies] : legacyReplies;
      setThreadPosts(current => append ? mergeThreadPostPages(current, merged) : merged);
      setHasMorePosts(legacyReplies.length === FORUM_PAGE_SIZE);
      const postIds = merged.map(post => post.id);
      await loadPostReactions(postIds, append);
      setForumLoading(false);
      return;
    }
    const replyRows = (replyResult.data || []).map(normalizePost);
    const nextRows = openingPost ? [openingPost, ...replyRows] : replyRows;
    setThreadPosts(current => append ? mergeThreadPostPages(current, nextRows) : nextRows);
    setHasMorePosts(replyRows.length === FORUM_PAGE_SIZE);
    await loadPostReactions(nextRows.map(post => post.id), append);
    setForumLoading(false);
  }, [loadPostReactions]);

  useEffect(() => {
    const nextRoute = route || { type:"boards" };
    if (nextRoute.type === "boards") {
      setView({ type:"boards" });
      return;
    }
    if (nextRoute.type === "board") {
      const board = boards.find(item => item.slug === nextRoute.boardSlug);
      if (!board) return;
      setView({ type:"board", board });
      setBoardThreads([]);
      loadBoardThreads(board);
    }
    if (nextRoute.type === "thread") {
      const loadThread = async () => {
        const result = await supabase
          .from("forum_thread_summaries")
          .select("*")
          .eq("id", nextRoute.threadId)
          .maybeSingle();
        let thread = result.data ? normalizeThread(result.data) : null;
        if (!thread) {
          const fallback = await supabase
            .from("forum_threads")
            .select("*, profiles:author_id(id,username,avatar_url)")
            .eq("id", nextRoute.threadId)
            .maybeSingle();
          thread = fallback.data ? normalizeThread(fallback.data) : null;
        }
        if (!thread) {
          setForumError("Thread not found.");
          return;
        }
        setView({ type:"thread", thread });
        setThreadPosts([]);
        loadThreadPosts(thread, 0, false, replySort);
      };
      loadThread();
    }
  }, [route, boards, loadBoardThreads, loadThreadPosts, replySort]);

  useEffect(() => {
    if (view.type !== "thread") return;
    window.scrollTo({ top:0, behavior:"smooth" });
    if (!threadPosts.length || !window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (target) target.scrollIntoView({ block:"start" });
  }, [view.type, threadPosts]);

  const submitThread = async () => {
    if (!threadForm.title.trim()||!threadForm.body.trim()||view.type!=="board") return;
    if (isProfileBlocked(profile)) {
      alert("Your account is not currently allowed to post.");
      return;
    }
    const {data,error} = await supabase.from("forum_threads").insert({ board_id:view.board.id, author_id:profile.id, nation_id:userNation?.id||null, title:threadForm.title }).select().single();
    if (error) {
      alert(`Thread failed: ${error.message}`);
      return;
    }
    const postResult = await supabase.from("forum_posts").insert({ thread_id:data.id, author_id:profile.id, nation_id:userNation?.id||null, body:threadForm.body });
    if (postResult.error) {
      alert(`Opening post failed: ${postResult.error.message}`);
      return;
    }
    const createdThread = normalizeThread({ ...data, reply_count:0, last_post_at:data.created_at });
    createMentionNotifications({ body:threadForm.body, sourceTitle:threadForm.title, sourceLink:`${window.location.origin}/forums/thread/${data.id}`, sourceType:"forum", allProfiles:profile ? [] : [] });
    setThreadForm({title:"",body:""}); setShowNewThread(false); onRefresh();
    pushForumRoute({ type:"thread", thread:createdThread });
  };

  const submitReply = async () => {
    if (!replyBody.trim()||view.type!=="thread") return;
    if (isProfileBlocked(profile)) {
      alert("Your account is not currently allowed to reply.");
      return;
    }
    const { error } = await supabase.from("forum_posts").insert({ thread_id:view.thread.id, author_id:profile.id, nation_id:userNation?.id||null, body:replyBody });
    if (error) {
      alert(`Reply failed: ${error.message}`);
      return;
    }
    const replyLink = window.location.href;
    createMentionNotifications({ body:replyBody, sourceTitle:view.thread.title, sourceLink:replyLink, sourceType:"forum", allProfiles:profile ? [] : [] });
    notifyThreadReply({ thread:view.thread, replyAuthorId:profile?.id, replyBody, replyLink, threadAuthorId:view.thread.author_id || view.thread.profiles?.id });
    setReplyBody("");
    onRefresh();
    await loadThreadPosts(view.thread, 0, false, replySort);
  };
  const toggleReaction = async (postId, emoji) => {
    if (!profile) return onRequireAuth();
    const existing = reactions.find(r=>r.post_id===postId && r.user_id===profile.id && r.emoji===emoji);
    const result = existing
      ? await supabase.from("forum_reactions").delete().eq("id", existing.id)
      : await supabase.from("forum_reactions").insert({ post_id:postId, user_id:profile.id, emoji });
    if (result.error) alert(result.error.message);
    else await loadThreadPosts(view.thread, 0, false, replySort);
  };
  const savePost = async (postId) => {
    const { error } = await supabase.from("forum_posts").update({ body:editBody }).eq("id", postId);
    if (error) alert(error.message);
    else { setEditingPost(null); setEditBody(""); await loadThreadPosts(view.thread, 0, false, replySort); onRefresh(); }
  };
  const deletePost = async (postId) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("forum_posts").delete().eq("id", postId);
    if (error) alert(error.message);
    else {
      await supabase.rpc("refresh_forum_counts");
      await loadThreadPosts(view.thread, 0, false, replySort);
      onRefresh();
    }
  };
  const setPostCanonStatus = async (postId, canonStatus) => {
    const payload = {
      canon_status: canonStatus,
      canon_marked_by: profile?.id || null,
      canon_marked_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("forum_posts").update(payload).eq("id", postId);
    if (error) alert(error.message);
    else await loadThreadPosts(view.thread, 0, false, replySort);
  };
  const setThreadLocked = async (locked) => {
    const { error } = await supabase.from("forum_threads").update({ locked }).eq("id", view.thread.id);
    if (error) alert(error.message);
    else { setView({ ...view, thread:{ ...view.thread, locked } }); onRefresh(); }
  };
  const deleteThread = async () => {
    if (!confirm("Delete this thread and all posts?")) return;
    const { error } = await supabase.from("forum_threads").delete().eq("id", view.thread.id);
    if (error) alert(error.message);
    else {
      await supabase.rpc("refresh_forum_counts");
      pushForumRoute({ type:"boards" });
      onRefresh();
    }
  };

  if (view.type==="boards") {
    return (
      <ForumIndex
        boards={boards}
        profile={profile}
        onRequireAuth={onRequireAuth}
        onSelectBoard={board=>pushForumRoute({type:"board",board})}
        card={card}
        mkBtn={mkBtn}
        timeAgo={timeAgo}
      />
    );
  }

  if (view.type==="board") {
    const bThreads = boardThreads;
    const pinned = bThreads.filter(t=>t.pinned);
    const regular = bThreads.filter(t=>!t.pinned);
    return (
      <div>
        <button onClick={()=>pushForumRoute({type:"boards"})} style={{ ...mkBtn("ghost"), marginBottom:"1rem", fontSize:12 }}>All Boards</button>
        <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
          <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>{view.board.icon || BOARD_ICONS[view.board.slug] || "*"} {view.board.name}</h2>
          {profile && !isProfileBlocked(profile) && <button onClick={()=>setShowNewThread(!showNewThread)} style={mkBtn()}>+ New Thread</button>}
          {!profile && <button onClick={onRequireAuth} style={mkBtn("ghost")}>Sign In to Post</button>}
        </div>
        {showNewThread && (
          <div className="forum-composer-card" style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1rem" }}>
            <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>New Thread in {view.board.name}</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              <input placeholder="Thread title" value={threadForm.title} onChange={e=>setThreadForm({...threadForm,title:e.target.value})} style={inp} />
              <div className="editor-tabs">
                <button onClick={()=>setThreadEditorTab("write")} style={{ ...mkBtn(threadEditorTab==="write"?"gold":"ghost"), fontSize:11 }}>Write</button>
                <button onClick={()=>setThreadEditorTab("preview")} style={{ ...mkBtn(threadEditorTab==="preview"?"gold":"ghost"), fontSize:11 }}>Preview</button>
              </div>
              <BBCodeToolbar onInsert={appendThreadBBCode} mkBtn={mkBtn} />
              {threadEditorTab==="write"
                ? <textarea className="forum-composer-textarea" placeholder="Opening post. BBCode is supported. HTML is escaped except a tiny safe formatting subset." value={threadForm.body} onChange={e=>setThreadForm({...threadForm,body:e.target.value})} style={composerTextarea} />
                : <div className="post-preview"><RichText>{threadForm.body || "Nothing to preview yet."}</RichText></div>}
              <div style={{ display:"flex", gap:"0.5rem" }}>
                <button onClick={submitThread} style={mkBtn()}>Post Thread</button>
                <button onClick={()=>setShowNewThread(false)} style={mkBtn("ghost")}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {pinned.length>0 && <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"0.4rem" }}>Pinned</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
          {forumError && <p style={{ color:"#ff9d9d", textAlign:"center", padding:"1rem" }}>{forumError}</p>}
          {[...pinned,...regular].map(t=>{
            const replyCount = Number(t.reply_count || 0);
            const authorNation = nations.find(n=>n.id===t.nation_id);
            return (
              <div className="thread-card" key={t.id} style={{ ...card, cursor:"pointer", display:"flex", gap:"0.75rem", alignItems:"center", borderColor:t.pinned?"rgba(212,175,55,0.2)":"rgba(212,175,55,0.1)", padding:"0.9rem 1.25rem" }}
                onClick={()=>pushForumRoute({type:"thread",thread:t})}>
                {authorNation ? <Flag nation={authorNation} size={22} /> : <div style={{ width:22, height:14, background:"rgba(255,255,255,0.04)", borderRadius:2 }} />}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:"#edf4ff", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.pinned&&"Pinned: "}{t.title}</div>
                  <div style={{ fontSize:11, color:"#8fa0bd", display:"flex", gap:4, flexWrap:"wrap" }}>
                    {authorNation?.name && <span>{authorNation.name}</span>}
                    <span>by</span>
                    <ProfileButton profile={t.profiles} onViewProfile={onViewProfile}>{t.profiles?.username || t.author_username || "?"}</ProfileButton>
                    <span>- {timeAgo(t.last_post_at || t.created_at)}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:"var(--display)", fontSize:16, color:"#8493ad" }}>{replyCount}</div>
                  <div style={{ fontSize:10, color:"#8493ad", letterSpacing:"0.04em" }}>replies</div>
                </div>
              </div>
            );
          })}
          {!forumLoading && bThreads.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No threads yet.</p>}
          {forumLoading && <div style={{ textAlign:"center", padding:"1.5rem" }}><span className="forum-spinner" style={{ display:"inline-block", width:24, height:24, border:"2px solid rgba(212,175,55,0.15)", borderTopColor:"#d4af37", borderRadius:"50%", animation:"forumSpin 0.7s linear infinite" }} /></div>}
          {hasMoreThreads && <button onClick={()=>loadBoardThreads(view.board, bThreads[bThreads.length - 1], true, bThreads.length)} style={{ ...mkBtn("ghost"), alignSelf:"center", minHeight:40, padding:"10px 24px", fontSize:12, letterSpacing:"0.04em" }}>Load More Threads</button>}
        </div>
      </div>
    );
  }

  if (view.type==="thread") {
    const board = boards.find(b=>b.id===view.thread.board_id);
    const tPosts = threadPosts;
    const canManageThread = isMod || view.thread.author_id === profile?.id;
    return (
      <div
  style={{
    maxWidth: "800px",
    margin: "0 auto",
    padding: "1.5rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  }}
>
        <button onClick={()=>board ? pushForumRoute({type:"board",board}) : pushForumRoute({type:"boards"})} style={{ ...mkBtn("ghost"), marginBottom:"0.75rem", fontSize:12 }}>← {board?.name || "All Boards"}</button>
        <div style={{ display:"flex", gap:"0.6rem", alignItems:"flex-start", flexWrap:"wrap" }}>
          <div style={{ flex:"1 1 auto", minWidth:180 }}>
            <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:18, lineHeight:1.4 }}>{view.thread.title}</h2>
            <div style={{ fontSize:11, color:"#8fa0bd", marginTop:"0.3rem", display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
              <span>Reply #{Number(view.thread.reply_count || 0)}</span>
              {view.thread.last_post_at && <span>· Last active {timeAgo(view.thread.last_post_at)}</span>}
              {view.thread.pinned && <span style={{ color:"#d4af37" }}>· Pinned</span>}
            </div>
          </div>
          <div style={{ display:"flex", gap:"0.4rem", alignItems:"center", flexWrap:"wrap", flexShrink:0 }}>
            <span style={{ color:"#8fa0bd", fontSize:11, fontWeight:800, letterSpacing:"0.04em", textTransform:"uppercase", whiteSpace:"nowrap" }}>Sort:</span>
            <select value={replySort} onChange={e=>setReplySort(e.target.value)} style={{ ...inp, width:"auto", minHeight:36, padding:"7px 28px 7px 10px", fontSize:12, letterSpacing:0, textTransform:"none" }}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            {canManageThread && <button onClick={()=>setThreadLocked(!view.thread.locked)} style={{ ...mkBtn("ghost"), fontSize:11 }}>{view.thread.locked?"🔓 Open":"🔒 Close"}</button>}
            {canManageThread && <button onClick={deleteThread} style={{ ...mkBtn("red"), fontSize:11 }}>Delete</button>}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
          {forumError && <p style={{ color:"#ff9d9d", textAlign:"center", padding:"1rem" }}>{forumError}</p>}

          {tPosts.length > 0 && (() => {
            const original = tPosts[0];
            const replies = tPosts.slice(1);
            const origNation = nations.find(n=>n.id===original.nation_id);
            const origAvatar = original.profiles?.avatar_url;
            const origName = original.profiles?.username || "Unknown";
            const origCanon = original.canon_status || null;

            return (
              <>
                <div style={{ ...card, border:"1px solid rgba(212,175,55,0.32)", background:"rgba(212,175,55,0.06)", padding:"1.5rem", scrollMarginTop:70 }} id={`post-${original.post_number || original.id}`}>
                  <div className="forum-post-layout" style={{ display:"flex", gap:"1.25rem" }}>
                    <aside className="post-author" style={{ width:150, flexShrink:0 }}>
                      {origAvatar
                        ? <img src={origAvatar} alt="" style={{ width:96, height:96, borderRadius:"50%", objectFit:"cover", border:"1px solid rgba(246,193,50,0.2)" }} />
                        : origNation
                          ? <Flag nation={origNation} size={96} />
                          : <div style={{ width:96, height:96, background:"rgba(255,255,255,0.04)", borderRadius:"50%" }} />
                      }
                      <ProfileButton profile={original.profiles} onViewProfile={onViewProfile} style={{ marginTop:"0.65rem", fontSize:13, color:"#d4af37", fontWeight:800, lineHeight:1.35, display:"block" }}>{origName}</ProfileButton>
                      {origNation && <div style={{ marginTop:"0.25rem", fontSize:11, color:"#8fa0bd", lineHeight:1.35 }}>{origNation.name}</div>}
                      <div style={{ display:"inline-block", marginTop:"0.5rem", fontSize:10, fontWeight:900, color:"#111", background:"#d4af37", borderRadius:3, padding:"2px 6px", letterSpacing:"0.06em" }}>ORIGINAL POST</div>
                      <a href={`/forums/thread/${view.thread.id}#post-${original.post_number || original.id}`} style={{ display:"inline-block", marginTop:"0.45rem", fontSize:11, color:"#8fa0bd", textDecoration:"none" }}>#{original.post_number || 1} - {timeAgo(original.created_at)}</a>
                    </aside>
                    <div className="post-body" style={{ flex:1, minWidth:0 }}>
                      {origCanon && <div style={{ display:"inline-flex", marginBottom:"0.75rem", color:origCanon==="canon"?"#111":"#f5f8ff", background:origCanon==="canon"?"#f6c132":"rgba(231,76,60,0.2)", border:`1px solid ${origCanon==="canon"?"rgba(246,193,50,0.35)":"rgba(231,76,60,0.35)"}`, borderRadius:4, padding:"3px 8px", fontSize:10, fontWeight:900, letterSpacing:"0.08em", textTransform:"uppercase" }}>{origCanon==="canon"?"Canon":"Non-Canon"}</div>}
                      <RichText>{original.body}</RichText>
                      {(original.profiles?.signature_url || original.profiles?.signature_text) && (
                        <div style={{ marginTop:"0.75rem", paddingTop:"0.65rem", borderTop:"1px solid rgba(20,96,184,0.14)" }}>
                          {original.profiles?.signature_text && <div style={{ fontSize:11, color:"#8fa0bd", fontStyle:"italic", marginBottom:original.profiles?.signature_url?"0.4rem":0, lineHeight:1.6 }}>{original.profiles.signature_text}</div>}
                          {original.profiles?.signature_url && <img className="post-signature" src={original.profiles.signature_url} alt="" style={{ maxWidth:"100%", opacity:0.9 }} />}
                        </div>
                      )}
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"0.35rem", marginTop:"0.9rem", alignItems:"center", paddingTop:"0.75rem", borderTop:"1px solid rgba(78,128,190,0.12)" }}>
                        <span style={{ fontSize:10, color:"#8fa0bd", marginRight:"0.25rem" }}>React:</span>
                        {REACT_EMOJIS.map(e=>{
                          const count = reactions.filter(r=>r.post_id===original.id && r.emoji===e).length;
                          const active = reactions.some(r=>r.post_id===original.id && r.user_id===profile?.id && r.emoji===e);
                          return <button key={e} onClick={()=>toggleReaction(original.id,e)} style={{ ...mkBtn(active?"gold":"ghost"), minHeight:28, padding:"2px 6px", fontSize:13, lineHeight:1 }}>{e}{count>0?<span style={{ fontSize:10, marginLeft:2 }}>{count}</span>:""}</button>;
                        })}
                        <span style={{ width:1, height:20, background:"rgba(78,128,190,0.2)", margin:"0 0.25rem" }} />
                        {(isMod || original.author_id===profile?.id) && <button onClick={()=>{setEditingPost(original.id);setEditBody(original.body);}} style={{ ...mkBtn("ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Edit</button>}
                        {(isMod || original.author_id===profile?.id) && <button onClick={()=>deletePost(original.id)} style={{ ...mkBtn("red"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Delete</button>}
                        {isMod && <span style={{ width:1, height:20, background:"rgba(78,128,190,0.2)", margin:"0 0.25rem" }} />}
                        {isMod && <button onClick={()=>setPostCanonStatus(original.id, "canon")} style={{ ...mkBtn(origCanon==="canon"?"gold":"ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Canon</button>}
                        {isMod && <button onClick={()=>setPostCanonStatus(original.id, "non_canon")} style={{ ...mkBtn(origCanon==="non_canon"?"red":"ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Non-Canon</button>}
                        {isMod && origCanon && <button onClick={()=>setPostCanonStatus(original.id, null)} style={{ ...mkBtn("ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Clear Tag</button>}
                        <button onClick={()=>navigator.clipboard?.writeText(postLink(original))} style={{ ...mkBtn("ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Copy Link</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.75rem" }}>Replies ({replies.length})</div>
                  {replies.length > 0 ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                      {replies.map((p,i)=>{
                        const pNation = nations.find(n=>n.id===p.nation_id);
                        const authorAvatar = p.profiles?.avatar_url;
                        const authorName = p.profiles?.username || "Unknown";
                        const canonStatus = p.canon_status || null;

                        return (
                          <div
                            id={`post-${p.post_number || p.id}`}
                            className="post-card forum-post-layout"
                            key={p.id}
                            style={{
                              ...card,
                              borderLeft:"1px solid rgba(255,255,255,0.06)",
                              background:"rgba(255,255,255,0.02)",
                              padding:"1.25rem",
                              scrollMarginTop:70
                            }}
                          >
                            <aside className="post-author" style={{ width:150, flexShrink:0 }}>
                              {authorAvatar
                                ? <img src={authorAvatar} alt="" style={{ width:96, height:96, borderRadius:"50%", objectFit:"cover", border:"1px solid rgba(246,193,50,0.2)" }} />
                                : pNation
                                  ? <Flag nation={pNation} size={96} />
                                  : <div style={{ width:96, height:96, background:"rgba(255,255,255,0.04)", borderRadius:"50%" }} />
                              }
                              <ProfileButton profile={p.profiles} onViewProfile={onViewProfile} style={{ marginTop:"0.65rem", fontSize:13, color:"#d4af37", fontWeight:800, lineHeight:1.35, display:"block" }}>{authorName}</ProfileButton>
                              {pNation && <div style={{ marginTop:"0.25rem", fontSize:11, color:"#8fa0bd", lineHeight:1.35 }}>{pNation.name}</div>}
                              <a href={`/forums/thread/${view.thread.id}#post-${p.post_number || p.id}`} style={{ display:"inline-block", marginTop:"0.45rem", fontSize:11, color:"#8fa0bd", textDecoration:"none" }}>#{p.post_number || i + 1} - {timeAgo(p.created_at)}</a>
                            </aside>
                            <div className="post-body" style={{ flex:1, minWidth:0 }}>
                              {canonStatus && <div style={{ display:"inline-flex", marginBottom:"0.75rem", color:canonStatus==="canon"?"#111":"#f5f8ff", background:canonStatus==="canon"?"#f6c132":"rgba(231,76,60,0.2)", border:`1px solid ${canonStatus==="canon"?"rgba(246,193,50,0.35)":"rgba(231,76,60,0.35)"}`, borderRadius:4, padding:"3px 8px", fontSize:10, fontWeight:900, letterSpacing:"0.08em", textTransform:"uppercase" }}>{canonStatus==="canon"?"Canon":"Non-Canon"}</div>}
                              {editingPost === p.id ? (
                                <div>
                                  <textarea value={editBody} onChange={e=>setEditBody(e.target.value)} style={{ ...ta, minHeight:120 }} />
                                  <div style={{ display:"flex", gap:"0.4rem", marginTop:"0.5rem" }}>
                                    <button onClick={()=>savePost(p.id)} style={{ ...mkBtn(), fontSize:11 }}>Save</button>
                                    <button onClick={()=>setEditingPost(null)} style={{ ...mkBtn("ghost"), fontSize:11 }}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ fontSize:"14px", lineHeight:"1.7", color:"#d6deeb", maxWidth:"720px", marginTop:"0.5rem" }}>
                                  <RichText>{p.body}</RichText>
                                  {(p.profiles?.signature_url || p.profiles?.signature_text) && (
                                    <div style={{ marginTop:"0.75rem", paddingTop:"0.65rem", borderTop:"1px solid rgba(20,96,184,0.14)" }}>
                                      {p.profiles?.signature_text && <div style={{ fontSize:11, color:"#8fa0bd", fontStyle:"italic", marginBottom:p.profiles?.signature_url?"0.4rem":0, lineHeight:1.6 }}>{p.profiles.signature_text}</div>}
                                      {p.profiles?.signature_url && <img className="post-signature" src={p.profiles.signature_url} alt="" style={{ maxWidth:"100%", opacity:0.9 }} />}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.35rem", marginTop:"0.9rem", alignItems:"center", paddingTop:"0.75rem", borderTop:"1px solid rgba(78,128,190,0.12)" }}>
                                <span style={{ fontSize:10, color:"#8fa0bd", marginRight:"0.25rem" }}>React:</span>
                                {REACT_EMOJIS.map(e=>{
                                  const count = reactions.filter(r=>r.post_id===p.id && r.emoji===e).length;
                                  const active = reactions.some(r=>r.post_id===p.id && r.user_id===profile?.id && r.emoji===e);
                                  return <button key={e} onClick={()=>toggleReaction(p.id,e)} style={{ ...mkBtn(active?"gold":"ghost"), minHeight:28, padding:"2px 6px", fontSize:13, lineHeight:1 }}>{e}{count>0?<span style={{ fontSize:10, marginLeft:2 }}>{count}</span>:""}</button>;
                                })}
                                <span style={{ width:1, height:20, background:"rgba(78,128,190,0.2)", margin:"0 0.25rem" }} />
                                {(isMod || p.author_id===profile?.id) && <button onClick={()=>{setEditingPost(p.id);setEditBody(p.body);}} style={{ ...mkBtn("ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Edit</button>}
                                {(isMod || p.author_id===profile?.id) && <button onClick={()=>deletePost(p.id)} style={{ ...mkBtn("red"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Delete</button>}
                                {isMod && <span style={{ width:1, height:20, background:"rgba(78,128,190,0.2)", margin:"0 0.25rem" }} />}
                                {isMod && <button onClick={()=>setPostCanonStatus(p.id, "canon")} style={{ ...mkBtn(canonStatus==="canon"?"gold":"ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Canon</button>}
                                {isMod && <button onClick={()=>setPostCanonStatus(p.id, "non_canon")} style={{ ...mkBtn(canonStatus==="non_canon"?"red":"ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Non-Canon</button>}
                                {isMod && canonStatus && <button onClick={()=>setPostCanonStatus(p.id, null)} style={{ ...mkBtn("ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Clear Tag</button>}
                                <button onClick={()=>navigator.clipboard?.writeText(postLink(p))} style={{ ...mkBtn("ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Copy Link</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color:"#8493ad", textAlign:"center", padding:"1.5rem", fontStyle:"italic", fontSize:13 }}>No replies yet. Be the first to respond!</p>
                  )}
                </div>
              </>
            );
          })()}
          {forumLoading && <div style={{ textAlign:"center", padding:"1.5rem" }}><span className="forum-spinner" style={{ display:"inline-block", width:24, height:24, border:"2px solid rgba(212,175,55,0.15)", borderTopColor:"#d4af37", borderRadius:"50%", animation:"forumSpin 0.7s linear infinite" }} /></div>}
          {hasMorePosts && <button onClick={()=>loadThreadPosts(view.thread, Math.max(tPosts.length - 1, 0), true, replySort)} style={{ ...mkBtn("ghost"), alignSelf:"center", minHeight:40, padding:"10px 24px", fontSize:12, letterSpacing:"0.04em" }}>Load More Replies</button>}
        </div>
        {profile && !view.thread.locked && !isProfileBlocked(profile) && (
          <div className="forum-composer-card" style={{ ...card, border:"1px solid rgba(212,175,55,0.18)" }}>
            <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Post Reply</h3>
            <div className="editor-tabs">
              <button onClick={()=>setReplyEditorTab("write")} style={{ ...mkBtn(replyEditorTab==="write"?"gold":"ghost"), fontSize:11 }}>Write</button>
              <button onClick={()=>setReplyEditorTab("preview")} style={{ ...mkBtn(replyEditorTab==="preview"?"gold":"ghost"), fontSize:11 }}>Preview</button>
            </div>
            <BBCodeToolbar onInsert={appendReplyBBCode} mkBtn={mkBtn} />
            {replyEditorTab==="write"
              ? <textarea className="forum-composer-textarea" placeholder="Write your reply. BBCode is supported. HTML is escaped except a tiny safe formatting subset." value={replyBody} onChange={e=>setReplyBody(e.target.value)} style={composerTextarea} />
              : <div className="post-preview"><RichText>{replyBody || "Nothing to preview yet."}</RichText></div>}
            <button onClick={submitReply} style={{ ...mkBtn(), marginTop:"0.75rem" }}>Post Reply</button>
          </div>
        )}
        {profile && !view.thread.locked && isProfileBlocked(profile) && <div style={{ ...card, textAlign:"center", color:"#ffb4b4", fontSize:13 }}>Your account is not currently allowed to reply.</div>}
        {view.thread.locked && <div style={{ ...card, textAlign:"center", color:"#8fa0bd", fontSize:13, fontStyle:"italic" }}>This thread is locked.</div>}
      </div>
    );
  }
};

// Used inline in ForumsPage but needs import
const ProfileButton = ({ profile, onViewProfile, children, style = {} }) => {
  if (!profile?.id || !onViewProfile) return <span style={style}>{children || profile?.username || "Unknown"}</span>;
  return (
    <button
      onClick={(event) => { event.stopPropagation(); onViewProfile(profile.id); }}
      style={{ background:"transparent", border:"none", padding:0, minHeight:0, color:"inherit", cursor:"pointer", font:"inherit", textAlign:"left", ...style }}
    >
      {children || profile.username || "Unknown"}
    </button>
  );
};

const Flag = ({ nation, size = 36 }) => {
  if (nation?.flag_url) {
    return (
      <img src={nation.flag_url} alt={nation.name}
        style={{ width:size, height:Math.round(size*0.65), objectFit:"cover", borderRadius:3, border:"1px solid rgba(255,255,255,0.1)", flexShrink:0 }} />
    );
  }
  const ab = nation?.name ? nation.name.slice(0,2).toUpperCase() : "??";
  return (
    <div style={{ width:size, height:Math.round(size*0.65), flexShrink:0, background:"rgba(255,255,255,0.06)", borderRadius:3, border:"1px solid rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.22, fontWeight:900, color:"#8fa0bd", userSelect:"none", letterSpacing:1 }}>{ab}</div>
  );
};
