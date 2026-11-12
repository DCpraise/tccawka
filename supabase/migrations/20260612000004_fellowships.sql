-- ============================================================
-- FELLOWSHIP / LOCATION TRACKING
-- ============================================================

-- Ensure pgcrypto is available for gen_random_bytes() used by QR token generation
create extension if not exists "pgcrypto";

create table if not exists public.fellowships (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.fellowships enable row level security;
create policy "Fellowships: anyone read" on public.fellowships for select to authenticated, anon using (true);
create policy "Fellowships: staff write" on public.fellowships for all to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

insert into public.fellowships (name) values
  ('Canaan Fellowship'), ('Righteous Fellowship'), ('Crowned Fellowship'),
  ('Faith Fellowship'), ('Bethel Fellowship'), ('Zoe Fellowship'),
  ('Love Fellowship'), ('Peace Fellowship'), ('Joy & Mercy Fellowship'),
  ('Kings Fellowship'), ('Esther Fellowship'), ('Beloved Fellowship'),
  ('Star Fellowship'), ('Wealth Fellowship')
on conflict (name) do nothing;

-- Location -> Fellowship mapping table
create table if not exists public.location_fellowship_map (
  id uuid primary key default gen_random_uuid(),
  location text not null unique,
  fellowship_id uuid not null references public.fellowships(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.location_fellowship_map enable row level security;
create policy "LocationMap: anyone read" on public.location_fellowship_map for select to authenticated, anon using (true);
create policy "LocationMap: staff write" on public.location_fellowship_map for all to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

-- Seed the location -> fellowship mapping
do $$
declare
  v_canaan uuid; v_righteous uuid; v_crowned uuid; v_faith uuid; v_bethel uuid;
  v_zoe uuid; v_love uuid; v_peace uuid; v_joymercy uuid; v_kings uuid;
  v_esther uuid; v_beloved uuid; v_star uuid; v_wealth uuid;
begin
  select id into v_canaan    from public.fellowships where name = 'Canaan Fellowship';
  select id into v_righteous from public.fellowships where name = 'Righteous Fellowship';
  select id into v_crowned   from public.fellowships where name = 'Crowned Fellowship';
  select id into v_faith     from public.fellowships where name = 'Faith Fellowship';
  select id into v_bethel    from public.fellowships where name = 'Bethel Fellowship';
  select id into v_zoe       from public.fellowships where name = 'Zoe Fellowship';
  select id into v_love      from public.fellowships where name = 'Love Fellowship';
  select id into v_peace     from public.fellowships where name = 'Peace Fellowship';
  select id into v_joymercy  from public.fellowships where name = 'Joy & Mercy Fellowship';
  select id into v_kings     from public.fellowships where name = 'Kings Fellowship';
  select id into v_esther    from public.fellowships where name = 'Esther Fellowship';
  select id into v_beloved   from public.fellowships where name = 'Beloved Fellowship';
  select id into v_star      from public.fellowships where name = 'Star Fellowship';
  select id into v_wealth    from public.fellowships where name = 'Wealth Fellowship';

  insert into public.location_fellowship_map (location, fellowship_id) values
    ('Amansea', v_canaan),
    ('Holy Family', v_righteous),
    ('Laurel', v_crowned),
    ('Down Laurel', v_crowned),
    ('Next Level', v_faith),
    ('Witness', v_faith),
    ('School Gate', v_bethel),
    ('Teezers', v_bethel),
    ('Destiny Pot', v_bethel),
    ('Royal Kitchen', v_bethel),
    ('Yahoo', v_zoe),
    ('Miracle Junction', v_love),
    ('Dynamo', v_peace),
    ('Book Foundation', v_joymercy),
    ('Second Market', v_joymercy),
    ('Boys Hostel', v_kings),
    ('Girls Hostel', v_esther),
    ('P&P', v_beloved),
    ('Bus Stand', v_star),
    ('Emelda Hostel', v_wealth)
  on conflict (location) do nothing;
end $$;

-- Add fellowship_id + gender + date of first visit to guest_members
alter table public.guest_members
  add column if not exists fellowship_id uuid references public.fellowships(id) on delete set null,
  add column if not exists gender text check (gender in ('male','female')),
  add column if not exists first_visit_date date not null default current_date;

-- Add fellowship_id + gender to profiles (registered users)
alter table public.profiles
  add column if not exists fellowship_id uuid references public.fellowships(id) on delete set null,
  add column if not exists gender text check (gender in ('male','female'));

-- Auto-assign fellowship based on location on insert/update.
-- On UPDATE, re-evaluate whenever location changed (regardless of current fellowship_id),
-- so editing a member's location reassigns their fellowship.
create or replace function public.auto_assign_fellowship()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_fid uuid;
  v_should_assign boolean;
begin
  if new.location is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_should_assign := (new.fellowship_id is null);
  else
    v_should_assign := (old.location is distinct from new.location);
  end if;

  if v_should_assign then
    select fellowship_id into v_fid from public.location_fellowship_map
      where lower(location) = lower(trim(new.location)) limit 1;
    if v_fid is not null then
      new.fellowship_id := v_fid;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists assign_fellowship_guest on public.guest_members;
create trigger assign_fellowship_guest
  before insert or update of location on public.guest_members
  for each row execute procedure public.auto_assign_fellowship();

-- ============================================================
-- USER ROLES: link leader to fellowship (role value added separately above)
-- ============================================================
alter table public.user_roles
  add column if not exists fellowship_id uuid references public.fellowships(id) on delete set null;

-- ============================================================
-- PERSONAL QR CODE for registered users (unique token)
-- ============================================================
alter table public.profiles
  add column if not exists qr_token text unique;

create or replace function public.set_profile_qr_token()
returns trigger language plpgsql as $$
begin
  if new.qr_token is null then
    new.qr_token := encode(gen_random_bytes(12), 'hex');
  end if;
  return new;
end;
$$;

drop trigger if exists set_qr_token on public.profiles;
create trigger set_qr_token before insert on public.profiles
  for each row execute procedure public.set_profile_qr_token();

-- Backfill existing profiles without a token
update public.profiles set qr_token = encode(gen_random_bytes(12), 'hex') where qr_token is null;

-- Also give guests a qr_token (for printed badges if ever needed)
alter table public.guest_members
  add column if not exists qr_token text unique;

create or replace function public.set_guest_qr_token()
returns trigger language plpgsql as $$
begin
  if new.qr_token is null then
    new.qr_token := encode(gen_random_bytes(12), 'hex');
  end if;
  return new;
end;
$$;

drop trigger if exists set_guest_qr_token on public.guest_members;
create trigger set_guest_qr_token before insert on public.guest_members
  for each row execute procedure public.set_guest_qr_token();

update public.guest_members set qr_token = encode(gen_random_bytes(12), 'hex') where qr_token is null;


-- ============================================================
-- QR LOOKUP RPC — used by scan page to display member status + fellowship
-- Returns minimal info needed for the scan confirmation screen.
-- ============================================================
create or replace function public.lookup_qr_token(p_token text)
returns table (
  source text,
  id uuid,
  name text,
  member_type text,
  fellowship_name text,
  phone text,
  email text
) language plpgsql security definer set search_path = public as $$
begin
  return query
    select 'profile'::text, p.id, p.name, p.member_type, f.name, null::text, p.email
    from public.profiles p
    left join public.fellowships f on f.id = p.fellowship_id
    where p.qr_token = p_token
    union all
    select 'guest'::text, g.id, g.name, g.member_type, f.name, g.phone, null::text
    from public.guest_members g
    left join public.fellowships f on f.id = g.fellowship_id
    where g.qr_token = p_token
    limit 1;
end;
$$;

grant execute on function public.lookup_qr_token(text) to anon, authenticated;

-- Allow authenticated staff/admin to insert guest members (Walk-in Registration feature)
create policy "GuestMembers: staff insert" on public.guest_members for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

-- Allow authenticated staff/admin to insert attendance records on behalf of others
-- (Manual Check-in feature: user_id != auth.uid(), and Walk-in: guest_member_id set by staff)
create policy "Records: staff insert" on public.attendance_records for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

-- Fellowship leaders can read all profiles (UI scopes display to their own fellowship)
create policy "Profiles: fellowship leader read all" on public.profiles
  for select to authenticated
  using (public.has_role(auth.uid(), 'fellowship_leader'));
