import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── CONFIG ───────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_CONFIGURED = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY !== "replace_with_your_supabase_anon_or_publishable_key"
);
const supabase = SUPABASE_CONFIGURED ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const LOGO_SRC = "/nationwheel_logo.jpg";

// ─── CONSTANTS ────────────────────────────────────────────────────
const ACTION_SIZES = {
  small:  { days: 1,  label: "Small",  color: "#4caf50" },
  medium: { days: 3,  label: "Medium", color: "#f39c12" },
  large:  { days: 7,  label: "Large",  color: "#e67e22" },
  major:  { days: 14, label: "Major",  color: "#e74c3c" },
  epic:   { days: 21, label: "Epic",   color: "#9b59b6" },
};
const STATUS_COL = { pending:"#7f8c8d", active:"#3498db", complete:"#2ecc71", cancelled:"#e74c3c" };
const WAR_COL    = { active:"#e74c3c", frozen:"#3498db", peace:"#2ecc71" };
const POST_TYPES = ["Dispatch","Communiqué","Declaration","Intelligence","Propaganda","Treaty Proposal","Ultimatum"];
const POST_COLS  = { Dispatch:"#3498db", Communiqué:"#9b59b6", Declaration:"#d4af37", Intelligence:"#e67e22", Propaganda:"#e74c3c", "Treaty Proposal":"#2ecc71", Ultimatum:"#c0392b" };
const NEWS_CATS  = ["announcement","war","diplomacy","economy","lore","community"];
const NEWS_COL   = { announcement:"#d4af37", war:"#e74c3c", diplomacy:"#3498db", economy:"#2ecc71", lore:"#9b59b6", community:"#e67e22" };

const FORUM_BOARDS = [
  { slug:"general",           name:"General",              desc:"Cross-world discussion and community chat",              icon:"", sort:1  },
  { slug:"diplomacy",         name:"Diplomacy",            desc:"Treaties, negotiations, and alliances",                  icon:"", sort:2  },
  { slug:"canon-actions",     name:"Canon Actions",        desc:"Action discussion, outcomes, and lore clarification",    icon:"", sort:3  },
  { slug:"war-room",          name:"War Room",             desc:"Military strategy, war declarations, and battle reports", icon:"", sort:4  },
  { slug:"intelligence",      name:"Intelligence",         desc:"Espionage, leaks, and covert operations",                icon:"", sort:5  },
  { slug:"trade",             name:"Trade",                desc:"Economic deals, markets, and logistics",                 icon:"", sort:6  },
  { slug:"propaganda",        name:"Propaganda",           desc:"State media, narratives, and public messaging",          icon:"", sort:7  },
  { slug:"cultural-exchange", name:"Cultural Exchange",    desc:"Arts, religion, culture, and soft power",                icon:"", sort:8  },
  { slug:"newsroom",          name:"Newsroom",             desc:"Reports, reactions, and world event discussion",         icon:"", sort:9  },
  { slug:"lore-library",      name:"Lore Library",         desc:"World lore, canon rules, factions, and timeline",       icon:"", sort:10 },
  { slug:"nation-introductions", name:"Nation Introductions", desc:"Introduce your nation, its history and culture",     icon:"", sort:11 },
  { slug:"season-archives",   name:"Season Archives",      desc:"Completed seasons, outcomes, and historical records",    icon:"", sort:12 },
  { slug:"support",           name:"Support",              desc:"Questions, onboarding, and site help",                   icon:"", sort:13 },
];

// ─── SQL ──────────────────────────────────────────────────────────
const SQL = `-- Run once in Supabase SQL Editor

-- Enable storage
insert into storage.buckets (id, name, public) values ('flags', 'flags', true) on conflict do nothing;
drop policy if exists "Public flag read" on storage.objects;
drop policy if exists "Auth flag upload" on storage.objects;
drop policy if exists "Auth flag update" on storage.objects;
create policy "Public flag read" on storage.objects for select using (bucket_id = 'flags');
create policy "Auth flag upload" on storage.objects for insert with check (bucket_id = 'flags' AND auth.role() = 'authenticated');
create policy "Auth flag update" on storage.objects for update using (bucket_id = 'flags' AND auth.role() = 'authenticated');

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  role text default 'player',
  nation_id uuid,
  created_at timestamptz default now()
);

create table if not exists nations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  government text, ideology text,
  population bigint, gdp_usd bigint, land_km2 bigint,
  army_rank int default 0, hdi numeric(3,2),
  economy text, bio text,
  diplomatic_status text, bloc text,
  tiktok_username text,
  flag_url text,
  flag_color1 text default '#c0392b',
  flag_color2 text default '#f39c12',
  owner_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

do $$ begin
  alter table profiles add constraint fk_nation foreign key (nation_id) references nations(id) on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists rp_posts (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid references nations(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  post_type text not null,
  title text not null,
  body text not null,
  target_nation_id uuid references nations(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists canon_actions (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid references nations(id) on delete cascade,
  submitted_by uuid references profiles(id) on delete cascade,
  title text not null, description text not null,
  tiktok_comment text,
  size text default 'medium',
  status text default 'pending',
  started_at timestamptz, estimated_days int,
  completed_at timestamptz, lore_notes text,
  created_at timestamptz default now()
);

create table if not exists action_updates (
  id uuid primary key default gen_random_uuid(),
  action_id uuid references canon_actions(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists wars (
  id uuid primary key default gen_random_uuid(),
  aggressor_id uuid references nations(id) on delete cascade,
  defender_id uuid references nations(id) on delete cascade,
  name text, status text default 'active', casus_belli text, outcome text,
  started_at timestamptz default now(), ended_at timestamptz
);

create table if not exists alliances (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text,
  type text default 'alliance', status text default 'active',
  created_at timestamptz default now()
);

create table if not exists alliance_members (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid references alliances(id) on delete cascade,
  nation_id uuid references nations(id) on delete cascade
);

create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade,
  title text not null, body text not null,
  category text default 'announcement', pinned boolean default false,
  created_at timestamptz default now()
);

create table if not exists forum_boards (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text,
  slug text unique not null, icon text, sort_order int default 0
);

create table if not exists forum_threads (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references forum_boards(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  nation_id uuid references nations(id) on delete set null,
  title text not null, pinned boolean default false, locked boolean default false,
  created_at timestamptz default now()
);

create table if not exists forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references forum_threads(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  nation_id uuid references nations(id) on delete set null,
  body text not null,
  created_at timestamptz default now()
);

-- RLS (explicit so Supabase can see it before you expose the API)
alter table profiles enable row level security;
alter table nations enable row level security;
alter table rp_posts enable row level security;
alter table canon_actions enable row level security;
alter table action_updates enable row level security;
alter table wars enable row level security;
alter table alliances enable row level security;
alter table alliance_members enable row level security;
alter table news enable row level security;
alter table forum_boards enable row level security;
alter table forum_threads enable row level security;
alter table forum_posts enable row level security;

drop policy if exists "pub_read" on profiles;
drop policy if exists "pub_read" on nations;
drop policy if exists "pub_read" on rp_posts;
drop policy if exists "pub_read" on canon_actions;
drop policy if exists "pub_read" on action_updates;
drop policy if exists "pub_read" on wars;
drop policy if exists "pub_read" on alliances;
drop policy if exists "pub_read" on alliance_members;
drop policy if exists "pub_read" on news;
drop policy if exists "pub_read" on forum_boards;
drop policy if exists "pub_read" on forum_threads;
drop policy if exists "pub_read" on forum_posts;
create policy "pub_read" on profiles for select using (true);
create policy "pub_read" on nations for select using (true);
create policy "pub_read" on rp_posts for select using (true);
create policy "pub_read" on canon_actions for select using (true);
create policy "pub_read" on action_updates for select using (true);
create policy "pub_read" on wars for select using (true);
create policy "pub_read" on alliances for select using (true);
create policy "pub_read" on alliance_members for select using (true);
create policy "pub_read" on news for select using (true);
create policy "pub_read" on forum_boards for select using (true);
create policy "pub_read" on forum_threads for select using (true);
create policy "pub_read" on forum_posts for select using (true);

drop policy if exists "own_insert" on profiles;
drop policy if exists "own_update" on profiles;
drop policy if exists "auth_insert_rp" on rp_posts;
drop policy if exists "auth_insert_ca" on canon_actions;
drop policy if exists "auth_insert_au" on action_updates;
drop policy if exists "auth_insert_ft" on forum_threads;
drop policy if exists "auth_insert_fp" on forum_posts;
create policy "own_insert" on profiles for insert with check (auth.uid()=id);
create policy "own_update" on profiles for update using (auth.uid()=id);
create policy "auth_insert_rp" on rp_posts for insert with check (auth.uid()=author_id);
create policy "auth_insert_ca" on canon_actions for insert with check (auth.uid()=submitted_by);
create policy "auth_insert_au" on action_updates for insert with check (auth.uid()=author_id);
create policy "auth_insert_ft" on forum_threads for insert with check (auth.uid()=author_id);
create policy "auth_insert_fp" on forum_posts for insert with check (auth.uid()=author_id);

-- Seed forum boards
insert into forum_boards (name,description,slug,icon,sort_order) values
('General','Cross-world discussion and community chat','general','',1),
('Diplomacy','Treaties, negotiations, and alliances','diplomacy','',2),
('Canon Actions','Action discussion and lore clarification','canon-actions','',3),
('War Room','Military strategy and battle reports','war-room','',4),
('Intelligence','Espionage, leaks, and covert operations','intelligence','',5),
('Trade','Economic deals, markets, and logistics','trade','',6),
('Propaganda','State media and public messaging','propaganda','',7),
('Cultural Exchange','Arts, religion, and soft power','cultural-exchange','',8),
('Newsroom','Reports and world event discussion','newsroom','',9),
('Lore Library','World lore, canon rules, and timeline','lore-library','',10),
('Nation Introductions','Introduce your nation to the world','nation-introductions','',11),
('Season Archives','Completed seasons and historical records','season-archives','',12),
('Support','Questions, onboarding, and site help','support','',13)
on conflict (slug) do update set icon = excluded.icon;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and role = 'admin');
$$;

drop policy if exists "admin_manage_profiles" on profiles;
drop policy if exists "admin_manage_nations" on nations;
drop policy if exists "admin_manage_news" on news;
drop policy if exists "admin_manage_forum_boards" on forum_boards;
create policy "admin_manage_profiles" on profiles for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin_manage_nations" on nations for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin_manage_news" on news for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin_manage_forum_boards" on forum_boards for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

insert into profiles (id, username, role)
select u.id, split_part(u.email, '@', 1), 'admin'
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id)
order by u.created_at
limit 1
on conflict (id) do update set role = 'admin';

update profiles
set role = 'admin'
where id = (
  select id from profiles order by created_at nulls last, username limit 1
);`;

