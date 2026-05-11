-- Run this once on an existing Nationwheel Supabase project.
-- It adds user profile media fields and the public profile media bucket.

insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict do nothing;

alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists signature_url text;
alter table profiles add column if not exists bio text;

drop policy if exists "Public profile media read" on storage.objects;
drop policy if exists "Auth profile media upload" on storage.objects;
drop policy if exists "Auth profile media update" on storage.objects;

create policy "Public profile media read"
on storage.objects
for select
using (bucket_id = 'profile-media');

create policy "Auth profile media upload"
on storage.objects
for insert
with check (
  bucket_id = 'profile-media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Auth profile media update"
on storage.objects
for update
using (
  bucket_id = 'profile-media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
