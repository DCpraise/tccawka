-- Birthday and notes on guest_members
alter table public.guest_members
  add column if not exists dob date,
  add column if not exists notes text;

-- Birthday and notes on profiles (registered users)
alter table public.profiles
  add column if not exists dob date,
  add column if not exists notes text;

-- Service type on attendance_sessions
alter table public.attendance_sessions
  add column if not exists service_type text not null default 'general'
  check (service_type in ('general','morning_service','evening_service','midweek','special'));

-- Follow-up status on guest_members
alter table public.guest_members
  add column if not exists followup_status text not null default 'pending'
  check (followup_status in ('pending','called','converted','not_interested'));

-- Auto-promote guest to member after attending 3+ sessions
create or replace function public.maybe_promote_member()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_count int;
  v_type text;
begin
  if new.guest_member_id is null then return new; end if;
  select count(*) into v_count from attendance_records where guest_member_id = new.guest_member_id;
  select member_type into v_type from guest_members where id = new.guest_member_id;
  if v_count >= 3 and v_type = 'first_timer' then
    update guest_members set member_type = 'non_member' where id = new.guest_member_id;
  end if;
  return new;
end;
$$;

drop trigger if exists promote_member_on_attendance on public.attendance_records;
create trigger promote_member_on_attendance
  after insert on public.attendance_records
  for each row execute procedure public.maybe_promote_member();

-- Allow regular authenticated members to read sessions (needed for personal
-- attendance history join on the dashboard — "Sessions: staff read" only covers staff/admin)
create policy "Sessions: members read own history" on public.attendance_sessions
  for select to authenticated
  using (true);