// ─── HELPERS ──────────────────────────────────────────────────────
const timeAgo = ts => {
  if (!ts) return "";
  const d = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
};
const fmtGDP = n => { if (!n) return "-"; if (n>=1e12) return `$${(n/1e12).toFixed(1)}T`; if (n>=1e9) return `$${(n/1e9).toFixed(1)}B`; if (n>=1e6) return `$${(n/1e6).toFixed(0)}M`; return `$${n}`; };
const fmtPop = n => { if (!n) return "-"; if (n>=1e9) return `${(n/1e9).toFixed(2)}B`; if (n>=1e6) return `${(n/1e6).toFixed(0)}M`; if (n>=1e3) return `${(n/1e3).toFixed(0)}K`; return `${n}`; };
const fmtLand = n => n ? `${Number(n).toLocaleString()} km2` : "-";
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const profileName = (user, preferred) => {
  const base = (preferred || user?.email?.split("@")[0] || "player")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return base || `player_${user?.id?.slice(0, 6) || Date.now()}`;
};
const ensureProfile = async (user, preferredUsername) => {
  if (!user || !supabase) return null;
  const existing = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (existing.data) return existing.data;
  if (existing.error && existing.error.code !== "PGRST116") throw existing.error;
  const username = profileName(user, preferredUsername);
  const inserted = await supabase.from("profiles").insert({ id:user.id, username }).select("*").single();
  if (inserted.error && inserted.error.code === "23505") {
    const fallback = `${username}_${user.id.slice(0, 6)}`.slice(0, 28);
    const retry = await supabase.from("profiles").insert({ id:user.id, username:fallback }).select("*").single();
    if (retry.error) throw retry.error;
    return retry.data;
  }
  if (inserted.error) throw inserted.error;
  return inserted.data;
};

// ─── STYLES ───────────────────────────────────────────────────────
const inp = { background:"rgba(255,255,255,0.055)", border:"1px solid rgba(21,96,181,0.42)", borderRadius:6, padding:"11px 13px", color:"#fff8e6", fontSize:16, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };
const ta  = { ...inp, resize:"vertical", minHeight:80 };
const mkBtn = (v="gold") => ({
  background: v==="gold"?"#f6c132": v==="red"?"#b91616": v==="blue"?"#145bb0": v==="green"?"#1f8f43":"rgba(255,255,255,0.055)",
  color: v==="gold"?"#050505":"#fff8e6",
  border: v==="ghost"?"1px solid rgba(246,193,50,0.24)":"none",
  borderRadius:6, padding:"9px 14px", cursor:"pointer", fontWeight:700, fontSize:13,
  letterSpacing:"0.04em", fontFamily:"inherit", transition:"opacity 0.15s, transform 0.1s",
  whiteSpace:"nowrap",
});
const card = { background:"linear-gradient(180deg,rgba(15,18,24,0.96),rgba(7,8,10,0.94))", border:"1px solid rgba(246,193,50,0.14)", borderRadius:10, padding:"1.25rem", boxShadow:"0 18px 45px rgba(0,0,0,0.35)" };

// ─── FLAG COMPONENT ───────────────────────────────────────────────
const Flag = ({ nation, size = 36 }) => {
  if (nation?.flag_url) {
    return (
      <img src={nation.flag_url} alt={nation.name}
        style={{ width:size, height:Math.round(size*0.65), objectFit:"cover", borderRadius:3, border:"1px solid rgba(255,255,255,0.1)", flexShrink:0 }} />
    );
  }
  const c1 = nation?.flag_color1||"#c0392b", c2 = nation?.flag_color2||"#f39c12";
  const ab = nation?.name ? nation.name.slice(0,2).toUpperCase() : "??";
  return (
    <div style={{ width:size, height:Math.round(size*0.65), flexShrink:0, background:`linear-gradient(135deg,${c1} 50%,${c2} 50%)`, borderRadius:3, border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.22, fontWeight:900, color:"#fff", textShadow:"0 1px 3px rgba(0,0,0,0.8)", userSelect:"none", letterSpacing:1 }}>{ab}</div>
  );
};

const NationPill = ({ nation }) => nation ? (
  <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.18)", borderRadius:4, padding:"2px 8px 2px 4px" }}>
    <Flag nation={nation} size={16} />
    <span style={{ fontSize:11, color:"#d4af37", fontWeight:700 }}>{nation.name}</span>
  </span>
) : null;

// ─── SETUP MODAL ──────────────────────────────────────────────────
const SetupModal = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div style={{ ...card, maxWidth:700, width:"100%", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
          <h2 style={{ margin:0, color:"#f6c132", fontFamily:"var(--display)" }}>Supabase Setup</h2>
          <button onClick={onClose} style={{ ...mkBtn("ghost"), padding:"4px 10px" }}>Close</button>
        </div>
        <ol style={{ color:"#d8c890", lineHeight:2.2, paddingLeft:"1.2rem", fontSize:13 }}>
          <li>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{color:"#d4af37"}}>supabase.com</a>, then create a free project</li>
          <li>Settings, API, then copy <strong style={{color:"#f7f0dc"}}>Project URL</strong> and <strong style={{color:"#f7f0dc"}}>anon key</strong></li>
          <li>Paste into <code style={{color:"#d4af37",fontSize:11}}>VITE_SUPABASE_URL</code> / <code style={{color:"#d4af37",fontSize:11}}>VITE_SUPABASE_ANON_KEY</code> in <code style={{color:"#d4af37",fontSize:11}}>.env.local</code></li>
          <li>SQL Editor &gt; paste SQL below &gt; Run. The RLS warning is expected for table creation; this SQL explicitly enables RLS and adds policies before the app uses the tables.</li>
          <li>Authentication, Providers, then enable <strong style={{color:"#f7f0dc"}}>Email</strong></li>
          <li>Storage: check the <strong style={{color:"#f7f0dc"}}>flags</strong> bucket was created, or create it manually and set it to Public</li>
          <li>The SQL promotes the first registered user to <code style={{color:"#d4af37",fontSize:11}}>admin</code></li>
          <li>Deploy to <a href="https://vercel.com" target="_blank" rel="noreferrer" style={{color:"#d4af37"}}>Vercel</a> or <a href="https://netlify.com" target="_blank" rel="noreferrer" style={{color:"#d4af37"}}>Netlify</a> (both free)</li>
        </ol>
        <div style={{ position:"relative", marginTop:"1rem" }}>
          <pre style={{ background:"#030405", border:"1px solid rgba(20,96,184,0.32)", borderRadius:8, padding:"1rem", fontSize:10.5, overflowX:"auto", color:"#99dca7", maxHeight:260, lineHeight:1.7 }}>{SQL}</pre>
          <button onClick={()=>{navigator.clipboard.writeText(SQL);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{ ...mkBtn("gold"), position:"absolute", top:8, right:8, fontSize:11 }}>{copied?"Copied!":"Copy SQL"}</button>
        </div>
        <button onClick={onClose} style={{ ...mkBtn(), marginTop:"1.25rem" }}>Got it</button>
      </div>
    </div>
  );
};

