import { BOARD_ICONS } from "./forumUtils";

export const ACTION_SIZES = {
  small:  { days: 1,  label: "Small",  color: "#4caf50" },
  medium: { days: 3,  label: "Medium", color: "#f39c12" },
  large:  { days: 7,  label: "Large",  color: "#e67e22" },
  major:  { days: 14, label: "Major",  color: "#e74c3c" },
  epic:   { days: 21, label: "Epic",   color: "#9b59b6" },
};
export const STATUS_COL = { pending:"#7f8c8d", active:"#3498db", complete:"#2ecc71", cancelled:"#e74c3c" };
export const WAR_COL    = { active:"#e74c3c", ceasefire:"#3498db", frozen:"#3498db", stalemate:"#f39c12", peace:"#2ecc71" };
export const POST_TYPES = ["Dispatch","Official Statement","Declaration","Intelligence","Propaganda","Treaty Proposal","Ultimatum"];
export const POST_COLS  = { Dispatch:"#3498db", "Official Statement":"#9b59b6", Declaration:"#d4af37", Intelligence:"#e67e22", Propaganda:"#e74c3c", "Treaty Proposal":"#2ecc71", Ultimatum:"#c0392b" };
export const NEWS_CATS  = ["announcement","war","diplomacy","economy","lore","community"];
export const NEWS_COL   = { announcement:"#d4af37", war:"#e74c3c", diplomacy:"#3498db", economy:"#2ecc71", lore:"#9b59b6", community:"#e67e22" };
export const PAGE_PATHS = {
  forums: "/forums",
  nations: "/nations",
  leaderboards: "/leaderboards",
  changelog: "/changelog",
  news: "/news",
  profile: "/profile",
  rp: "/dispatches",
  actions: "/actions",
  wars: "/wars",
  home: "/overview",
  auth: "/auth",
  admin: "/admin",
};
export const FORUM_PAGE_SIZE = 25;

export const LOGO_SRC = "/nationwheel_logo.jpg";
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAADPbfZKKuhz6dC9R";
export const SITE_CODE_FILES = import.meta.glob("../**/*.{js,jsx}", { query: "?raw", import: "default", eager: true });

export const CHANGELOG_ENTRIES = [
  {
    date: "2026-05-15",
    title: "Forum moderation and profile polish",
    items: [
      "Added canon and non-canon forum post labels for lore team moderation.",
      "Expanded BBCode formatting with color, size, horizontal rules, lists, and alignment.",
      "Added Admin CP user controls, code viewer, and changelog tools.",
      "Removed public email display and cleaned profile name presentation.",
    ],
  },
  {
    date: "2026-05-15",
    title: "Thread reply layout",
    items: [
      "Opening posts stay pinned above replies.",
      "Replies can be sorted newest-first or oldest-first.",
      "Forum editors gained more writing space.",
    ],
  },
  {
    date: "2026-05-17",
    title: "Site-wide polish — profiles, wars, alliances, and admin",
    items: [
      "Forum signatures now support text (in addition to images) with a remove option.",
      "Profile page redesigned with signature text editor, bio preview, and upload improvements.",
      "Public profile pages display text and image signatures.",
      "Wars tab now groups active and historical conflicts separately.",
      "Alliance cards show member counts, empty states, and pill-shaped type badges.",
      "Admin panel users tab got empty states, sticky moderation panel, and clearer labels.",
      "Dispatch board, actions page, and nation profile all got styled empty states and count headers.",
      "Nation cards use CSS hover instead of inline JS handlers.",
      "Registration now validates username is filled before submitting.",
      "Thread view loads with scroll-to-top and animated loading spinners.",
    ],
  },
  {
    date: "2026-05-17",
    title: "Notifications, in-game calendar, and mention system",
    items: [
      "In-game calendar added: Day 44, 4488 displayed in footer and staff tools.",
      "Lore team can advance the game day with a +1 Day button in staff tools.",
      "Notification system with bell icon in header — unread badge + dropdown feed.",
      "Notifications created on: @username mentions in forum posts and dispatches.",
      "Notifications created on: thread replies, war declarations, and action status changes.",
      "Notifications table and advance_game_day RPC added to Supabase setup SQL.",
      "New supabase-notifications-setup.sql file for the required schema.",
    ],
  },
  {
    date: "2026-05-17",
    title: "Nation leaders, alliance requests, private boards, and inbox",
    items: [
      "New 'leader' role automatically assigned when a user gets a nation.",
      "Leaders can edit their nation profile (bio, flag, diplomatic status, bloc) while lore/admin edit stats.",
      "Alliance join requests: leaders request to join, alliance leadership approves/rejects.",
      "Leaders can leave alliances they've joined.",
      "Each alliance has private discussion boards visible only to members.",
      "Nation leaders have a private inbox for direct messages to other leaders.",
      "New supabase-alliance-leader-setup.sql for all new tables, RLS policies, and RPC updates.",
    ],
  },
];

export const REACT_EMOJIS = ["\u{1F44D}","\u2764\uFE0F","\u{1F602}","\u{1F525}","\u{1F440}","\u{1FAE1}"];

// In-game calendar
export const GAME_DAYS_PER_YEAR = 365;
export const fmtGameDate = (day, year) => {
  if (!day || !year) return "Day 1, 4488";
  return `Day ${day}, ${year}`;
};
