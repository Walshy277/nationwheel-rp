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
const WAR_COL    = { active:"#e74c3c", ceasefire:"#3498db", frozen:"#3498db", stalemate:"#f39c12", peace:"#2ecc71" };
const POST_TYPES = ["Dispatch","Official Statement","Declaration","Intelligence","Propaganda","Treaty Proposal","Ultimatum"];
const POST_COLS  = { Dispatch:"#3498db", "Official Statement":"#9b59b6", "Communiqué":"#9b59b6", "CommuniquÃ©":"#9b59b6", Declaration:"#d4af37", Intelligence:"#e67e22", Propaganda:"#e74c3c", "Treaty Proposal":"#2ecc71", Ultimatum:"#c0392b" };
const NEWS_CATS  = ["announcement","war","diplomacy","economy","lore","community"];
const NEWS_COL   = { announcement:"#d4af37", war:"#e74c3c", diplomacy:"#3498db", economy:"#2ecc71", lore:"#9b59b6", community:"#e67e22" };

const FORUM_BOARDS = [
  { slug:"general",           name:"General",              desc:"Cross-world discussion and community chat",              icon:"💬", sort:1  },
  { slug:"diplomacy",         name:"Diplomacy",            desc:"Treaties, negotiations, and alliances",                  icon:"🤝", sort:2  },
  { slug:"canon-actions",     name:"Canon Actions",        desc:"Action discussion, outcomes, and lore clarification",    icon:"🧭", sort:3  },
  { slug:"war-room",          name:"War Room",             desc:"Military strategy, war declarations, and battle reports", icon:"⚔️", sort:4  },
  { slug:"intelligence",      name:"Intelligence",         desc:"Espionage, leaks, and covert operations",                icon:"🔎", sort:5  },
  { slug:"trade",             name:"Trade",                desc:"Economic deals, markets, and logistics",                 icon:"💱", sort:6  },
  { slug:"propaganda",        name:"Propaganda",           desc:"State media, narratives, and public messaging",          icon:"📣", sort:7  },
  { slug:"cultural-exchange", name:"Cultural Exchange",    desc:"Arts, religion, culture, and soft power",                icon:"🎭", sort:8  },
  { slug:"newsroom",          name:"Newsroom",             desc:"Reports, reactions, and world event discussion",         icon:"📰", sort:9  },
  { slug:"lore-library",      name:"Lore Library",         desc:"World lore, canon rules, factions, and timeline",       icon:"📚", sort:10 },
  { slug:"nation-introductions", name:"Nation Introductions", desc:"Introduce your nation, its history and culture",     icon:"🌐", sort:11 },
  { slug:"season-archives",   name:"Season Archives",      desc:"Completed seasons, outcomes, and historical records",    icon:"🗄️", sort:12 },
  { slug:"support",           name:"Support",              desc:"Questions, onboarding, and site help",                   icon:"🛟", sort:13 },
];
const BOARD_ICONS = Object.fromEntries(FORUM_BOARDS.map(b => [b.slug, b.icon]));

