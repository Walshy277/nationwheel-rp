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
];

export const REACT_EMOJIS = ["\u{1F44D}","\u2764\uFE0F","\u{1F602}","\u{1F525}","\u{1F440}","\u{1FAE1}"];
