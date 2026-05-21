import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase, SUPABASE_CONFIGURED } from "./lib/supabase";
import { isAdmin, isLoreTeam } from "./lib/permissions";
import { parseRoute, writeRoute, mkBtn, fmtGameDate, ROLE_LABELS, ROLE_COLORS, getPrimaryRole } from "./lib/uiUtils";
import { PAGE_PATHS, LOGO_SRC } from "./lib/constants";
import { Flag } from "./components/nation/Flag";
import { SetupModal } from "./components/layout/SetupModal";
import { StaffTools } from "./components/layout/StaffTools";
import { NotificationsBell } from "./components/notifications/NotificationsBell";
import { ToastProvider } from "./lib/ToastContext";
import { UserProvider, useUser } from "./lib/UserContext";
import { DataProvider, useData } from "./lib/DataContext";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { NationsPage } from "./pages/NationsPage";
import { NationProfile } from "./pages/NationProfile";
import { RPBoardPage } from "./pages/RPBoardPage";
import { ActionsPage } from "./pages/ActionsPage";
import { WarsPage } from "./pages/WarsPage";
import { NewsPage } from "./pages/NewsPage";
import { LeaderboardsPage } from "./pages/LeaderboardsPage";
import { ChangelogPage } from "./pages/ChangelogPage";
import { ForumsPage } from "./pages/ForumsPage";
import { AdminPanel } from "./pages/AdminPanel";
import { GameMechanicsPage } from "./pages/GameMechanicsPage";
import { AllianceProfile } from "./pages/AllianceProfile";
import { DiplomacyPage } from "./pages/DiplomacyPage";
import { EconomyPage } from "./pages/EconomyPage";
import { AssemblyPage } from "./pages/AssemblyPage";
import { SettingsPage } from "./pages/SettingsPage";

