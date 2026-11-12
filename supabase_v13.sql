-- Chọn nghề v1.3: đơn vị khảo sát, nội dung động và kho ảnh.
alter table public.assessment_sessions add column if not exists school_name text;
alter table public.assessment_sessions add column if not exists class_name text;
alter table public.assessment_answers add column if not exists question_code text;
alter table public.assessment_answers add column if not exists is_unknown boolean not null default false;
alter table public.assessment_answers alter column question_id drop not null;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin'); $$;
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.site_content enable row level security;
drop policy if exists public_read_site_content on public.site_content;
create policy public_read_site_content on public.site_content for select to anon, authenticated using (true);
drop policy if exists managers_write_site_content on public.site_content;
create policy managers_write_site_content on public.site_content for all to authenticated using (public.is_content_manager()) with check (public.is_content_manager());

insert into public.site_content(key,value) values
('hero_title',to_jsonb('Hiểu mình hơn,'::text)),
('hero_highlight',to_jsonb('chọn hướng đi phù hợp.'::text)),
('hero_description',to_jsonb('Tìm neo giá trị, khám phá ngành và chủ động chọn hướng đi.'::text)),
('hero_image_url',to_jsonb('assets/hero.webp'::text))
on conflict(key) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-images','site-images',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=2097152,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists public_read_site_images on storage.objects;
create policy public_read_site_images on storage.objects for select to public using (bucket_id='site-images');
drop policy if exists managers_insert_site_images on storage.objects;
create policy managers_insert_site_images on storage.objects for insert to authenticated with check (bucket_id='site-images' and public.is_content_manager());
drop policy if exists managers_update_site_images on storage.objects;
create policy managers_update_site_images on storage.objects for update to authenticated using (bucket_id='site-images' and public.is_content_manager()) with check (bucket_id='site-images' and public.is_content_manager());
drop policy if exists managers_delete_site_images on storage.objects;
create policy managers_delete_site_images on storage.objects for delete to authenticated using (bucket_id='site-images' and public.is_content_manager());

-- Không cho sửa một bài khảo sát đã hoàn tất từ phía công khai.
drop policy if exists public_update_session on public.assessment_sessions;
create policy public_update_session on public.assessment_sessions for update to anon, authenticated using (completed=false) with check (true);

create index if not exists idx_sessions_school_class on public.assessment_sessions(province,school_name,class_name,completed_at);
