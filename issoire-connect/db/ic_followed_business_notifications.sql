-- Issoire Connect: automatic in-app notifications for followed businesses.
-- Applied to Supabase production as migration: ic_followed_business_notifications.

create index if not exists ic_follows_business_idx on public.ic_follows (business_id);
create index if not exists ic_notifications_user_created_idx on public.ic_notifications (user_id, created_at desc);

create or replace function public.ic_notify_followers()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_business_name text;
  v_title text;
  v_body text;
begin
  if new.business_id is null or coalesce(new.is_active, true) is not true then
    return new;
  end if;

  select b.name into v_business_name
  from public.ic_businesses b
  where b.id = new.business_id;

  if tg_table_name = 'ic_offers' then
    v_title := case
      when new.offer_type in ('invendu','derniere_minute','destockage') then '🥖 Invendu / dernière minute'
      else '🔥 Nouveau bon plan'
    end;
    v_body := coalesce(v_business_name, 'Un commerce suivi') || ' : ' || coalesce(new.title, 'nouvelle offre');

    insert into public.ic_notifications (user_id, title, body, link_type, link_id)
    select f.user_id, v_title, v_body, 'offer', new.id
    from public.ic_follows f
    where f.business_id = new.business_id
      and case
        when new.offer_type in ('invendu','derniere_minute','destockage') then f.notify_waste
        else f.notify_promos
      end;

  elsif tg_table_name = 'ic_jobs' then
    v_title := '💼 Nouvelle offre d’emploi';
    v_body := coalesce(v_business_name, 'Un commerce suivi') || ' : ' || coalesce(new.title, 'nouvelle offre d’emploi');

    insert into public.ic_notifications (user_id, title, body, link_type, link_id)
    select f.user_id, v_title, v_body, 'job', new.id
    from public.ic_follows f
    where f.business_id = new.business_id and f.notify_jobs;

  elsif tg_table_name = 'ic_events' then
    v_title := '📅 Nouvel événement';
    v_body := coalesce(v_business_name, 'Un commerce suivi') || ' : ' || coalesce(new.title, 'nouvel événement');

    insert into public.ic_notifications (user_id, title, body, link_type, link_id)
    select f.user_id, v_title, v_body, 'event', new.id
    from public.ic_follows f
    where f.business_id = new.business_id and f.notify_events;
  end if;

  return new;
end;
$$;

drop trigger if exists ic_notify_followers_offer on public.ic_offers;
create trigger ic_notify_followers_offer after insert on public.ic_offers
for each row execute function public.ic_notify_followers();

drop trigger if exists ic_notify_followers_job on public.ic_jobs;
create trigger ic_notify_followers_job after insert on public.ic_jobs
for each row execute function public.ic_notify_followers();

drop trigger if exists ic_notify_followers_event on public.ic_events;
create trigger ic_notify_followers_event after insert on public.ic_events
for each row execute function public.ic_notify_followers();
