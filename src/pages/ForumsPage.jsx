import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { RichText } from "../lib/richText";
import { card, mkBtn, inp, ta, timeAgo, isProfileBlocked, writeRoute } from "../lib/uiUtils";
import { BOARD_ICONS, boardVisibility } from "../lib/forumUtils";
import { FORUM_PAGE_SIZE } from "../lib/constants";
import { Flag } from "../components/nation/Flag";
import { ProfileButton } from "../components/profile/ProfileButton";
import BBCodeToolbar from "../components/forum/BBCodeToolbar";
import ForumIndex from "./ForumIndex";
import { ThreadView } from "../components/forum/ThreadView";
import { createMentionNotifications } from "../lib/notifications";
import { useToast } from "../lib/ToastContext";

export const ForumsPage = ({ boards, route, onRouteChange, profile, userNation, nations, isMod, onRefresh, onRequireAuth, onViewProfile }) => {
  const showStatus = useToast();
  const [view, setView] = useState({ type:"boards" });
  const [boardThreads, setBoardThreads] = useState([]);
  const [forumLoading, setForumLoading] = useState(false);
  const [forumError, setForumError] = useState("");
  const [hasMoreThreads, setHasMoreThreads] = useState(false);
  const [threadForm, setThreadForm] = useState({ title:"", body:"" });
  const [showNewThread, setShowNewThread] = useState(false);
  const [threadEditorTab, setThreadEditorTab] = useState("write");
  const composerTextarea = { ...ta, minHeight:240, lineHeight:1.7, padding:"1rem", fontSize:16 };
  const appendThreadBBCode = (open, close) => setThreadForm(current => ({ ...current, body:`${current.body}${open}${close}` }));

  const normalizeThread = thread => ({
    ...thread,
    pinned: thread.pinned ?? thread.legacy_pinned ?? thread.is_pinned ?? false,
    locked: thread.locked ?? thread.legacy_locked ?? thread.is_locked ?? false,
    profiles: thread.profiles || { id: thread.author_id, username: thread.author_username, avatar_url: thread.author_avatar_url },
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

  useEffect(() => {
    const nextRoute = route || { type:"boards" };
    if (nextRoute.type === "boards") {
      setView({ type:"boards" });
      return;
    }
    if (nextRoute.type === "board") {
      const board = boards.find(item => item.slug === nextRoute.boardSlug);
      if (!board) return;
      const vis = boardVisibility(board);
      if ((vis === "staff" || vis === "hidden") && !isMod) {
        setForumError("Board not found.");
        return;
      }
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
      };
      loadThread();
    }
  }, [route, boards, loadBoardThreads]);

  useEffect(() => {
    if (view.type !== "thread") return;
    window.scrollTo({ top:0, behavior:"smooth" });
  }, [view.type]);

  const submitThread = async () => {
    if (!threadForm.title.trim()||!threadForm.body.trim()||view.type!=="board") return;
    if (isProfileBlocked(profile)) {
      showStatus("Your account is not currently allowed to post.", "error");
      return;
    }
    const {data,error} = await supabase.from("forum_threads").insert({ board_id:view.board.id, author_id:profile.id, nation_id:userNation?.id||null, title:threadForm.title }).select().single();
    if (error) { showStatus(`Thread failed: ${error.message}`, "error"); return; }
    const postResult = await supabase.from("forum_posts").insert({ thread_id:data.id, author_id:profile.id, nation_id:userNation?.id||null, body:threadForm.body });
    if (postResult.error) { showStatus(`Opening post failed: ${postResult.error.message}`, "error"); return; }
    const createdThread = normalizeThread({ ...data, reply_count:0, last_post_at:data.created_at });
    createMentionNotifications({ body:threadForm.body, sourceTitle:threadForm.title, sourceLink:`${window.location.origin}/forums/thread/${data.id}`, sourceType:"forum", allProfiles:profile ? [] : [] });
    setThreadForm({title:"",body:""}); setShowNewThread(false); onRefresh();
    pushForumRoute({ type:"thread", thread:createdThread });
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
                ? <textarea className="forum-composer-textarea" placeholder="Opening post. BBCode is supported." value={threadForm.body} onChange={e=>setThreadForm({...threadForm,body:e.target.value})} style={composerTextarea} />
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
    return (
      <ThreadView
        thread={view.thread}
        board={board}
        profile={profile}
        userNation={userNation}
        nations={nations}
        isMod={isMod}
        onBack={() => board ? pushForumRoute({type:"board",board}) : pushForumRoute({type:"boards"})}
        onRefresh={onRefresh}
        onViewProfile={onViewProfile}
      />
    );
  }

  return null;
};
