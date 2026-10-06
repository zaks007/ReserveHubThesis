-- ReserveHub: simulated wallets, ledger, commission rates.
-- No real money moves. Run once in Supabase SQL Editor.

-- 1. Commission rates (single source of truth)
create table if not exists public.commission_rates (
  institution_type text primary key,
  percent numeric(5,2) not null check (percent >= 0 and percent <= 100)
);
grant select on public.commission_rates to anon, authenticated;
grant all on public.commission_rates to service_role;
alter table public.commission_rates enable row level security;
create policy "Commission rates readable" on public.commission_rates for select using (true);
create policy "Super admin manages rates" on public.commission_rates for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));
insert into public.commission_rates values
  ('hotel',15),('airbnb',10),('sports',12),('garden',8),('university',10),('other',15)
on conflict (institution_type) do nothing;

-- 2. Wallets
create table if not exists public.wallets (
  owner_type text not null check (owner_type in ('user','institution','platform')),
  owner_id uuid not null,
  balance numeric(12,2) not null default 0,
  withdrawn_total numeric(12,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (owner_type, owner_id)
);
grant select on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;

-- 3. Ledger
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_owner_type text not null check (wallet_owner_type in ('user','institution','platform')),
  wallet_owner_id uuid not null,
  booking_id uuid references public.bookings(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  direction text not null check (direction in ('credit','debit')),
  kind text not null check (kind in ('payment','payout','commission','withdrawal','topup')),
  institution_type text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists wallet_tx_owner on public.wallet_transactions (wallet_owner_type, wallet_owner_id, created_at desc);
create unique index if not exists wallet_tx_one_payment_per_booking
  on public.wallet_transactions (booking_id) where kind = 'payment';
grant select on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;
alter table public.wallet_transactions enable row level security;

-- Platform wallet uses a fixed id
create or replace function public.platform_wallet_id() returns uuid
language sql immutable as $$ select '00000000-0000-0000-0000-000000000000'::uuid $$;

create or replace function public.is_institution_admin(_uid uuid, _inst uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles
    where user_id = _uid and role = 'institution_admin' and (institution_id = _inst or institution_id is null))
$$;

create or replace function public.can_see_wallet(_type text, _id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'super_admin')
    or (_type = 'user' and _id = auth.uid())
    or (_type = 'institution' and public.is_institution_admin(auth.uid(), _id))
$$;

create policy "See own wallets" on public.wallets for select to authenticated
  using (public.can_see_wallet(owner_type, owner_id));
create policy "See own transactions" on public.wallet_transactions for select to authenticated
  using (public.can_see_wallet(wallet_owner_type, wallet_owner_id));

-- Create wallet if missing; guests start with a 200,000 HUF demo balance.
create or replace function public.ensure_wallet(_type text, _id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.wallets (owner_type, owner_id, balance)
  values (_type, _id, case when _type = 'user' then 200000 else 0 end)
  on conflict do nothing;
  if _type = 'user' and found then
    insert into public.wallet_transactions (wallet_owner_type, wallet_owner_id, amount, direction, kind, note)
    values ('user', _id, 200000, 'credit', 'topup', 'Demo starting balance');
  end if;
end $$;

-- Callable by any signed-in user to create their own wallet.
create or replace function public.ensure_my_wallet() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  perform public.ensure_wallet('user', auth.uid());
end $$;

-- 4. Approve a booking and move the (simulated) money atomically.
create or replace function public.approve_booking_with_payment(_booking_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare
  b record; inst_id uuid; inst_type text; pct numeric; price numeric;
  unit_price numeric; unit text; platform_cut numeric; inst_cut numeric; guest_balance numeric;
begin
  select * into b from public.bookings where id = _booking_id for update;
  if not found then raise exception 'Booking not found'; end if;

  select i.id, i.type::text, s.price_per_unit, s.price_unit::text
    into inst_id, inst_type, unit_price, unit
  from public.spaces s join public.buildings bl on bl.id = s.building_id
  join public.institutions i on i.id = bl.institution_id where s.id = b.space_id;

  if not (public.has_role(auth.uid(), 'super_admin') or public.is_institution_admin(auth.uid(), inst_id)
          or public.has_role(auth.uid(), 'campus_admin')) then
    raise exception 'Not allowed to approve this booking';
  end if;

  -- Already paid? just make sure status is approved.
  if exists (select 1 from public.wallet_transactions where booking_id = _booking_id and kind = 'payment') then
    update public.bookings set status = 'approved', updated_at = now() where id = _booking_id;
    return json_build_object('ok', true, 'already_paid', true);
  end if;

  price := coalesce(nullif(b.total_price, 0),
    case when unit = 'hour' then unit_price * extract(epoch from (b.end_time - b.start_time)) / 3600
         else unit_price end, 0);
  price := round(price, 2);

  select percent into pct from public.commission_rates where institution_type = inst_type;
  if pct is null then select percent into pct from public.commission_rates where institution_type = 'other'; end if;
  platform_cut := round(price * coalesce(pct, 15) / 100, 2);
  inst_cut := price - platform_cut;

  perform public.ensure_wallet('user', b.user_id);
  perform public.ensure_wallet('institution', inst_id);
  perform public.ensure_wallet('platform', public.platform_wallet_id());

  select balance into guest_balance from public.wallets where owner_type = 'user' and owner_id = b.user_id for update;
  if guest_balance < price then
    raise exception 'Guest wallet balance (% HUF) is too low for this booking (% HUF)', guest_balance, price;
  end if;

  update public.wallets set balance = balance - price, updated_at = now() where owner_type='user' and owner_id=b.user_id;
  update public.wallets set balance = balance + inst_cut, updated_at = now() where owner_type='institution' and owner_id=inst_id;
  update public.wallets set balance = balance + platform_cut, updated_at = now() where owner_type='platform' and owner_id=public.platform_wallet_id();

  insert into public.wallet_transactions (wallet_owner_type, wallet_owner_id, booking_id, amount, direction, kind, institution_type, note) values
    ('user', b.user_id, _booking_id, price, 'debit', 'payment', inst_type, 'Booking payment'),
    ('institution', inst_id, _booking_id, inst_cut, 'credit', 'payout', inst_type, 'Booking income after ' || coalesce(pct,15) || '% commission'),
    ('platform', public.platform_wallet_id(), _booking_id, platform_cut, 'credit', 'commission', inst_type, coalesce(pct,15) || '% commission');

  update public.bookings set status = 'approved', total_price = price, rejection_reason = null, updated_at = now() where id = _booking_id;
  return json_build_object('ok', true, 'price', price, 'platform_cut', platform_cut, 'institution_cut', inst_cut);
end $$;

-- 5. Withdraw to a saved (fake) card.
create or replace function public.withdraw_from_wallet(_owner_type text, _owner_id uuid, _amount numeric, _card_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare bal numeric; card record;
begin
  if _owner_type = 'platform' then
    if not public.has_role(auth.uid(), 'super_admin') then raise exception 'Only the super admin can withdraw platform funds'; end if;
    _owner_id := public.platform_wallet_id();
  elsif _owner_type = 'institution' then
    if not (public.has_role(auth.uid(), 'super_admin') or public.is_institution_admin(auth.uid(), _owner_id)) then
      raise exception 'Not allowed'; end if;
  else
    raise exception 'Only institution and platform wallets can withdraw';
  end if;
  if _amount is null or _amount <= 0 then raise exception 'Amount must be positive'; end if;
  select * into card from public.payment_methods where id = _card_id and user_id = auth.uid();
  if not found then raise exception 'Card not found'; end if;

  perform public.ensure_wallet(_owner_type, _owner_id);
  select balance into bal from public.wallets where owner_type=_owner_type and owner_id=_owner_id for update;
  if bal < _amount then raise exception 'Not enough balance (% HUF available)', bal; end if;

  update public.wallets set balance = balance - _amount, withdrawn_total = withdrawn_total + _amount, updated_at = now()
    where owner_type=_owner_type and owner_id=_owner_id;
  insert into public.wallet_transactions (wallet_owner_type, wallet_owner_id, amount, direction, kind, note)
    values (_owner_type, _owner_id, _amount, 'debit', 'withdrawal', 'Transfer to card •••• ' || card.last4);
  return json_build_object('ok', true);
end $$;

revoke all on function public.ensure_wallet(text, uuid) from public, anon, authenticated;
grant execute on function public.ensure_my_wallet() to authenticated;
grant execute on function public.approve_booking_with_payment(uuid) to authenticated;
grant execute on function public.withdraw_from_wallet(text, uuid, numeric, uuid) to authenticated;
grant execute on function public.can_see_wallet(text, uuid) to authenticated;
grant execute on function public.is_institution_admin(uuid, uuid) to authenticated;
