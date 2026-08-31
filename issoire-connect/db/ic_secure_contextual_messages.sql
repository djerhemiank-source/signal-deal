-- Contextual messaging: sender may contact an active classified/business owner and that owner may reply to an existing participant.
create policy ic_messages_sender_insert
on public.ic_messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and recipient_id <> (select auth.uid())
  and (
    (classified_id is not null and business_id is null and exists(select 1 from public.ic_classifieds c where c.id=ic_messages.classified_id and c.user_id=ic_messages.recipient_id and c.is_active=true))
    or
    (business_id is not null and classified_id is null and exists(select 1 from public.ic_businesses b where b.id=ic_messages.business_id and b.owner_id=ic_messages.recipient_id and b.is_active=true))
  )
);

create or replace function public.ic_protect_message_content()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.ic_is_admin() then return new; end if;
  if new.sender_id is distinct from old.sender_id
     or new.recipient_id is distinct from old.recipient_id
     or new.business_id is distinct from old.business_id
     or new.classified_id is distinct from old.classified_id
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'Only the read status of a message can be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists ic_messages_protect_content on public.ic_messages;
create trigger ic_messages_protect_content before update on public.ic_messages
for each row execute function public.ic_protect_message_content();

create index if not exists ic_messages_sender_created_idx on public.ic_messages(sender_id,created_at desc);
create index if not exists ic_messages_recipient_created_idx on public.ic_messages(recipient_id,created_at desc);
