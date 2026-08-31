-- Notifications for followed businesses are explicit opt-in.
alter table public.ic_follows alter column notify_promos set default false;
alter table public.ic_follows alter column notify_waste set default false;
alter table public.ic_follows alter column notify_jobs set default false;
alter table public.ic_follows alter column notify_events set default false;
