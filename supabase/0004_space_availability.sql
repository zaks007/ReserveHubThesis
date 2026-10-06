-- Days an institution marks as available for a space
create table if not exists public.space_availability (
  space_id uuid not null references public.spaces(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  primary key (space_id, date)
);
grant select on public.space_availability to anon, authenticated;
grant insert, delete on public.space_availability to authenticated;
grant all on public.space_availability to service_role;
alter table public.space_availability enable row level security;
create policy "Anyone can read availability"
  on public.space_availability for select to anon, authenticated using (true);
create policy "Admins manage availability"
  on public.space_availability for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'institution_admin') or public.has_role(auth.uid(), 'campus_admin'))
  with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'institution_admin') or public.has_role(auth.uid(), 'campus_admin'));
