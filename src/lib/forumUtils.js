export const FORUM_CATEGORIES = [
  {
    slug: "announcements",
    name: "Announcements",
    description: "Official updates and site-wide information.",
    sort: 1,
    boards: ["news-updates", "rules", "staff-notices"],
  },
  {
    slug: "out-of-character",
    name: "Out of Character",
    description: "Community discussion, help, and planning outside the canon world.",
    sort: 2,
    boards: ["general-chat", "questions-support", "suggestions"],
  },
  {
    slug: "in-character",
    name: "In Character",
    description: "World-facing posts, diplomacy, propaganda, trade, and intelligence.",
    sort: 3,
    boards: ["world-news", "diplomacy", "war-room", "trade", "intelligence", "propaganda", "cultural-exchange"],
  },
  {
    slug: "nation-roleplay",
    name: "Nation Roleplay",
    description: "Nation introductions, embassies, treaties, military actions, and canon actions.",
    sort: 4,
    boards: ["nation-introductions", "embassies", "treaties", "military-actions", "canon-actions"],
  },
  {
    slug: "archives",
    name: "Archives",
    description: "Closed seasons, old wars, and retired treaty records.",
    sort: 5,
    boards: ["season-archives", "old-wars", "old-treaties"],
  },
  {
    slug: "staff-area",
    name: "Staff Area",
    description: "Moderation, reports, lore review, and administrative records.",
    sort: 6,
    boards: ["staff-room", "reports", "lore-team", "admin-logs", "canon-review", "disciplinary-records"],
  },
];

export const FORUM_BOARDS = [
  { slug: "news-updates", name: "News & Updates", desc: "Official announcements and development updates.", icon: "📣", sort: 1 },
  { slug: "rules", name: "Rules", desc: "Site rules, roleplay rules, and canon standards.", icon: "📜", sort: 2 },
  { slug: "staff-notices", name: "Staff Notices", desc: "Important staff notices for the community.", icon: "📌", sort: 3 },
  { slug: "general-chat", name: "General Chat", desc: "General community chat.", icon: "💬", sort: 4 },
  { slug: "questions-support", name: "Questions & Support", desc: "Help, onboarding, and bug reports.", icon: "❓", sort: 5 },
  { slug: "suggestions", name: "Suggestions", desc: "Ideas for the app, lore, and community.", icon: "💡", sort: 6 },
  { slug: "world-news", name: "World News", desc: "In-character news and public world events.", icon: "📰", sort: 7 },
  { slug: "diplomacy", name: "Diplomacy", desc: "Treaties, negotiations, alliances, and relations.", icon: "🤝", sort: 8 },
  { slug: "war-room", name: "War Room", desc: "Military strategy, wars, and battle reports.", icon: "⚔️", sort: 9 },
  { slug: "trade", name: "Trade", desc: "Economic deals, markets, and logistics.", icon: "💱", sort: 10 },
  { slug: "intelligence", name: "Intelligence", desc: "Espionage, leaks, and covert operations.", icon: "🔎", sort: 11 },
  { slug: "propaganda", name: "Propaganda", desc: "State media, narratives, and public messaging.", icon: "📢", sort: 12 },
  { slug: "cultural-exchange", name: "Cultural Exchange", desc: "Arts, faith, culture, and soft power.", icon: "🎭", sort: 13 },
  { slug: "nation-introductions", name: "Nation Introductions", desc: "Introduce your nation, history, and culture.", icon: "🌐", sort: 14 },
  { slug: "embassies", name: "Embassies", desc: "Embassy threads and diplomatic offices.", icon: "🏛️", sort: 15 },
  { slug: "treaties", name: "Treaties", desc: "Treaty drafts, signings, and treaty archives.", icon: "🖋️", sort: 16 },
  { slug: "military-actions", name: "Military Actions", desc: "Military movement and conflict actions.", icon: "🛡️", sort: 17 },
  { slug: "canon-actions", name: "Canon Actions", desc: "Canon action discussion, outcomes, and lore clarification.", icon: "🧭", sort: 18 },
  { slug: "season-archives", name: "Season Archives", desc: "Completed seasons and historical records.", icon: "🗄️", sort: 19, visibility: "archived" },
  { slug: "old-wars", name: "Old Wars", desc: "Retired conflict records.", icon: "🪖", sort: 20, visibility: "archived" },
  { slug: "old-treaties", name: "Old Treaties", desc: "Retired treaty records.", icon: "📚", sort: 21, visibility: "archived" },
  { slug: "staff-room", name: "Staff Room", desc: "Private staff coordination.", icon: "🧑‍⚖️", sort: 22, visibility: "staff" },
  { slug: "reports", name: "Reports", desc: "Reported content and moderation queue.", icon: "🚩", sort: 23, visibility: "staff" },
  { slug: "lore-team", name: "Lore Team", desc: "Lore review and canon planning.", icon: "🧠", sort: 24, visibility: "staff" },
  { slug: "admin-logs", name: "Admin Logs", desc: "Administrative records and audit notes.", icon: "🔐", sort: 25, visibility: "staff" },
  { slug: "canon-review", name: "Canon Review", desc: "Canon review queue and decisions.", icon: "✅", sort: 26, visibility: "staff" },
  { slug: "disciplinary-records", name: "Disciplinary Records", desc: "Private warnings and disciplinary notes.", icon: "⚖️", sort: 27, visibility: "staff" },
];

export const BOARD_ICONS = Object.fromEntries(FORUM_BOARDS.map(board => [board.slug, board.icon]));
export const BOARD_META = Object.fromEntries(FORUM_BOARDS.map(board => [board.slug, board]));

export const boardMeta = board => BOARD_META[board?.slug] || {};

export const boardVisibility = board => board?.visibility || boardMeta(board).visibility || "public";

export const boardStatusLabel = visibility => {
  if (visibility === "members") return "Members";
  if (visibility === "staff") return "Staff";
  if (visibility === "hidden") return "Hidden";
  if (visibility === "archived") return "Archived";
  return "Public";
};

export const categoryForBoard = board => {
  const slug = board?.slug;
  return FORUM_CATEGORIES.find(category => category.boards.includes(slug));
};

