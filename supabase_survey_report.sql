-- Thống kê khảo sát: giữ nguyên phiên bản và quyền của hàm hiện tại.
create or replace function public.analytics_public_report()
returns jsonb language sql stable security definer set search_path=public as $report$
with
 completed as materialized (
  select id,result,completed_at from public.assessment_sessions where completed and consent
 ),
 catalog as (select '{"m001":"technology","m002":"technology","m003":"technology","m004":"technology","m005":"technology","m006":"technology","m007":"technology","m008":"technology","m009":"humanities","m010":"humanities","m011":"humanities","m012":"humanities","m013":"humanities","m014":"humanities","m015":"humanities","m016":"humanities","m017":"humanities","m018":"architecture","m019":"architecture","m020":"architecture","m021":"architecture","m022":"architecture","m023":"architecture","m024":"business","m025":"business","m026":"business","m027":"business","m028":"business","m029":"business","m030":"business","m031":"business","m032":"business","m033":"business","m034":"business","m035":"business","m036":"business","m037":"social","m038":"social","m039":"social","m040":"social","m041":"social","m042":"social","m043":"social","m044":"social","m045":"science","m046":"science","m047":"science","m048":"science","m049":"science","m050":"science","m051":"agriculture","m052":"agriculture","m053":"agriculture","m054":"agriculture","m055":"agriculture","m056":"agriculture","m057":"health","m058":"health","m059":"health","m060":"health","m061":"health","m062":"business","m063":"design","m064":"design","m065":"design","m066":"design","m067":"design","m068":"design","m069":"design","m070":"education","m071":"education","m072":"education","m073":"education","m074":"education","m075":"education","m076":"education","m077":"education","m078":"education","m079":"education","m080":"education","m081":"education","m082":"education","m083":"technology","m084":"technology","m085":"technology","m086":"design","m087":"education","m088":"defense","m089":"defense","m090":"defense"}'::jsonb as map),
 recommendations as (
  select s.id as survey_id,x->>'id' as career_id,max(x->>'name') as name,
         bool_or(coalesce(x->>'priority','')='1') as first_priority
  from completed s
  cross join lateral jsonb_array_elements(case when jsonb_typeof(s.result->'selected')='array' then s.result->'selected' else '[]'::jsonb end) x
  where coalesce(x->>'id','')<>''
  group by s.id,x->>'id'
 ),
 classified as (
  select r.*,coalesce(g.code,catalog.map->>r.career_id,'other') as group_code
  from recommendations r cross join catalog
  left join public.careers m on m.code=r.career_id
  left join public.career_groups g on g.id=m.group_id
 ),
 career_totals as (
  select career_id as id,max(name) as name,max(group_code) as group_code,
         count(*) as top3,count(*) filter(where first_priority) as priority1,0 as views
  from classified group by career_id
 ),
 field_surveys as (
  select survey_id,group_code,bool_or(first_priority) as first_priority
  from classified group by survey_id,group_code
 ),
 field_totals as (
  select group_code as id,count(*) as top3,count(*) filter(where first_priority) as priority1
  from field_surveys group by group_code
 )
select jsonb_build_object(
 'summary',public.analytics_public_summary(),
 'survey',jsonb_build_object(
  'completed',(select count(*) from completed),
  'with_recommendations',(select count(distinct survey_id) from recommendations),
  'careers_count',(select count(*) from career_totals),
  'groups_count',(select count(*) from field_totals)
 ),
 'days',(select jsonb_agg(jsonb_build_object(
  'date',d::date,
  'completed',(select count(*) from completed s where (s.completed_at at time zone 'Asia/Ho_Chi_Minh')::date=d::date)
 ) order by d) from generate_series((now() at time zone 'Asia/Ho_Chi_Minh')::date-6,(now() at time zone 'Asia/Ho_Chi_Minh')::date,interval '1 day') d),
 'careers',(select coalesce(jsonb_agg(row_to_json(c) order by c.top3 desc,c.id),'[]'::jsonb) from career_totals c),
 'groups',(select coalesce(jsonb_agg(row_to_json(g) order by g.top3 desc,g.id),'[]'::jsonb) from field_totals g)
);
$report$;
