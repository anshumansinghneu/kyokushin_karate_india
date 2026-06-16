# Remove Vouchers from Public Signup & Event Registration — Design

**Date:** 2026-06-16
**Status:** Approved

## Goal

Stop new users from signing up for free via a voucher, and stop members from
using vouchers when registering for events. Membership **renewal** keeps its
voucher flow (it has no other payment path today), and all **admin/instructor**
voucher tooling is retained so the feature can be restructured and reused later.

## Scope

### Removed — member self-service voucher entry points

1. **`/register` (signup)** — `frontend/src/app/register/page.tsx`
   - Remove voucher state (`voucherCode`, `voucherValidating`, `voucherValid`,
     `voucherError`), the validate handler, and the `registerWithVoucher` branch.
   - New users use the existing Razorpay pay flow only (the `paymentStep`
     "form" → "paying" → "verifying" → "done" path already exists and stays).

2. **`/events/[id]` (event registration)** — `frontend/src/app/events/[id]/page.tsx`
   - Remove voucher state, `handleValidateEventVoucher`, and the
     voucher-redeem branch.
   - Members use the existing paid-event (Razorpay) and free-event
     (`handleFreeRegistration`) paths only.

3. **Auth store** — `frontend/src/store/authStore.ts`
   - Remove the `registerWithVoucher` method and its type declaration. The
     register page is its only consumer.

### Removed — backend public routes

In `backend/src/routes/voucherRoutes.ts`, delete these route registrations:

- `POST /vouchers/redeem/registration` (currently **unauthenticated** — must be
  removed so the free-signup path cannot be hit directly by bypassing the UI).
- `POST /vouchers/redeem/event/:eventId` (only the public events page used it;
  `EnrollStudentModal` uses `/events/:id/enroll-student`, not this).

The corresponding controller functions `redeemVoucherForRegistration` and
`redeemVoucherForEvent` in `backend/src/controllers/voucherController.ts` are
**kept in place (unused)** so the logic is available to restructure later.
Remove their now-unused imports from `voucherRoutes.ts` only.

## Explicitly untouched

- **`/renew-membership`** — stays voucher-only and fully functional.
- Backend `POST /vouchers/validate` and `POST /vouchers/redeem/renewal` — kept
  (used by the renewal page and the instructor modals).
- `POST /vouchers/redeem/register-student` and admin routes
  (`create`, `all`, `:id/deactivate`) — kept.
- Admin/instructor UI: `VoucherManager`, `RegisterStudentModal`,
  `EnrollStudentModal`, `PaymentManagement` voucher display — all kept.

## Data / API impact

- No schema changes. `CashVoucher` model and all admin tooling unchanged.
- Existing unredeemed vouchers remain valid for renewal and
  instructor-initiated registration; they can no longer be used for public
  self-service signup or event registration.

## Error handling

- After removal, `POST /vouchers/redeem/registration` and
  `POST /vouchers/redeem/event/:eventId` return the app's standard 404 for
  unmatched routes. No special handling needed.
- Register and event pages must still surface their existing pay-flow errors;
  removing the voucher branch must not affect the pay/free code paths.

## Testing / verification

- `npx tsc --noEmit` passes for both `backend` and `frontend` (no dangling
  references to removed state/methods/imports).
- `npx next build` succeeds; `/register` and `/events/[id]` compile.
- Manual:
  - `/register` shows no voucher field; the pay flow still reaches Razorpay.
  - `/events/[id]` shows no voucher field; paid and free registration still work.
  - `/renew-membership` still works (voucher redemption intact).
  - Admin "Cash Vouchers" tab (create/list/deactivate) still works; instructor
    "register/enroll student" modals still validate + redeem.
  - `curl -X POST <api>/vouchers/redeem/registration` returns 404.

## Out of scope (YAGNI)

- Adding a pay flow to renewal.
- Deleting the `CashVoucher` model or admin voucher management.
- Removing the kept controller functions (retained for future restructure).
