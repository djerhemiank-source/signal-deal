-- Return only the candidate fields needed by owners of the business that published the job.
create or replace function public.ic_get_my_received_job_applications()
returns table (
  application_id uuid,
  job_id uuid,
  applicant_id uuid,
  applicant_name text,
  message text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    a.id as application_id,
    a.job_id,
    a.applicant_id,
    coalesce(nullif(p.display_name,''),'Candidat') as applicant_name,
    a.message,
    a.status,
    a.created_at
  from public.ic_job_applications a
  join public.ic_jobs j on j.id = a.job_id
  join public.ic_businesses b on b.id = j.business_id
  left join public.ic_profiles p on p.id = a.applicant_id
  where b.owner_id = auth.uid()
  order by a.created_at desc;
$$;

revoke all on function public.ic_get_my_received_job_applications() from public;
grant execute on function public.ic_get_my_received_job_applications() to authenticated;
