-- ============================================================
-- LOCK ATTENDANCE TO LIVE SESSIONS
-- Prevent any check-in (self-scan, manual, or walk-in) from being recorded
-- once a session's expires_at has passed. This stops a session's
-- attendance numbers from being altered after it has ended.
-- ============================================================

-- Self check-in (authenticated user via QR scan)
drop policy if exists "Records: auth insert" on public.attendance_records;
create policy "Records: auth insert" on public.attendance_records for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.attendance_sessions s
      where s.id = session_id and s.expires_at > now()
    )
  );

-- Self check-in (anonymous guest via QR scan)
drop policy if exists "Records: anon insert" on public.attendance_records;
create policy "Records: anon insert" on public.attendance_records for insert to anon
  with check (
    user_id is null and guest_member_id is not null
    and exists (
      select 1 from public.attendance_sessions s
      where s.id = session_id and s.expires_at > now()
    )
  );

-- Staff/admin manual check-in & walk-in registration
drop policy if exists "Records: staff insert" on public.attendance_records;
create policy "Records: staff insert" on public.attendance_records for insert to authenticated
  with check (
    (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'))
    and exists (
      select 1 from public.attendance_sessions s
      where s.id = session_id and s.expires_at > now()
    )
  );
