-- ReserveHub initial schema
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)

-- =========================================================
-- 1. ENUMS
-- =========================================================
create type public.app_role as enum ('super_admin', 'institution_admin', 'campus_admin', 'staff', 'user');
create type public.institution_type as enum ('hotel', 'university', 'sports', 'garden', 'airbnb');
create type public.price_unit as enum ('hour', 'night', 'month');
create type public.booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.request_status as enum ('pending', 'approved', 'rejected');

-- =========================================================
-- 2. PROFILES (1:1 with auth.users)
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone signed in"
  on public.profiles for select to authenticated using (true);
create policy "Users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- =========================================================
-- 3. USER ROLES (separate table — never on profiles)
-- =========================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  institution_id uuid,
  campus_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, role, institution_id, campus_id)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users see own roles"
  on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- =========================================================
-- 4. INSTITUTIONS / CAMPUSES / BUILDINGS / SPACES
-- =========================================================
create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.institution_type not null,
  city text not null default '',
  address text,
  description text,
  image_url text,
  rating numeric(2,1) default 0,
  lat numeric(9,6),
  lng numeric(9,6),
  contact_email text,
  contact_phone text,
  amenities text[] default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.institutions to anon, authenticated;
grant insert, update, delete on public.institutions to authenticated;
grant all on public.institutions to service_role;
alter table public.institutions enable row level security;
create policy "Institutions are publicly readable"
  on public.institutions for select using (true);
create policy "Super admins manage institutions"
  on public.institutions for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  address text,
  lat numeric(9,6),
  lng numeric(9,6),
  created_at timestamptz not null default now()
);
grant select on public.campuses to anon, authenticated;
grant insert, update, delete on public.campuses to authenticated;
grant all on public.campuses to service_role;
alter table public.campuses enable row level security;
create policy "Campuses are publicly readable" on public.campuses for select using (true);
create policy "Admins manage campuses" on public.campuses for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'institution_admin'))
  with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'institution_admin'));

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  campus_id uuid references public.campuses(id) on delete set null,
  name text not null,
  address text,
  lat numeric(9,6),
  lng numeric(9,6),
  created_at timestamptz not null default now()
);
grant select on public.buildings to anon, authenticated;
grant insert, update, delete on public.buildings to authenticated;
grant all on public.buildings to service_role;
alter table public.buildings enable row level security;
create policy "Buildings are publicly readable" on public.buildings for select using (true);
create policy "Admins manage buildings" on public.buildings for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'institution_admin') or public.has_role(auth.uid(), 'campus_admin'))
  with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'institution_admin') or public.has_role(auth.uid(), 'campus_admin'));

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  name text not null,
  capacity int not null default 1,
  image_url text,
  features text[] default '{}',
  price_per_unit numeric(10,2) not null default 0,
  price_unit public.price_unit not null default 'hour',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.spaces to anon, authenticated;
grant insert, update, delete on public.spaces to authenticated;
grant all on public.spaces to service_role;
alter table public.spaces enable row level security;
create policy "Spaces are publicly readable" on public.spaces for select using (true);
create policy "Admins manage spaces" on public.spaces for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'institution_admin') or public.has_role(auth.uid(), 'campus_admin') or public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'institution_admin') or public.has_role(auth.uid(), 'campus_admin') or public.has_role(auth.uid(), 'staff'));

-- =========================================================
-- 5. BOOKINGS
-- =========================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  status public.booking_status not null default 'pending',
  rejection_reason text,
  notes text,
  total_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index on public.bookings (space_id, date);
grant select, insert, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "Users see own bookings"
  on public.bookings for select to authenticated
  using (auth.uid() = user_id
         or public.has_role(auth.uid(), 'super_admin')
         or public.has_role(auth.uid(), 'institution_admin')
         or public.has_role(auth.uid(), 'campus_admin')
         or public.has_role(auth.uid(), 'staff'));
create policy "Users create own bookings"
  on public.bookings for insert to authenticated with check (auth.uid() = user_id);
create policy "Users cancel own bookings, admins manage all"
  on public.bookings for update to authenticated
  using (auth.uid() = user_id
         or public.has_role(auth.uid(), 'super_admin')
         or public.has_role(auth.uid(), 'institution_admin')
         or public.has_role(auth.uid(), 'campus_admin')
         or public.has_role(auth.uid(), 'staff'));

-- =========================================================
-- 6. INSTITUTION REGISTRATION REQUESTS
-- =========================================================
create table public.institution_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid references auth.users(id) on delete set null,
  requester_email text not null,
  requester_name text not null,
  institution_name text not null,
  institution_type public.institution_type not null,
  city text,
  address text,
  description text,
  status public.request_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.institution_requests to authenticated;
grant all on public.institution_requests to service_role;
alter table public.institution_requests enable row level security;
create policy "Requesters see own request, super admins see all"
  on public.institution_requests for select to authenticated
  using (auth.uid() = requester_user_id or public.has_role(auth.uid(), 'super_admin'));
create policy "Anyone signed in can submit a request"
  on public.institution_requests for insert to authenticated
  with check (auth.uid() = requester_user_id);
create policy "Super admins update requests"
  on public.institution_requests for update to authenticated
  using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

-- =========================================================
-- 7. PAYMENT METHODS (prototype only — never store real PAN/CVC)
-- =========================================================
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cardholder text not null,
  brand text not null,
  last4 text not null,
  exp_month text not null,
  exp_year text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.payment_methods to authenticated;
grant all on public.payment_methods to service_role;
alter table public.payment_methods enable row level security;
create policy "Own payment methods" on public.payment_methods for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- 8. AUTO-CREATE PROFILE ON SIGNUP
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
