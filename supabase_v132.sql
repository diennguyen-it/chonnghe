begin;
create table if not exists public.analytics_visits (
 visit_id uuid primary key,visitor_id uuid not null,session_id uuid not null,
 active boolean not null default true,created_at timestamptz not null default now(),last_seen timestamptz not null default now()
);
alter table public.analytics_visits enable row level security;
revoke all on public.analytics_visits from anon,authenticated;
create index if not exists idx_analytics_visits_last_seen on public.analytics_visits(last_seen desc);
create index if not exists idx_analytics_visits_visitor on public.analytics_visits(visitor_id);
create or replace function public.track_analytics_visit(p_visitor_id uuid,p_visit_id uuid,p_session_id uuid,p_active boolean default true)
returns void language plpgsql security definer set search_path=public as $$
begin
 insert into public.analytics_visits(visit_id,visitor_id,session_id,active) values(p_visit_id,p_visitor_id,p_session_id,coalesce(p_active,true))
 on conflict(visit_id) do update set active=excluded.active,last_seen=now()
 where analytics_visits.visitor_id=excluded.visitor_id and analytics_visits.session_id=excluded.session_id;
end; $$;
create or replace function public.analytics_public_summary() returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('online',count(distinct visitor_id) filter(where active and last_seen>=now()-interval '120 seconds'),'total_visits',count(*),'total_visitors',count(distinct visitor_id),'completed',(select count(*) from public.assessment_sessions where completed and consent),'updated_at',extract(epoch from now())::bigint) from public.analytics_visits;
$$;
create or replace function public.analytics_public_report() returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('summary',public.analytics_public_summary(),
 'days',(select jsonb_agg(jsonb_build_object('date',d::date,'visits',(select count(*) from public.analytics_visits v where (v.created_at at time zone 'Asia/Ho_Chi_Minh')::date=d::date),'completed',(select count(*) from public.assessment_sessions s where s.completed and s.consent and (s.completed_at at time zone 'Asia/Ho_Chi_Minh')::date=d::date)) order by d) from generate_series((now() at time zone 'Asia/Ho_Chi_Minh')::date-6,(now() at time zone 'Asia/Ho_Chi_Minh')::date,interval '1 day') d),
 'careers',(select coalesce(jsonb_agg(row_to_json(t)),'[]'::jsonb) from (select x->>'id' as id,max(x->>'name') as name,count(*) filter(where x->>'priority'='1') as priority1,count(*) as top3,0 as views from public.assessment_sessions s cross join lateral jsonb_array_elements(case when jsonb_typeof(s.result->'selected')='array' then s.result->'selected' else '[]'::jsonb end) x where s.completed and s.consent group by x->>'id' order by count(*) desc limit 10)t));
$$;
revoke all on function public.track_analytics_visit(uuid,uuid,uuid,boolean) from public;
revoke all on function public.analytics_public_summary() from public;
revoke all on function public.analytics_public_report() from public;
grant execute on function public.track_analytics_visit(uuid,uuid,uuid,boolean) to anon,authenticated;
grant execute on function public.analytics_public_summary() to anon,authenticated;
grant execute on function public.analytics_public_report() to anon,authenticated;

alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists email text;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in ('admin','student_admin','editor','viewer'));
update public.profiles p set email=u.email from auth.users u where p.id=u.id;
update public.profiles p set full_name='Administrator Support' from auth.users u where p.id=u.id and u.email='vndigitaleconomy@gmail.com';
create unique index if not exists one_primary_admin on public.profiles(role) where role='admin';
create unique index if not exists one_student_admin on public.profiles(role) where role='student_admin';
create or replace function public.is_content_manager() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and is_active and role in ('admin','student_admin','editor')); $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and is_active and role='admin'); $$;
drop policy if exists profiles_admin_update on public.profiles;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,full_name,email) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','Thành viên'),new.email) on conflict do nothing; return new; end; $$;
-- Nội dung cài đặt cũ trỏ đến ảnh không tồn tại sẽ dùng banner đóng gói mới.
update public.site_content set value=to_jsonb('assets/banner.webp'::text),updated_at=now() where key='hero_image_url' and value in ('"assets/hero.webp"'::jsonb,'"assets/banner.webp"'::jsonb);
commit;
