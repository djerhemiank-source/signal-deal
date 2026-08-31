-- Business owners may update only applications to jobs belonging to their own businesses.
create policy ic_job_apps_owner_update
on public.ic_job_applications
for update
to authenticated
using (
  exists (
    select 1
    from public.ic_jobs j
    join public.ic_businesses b on b.id = j.business_id
    where j.id = ic_job_applications.job_id
      and b.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.ic_jobs j
    join public.ic_businesses b on b.id = j.business_id
    where j.id = ic_job_applications.job_id
      and b.owner_id = (select auth.uid())
  )
  and status = any (array['sent'::text,'viewed'::text,'accepted'::text,'rejected'::text])
);
