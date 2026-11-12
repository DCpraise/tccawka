-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- App roles enum
create type public.app_role as enum ('admin', 'staff', 'user');

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles: read own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Profiles: insert own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Profiles: update own" on public.profiles for update to authenticated using (auth.uid() = id);

-- User roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;
create policy "Roles: read own" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Roles: insert own" on public.user_roles for insert to authenticated with check (auth.uid() = user_id);

-- has_role helper function
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Attendance sessions
create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  qr_token text not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.attendance_sessions enable row level security;
create policy "Sessions: staff create" on public.attendance_sessions for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));
create policy "Sessions: staff read" on public.attendance_sessions for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));
create policy "Sessions: anon read" on public.attendance_sessions for select to anon using (true);
create policy "Sessions: staff update" on public.attendance_sessions for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));
create policy "Sessions: staff delete" on public.attendance_sessions for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

-- Guest members (no Supabase account needed)
create table public.guest_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  location text not null,
  lodge text,
  created_at timestamptz not null default now()
);
alter table public.guest_members enable row level security;
create policy "GuestMembers: anon insert" on public.guest_members for insert to anon with check (true);
create policy "GuestMembers: anon read" on public.guest_members for select to anon using (true);
create policy "GuestMembers: staff read" on public.guest_members for select to authenticated using (true);
create policy "GuestMembers: staff update" on public.guest_members for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));
create policy "GuestMembers: staff delete" on public.guest_members for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

-- Attendance records
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  user_id uuid references auth.users(id),
  guest_member_id uuid references public.guest_members(id) on delete set null,
  scanned_at timestamptz not null default now(),
  device_info text,
  location jsonb
);
alter table public.attendance_records enable row level security;

-- Unique: one record per logged-in user per session
create unique index records_user_session_unique on public.attendance_records (user_id, session_id) where user_id is not null;
-- Unique: one record per guest per session
create unique index records_guest_session_unique on public.attendance_records (guest_member_id, session_id) where guest_member_id is not null;

create policy "Records: auth insert" on public.attendance_records for insert to authenticated
  with check (user_id = auth.uid());
create policy "Records: anon insert" on public.attendance_records for insert to anon
  with check (user_id is null and guest_member_id is not null);
create policy "Records: staff read" on public.attendance_records for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff') or user_id = auth.uid());
create policy "Records: anon read" on public.attendance_records for select to anon
  using (user_id is null);
create policy "Records: staff delete" on public.attendance_records for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict (user_id, role) do nothing;

  if new.email = 'chukwupraise69@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict (user_id, role) do nothing;
    insert into public.user_roles (user_id, role) values (new.id, 'staff') on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();