// ─── AUTH ─────────────────────────────────────────────────────────
const Auth = ({ onAuth, setupRequired }) => {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [username,setUsername]=useState("");
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const [showSetup,setShowSetup]=useState(false);

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode==="login") {
        const {data,error} = await supabase.auth.signInWithPassword({email,password:pw});
        if (error) throw error;
        const nextProfile = await ensureProfile(data.user);
        onAuth(data.user, nextProfile);
      } else {
        const {data,error} = await supabase.auth.signUp({email,password:pw});
        if (error) throw error;
        if (data.session?.user) {
          const nextProfile = await ensureProfile(data.session.user, username);
          onAuth(data.session.user, nextProfile);
          return;
        }
        setErr("Account created - check your email, then sign in."); setMode("login");
      }
    } catch(e){
      const msg = e.message === "email rate limit exceeded"
        ? "Supabase email limit hit. Wait a bit, or disable email confirmations in Supabase Auth settings while testing."
        : e.message;
      setErr(msg);
    }
    setLoading(false);
  };

  return (
    <>
      {showSetup && <SetupModal onClose={()=>setShowSetup(false)} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cinzel:wght@700;900&display=swap');
        :root { --display:'Inter',Arial,sans-serif; --brand:'Cinzel',Georgia,serif; --body:'Inter',Arial,sans-serif; }
        *,*::before,*::after{box-sizing:border-box;}
        body {
          font-family: var(--body);
          background: #020305;
          background-image:
            radial-gradient(circle at 18% 12%,rgba(225,29,29,0.18) 0%,transparent 30%),
            radial-gradient(circle at 50% 0%,rgba(246,193,50,0.12) 0%,transparent 34%),
            radial-gradient(circle at 82% 18%,rgba(20,96,184,0.18) 0%,transparent 32%),
            radial-gradient(circle at 24% 88%,rgba(31,143,67,0.12) 0%,transparent 30%);
          color:#fff8e6; margin:0;
        }
        input::placeholder,textarea::placeholder{color:#7184a5;}
        input:focus,textarea:focus,select:focus{outline:none;border-color:rgba(246,193,50,0.72)!important;box-shadow:0 0 0 3px rgba(20,96,184,0.16);}
        select option{background:#05070b;color:#fff8e6;}
        button:hover{opacity:0.8;}
        button:active{transform:scale(0.97);}
        button,input,textarea,select{font:inherit;}
        button{min-height:40px;}
        .auth-shell{min-height:100svh!important;}
        @media (max-width: 560px) {
          .auth-shell{align-items:flex-start!important;padding:1.25rem 0.85rem!important;}
          .auth-panel{max-width:none!important;}
          .auth-logo{width:118px!important;height:118px!important;}
        }
      `}</style>
      <div className="auth-shell" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
        <div className="auth-panel" style={{ width:"100%", maxWidth:400 }}>
          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <img className="auth-logo" src={LOGO_SRC} alt="Nationwheel" style={{ width:150, height:150, objectFit:"cover", borderRadius:"50%", border:"2px solid rgba(246,193,50,0.38)", boxShadow:"0 0 0 6px rgba(20,96,184,0.14), 0 22px 55px rgba(0,0,0,0.55)" }} />
            <h1 style={{ fontFamily:"var(--brand)", fontSize:"clamp(2rem,6vw,3rem)", color:"#fff8e6", margin:"0.9rem 0 0", letterSpacing:"0.08em", textShadow:"0 0 34px rgba(246,193,50,0.22)" }}>NATIONWHEEL</h1>
            <p style={{ color:"#f6c132", marginTop:"0.35rem", fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase" }}>Geopolitical Roleplay World</p>
          </div>
          <div style={{ ...card, border:"1px solid rgba(246,193,50,0.22)" }}>
            {setupRequired && (
              <div style={{ border:"1px solid rgba(225,29,29,0.45)", background:"rgba(225,29,29,0.12)", color:"#ffd7d7", borderRadius:6, padding:"0.75rem", marginBottom:"1rem", fontSize:12, lineHeight:1.5 }}>
                Database setup is not finished. Open the Supabase setup guide below, copy the SQL, run it in Supabase, then refresh this page.
              </div>
            )}
            <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.25rem" }}>
              {["login","signup"].map(m=>(
                <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"8px", borderRadius:6, cursor:"pointer", fontWeight:800, fontSize:12, letterSpacing:"0.06em", border:mode===m?"none":"1px solid rgba(20,96,184,0.36)", background:mode===m?"#f6c132":"rgba(255,255,255,0.035)", color:mode===m?"#050505":"#fff8e6", fontFamily:"inherit" }}>
                  {m==="login"?"SIGN IN":"REGISTER"}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              {mode==="signup" && <input placeholder="Choose a username" value={username} onChange={e=>setUsername(e.target.value)} style={inp} />}
              <input placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} style={inp} />
              <input placeholder="Password" type="password" value={pw} onChange={e=>setPw(e.target.value)} style={inp} onKeyDown={e=>e.key==="Enter"&&submit()} />
              {err && <p style={{ color:err.startsWith("Account created")?"#2ecc71":"#e74c3c", fontSize:12, margin:0 }}>{err}</p>}
              <button onClick={submit} disabled={loading} style={{ ...mkBtn(), marginTop:"0.4rem", padding:"10px", fontSize:13, letterSpacing:"0.08em" }}>
                {loading?"Loading":mode==="login"?"ENTER THE WORLD":"JOIN THE WORLD"}
              </button>
            </div>
          </div>
          <button onClick={()=>setShowSetup(true)} style={{ marginTop:"0.75rem", ...mkBtn("ghost"), width:"100%", fontSize:11 }}>First time? Supabase setup guide</button>
        </div>
      </div>
    </>
  );
};

// ─── FLAG UPLOAD ──────────────────────────────────────────────────
const FlagUploader = ({ nationId, currentUrl, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const ref = useRef();

  const upload = async (file) => {
    if (!file || !nationId) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${nationId}.${ext}`;
    const { error } = await supabase.storage.from("flags").upload(path, file, { upsert: true, contentType: file.type });
    if (!error) {
      const { data } = supabase.storage.from("flags").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      await supabase.from("nations").update({ flag_url: url }).eq("id", nationId);
      onUploaded(url);
    }
    setUploading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
      {currentUrl && <img src={currentUrl} alt="flag" style={{ width:80, height:52, objectFit:"cover", borderRadius:4, border:"1px solid rgba(212,175,55,0.2)" }} />}
      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>upload(e.target.files[0])} />
      <button onClick={()=>ref.current.click()} style={{ ...mkBtn("ghost"), fontSize:11, alignSelf:"flex-start" }}>
        {uploading?"Uploading":"Upload Flag Image"}
      </button>
      <p style={{ margin:0, fontSize:10, color:"#8fa0bd" }}>PNG, JPG, SVG - recommended 3:2 ratio</p>
    </div>
  );
};

// ─── HOME ─────────────────────────────────────────────────────────
const Home = ({ nations, news, actions, wars }) => {
  const topGDP = [...nations].sort((a,b)=>(b.gdp_usd||0)-(a.gdp_usd||0)).slice(0,5);
  const activeWars = wars.filter(w=>w.status==="active");
  const activeActions = actions.filter(a=>a.status==="active").slice(0,5);
  const recentNews = news.slice(0,4);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
      {/* Hero bar */}
      <div style={{ ...card, background:"linear-gradient(120deg,rgba(14,10,4,0.98),rgba(26,18,6,0.98))", border:"1px solid rgba(212,175,55,0.25)", padding:"1.75rem 2rem", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-60, right:-60, width:220, height:220, background:"radial-gradient(circle,rgba(212,175,55,0.07),transparent 70%)", pointerEvents:"none", borderRadius:"50%" }} />
        <div style={{ display:"flex", gap:"2.5rem", flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ flex:1, minWidth:180 }}>
            <p style={{ margin:"0 0 0.3rem", fontSize:11, letterSpacing:"0.12em", color:"#8fa0bd", textTransform:"uppercase" }}>Season 1 - Living World</p>
            <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:"clamp(1.4rem,3vw,2rem)" }}>World at a Glance</h2>
          </div>
          <div style={{ display:"flex", gap:"2rem", flexWrap:"wrap" }}>
            {[{l:"Nations",v:nations.length},{l:"Active Wars",v:activeWars.length,c:activeWars.length>0?"#e74c3c":undefined},{l:"Active Actions",v:activeActions.length}].map(s=>(
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"var(--display)", fontSize:"clamp(1.8rem,3.5vw,2.4rem)", color:s.c||"#d4af37", lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", marginTop:3, textTransform:"uppercase" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:"1rem" }}>
        <Section title="Latest News" empty="No news yet.">
          {recentNews.map(n=>(
            <div key={n.id} style={{ padding:"0.65rem 0", borderBottom:"1px solid rgba(255,215,0,0.05)" }}>
              <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                <span style={{ fontSize:10, fontWeight:800, color:"#0a0806", background:NEWS_COL[n.category]||"#d4af37", borderRadius:3, padding:"1px 6px", letterSpacing:"0.04em" }}>{n.category?.toUpperCase()}</span>
                <span style={{ fontSize:11, color:"#8fa0bd" }}>{timeAgo(n.created_at)}</span>
              </div>
              <div style={{ fontSize:13, color:"#f0dc8a", fontWeight:700, marginTop:3 }}>{n.title}</div>
            </div>
          ))}
        </Section>

        <Section title="Active Actions" empty="No active actions.">
          {activeActions.map(a=>(
            <div key={a.id} style={{ padding:"0.6rem 0", borderBottom:"1px solid rgba(255,215,0,0.05)", display:"flex", gap:"0.5rem", alignItems:"center" }}>
              <span style={{ fontSize:10, fontWeight:800, color:"#0a0806", background:ACTION_SIZES[a.size]?.color||"#d4af37", borderRadius:3, padding:"1px 6px" }}>{a.size?.toUpperCase()}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:"#f0dc8a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</div>
                <div style={{ fontSize:11, color:"#8fa0bd" }}>{a.nations?.name}</div>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Active Conflicts" empty="The world is at peace.">
          {activeWars.map(w=>(
            <div key={w.id} style={{ padding:"0.6rem 0", borderBottom:"1px solid rgba(255,215,0,0.05)", fontSize:13 }}>
              <span style={{ color:"#e74c3c", fontWeight:700 }}>{w.aggressor?.name||"?"}</span>
              <span style={{ color:"#8fa0bd", margin:"0 0.5rem" }}>vs</span>
              <span style={{ color:"#f0dc8a", fontWeight:700 }}>{w.defender?.name||"?"}</span>
              {w.name && <div style={{ fontSize:11, color:"#a9b7cf", fontStyle:"italic" }}>"{w.name}"</div>}
            </div>
          ))}
        </Section>

        <Section title="Top GDP Nations" empty="No nation data.">
          {topGDP.map((n,i)=>(
            <div key={n.id} style={{ display:"flex", gap:"0.75rem", alignItems:"center", padding:"0.45rem 0", borderBottom:"1px solid rgba(255,215,0,0.05)" }}>
              <span style={{ fontFamily:"var(--display)", color:i===0?"#d4af37":i<3?"#d8c890":"#8493ad", fontSize:13, width:20, textAlign:"center" }}>#{i+1}</span>
              <Flag nation={n} size={24} />
              <span style={{ flex:1, fontSize:13, color:"#f0dc8a" }}>{n.name}</span>
              <span style={{ fontSize:12, color:"#d4af37", fontWeight:700 }}>{fmtGDP(n.gdp_usd)}</span>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
};

const Section = ({ title, children, empty }) => (
  <div style={card}>
    <h3 style={{ margin:"0 0 0.9rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14, letterSpacing:"0.05em" }}>{title}</h3>
    {children && Array.isArray(children) && children.length === 0
      ? <p style={{ color:"#8493ad", fontSize:13, margin:0, fontStyle:"italic" }}>{empty}</p>
      : children || <p style={{ color:"#8493ad", fontSize:13, margin:0, fontStyle:"italic" }}>{empty}</p>}
  </div>
);

// ─── NATION PROFILE PAGE ──────────────────────────────────────────
const NationProfile = ({ nation, posts, actions, wars, alliances, allianceMembers, nations, onBack, profile, userNation, isMod, isAdmin, onRefresh }) => {
  const [tab, setTab] = useState("overview");
  const nPosts = posts.filter(p => p.nation_id === nation.id);
  const nActions = actions.filter(a => a.nation_id === nation.id);
  const nWars = wars.filter(w => w.aggressor_id === nation.id || w.defender_id === nation.id);
  const nAllyIds = allianceMembers.filter(m => m.nation_id === nation.id).map(m => m.alliance_id);
  const nAlliances = alliances.filter(a => nAllyIds.includes(a.id));
  const isOwner = profile?.nation_id === nation.id;

  const stats = [
    ["Population", fmtPop(nation.population)],
    ["GDP", fmtGDP(nation.gdp_usd)],
    ["Land Area", fmtLand(nation.land_km2)],
    ["Army Rank", nation.army_rank != null ? `${nation.army_rank}/11` : "-"],
    ["HDI", nation.hdi || "-"],
    ["Economy", nation.economy || "-"],
    ["Bloc", nation.bloc || "None"],
    ["Status", nation.diplomatic_status || "-"],
  ];

  return (
    <div>
      <button onClick={onBack} style={{ ...mkBtn("ghost"), marginBottom:"1rem", fontSize:12 }}>Nations</button>

      {/* Nation Header */}
      <div style={{ ...card, border:"1px solid rgba(212,175,55,0.25)", marginBottom:"1rem", padding:"1.75rem", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(14,10,4,0.97),rgba(22,16,5,0.97))", pointerEvents:"none" }} />
        <div style={{ position:"relative", display:"flex", gap:"1.25rem", alignItems:"flex-start", flexWrap:"wrap" }}>
          <div style={{ position:"relative" }}>
            <Flag nation={nation} size={72} />
            {(isOwner || isAdmin) && (
              <FlagUploader nationId={nation.id} currentUrl={nation.flag_url}
                onUploaded={(url) => { nation.flag_url = url; onRefresh(); }} />
            )}
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <h1 style={{ margin:"0 0 0.25rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:"clamp(1.5rem,3vw,2.2rem)", letterSpacing:"0.04em" }}>{nation.name}</h1>
            <p style={{ margin:"0 0 0.5rem", color:"#c7b783", fontSize:13 }}>{nation.government}{nation.ideology ? ` - ${nation.ideology}` : ""}</p>
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
              {nation.tiktok_username && <span style={{ fontSize:11, color:"#a9b7cf" }}>TikTok: @{nation.tiktok_username}</span>}
          {nation.profiles && <span style={{ fontSize:11, color:"#a9b7cf" }}>Owner: {nation.profiles.username}</span>}
              {nation.diplomatic_status && <span style={{ fontSize:11, color:"#d4af37", border:"1px solid rgba(212,175,55,0.25)", borderRadius:4, padding:"1px 8px" }}>{nation.diplomatic_status}</span>}
              {nation.bloc && <span style={{ fontSize:11, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:4, padding:"1px 8px" }}>{nation.bloc}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.35rem", marginBottom:"1rem", flexWrap:"wrap" }}>
        {[["overview","Overview"],["feed","RP Feed"],["actions","Actions"],["wars","Wars"],["alliances","Alliances"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
        ))}
      </div>

      {tab==="overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"0.65rem" }}>
          {stats.map(([l,v])=>(
            <div key={l} style={{ ...card, padding:"1rem" }}>
              <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>{l}</div>
              <div style={{ fontFamily:"var(--display)", fontSize:"1.15rem", color:"#d4af37" }}>{v}</div>
            </div>
          ))}
          {nation.bio && (
            <div style={{ ...card, gridColumn:"1/-1" }}>
              <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"0.5rem" }}>Nation Profile</div>
              <p style={{ margin:0, color:"#d8c890", lineHeight:1.85, fontSize:13 }}>{nation.bio}</p>
            </div>
          )}
        </div>
      )}

      {tab==="feed" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {nPosts.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No dispatches from this nation yet.</p>}
          {nPosts.map(p=><PostCard key={p.id} post={p} nations={nations} />)}
        </div>
      )}

      {tab==="actions" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {nActions.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No canon actions submitted yet.</p>}
          {nActions.map(a=><ActionCard key={a.id} action={a} nations={nations} expandable />)}
        </div>
      )}

      {tab==="wars" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {nWars.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No wars on record.</p>}
          {nWars.map(w=><WarCard key={w.id} war={w} nations={nations} />)}
        </div>
      )}

      {tab==="alliances" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {nAlliances.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>Not part of any alliance.</p>}
          {nAlliances.map(a=>{
            const members = allianceMembers.filter(m=>m.alliance_id===a.id).map(m=>nations.find(n=>n.id===m.nation_id)).filter(Boolean);
            return (
              <div key={a.id} style={card}>
                <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:15, marginBottom:"0.5rem" }}>{a.name}</div>
                <span style={{ fontSize:11, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:3, padding:"1px 7px", marginBottom:"0.75rem", display:"inline-block" }}>{a.type?.toUpperCase()}</span>
                <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                  {members.map(n=><NationPill key={n.id} nation={n} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── SHARED CARDS ─────────────────────────────────────────────────
const PostCard = ({ post, nations }) => {
  const targetNation = nations?.find(n => n.id === post.target_nation_id);
  return (
    <div style={card}>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap", marginBottom:"0.75rem" }}>
        <Flag nation={post.nations} size={26} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontWeight:800, color:"#d4af37", fontSize:13 }}>{post.nations?.name||"Unknown"}</span>
            {targetNation && <><span style={{ color:"#8493ad", fontSize:12 }}>to</span><NationPill nation={targetNation} /></>}
            <span style={{ marginLeft:"auto", fontSize:11, color:"#8fa0bd" }}>{timeAgo(post.created_at)}</span>
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:POST_COLS[post.post_type]||"#d4af37", background:"rgba(0,0,0,0.5)", borderRadius:4, padding:"2px 8px", letterSpacing:"0.04em", border:`1px solid ${POST_COLS[post.post_type]||"#d4af37"}30` }}>{post.post_type}</span>
      </div>
      <h3 style={{ margin:"0 0 0.6rem", color:"#f7f0dc", fontFamily:"var(--display)", fontSize:15 }}>{post.title}</h3>
      <p style={{ margin:0, color:"#d8c890", lineHeight:1.85, fontSize:13, whiteSpace:"pre-wrap" }}>{post.body}</p>
    </div>
  );
};

const ActionCard = ({ action, nations, expandable, isMod, onRefresh, profile }) => {
  const [open, setOpen] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const nation = nations?.find(n=>n.id===action.nation_id) || action.nations;

  const addUpdate = async () => {
    if (!updateText.trim()) return;
    await supabase.from("action_updates").insert({ action_id:action.id, author_id:profile?.id, body:updateText });
    setUpdateText(""); if (onRefresh) onRefresh();
  };
  const updateStatus = async (status, extra={}) => {
    await supabase.from("canon_actions").update({ status, ...extra }).eq("id", action.id);
    if (onRefresh) onRefresh();
  };

  return (
    <div style={{ ...card, border:`1px solid ${ACTION_SIZES[action.size]?.color||"#d4af37"}22` }}>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", cursor:expandable?"pointer":"default", flexWrap:"wrap" }}
        onClick={()=>expandable&&setOpen(!open)}>
        <Flag nation={nation} size={26} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{action.title}</div>
          <div style={{ fontSize:11, color:"#8fa0bd" }}>{nation?.name} - {timeAgo(action.created_at)}</div>
        </div>
        <div style={{ display:"flex", gap:"0.4rem", alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:10, fontWeight:800, color:"#0a0806", background:ACTION_SIZES[action.size]?.color||"#d4af37", borderRadius:3, padding:"2px 7px" }}>{action.size?.toUpperCase()}</span>
          <span style={{ fontSize:10, fontWeight:800, color:STATUS_COL[action.status], border:`1px solid ${STATUS_COL[action.status]}`, borderRadius:3, padding:"2px 7px" }}>{action.status?.toUpperCase()}</span>
          {action.estimated_days && <span style={{ fontSize:11, color:"#a9b7cf" }}>{action.estimated_days}d</span>}
          {expandable && <span style={{ color:"#8fa0bd", fontSize:13 }}>{open?"▲":"▼"}</span>}
        </div>
      </div>

      {(open || !expandable) && (
        <div style={{ marginTop:"1rem", paddingTop:"1rem", borderTop:"1px solid rgba(255,215,0,0.06)" }}>
          <p style={{ margin:"0 0 0.75rem", color:"#d8c890", fontSize:13, lineHeight:1.8 }}>{action.description}</p>
          {action.tiktok_comment && (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.1)", borderRadius:6, padding:"0.7rem", marginBottom:"0.75rem" }}>
              <div style={{ fontSize:10, color:"#8fa0bd", letterSpacing:"0.1em", marginBottom:3 }}>TIKTOK COMMENT</div>
              <div style={{ fontSize:13, color:"#f0dc8a", fontStyle:"italic" }}>{action.tiktok_comment}</div>
            </div>
          )}
          {action.lore_notes && (
            <div style={{ background:"rgba(52,152,219,0.04)", border:"1px solid rgba(52,152,219,0.12)", borderRadius:6, padding:"0.7rem", marginBottom:"0.75rem" }}>
              <div style={{ fontSize:10, color:"#3498db", letterSpacing:"0.1em", marginBottom:3 }}>LORE TEAM NOTES</div>
              <div style={{ fontSize:13, color:"#90bcd8" }}>{action.lore_notes}</div>
            </div>
          )}
          {action.action_updates?.length > 0 && (
            <div style={{ marginBottom:"0.75rem" }}>
              <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", marginBottom:"0.5rem", textTransform:"uppercase" }}>Progress Log</div>
              {action.action_updates.map(u=>(
                <div key={u.id} style={{ borderLeft:"2px solid rgba(212,175,55,0.25)", paddingLeft:"0.75rem", marginBottom:"0.5rem" }}>
                  <div style={{ fontSize:11, color:"#8fa0bd" }}>{timeAgo(u.created_at)} - {u.profiles?.username}</div>
                  <div style={{ fontSize:13, color:"#d8c890" }}>{u.body}</div>
                </div>
              ))}
            </div>
          )}
          {isMod && profile && (
            <div style={{ borderTop:"1px solid rgba(255,215,0,0.07)", paddingTop:"0.75rem", display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", textTransform:"uppercase" }}>Lore Team Controls</div>
              <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                {action.status==="pending" && <button onClick={()=>updateStatus("active",{started_at:new Date().toISOString()})} style={{ ...mkBtn("blue"), fontSize:11 }}>▶ Activate</button>}
                {action.status==="active" && <button onClick={()=>updateStatus("complete",{completed_at:new Date().toISOString()})} style={{ ...mkBtn("green"), fontSize:11 }}>Complete</button>}
                <button onClick={()=>updateStatus("cancelled")} style={{ ...mkBtn("red"), fontSize:11 }}>Cancel</button>
              </div>
              <textarea placeholder="Post progress update or lore notes" value={updateText} onChange={e=>setUpdateText(e.target.value)} style={{ ...ta, minHeight:55 }} />
              <button onClick={addUpdate} style={{ ...mkBtn(), alignSelf:"flex-start" }}>Post Update</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const WarCard = ({ war, nations, isMod, onRefresh }) => {
  const agg = nations?.find(n=>n.id===war.aggressor_id) || war.aggressor;
  const def = nations?.find(n=>n.id===war.defender_id) || war.defender;
  return (
    <div style={{ ...card, border:`1px solid ${WAR_COL[war.status]||"#d4af37"}25` }}>
      <div style={{ display:"flex", gap:"1rem", alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
          <Flag nation={agg} size={26} />
          <span style={{ fontFamily:"var(--display)", color:"#e74c3c", fontSize:13 }}>{agg?.name||"?"}</span>
        </div>
        <span style={{ color:"#8493ad", fontFamily:"var(--display)", fontSize:18 }}>vs</span>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
          <Flag nation={def} size={26} />
          <span style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:13 }}>{def?.name||"?"}</span>
        </div>
        <div style={{ marginLeft:"auto" }}>
          <span style={{ fontSize:10, fontWeight:800, color:WAR_COL[war.status], border:`1px solid ${WAR_COL[war.status]}`, borderRadius:3, padding:"2px 7px" }}>{war.status?.toUpperCase()}</span>
        </div>
      </div>
      {war.name && <div style={{ fontFamily:"var(--display)", color:"#d8c890", fontSize:12, marginTop:"0.5rem", fontStyle:"italic" }}>"{war.name}"</div>}
      {war.casus_belli && <p style={{ margin:"0.4rem 0 0", color:"#9fb4d6", fontSize:12 }}>{war.casus_belli}</p>}
      {isMod && (
        <div style={{ marginTop:"0.75rem", display:"flex", gap:"0.4rem" }}>
          {war.status==="active" && <button onClick={async()=>{await supabase.from("wars").update({status:"frozen"}).eq("id",war.id);onRefresh();}} style={{ ...mkBtn("blue"), fontSize:11 }}>Freeze</button>}
          {["active","frozen"].includes(war.status) && <button onClick={async()=>{await supabase.from("wars").update({status:"peace",ended_at:new Date().toISOString()}).eq("id",war.id);onRefresh();}} style={{ ...mkBtn("ghost"), fontSize:11 }}>Set Peace</button>}
        </div>
      )}
    </div>
  );
};

// ─── NATIONS PAGE ─────────────────────────────────────────────────
const Nations = ({ nations, posts, actions, wars, alliances, allianceMembers, profile, userNation, isMod, isAdmin, onRefresh }) => {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [govFilter, setGovFilter] = useState("");
  const [sort, setSort] = useState("name");

  if (selected) return (
    <NationProfile nation={selected} posts={posts} actions={actions} wars={wars} alliances={alliances} allianceMembers={allianceMembers} nations={nations} onBack={()=>setSelected(null)} profile={profile} userNation={userNation} isMod={isMod} isAdmin={isAdmin} onRefresh={onRefresh} />
  );

  const govs = [...new Set(nations.map(n=>n.government).filter(Boolean))].sort();
  let list = nations.filter(n =>
    (!search || n.name.toLowerCase().includes(search.toLowerCase()) || (n.tiktok_username||"").toLowerCase().includes(search.toLowerCase())) &&
    (!govFilter || n.government===govFilter)
  );
  list.sort((a,b)=>{
    if (sort==="name") return a.name.localeCompare(b.name);
    if (sort==="gdp") return (b.gdp_usd||0)-(a.gdp_usd||0);
    if (sort==="pop") return (b.population||0)-(a.population||0);
    if (sort==="land") return (b.land_km2||0)-(a.land_km2||0);
    if (sort==="army") return (b.army_rank||0)-(a.army_rank||0);
    return 0;
  });

  return (
    <div>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Nations Registry <span style={{ fontSize:13, color:"#8fa0bd" }}>({list.length}/{nations.length})</span></h2>
      </div>
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem", flexWrap:"wrap" }}>
        <input placeholder="Search name or TikTok" value={search} onChange={e=>setSearch(e.target.value)} style={{ ...inp, flex:1, minWidth:160, width:"auto" }} />
        <select value={govFilter} onChange={e=>setGovFilter(e.target.value)} style={{ ...inp, width:"auto", minWidth:155 }}>
          <option value="">All Governments</option>
          {govs.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{ ...inp, width:"auto" }}>
          {[["name","Name"],["gdp","GDP"],["pop","Population"],["land","Land"],["army","Army"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(275px,1fr))", gap:"0.75rem" }}>
        {list.map(n=>(
          <div key={n.id} style={{ ...card, cursor:"pointer", transition:"border-color 0.18s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(212,175,55,0.38)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(212,175,55,0.1)"}
            onClick={()=>setSelected(n)}>
            <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.75rem" }}>
              <Flag nation={n} size={38} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.name}</div>
                <div style={{ fontSize:11, color:"#8fa0bd" }}>{n.government||"Unknown govt."}</div>
              </div>
              {!n.owner_id && <span style={{ fontSize:9, color:"#8493ad", border:"1px solid #8493ad", borderRadius:3, padding:"1px 5px", flexShrink:0 }}>UNASSIGNED</span>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.4rem" }}>
              {[["Pop",fmtPop(n.population)],["GDP",fmtGDP(n.gdp_usd)],["Army",n.army_rank!=null?`${n.army_rank}/11`:"-"]].map(([l,v])=>(
                <div key={l}>
                  <div style={{ fontSize:9, color:"#8493ad", textTransform:"uppercase", letterSpacing:"0.08em" }}>{l}</div>
                  <div style={{ fontSize:12, color:"#d8c890", fontWeight:700 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── DISPATCH BOARD ───────────────────────────────────────────────
const RPBoard = ({ posts, profile, userNation, nations, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [pType, setPType] = useState("Dispatch");
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [targetId, setTargetId] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = filter==="all" ? posts : posts.filter(p=>p.post_type===filter);

  const submit = async () => {
    if (!title.trim()||!body.trim()||!userNation) return;
    await supabase.from("rp_posts").insert({ nation_id:userNation.id, author_id:profile.id, post_type:pType, title, body, target_nation_id:targetId||null });
    setTitle(""); setBody(""); setShowForm(false); onRefresh();
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Dispatch Board</h2>
        {userNation && <button onClick={()=>setShowForm(!showForm)} style={mkBtn()}>+ New Dispatch</button>}
        {!userNation && profile && <span style={{ fontSize:12, color:"#8fa0bd", fontStyle:"italic" }}>You need an assigned nation to post</span>}
      </div>
      <div style={{ display:"flex", gap:"0.35rem", marginBottom:"1rem", flexWrap:"wrap" }}>
        <button onClick={()=>setFilter("all")} style={{ ...mkBtn(filter==="all"?"gold":"ghost"), fontSize:11 }}>All</button>
        {POST_TYPES.map(t=><button key={t} onClick={()=>setFilter(t)} style={{ ...mkBtn(filter===t?"gold":"ghost"), fontSize:11 }}>{t}</button>)}
      </div>
      {showForm && (
        <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1.25rem" }}>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1rem" }}>
            <Flag nation={userNation} size={26} />
            <span style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>{userNation?.name}</span>
          </div>
          <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap", marginBottom:"0.75rem" }}>
            {POST_TYPES.map(t=><button key={t} onClick={()=>setPType(t)} style={{ ...mkBtn(pType===t?"gold":"ghost"), fontSize:11, padding:"5px 10px" }}>{t}</button>)}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            <input placeholder="Title / Subject" value={title} onChange={e=>setTitle(e.target.value)} style={inp} />
            <select value={targetId} onChange={e=>setTargetId(e.target.value)} style={inp}>
              <option value="">Addressed to: World (public)</option>
              {nations.filter(n=>n.id!==userNation?.id).map(n=><option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <textarea placeholder="Write your in-character dispatch" value={body} onChange={e=>setBody(e.target.value)} style={{ ...ta, minHeight:110 }} />
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={submit} style={mkBtn()}>Transmit</button>
              <button onClick={()=>setShowForm(false)} style={mkBtn("ghost")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {filtered.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"3rem", fontStyle:"italic" }}>No dispatches yet. The world waits.</p>}
        {filtered.map(p=><PostCard key={p.id} post={p} nations={nations} />)}
      </div>
    </div>
  );
};

// ─── CANON ACTIONS ────────────────────────────────────────────────
const ActionsPage = ({ actions, profile, userNation, nations, isMod, onRefresh }) => {
  const [tab, setTab] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", description:"", tiktok_comment:"", size:"medium" });

  const filtered = actions.filter(a=>tab==="active"?["pending","active"].includes(a.status):["complete","cancelled"].includes(a.status));

  const submit = async () => {
    if (!form.title.trim()||!form.description.trim()||!userNation) return;
    await supabase.from("canon_actions").insert({ nation_id:userNation.id, submitted_by:profile.id, ...form, estimated_days:ACTION_SIZES[form.size]?.days });
    setForm({ title:"", description:"", tiktok_comment:"", size:"medium" }); setShowForm(false); onRefresh();
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Canon Actions</h2>
        {userNation && <button onClick={()=>setShowForm(!showForm)} style={mkBtn()}>+ Submit Action</button>}
      </div>

      {showForm && (
        <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1.25rem" }}>
          <h3 style={{ margin:"0 0 1rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Submit Canon Action - {userNation?.name}</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            <input placeholder="Action title (e.g. Construct orbital station above Aesyl)" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={inp} />
            <textarea placeholder="Describe the action in full detail" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={ta} />
            <input placeholder="TikTok comment (paste original if applicable)" value={form.tiktok_comment} onChange={e=>setForm({...form,tiktok_comment:e.target.value})} style={inp} />
            <div>
              <div style={{ fontSize:10, color:"#8fa0bd", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.4rem" }}>Action Size - determines canon duration</div>
              <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                {Object.entries(ACTION_SIZES).map(([k,v])=>(
                  <button key={k} onClick={()=>setForm({...form,size:k})} style={{ ...mkBtn(form.size===k?"gold":"ghost"), fontSize:11, borderLeft:form.size===k?`3px solid ${v.color}`:"" }}>
                    {v.label} - {v.days}d
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={submit} style={mkBtn()}>Submit Action</button>
              <button onClick={()=>setShowForm(false)} style={mkBtn("ghost")}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem" }}>
        {[["active","Active / Pending"],["archive","Completed Archive"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {filtered.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No actions here.</p>}
        {filtered.map(a=><ActionCard key={a.id} action={a} nations={nations} expandable isMod={isMod} profile={profile} onRefresh={onRefresh} />)}
      </div>
    </div>
  );
};

// ─── WARS & ALLIANCES ─────────────────────────────────────────────
const WarsPage = ({ wars, alliances, allianceMembers, nations, profile, userNation, isMod, onRefresh }) => {
  const [tab, setTab] = useState("wars");
  const [showWarForm, setShowWarForm] = useState(false);
  const [showAllyForm, setShowAllyForm] = useState(false);
  const [wf, setWf] = useState({ defender_id:"", name:"", casus_belli:"" });
  const [af, setAf] = useState({ name:"", description:"", type:"alliance" });

  const submitWar = async () => {
    if (!wf.defender_id||!userNation) return;
    await supabase.from("wars").insert({ aggressor_id:userNation.id, defender_id:wf.defender_id, name:wf.name, casus_belli:wf.casus_belli });
    setWf({defender_id:"",name:"",casus_belli:""}); setShowWarForm(false); onRefresh();
  };
  const submitAlly = async () => {
    if (!af.name.trim()) return;
    const {data} = await supabase.from("alliances").insert({name:af.name,description:af.description,type:af.type}).select().single();
    if (data && userNation) await supabase.from("alliance_members").insert({alliance_id:data.id,nation_id:userNation.id});
    setAf({name:"",description:"",type:"alliance"}); setShowAllyForm(false); onRefresh();
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Wars & Alliances</h2>
        {userNation && tab==="wars" && <button onClick={()=>setShowWarForm(!showWarForm)} style={{ ...mkBtn("red"), fontSize:12 }}>Declare War</button>}
        {userNation && tab==="alliances" && <button onClick={()=>setShowAllyForm(!showAllyForm)} style={{ ...mkBtn(), fontSize:12 }}>Form Alliance</button>}
      </div>
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem" }}>
        {[["wars","Wars"],["alliances","Alliances"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
        ))}
      </div>

      {tab==="wars" && (
        <div>
          {showWarForm && (
            <div style={{ ...card, border:"1px solid rgba(231,76,60,0.25)", marginBottom:"1rem" }}>
              <h3 style={{ margin:"0 0 1rem", fontFamily:"var(--display)", color:"#e74c3c", fontSize:14 }}>Declare War - {userNation?.name}</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                <select value={wf.defender_id} onChange={e=>setWf({...wf,defender_id:e.target.value})} style={inp}>
                  <option value="">Select target nation</option>
                  {nations.filter(n=>n.id!==userNation?.id).map(n=><option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                <input placeholder="War name (optional)" value={wf.name} onChange={e=>setWf({...wf,name:e.target.value})} style={inp} />
                <textarea placeholder="Casus belli - justification for war" value={wf.casus_belli} onChange={e=>setWf({...wf,casus_belli:e.target.value})} style={{ ...ta, minHeight:60 }} />
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button onClick={submitWar} style={mkBtn("red")}>Declare War</button>
                  <button onClick={()=>setShowWarForm(false)} style={mkBtn("ghost")}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {wars.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>The world is at peace for now.</p>}
            {wars.map(w=><WarCard key={w.id} war={w} nations={nations} isMod={isMod} onRefresh={onRefresh} />)}
          </div>
        </div>
      )}

      {tab==="alliances" && (
        <div>
          {showAllyForm && (
            <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1rem" }}>
              <h3 style={{ margin:"0 0 1rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Form Alliance</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                <input placeholder="Alliance name" value={af.name} onChange={e=>setAf({...af,name:e.target.value})} style={inp} />
                <select value={af.type} onChange={e=>setAf({...af,type:e.target.value})} style={inp}>
                  {["alliance","trade","defence","non-aggression"].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)} Pact</option>)}
                </select>
                <textarea placeholder="Description or terms" value={af.description} onChange={e=>setAf({...af,description:e.target.value})} style={{ ...ta, minHeight:60 }} />
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button onClick={submitAlly} style={mkBtn()}>Form Alliance</button>
                  <button onClick={()=>setShowAllyForm(false)} style={mkBtn("ghost")}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {alliances.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No alliances formed yet.</p>}
            {alliances.map(a=>{
              const members = allianceMembers.filter(m=>m.alliance_id===a.id).map(m=>nations.find(n=>n.id===m.nation_id)).filter(Boolean);
              return (
                <div key={a.id} style={card}>
                  <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.75rem", flexWrap:"wrap" }}>
                    <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:15, flex:1 }}>{a.name}</div>
                    <span style={{ fontSize:11, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:3, padding:"2px 8px" }}>{a.type?.toUpperCase()}</span>
                  </div>
                  {a.description && <p style={{ margin:"0 0 0.75rem", color:"#b8c4d8", fontSize:12 }}>{a.description}</p>}
                  <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", alignItems:"center" }}>
                    {members.map(n=><NationPill key={n.id} nation={n} />)}
                    {userNation && !members.find(m=>m.id===userNation.id) && (
                      <button onClick={async()=>{await supabase.from("alliance_members").insert({alliance_id:a.id,nation_id:userNation.id});onRefresh();}} style={{ ...mkBtn("ghost"), fontSize:11 }}>+ Join</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── NEWS ─────────────────────────────────────────────────────────
const NewsPage = ({ news, profile, isMod, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", body:"", category:"announcement", pinned:false });

  const submit = async () => {
    if (!form.title.trim()||!form.body.trim()) return;
    await supabase.from("news").insert({ author_id:profile.id, ...form });
    setForm({title:"",body:"",category:"announcement",pinned:false}); setShowForm(false); onRefresh();
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>World News</h2>
        {isMod && <button onClick={()=>setShowForm(!showForm)} style={mkBtn()}>+ Publish News</button>}
      </div>
      {showForm && (
        <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1.25rem" }}>
          <h3 style={{ margin:"0 0 1rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Publish World News</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            <input placeholder="Headline" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={inp} />
            <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap" }}>
              {NEWS_CATS.map(c=><button key={c} onClick={()=>setForm({...form,category:c})} style={{ ...mkBtn(form.category===c?"gold":"ghost"), fontSize:11 }}>{c}</button>)}
            </div>
            <textarea placeholder="Full story" value={form.body} onChange={e=>setForm({...form,body:e.target.value})} style={{ ...ta, minHeight:120 }} />
            <label style={{ display:"flex", gap:"0.5rem", alignItems:"center", color:"#c7b783", fontSize:12, cursor:"pointer" }}>
              <input type="checkbox" checked={form.pinned} onChange={e=>setForm({...form,pinned:e.target.checked})} /> Pin this article
            </label>
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={submit} style={mkBtn()}>Publish</button>
              <button onClick={()=>setShowForm(false)} style={mkBtn("ghost")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {news.filter(n=>n.pinned).length>0 && (
        <div style={{ marginBottom:"1.25rem" }}>
          <div style={{ fontSize:10, color:"#8fa0bd", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:"0.5rem" }}>Pinned</div>
          {news.filter(n=>n.pinned).map(n=>(
            <div key={n.id} style={{ ...card, marginBottom:"0.75rem" }}>
              <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"0.6rem", flexWrap:"wrap" }}>
                <span style={{ fontSize:10, fontWeight:800, color:"#0a0806", background:NEWS_COL[n.category]||"#d4af37", borderRadius:3, padding:"2px 8px" }}>{n.category?.toUpperCase()}</span>
                <span style={{ marginLeft:"auto", fontSize:11, color:"#8fa0bd" }}>{timeAgo(n.created_at)}</span>
              </div>
              <h3 style={{ margin:"0 0 0.6rem", fontFamily:"var(--display)", color:"#f7f0dc", fontSize:17 }}>{n.title}</h3>
              <p style={{ margin:0, color:"#d8c890", lineHeight:1.85, fontSize:13, whiteSpace:"pre-wrap" }}>{n.body}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {news.filter(n=>!n.pinned).length===0 && news.filter(n=>n.pinned).length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No news published yet.</p>}
        {news.filter(n=>!n.pinned).map(n=>(
          <div key={n.id} style={card}>
            <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginBottom:"0.6rem", flexWrap:"wrap" }}>
              <span style={{ fontSize:10, fontWeight:800, color:"#0a0806", background:NEWS_COL[n.category]||"#d4af37", borderRadius:3, padding:"2px 8px" }}>{n.category?.toUpperCase()}</span>
              <span style={{ marginLeft:"auto", fontSize:11, color:"#8fa0bd" }}>{timeAgo(n.created_at)}</span>
            </div>
            <h3 style={{ margin:"0 0 0.6rem", fontFamily:"var(--display)", color:"#f7f0dc", fontSize:17 }}>{n.title}</h3>
            <p style={{ margin:0, color:"#d8c890", lineHeight:1.85, fontSize:13, whiteSpace:"pre-wrap" }}>{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── LEADERBOARDS ─────────────────────────────────────────────────
const Leaderboards = ({ nations }) => {
  const [metric, setMetric] = useState("gdp");
  const metrics = {
    gdp:  { label:"GDP",       key:"gdp_usd",    fmt:fmtGDP },
    pop:  { label:"Population",key:"population", fmt:fmtPop },
    land: { label:"Land Area", key:"land_km2",   fmt:fmtLand },
    army: { label:"Army Rank", key:"army_rank",  fmt:v=>v!=null?`${v}/11`:"-" },
    hdi:  { label:"HDI",       key:"hdi",        fmt:v=>v||"-" },
  };
  const m = metrics[metric];
  const sorted = [...nations].filter(n=>n[m.key]!=null&&n[m.key]!==0).sort((a,b)=>(b[m.key]||0)-(a[m.key]||0));
  const max = sorted[0]?.[m.key]||1;

  return (
    <div>
      <h2 style={{ margin:"0 0 1.25rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:20 }}>Leaderboards</h2>
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        {Object.entries(metrics).map(([k,v])=>(
          <button key={k} onClick={()=>setMetric(k)} style={{ ...mkBtn(metric===k?"gold":"ghost"), fontSize:12 }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
        {sorted.map((n,i)=>{
          const val = n[m.key];
          const pct = max>0?(val/max)*100:0;
          const medal = null;
          return (
            <div key={n.id} style={{ ...card, padding:"0.9rem 1.25rem" }}>
              <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.45rem" }}>
                <span style={{ fontFamily:"var(--display)", color:i<3?"#d4af37":"#8493ad", fontSize:14, width:26, textAlign:"center" }}>{medal||`#${i+1}`}</span>
                <Flag nation={n} size={26} />
                <span style={{ flex:1, fontSize:14, color:"#f0dc8a", fontWeight:700 }}>{n.name}</span>
                <span style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:15 }}>{m.fmt(val)}</span>
              </div>
              <div style={{ height:3, background:"rgba(255,255,255,0.03)", borderRadius:2, marginLeft:26+26+12, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:i===0?"#f6c132":"rgba(246,193,50,0.35)", borderRadius:2 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── FORUMS ───────────────────────────────────────────────────────
const Forums = ({ boards, threads, posts, profile, userNation, nations, onRefresh }) => {
  const [view, setView] = useState({ type:"boards" });
  const [threadForm, setThreadForm] = useState({ title:"", body:"" });
  const [replyBody, setReplyBody] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);

  const submitThread = async () => {
    if (!threadForm.title.trim()||!threadForm.body.trim()||view.type!=="board") return;
    const {data} = await supabase.from("forum_threads").insert({ board_id:view.board.id, author_id:profile.id, nation_id:userNation?.id||null, title:threadForm.title }).select().single();
    if (data) await supabase.from("forum_posts").insert({ thread_id:data.id, author_id:profile.id, nation_id:userNation?.id||null, body:threadForm.body });
    setThreadForm({title:"",body:""}); setShowNewThread(false); onRefresh();
  };

  const submitReply = async () => {
    if (!replyBody.trim()||view.type!=="thread") return;
    await supabase.from("forum_posts").insert({ thread_id:view.thread.id, author_id:profile.id, nation_id:userNation?.id||null, body:replyBody });
    setReplyBody(""); onRefresh();
  };

  if (view.type==="boards") {
    return (
      <div>
        <h2 style={{ margin:"0 0 1.25rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:20 }}>Boards</h2>
        <div className="board-list" style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
          {boards.map(b=>{
            const bThreads = threads.filter(t=>t.board_id===b.id);
            const lastThread = bThreads[0];
            return (
              <div className="board-card" key={b.id} style={{ ...card, cursor:"pointer", transition:"border-color 0.18s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(212,175,55,0.38)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(212,175,55,0.1)"}
                onClick={()=>setView({type:"board",board:b})}>
                <div className="board-card-row" style={{ display:"flex", gap:"1rem", alignItems:"center" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>{b.name}</div>
                    <div style={{ fontSize:12, color:"#8fa0bd", marginTop:2 }}>{b.description}</div>
                    {lastThread && <div style={{ fontSize:11, color:"#8493ad", marginTop:3 }}>Latest: {lastThread.title} - {timeAgo(lastThread.created_at)}</div>}
                  </div>
                  <div className="board-count" style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontFamily:"var(--display)", fontSize:18, color:"#8493ad" }}>{bThreads.length}</div>
                    <div style={{ fontSize:10, color:"#8493ad", letterSpacing:"0.04em", textTransform:"uppercase" }}>threads</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view.type==="board") {
    const bThreads = threads.filter(t=>t.board_id===view.board.id);
    const pinned = bThreads.filter(t=>t.pinned);
    const regular = bThreads.filter(t=>!t.pinned);
    return (
      <div>
        <button onClick={()=>setView({type:"boards"})} style={{ ...mkBtn("ghost"), marginBottom:"1rem", fontSize:12 }}>All Boards</button>
        <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" }}>
          <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>{view.board.name}</h2>
          {profile && <button onClick={()=>setShowNewThread(!showNewThread)} style={mkBtn()}>+ New Thread</button>}
        </div>
        {showNewThread && (
          <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1rem" }}>
            <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>New Thread in {view.board.name}</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              <input placeholder="Thread title" value={threadForm.title} onChange={e=>setThreadForm({...threadForm,title:e.target.value})} style={inp} />
              <textarea placeholder="Opening post" value={threadForm.body} onChange={e=>setThreadForm({...threadForm,body:e.target.value})} style={ta} />
              <div style={{ display:"flex", gap:"0.5rem" }}>
                <button onClick={submitThread} style={mkBtn()}>Post Thread</button>
                <button onClick={()=>setShowNewThread(false)} style={mkBtn("ghost")}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {pinned.length>0 && <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"0.4rem" }}>Pinned</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
          {[...pinned,...regular].map(t=>{
            const tPosts = posts.filter(p=>p.thread_id===t.id);
            const authorNation = nations.find(n=>n.id===t.nation_id);
            return (
              <div className="thread-card" key={t.id} style={{ ...card, cursor:"pointer", display:"flex", gap:"0.75rem", alignItems:"center", transition:"border-color 0.18s", padding:"0.9rem 1.25rem" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(212,175,55,0.38)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=t.pinned?"rgba(212,175,55,0.2)":"rgba(212,175,55,0.1)"}
                onClick={()=>setView({type:"thread",thread:t})}>
                {authorNation ? <Flag nation={authorNation} size={22} /> : <div style={{ width:22, height:14, background:"rgba(255,255,255,0.04)", borderRadius:2 }} />}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:"#f0dc8a", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.pinned&&"Pinned: "}{t.title}</div>
                  <div style={{ fontSize:11, color:"#8fa0bd" }}>{authorNation?.name||t.profiles?.username||"?"} - {timeAgo(t.created_at)}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:"var(--display)", fontSize:16, color:"#8493ad" }}>{tPosts.length}</div>
                  <div style={{ fontSize:10, color:"#8493ad", letterSpacing:"0.04em" }}>replies</div>
                </div>
              </div>
            );
          })}
          {bThreads.length===0 && <p style={{ color:"#8493ad", textAlign:"center", padding:"2rem", fontStyle:"italic" }}>No threads yet.</p>}
        </div>
      </div>
    );
  }

  if (view.type==="thread") {
    const board = boards.find(b=>b.id===view.thread.board_id);
    const tPosts = posts.filter(p=>p.thread_id===view.thread.id);
    return (
      <div>
        <button onClick={()=>setView({type:"board",board})} style={{ ...mkBtn("ghost"), marginBottom:"1rem", fontSize:12 }}>{board?.name}</button>
        <h2 style={{ margin:"0 0 1.25rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:18, lineHeight:1.4 }}>{view.thread.title}</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", marginBottom:"1.25rem" }}>
          {tPosts.map((p,i)=>{
            const pNation = nations.find(n=>n.id===p.nation_id);
            return (
              <div className="post-card" key={p.id} style={{ ...card, borderLeft:i===0?"2px solid rgba(212,175,55,0.3)":undefined }}>
                <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.75rem", flexWrap:"wrap" }}>
                  {pNation ? <Flag nation={pNation} size={24} /> : <div style={{ width:24, height:16, background:"rgba(255,255,255,0.04)", borderRadius:2, flexShrink:0 }} />}
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:13, color:"#d4af37", fontWeight:700 }}>{pNation?.name||p.profiles?.username||"Unknown"}</span>
                    {i===0 && <span style={{ fontSize:10, color:"#d4af37", border:"1px solid rgba(212,175,55,0.25)", borderRadius:3, padding:"1px 5px", marginLeft:"0.5rem" }}>OP</span>}
                    <span style={{ fontSize:11, color:"#8fa0bd", marginLeft:"0.5rem" }}>{timeAgo(p.created_at)}</span>
                  </div>
                </div>
                <p style={{ margin:0, color:"#d8c890", fontSize:13, lineHeight:1.85, whiteSpace:"pre-wrap" }}>{p.body}</p>
              </div>
            );
          })}
        </div>
        {profile && !view.thread.locked && (
          <div style={card}>
            <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Post Reply</h3>
            <textarea placeholder="Write your reply" value={replyBody} onChange={e=>setReplyBody(e.target.value)} style={ta} />
            <button onClick={submitReply} style={{ ...mkBtn(), marginTop:"0.6rem" }}>Post Reply</button>
          </div>
        )}
        {view.thread.locked && <div style={{ ...card, textAlign:"center", color:"#8fa0bd", fontSize:13, fontStyle:"italic" }}>This thread is locked.</div>}
      </div>
    );
  }
};

// ─── ADMIN ────────────────────────────────────────────────────────
const Admin = ({ nations, profiles, onRefresh }) => {
  const [tab, setTab] = useState("add");
  const blank = { name:"",government:"",ideology:"",population:"",gdp_usd:"",land_km2:"",army_rank:"",hdi:"",economy:"",bio:"",diplomatic_status:"",bloc:"",tiktok_username:"",flag_color1:"#c0392b",flag_color2:"#f39c12" };
  const [nf, setNf] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [assignNId, setAssignNId] = useState(""); const [assignPId, setAssignPId] = useState("");
  const [roleId, setRoleId] = useState(""); const [role, setRole] = useState("player");

  const submitNation = async () => {
    if (!nf.name.trim()) return;
    const payload = { name:nf.name, slug:slugify(nf.name), government:nf.government||null, ideology:nf.ideology||null, population:nf.population?parseInt(nf.population):null, gdp_usd:nf.gdp_usd?parseInt(nf.gdp_usd):null, land_km2:nf.land_km2?parseInt(nf.land_km2):null, army_rank:nf.army_rank?parseInt(nf.army_rank):null, hdi:nf.hdi?parseFloat(nf.hdi):null, economy:nf.economy||null, bio:nf.bio||null, diplomatic_status:nf.diplomatic_status||null, bloc:nf.bloc||null, tiktok_username:nf.tiktok_username||null, flag_color1:nf.flag_color1, flag_color2:nf.flag_color2 };
    if (editId) { await supabase.from("nations").update(payload).eq("id",editId); setEditId(null); }
    else await supabase.from("nations").insert(payload);
    setNf(blank); onRefresh();
  };

  const loadEdit = n => { setEditId(n.id); setNf({ name:n.name||"",government:n.government||"",ideology:n.ideology||"",population:n.population||"",gdp_usd:n.gdp_usd||"",land_km2:n.land_km2||"",army_rank:n.army_rank||"",hdi:n.hdi||"",economy:n.economy||"",bio:n.bio||"",diplomatic_status:n.diplomatic_status||"",bloc:n.bloc||"",tiktok_username:n.tiktok_username||"",flag_color1:n.flag_color1||"#c0392b",flag_color2:n.flag_color2||"#f39c12" }); setTab("add"); window.scrollTo(0,0); };

  const fields = [["name","Nation Name *"],["government","Government"],["ideology","Ideology"],["population","Population"],["gdp_usd","GDP (USD number)"],["land_km2","Land km2"],["army_rank","Army Rank 0-11"],["hdi","HDI 0.00-1.00"],["economy","Economy Sectors"],["diplomatic_status","Diplomatic Status"],["bloc","Bloc / Alliance"],["tiktok_username","TikTok Username"]];

  return (
    <div>
      <h2 style={{ margin:"0 0 1.25rem", fontFamily:"var(--display)", color:"#e74c3c", fontSize:20 }}>Admin Panel</h2>
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        {[["add",editId?"Edit Nation":"Add Nation"],["assign","Assign Nations"],["roles","Manage Roles"],["list","Nation List"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...mkBtn(tab===t?"gold":"ghost"), fontSize:12 }}>{l}</button>
        ))}
      </div>

      {tab==="add" && (
        <div style={card}>
          <h3 style={{ margin:"0 0 1rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>{editId?"Editing Nation":"Add New Nation"}</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.55rem" }}>
            {fields.map(([k,l])=>(
              <input key={k} placeholder={l} value={nf[k]} onChange={e=>setNf({...nf,[k]:e.target.value})} style={{ ...inp, ...(k==="name"?{gridColumn:"1/-1"}:{}) }} />
            ))}
            <textarea placeholder="Nation bio or lore" value={nf.bio} onChange={e=>setNf({...nf,bio:e.target.value})} style={{ ...ta, gridColumn:"1/-1", minHeight:65 }} />
            <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap", gridColumn:"1/-1" }}>
              <span style={{ fontSize:12, color:"#b8c4d8" }}>Flag Colors:</span>
              <label style={{ display:"flex", gap:"0.4rem", alignItems:"center", fontSize:12, color:"#b8c4d8" }}>Color 1 <input type="color" value={nf.flag_color1} onChange={e=>setNf({...nf,flag_color1:e.target.value})} style={{ width:36, height:26, border:"none", background:"none", cursor:"pointer" }} /></label>
              <label style={{ display:"flex", gap:"0.4rem", alignItems:"center", fontSize:12, color:"#b8c4d8" }}>Color 2 <input type="color" value={nf.flag_color2} onChange={e=>setNf({...nf,flag_color2:e.target.value})} style={{ width:36, height:26, border:"none", background:"none", cursor:"pointer" }} /></label>
              <Flag nation={{ name:nf.name, flag_color1:nf.flag_color1, flag_color2:nf.flag_color2 }} size={42} />
              <span style={{ fontSize:11, color:"#8fa0bd" }}>Preview (players can upload real flag images)</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:"0.5rem", marginTop:"1rem" }}>
            <button onClick={submitNation} style={mkBtn()}>{editId?"Save Changes":"Add Nation"}</button>
            {editId && <button onClick={()=>{setEditId(null);setNf(blank);}} style={mkBtn("ghost")}>Cancel</button>}
          </div>
        </div>
      )}

      {tab==="assign" && (
        <div style={{ ...card, display:"flex", flexDirection:"column", gap:"0.75rem", maxWidth:480 }}>
          <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Assign Nation to Player</h3>
          <select value={assignNId} onChange={e=>setAssignNId(e.target.value)} style={inp}>
            <option value="">Select nation</option>
            {nations.map(n=><option key={n.id} value={n.id}>{n.name} {n.owner_id?"(assigned)":"(free)"}</option>)}
          </select>
          <select value={assignPId} onChange={e=>setAssignPId(e.target.value)} style={inp}>
            <option value="">Select player</option>
            {profiles.map(p=><option key={p.id} value={p.id}>@{p.username} {p.nation_id?"(has nation)":""}</option>)}
          </select>
          <button onClick={async()=>{if(!assignNId||!assignPId)return;await supabase.from("nations").update({owner_id:assignPId}).eq("id",assignNId);await supabase.from("profiles").update({nation_id:assignNId}).eq("id",assignPId);setAssignNId("");setAssignPId("");onRefresh();}} style={mkBtn()}>Assign Nation</button>
        </div>
      )}

      {tab==="roles" && (
        <div style={{ ...card, display:"flex", flexDirection:"column", gap:"0.75rem", maxWidth:480 }}>
          <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Assign Player Role</h3>
          <select value={roleId} onChange={e=>setRoleId(e.target.value)} style={inp}>
            <option value="">Select player</option>
            {profiles.map(p=><option key={p.id} value={p.id}>@{p.username} - {p.role}</option>)}
          </select>
          <select value={role} onChange={e=>setRole(e.target.value)} style={inp}>
            <option value="player">Player</option>
            <option value="mod">Mod (Lore Team)</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={async()=>{if(!roleId)return;await supabase.from("profiles").update({role}).eq("id",roleId);setRoleId("");onRefresh();}} style={mkBtn()}>Set Role</button>
        </div>
      )}

      {tab==="list" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {nations.map(n=>(
            <div key={n.id} style={{ ...card, padding:"0.9rem", display:"flex", gap:"0.75rem", alignItems:"center" }}>
              <Flag nation={n} size={28} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:"#f0dc8a", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.name}</div>
                <div style={{ fontSize:11, color:"#8fa0bd" }}>{n.government||"?"} - {n.profiles?`@${n.profiles.username}`:"unassigned"}</div>
              </div>
              <button onClick={()=>loadEdit(n)} style={{ ...mkBtn("ghost"), fontSize:11, padding:"5px 10px" }}>Edit</button>
              <button onClick={async()=>{if(!confirm("Delete this nation?"))return;await supabase.from("nations").delete().eq("id",n.id);onRefresh();}} style={{ ...mkBtn("red"), fontSize:11, padding:"5px 10px" }}>Del</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState("forums");
  const [showSetup, setShowSetup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState({ nations:[], profiles:[], news:[], posts:[], actions:[], wars:[], alliances:[], allianceMembers:[], boards:[], threads:[], forumPosts:[] });
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }
    const [nations, profiles, news, posts, actions, wars, alliances, allianceMembers, boards, threads, forumPosts] = await Promise.all([
      supabase.from("nations").select("*, profiles(username)").order("name"),
      supabase.from("profiles").select("*").order("username"),
      supabase.from("news").select("*").order("created_at",{ascending:false}),
      supabase.from("rp_posts").select("*, nations(name,flag_url,flag_color1,flag_color2), target_nation_id").order("created_at",{ascending:false}).limit(100),
      supabase.from("canon_actions").select("*, nations(name,flag_url,flag_color1,flag_color2), action_updates(*, profiles(username))").order("created_at",{ascending:false}),
      supabase.from("wars").select("*, aggressor:aggressor_id(name,flag_url,flag_color1,flag_color2), defender:defender_id(name,flag_url,flag_color1,flag_color2)").order("started_at",{ascending:false}),
      supabase.from("alliances").select("*").order("created_at",{ascending:false}),
      supabase.from("alliance_members").select("*"),
      supabase.from("forum_boards").select("*").order("sort_order"),
      supabase.from("forum_threads").select("*, profiles(username)").order("created_at",{ascending:false}),
      supabase.from("forum_posts").select("*, profiles(username)").order("created_at",{ascending:true}),
    ]);
    setData({ nations:nations.data||[], profiles:profiles.data||[], news:news.data||[], posts:posts.data||[], actions:actions.data||[], wars:wars.data||[], alliances:alliances.data||[], allianceMembers:allianceMembers.data||[], boards:boards.data||[], threads:threads.data||[], forumPosts:forumPosts.data||[] });
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
    supabase.auth.getSession().then(({data:s}) => {
      if (s.session?.user) {
        setUser(s.session.user);
        ensureProfile(s.session.user).then(p=>{if(p)setProfile(p);}).catch(console.error);
        fetchAll();
      }
      setLoading(false);
    });
    supabase.auth.onAuthStateChange((_,session) => { if(session?.user)setUser(session.user); else{setUser(null);setProfile(null);} });
  }, [fetchAll]);

  if (!SUPABASE_CONFIGURED) return <SetupModal onClose={()=>{}} />;

  if (!user) return <Auth setupRequired={setupRequired} onAuth={(u,p)=>{setUser(u);if(p)setProfile(p);else ensureProfile(u).then(next=>{if(next)setProfile(next);}).catch(console.error);fetchAll();}} />;

  const userNation = profile?.nation_id ? data.nations.find(n=>n.id===profile.nation_id) : null;
  const isAdmin = profile?.role==="admin";
  const isMod = ["mod","admin"].includes(profile?.role);

  const nav = [
    {id:"forums",label:"Boards"},
    {id:"rp",label:"Dispatches"},
    {id:"actions",label:"Actions"},
    {id:"wars",label:"Wars and Alliances"},
    {id:"nations",label:"Nations"},
    {id:"news",label:"News"},
    {id:"leaderboards",label:"Leaderboards"},
    {id:"home",label:"Overview"},
    ...(isAdmin?[{id:"admin",label:"Admin"}]:[]),
  ];

  const navigate = (id) => { setPage(id); setMenuOpen(false); };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      {showSetup && <SetupModal onClose={()=>setShowSetup(false)} />}

      {/* HEADER */}
      <header className="app-header" style={{ background:"rgba(3,4,7,0.98)", borderBottom:"1px solid rgba(20,96,184,0.36)", padding:"0 1.25rem", display:"flex", alignItems:"center", gap:"1rem", height:50, position:"sticky", top:0, zIndex:200, backdropFilter:"blur(20px)" }}>
        <div className="brand" style={{ display:"flex", alignItems:"center", gap:"0.55rem", cursor:"pointer", flexShrink:0 }} onClick={()=>navigate("forums")}>
          <img className="brand-logo" src={LOGO_SRC} alt="Nationwheel" style={{ width:34, height:34, objectFit:"cover", borderRadius:"50%", border:"1px solid rgba(246,193,50,0.35)" }} />
          <span className="brand-name" style={{ fontFamily:"var(--brand)", color:"#fff8e6", fontSize:15, letterSpacing:"0.08em", fontWeight:900 }}>NATIONWHEEL</span>
        </div>
        {/* Desktop nav */}
        <nav className="app-nav" style={{ display:"flex", gap:"0.1rem", flex:1, overflowX:"auto", scrollbarWidth:"none" }}>
          {nav.map(n=>(
            <button className="nav-button" key={n.id} onClick={()=>navigate(n.id)} style={{ background:page===n.id?"rgba(246,193,50,0.12)":"transparent", color:page===n.id?"#f6c132":"#8aa4c9", border:"none", borderRadius:5, padding:"5px 9px", cursor:"pointer", fontSize:11.5, fontWeight:page===n.id?800:600, whiteSpace:"nowrap", transition:"all 0.15s", fontFamily:"inherit" }}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="user-tools" style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexShrink:0 }}>
          {userNation && <><Flag nation={userNation} size={20} /><span style={{ fontSize:11, color:"#9fb4d6", maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userNation.name}</span></>}
          <span style={{ fontSize:11, color:"#9fb4d6" }}>@{profile?.username}</span>
          {isMod && <span style={{ fontSize:9, color:"#3498db", border:"1px solid #3498db33", borderRadius:3, padding:"1px 5px", letterSpacing:"0.06em" }}>{profile?.role?.toUpperCase()}</span>}
          <button onClick={()=>setShowSetup(true)} style={{ ...mkBtn("ghost"), padding:"4px 8px", fontSize:11 }}>Setup</button>
          <button onClick={()=>supabase.auth.signOut()} style={{ ...mkBtn("ghost"), padding:"4px 8px", fontSize:11 }}>Out</button>
        </div>
      </header>

      <main className="app-main" style={{ maxWidth:980, margin:"0 auto", padding:"1.5rem 1rem", width:"100%", flex:1 }}>
        {loading
          ? <div style={{ textAlign:"center", padding:"5rem", color:"#8493ad", fontFamily:"var(--display)", letterSpacing:"0.2em", fontSize:13 }}>LOADING WORLD</div>
          : <>
              {page==="home"         && <Home nations={data.nations} news={data.news} actions={data.actions} wars={data.wars} />}
              {page==="nations"      && <Nations nations={data.nations} posts={data.posts} actions={data.actions} wars={data.wars} alliances={data.alliances} allianceMembers={data.allianceMembers} profile={profile} userNation={userNation} isMod={isMod} isAdmin={isAdmin} onRefresh={fetchAll} />}
              {page==="rp"           && <RPBoard posts={data.posts} profile={profile} userNation={userNation} nations={data.nations} onRefresh={fetchAll} />}
              {page==="actions"      && <ActionsPage actions={data.actions} profile={profile} userNation={userNation} nations={data.nations} isMod={isMod} onRefresh={fetchAll} />}
              {page==="wars"         && <WarsPage wars={data.wars} alliances={data.alliances} allianceMembers={data.allianceMembers} nations={data.nations} profile={profile} userNation={userNation} isMod={isMod} onRefresh={fetchAll} />}
              {page==="news"         && <NewsPage news={data.news} profile={profile} isMod={isMod} onRefresh={fetchAll} />}
              {page==="leaderboards" && <Leaderboards nations={data.nations} />}
              {page==="forums"       && <Forums boards={data.boards} threads={data.threads} posts={data.forumPosts} profile={profile} userNation={userNation} nations={data.nations} onRefresh={fetchAll} />}
              {page==="admin" && isAdmin && <Admin nations={data.nations} profiles={data.profiles} onRefresh={fetchAll} />}
            </>
        }
      </main>

      <footer className="app-footer" style={{ borderTop:"1px solid rgba(20,96,184,0.22)", padding:"1rem", textAlign:"center", fontSize:10, color:"#6f85a8", letterSpacing:"0.15em", textTransform:"uppercase" }}>
        Nationwheel - Geopolitical Roleplay World - Season 1
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cinzel:wght@700;900&display=swap');
        :root { --display:'Inter',Arial,sans-serif; --brand:'Cinzel',Georgia,serif; --body:'Inter',Arial,sans-serif; }
        *,*::before,*::after{box-sizing:border-box;}
        body {
          font-family: var(--body);
          background: #020305;
          background-image:
            radial-gradient(circle at 18% 12%,rgba(225,29,29,0.18) 0%,transparent 30%),
            radial-gradient(circle at 50% 0%,rgba(246,193,50,0.12) 0%,transparent 34%),
            radial-gradient(circle at 82% 18%,rgba(20,96,184,0.18) 0%,transparent 32%),
            radial-gradient(circle at 24% 88%,rgba(31,143,67,0.12) 0%,transparent 30%);
          color:#fff8e6; margin:0;
        }
        input::placeholder,textarea::placeholder{color:#7184a5;}
        input:focus,textarea:focus,select:focus{outline:none;border-color:rgba(246,193,50,0.72)!important;box-shadow:0 0 0 3px rgba(20,96,184,0.16);}
        select option{background:#05070b;color:#fff8e6;}
        button:hover{opacity:0.8;}
        button:active{transform:scale(0.97);}
        button,input,textarea,select{font:inherit;}
        button{min-height:40px;}
        body{overflow-x:hidden;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:#020305;}
        ::-webkit-scrollbar-thumb{background:rgba(246,193,50,0.28);border-radius:2px;}
        nav::-webkit-scrollbar{display:none;}
        @media (max-width: 760px) {
          .app-header{
            height:auto!important;
            min-height:104px!important;
            padding:0.65rem 0.75rem 0.55rem!important;
            display:grid!important;
            grid-template-columns:1fr auto!important;
            grid-template-areas:"brand tools" "nav nav"!important;
            gap:0.55rem!important;
            align-items:center!important;
          }
          .brand{grid-area:brand;min-width:0;}
          .brand-logo{width:32px!important;height:32px!important;}
          .brand-name{font-size:13px!important;letter-spacing:0.06em!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .user-tools{grid-area:tools;gap:0.35rem!important;max-width:48vw;overflow:hidden;justify-content:flex-end;}
          .user-tools > span{display:none!important;}
          .user-tools button{padding:6px 9px!important;font-size:11px!important;min-height:34px!important;}
          .app-nav{
            grid-area:nav;
            width:100%;
            gap:0.35rem!important;
            padding:0.05rem 0 0.15rem;
            overflow-x:auto!important;
            scroll-snap-type:x proximity;
            -webkit-overflow-scrolling:touch;
          }
          .nav-button{
            min-height:38px!important;
            padding:8px 12px!important;
            font-size:12px!important;
            border:1px solid rgba(20,96,184,0.26)!important;
            scroll-snap-align:start;
          }
          .app-main{padding:1rem 0.75rem 1.25rem!important;max-width:none!important;}
          .app-footer{font-size:9px!important;letter-spacing:0.08em!important;padding:0.85rem 0.75rem!important;}
          .board-card{padding:1rem!important;}
          .board-card-row{align-items:flex-start!important;gap:0.75rem!important;}
          .board-count{min-width:48px;}
          .thread-card{padding:0.85rem!important;gap:0.6rem!important;align-items:flex-start!important;}
          .post-card{padding:1rem!important;}
        }
        @media (max-width: 430px) {
          .app-header{min-height:108px!important;}
          .brand-name{font-size:12px!important;}
          .user-tools{max-width:44vw;}
          .user-tools button{padding:5px 7px!important;font-size:10.5px!important;}
          .nav-button{font-size:11.5px!important;padding:8px 10px!important;}
          h1{font-size:2rem!important;}
          h2{font-size:18px!important;}
        }
      `}</style>
    </div>
  );
}
