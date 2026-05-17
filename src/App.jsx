import { useState, useEffect, useCallback } from "react";
import { supabase, SUPABASE_CONFIGURED } from "./lib/supabase";
import { canAccessStaff, canManageRoles } from "./lib/permissions";
import { ensureProfile, parseRoute, writeRoute, timeAgo, card, mkBtn, inp, ta, fmtGameDate } from "./lib/uiUtils";
import { PAGE_PATHS, LOGO_SRC } from "./lib/constants";
import { ROLE_LABELS } from "./lib/permissions";
import { Flag } from "./components/nation/Flag";
import { SetupModal } from "./components/layout/SetupModal";
import { StaffTools } from "./components/layout/StaffTools";
import { NotificationsBell } from "./components/notifications/NotificationsBell";
import { fetchGameState } from "./lib/notifications";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { NationsPage } from "./pages/NationsPage";
import { RPBoardPage } from "./pages/RPBoardPage";
import { ActionsPage } from "./pages/ActionsPage";
import { WarsPage } from "./pages/WarsPage";
import { NewsPage } from "./pages/NewsPage";
import { LeaderboardsPage } from "./pages/LeaderboardsPage";
import { ChangelogPage } from "./pages/ChangelogPage";
import { ForumsPage } from "./pages/ForumsPage";
import { AdminPanel } from "./pages/AdminPanel";

