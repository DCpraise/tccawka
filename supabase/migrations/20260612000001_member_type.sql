-- Add member_type to guest_members (walk-ins default to first_timer)
alter table public.guest_members
  add column if not exists member_type text not null default 'first_timer'
  check (member_type in ('first_timer', 'member', 'non_member'));

-- Add member_type to profiles (registered users default to first_timer)
alter table public.profiles
  add column if not exists member_type text not null default 'first_timer'
  check (member_type in ('first_timer', 'member', 'non_member'));

-- Allow staff/admin to update member_type on profiles
create policy "Profiles: staff update member_type" on public.profiles
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));
