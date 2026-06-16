# Open-Registration Signup + Full Razorpay Removal — Design

**Date:** 2026-06-16
**Status:** Approved

## Goal

Two related changes:

- **A. Signup:** New users no longer need a mandatory voucher (which currently
  grants a free 1-year membership) to register. Signup becomes open registration:
  submit the form → account created as `PENDING` → instructor/admin approves.
- **B. Razorpay:** Razorpay is **not actively integrated** (no checkout fires
  anywhere — only historical DB columns and admin displays remain). Remove it
  completely, including the unused DB columns.

Event-registration vouchers, renewal vouchers, and all admin/instructor voucher
tooling remain working.

## Background (current state)

- `/register` is **voucher-mandatory**: the submit buttons are disabled until a
  voucher validates, and registration only calls `registerWithVoucher` →
  `POST /vouchers/redeem/registration` (unauthenticated). There is **no live
  payment** at signup.
- A working voucher-free path already exists: `authStore.register` →
  `POST /auth/register`, which creates the user as `membershipStatus: PENDING`
  with no payment/voucher. It is simply not wired into the page.
- Razorpay: no `window.Razorpay`/checkout/order-verify anywhere. Only:
  - `Payment` model columns `razorpayOrderId @unique`, `razorpayPaymentId`,
    `razorpaySignature` + `@@index([razorpayOrderId])`.
  - `MerchOrder` model columns `razorpayOrderId`, `razorpayPaymentId` (never
    written — `merchController.createOrder` doesn't set them).
  - Backend: `paymentController` returns `razorpayPaymentId` in invoice data;
    `voucherController` has a comment mentioning Razorpay.
  - Frontend display refs in `payments/page.tsx`, `PaymentManagement.tsx`,
    `StoreManagement.tsx`, `MyOrders.tsx`.

## Part A — Open-registration signup

**Frontend `frontend/src/app/register/page.tsx`:**
- Remove the mandatory voucher section (the "Voucher Section — Mandatory" block),
  voucher state (`voucherCode`, `voucherValidating`, `voucherValid`,
  `voucherError`) and `handleValidateVoucher`.
- In `handleSubmit`, remove the `if (!voucherValid)` gate and the
  `registerWithVoucher` call; call `register(payload)` instead. On success,
  redirect to `/dashboard` (the user is logged in as PENDING; the dashboard shows
  the pending-approval state).
- Update the destructure to pull `register` (not `registerWithVoucher`).
- Update both submit buttons: remove the `!voucherValid` disabled condition and
  the "Register with Voucher" / "Redeeming Voucher…" labels → "Create Account" /
  submitting state. Drop the `paymentStep === "done"` voucher copy.
- Remove the `/payments/config` fetch + fee/`paymentInfo` display (registration is
  free → pending). Keep a simple submitting flag in place of `paymentStep` if
  needed for button state.

**Frontend `frontend/src/store/authStore.ts`:**
- Remove the `registerWithVoucher` method and its type declaration. Keep `register`.

**Backend `backend/src/routes/voucherRoutes.ts`:**
- Remove the `POST /vouchers/redeem/registration` route and its now-unused import
  `redeemVoucherForRegistration`. The controller function stays in
  `voucherController.ts` (unused) for possible future reuse.

## Part B — Full Razorpay removal

**Schema `backend/prisma/schema.prisma`:**
- `Payment` model: remove `razorpayOrderId`, `razorpayPaymentId`,
  `razorpaySignature`, and the `@@index([razorpayOrderId])`.
- `MerchOrder` model: remove `razorpayOrderId`, `razorpayPaymentId`.
- Create a migration dropping these columns (and the unique constraint + index on
  `Payment.razorpayOrderId`). Apply with `prisma migrate deploy` (Neon, prod) per
  the project deploy process.

**Backend:**
- `paymentController.ts`: remove `razorpayPaymentId` from the invoice response
  object (`getPaymentInvoice`).
- `voucherController.ts`: update the line-156 comment to drop the Razorpay mention
  (cosmetic; no logic change).

**Frontend (remove field from interfaces + all displays/usages):**
- `app/payments/page.tsx`: remove `razorpayPaymentId` from the invoice interface
  and the "Transaction ID" line in the generated PDF.
- `components/dashboard/PaymentManagement.tsx`: remove `razorpayOrderId` /
  `razorpayPaymentId` from the interface, the search filter on `razorpayPaymentId`,
  the CSV "Voucher"/transaction column that emits `razorpayPaymentId`, and the
  table cell + its column header.
- `components/dashboard/StoreManagement.tsx`: remove the "Payment ID" / "Order Ref"
  display lines.
- `components/dashboard/MyOrders.tsx`: remove the "Transaction ID" display block.

## Explicitly untouched

- `/events/[id]` voucher flow + `POST /vouchers/redeem/event/:eventId`.
- `/renew-membership` (voucher-only) + `POST /vouchers/redeem/renewal`.
- `POST /vouchers/validate`, `POST /vouchers/redeem/register-student`, admin
  voucher routes, `VoucherManager`, `RegisterStudentModal`, `EnrollStudentModal`.
- `Payment` and `MerchOrder` models themselves (only razorpay columns removed),
  the `/payments/config` endpoint (renewal still shows the fee a voucher must
  cover), and the merch store order flow.
- `Payment.registrationData` column (leftover from the dead payment-registration
  flow but not Razorpay-specific) — out of scope.

## Testing / verification

- `npx tsc --noEmit` passes for `backend` and `frontend` (no dangling references
  to removed fields/methods/imports/columns).
- `npx prisma generate` succeeds; migration created; `migrate deploy` applies on
  Neon.
- `npx next build` succeeds; `/register`, `/payments`, store/admin pages compile.
- Manual:
  - `/register` shows **no voucher field**; submitting creates a PENDING account
    and lands on the dashboard pending state.
  - `/events/[id]` still shows the voucher option and works.
  - `/renew-membership` still works.
  - Admin "Cash Vouchers" tab + instructor register/enroll modals still work.
  - Admin Payments / Store / My Orders pages render with no Razorpay fields and no
    runtime errors.
  - `curl -X POST <api>/vouchers/redeem/registration` → 404.

## Out of scope (YAGNI)

- Adding any payment gateway or pay-at-signup flow.
- Removing the `CashVoucher` model or admin voucher management.
- Removing `Payment`/`MerchOrder` models or the `registrationData` column.
- Removing the kept `redeemVoucherForRegistration` controller function.
