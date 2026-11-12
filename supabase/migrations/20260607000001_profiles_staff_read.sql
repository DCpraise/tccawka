-- Allow staff and admin to read all profiles (needed for attendee list in admin panel)
create policy "Profiles: staff read all" on public.profiles
  for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff')
  );
