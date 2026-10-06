# Move ReserveHub to your own permanent Supabase project

Your app already talks to an external Supabase project (`gqdisszctkqkrklwhyqn`), not Lovable Cloud. So this is a clean copy into a brand-new project you own, then a handover to GitHub and IntelliJ. No second database is created beyond the one fresh project you will keep forever, and nothing is deleted until the new one is verified.

Everything below is instructions only. Nothing changes until you confirm each stage.

## Step 0 (before migration) — Remove the embedded map

Per your request, the interactive Google Maps embed on each institution page is removed. It becomes a plain "Open in Google Maps" link built from the institution's coordinates or address (`https://www.google.com/maps/search/?api=1&query=...`) that opens Google Maps in a new tab. This also means no Google Maps key is needed anywhere — one less thing to carry through the migration.

## Stage 1 — Create the fresh Supabase project

1. Go to supabase.com, sign in with the account you will keep (use your own, not a shared one).
2. Click **New project**, pick your organisation.
3. Name it (e.g. `reservehub`), choose a region close to you (Frankfurt for Hungary), set a strong database password and save it in a password manager.
4. Wait for provisioning (1-2 minutes).

## Stage 2 — The credentials you give me

In the new project open **Project Settings → API**:

- **Project URL** — looks like `https://xxxxxxxx.supabase.co`. Safe to share.
- **Publishable / anon key** — starts with `sb_publishable_` or `eyJ...`. Safe to share and safe in the browser and on GitHub.

Do **not** send me, or put anywhere in the app, the **service_role / secret key**. It is never needed by this React app.

Also open **Project Settings → Database → Connection string** only if you later want to connect from IntelliJ's database tool; that password stays with you.

## Stage 3 — Point the app at the new project

I will change one file, `src/integrations/supabase/client.ts`, so it reads:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

with your new project's values as the fallback defaults. That removes the old project's values from the code entirely, so nothing can silently keep using the old database.

## Stage 4 — Recreate the schema in the new project

The full schema already lives in the repo, so this is copy-paste, in this order, in **SQL Editor → New query**:

1. `supabase/schema.sql` — enums, `profiles`, `user_roles`, `institutions`, `campuses`, `buildings`, `spaces`, `bookings`, `institution_requests`, `payment_methods`, grants, row-level security policies, the `has_role` helper and the signup trigger.
2. `supabase/0002_institution_requests_rejection.sql` — the rejection reason column.
3. `supabase/0003_hotel_divinus_media_rating.sql` — Hotel Divinus photo and 5.0 rating.

I will paste the exact contents into chat for each step when you reach it.

## Stage 5 — Move the data

Your current data is of two kinds:

- **Seed/demo data** (institutions, campuses, buildings, spaces): reproduced exactly by running `supabase/seed.sql` in the new project. Deterministic IDs, so every link in the app still resolves.
- **Real rows you created while testing** (accounts, bookings, institution requests, payment methods): in the old project, open **Table Editor → each table → Export → CSV**, then in the new project import the CSV per table in this order: `profiles`, `user_roles`, `institution_requests`, `payment_methods`, `bookings`. Tell me if you want to keep these; if the test rows don't matter we skip this and you sign up fresh.

Authentication users do not copy by CSV. Options: sign up again in the new project (simplest, recommended for a thesis demo), or I add a small one-off admin script you run locally with the secret key on your machine only — never committed.

The old project stays untouched until you confirm the new one works.

## Stage 6 — Verify the new project has everything

Checklist we run together:

- In Supabase **Table Editor**: all 9 tables exist, `institutions` has 9 rows, `campuses` 4, `buildings` 21, `spaces` populated.
- **Authentication → Policies**: RLS enabled on every table.
- In the app preview: institution list loads, an institution detail page loads with its map, sign-up creates a profile row, a booking appears in `bookings`, an institution request appears in `institution_requests`, the role switcher still works.

Only after all of these pass do you consider the old project retired.

## Stage 7 — Supabase auth URLs

In the new project, **Authentication → URL Configuration**:

- Site URL: your Lovable preview URL now, later your production domain.
- Redirect URLs: add `<your domain>/auth/callback` for every place you run the app (preview, localhost:8080, production).

Without this, the emailed sign-in link breaks exactly like before.

## Stage 8 — Get the code into GitHub

1. In Lovable, top right → **GitHub** → **Connect to GitHub**, authorise, create the repository.
2. Lovable pushes the full project and keeps syncing while you still edit here.
3. Your Supabase connection travels with the code: it is in `src/integrations/supabase/client.ts` plus optional `.env` values. Nothing Lovable-specific is required for it to work.

## Stage 9 — IntelliJ

1. In IntelliJ IDEA: **Get from VCS** → paste the repository URL → clone.
2. Create a local `.env` file (already git-ignored) with:

   ```
   VITE_SUPABASE_URL=https://<your-new-project>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

3. Run `npm install`, then `npm run dev`. It hits the same Supabase project, same data, same accounts.
4. Add `http://localhost:8080` to Supabase's redirect URLs so login works locally.

## Stage 10 — Your final separate repository

On GitHub use **Use this template** / or locally:

```
git remote add thesis https://github.com/<you>/<final-repo>.git
git push thesis main
```

The Supabase connection is just code plus environment variables, so a new remote changes nothing about the database.

## Stage 11 — Deployment

Deploy to Vercel or Netlify (both handle this stack): import the final repository, and in the host's **Environment Variables** set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the same values. Then add the deployed domain to Supabase's Site URL and redirect URLs. Same database everywhere.

## Keys at each stage

| Stage | Needed | Where it lives |
| --- | --- | --- |
| Lovable | URL + publishable key | code fallback / `.env` |
| IntelliJ | URL + publishable key | local `.env`, not committed |
| Hosting | URL + publishable key | host's env var settings |
| One-off admin scripts (optional) | service_role key | your machine only, never committed |

## Technical notes

- `src/integrations/supabase/client.ts` is the only file with credentials; it stays SSR-safe with `persistSession` only in the browser.
- The role switcher and mock fallbacks in the contexts stay as they are — no functional changes in this migration.
- `supabase/` migration files are kept in the repo so the schema is reproducible from scratch for your thesis defence.

## Two decisions I need from you

1. Do you want the test accounts/bookings from the current project copied, or will you start fresh in the new one?
2. Hosting target: Vercel, Netlify, or undecided?
