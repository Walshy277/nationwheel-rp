# Free-Tier Architecture

Target stack:

- Hosting: Cloudflare Pages
- Database: Supabase Postgres
- Storage: Supabase Storage with strict image limits
- Realtime: notifications only

The app must behave like a traditional forum: paginated reads, cached static assets, lightweight profile images, and no global live feed subscriptions.

## Current Risk

`src/App.jsx` currently calls `fetchAll()` and downloads nearly every row from the main app tables on startup:

- all profiles
- all news
- all canon actions plus all action updates
- all wars and war participants
- all alliances and members
- all forum threads
- all forum posts
- all forum reactions

That pattern will hit Supabase egress and browser memory long before the database itself is full. Replace it with route-specific queries and RPCs.

## Database Shape

Keep the existing core tables:

- `profiles`
- `nations`
- `rp_posts`
- `canon_actions`
- `action_updates`
- `wars`
- `war_participants`
- `alliances`
- `alliance_members`
- `news`
- `forum_categories`
- `forum_boards`
- `forum_threads`
- `forum_posts`
- `forum_reactions`
- `thread_subscriptions`
- `forum_read_state`
- `thread_read_state`

Add the scaling migration:

```text
supabase/migrations/20260514_scale_forum_limits.sql
```

It adds:

- board counters: `thread_count`, `post_count`, `last_thread_id`, `last_post_id`, `last_post_at`, `last_post_author_id`
- thread counters: `reply_count`, `last_post_id`, `last_post_at`, `last_post_author_id`
- stable post numbering: `forum_posts.post_number`
- lightweight notifications: `notifications`
- summary views: `forum_board_summaries`, `forum_thread_summaries`
- bounded RPCs: `list_board_threads`, `list_thread_posts`, `mark_notifications_read`

## Query Strategy

### App Boot

Load only:

```js
supabase.from("forum_board_summaries").select("*").order("sort_order")
supabase.from("news").select("id,title,category,pinned,created_at").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5)
supabase.auth.getSession()
```

If logged in, also load:

```js
supabase.from("profiles").select("id,username,role,nation_id,avatar_url").eq("id", user.id).single()
supabase.from("notifications").select("id,type,title,thread_id,post_id,created_at").is("read_at", null).order("created_at", { ascending: false }).limit(20)
```

### Board Page

Use keyset pagination. Never fetch all threads.

```js
supabase.rpc("list_board_threads", {
  p_board_slug: boardSlug,
  p_cursor_is_pinned: cursor?.is_pinned ?? null,
  p_cursor_last_post_at: cursor?.last_post_at ?? null,
  p_cursor_id: cursor?.id ?? null,
  p_limit: 25,
})
```

The next cursor is the last returned row's `is_pinned`, `last_post_at`, and `id`.

### Thread Page

Load posts in pages of 25:

```js
supabase.rpc("list_thread_posts", {
  p_thread_id: threadId,
  p_after_post_number: lastPostNumber,
  p_limit: 25,
})
```

Load reactions only for visible posts:

```js
supabase.from("forum_reactions")
  .select("post_id,emoji,user_id")
  .in("post_id", visiblePostIds)
```

### News, RP Posts, Actions, Wars

Each page should use its own query:

```js
// News
.select("id,title,body,category,pinned,created_at,profiles(username)")
.order("pinned", { ascending: false })
.order("created_at", { ascending: false })
.limit(20)

// RP posts
.select("id,title,post_type,created_at,nations(name,flag_url)")
.order("created_at", { ascending: false })
.limit(25)

// Canon actions
.select("id,title,status,size,created_at,nations(name,flag_url)")
.order("created_at", { ascending: false })
.limit(25)

// Wars
.select("id,name,status,started_at,ended_at,aggressor:aggressor_id(name,flag_url),defender:defender_id(name,flag_url)")
.order("started_at", { ascending: false })
.limit(25)
```

Open detail views fetch child rows only for that item.

## Realtime Rules

Allowed:

- one `notifications` subscription per signed-in user
- only `insert` events
- no payload-heavy tables

Client pattern:

```js
supabase
  .channel(`notifications:${user.id}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `recipient_id=eq.${user.id}`,
    },
    payload => addNotification(payload.new),
  )
  .subscribe();
```

Not allowed:

- realtime on `forum_posts`
- realtime on `forum_threads`
- realtime on `forum_reactions`
- presence channels for online users
- live typing indicators

## Storage Rules

Keep Supabase Storage for small images only:

- nation flags: max 300 KB, JPEG/PNG/WebP, resize client-side to about 512 px wide
- avatars: max 150 KB, square, 256x256 target
- signatures: max 250 KB, 900x180 target
- no video, audio, PDFs, or large lore documents in Supabase Storage

Use public URLs, but cache aggressively through the browser/CDN. Replace old files instead of creating endless versions.

## Free-Tier Budget

With 500 daily users browsing for long sessions, budget around egress, not request count:

- board index: under 25 KB
- board page: under 40 KB per 25 threads
- thread page: under 100 KB per 25 posts unless posts are very long
- notifications: under 2 KB per event
- images: aggressively compressed because storage egress is the easiest limit to burn

Operational guardrails:

- cap page size at 50 rows server-side
- show "load more", not infinite auto-load
- truncate previews in SQL/views
- do not select `*` in frontend list pages
- keep large `body` fields out of index/list queries
- archive old seasons into read-only boards
- run `refresh_forum_counts()` after bulk imports or manual data fixes

## Cloudflare Pages

Build settings:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Node version: 22
```

Environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The repo includes `public/_redirects` for SPA fallback and `public/_headers` for static asset caching/security headers.
