# Simulated wallet and payment system

No real money moves anywhere. Everything is fake data, stored in your Supabase project.

## What you'll get

**1. Add-card page (full page, not a popup)**
- New page reached from Account settings > Payment methods > "Add card".
- A card preview updates as you type. The number is spaced in groups of 4, with an MM/YY expiry, a CVC field, and the Visa / Mastercard / Amex logo detected automatically.
- Cards still save to the existing payment methods table, keeping only the last 4 digits. The CVC is never saved.

**2. Wallets and transaction history**
- Every user, every institution and the platform (super admin) has a wallet balance.
- When a booking is approved:
  - The guest's wallet is charged the full price.
  - The platform keeps its commission: Hotel 15%, Airbnb 10%, Sports 12%, Garden 8%, University 10%, any other type 15%.
  - The institution gets the rest.
  - All three movements are logged in the history.
- The rates live in one place (a small database table), so they're easy to change later.
- New **Wallet** page for every signed-in role:
  - **Guests:** balance and history.
  - **Institution admins:** their institution's balance, history and withdrawn total.
  - **Super admin:** platform balance, history, and a breakdown of earnings by institution type.

**3. Withdraw to card**
- Institution admins and the super admin can "Transfer to card": pick a saved card and an amount, see a short fake "Processing…" step, then a success screen.
- The amount moves from the balance into "withdrawn" and is logged.

## Assumptions (tell me if wrong)
- **Starting money:** every guest wallet starts with a demo balance of 200,000 HUF so bookings can be paid.
- **Low balance:** if a guest can't afford a booking, approval is blocked with a clear message. (Alternative: let the balance go negative.)
- **Booking price:** the charge uses the price the booking already has. If bookings don't store one, I'll work it out from the room price times the length of the stay.
- **Dev role:** demo roles aren't real logins, so the database refuses money movements for them, just like other saves. Wallets work fully with real accounts only.

## SQL you'll run in Supabase
A new file, `supabase/0005_wallets.sql`, to paste into the SQL Editor once. It adds the wallets, the transaction history, the commission rates and the approve and withdraw actions.

## Estimated cost
About 4–6 credits, so probably two days within your 5-per-day limit.

## Technical details
- **Tables:**
  - `wallets` (owner_type user|institution|platform, owner_id, balance, withdrawn_total; unique on owner_type and owner_id)
  - `wallet_transactions` (id, wallet_owner_type, wallet_owner_id, booking_id, amount, direction credit|debit, kind payment|commission|payout|withdrawal, created_at)
  - `commission_rates` (institution_type text primary key, percent), seeded with the six rates above, `other` as the fallback.
- **Grants and access rules:**
  - GRANTs in the same file as each table.
  - Users read their own wallet and transactions. Institution admins read their institution's. The super admin (`has_role`) reads all.
  - There is no direct insert or update from the browser.
- **Database functions** (`security definer`, so the money moves in one step and can't be tampered with from the browser):
  - `approve_booking_with_payment(booking_id)`: checks the caller is an admin of that institution or a super admin. It then sets the status to approved and makes the debit and the two credits plus three history rows, all at once. It is idempotent: re-approving won't charge twice.
  - `withdraw_from_wallet(owner_type, owner_id, amount, card_id)`: checks ownership and that the balance is enough, then moves the amount to withdrawn_total and logs a debit.
  - Guest wallets are created automatically with the demo balance on first use.
- **Frontend:**
  - `BookingsContext.updateStatus("approved")` calls the approve function for real bookings. Demo bookings keep their current local behaviour.
  - New `src/contexts/WalletContext.tsx`.
  - New pages, registered in `src/app-shell.tsx`: `src/pages/Wallet.tsx` (`/wallet`), `src/pages/AddCard.tsx` (`/account/cards/new`), and the withdraw flow inside the Wallet page.
  - A "Wallet" link in the navbar.
  - The add-card popup is removed from `AccountSettings.tsx`.
- **Before building:** check the bookings table for an existing price column and adjust the charge calculation to match.
