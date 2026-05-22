import { useMemo, useState } from "react";
import { BOARD_ICONS, FORUM_CATEGORIES, boardMeta, boardStatusLabel, boardVisibility } from "../lib/forumUtils";
import { isLoreTeam } from "../lib/permissions";

const visibilityTone = visibility => {
  if (visibility === "staff") return { color: "#8bd3ff", border: "rgba(52,152,219,0.38)" };
  if (visibility === "archived") return { color: "#c4cad5", border: "rgba(196,202,213,0.25)" };
  if (visibility === "hidden") return { color: "#ff9d9d", border: "rgba(231,76,60,0.35)" };
  if (visibility === "members") return { color: "#f6c132", border: "rgba(246,193,50,0.34)" };
  return { color: "#86efac", border: "rgba(46,204,113,0.32)" };
};

const ForumIndex = ({ boards, profile, onSelectBoard, onRequireAuth, card, mkBtn, timeAgo }) => {
  const [collapsed, setCollapsed] = useState({});

  const isStaff = isLoreTeam(profile);

  const grouped = useMemo(() => {
    const boardBySlug = Object.fromEntries(boards.map(board => [board.slug, board]));
    return FORUM_CATEGORIES.map(category => ({
      ...category,
      boards: category.boards
        .map(slug => boardBySlug[slug])
        .filter(Boolean)
        .filter(board => {
          const vis = boardVisibility(board);
          if (vis === "staff" || vis === "hidden") return isStaff;
          return true;
        })
        .sort((a, b) => (a.sort_order ?? boardMeta(a).sort ?? 0) - (b.sort_order ?? boardMeta(b).sort ?? 0)),
    })).filter(category => category.boards.length > 0);
  }, [boards, isStaff]);

  return (
    <div className="forum-index">
      <div className="forum-index-head">
        <div>
          <h2>Boards</h2>
          <p>Public forum index for Nationwheel roleplay, canon discussion, diplomacy, wars, and staff areas.</p>
        </div>
        {!profile && <button onClick={onRequireAuth} style={mkBtn("ghost")}>Sign In to Post</button>}
      </div>

      <div className="forum-categories">
        {grouped.map(category => {
          const isCollapsed = collapsed[category.slug];
          const unread = category.boards.some(board => Number(board.thread_count || 0) > 0);
          return (
            <section key={category.slug} className="forum-category" style={card}>
              <button
                className="forum-category-toggle"
                onClick={() => setCollapsed(current => ({ ...current, [category.slug]: !current[category.slug] }))}
              >
                <span className={unread ? "unread-dot active" : "unread-dot"} />
                <span>
                  <strong>{category.name}</strong>
                  <small>{category.description}</small>
                </span>
                <span className="category-collapse">{isCollapsed ? "Show" : "Hide"}</span>
              </button>

              {!isCollapsed && (
                <div className="forum-board-grid">
                  {category.boards.map(board => {
                    const visibility = boardVisibility(board);
                    const tone = visibilityTone(visibility);
                    const threadCount = Number(board.thread_count || 0);
                    const postCount = Number(board.post_count || 0);
                    const latestThreadTitle = board.last_thread_title || board.last_thread?.title;
                    const lastPostAuthor = board.last_post_author_username || board.last_post_author?.username;
                    const meta = boardMeta(board);
                    return (
                      <button key={board.id} className="forum-board-row" onClick={() => onSelectBoard(board)}>
                        <span className="forum-board-icon" aria-hidden="true">{BOARD_ICONS[board.slug] || meta.icon || board.icon || "•"}</span>
                        <span className="forum-board-main">
                          <span className="forum-board-title">
                            {board.name}
                            <span className="forum-status-badge" style={{ color: tone.color, borderColor: tone.border }}>{boardStatusLabel(visibility)}</span>
                          </span>
                          <span className="forum-board-description">{board.description || meta.desc}</span>
                          {latestThreadTitle && (
                            <span className="forum-board-last">
                              Last: {latestThreadTitle} {lastPostAuthor ? `by ${lastPostAuthor}` : ""} - {timeAgo(board.last_post_at)}
                            </span>
                          )}
                        </span>
                        <span className="forum-board-stats">
                          <span><strong>{threadCount}</strong> threads</span>
                          <span><strong>{postCount}</strong> posts</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default ForumIndex;
