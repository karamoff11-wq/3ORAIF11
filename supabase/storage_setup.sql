-- =============================================
-- Storage Setup: Videos Bucket
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create the bucket
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do update set public = true;

-- 2. Create policies to allow public read access
create policy "Public Access to Videos"
  on storage.objects for select
  using ( bucket_id = 'videos' );

-- 3. Create policies to allow authenticated users (or admins) to upload/update/delete
create policy "Authenticated users can upload videos"
  on storage.objects for insert
  with check ( bucket_id = 'videos' and auth.role() = 'authenticated' );

create policy "Authenticated users can update videos"
  on storage.objects for update
  using ( bucket_id = 'videos' and auth.role() = 'authenticated' );

create policy "Authenticated users can delete videos"
  on storage.objects for delete
  using ( bucket_id = 'videos' and auth.role() = 'authenticated' );
