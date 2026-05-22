-- Fix forum board/thread/post RLS policies to enforce visibility rules
-- Previously all had pub_read = using(true), leaking staff boards to non-staff users.

-- ============================================================
-- FORUM BOARDS: only show public/members/archived to non-staff
-- ============================================================
drop policy if exists "pub_read" on public.forum_boards;

create policy "pub_read_visibility" on public.forum_boards for select using (
  visibility not in ('staff', 'hidden')
  or public.is_lore_team(auth.uid())
);

-- ============================================================
-- FORUM THREADS: only show threads in accessible boards
-- ============================================================
drop policy if exists "pub_read" on public.forum_threads;

create policy "pub_read_visibility" on public.forum_threads for select using (
  exists (
    select 1 from public.forum_boards b
    where b.id = forum_threads.board_id
    and (b.visibility not in ('staff', 'hidden') or public.is_lore_team(auth.uid()))
  )
);

-- ============================================================
-- FORUM POSTS: only show posts in threads in accessible boards
-- ============================================================
drop policy if exists "pub_read" on public.forum_posts;

create policy "pub_read_visibility" on public.forum_posts for select using (
  exists (
    select 1 from public.forum_threads t
    join public.forum_boards b on b.id = t.board_id
    where t.id = forum_posts.thread_id
    and (b.visibility not in ('staff', 'hidden') or public.is_lore_team(auth.uid()))
  )
);
