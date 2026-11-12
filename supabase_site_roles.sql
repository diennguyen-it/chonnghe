-- Quản trị website: admin chính và admin học sinh; editor chỉ cập nhật dữ liệu.
create or replace function public.can_manage_site()
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_active and role in ('admin','student_admin'));
$$;
alter policy managers_write_site_content on public.site_content using(public.can_manage_site()) with check(public.can_manage_site());
alter policy managers_insert_site_images on storage.objects with check(bucket_id='site-images' and public.can_manage_site());
alter policy managers_update_site_images on storage.objects using(bucket_id='site-images' and public.can_manage_site()) with check(bucket_id='site-images' and public.can_manage_site());
alter policy managers_delete_site_images on storage.objects using(bucket_id='site-images' and public.can_manage_site());
