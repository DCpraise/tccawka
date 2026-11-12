-- Allow fellowship leaders to read attendance records (needed for the
-- per-session attendance breakdown page).
create policy "Records: fellowship leader read" on public.attendance_records
  for select to authenticated
  using (public.has_role(auth.uid(), 'fellowship_leader'));

-- Allow fellowship leaders to read attendance sessions (so they can pick a
-- session and view its breakdown).
create policy "Sessions: fellowship leader read" on public.attendance_sessions
  for select to authenticated
  using (public.has_role(auth.uid(), 'fellowship_leader'));
