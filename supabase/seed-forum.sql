-- Default modern forum index. Run after schema.sql, functions.sql, policies.sql,
-- and supabase/migrations/20260513_forum_foundation.sql.

insert into forum_categories (name, slug, description, sort_order, visibility) values
('Announcements','announcements','Official updates and site-wide information.',1,'public'),
('Out of Character','out-of-character','Community discussion, help, and planning outside the canon world.',2,'public'),
('In Character','in-character','World-facing posts, diplomacy, propaganda, trade, and intelligence.',3,'public'),
('Nation Roleplay','nation-roleplay','Nation introductions, embassies, treaties, military actions, and canon actions.',4,'public'),
('Archives','archives','Closed seasons, old wars, and retired treaty records.',5,'archived'),
('Staff Area','staff-area','Moderation, reports, lore review, and administrative records.',6,'staff')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  visibility = excluded.visibility;

insert into forum_boards (name, description, slug, icon, sort_order, category_id, visibility) values
('News & Updates','Official announcements and development updates.','news-updates','📣',1,(select id from forum_categories where slug='announcements'),'public'),
('Rules','Site rules, roleplay rules, and canon standards.','rules','📜',2,(select id from forum_categories where slug='announcements'),'public'),
('Staff Notices','Important staff notices for the community.','staff-notices','📌',3,(select id from forum_categories where slug='announcements'),'public'),
('General Chat','General community chat.','general-chat','💬',4,(select id from forum_categories where slug='out-of-character'),'public'),
('Questions & Support','Help, onboarding, and bug reports.','questions-support','❓',5,(select id from forum_categories where slug='out-of-character'),'public'),
('Suggestions','Ideas for the app, lore, and community.','suggestions','💡',6,(select id from forum_categories where slug='out-of-character'),'members'),
('World News','In-character news and public world events.','world-news','📰',7,(select id from forum_categories where slug='in-character'),'public'),
('Diplomacy','Treaties, negotiations, alliances, and relations.','diplomacy','🤝',8,(select id from forum_categories where slug='in-character'),'public'),
('War Room','Military strategy, wars, and battle reports.','war-room','⚔️',9,(select id from forum_categories where slug='in-character'),'public'),
('Trade','Economic deals, markets, and logistics.','trade','💱',10,(select id from forum_categories where slug='in-character'),'public'),
('Intelligence','Espionage, leaks, and covert operations.','intelligence','🔎',11,(select id from forum_categories where slug='in-character'),'members'),
('Propaganda','State media, narratives, and public messaging.','propaganda','📢',12,(select id from forum_categories where slug='in-character'),'public'),
('Cultural Exchange','Arts, faith, culture, and soft power.','cultural-exchange','🎭',13,(select id from forum_categories where slug='in-character'),'public'),
('Nation Introductions','Introduce your nation, history, and culture.','nation-introductions','🌐',14,(select id from forum_categories where slug='nation-roleplay'),'public'),
('Embassies','Embassy threads and diplomatic offices.','embassies','🏛️',15,(select id from forum_categories where slug='nation-roleplay'),'public'),
('Treaties','Treaty drafts, signings, and treaty archives.','treaties','🖋️',16,(select id from forum_categories where slug='nation-roleplay'),'public'),
('Military Actions','Military movement and conflict actions.','military-actions','🛡️',17,(select id from forum_categories where slug='nation-roleplay'),'members'),
('Canon Actions','Canon action discussion, outcomes, and lore clarification.','canon-actions','🧭',18,(select id from forum_categories where slug='nation-roleplay'),'members'),
('Season Archives','Completed seasons and historical records.','season-archives','🗄️',19,(select id from forum_categories where slug='archives'),'archived'),
('Old Wars','Retired conflict records.','old-wars','🪖',20,(select id from forum_categories where slug='archives'),'archived'),
('Old Treaties','Retired treaty records.','old-treaties','📚',21,(select id from forum_categories where slug='archives'),'archived'),
('Staff Room','Private staff coordination.','staff-room','🧑‍⚖️',22,(select id from forum_categories where slug='staff-area'),'staff'),
('Reports','Reported content and moderation queue.','reports','🚩',23,(select id from forum_categories where slug='staff-area'),'staff'),
('Lore Team','Lore review and canon planning.','lore-team','🧠',24,(select id from forum_categories where slug='staff-area'),'staff'),
('Admin Logs','Administrative records and audit notes.','admin-logs','🔐',25,(select id from forum_categories where slug='staff-area'),'staff'),
('Canon Review','Canon review queue and decisions.','canon-review','✅',26,(select id from forum_categories where slug='staff-area'),'staff'),
('Disciplinary Records','Private warnings and disciplinary notes.','disciplinary-records','⚖️',27,(select id from forum_categories where slug='staff-area'),'staff')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  category_id = excluded.category_id,
  visibility = excluded.visibility;

insert into forum_permissions (board_id, role, can_view_board, can_read_threads, can_start_threads, can_reply, can_edit_own_posts, can_delete_own_posts, can_upload_images, can_react, can_report, can_moderate_board, can_mark_canon)
select b.id, role_name,
  case when b.visibility = 'staff' then role_name in ('moderator','lore','admin','owner') else true end,
  case when b.visibility = 'staff' then role_name in ('moderator','lore','admin','owner') else true end,
  role_name <> 'guest' and b.visibility <> 'archived',
  role_name <> 'guest' and b.visibility <> 'archived',
  role_name <> 'guest',
  role_name in ('moderator','lore','admin','owner'),
  role_name <> 'guest',
  role_name <> 'guest',
  role_name <> 'guest',
  role_name in ('moderator','lore','admin','owner'),
  role_name in ('lore','admin','owner')
from forum_boards b
cross join (values ('guest'),('player'),('verified'),('moderator'),('lore'),('admin'),('owner')) roles(role_name)
on conflict (board_id, role) do update set
  can_view_board = excluded.can_view_board,
  can_read_threads = excluded.can_read_threads,
  can_start_threads = excluded.can_start_threads,
  can_reply = excluded.can_reply,
  can_edit_own_posts = excluded.can_edit_own_posts,
  can_delete_own_posts = excluded.can_delete_own_posts,
  can_upload_images = excluded.can_upload_images,
  can_react = excluded.can_react,
  can_report = excluded.can_report,
  can_moderate_board = excluded.can_moderate_board,
  can_mark_canon = excluded.can_mark_canon;

