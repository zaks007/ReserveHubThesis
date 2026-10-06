# Supabase setup for ReserveHub

Project URL: `https://vtljpuewlzkcjrcyehnc.supabase.co`

## 1. Run the schema

1. Open Supabase Dashboard → **SQL Editor** → **New query**
2. Paste the contents of `migrations/0001_init.sql`
3. Click **Run**

This creates: enums, `profiles`, `user_roles` + `has_role()`, `institutions`,
`campuses`, `buildings`, `spaces`, `bookings`, `institution_requests`,
`payment_methods`, RLS policies, GRANTs, and an auto-profile trigger on signup.

## 2. Enable Email auth

Dashboard → **Authentication → Providers → Email** → enable.
Optionally enable **Password HIBP Check** in the same panel.

## 3. (Optional) Storage bucket for institution images

Dashboard → **Storage → New bucket** → name `institutions`, public read.

## 4. Frontend wiring

The frontend already points at your project (publishable key hard-coded in
`src/integrations/supabase/client.ts`). All Contexts still read from
`src/data/mockData.ts` — flip them to Supabase one at a time when ready:

- `InstitutionsContext` → `select * from institutions` join campuses/buildings/spaces
- `BookingsContext`     → `select * from bookings where user_id = auth.uid()`
- `PaymentMethodsContext` → `select * from payment_methods`
- `AuthContext`         → `supabase.auth.signUp / signInWithPassword / signOut`

## 5. Seed data (later)

Once the UI starts reading from Supabase, run a SQL `INSERT` that mirrors
`src/data/mockData.ts` so the demo institutions appear in the database.
