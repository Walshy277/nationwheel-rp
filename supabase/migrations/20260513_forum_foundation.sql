-- Forum foundation upgrade: categories, sub-boards, permissions, moderation, reports, revisions, read state.

create table if not exists forum_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  sort_order int default 0,
  collapsed_by_default boolean default false,
  visibility text default 'public' check (visibility in ('public','members','staff','hidden','archived')),
  created_at timestamptz default now()
);

alter table forum_boards add column if not exists category_id uuid references forum_categories(id) on delete set null;
alter table forum_boards add column if not exists parent_board_id uuid references forum_boards(id) on delete set null;
alter table forum_boards add column if not exists visibility text default 'public' check (visibility in ('public','members','staff','hidden','archived'));
alter table forum_boards add column if not exists is_locked boolean default false;
alter table forum_boards add column if not exists archived_at timestamptz;
alter table forum_boards add column if not exists hidden_at timestamptz;

alter table forum_threads add column if not exists slug text;
alter table forum_threads add column if not exists tags text[] default '{}';
alter table forum_threads add column if not exists view_count int default 0;
alter table forum_threads add column if not exists reply_count int default 0;
alter table forum_threads add column if not exists is_pinned boolean default false;
alter table forum_threads add column if not exists pinned_at timestamptz;
alter table forum_threads add column if not exists pinned_by uuid references profiles(id) on delete set null;
alter table forum_threads add column if not exists is_locked boolean default false;
alter table forum_threads add column if not exists locked_at timestamptz;
alter table forum_threads add column if not exists locked_by uuid references profiles(id) on delete set null;
alter table forum_threads add column if not exists lock_reason text;
alter table forum_threads add column if not exists is_archived boolean default false;
alter table forum_threads add column if not exists archived_at timestamptz;
alter table forum_threads add column if not exists archived_by uuid references profiles(id) on delete set null;
alter table forum_threads add column if not exists is_deleted boolean default false;
alter table forum_threads add column if not exists deleted_at timestamptz;
alter table forum_threads add column if not exists deleted_by uuid references profiles(id) on delete set null;
alter table forum_threads add column if not exists delete_reason text;
alter table forum_threads add column if not exists is_canon boolean default false;
alter table forum_threads add column if not exists canon_marked_at timestamptz;
alter table forum_threads add column if not exists canon_marked_by uuid references profiles(id) on delete set null;
alter table forum_threads add column if not exists is_official boolean default false;
alter table forum_threads add column if not exists official_marked_at timestamptz;
alter table forum_threads add column if not exists official_marked_by uuid references profiles(id) on delete set null;
alter table forum_threads add column if not exists moved_to_thread_id uuid references forum_threads(id) on delete set null;

alter table forum_posts add column if not exists post_number int;
alter table forum_posts add column if not exists edited_at timestamptz;
alter table forum_posts add column if not exists edited_by uuid references profiles(id) on delete set null;
alter table forum_posts add column if not exists edit_reason text;
alter table forum_posts add column if not exists is_deleted boolean default false;
alter table forum_posts add column if not exists deleted_at timestamptz;
alter table forum_posts add column if not exists deleted_by uuid references profiles(id) on delete set null;
alter table forum_posts add column if not exists delete_reason text;
alter table forum_posts add column if not exists is_hidden boolean default false;
alter table forum_posts add column if not exists is_approved boolean default true;

create table if not exists forum_permissions (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references forum_boards(id) on delete cascade,
  role text not null,
  can_view_board boolean default true,
  can_read_threads boolean default true,
  can_start_threads boolean default true,
  can_reply boolean default true,
  can_edit_own_posts boolean default true,
  can_delete_own_posts boolean default false,
  can_upload_images boolean default false,
  can_react boolean default true,
  can_report boolean default true,
  can_moderate_board boolean default false,
  can_mark_canon boolean default false,
  created_at timestamptz default now(),
  unique (board_id, role)
);

create table if not exists moderation_logs (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid references profiles(id) on delete set null,
  target_type text not null,
  target_id uuid,
  action text not null,
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  target_type text not null check (target_type in ('post','thread','profile','nation','forum_post','forum_thread','dispatch','action')),
  target_id uuid not null,
  reason text not null,
  status text default 'open' check (status in ('open','investigating','resolved','dismissed')),
  assigned_moderator uuid references profiles(id) on delete set null,
  resolution text,
  resolution_note text,
  assigned_to uuid references profiles(id) on delete set null,
  resolved_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table if not exists post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references forum_posts(id) on delete cascade,
  edited_by uuid references profiles(id) on delete set null,
  old_body text not null,
  new_body text not null,
  edit_reason text,
  created_at timestamptz default now()
);

create table if not exists thread_views (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references forum_threads(id) on delete cascade,
  viewer_id uuid references profiles(id) on delete cascade,
  viewed_at timestamptz default now(),
  unique (thread_id, viewer_id)
);

create table if not exists thread_subscriptions (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references forum_threads(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  notify_on_reply boolean default true,
  created_at timestamptz default now(),
  unique (thread_id, profile_id)
);

create table if not exists forum_read_state (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  board_id uuid references forum_boards(id) on delete cascade,
  read_at timestamptz default now(),
  unique (profile_id, board_id)
);

create table if not exists thread_read_state (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  thread_id uuid references forum_threads(id) on delete cascade,
  read_at timestamptz default now(),
  unique (profile_id, thread_id)
);

alter table profiles add column if not exists custom_title text;
alter table profiles add column if not exists warning_count int default 0;
alter table profiles add column if not exists last_active_at timestamptz;
alter table profiles add column if not exists privacy jsonb default '{}'::jsonb;
alter table profiles add column if not exists suspended_until timestamptz;
alter table profiles add column if not exists suspension_reason text;

create index if not exists idx_forum_boards_category_order on forum_boards(category_id, sort_order);
create index if not exists idx_forum_boards_parent_order on forum_boards(parent_board_id, sort_order);
create index if not exists idx_forum_threads_board_activity on forum_threads(board_id, created_at desc);
create index if not exists idx_forum_posts_thread_created on forum_posts(thread_id, created_at);
create index if not exists idx_reports_status_created on reports(status, created_at desc);
create index if not exists idx_moderation_logs_target on moderation_logs(target_type, target_id, created_at desc);

alter table forum_categories enable row level security;
alter table forum_permissions enable row level security;
alter table moderation_logs enable row level security;
alter table reports enable row level security;
alter table post_revisions enable row level security;
alter table thread_views enable row level security;
alter table thread_subscriptions enable row level security;
alter table forum_read_state enable row level security;
alter table thread_read_state enable row level security;

