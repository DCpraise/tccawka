-- =====================================================================
-- EVOLVE: registrations, payments and daily check-ins (ONE migration)
-- Fresh setup: run this whole file once in the Supabase SQL Editor.
-- If you already ran any earlier Evolve SQL, run this line FIRST (it clears Evolve data):
--   drop table if exists public.evolve_checkins, public.evolve_registrations cascade;
-- =====================================================================
create extension if not exists "pgcrypto";

create table if not exists public.evolve_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  is_member boolean not null default false,
  heard_from text,
  reminder_channel text not null default 'email' check (reminder_channel in ('email', 'whatsapp', 'both')),
  category text not null check (category in ('member', 'worker', 'state_pastor', 'campus_pastor')),
  ticket_code text not null,
  payment_status text not null default 'pending' check (payment_status in ('free', 'pending', 'paid')),
  amount_paid integer,
  payment_reference text,
  paid_at timestamptz,
  reminder_7d_sent_at timestamptz,
  reminder_1d_sent_at timestamptz,
  reminder_2h_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists evolve_registrations_email_uidx on public.evolve_registrations (lower(email));
create unique index if not exists evolve_registrations_ticket_uidx on public.evolve_registrations (ticket_code);
create unique index if not exists evolve_registrations_payref_uidx
  on public.evolve_registrations (payment_reference) where payment_reference is not null;

alter table public.evolve_registrations enable row level security;

-- Registrations are created ONLY by the server after payment is confirmed (service role),
-- so there is deliberately no public insert policy.
drop policy if exists "Evolve: staff read" on public.evolve_registrations;
create policy "Evolve: staff read" on public.evolve_registrations for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

drop policy if exists "Evolve: staff manage" on public.evolve_registrations;
create policy "Evolve: staff manage" on public.evolve_registrations for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

drop policy if exists "Evolve: admin delete" on public.evolve_registrations;
create policy "Evolve: admin delete" on public.evolve_registrations for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create table if not exists public.evolve_checkins (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.evolve_registrations(id) on delete cascade,
  event_day date not null,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users(id),
  unique (registration_id, event_day)
);

alter table public.evolve_checkins enable row level security;

drop policy if exists "EvolveCheckins: staff read" on public.evolve_checkins;
create policy "EvolveCheckins: staff read" on public.evolve_checkins for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

drop policy if exists "EvolveCheckins: staff insert" on public.evolve_checkins;
create policy "EvolveCheckins: staff insert" on public.evolve_checkins for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

drop policy if exists "EvolveCheckins: admin delete" on public.evolve_checkins;
create policy "EvolveCheckins: admin delete" on public.evolve_checkins for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
