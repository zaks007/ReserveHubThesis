# Full-page institution editor for the Super Admin

## What you'll get
- In Super Admin > Institutions, clicking **Edit** opens a full page instead of a popup. Clicking **Add institution** opens the same page, empty.
- The page has a back link, plus **Save** and **Cancel** buttons.
- It works like editing a listing on a booking site:
  - **Details:** name, type, city, address, rating, description and main photo.
  - **Campuses / Buildings / Rooms tabs:** the same Add, Edit and Delete editor the university admin now has. Rooms include name, building, capacity, price and unit, features, photo, and available on/off.
- Every institution can be edited this way, not only universities.
- The old Add/Edit popups are removed. Deleting still asks you to confirm with a small box.

## How saving behaves
- Institution details save to the database. If that fails (a demo role, or a demo institution), they're kept in your browser so nothing silently disappears. This is how it already works.
- Campus, building and room changes save to the database only. When that's refused, a clear "Not saved" message explains why. Saving them needs a real super admin login, not the dev role switcher.

## Not included (later days)
- Wording that changes by type, for example Airbnb showing "Listings" with no campuses.
- Multiple photos, maps, and the full check of every page.

## Estimated cost
About 2–3 credits, which fits in one day.

## Technical details
- Move the campus/building/room editor out of `InstitutionAdminDashboard.tsx` into a shared `src/components/InstitutionStructureEditor.tsx` that takes an `institution` prop. The university dashboard keeps using it, so nothing changes there.
- New page `src/pages/InstitutionEditPage.tsx`, registered in `src/app-shell.tsx` as `/admin/institutions/new` and `/admin/institutions/:id/edit`. Only super admins can open it; everyone else is redirected.
- The page uses the existing `updateInstitution`, `createInstitution` and `saveRow`/`deleteRow` functions in the institutions data file. After a new institution is created, the structure tabs show once it has a database id.
- In `SuperAdminDashboard.tsx`, the Edit and Add buttons now open the new page, and the two popups and their form state are removed.