export default function App() {
  const initialRoute = parseRoute();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState(initialRoute.page);
  const [forumRoute, setForumRoute] = useState(initialRoute.forumRoute);
  const [publicProfileId, setPublicProfileId] = useState(initialRoute.profileId || null);
  const [data, setData] = useState({ nations:[], profiles:[], news:[], posts:[], actions:[], wars:[], warParticipants:[], alliances:[], allianceMembers:[], boards:[], threads:[], forumPosts:[], forumReactions:[] });
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [showUnconfiguredGuide, setShowUnconfiguredGuide] = useState(false);
  const [gameState, setGameState] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }
    const issues = [];
    const run = async (label, query, fallback) => {
      const result = await query;
      if (!result.error) return result.data || [];
      issues.push(`${label}: ${result.error.message}`);
      if (!fallback) return [];
      const retry = await fallback(result.error);
      if (retry.error) {
        issues.push(`${label} fallback: ${retry.error.message}`);
        return [];
      }
      return retry.data || [];
    };
    const [nations, profiles, news, posts, actions, wars, warParticipants, alliances, allianceMembers, boards] = await Promise.all([
      run("Nations", supabase.from("nations").select("*, owner:owner_id(username)").order("name"),
        () => supabase.from("nations").select("*").order("name")),
      supabase.from("profiles").select("id,username,role,nation_id,avatar_url,signature_url,bio,status,suspended_until,ban_reason,last_active_at,created_at").order("username").limit(1000),
      supabase.from("news").select("*").order("pinned",{ascending:false}).order("created_at",{ascending:false}).limit(25),
      supabase.from("rp_posts").select("*, nations(name,flag_url), target_nation_id").order("created_at",{ascending:false}).limit(100),
      supabase.from("canon_actions").select("*, nations(name,flag_url), action_updates(*, profiles(username))").order("created_at",{ascending:false}).limit(50),
      supabase.from("wars").select("*, aggressor:aggressor_id(name,flag_url), defender:defender_id(name,flag_url)").order("started_at",{ascending:false}).limit(50),
      run("War participants", supabase.from("war_participants").select("*").order("created_at").limit(500),
        error => /could not find|does not exist|schema cache/i.test(error.message || "") ? Promise.resolve({ data:[], error:null }) : Promise.resolve({ data:null, error })),
      supabase.from("alliances").select("*").order("created_at",{ascending:false}).limit(100),
      supabase.from("alliance_members").select("*").limit(1000),
      run("Forum boards", supabase.from("forum_board_summaries").select("*").order("sort_order"),
        () => supabase.from("forum_boards").select("*").order("sort_order")),
    ]);
    const unwrap = result => Array.isArray(result) ? result : (result.data || []);
    const plainWars = unwrap(wars);
    const plainWarParticipants = warParticipants;
    const warsWithParticipants = plainWars.map(w => ({
      ...w,
      war_participants: plainWarParticipants.filter(p => p.war_id === w.id),
    }));
    setData({ nations, profiles:unwrap(profiles), news:unwrap(news), posts:unwrap(posts), actions:unwrap(actions), wars:warsWithParticipants, warParticipants:plainWarParticipants, alliances:unwrap(alliances), allianceMembers:unwrap(allianceMembers), boards:unwrap(boards), threads:[], forumPosts:[], forumReactions:[] });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }
    supabase.from("forum_boards").select("id").limit(1).then(({ error }) => {
      setSetupRequired(Boolean(error && (error.code === "42P01" || error.message?.toLowerCase().includes("could not find the table"))));
    });
    fetchGameState().then(gs => { if (gs) setGameState(gs); });
    supabase.auth.getSession().then(({data:s}) => {
      if (s.session?.user) {
        setUser(s.session.user);
        ensureProfile(s.session.user).then(async p=>{
          if(p) {
            setProfile(p);
            await supabase.from("profiles").update({ last_active_at:new Date().toISOString() }).eq("id", p.id);
          }
        }).catch(console.error);
      }
      fetchAll();
    });
    supabase.auth.onAuthStateChange((_,session) => {
      if(session?.user) {
        setUser(session.user);
        ensureProfile(session.user).then(async p=>{
          if(p) {
            setProfile(p);
            await supabase.from("profiles").update({ last_active_at:new Date().toISOString() }).eq("id", p.id);
          }
        }).catch(console.error);
      } else {
        setUser(null);
        setProfile(null);
      }
    });
  }, [fetchAll]);

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = parseRoute();
      setPage(nextRoute.page);
      setForumRoute(nextRoute.forumRoute);
      setPublicProfileId(nextRoute.profileId || null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (!SUPABASE_CONFIGURED) {
    return (
      <>
        {showUnconfiguredGuide && <SetupModal onClose={()=>setShowUnconfiguredGuide(false)} />}
        {!showUnconfiguredGuide && (
          <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"1rem", background:"#030712", color:"#d7e2f2", gap:"1rem" }}>
            <div style={{ textAlign:"center", maxWidth:420 }}>
              <h2 style={{ fontFamily:"var(--brand)", color:"#d4af37", fontSize:"1.5rem", margin:"0 0 0.5rem" }}>Supabase Not Configured</h2>
              <p style={{ fontSize:13, lineHeight:1.6, margin:0 }}>Set <code style={{ color:"#d4af37" }}>VITE_SUPABASE_URL</code> and <code style={{ color:"#d4af37" }}>VITE_SUPABASE_ANON_KEY</code> in your <code style={{ color:"#d4af37" }}>.env</code> file, then refresh.</p>
            </div>
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={()=>setShowUnconfiguredGuide(true)} style={mkBtn("ghost")}>Setup Guide</button>
              <button onClick={()=>window.location.reload()} style={mkBtn()}>Refresh</button>
            </div>
          </div>
        )}
      </>
    );
  }

  const userNation = profile?.nation_id ? data.nations.find(n=>n.id===profile.nation_id) : null;
  const isAdmin = canManageRoles(profile);
  const isLoreTeam = canAccessStaff(profile);

  const nav = [
      {id:"forums",label:"Boards"},
      {id:"nations",label:"Nations"},
      {id:"leaderboards",label:"Leaderboards"},
      {id:"changelog",label:"Changelog"},
      {id:"news",label:"News"},
    ...(user ? [
      {id:"profile",label:"Profile"},
      {id:"rp",label:"Dispatches"},
      {id:"actions",label:"Actions"},
      {id:"wars",label:"Wars and Alliances"},
      {id:"home",label:"Overview"},
    ] : []),
  ];

  const navigate = (id) => {
    setPage(id);
    setForumRoute({ type:"boards" });
    setPublicProfileId(null);
    writeRoute(PAGE_PATHS[id] || "/forums");
  };
  const viewProfile = (profileId) => {
    setPage("profile");
    setForumRoute({ type:"boards" });
    setPublicProfileId(profileId);
    writeRoute(`/profile/${encodeURIComponent(profileId)}`);
  };
  const handleNotificationLink = (link) => {
    if (!link) return;
    if (link.startsWith("/")) {
      const pagePath = Object.entries(PAGE_PATHS).find(([, p]) => link.startsWith(p))?.[0];
      if (pagePath) navigate(pagePath);
    }
  };
  const handleGameDayAdvance = (result) => {
    if (result) setGameState(prev => ({ ...prev, game_day: result.day, game_year: result.year }));
  };
  const updateProfile = (nextProfile) => {
    setProfile(nextProfile);
    setData(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => p.id === nextProfile.id ? nextProfile : p),
    }));
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <header className="app-header" style={{ background:"rgba(3,4,7,0.98)", borderBottom:"1px solid rgba(20,96,184,0.36)", padding:"0 1.25rem", display:"flex", alignItems:"center", gap:"1rem", height:50, position:"sticky", top:0, zIndex:200, backdropFilter:"blur(20px)" }}>
        <div className="brand" style={{ display:"flex", alignItems:"center", gap:"0.55rem", cursor:"pointer", flexShrink:0 }} onClick={()=>navigate("forums")}>
          <img className="brand-logo" src={LOGO_SRC} alt="Nationwheel" style={{ width:34, height:34, objectFit:"cover", borderRadius:"50%", border:"1px solid rgba(246,193,50,0.35)" }} />
          <span className="brand-name" style={{ fontFamily:"var(--brand)", color:"#f5f8ff", fontSize:15, letterSpacing:"0.08em", fontWeight:900 }}>NATIONWHEEL</span>
        </div>
        <nav className="app-nav" style={{ display:"flex", gap:"0.1rem", flex:1, overflowX:"auto", scrollbarWidth:"none" }}>
          {nav.map(n=>(
            <button className="nav-button" key={n.id} onClick={()=>navigate(n.id)} style={{ background:page===n.id?"rgba(20,96,184,0.16)":"transparent", color:page===n.id?"#f6c132":"#8aa4c9", border:"none", borderRadius:5, padding:"5px 9px", cursor:"pointer", fontSize:11.5, fontWeight:page===n.id?800:600, whiteSpace:"nowrap", transition:"all 0.15s", fontFamily:"inherit" }}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="user-tools" style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexShrink:0 }}>
          {user ? <>
            {userNation && <><Flag nation={userNation} size={20} /><span style={{ fontSize:11, color:"#9fb4d6", maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userNation.name}</span></>}
            <NotificationsBell profile={profile} onNavigate={handleNotificationLink} />
            <button onClick={()=>navigate("profile")} style={{ background:"transparent", border:"none", padding:0, minHeight:0, color:"#9fb4d6", fontSize:11, cursor:"pointer" }}>{profile?.username || "profile"}</button>
            {isLoreTeam && <span style={{ fontSize:9, color:"#3498db", border:"1px solid #3498db33", borderRadius:3, padding:"1px 5px", letterSpacing:"0.06em" }}>{(ROLE_LABELS[profile?.role] || profile?.role || "Staff").toUpperCase()}</span>}
            {isLoreTeam && <button onClick={()=>navigate("admin")} style={{ ...mkBtn("ghost"), padding:"4px 8px", fontSize:11 }}>{isAdmin ? "Admin" : "Lore"}</button>}
            <button onClick={()=>supabase.auth.signOut()} style={{ ...mkBtn("ghost"), padding:"4px 8px", fontSize:11 }}>Sign Out</button>
          </> : (
            <button onClick={()=>navigate("auth")} style={{ ...mkBtn("gold"), padding:"4px 10px", fontSize:11 }}>Sign In</button>
          )}
        </div>
      </header>

      {isLoreTeam && (
        <StaffTools
          isAdmin={isAdmin}
          page={page}
          navigate={navigate}
          counts={{
            nations:data.nations.length,
            wars:data.wars.filter(w=>w.status!=="peace").length,
            actions:data.actions.filter(a=>["pending","active"].includes(a.status)).length,
          }}
          gameState={gameState}
          onGameDayAdvance={handleGameDayAdvance}
        />
      )}

      <main className="app-main" style={{ maxWidth:1120, margin:"0 auto", padding:"1.5rem 1rem", width:"100%", flex:1 }}>
        {loading
          ? <div style={{ textAlign:"center", padding:"5rem", color:"#8493ad", fontFamily:"var(--display)", letterSpacing:"0.2em", fontSize:13 }}>LOADING WORLD</div>
          : <>
              {page==="home"         && <HomePage nations={data.nations} news={data.news} actions={data.actions} wars={data.wars} />}
              {page==="nations"      && <NationsPage nations={data.nations} posts={data.posts} actions={data.actions} wars={data.wars} alliances={data.alliances} allianceMembers={data.allianceMembers} profile={profile} userNation={userNation} isMod={isLoreTeam} isAdmin={isAdmin} onRefresh={fetchAll} />}
              {page==="rp"           && <RPBoardPage posts={data.posts} profile={profile} userNation={userNation} nations={data.nations} isMod={isLoreTeam} onRefresh={fetchAll} />}
              {page==="actions"      && <ActionsPage actions={data.actions} profile={profile} userNation={userNation} nations={data.nations} isMod={isLoreTeam} onRefresh={fetchAll} />}
              {page==="wars"         && <WarsPage wars={data.wars} alliances={data.alliances} allianceMembers={data.allianceMembers} warParticipants={data.warParticipants} nations={data.nations} profiles={data.profiles} profile={profile} userNation={userNation} isMod={isLoreTeam} onRefresh={fetchAll} />}
              {page==="news"         && <NewsPage news={data.news} profile={profile} isMod={isLoreTeam} onRefresh={fetchAll} />}
              {page==="leaderboards" && <LeaderboardsPage nations={data.nations} />}
              {page==="changelog"    && <ChangelogPage />}
              {page==="profile" && publicProfileId && <PublicProfilePage viewedProfile={data.profiles.find(item=>item.id===publicProfileId)} nations={data.nations} posts={data.posts} actions={data.actions} onBack={()=>navigate("forums")} />}
              {page==="profile" && !publicProfileId && user && profile && <ProfilePage profile={profile} profiles={data.profiles} userNation={userNation} onProfileUpdate={updateProfile} onViewProfile={viewProfile} />}
              {page==="forums"       && <ForumsPage boards={data.boards} route={forumRoute} onRouteChange={setForumRoute} profile={profile} userNation={userNation} nations={data.nations} isMod={isLoreTeam} onRefresh={fetchAll} onRequireAuth={()=>navigate("auth")} onViewProfile={viewProfile} />}
              {page==="auth"         && <AuthPage setupRequired={setupRequired} onAuth={(u,p)=>{setUser(u);if(p)setProfile(p);else ensureProfile(u).then(next=>{if(next)setProfile(next);}).catch(console.error);fetchAll();setPage("forums");setForumRoute({ type:"boards" });writeRoute("/forums");}} />}
              {page==="admin" && isLoreTeam && <AdminPanel nations={data.nations} profiles={data.profiles} onRefresh={fetchAll} isAdmin={isAdmin} />}
            </>
        }
      </main>

      <footer className="app-footer" style={{ borderTop:"1px solid rgba(20,96,184,0.22)", padding:"1rem", textAlign:"center", fontSize:10, color:"#6f85a8", letterSpacing:"0.15em", textTransform:"uppercase" }}>
        Nationwheel - Geopolitical Roleplay World - Season 1
        {gameState && <span style={{ marginLeft:"1rem", color:"#d4af37" }}>{fmtGameDate(gameState.game_day, gameState.game_year)}</span>}
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cinzel:wght@700;900&display=swap');
        :root { --display:'Inter',Arial,sans-serif; --brand:'Cinzel',Georgia,serif; --body:'Inter',Arial,sans-serif; }
        *,*::before,*::after{box-sizing:border-box;}
        body {
          font-family: var(--body);
          background: #030712;
          background-image: linear-gradient(180deg,#07111f 0%,#030712 42%,#02050b 100%);
          color:#f5f8ff; margin:0;
        }
        input::placeholder,textarea::placeholder{color:#7184a5;}
        input:focus,textarea:focus,select:focus{outline:none;border-color:rgba(246,193,50,0.72)!important;box-shadow:0 0 0 3px rgba(20,96,184,0.16);}
        select option{background:#05070b;color:#f5f8ff;}
        button:hover{opacity:0.8;}
        button:active{transform:scale(0.97);}
        button,input,textarea,select{font:inherit;}
        button{min-height:40px;}
        body{overflow-x:hidden;}
        .rich-post{margin:0;color:#d7e2f2;font-size:13px;line-height:1.85;white-space:pre-wrap;overflow-wrap:anywhere;}
        .rich-post blockquote{margin:0.75rem 0;padding:0.6rem 0.75rem;border-left:3px solid rgba(246,193,50,0.35);background:rgba(255,255,255,0.04);color:#edf4ff;}
        .rich-post pre{white-space:pre-wrap;overflow:auto;background:#030405;border:1px solid rgba(20,96,184,0.28);border-radius:6px;padding:0.75rem;color:#99dca7;}
        .rich-post a{color:#6fb7ff;text-decoration:underline;}
        .rich-post img{display:block;max-width:100%;height:auto;border-radius:6px;margin:0.75rem 0;border:1px solid rgba(255,255,255,0.12);}
        .bb-center{text-align:center;}
        .bb-left{text-align:left;}
        .bb-right{text-align:right;}
        .bb-hr{border:0;border-top:1px solid rgba(246,193,50,0.28);margin:1rem 0;}
        .bb-list{margin:0.75rem 0;padding-left:1.35rem;}
        .bb-spoiler{border:1px solid rgba(246,193,50,0.18);border-radius:6px;padding:0.5rem 0.65rem;background:rgba(255,255,255,0.035);}
        .bb-mention{display:inline-flex;color:#f6c132;font-weight:800;}
        .bbcode-toolbar,.editor-tabs{display:flex;gap:0.45rem;flex-wrap:wrap;align-items:center;}
        .forum-composer-card{padding:1.45rem!important;}
        .forum-composer-card .editor-tabs{margin-bottom:0.55rem;}
        .forum-composer-card .bbcode-toolbar{margin-bottom:0.75rem;}
        .forum-composer-textarea{display:block;width:100%;max-width:100%;}
        .post-preview{min-height:180px;border:1px solid rgba(21,96,181,0.42);border-radius:6px;padding:1rem;background:rgba(255,255,255,0.035);}
        .forum-index-head{display:flex;gap:1rem;align-items:flex-start;justify-content:space-between;margin-bottom:1rem;}
        .forum-index-head h2{margin:0 0 0.35rem;font-family:var(--display);color:#f6c132;font-size:22px;}
        .forum-index-head p{margin:0;color:#9fb4d6;font-size:13px;line-height:1.65;}
        .forum-categories{display:flex;flex-direction:column;gap:0.85rem;}
        .forum-category{padding:0!important;overflow:hidden;}
        .forum-category-toggle{width:100%;display:flex;align-items:center;gap:0.75rem;text-align:left;background:linear-gradient(90deg,rgba(20,96,184,0.18),rgba(246,193,50,0.06));border:0;border-bottom:1px solid rgba(78,128,190,0.18);padding:0.9rem 1rem;color:#edf4ff;cursor:pointer;}
        .forum-category-toggle strong{display:block;font-size:14px;color:#f8fbff;}
        .forum-category-toggle small{display:block;margin-top:0.2rem;color:#8fa0bd;font-size:12px;line-height:1.45;}
        .unread-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.16);box-shadow:0 0 0 4px rgba(255,255,255,0.03);flex-shrink:0;}
        .unread-dot.active{background:#f6c132;box-shadow:0 0 0 4px rgba(246,193,50,0.12);}
        .category-collapse{margin-left:auto;color:#9fb4d6;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;}
        .forum-board-grid{display:flex;flex-direction:column;}
        .forum-board-row{width:100%;display:grid;grid-template-columns:42px minmax(0,1fr) minmax(112px,auto);gap:0.85rem;align-items:center;text-align:left;background:transparent;border:0;border-bottom:1px solid rgba(78,128,190,0.12);padding:0.95rem 1rem;color:#edf4ff;cursor:pointer;}
        .forum-board-row:last-child{border-bottom:0;}
        .forum-board-row:hover{background:rgba(255,255,255,0.035);opacity:1;}
        .forum-board-icon{width:38px;height:38px;display:grid;place-items:center;border:1px solid rgba(78,128,190,0.24);border-radius:8px;background:rgba(255,255,255,0.04);font-size:20px;}
        .forum-board-main{min-width:0;display:flex;flex-direction:column;gap:0.2rem;}
        .forum-board-title{display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;font-weight:800;color:#f8fbff;font-size:14px;}
        .forum-status-badge{border:1px solid;border-radius:999px;padding:1px 7px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;}
        .forum-board-description,.forum-board-last{color:#8fa0bd;font-size:12px;line-height:1.45;}
        .forum-board-last{color:#b7c7df;}
        .forum-board-stats{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;color:#8fa0bd;font-size:11px;text-align:right;white-space:nowrap;}
        .forum-board-stats strong{display:block;color:#f6c132;font-size:16px;}
        .post-signature{display:block;max-width:100%;max-height:120px;object-fit:contain;margin-top:1rem;padding-top:0.85rem;border-top:1px solid rgba(20,96,184,0.16);}
        .forum-post-layout{display:flex;gap:1.1rem;align-items:flex-start;}
        .post-author{border-right:1px solid rgba(20,96,184,0.16);padding-right:1rem;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:#020305;}
        ::-webkit-scrollbar-thumb{background:rgba(246,193,50,0.28);border-radius:2px;}
        nav::-webkit-scrollbar{display:none;}
        @media (max-width: 760px) {
          .app-header{height:auto!important;min-height:104px!important;padding:0.65rem 0.75rem 0.55rem!important;display:grid!important;grid-template-columns:1fr auto!important;grid-template-areas:"brand tools" "nav nav"!important;gap:0.55rem!important;align-items:center!important;}
          .staff-tools{top:104px!important;}
          .brand{grid-area:brand;min-width:0;}
          .brand-logo{width:32px!important;height:32px!important;}
          .brand-name{font-size:13px!important;letter-spacing:0.06em!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .user-tools{grid-area:tools;gap:0.35rem!important;max-width:48vw;overflow:hidden;justify-content:flex-end;}
          .user-tools > span{display:none!important;}
          .user-tools button{padding:6px 9px!important;font-size:11px!important;min-height:34px!important;}
          .app-nav{grid-area:nav;width:100%;gap:0.35rem!important;padding:0.05rem 0 0.15rem;overflow-x:auto!important;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;}
          .nav-button{min-height:38px!important;padding:8px 12px!important;font-size:12px!important;border:1px solid rgba(20,96,184,0.26)!important;scroll-snap-align:start;}
          .app-main{padding:1rem 0.75rem 1.25rem!important;max-width:none!important;}
          .app-footer{font-size:9px!important;letter-spacing:0.08em!important;padding:0.85rem 0.75rem!important;}
          .board-card{padding:1rem!important;}
          .board-card-row{align-items:flex-start!important;gap:0.75rem!important;}
          .board-count{min-width:48px;}
          .forum-index-head{display:block;}
          .forum-index-head button{margin-top:0.75rem;}
          .forum-board-row{grid-template-columns:36px minmax(0,1fr);gap:0.7rem;padding:0.85rem;}
          .forum-board-icon{width:34px;height:34px;font-size:18px;}
          .forum-board-stats{grid-column:2;grid-template-columns:repeat(2,auto);justify-content:start;text-align:left;}
          .thread-card{padding:0.85rem!important;gap:0.6rem!important;align-items:flex-start!important;}
          .thread-card:hover,.nation-card:hover{border-color:rgba(212,175,55,0.38)!important;}
          .post-card{padding:1rem!important;}
          .forum-composer-card{padding:1rem!important;}
          .forum-composer-textarea{min-height:220px!important;}
          .forum-post-layout{display:block!important;}
          .post-author{width:auto!important;border-right:none!important;border-bottom:1px solid rgba(20,96,184,0.16);padding:0 0 0.85rem!important;margin-bottom:0.85rem;display:grid;grid-template-columns:auto 1fr;column-gap:0.85rem;align-items:center;}
          .post-author img,.post-author > div:first-child{grid-row:1 / span 3;}
          .profile-grid{grid-template-columns:1fr!important;}
          .profile-community-grid,.admin-user-grid,.admin-code-grid{grid-template-columns:1fr!important;}
          .war-participant-form{grid-template-columns:1fr!important;}
        }
        @media (max-width: 430px) {
          .app-header{min-height:108px!important;}
          .staff-tools{top:108px!important;}
          .brand-name{font-size:12px!important;}
          .user-tools{max-width:44vw;}
          .user-tools button{padding:5px 7px!important;font-size:10.5px!important;}
          .nav-button{font-size:11.5px!important;padding:8px 10px!important;}
          h1{font-size:2rem!important;}
          h2{font-size:18px!important;}
        }
        @keyframes forumSpin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
