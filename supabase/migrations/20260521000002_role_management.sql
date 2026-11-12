-- Fix admin role management: allow admins to manage ALL user roles
drop policy if exists "Roles: admin manage" on public.user_roles;
create policy "Roles: admin manage"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all profiles
drop policy if exists "Profiles: admin read all" on public.profiles;
create policy "Profiles: admin read all"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

-- Backfill admin for chukwupraise69@gmail.com if they already signed up
do $$
declare v_uid uuid;
begin
  select id into v_uid from auth.users where email = 'chukwupraise69@gmail.com' limit 1;
  if v_uid is not null then
    insert into public.user_roles (user_id, role) values (v_uid, 'admin') on conflict (user_id, role) do nothing;
    insert into public.user_roles (user_id, role) values (v_uid, 'staff') on conflict (user_id, role) do nothing;
    raise notice 'Admin roles confirmed for chukwupraise69@gmail.com';
  end if;
end $$;
