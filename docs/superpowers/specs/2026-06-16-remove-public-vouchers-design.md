# Remove Voucher from New-User Signup — Design

**Date:** 2026-06-16
**Status:** Approved

## Goal

Stop new users from signing up for free via a voucher. Event registration,
membership renewal, and all **admin/instructor** voucher tooling are retained so
the feature keeps working and can be restructured/reused later.

## Scope

### Removed — voucher at new-user signup only

1. **`/register` (signup)** — `frontend/src/app/register/page.tsx`
   - Remove voucher state (`voucherCode`, `voucherValidating`, `voucherValid`,
     `voucherError`), the validate handler, and the `registerWithVoucher` branch.
   - New users use the existing Razorpay pay flow only (the `paymentStep`
     "form" → "paying" → "verifying" → "done" path already exists and stays).

2. **Auth store** — `frontend/src/store/authStore.ts`
   - Remove the `registerWithVoucher` method and its type declaration. The
     register page is its only consumer.

### Removed — backend public route

In `backend/src/routes/voucherRoutes.ts`, delete this route registration:

- `POST /vouchers/redeem/registration` (currently **unauthenticated** — must be
  removed so the free-signup path cannot be hit directly by bypassing the UI).

The corresponding controller function `redeemVoucherForRegistration` in
`backend/src/controllers/voucherController.ts` is **kept in place (unused)** so
the logic is available to restructure later. Remove its now-unused import from
`voucherRoutes.ts` only.

## Explicitly untouched

- **`/events/[id]` (event registration)** — voucher flow stays fully functional
  (UI + `POST /vouchers/redeem/event/:eventId`).
- **`/renew-membership`** — stays voucher-only and fully functional.
- Backend `POST /vouchers/validate`, `POST /vouchers/redeem/event/:eventId`,
  `POST /vouchers/redeem/renewal`, `POST /vouchers/redeem/register-student`, and
  admin routes (`create`, `all`, `:id/deactivate`) — all kept.
- Admin/instructor UI: `VoucherManager`, `RegisterStudentModal`,
  `EnrollStudentModal`, `PaymentManagement` voucher display — all kept.

## Data / API impact

- No schema changes. `CashVoucher` model and all admin tooling unchanged.
- Existing unredeemed vouchers remain valid for renewal and
  instructor-initiated registration; they can no longer be used for public
  self-service signup or event registration.

## Error handling

- After removal, `POST /vouchers/redeem/registration` returns the app's standard
  404 for unmatched routes. No special handling needed.
- The register page must still surface its existing pay-flow errors; removing the
  voucher branch must not affect the pay code path.

## Testing / verification

- `npx tsc --noEmit` passes for both `backend` and `frontend` (no dangling
  references to removed state/methods/imports).
- `npx next build` succeeds; `/register` compiles.
- Manual:
  - `/register` shows no voucher field; the pay flow still reaches Razorpay.
  - `/events/[id]` still shows the voucher option and event registration works.
  - `/renew-membership` still works (voucher redemption intact).
  - Admin "Cash Vouchers" tab (create/list/deactivate) still works; instructor
    "register/enroll student" modals still validate + redeem.
  - `curl -X POST <api>/vouchers/redeem/registration` returns 404.

## Out of scope (YAGNI)

- Adding a pay flow to renewal.
- Deleting the `CashVoucher` model or admin voucher management.
- Removing the kept controller functions (retained for future restructure).