function AppShell() {
  const initialRoute = parseRoute();
  const [page, setPage] = useState(initialRoute.page);
  const [forumRoute, setForumRoute] = useState(initialRoute.forumRoute);
  const [publicProfileId, setPublicProfileId] = useState(initialRoute.profileId || null);
  const [allianceViewId, setAllianceViewId] = useState(null);
  const [nationViewId, setNationViewId] = useState(initialRoute.nationId || null);
  const [showUnconfiguredGuide, setShowUnconfiguredGuide] = useState(false);

  const { user, profile, gameState, setUser, setProfile, setGameState, restoreSession, signOut } = useUser();
  const { data, loading, setupRequired, setSetupRequired, fetchAll } = useData();

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    supabase.from("forum_boards").select("id").limit(1).then(({ error }) => {
      setSetupRequired(Boolean(error && (error.code === "42P01" || error.message?.toLowerCase().includes("could not find the table"))));
    });
    restoreSession().then(() => fetchAll());
    supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
        import("./lib/uiUtils").then(({ ensureProfile }) =>
          ensureProfile(session.user).then(async p => {
            if (p) {
              setProfile(p);
              await supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", p.id);
            }
          }).catch(() => {})
        );
      } else {
        setUser(null);
        setProfile(null);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useCallback((id) => {
    setPage(id);
    setForumRoute({ type: "boards" });
    setPublicProfileId(null);
    setAllianceViewId(null);
    setNationViewId(null);
    writeRoute(PAGE_PATHS[id] || "/forums");
  }, []);

  const viewProfile = useCallback((profileId) => {
    setPage("profile");
    setForumRoute({ type: "boards" });
    setPublicProfileId(profileId);
    setNationViewId(null);
    writeRoute(`/profile/${encodeURIComponent(profileId)}`);
  }, []);

  const viewNation = useCallback((nationId) => {
    const nation = data.nations.find(n => n.id === nationId);
    if (!nation) return;
    setPage("nation");
    setPublicProfileId(null);
    setAllianceViewId(null);
    setNationViewId(nationId);
    writeRoute(`/nation/${encodeURIComponent(nationId)}`);
  }, [data.nations]);

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = parseRoute();
      setPage(nextRoute.page);
      setForumRoute(nextRoute.forumRoute);
      setPublicProfileId(nextRoute.profileId || null);
      setNationViewId(nextRoute.nationId || null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const el = e.target.closest(".bb-mention");
      if (!el) return;
      const type = el.getAttribute("data-type");
      const id = el.getAttribute("data-id");
      if (type === "user") {
        const found = data.profiles.find(p => p.id === id || p.username === id);
        if (found) viewProfile(found.id);
      } else if (type === "nation") {
        const found = data.nations.find(n => n.id === id || n.slug === id);
        if (found) viewNation(found.id);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [data.profiles, data.nations, viewProfile, viewNation]);

  if (!SUPABASE_CONFIGURED) {
    return (
      <>
        {showUnconfiguredGuide && <SetupModal onClose={() => setShowUnconfiguredGuide(false)} />}
        {!showUnconfiguredGuide && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem", background: "#030712", color: "#d7e2f2", gap: "1rem" }}>
            <div style={{ textAlign: "center", maxWidth: 420 }}>
              <h2 style={{ fontFamily: "var(--brand)", color: "#d4af37", fontSize: "1.5rem", margin: "0 0 0.5rem" }}>Supabase Not Configured</h2>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>Set <code style={{ color: "#d4af37" }}>VITE_SUPABASE_URL</code> and <code style={{ color: "#d4af37" }}>VITE_SUPABASE_ANON_KEY</code> in your <code style={{ color: "#d4af37" }}>.env</code> file, then refresh.</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => setShowUnconfiguredGuide(true)} style={mkBtn("ghost")}>Setup Guide</button>
              <button onClick={() => window.location.reload()} style={mkBtn()}>Refresh</button>
            </div>
          </div>
        )}
      </>
    );
  }

  const userNation = profile?.nation_id ? data.nations.find(n => n.id === profile.nation_id) : null;
  const isAdminRole = isAdmin(profile);
  const loreTeam = isLoreTeam(profile);

  const navGroups = [
    { type: "links", items: [
      { id: "forums", label: "Boards" },
      { id: "news", label: "News" },
      { id: "wars", label: "Wars" },
      { id: "alliances", label: "Alliances" },
      { id: "nations", label: "Nations" },
    ]},
    ...(user ? [
      { type: "dropdown", label: "World", items: [
        { id: "rp", label: "Dispatches" },
        { id: "actions", label: "Actions" },
        { id: "diplomacy", label: "Diplomacy" },
        { id: "economy", label: "Economy" },
        { id: "assembly", label: "Assembly" },
      ]},
    ] : []),
    { type: "dropdown", label: "More", items: [
      { id: "mechanics", label: "Mechanics" },
      { id: "leaderboards", label: "Leaderboards" },
      { id: "changelog", label: "Changelog" },
      ...(user ? [{ id: "settings", label: "Settings" }] : []),
    ]},
  ];

  const handleNotificationLink = (link) => {
    if (!link) return;
    if (link.startsWith("/")) {
      const [section, sub] = link.replace(/^\//, "").split("/");
      if (section === "profile" && sub) { viewProfile(sub); return; }
      if (section === "nation" && sub) { viewNation(sub); return; }
      const pagePath = Object.entries(PAGE_PATHS).find(([, p]) => link.startsWith(p))?.[0];
      if (pagePath) navigate(pagePath);
    }
  };

  const commonProps = { profile, userNation, isMod: loreTeam, isAdmin: isAdminRole };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="app-header" style={{ background: "rgba(3,4,7,0.98)", borderBottom: "1px solid rgba(20,96,184,0.36)", padding: "0 1.25rem", display: "flex", alignItems: "center", gap: "1rem", height: 50, position: "sticky", top: 0, zIndex: 200, backdropFilter: "blur(20px)" }}>
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: "0.55rem", cursor: "pointer", flexShrink: 0 }} onClick={() => navigate("forums")}>
          <img className="brand-logo" src={LOGO_SRC} alt="Nationwheel" style={{ width: 34, height: 34, objectFit: "cover", borderRadius: "50%", border: "1px solid rgba(246,193,50,0.35)" }} />
          <span className="brand-name" style={{ fontFamily: "var(--brand)", color: "#f5f8ff", fontSize: 15, letterSpacing: "0.08em", fontWeight: 900 }}>NATIONWHEEL</span>
        </div>
        <nav className="app-nav" style={{ display: "flex", gap: "0.1rem", flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
          {navGroups.map((group, gi) => {
            if (group.type === "links") {
              return group.items.map(n => (
                <button className="nav-button" key={n.id} onClick={() => navigate(n.id)} style={{ background: page === n.id ? "rgba(20,96,184,0.16)" : "transparent", color: page === n.id ? "#f6c132" : "#8aa4c9", border: "none", borderRadius: 5, padding: "5px 9px", cursor: "pointer", fontSize: 11.5, fontWeight: page === n.id ? 800 : 600, whiteSpace: "nowrap", transition: "all 0.15s", fontFamily: "inherit" }}>
                  {n.label}
                </button>
              ));
            }
            if (group.type === "dropdown") {
              return <NavDropdown key={gi} group={group} page={page} onNavigate={navigate} />;
            }
            return null;
          })}
        </nav>
        <div className="user-tools" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {user ? <>
            {userNation && <button onClick={() => viewNation(userNation.id)} style={{ background: "transparent", border: "none", padding: 0, minHeight: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Flag nation={userNation} size={20} />
              <span style={{ fontSize: 11, color: "#9fb4d6", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userNation.name}</span>
            </button>}
            <NotificationsBell profile={profile} onNavigate={handleNotificationLink} />
            <button onClick={() => viewProfile(profile?.id)} style={{ background: "transparent", border: "none", padding: 0, minHeight: 0, color: "#9fb4d6", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(246,193,50,0.2)" }} />
                : <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(246,193,50,0.15)" }} />}
              {profile?.username || "profile"}
            </button>
            {(() => { const r = getPrimaryRole(profile); return r !== "user" && r !== "guest" ? (
              <span style={{ fontSize: 8, fontWeight: 700, color: ROLE_COLORS[r] || "#8fa0bd", border: `1px solid ${ROLE_COLORS[r] || "#8fa0bd"}33`, borderRadius: 3, padding: "1px 5px", letterSpacing: "0.06em" }}>{ROLE_LABELS[r]?.toUpperCase() || r?.toUpperCase()}</span>
            ) : null; })()}
            {loreTeam && <button onClick={() => navigate("admin")} style={{ ...mkBtn("ghost"), padding: "4px 8px", fontSize: 11 }}>{isAdminRole ? "Admin" : "Lore"}</button>}
            <button onClick={signOut} style={{ ...mkBtn("ghost"), padding: "4px 8px", fontSize: 11 }}>Sign Out</button>
          </> : (
            <button onClick={() => navigate("auth")} style={{ ...mkBtn("gold"), padding: "4px 10px", fontSize: 11 }}>Sign In</button>
          )}
        </div>
      </header>

      {loreTeam && (
        <StaffTools
          isAdmin={isAdminRole}
          page={page}
          navigate={navigate}
          counts={{ nations: data.nations.length, wars: data.wars.filter(w => w.status !== "peace").length, actions: data.actions.filter(a => ["pending", "active"].includes(a.status)).length }}
          gameState={gameState}
          onGameDayAdvance={(result) => {
            if (result) setGameState(prev => ({ ...prev, game_day: result.day, game_year: result.year }));
          }}
        />
      )}

      <main className="app-main" style={{ maxWidth: 1120, margin: "0 auto", padding: "1.5rem 1rem", width: "100%", flex: 1 }}>
        {loading
          ? <div style={{ textAlign: "center", padding: "5rem", color: "#8493ad", fontFamily: "var(--display)", letterSpacing: "0.2em", fontSize: 13 }}>LOADING WORLD</div>
          : <>
              {page === "home" && <HomePage nations={data.nations} news={data.news} actions={data.actions} wars={data.wars} />}
              {page === "nations" && <NationsPage nations={data.nations} posts={data.posts} actions={data.actions} wars={data.wars} alliances={data.alliances} allianceMembers={data.allianceMembers} {...commonProps} onRefresh={fetchAll} />}
              {page === "rp" && <RPBoardPage posts={data.posts} nations={data.nations} {...commonProps} onRefresh={fetchAll} />}
              {page === "actions" && <ActionsPage actions={data.actions} nations={data.nations} {...commonProps} onRefresh={fetchAll} />}
              {page === "diplomacy" && <DiplomacyPage nations={data.nations} {...commonProps} onRefresh={fetchAll} />}
              {page === "economy" && <EconomyPage nations={data.nations} {...commonProps} onRefresh={fetchAll} />}
              {page === "assembly" && <AssemblyPage nations={data.nations} {...commonProps} onRefresh={fetchAll} />}
              {page === "settings" && <SettingsPage profile={profile} onProfileUpdate={setProfile} />}
              {page === "wars" && !allianceViewId && <WarsPage wars={data.wars} alliances={data.alliances} allianceMembers={data.allianceMembers} warParticipants={data.warParticipants} nations={data.nations} profiles={data.profiles} {...commonProps} onRefresh={fetchAll} onViewAlliance={setAllianceViewId} mode="wars" />}
              {page === "alliances" && !allianceViewId && <WarsPage wars={data.wars} alliances={data.alliances} allianceMembers={data.allianceMembers} warParticipants={data.warParticipants} nations={data.nations} profiles={data.profiles} {...commonProps} onRefresh={fetchAll} onViewAlliance={setAllianceViewId} mode="alliances" />}
              {(page === "wars" || page === "alliances") && allianceViewId && (
                <AllianceProfile
                  alliance={data.alliances.find(a => a.id === allianceViewId)}
                  allianceMembers={data.allianceMembers} nations={data.nations} wars={data.wars} warParticipants={data.warParticipants} profiles={data.profiles}
                  {...commonProps} onBack={() => setAllianceViewId(null)} onRefresh={fetchAll}
                />
              )}
              {page === "news" && <NewsPage news={data.news} {...commonProps} onRefresh={fetchAll} />}
              {page === "mechanics" && <GameMechanicsPage navigate={navigate} />}
              {page === "leaderboards" && <LeaderboardsPage nations={data.nations} />}
              {page === "changelog" && <ChangelogPage />}
              {page === "profile" && publicProfileId && <PublicProfilePage viewedProfile={data.profiles.find(item => item.id === publicProfileId)} nations={data.nations} posts={data.posts} actions={data.actions} onBack={() => navigate("forums")} />}
              {page === "profile" && !publicProfileId && user && profile && <ProfilePage profile={profile} profiles={data.profiles} userNation={userNation} onProfileUpdate={setProfile} onViewProfile={viewProfile} />}
              {page === "forums" && <ForumsPage boards={data.boards} route={forumRoute} onRouteChange={setForumRoute} nations={data.nations} {...commonProps} onRefresh={fetchAll} onRequireAuth={() => navigate("auth")} onViewProfile={viewProfile} />}
              {page === "auth" && (
                <AuthPage setupRequired={setupRequired} onAuth={(u, p) => {
                  setUser(u); if (p) setProfile(p); else import("./lib/uiUtils").then(({ ensureProfile }) =>
                    ensureProfile(u).then(next => { if (next) setProfile(next); }).catch(() => {})
                  );
                  fetchAll(); navigate("forums");
                }} />
              )}
              {page === "admin" && loreTeam && <AdminPanel nations={data.nations} profiles={data.profiles} {...commonProps} onRefresh={fetchAll} />}
              {page === "nation" && nationViewId && <NationProfile nation={data.nations.find(n => n.id === nationViewId)} posts={data.posts} actions={data.actions} wars={data.wars} alliances={data.alliances} allianceMembers={data.allianceMembers} nations={data.nations} {...commonProps} onBack={() => navigate("forums")} onRefresh={fetchAll} />}
            </>
        }
      </main>

      <footer className="app-footer" style={{ borderTop: "1px solid rgba(20,96,184,0.22)", padding: "1rem", textAlign: "center", fontSize: 10, color: "#6f85a8", letterSpacing: "0.15em", textTransform: "uppercase" }}>
        Nationwheel - Geopolitical Roleplay World - Season 2
        {gameState && <span style={{ marginLeft: "1rem", color: "#d4af37" }}>{fmtGameDate(gameState.game_day, gameState.game_year)}</span>}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <DataProvider>
        <UserProvider>
          <AppShell />
          <GlobalStyles />
        </UserProvider>
      </DataProvider>
    </ToastProvider>
  );
}

function GlobalStyles() {
  return <style>{`
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
      .app-header{height:auto!important;min-height:auto!important;padding:0.5rem 0.6rem 0.5rem!important;display:grid!important;grid-template-columns:1fr auto!important;grid-template-areas:"brand tools" "nav nav"!important;gap:0.4rem!important;align-items:center!important;}
      .staff-tools{top:96px!important;}
      .brand{grid-area:brand;min-width:0;}
      .brand-logo{width:30px!important;height:30px!important;}
      .brand-name{font-size:12px!important;letter-spacing:0.04em!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .user-tools{grid-area:tools;gap:0.3rem!important;max-width:48vw;overflow:hidden;justify-content:flex-end;}
      .user-tools > span{display:none!important;}
      .user-tools button{padding:5px 7px!important;font-size:11px!important;min-height:34px!important;}
      .app-nav{grid-area:nav;width:100%;gap:0.3rem!important;padding:0;overflow-x:auto!important;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;flex-wrap:nowrap!important;}
      .nav-button{min-height:36px!important;padding:6px 10px!important;font-size:11.5px!important;border:1px solid rgba(20,96,184,0.26)!important;scroll-snap-align:start;white-space:nowrap;}
      .app-main{padding:0.75rem 0.6rem 1rem!important;max-width:none!important;}
      .app-footer{font-size:9px!important;letter-spacing:0.08em!important;padding:0.85rem 0.75rem!important;}
      .board-card{padding:0.85rem!important;}
      .board-card-row{align-items:flex-start!important;gap:0.6rem!important;}
      .post-card{padding:0.85rem!important;}
      .forum-composer-card{padding:0.85rem!important;}
      .forum-composer-textarea{min-height:180px!important;}
      input,textarea,select{font-size:16px!important;}
      button{min-height:44px!important;}
      .nav-button{min-height:36px!important;}
      .rich-post{font-size:13px!important;line-height:1.7!important;}
      .card-grid{grid-template-columns:1fr!important;}
      h2{font-size:18px!important;}
      h3{font-size:15px!important;}
      .tag-list{gap:0.3rem!important;}
      .tag-list button,.tag-list span{padding:5px 9px!important;font-size:11px!important;}
      .content-table{font-size:12px!important;}
      .content-table td,.content-table th{padding:6px 8px!important;}
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
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  `}</style>;
}

function NavDropdown({ group, page, onNavigate }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const reposition = useCallback(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    reposition();
    const close = e => {
      const inBtn = btnRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inBtn && !inMenu) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);
  const menuStyle = useMemo(() => {
    let left = pos.left, top = pos.top;
    const menuW = 160, menuH = group.items.length * 40 + 12;
    if (left + menuW + 8 > window.innerWidth) left = window.innerWidth - menuW - 8;
    if (left < 8) left = 8;
    if (top + menuH + 8 > window.innerHeight) top = window.innerHeight - menuH - 8;
    if (top < 8) top = 8;
    return { position: "fixed", top, left, zIndex: 9999, background: "#0b1422", border: "1px solid rgba(78,128,190,0.3)", borderRadius: 6, boxShadow: "0 8px 30px rgba(0,0,0,0.5)", minWidth: 140, padding: "4px", maxHeight: `calc(100vh - ${top}px - 8px)`, overflowY: "auto" };
  }, [pos, group]);
  const active = group.items.some(n => page === n.id);
  return (
    <div style={{ display: "inline-flex" }}>
      <button ref={btnRef} className="nav-button" onClick={() => setOpen(!open)} style={{ background: active ? "rgba(20,96,184,0.16)" : "transparent", color: active ? "#f6c132" : "#8aa4c9", border: "none", borderRadius: 5, padding: "5px 9px", cursor: "pointer", fontSize: 11.5, fontWeight: active ? 800 : 600, whiteSpace: "nowrap", transition: "all 0.15s", fontFamily: "inherit" }}>
        {group.label} <span style={{ fontSize: 9, marginLeft: 2 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && createPortal(
        <div ref={menuRef} style={menuStyle}>
          {group.items.map(n => (
            <button key={n.id} onClick={() => { setOpen(false); onNavigate(n.id); }} style={{ display: "block", width: "100%", textAlign: "left", background: page === n.id ? "rgba(20,96,184,0.16)" : "transparent", color: page === n.id ? "#f6c132" : "#8aa4c9", border: "none", borderRadius: 4, padding: "7px 12px", cursor: "pointer", fontSize: 12, fontWeight: page === n.id ? 700 : 500, fontFamily: "inherit", whiteSpace: "nowrap", transition: "background 0.12s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(78,128,190,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = page === n.id ? "rgba(20,96,184,0.16)" : "transparent"}>
              {n.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