// ─── SQL ──────────────────────────────────────────────────────────
const SQL = `-- Run once in Supabase SQL Editor

-- Enable storage
insert into storage.buckets (id, name, public) values ('flags', 'flags', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('profile-media', 'profile-media', true) on conflict do nothing;
drop policy if exists "Public flag read" on storage.objects;
drop policy if exists "Auth flag upload" on storage.objects;
drop policy if exists "Auth flag update" on storage.objects;
drop policy if exists "Public profile media read" on storage.objects;
drop policy if exists "Auth profile media upload" on storage.objects;
drop policy if exists "Auth profile media update" on storage.objects;
create policy "Public flag read" on storage.objects for select using (bucket_id = 'flags');
create policy "Auth flag upload" on storage.objects for insert with check (bucket_id = 'flags' AND auth.role() = 'authenticated');
create policy "Auth flag update" on storage.objects for update using (bucket_id = 'flags' AND auth.role() = 'authenticated');
create policy "Public profile media read" on storage.objects for select using (bucket_id = 'profile-media');
create policy "Auth profile media upload" on storage.objects for insert with check (bucket_id = 'profile-media' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);
create policy "Auth profile media update" on storage.objects for update using (bucket_id = 'profile-media' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  role text default 'player',
  nation_id uuid,
  avatar_url text,
  signature_url text,
  bio text,
  created_at timestamptz default now()
);

alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists signature_url text;
alter table profiles add column if not exists bio text;

notify pgrst, 'reload schema';

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
  objective text, casualties text, result text,
  ceasefire_days int, ceasefire_until timestamptz,
  started_at timestamptz default now(), ended_at timestamptz
);

alter table wars add column if not exists ceasefire_days int;
alter table wars add column if not exists ceasefire_until timestamptz;
alter table wars add column if not exists objective text;
alter table wars add column if not exists casualties text;
alter table wars add column if not exists result text;

create table if not exists alliances (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text,
  flag_url text,
  type text default 'alliance', status text default 'active',
  created_at timestamptz default now()
);

alter table alliances add column if not exists flag_url text;

create table if not exists alliance_members (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid references alliances(id) on delete cascade,
  nation_id uuid references nations(id) on delete cascade
);

create table if not exists war_participants (
  id uuid primary key default gen_random_uuid(),
  war_id uuid references wars(id) on delete cascade,
  side text not null check (side in ('attacker','defender')),
  nation_id uuid references nations(id) on delete cascade,
  alliance_id uuid references alliances(id) on delete cascade,
  created_at timestamptz default now(),
  check (nation_id is not null or alliance_id is not null)
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

create table if not exists forum_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references forum_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique (post_id, user_id, emoji)
);

-- RLS (explicit so Supabase can see it before you expose the API)
alter table profiles enable row level security;
alter table nations enable row level security;
alter table rp_posts enable row level security;
alter table canon_actions enable row level security;
alter table action_updates enable row level security;
alter table wars enable row level security;
alter table war_participants enable row level security;
alter table alliances enable row level security;
alter table alliance_members enable row level security;
alter table news enable row level security;
alter table forum_boards enable row level security;
alter table forum_threads enable row level security;
alter table forum_posts enable row level security;
alter table forum_reactions enable row level security;

drop policy if exists "pub_read" on profiles;
drop policy if exists "pub_read" on nations;
drop policy if exists "pub_read" on rp_posts;
drop policy if exists "pub_read" on canon_actions;
drop policy if exists "pub_read" on action_updates;
drop policy if exists "pub_read" on wars;
drop policy if exists "pub_read" on war_participants;
drop policy if exists "pub_read" on alliances;
drop policy if exists "pub_read" on alliance_members;
drop policy if exists "pub_read" on news;
drop policy if exists "pub_read" on forum_boards;
drop policy if exists "pub_read" on forum_threads;
drop policy if exists "pub_read" on forum_posts;
drop policy if exists "pub_read" on forum_reactions;
create policy "pub_read" on profiles for select using (true);
create policy "pub_read" on nations for select using (true);
create policy "pub_read" on rp_posts for select using (true);
create policy "pub_read" on canon_actions for select using (true);
create policy "pub_read" on action_updates for select using (true);
create policy "pub_read" on wars for select using (true);
create policy "pub_read" on war_participants for select using (true);
create policy "pub_read" on alliances for select using (true);
create policy "pub_read" on alliance_members for select using (true);
create policy "pub_read" on news for select using (true);
create policy "pub_read" on forum_boards for select using (true);
create policy "pub_read" on forum_threads for select using (true);
create policy "pub_read" on forum_posts for select using (true);
create policy "pub_read" on forum_reactions for select using (true);

drop policy if exists "own_insert" on profiles;
drop policy if exists "own_update" on profiles;
drop policy if exists "auth_insert_rp" on rp_posts;
drop policy if exists "auth_insert_ca" on canon_actions;
drop policy if exists "auth_insert_au" on action_updates;
drop policy if exists "auth_insert_ft" on forum_threads;
drop policy if exists "auth_insert_fp" on forum_posts;
drop policy if exists "auth_insert_fr" on forum_reactions;
drop policy if exists "own_update_ft" on forum_threads;
drop policy if exists "own_delete_ft" on forum_threads;
drop policy if exists "own_update_fp" on forum_posts;
drop policy if exists "own_delete_fp" on forum_posts;
drop policy if exists "own_delete_fr" on forum_reactions;
drop policy if exists "auth_insert_wars" on wars;
drop policy if exists "auth_insert_war_participants" on war_participants;
create policy "own_insert" on profiles for insert with check (auth.uid()=id);
create policy "own_update" on profiles for update using (auth.uid()=id);
create policy "auth_insert_rp" on rp_posts for insert with check (auth.uid()=author_id);
create policy "auth_insert_ca" on canon_actions for insert with check (auth.uid()=submitted_by);
create policy "auth_insert_au" on action_updates for insert with check (auth.uid()=author_id);
create policy "auth_insert_ft" on forum_threads for insert with check (auth.uid()=author_id);
create policy "auth_insert_fp" on forum_posts for insert with check (auth.uid()=author_id);
create policy "auth_insert_fr" on forum_reactions for insert with check (auth.uid()=user_id);
create policy "own_update_ft" on forum_threads for update using (auth.uid()=author_id);
create policy "own_delete_ft" on forum_threads for delete using (auth.uid()=author_id);
create policy "own_update_fp" on forum_posts for update using (auth.uid()=author_id);
create policy "own_delete_fp" on forum_posts for delete using (auth.uid()=author_id);
create policy "own_delete_fr" on forum_reactions for delete using (auth.uid()=user_id);
create policy "auth_insert_wars" on wars for insert with check (auth.role()='authenticated');
create policy "auth_insert_war_participants" on war_participants for insert with check (auth.role()='authenticated');

-- Seed forum boards
insert into forum_boards (name,description,slug,icon,sort_order) values
('General','Cross-world discussion and community chat','general','💬',1),
('Diplomacy','Treaties, negotiations, and alliances','diplomacy','🤝',2),
('Canon Actions','Action discussion and lore clarification','canon-actions','🧭',3),
('War Room','Military strategy and battle reports','war-room','⚔️',4),
('Intelligence','Espionage, leaks, and covert operations','intelligence','🔎',5),
('Trade','Economic deals, markets, and logistics','trade','💱',6),
('Propaganda','State media and public messaging','propaganda','📣',7),
('Cultural Exchange','Arts, religion, and soft power','cultural-exchange','🎭',8),
('Newsroom','Reports and world event discussion','newsroom','📰',9),
('Lore Library','World lore, canon rules, and timeline','lore-library','📚',10),
('Nation Introductions','Introduce your nation to the world','nation-introductions','🌐',11),
('Season Archives','Completed seasons and historical records','season-archives','🗄️',12),
('Support','Questions, onboarding, and site help','support','🛟',13)
on conflict (slug) do update set icon = excluded.icon;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and role = 'admin');
$$;

create or replace function public.is_lore_team(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = uid and role in ('admin','lore','mod'));
$$;

create or replace function public.assign_nation_as_staff(target_profile uuid, target_nation uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_lore_team(auth.uid()) then
    raise exception 'Only admin or lore team can assign nations';
  end if;

  update public.nations
  set owner_id = target_profile
  where id = target_nation;

  update public.profiles
  set nation_id = target_nation
  where id = target_profile;
end;
$$;

drop policy if exists "admin_manage_profiles" on profiles;
drop policy if exists "admin_manage_nations" on nations;
drop policy if exists "admin_manage_canon_actions" on canon_actions;
drop policy if exists "admin_manage_wars" on wars;
drop policy if exists "admin_manage_war_participants" on war_participants;
drop policy if exists "admin_manage_alliances" on alliances;
drop policy if exists "admin_manage_alliance_members" on alliance_members;
drop policy if exists "admin_manage_news" on news;
drop policy if exists "admin_manage_forum_boards" on forum_boards;
drop policy if exists "staff_manage_forum_threads" on forum_threads;
drop policy if exists "staff_manage_forum_posts" on forum_posts;
drop policy if exists "staff_manage_forum_reactions" on forum_reactions;
create policy "admin_manage_profiles" on profiles for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin_manage_nations" on nations for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_canon_actions" on canon_actions for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_wars" on wars for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_war_participants" on war_participants for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_alliances" on alliances for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_alliance_members" on alliance_members for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_news" on news for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "admin_manage_forum_boards" on forum_boards for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_forum_threads" on forum_threads for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_forum_posts" on forum_posts for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));
create policy "staff_manage_forum_reactions" on forum_reactions for all using (public.is_lore_team(auth.uid())) with check (public.is_lore_team(auth.uid()));

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
const isMissingOptionalProfileSchema = error =>
  error?.code === "42703" ||
  /profiles(_\d+)?\.(bio|avatar_url|signature_url)|column .*profiles.* does not exist|schema cache/i.test(error?.message || "");
const isMissingProfileMediaBucket = error =>
  /bucket not found|not found/i.test(error?.message || "");

const escapeHtml = value => String(value || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");
const safeUrl = value => {
  const raw = String(value || "").trim();
  return /^https?:\/\//i.test(raw) ? raw : "";
};
const renderRichText = value => {
  let html = escapeHtml(value);
  html = html
    .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
    .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
    .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
    .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>")
    .replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, "<blockquote>$1</blockquote>")
    .replace(/\[code\]([\s\S]*?)\[\/code\]/gi, "<pre><code>$1</code></pre>");
  html = html.replace(/\[url=(.*?)\]([\s\S]*?)\[\/url\]/gi, (_, url, text) => {
    const href = safeUrl(url);
    return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${text}</a>` : text;
  });
  html = html.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (_, url) => {
    const href = safeUrl(url);
    return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(href)}</a>` : escapeHtml(url);
  });
  html = html.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, (_, url) => {
    const src = safeUrl(url);
    return src ? `<img src="${escapeHtml(src)}" alt="" loading="lazy" />` : "";
  });
  html = html.replace(/&lt;(\/?)(b|strong|i|em|u|s|br|p|ul|ol|li|blockquote|code|pre)&gt;/gi, "<$1$2>");
  return html;
};
const RichText = ({ children }) => (
  <div className="rich-post" dangerouslySetInnerHTML={{ __html: renderRichText(children) }} />
);
const inp = { background:"rgba(255,255,255,0.055)", border:"1px solid rgba(21,96,181,0.42)", borderRadius:6, padding:"11px 13px", color:"#f5f8ff", fontSize:16, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };
const ta  = { ...inp, resize:"vertical", minHeight:80 };
const mkBtn = (v="gold") => ({
  background: v==="gold"?"#f6c132": v==="red"?"#b91616": v==="blue"?"#145bb0": v==="green"?"#1f8f43":"rgba(255,255,255,0.055)",
  color: v==="gold"?"#050505":"#f5f8ff",
  border: v==="ghost"?"1px solid rgba(246,193,50,0.24)":"none",
  borderRadius:6, padding:"9px 14px", cursor:"pointer", fontWeight:700, fontSize:13,
  letterSpacing:"0.04em", fontFamily:"inherit", transition:"opacity 0.15s, transform 0.1s",
  whiteSpace:"nowrap",
});
const card = { background:"linear-gradient(180deg,rgba(10,16,27,0.97),rgba(3,7,13,0.96))", border:"1px solid rgba(78,128,190,0.24)", borderRadius:8, padding:"1.25rem", boxShadow:"0 18px 45px rgba(0,0,0,0.35)" };

// ─── FLAG COMPONENT ───────────────────────────────────────────────
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
        <ol style={{ color:"#d7e2f2", lineHeight:2.2, paddingLeft:"1.2rem", fontSize:13 }}>
          <li>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{color:"#d4af37"}}>supabase.com</a>, then create a free project</li>
          <li>Settings, API, then copy <strong style={{color:"#f8fbff"}}>Project URL</strong> and <strong style={{color:"#f8fbff"}}>anon key</strong></li>
          <li>Paste into <code style={{color:"#d4af37",fontSize:11}}>VITE_SUPABASE_URL</code> / <code style={{color:"#d4af37",fontSize:11}}>VITE_SUPABASE_ANON_KEY</code> in <code style={{color:"#d4af37",fontSize:11}}>.env.local</code></li>
          <li>SQL Editor &gt; paste SQL below &gt; Run. The RLS warning is expected for table creation; this SQL explicitly enables RLS and adds policies before the app uses the tables.</li>
          <li>Authentication, Providers, then enable <strong style={{color:"#f8fbff"}}>Email</strong></li>
          <li>Storage: check the <strong style={{color:"#f8fbff"}}>flags</strong> and <strong style={{color:"#f8fbff"}}>profile-media</strong> buckets were created, or create them manually and set them to Public</li>
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
            <h1 style={{ fontFamily:"var(--brand)", fontSize:"clamp(2rem,6vw,3rem)", color:"#f5f8ff", margin:"0.9rem 0 0", letterSpacing:"0.08em", textShadow:"0 0 34px rgba(246,193,50,0.22)" }}>NATIONWHEEL</h1>
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
                <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"8px", borderRadius:6, cursor:"pointer", fontWeight:800, fontSize:12, letterSpacing:"0.06em", border:mode===m?"none":"1px solid rgba(20,96,184,0.36)", background:mode===m?"#f6c132":"rgba(255,255,255,0.035)", color:mode===m?"#050505":"#f5f8ff", fontFamily:"inherit" }}>
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
    if (!["image/jpeg","image/png"].includes(file.type)) {
      alert("Please upload a JPEG or PNG file.");
      return;
    }
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : "jpg";
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
      {currentUrl && <img src={currentUrl} alt="Nation flag" style={{ width:96, height:64, objectFit:"cover", borderRadius:4, border:"1px solid rgba(212,175,55,0.2)" }} />}
      <input ref={ref} type="file" accept="image/jpeg,image/png" style={{ display:"none" }} onChange={e=>upload(e.target.files[0])} />
      <button onClick={()=>ref.current.click()} style={{ ...mkBtn("ghost"), fontSize:11, alignSelf:"flex-start" }}>
        {uploading?"Uploading":"Upload JPEG/PNG Flag"}
      </button>
      <p style={{ margin:0, fontSize:10, color:"#8fa0bd" }}>JPEG or PNG only. Recommended 3:2 ratio.</p>
    </div>
  );
};

// ─── HOME ─────────────────────────────────────────────────────────
const AllianceFlag = ({ alliance, size = 34 }) => {
  if (alliance?.flag_url) {
    return <img src={alliance.flag_url} alt={alliance.name} style={{ width:size, height:size, objectFit:"cover", borderRadius:4, border:"1px solid rgba(255,255,255,0.12)", flexShrink:0 }} />;
  }
  const ab = alliance?.name ? alliance.name.slice(0,2).toUpperCase() : "??";
  return <div style={{ width:size, height:size, borderRadius:4, background:"rgba(52,152,219,0.12)", border:"1px solid rgba(52,152,219,0.24)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.26, fontWeight:900, color:"#6fb7ff", flexShrink:0 }}>{ab}</div>;
};

const AllianceFlagUploader = ({ allianceId, currentUrl, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const ref = useRef();
  const upload = async (file) => {
    if (!file || !allianceId) return;
    if (!["image/jpeg","image/png"].includes(file.type)) {
      alert("Please upload a JPEG or PNG file.");
      return;
    }
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = `alliance-${allianceId}.${ext}`;
    const { error } = await supabase.storage.from("flags").upload(path, file, { upsert:true, contentType:file.type });
    if (error) alert(error.message);
    else {
      const { data } = supabase.storage.from("flags").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      const update = await supabase.from("alliances").update({ flag_url:url }).eq("id", allianceId);
      if (update.error) alert(update.error.message);
      else onUploaded(url);
    }
    setUploading(false);
  };
  return (
    <span>
      <input ref={ref} type="file" accept="image/jpeg,image/png" style={{ display:"none" }} onChange={e=>upload(e.target.files[0])} />
      <button onClick={()=>ref.current.click()} style={{ ...mkBtn("ghost"), minHeight:28, padding:"4px 8px", fontSize:10 }}>{uploading ? "Uploading" : currentUrl ? "Change Flag" : "Upload Flag"}</button>
    </span>
  );
};

const ProfileMediaUploader = ({ profileId, field, currentUrl, label, onUploaded, ratio = "1 / 1" }) => {
  const [uploading, setUploading] = useState(false);
  const ref = useRef();

  const upload = async (file) => {
    if (!file || !profileId) return;
    if (!["image/jpeg","image/png"].includes(file.type)) {
      alert("Please upload a JPEG or PNG file.");
      return;
    }
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = `${profileId}/${field}.${ext}`;
    const { error } = await supabase.storage.from("profile-media").upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      alert(isMissingProfileMediaBucket(error)
        ? "Profile uploads are not enabled yet. Run supabase-profile-setup.sql in Supabase, then refresh the app."
        : error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    const update = await supabase.from("profiles").update({ [field]: url }).eq("id", profileId).select("*").single();
    if (update.error) alert(isMissingOptionalProfileSchema(update.error)
      ? "The upload worked, but the profile columns are not installed yet. Run supabase-profile-setup.sql in Supabase, then refresh."
      : update.error.message);
    else onUploaded(update.data);
    setUploading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem" }}>
      {currentUrl ? (
        <img src={currentUrl} alt={label} style={{ width:"100%", maxWidth:field==="avatar_url"?120:360, aspectRatio:ratio, objectFit:"cover", borderRadius:field==="avatar_url"?"50%":6, border:"1px solid rgba(246,193,50,0.2)" }} />
      ) : (
        <div style={{ width:field==="avatar_url"?120:"100%", maxWidth:field==="avatar_url"?120:360, aspectRatio:ratio, borderRadius:field==="avatar_url"?"50%":6, border:"1px dashed rgba(246,193,50,0.24)", background:"rgba(255,255,255,0.035)", display:"flex", alignItems:"center", justifyContent:"center", color:"#8fa0bd", fontSize:12 }}>{label}</div>
      )}
      <input ref={ref} type="file" accept="image/jpeg,image/png" style={{ display:"none" }} onChange={e=>upload(e.target.files[0])} />
      <button onClick={()=>ref.current.click()} disabled={uploading} style={{ ...mkBtn("ghost"), alignSelf:"flex-start", fontSize:11 }}>
        {uploading ? "Uploading" : `Upload ${label}`}
      </button>
    </div>
  );
};

const ProfilePage = ({ user, profile, userNation, onProfileUpdate }) => {
  const [form, setForm] = useState({ username:profile?.username||"", bio:profile?.bio||"" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setForm({ username:profile?.username||"", bio:profile?.bio||"" });
  }, [profile?.username, profile?.bio]);

  const save = async () => {
    if (!profile) return;
    const username = form.username.trim();
    if (!username) {
      setMsg("Username is required.");
      return;
    }
    setSaving(true);
    setMsg("");
    let nextMsg = "Profile saved.";
    let { data, error } = await supabase
      .from("profiles")
      .update({ username, bio:form.bio.trim() || null })
      .eq("id", profile.id)
      .select("*")
      .single();
    if (isMissingOptionalProfileSchema(error)) {
      const retry = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", profile.id)
        .select("*")
        .single();
      data = retry.data;
      error = retry.error;
      if (!error) nextMsg = "Username saved. Run supabase-profile-setup.sql to enable bios, avatars, and signatures.";
    }
    if (error) setMsg(error.message);
    else {
      onProfileUpdate(data);
      setMsg(nextMsg);
    }
    setSaving(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>Profile</h2>
        {userNation && <NationPill nation={userNation} />}
      </div>

      <div className="profile-grid" style={{ display:"grid", gridTemplateColumns:"minmax(0, 1fr) 320px", gap:"1rem", alignItems:"start" }}>
        <div style={{ ...card, display:"flex", flexDirection:"column", gap:"0.8rem" }}>
          <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#edf4ff", fontSize:15 }}>Account Details</h3>
          <label style={{ display:"flex", flexDirection:"column", gap:"0.35rem", color:"#8fa0bd", fontSize:12 }}>
            Username
            <input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} style={inp} />
          </label>
          <label style={{ display:"flex", flexDirection:"column", gap:"0.35rem", color:"#8fa0bd", fontSize:12 }}>
            Bio
            <textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Short public profile bio" style={{ ...ta, minHeight:130 }} />
          </label>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={save} disabled={saving} style={mkBtn()}>{saving ? "Saving" : "Save Profile"}</button>
            {msg && <span style={{ fontSize:12, color:msg==="Profile saved."?"#2ecc71":"#e74c3c" }}>{msg}</span>}
          </div>
        </div>

        <aside style={{ ...card, display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div>
            <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.6rem" }}>Avatar</div>
            <ProfileMediaUploader profileId={profile.id} field="avatar_url" currentUrl={profile.avatar_url} label="Avatar" onUploaded={onProfileUpdate} />
          </div>
          <div>
            <div style={{ fontSize:11, color:"#8fa0bd", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.6rem" }}>Forum Signature</div>
            <ProfileMediaUploader profileId={profile.id} field="signature_url" currentUrl={profile.signature_url} label="Signature" onUploaded={onProfileUpdate} ratio="5 / 1" />
          </div>
        </aside>
      </div>

      <div className="profile-preview" style={card}>
        <div style={{ display:"flex", gap:"1rem", alignItems:"flex-start", flexWrap:"wrap" }}>
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width:92, height:92, borderRadius:"50%", objectFit:"cover", border:"1px solid rgba(246,193,50,0.22)" }} /> : <div style={{ width:92, height:92, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(246,193,50,0.18)" }} />}
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:18, fontWeight:800 }}>@{profile.username}</div>
            <div style={{ color:"#8fa0bd", fontSize:12, marginTop:2 }}>{profile.role || "player"}{user?.email ? ` - ${user.email}` : ""}</div>
            {profile.bio && <p style={{ margin:"0.75rem 0 0", color:"#d7e2f2", lineHeight:1.75, fontSize:13, whiteSpace:"pre-wrap" }}>{profile.bio}</p>}
            {profile.signature_url && <img src={profile.signature_url} alt="" style={{ marginTop:"0.85rem", maxWidth:"100%", maxHeight:110, objectFit:"contain", borderTop:"1px solid rgba(20,96,184,0.16)", paddingTop:"0.75rem" }} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = ({ nations, news, actions, wars }) => {
  const topGDP = [...nations].sort((a,b)=>(b.gdp_usd||0)-(a.gdp_usd||0)).slice(0,5);
  const activeWars = wars.filter(w=>w.status==="active");
  const activeActions = actions.filter(a=>a.status==="active").slice(0,5);
  const recentNews = news.slice(0,4);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
      {/* Hero bar */}
      <div style={{ ...card, background:"linear-gradient(120deg,rgba(6,10,18,0.98),rgba(9,18,32,0.98))", border:"1px solid rgba(212,175,55,0.25)", padding:"1.75rem 2rem", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:"auto 0 0 0", height:3, background:"linear-gradient(90deg,#145bb0,#f6c132,#1f8f43)", pointerEvents:"none" }} />
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
              <div style={{ fontSize:13, color:"#edf4ff", fontWeight:700, marginTop:3 }}>{n.title}</div>
            </div>
          ))}
        </Section>

        <Section title="Active Actions" empty="No active actions.">
          {activeActions.map(a=>(
            <div key={a.id} style={{ padding:"0.6rem 0", borderBottom:"1px solid rgba(255,215,0,0.05)", display:"flex", gap:"0.5rem", alignItems:"center" }}>
              <span style={{ fontSize:10, fontWeight:800, color:"#0a0806", background:ACTION_SIZES[a.size]?.color||"#d4af37", borderRadius:3, padding:"1px 6px" }}>{a.size?.toUpperCase()}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:"#edf4ff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</div>
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
              <span style={{ color:"#edf4ff", fontWeight:700 }}>{w.defender?.name||"?"}</span>
              {w.name && <div style={{ fontSize:11, color:"#a9b7cf", fontStyle:"italic" }}>"{w.name}"</div>}
            </div>
          ))}
        </Section>

        <Section title="Top GDP Nations" empty="No nation data.">
          {topGDP.map((n,i)=>(
            <div key={n.id} style={{ display:"flex", gap:"0.75rem", alignItems:"center", padding:"0.45rem 0", borderBottom:"1px solid rgba(255,215,0,0.05)" }}>
              <span style={{ fontFamily:"var(--display)", color:i===0?"#d4af37":i<3?"#d7e2f2":"#8493ad", fontSize:13, width:20, textAlign:"center" }}>#{i+1}</span>
              <Flag nation={n} size={24} />
              <span style={{ flex:1, fontSize:13, color:"#edf4ff" }}>{n.name}</span>
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
  const nAllyIds = allianceMembers.filter(m => m.nation_id === nation.id).map(m => m.alliance_id);
  const nWars = wars.filter(w =>
    w.aggressor_id === nation.id ||
    w.defender_id === nation.id ||
    w.war_participants?.some(p => p.nation_id === nation.id || nAllyIds.includes(p.alliance_id))
  );
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
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(6,10,18,0.97),rgba(9,18,32,0.97))", pointerEvents:"none" }} />
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
            <p style={{ margin:"0 0 0.5rem", color:"#b7c6dc", fontSize:13 }}>{nation.government}{nation.ideology ? ` - ${nation.ideology}` : ""}</p>
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
          {(nation.owner || nation.profiles) && <span style={{ fontSize:11, color:"#a9b7cf" }}>Owner: {(nation.owner || nation.profiles).username}</span>}
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
              <RichText>{nation.bio}</RichText>
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
          {nWars.map(w=><WarCard key={w.id} war={w} nations={nations} alliances={alliances} participants={w.war_participants || []} />)}
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
      <h3 style={{ margin:"0 0 0.6rem", color:"#f8fbff", fontFamily:"var(--display)", fontSize:15 }}>{post.title}</h3>
      <p style={{ margin:0, color:"#d7e2f2", lineHeight:1.85, fontSize:13, whiteSpace:"pre-wrap" }}>{post.body}</p>
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
          <p style={{ margin:"0 0 0.75rem", color:"#d7e2f2", fontSize:13, lineHeight:1.8 }}>{action.description}</p>
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
                  <div style={{ fontSize:13, color:"#d7e2f2" }}>{u.body}</div>
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

const WarParticipantPill = ({ participant, nations, alliances }) => {
  const nation = participant.nation_id ? nations.find(n=>n.id===participant.nation_id) : null;
  const alliance = participant.alliance_id ? alliances.find(a=>a.id===participant.alliance_id) : null;
  if (nation) return <NationPill nation={nation} />;
  if (alliance) return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(52,152,219,0.09)", border:"1px solid rgba(52,152,219,0.22)", borderRadius:4, padding:"4px 8px" }}>
      <span style={{ color:"#6fb7ff", fontSize:12, fontWeight:800 }}>{alliance.name}</span>
      <span style={{ color:"#8fa0bd", fontSize:10 }}>{alliance.type}</span>
    </span>
  );
  return null;
};

const WarCard = ({ war, nations, alliances = [], participants = [], isMod, onRefresh }) => {
  const agg = nations?.find(n=>n.id===war.aggressor_id) || war.aggressor;
  const def = nations?.find(n=>n.id===war.defender_id) || war.defender;
  const warParticipants = participants.filter(p=>p.war_id===war.id);
  const attackers = warParticipants.filter(p=>p.side==="attacker");
  const defenders = warParticipants.filter(p=>p.side==="defender");
  const hasParticipants = warParticipants.length > 0;
  const [addForm, setAddForm] = useState({ side:"attacker", type:"nation", id:"" });
  const [ceasefireDays, setCeasefireDays] = useState(war.ceasefire_days || 3);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ name:war.name||"", casus_belli:war.casus_belli||"", objective:war.objective||"", casualties:war.casualties||"", result:war.result||war.outcome||"" });

  const addParticipant = async () => {
    if (!addForm.id) return;
    const payload = {
      war_id: war.id,
      side: addForm.side,
      nation_id: addForm.type==="nation" ? addForm.id : null,
      alliance_id: addForm.type==="alliance" ? addForm.id : null,
    };
    const { error } = await supabase.from("war_participants").insert(payload);
    if (error) alert(error.message);
    else {
      setAddForm({ ...addForm, id:"" });
      onRefresh();
    }
  };

  const removeParticipant = async (id) => {
    const { error } = await supabase.from("war_participants").delete().eq("id", id);
    if (error) alert(error.message);
    else onRefresh();
  };

  const setWarStatus = async (status, extra = {}) => {
    const payload = { status, ...extra };
    let { error } = await supabase.from("wars").update(payload).eq("id", war.id);
    if (error && /ceasefire_days|ceasefire_until|schema cache|column/i.test(error.message || "")) {
      const fallback = { status };
      if ("ended_at" in payload) fallback.ended_at = payload.ended_at;
      if (status === "ceasefire") {
        fallback.outcome = `Ceasefire for ${payload.ceasefire_days} day${payload.ceasefire_days === 1 ? "" : "s"}${payload.ceasefire_until ? `, until ${new Date(payload.ceasefire_until).toLocaleDateString()}` : ""}`;
      }
      const retry = await supabase.from("wars").update(fallback).eq("id", war.id);
      error = retry.error;
      if (!error) {
        alert("Ceasefire status saved. Run supabase-war-participants-setup.sql to store ceasefire days and dates properly.");
      }
    }
    if (error) alert(error.message);
    else onRefresh();
  };

  const setCeasefire = async () => {
    const days = Math.max(1, parseInt(ceasefireDays, 10) || 1);
    const until = new Date(Date.now() + days * 86400000).toISOString();
    await setWarStatus("ceasefire", { ceasefire_days:days, ceasefire_until:until, ended_at:null });
  };

  const saveWar = async () => {
    let { error } = await supabase.from("wars").update({
      name:edit.name || null,
      casus_belli:edit.casus_belli || null,
      objective:edit.objective || null,
      casualties:edit.casualties || null,
      result:edit.result || null,
      outcome:edit.result || null,
    }).eq("id", war.id);
    if (error && /objective|casualties|result|schema cache|column/i.test(error.message || "")) {
      const retry = await supabase.from("wars").update({
        name:edit.name || null,
        casus_belli:edit.casus_belli || null,
        outcome:[edit.objective && `Objective: ${edit.objective}`, edit.casualties && `Casualties: ${edit.casualties}`, edit.result && `Result: ${edit.result}`].filter(Boolean).join("\n") || null,
      }).eq("id", war.id);
      error = retry.error;
      if (!error) alert("War saved using fallback fields. Run supabase-war-participants-setup.sql to enable structured objective, casualty, and result fields.");
    }
    if (error) alert(error.message);
    else { setEditing(false); onRefresh(); }
  };

  const deleteWar = async () => {
    if (!confirm("Delete this war?")) return;
    const { error } = await supabase.from("wars").delete().eq("id", war.id);
    if (error) alert(error.message);
    else onRefresh();
  };

  const Side = ({ title, color, fallback, items }) => (
    <div style={{ flex:1, minWidth:220 }}>
      <div style={{ fontSize:10, color:"#8fa0bd", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.45rem" }}>{title}</div>
      <div style={{ display:"flex", gap:"0.45rem", flexWrap:"wrap", alignItems:"center" }}>
        {items.length > 0
          ? items.map(p=>(
            <span key={p.id} style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
              <WarParticipantPill participant={p} nations={nations} alliances={alliances} />
              {isMod && <button onClick={()=>removeParticipant(p.id)} style={{ ...mkBtn("ghost"), minHeight:24, padding:"1px 6px", fontSize:10 }}>Remove</button>}
            </span>
          ))
          : fallback && <span style={{ fontFamily:"var(--display)", color, fontSize:13 }}>{fallback}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ ...card, border:`1px solid ${WAR_COL[war.status]||"#d4af37"}25` }}>
      <div style={{ display:"flex", gap:"1rem", alignItems:"flex-start", flexWrap:"wrap" }}>
        <Side title="Attackers" color="#e74c3c" fallback={agg?.name||"?"} items={attackers} />
        <span style={{ color:"#8493ad", fontFamily:"var(--display)", fontSize:18, alignSelf:"center" }}>vs</span>
        <Side title="Defenders" color="#d4af37" fallback={def?.name||"?"} items={defenders} />
        <div style={{ marginLeft:"auto", alignSelf:"center" }}>
          <span style={{ fontSize:10, fontWeight:800, color:WAR_COL[war.status] || "#d4af37", border:`1px solid ${WAR_COL[war.status] || "#d4af37"}`, borderRadius:3, padding:"2px 7px" }}>{war.status?.toUpperCase()}</span>
        </div>
      </div>
      {!hasParticipants && <div style={{ marginTop:"0.55rem", fontSize:11, color:"#8fa0bd" }}>Legacy two-nation war. Lore team can add participants below to convert it.</div>}
      {war.name && <div style={{ fontFamily:"var(--display)", color:"#d7e2f2", fontSize:12, marginTop:"0.5rem", fontStyle:"italic" }}>"{war.name}"</div>}
      {war.casus_belli && <p style={{ margin:"0.4rem 0 0", color:"#9fb4d6", fontSize:12 }}>{war.casus_belli}</p>}
      {(war.objective || war.casualties || war.result || (war.outcome && war.status !== "ceasefire")) && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"0.55rem", marginTop:"0.7rem" }}>
          {war.objective && <div><div style={{ fontSize:10, color:"#8fa0bd", textTransform:"uppercase" }}>Objective</div><div style={{ fontSize:12, color:"#d7e2f2" }}>{war.objective}</div></div>}
          {war.casualties && <div><div style={{ fontSize:10, color:"#8fa0bd", textTransform:"uppercase" }}>Casualties</div><div style={{ fontSize:12, color:"#d7e2f2" }}>{war.casualties}</div></div>}
          {(war.result || (war.outcome && war.status !== "ceasefire")) && <div><div style={{ fontSize:10, color:"#8fa0bd", textTransform:"uppercase" }}>Result</div><div style={{ fontSize:12, color:"#d7e2f2" }}>{war.result || war.outcome}</div></div>}
        </div>
      )}
      {war.status === "ceasefire" && (
        <p style={{ margin:"0.45rem 0 0", color:"#9fb4d6", fontSize:12 }}>
          {war.ceasefire_days || war.ceasefire_until
            ? <>Ceasefire{war.ceasefire_days ? ` for ${war.ceasefire_days} day${war.ceasefire_days === 1 ? "" : "s"}` : ""}{war.ceasefire_until ? `, until ${new Date(war.ceasefire_until).toLocaleDateString()}` : ""}</>
            : (war.outcome || "Ceasefire")}
        </p>
      )}
      {isMod && (
        <div style={{ marginTop:"0.9rem", display:"flex", flexDirection:"column", gap:"0.55rem" }}>
          <div className="war-participant-form" style={{ display:"grid", gridTemplateColumns:"120px 120px minmax(180px,1fr) auto", gap:"0.45rem", alignItems:"center" }}>
            <select value={addForm.side} onChange={e=>setAddForm({...addForm,side:e.target.value})} style={{ ...inp, fontSize:12 }}>
              <option value="attacker">Attacker</option>
              <option value="defender">Defender</option>
            </select>
            <select value={addForm.type} onChange={e=>setAddForm({...addForm,type:e.target.value,id:""})} style={{ ...inp, fontSize:12 }}>
              <option value="nation">Nation</option>
              <option value="alliance">Alliance</option>
            </select>
            <select value={addForm.id} onChange={e=>setAddForm({...addForm,id:e.target.value})} style={{ ...inp, fontSize:12 }}>
              <option value="">Select {addForm.type}</option>
              {addForm.type==="nation"
                ? nations.map(n=><option key={n.id} value={n.id}>{n.name}</option>)
                : alliances.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button onClick={addParticipant} style={{ ...mkBtn("ghost"), fontSize:11 }}>Add</button>
          </div>
          <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", alignItems:"center" }}>
            <button onClick={()=>setWarStatus("active", { ceasefire_days:null, ceasefire_until:null, ended_at:null })} style={{ ...mkBtn("red"), fontSize:11 }}>Active War</button>
            <button onClick={()=>setWarStatus("stalemate", { ceasefire_days:null, ceasefire_until:null, ended_at:null })} style={{ ...mkBtn("ghost"), fontSize:11 }}>Stalemate</button>
            <input type="number" min="1" value={ceasefireDays} onChange={e=>setCeasefireDays(e.target.value)} style={{ ...inp, width:92, fontSize:12, padding:"7px 9px" }} />
            <button onClick={setCeasefire} style={{ ...mkBtn("blue"), fontSize:11 }}>Ceasefire Days</button>
            <button onClick={()=>setWarStatus("peace", { ended_at:new Date().toISOString(), ceasefire_days:null, ceasefire_until:null })} style={{ ...mkBtn("green"), fontSize:11 }}>Peace</button>
            <button onClick={()=>setEditing(!editing)} style={{ ...mkBtn("ghost"), fontSize:11 }}>Edit War</button>
            <button onClick={deleteWar} style={{ ...mkBtn("red"), fontSize:11 }}>Delete War</button>
          </div>
          {editing && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"0.5rem" }}>
              <input placeholder="War name" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} style={inp} />
              <input placeholder="War objective" value={edit.objective} onChange={e=>setEdit({...edit,objective:e.target.value})} style={inp} />
              <input placeholder="Casualties" value={edit.casualties} onChange={e=>setEdit({...edit,casualties:e.target.value})} style={inp} />
              <input placeholder="End result / outcome" value={edit.result} onChange={e=>setEdit({...edit,result:e.target.value})} style={inp} />
              <textarea placeholder="Casus belli" value={edit.casus_belli} onChange={e=>setEdit({...edit,casus_belli:e.target.value})} style={{ ...ta, gridColumn:"1/-1", minHeight:60 }} />
              <button onClick={saveWar} style={{ ...mkBtn(), justifySelf:"start" }}>Save War</button>
            </div>
          )}
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
    (!search || n.name.toLowerCase().includes(search.toLowerCase()) || (n.government||"").toLowerCase().includes(search.toLowerCase()) || (n.bloc||"").toLowerCase().includes(search.toLowerCase())) &&
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
        <input placeholder="Search nations, governments, blocs" value={search} onChange={e=>setSearch(e.target.value)} style={{ ...inp, flex:1, minWidth:160, width:"auto" }} />
        <select value={govFilter} onChange={e=>setGovFilter(e.target.value)} style={{ ...inp, width:"auto", minWidth:155 }}>
          <option value="">All Governments</option>
          {govs.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{ ...inp, width:"auto" }}>
          {[["name","Name"],["gdp","GDP"],["pop","Population"],["land","Land"],["army","Army"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {nations.length === 0 && (
        <div style={{ ...card, textAlign:"center", padding:"2rem", border:"1px solid rgba(225,29,29,0.26)" }}>
          <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:16, marginBottom:"0.35rem" }}>No nations loaded</div>
          <p style={{ margin:0, color:"#8fa0bd", fontSize:13, lineHeight:1.6 }}>The directory is public, so this usually means the database seed has not been run on this Supabase project or the deployment is pointing at the wrong Supabase environment.</p>
        </div>
      )}
      {nations.length > 0 && list.length === 0 && (
        <div style={{ ...card, textAlign:"center", padding:"2rem" }}>
          <div style={{ fontFamily:"var(--display)", color:"#edf4ff", fontSize:16, marginBottom:"0.35rem" }}>No matches</div>
          <p style={{ margin:0, color:"#8fa0bd", fontSize:13 }}>Clear the search or government filter to see all nations.</p>
        </div>
      )}
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
                  <div style={{ fontSize:12, color:"#d7e2f2", fontWeight:700 }}>{v}</div>
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
  const [form, setForm] = useState({ title:"", description:"", size:"medium" });

  const filtered = actions.filter(a=>tab==="active"?["pending","active"].includes(a.status):["complete","cancelled"].includes(a.status));

  const submit = async () => {
    if (!form.title.trim()||!form.description.trim()||!userNation) return;
    await supabase.from("canon_actions").insert({ nation_id:userNation.id, submitted_by:profile.id, ...form, estimated_days:ACTION_SIZES[form.size]?.days });
    setForm({ title:"", description:"", size:"medium" }); setShowForm(false); onRefresh();
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
const WarsPage = ({ wars, alliances, allianceMembers, warParticipants, nations, profile, userNation, isMod, onRefresh }) => {
  const [tab, setTab] = useState("wars");
  const [showWarForm, setShowWarForm] = useState(false);
  const [showAllyForm, setShowAllyForm] = useState(false);
  const [wf, setWf] = useState({ target_type:"nation", target_id:"", name:"", casus_belli:"", objective:"", casualties:"", result:"" });
  const [af, setAf] = useState({ name:"", description:"", type:"alliance" });

  const submitWar = async () => {
    if (!wf.target_id||!userNation) return;
    const legacyDefender = wf.target_type === "nation" ? wf.target_id : null;
    let { data, error } = await supabase.from("wars").insert({ aggressor_id:userNation.id, defender_id:legacyDefender, name:wf.name, casus_belli:wf.casus_belli, objective:wf.objective||null, casualties:wf.casualties||null, result:wf.result||null, outcome:wf.result||null }).select().single();
    if (error && /objective|casualties|result|schema cache|column/i.test(error.message || "")) {
      const retry = await supabase.from("wars").insert({
        aggressor_id:userNation.id,
        defender_id:legacyDefender,
        name:wf.name,
        casus_belli:wf.casus_belli,
        outcome:[wf.objective && `Objective: ${wf.objective}`, wf.casualties && `Casualties: ${wf.casualties}`, wf.result && `Result: ${wf.result}`].filter(Boolean).join("\n") || null,
      }).select().single();
      data = retry.data;
      error = retry.error;
    }
    if (error) {
      alert(error.message);
      return;
    }
    const participants = [
      { war_id:data.id, side:"attacker", nation_id:userNation.id, alliance_id:null },
      { war_id:data.id, side:"defender", nation_id:wf.target_type==="nation" ? wf.target_id : null, alliance_id:wf.target_type==="alliance" ? wf.target_id : null },
    ];
    const inserted = await supabase.from("war_participants").insert(participants);
    if (inserted.error) alert(inserted.error.message);
    setWf({target_type:"nation",target_id:"",name:"",casus_belli:"",objective:"",casualties:"",result:""}); setShowWarForm(false); onRefresh();
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
                <select value={wf.target_type} onChange={e=>setWf({...wf,target_type:e.target.value,target_id:""})} style={inp}>
                  <option value="nation">Target nation</option>
                  <option value="alliance">Target alliance</option>
                </select>
                <select value={wf.target_id} onChange={e=>setWf({...wf,target_id:e.target.value})} style={inp}>
                  <option value="">Select target {wf.target_type}</option>
                  {wf.target_type==="nation"
                    ? nations.filter(n=>n.id!==userNation?.id).map(n=><option key={n.id} value={n.id}>{n.name}</option>)
                    : alliances.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <input placeholder="War name (optional)" value={wf.name} onChange={e=>setWf({...wf,name:e.target.value})} style={inp} />
                <input placeholder="War objective" value={wf.objective} onChange={e=>setWf({...wf,objective:e.target.value})} style={inp} />
                <input placeholder="Expected casualties / losses" value={wf.casualties} onChange={e=>setWf({...wf,casualties:e.target.value})} style={inp} />
                <input placeholder="End result / terms (optional)" value={wf.result} onChange={e=>setWf({...wf,result:e.target.value})} style={inp} />
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
            {wars.map(w=><WarCard key={w.id} war={w} nations={nations} alliances={alliances} participants={warParticipants} isMod={isMod} onRefresh={onRefresh} />)}
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
              const editAlliance = async () => {
                const name = prompt("Alliance name", a.name);
                if (!name) return;
                const description = prompt("Alliance description", a.description || "") ?? a.description;
                const type = prompt("Alliance type", a.type || "alliance") || a.type;
                const { error } = await supabase.from("alliances").update({ name, description, type }).eq("id", a.id);
                if (error) alert(error.message); else onRefresh();
              };
              const deleteAlliance = async () => {
                if (!confirm("Delete this alliance?")) return;
                const { error } = await supabase.from("alliances").delete().eq("id", a.id);
                if (error) alert(error.message); else onRefresh();
              };
              return (
                <div key={a.id} style={card}>
                  <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"0.75rem", flexWrap:"wrap" }}>
                    <AllianceFlag alliance={a} size={38} />
                    <div style={{ fontFamily:"var(--display)", color:"#d4af37", fontSize:15, flex:1 }}>{a.name}</div>
                    <span style={{ fontSize:11, color:"#3498db", border:"1px solid rgba(52,152,219,0.25)", borderRadius:3, padding:"2px 8px" }}>{a.type?.toUpperCase()}</span>
                    {isMod && <AllianceFlagUploader allianceId={a.id} currentUrl={a.flag_url} onUploaded={onRefresh} />}
                    {isMod && <button onClick={editAlliance} style={{ ...mkBtn("ghost"), fontSize:11 }}>Edit</button>}
                    {isMod && <button onClick={deleteAlliance} style={{ ...mkBtn("red"), fontSize:11 }}>Delete</button>}
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
            <textarea placeholder="Full story. BBCode is supported: [b], [i], [quote], [url], [img]. Basic HTML tags like <b> and <blockquote> are also allowed." value={form.body} onChange={e=>setForm({...form,body:e.target.value})} style={{ ...ta, minHeight:120 }} />
            <label style={{ display:"flex", gap:"0.5rem", alignItems:"center", color:"#b7c6dc", fontSize:12, cursor:"pointer" }}>
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
              <h3 style={{ margin:"0 0 0.6rem", fontFamily:"var(--display)", color:"#f8fbff", fontSize:17 }}>{n.title}</h3>
              <RichText>{n.body}</RichText>
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
            <h3 style={{ margin:"0 0 0.6rem", fontFamily:"var(--display)", color:"#f8fbff", fontSize:17 }}>{n.title}</h3>
            <RichText>{n.body}</RichText>
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
                <span style={{ flex:1, fontSize:14, color:"#edf4ff", fontWeight:700 }}>{n.name}</span>
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
const Forums = ({ boards, threads, posts, reactions, profile, userNation, nations, isMod, onRefresh, onRequireAuth }) => {
  const [view, setView] = useState({ type:"boards" });
  const [threadForm, setThreadForm] = useState({ title:"", body:"" });
  const [replyBody, setReplyBody] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editBody, setEditBody] = useState("");
  const reactEmojis = ["👍","❤️","😂","🔥","👀","🫡"];

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
  const toggleReaction = async (postId, emoji) => {
    if (!profile) return onRequireAuth();
    const existing = reactions.find(r=>r.post_id===postId && r.user_id===profile.id && r.emoji===emoji);
    const result = existing
      ? await supabase.from("forum_reactions").delete().eq("id", existing.id)
      : await supabase.from("forum_reactions").insert({ post_id:postId, user_id:profile.id, emoji });
    if (result.error) alert(result.error.message); else onRefresh();
  };
  const savePost = async (postId) => {
    const { error } = await supabase.from("forum_posts").update({ body:editBody }).eq("id", postId);
    if (error) alert(error.message);
    else { setEditingPost(null); setEditBody(""); onRefresh(); }
  };
  const deletePost = async (postId) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("forum_posts").delete().eq("id", postId);
    if (error) alert(error.message); else onRefresh();
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
    else { setView({ type:"boards" }); onRefresh(); }
  };

  if (view.type==="boards") {
    return (
      <div>
        <h2 style={{ margin:"0 0 0.35rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:20 }}>Boards</h2>
        {!profile && <p style={{ margin:"0 0 1.25rem", color:"#8fa0bd", fontSize:13 }}>Public viewing is open. Sign in to create threads or post replies.</p>}
        <div className="board-list" style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
          {boards.map(b=>{
            const bThreads = threads.filter(t=>t.board_id===b.id);
            const lastThread = bThreads[0];
            const icon = b.icon || BOARD_ICONS[b.slug] || "•";
            return (
              <div className="board-card" key={b.id} style={{ ...card, cursor:"pointer", transition:"border-color 0.18s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(212,175,55,0.38)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(212,175,55,0.1)"}
                onClick={()=>setView({type:"board",board:b})}>
                <div className="board-card-row" style={{ display:"flex", gap:"1rem", alignItems:"center" }}>
                  <div className="board-icon" aria-hidden="true" style={{ fontSize:22, width:28, textAlign:"center", flexShrink:0 }}>{icon}</div>
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
          <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:20, flex:1 }}>{view.board.icon || BOARD_ICONS[view.board.slug] || "•"} {view.board.name}</h2>
          {profile && <button onClick={()=>setShowNewThread(!showNewThread)} style={mkBtn()}>+ New Thread</button>}
          {!profile && <button onClick={onRequireAuth} style={mkBtn("ghost")}>Sign In to Post</button>}
        </div>
        {showNewThread && (
          <div style={{ ...card, border:"1px solid rgba(212,175,55,0.28)", marginBottom:"1rem" }}>
            <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>New Thread in {view.board.name}</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              <input placeholder="Thread title" value={threadForm.title} onChange={e=>setThreadForm({...threadForm,title:e.target.value})} style={inp} />
              <textarea placeholder="Opening post. BBCode is supported: [b], [i], [quote], [url], [img]. Basic HTML tags like <b> and <blockquote> are also allowed." value={threadForm.body} onChange={e=>setThreadForm({...threadForm,body:e.target.value})} style={ta} />
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
                  <div style={{ fontSize:13, color:"#edf4ff", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.pinned&&"Pinned: "}{t.title}</div>
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
    const canManageThread = isMod || view.thread.author_id === profile?.id;
    return (
      <div>
        <button onClick={()=>setView({type:"board",board})} style={{ ...mkBtn("ghost"), marginBottom:"1rem", fontSize:12 }}>{board?.name}</button>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap", marginBottom:"1.25rem" }}>
          <h2 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:18, lineHeight:1.4, flex:1 }}>{view.thread.title}</h2>
          {canManageThread && <button onClick={()=>setThreadLocked(!view.thread.locked)} style={{ ...mkBtn("ghost"), fontSize:11 }}>{view.thread.locked?"Open Thread":"Close Thread"}</button>}
          {canManageThread && <button onClick={deleteThread} style={{ ...mkBtn("red"), fontSize:11 }}>Delete Thread</button>}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", marginBottom:"1.25rem" }}>
          {tPosts.map((p,i)=>{
            const pNation = nations.find(n=>n.id===p.nation_id);
            const authorAvatar = p.profiles?.avatar_url;
            const authorName = p.profiles?.username || "Unknown";
            return (
              <div className="post-card forum-post-layout" key={p.id} style={{ ...card, borderLeft:i===0?"2px solid rgba(212,175,55,0.3)":undefined }}>
                <aside className="post-author" style={{ width:150, flexShrink:0 }}>
                  {authorAvatar
                    ? <img src={authorAvatar} alt="" style={{ width:96, height:96, borderRadius:"50%", objectFit:"cover", border:"1px solid rgba(246,193,50,0.2)" }} />
                    : pNation ? <Flag nation={pNation} size={96} /> : <div style={{ width:96, height:96, background:"rgba(255,255,255,0.04)", borderRadius:"50%" }} />}
                  <div style={{ marginTop:"0.65rem", fontSize:13, color:"#d4af37", fontWeight:800, lineHeight:1.35 }}>@{authorName}</div>
                  {pNation && <div style={{ marginTop:"0.25rem", fontSize:11, color:"#8fa0bd", lineHeight:1.35 }}>{pNation.name}</div>}
                  {i===0 && <div style={{ display:"inline-block", marginTop:"0.45rem", fontSize:10, color:"#d4af37", border:"1px solid rgba(212,175,55,0.25)", borderRadius:3, padding:"1px 5px" }}>OP</div>}
                  <div style={{ marginTop:"0.45rem", fontSize:11, color:"#8fa0bd" }}>{timeAgo(p.created_at)}</div>
                </aside>
                <div className="post-body" style={{ flex:1, minWidth:0 }}>
                  {editingPost===p.id ? (
                    <div>
                      <textarea value={editBody} onChange={e=>setEditBody(e.target.value)} style={{ ...ta, minHeight:120 }} />
                      <div style={{ display:"flex", gap:"0.4rem", marginTop:"0.5rem" }}>
                        <button onClick={()=>savePost(p.id)} style={{ ...mkBtn(), fontSize:11 }}>Save</button>
                        <button onClick={()=>setEditingPost(null)} style={{ ...mkBtn("ghost"), fontSize:11 }}>Cancel</button>
                      </div>
                    </div>
                  ) : <RichText>{p.body}</RichText>}
                  {p.profiles?.signature_url && <img className="post-signature" src={p.profiles.signature_url} alt="" />}
                  <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap", marginTop:"0.75rem", alignItems:"center" }}>
                    {reactEmojis.map(e=>{
                      const count = reactions.filter(r=>r.post_id===p.id && r.emoji===e).length;
                      const active = reactions.some(r=>r.post_id===p.id && r.user_id===profile?.id && r.emoji===e);
                      return <button key={e} onClick={()=>toggleReaction(p.id,e)} style={{ ...mkBtn(active?"gold":"ghost"), minHeight:28, padding:"3px 7px", fontSize:12 }}>{e}{count>0?` ${count}`:""}</button>;
                    })}
                    {(isMod || p.author_id===profile?.id) && <button onClick={()=>{setEditingPost(p.id);setEditBody(p.body);}} style={{ ...mkBtn("ghost"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Edit</button>}
                    {(isMod || p.author_id===profile?.id) && <button onClick={()=>deletePost(p.id)} style={{ ...mkBtn("red"), minHeight:28, padding:"3px 7px", fontSize:10 }}>Delete</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {profile && !view.thread.locked && (
          <div style={card}>
            <h3 style={{ margin:"0 0 0.75rem", fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Post Reply</h3>
            <textarea placeholder="Write your reply. BBCode is supported: [b], [i], [quote], [url], [img]. Basic HTML tags like <b> and <blockquote> are also allowed." value={replyBody} onChange={e=>setReplyBody(e.target.value)} style={ta} />
            <button onClick={submitReply} style={{ ...mkBtn(), marginTop:"0.6rem" }}>Post Reply</button>
          </div>
        )}
        {view.thread.locked && <div style={{ ...card, textAlign:"center", color:"#8fa0bd", fontSize:13, fontStyle:"italic" }}>This thread is locked.</div>}
      </div>
    );
  }
};

// ─── ADMIN ────────────────────────────────────────────────────────
const Admin = ({ nations, profiles, onRefresh, isAdmin }) => {
  const [tab, setTab] = useState("add");
  const blank = { name:"",government:"",ideology:"",population:"",gdp_usd:"",land_km2:"",army_rank:"",hdi:"",economy:"",bio:"",diplomatic_status:"",bloc:"" };
  const [nf, setNf] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [assignNId, setAssignNId] = useState(""); const [assignPId, setAssignPId] = useState("");
  const [roleId, setRoleId] = useState(""); const [role, setRole] = useState("player");

  const submitNation = async () => {
    if (!nf.name.trim()) return;
    const payload = { name:nf.name, slug:slugify(nf.name), government:nf.government||null, ideology:nf.ideology||null, population:nf.population?parseInt(nf.population):null, gdp_usd:nf.gdp_usd?parseInt(nf.gdp_usd):null, land_km2:nf.land_km2?parseInt(nf.land_km2):null, army_rank:nf.army_rank?parseInt(nf.army_rank):null, hdi:nf.hdi?parseFloat(nf.hdi):null, economy:nf.economy||null, bio:nf.bio||null, diplomatic_status:nf.diplomatic_status||null, bloc:nf.bloc||null };
    if (editId) { await supabase.from("nations").update(payload).eq("id",editId); setEditId(null); }
    else await supabase.from("nations").insert(payload);
    setNf(blank); onRefresh();
  };

  const loadEdit = n => { setEditId(n.id); setNf({ name:n.name||"",government:n.government||"",ideology:n.ideology||"",population:n.population||"",gdp_usd:n.gdp_usd||"",land_km2:n.land_km2||"",army_rank:n.army_rank||"",hdi:n.hdi||"",economy:n.economy||"",bio:n.bio||"",diplomatic_status:n.diplomatic_status||"",bloc:n.bloc||"" }); setTab("add"); window.scrollTo(0,0); };

  const assignNation = async () => {
    if (!assignNId || !assignPId) return;
    const { error } = await supabase.rpc("assign_nation_as_staff", { target_profile: assignPId, target_nation: assignNId });
    if (error) {
      alert(error.message);
      return;
    }
    setAssignNId("");
    setAssignPId("");
    onRefresh();
  };

  const fields = [["name","Nation Name *"],["government","Government"],["ideology","Ideology"],["population","Population"],["gdp_usd","GDP (USD number)"],["land_km2","Land km2"],["army_rank","Army Rank 0-11"],["hdi","HDI 0.00-1.00"],["economy","Economy Sectors"],["diplomatic_status","Diplomatic Status"],["bloc","Bloc / Alliance"]];
  const tabs = [["add",editId?"Edit Nation":"Add Nation"],["assign","Assign Nations"],...(isAdmin ? [["roles","Manage Roles"]] : []),["list","Nation List"]];

  return (
    <div>
      <h2 style={{ margin:"0 0 1.25rem", fontFamily:"var(--display)", color:"#e74c3c", fontSize:20 }}>{isAdmin ? "Admin Panel" : "Lore Team Panel"}</h2>
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        {tabs.map(([t,l])=>(
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
            <p style={{ gridColumn:"1/-1", margin:"0.25rem 0 0", color:"#8fa0bd", fontSize:12 }}>Flags are uploaded by players as JPEG or PNG images from their nation profile.</p>
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
          <button onClick={assignNation} style={mkBtn()}>Assign Nation</button>
        </div>
      )}

      {isAdmin && tab==="roles" && (
        <div style={{ ...card, display:"flex", flexDirection:"column", gap:"0.75rem", maxWidth:480 }}>
          <h3 style={{ margin:0, fontFamily:"var(--display)", color:"#d4af37", fontSize:14 }}>Assign Player Role</h3>
          <select value={roleId} onChange={e=>setRoleId(e.target.value)} style={inp}>
            <option value="">Select player</option>
            {profiles.map(p=><option key={p.id} value={p.id}>@{p.username} - {p.role}</option>)}
          </select>
          <select value={role} onChange={e=>setRole(e.target.value)} style={inp}>
            <option value="player">Player</option>
            <option value="lore">Lore Team</option>
            <option value="mod">Mod (Legacy Lore Team)</option>
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
                <div style={{ fontSize:13, color:"#edf4ff", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.name}</div>
                <div style={{ fontSize:11, color:"#8fa0bd" }}>{n.government||"?"} - {(n.owner || n.profiles)?`@${(n.owner || n.profiles).username}`:"unassigned"}</div>
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
const StaffTools = ({ isAdmin, page, navigate, setShowSetup, counts }) => (
  <div className="staff-tools" style={{ position:"sticky", top:50, zIndex:150, background:"rgba(3,7,13,0.96)", borderBottom:"1px solid rgba(78,128,190,0.24)", backdropFilter:"blur(16px)" }}>
    <div style={{ maxWidth:980, margin:"0 auto", padding:"0.45rem 1rem", display:"flex", gap:"0.4rem", alignItems:"center", overflowX:"auto", scrollbarWidth:"none" }}>
      <span style={{ fontSize:10, color:"#8fa0bd", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0 }}>{isAdmin ? "Admin Tools" : "Lore Tools"}</span>
      {[
        ["admin", isAdmin ? "Admin Panel" : "Lore Panel"],
        ["nations", `Nations ${counts.nations}`],
        ["wars", `Wars ${counts.wars}`],
        ["actions", `Actions ${counts.actions}`],
        ["news", "News"],
      ].map(([id,label])=>(
        <button key={id} onClick={()=>navigate(id)} style={{ ...mkBtn(page===id?"gold":"ghost"), minHeight:30, padding:"5px 9px", fontSize:10.5 }}>{label}</button>
      ))}
      <button onClick={()=>setShowSetup(true)} style={{ ...mkBtn("ghost"), minHeight:30, padding:"5px 9px", fontSize:10.5, marginLeft:"auto" }}>Setup SQL</button>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState("forums");
  const [showSetup, setShowSetup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState({ nations:[], profiles:[], news:[], posts:[], actions:[], wars:[], warParticipants:[], alliances:[], allianceMembers:[], boards:[], threads:[], forumPosts:[], forumReactions:[] });
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [dbIssues, setDbIssues] = useState([]);

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
    const [nations, profiles, news, posts, actions, wars, warParticipants, alliances, allianceMembers, boards, threads, forumPosts, forumReactions] = await Promise.all([
      run("Nations", supabase.from("nations").select("*, owner:owner_id(username)").order("name"),
        () => supabase.from("nations").select("*").order("name")),
      supabase.from("profiles").select("*").order("username"),
      supabase.from("news").select("*").order("created_at",{ascending:false}),
      supabase.from("rp_posts").select("*, nations(name,flag_url), target_nation_id").order("created_at",{ascending:false}).limit(100),
      supabase.from("canon_actions").select("*, nations(name,flag_url), action_updates(*, profiles(username))").order("created_at",{ascending:false}),
      supabase.from("wars").select("*, aggressor:aggressor_id(name,flag_url), defender:defender_id(name,flag_url)").order("started_at",{ascending:false}),
      run("War participants", supabase.from("war_participants").select("*").order("created_at"),
        error => /could not find|does not exist|schema cache/i.test(error.message || "") ? Promise.resolve({ data:[], error:null }) : Promise.resolve({ data:null, error })),
      supabase.from("alliances").select("*").order("created_at",{ascending:false}),
      supabase.from("alliance_members").select("*"),
      supabase.from("forum_boards").select("*").order("sort_order"),
      run("Forum threads", supabase.from("forum_threads").select("*, profiles(username,avatar_url)").order("created_at",{ascending:false}),
        error => isMissingOptionalProfileSchema(error) ? supabase.from("forum_threads").select("*, profiles(username)").order("created_at",{ascending:false}) : Promise.resolve({ data:null, error })),
      run("Forum posts", supabase.from("forum_posts").select("*, profiles(username,avatar_url,signature_url,bio)").order("created_at",{ascending:true}),
        error => isMissingOptionalProfileSchema(error) ? supabase.from("forum_posts").select("*, profiles(username)").order("created_at",{ascending:true}) : Promise.resolve({ data:null, error })),
      run("Forum reactions", supabase.from("forum_reactions").select("*").order("created_at"),
        error => /could not find|does not exist|schema cache/i.test(error.message || "") ? Promise.resolve({ data:[], error:null }) : Promise.resolve({ data:null, error })),
    ]);
    const unwrap = result => Array.isArray(result) ? result : (result.data || []);
    const plainWars = unwrap(wars);
    const plainWarParticipants = warParticipants;
    const warsWithParticipants = plainWars.map(w => ({
      ...w,
      war_participants: plainWarParticipants.filter(p => p.war_id === w.id),
    }));
    setData({ nations, profiles:unwrap(profiles), news:unwrap(news), posts:unwrap(posts), actions:unwrap(actions), wars:warsWithParticipants, warParticipants:plainWarParticipants, alliances:unwrap(alliances), allianceMembers:unwrap(allianceMembers), boards:unwrap(boards), threads, forumPosts, forumReactions });
    setDbIssues(issues);
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
      }
      fetchAll();
    });
    supabase.auth.onAuthStateChange((_,session) => {
      if(session?.user) {
        setUser(session.user);
        ensureProfile(session.user).then(p=>{if(p)setProfile(p);}).catch(console.error);
      } else {
        setUser(null);
        setProfile(null);
      }
    });
  }, [fetchAll]);

  if (!SUPABASE_CONFIGURED) return <SetupModal onClose={()=>{}} />;

  const userNation = profile?.nation_id ? data.nations.find(n=>n.id===profile.nation_id) : null;
  const isAdmin = profile?.role==="admin";
  const isLoreTeam = ["lore","mod","admin"].includes(profile?.role);

  const nav = [
    {id:"forums",label:"Boards"},
    {id:"nations",label:"Nations"},
    {id:"leaderboards",label:"Leaderboards"},
    {id:"news",label:"News"},
    ...(user ? [
      {id:"profile",label:"Profile"},
      {id:"rp",label:"Dispatches"},
      {id:"actions",label:"Actions"},
      {id:"wars",label:"Wars and Alliances"},
      {id:"home",label:"Overview"},
    ] : []),
  ];

  const navigate = (id) => { setPage(id); setMenuOpen(false); };
  const updateProfile = (nextProfile) => {
    setProfile(nextProfile);
    setData(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => p.id === nextProfile.id ? nextProfile : p),
    }));
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      {showSetup && <SetupModal onClose={()=>setShowSetup(false)} />}

      {/* HEADER */}
      <header className="app-header" style={{ background:"rgba(3,4,7,0.98)", borderBottom:"1px solid rgba(20,96,184,0.36)", padding:"0 1.25rem", display:"flex", alignItems:"center", gap:"1rem", height:50, position:"sticky", top:0, zIndex:200, backdropFilter:"blur(20px)" }}>
        <div className="brand" style={{ display:"flex", alignItems:"center", gap:"0.55rem", cursor:"pointer", flexShrink:0 }} onClick={()=>navigate("forums")}>
          <img className="brand-logo" src={LOGO_SRC} alt="Nationwheel" style={{ width:34, height:34, objectFit:"cover", borderRadius:"50%", border:"1px solid rgba(246,193,50,0.35)" }} />
          <span className="brand-name" style={{ fontFamily:"var(--brand)", color:"#f5f8ff", fontSize:15, letterSpacing:"0.08em", fontWeight:900 }}>NATIONWHEEL</span>
        </div>
        {/* Desktop nav */}
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
            <button onClick={()=>navigate("profile")} style={{ background:"transparent", border:"none", padding:0, minHeight:0, color:"#9fb4d6", fontSize:11, cursor:"pointer" }}>@{profile?.username || user.email?.split("@")[0] || "profile"}</button>
            {isLoreTeam && <span style={{ fontSize:9, color:"#3498db", border:"1px solid #3498db33", borderRadius:3, padding:"1px 5px", letterSpacing:"0.06em" }}>{profile?.role === "lore" ? "LORE" : profile?.role?.toUpperCase()}</span>}
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
          setShowSetup={setShowSetup}
          counts={{
            nations:data.nations.length,
            wars:data.wars.filter(w=>w.status!=="peace").length,
            actions:data.actions.filter(a=>["pending","active"].includes(a.status)).length,
          }}
        />
      )}

      <main className="app-main" style={{ maxWidth:980, margin:"0 auto", padding:"1.5rem 1rem", width:"100%", flex:1 }}>
        {dbIssues.length > 0 && (
          <div style={{ ...card, border:"1px solid rgba(225,29,29,0.34)", background:"linear-gradient(180deg,rgba(62,12,12,0.88),rgba(17,9,9,0.92))", marginBottom:"1rem" }}>
            <div style={{ fontFamily:"var(--display)", color:"#ffd7d7", fontWeight:800, fontSize:14, marginBottom:"0.35rem" }}>Database setup needs one update</div>
            <p style={{ margin:"0 0 0.6rem", color:"#f0c2c2", fontSize:12, lineHeight:1.6 }}>
              Public pages are still loading with fallbacks, but profile media needs the latest setup SQL in Supabase.
            </p>
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
              <button onClick={()=>setShowSetup(true)} style={{ ...mkBtn("ghost"), fontSize:11 }}>Open Setup SQL</button>
              <span style={{ color:"#cfa0a0", fontSize:11, alignSelf:"center" }}>Run supabase-profile-setup.sql, then refresh.</span>
            </div>
          </div>
        )}
        {loading
          ? <div style={{ textAlign:"center", padding:"5rem", color:"#8493ad", fontFamily:"var(--display)", letterSpacing:"0.2em", fontSize:13 }}>LOADING WORLD</div>
          : <>
              {page==="home"         && <Home nations={data.nations} news={data.news} actions={data.actions} wars={data.wars} />}
              {page==="nations"      && <Nations nations={data.nations} posts={data.posts} actions={data.actions} wars={data.wars} alliances={data.alliances} allianceMembers={data.allianceMembers} profile={profile} userNation={userNation} isMod={isLoreTeam} isAdmin={isAdmin} onRefresh={fetchAll} />}
              {page==="rp"           && <RPBoard posts={data.posts} profile={profile} userNation={userNation} nations={data.nations} onRefresh={fetchAll} />}
              {page==="actions"      && <ActionsPage actions={data.actions} profile={profile} userNation={userNation} nations={data.nations} isMod={isLoreTeam} onRefresh={fetchAll} />}
              {page==="wars"         && <WarsPage wars={data.wars} alliances={data.alliances} allianceMembers={data.allianceMembers} warParticipants={data.warParticipants} nations={data.nations} profile={profile} userNation={userNation} isMod={isLoreTeam} onRefresh={fetchAll} />}
              {page==="news"         && <NewsPage news={data.news} profile={profile} isMod={isLoreTeam} onRefresh={fetchAll} />}
              {page==="leaderboards" && <Leaderboards nations={data.nations} />}
              {page==="profile" && user && profile && <ProfilePage user={user} profile={profile} userNation={userNation} onProfileUpdate={updateProfile} />}
              {page==="forums"       && <Forums boards={data.boards} threads={data.threads} posts={data.forumPosts} reactions={data.forumReactions} profile={profile} userNation={userNation} nations={data.nations} isMod={isLoreTeam} onRefresh={fetchAll} onRequireAuth={()=>navigate("auth")} />}
              {page==="auth"         && <Auth setupRequired={setupRequired} onAuth={(u,p)=>{setUser(u);if(p)setProfile(p);else ensureProfile(u).then(next=>{if(next)setProfile(next);}).catch(console.error);fetchAll();setPage("forums");}} />}
              {page==="admin" && isLoreTeam && <Admin nations={data.nations} profiles={data.profiles} onRefresh={fetchAll} isAdmin={isAdmin} />}
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
        .post-signature{display:block;max-width:100%;max-height:120px;object-fit:contain;margin-top:1rem;padding-top:0.85rem;border-top:1px solid rgba(20,96,184,0.16);}
        .forum-post-layout{display:flex;gap:1.1rem;align-items:flex-start;}
        .post-author{border-right:1px solid rgba(20,96,184,0.16);padding-right:1rem;}
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
          .staff-tools{top:104px!important;}
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
          .forum-post-layout{display:block!important;}
          .post-author{width:auto!important;border-right:none!important;border-bottom:1px solid rgba(20,96,184,0.16);padding:0 0 0.85rem!important;margin-bottom:0.85rem;display:grid;grid-template-columns:auto 1fr;column-gap:0.85rem;align-items:center;}
          .post-author img,.post-author > div:first-child{grid-row:1 / span 3;}
          .profile-grid{grid-template-columns:1fr!important;}
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
      `}</style>
    </div>
  );
}

