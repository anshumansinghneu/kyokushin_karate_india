# Open-Registration Signup + Full Razorpay Removal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make new-user signup work without a mandatory voucher (open registration → PENDING approval), and completely remove the now-vestigial Razorpay integration (dead UI state, backend refs, and unused DB columns).

**Architecture:** Part A rewires `/register` from the voucher-gated `registerWithVoucher` path to the existing open `register` → `POST /auth/register` (creates a PENDING account, no payment/voucher). Part B deletes Razorpay columns from the `Payment` and `MerchOrder` Prisma models (+ migration) and removes every backend/frontend reference. Event vouchers, renewal vouchers, and all admin/instructor voucher tooling are untouched.

**Tech Stack:** Next.js 16 / React 19 / Zustand (`authStore`), Express + Prisma (PostgreSQL/Neon), TypeScript. Backend has no test runner — verify with `tsc` + manual checks; frontend uses vitest where helpful.

**Deploy note:** This repo deploys directly on `main` (user preference). The migration must be applied to Neon with `npx prisma migrate deploy` (NOT `migrate dev`, which can't run in the non-interactive shell — hand-author the migration SQL, then `migrate deploy`).

---

## File structure

**Part A — signup**
- Modify `backend/src/routes/voucherRoutes.ts` — drop the public registration redeem route + import.
- Modify `frontend/src/store/authStore.ts` — remove `registerWithVoucher`.
- Modify `frontend/src/app/register/page.tsx` — rewire to open registration.

**Part B — Razorpay teardown**
- Modify `backend/prisma/schema.prisma` + new migration — drop razorpay columns/index.
- Modify `backend/src/controllers/paymentController.ts` — drop `razorpayPaymentId` from invoice.
- Modify `backend/src/controllers/voucherController.ts` — cosmetic comment.
- Modify `frontend/src/app/payments/page.tsx`, `frontend/src/components/dashboard/PaymentManagement.tsx`, `StoreManagement.tsx`, `MyOrders.tsx` — remove razorpay fields/displays.

---

## Task 1: Remove the public voucher-registration route

**Files:**
- Modify: `backend/src/routes/voucherRoutes.ts`

- [ ] **Step 1: Remove the route + import**

In `backend/src/routes/voucherRoutes.ts`, delete this line from the import block:
```typescript
    redeemVoucherForRegistration,
```
And delete this route line (in the "Public Routes" section):
```typescript
router.post('/redeem/registration', redeemVoucherForRegistration);   // Register with voucher
```
Leave everything else (validate, event, renewal, register-student, admin routes) unchanged. The `redeemVoucherForRegistration` function stays in `voucherController.ts` (now unused) for future reuse.

- [ ] **Step 2: Verify it compiles**

Run from `backend/`: `npx tsc --noEmit`
Expected: no new errors. (Pre-existing unrelated errors, if any, are fine.)

- [ ] **Step 3: Commit**
```bash
git add backend/src/routes/voucherRoutes.ts
git commit -m "feat(signup): remove public voucher-registration route"
```

---

## Task 2: Remove `registerWithVoucher` from the auth store

**Files:**
- Modify: `frontend/src/store/authStore.ts`

- [ ] **Step 1: Remove the type declaration**

Delete this line (≈ line 48):
```typescript
    registerWithVoucher: (data: any) => Promise<void>;
```

- [ ] **Step 2: Remove the method implementation**

Delete the entire `registerWithVoucher` implementation block (≈ lines 105–122), which begins with the comment `// Register with cash voucher` and the `registerWithVoucher: async (data) => {` body that POSTs to `/vouchers/redeem/registration`, ending at its closing `},`. Leave the `register:` method (POSTs to `/auth/register`) intact.

- [ ] **Step 3: Verify it compiles**

Run from `frontend/`: `npx tsc --noEmit`
Expected: errors ONLY in `register/page.tsx` (still references `registerWithVoucher`) — those are fixed in Task 3. No other files should reference it (verify with `grep -rn "registerWithVoucher" frontend/src` → only `register/page.tsx`).

- [ ] **Step 4: Commit**
```bash
git add frontend/src/store/authStore.ts
git commit -m "feat(signup): remove registerWithVoucher from auth store"
```

---

## Task 3: Rewire `/register` to open registration

This is the largest change. The page is currently voucher-mandatory; after this it submits the form via `register()` → the account is created as `PENDING` and the user lands on the dashboard.

**Files:**
- Modify: `frontend/src/app/register/page.tsx`

- [ ] **Step 1: Use `register` instead of `registerWithVoucher`**

Change the store destructure (≈ line 67) from:
```typescript
    const { registerWithVoucher, isLoading, error: authError } = useAuthStore();
```
to:
```typescript
    const { register, isLoading, error: authError } = useAuthStore();
```

- [ ] **Step 2: Remove voucher state**

Delete the voucher state block (≈ lines 61–65):
```typescript
    // Voucher state
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherValidating, setVoucherValidating] = useState(false);
    const [voucherValid, setVoucherValid] = useState<{ amount: number; code: string } | null>(null);
    const [voucherError, setVoucherError] = useState("");
```

- [ ] **Step 3: Remove the voucher-validation handler**

Delete the entire `handleValidateVoucher` function (starts ≈ line 255 with `// Voucher validation` / `const handleValidateVoucher = async () => {` and ends at its closing `};` ≈ line 277). It calls `/vouchers/validate` and sets the voucher state being removed.

- [ ] **Step 4: Replace the submit branch**

In `handleSubmit`, replace the mandatory-voucher branch:
```typescript
            // ── VOUCHER PATH (mandatory) ──
            if (!voucherValid) {
                useAuthStore.setState({ error: 'Please validate a voucher code to complete registration.' });
                return;
            }

            setPaymentStep("verifying");
            await registerWithVoucher({
                ...payload,
                voucherCode: voucherValid.code,
            });
            setPaymentStep("done");
            setTimeout(() => router.push("/dashboard"), 1500);
```
with:
```typescript
            setPaymentStep("verifying");
            await register(payload);
            setPaymentStep("done");
            setTimeout(() => router.push("/dashboard"), 1500);
```

- [ ] **Step 5: Remove the voucher UI section**

Delete the entire voucher block in the JSX — from the comment `{/* Voucher Section — Mandatory */}` and its wrapping `<div className="space-y-3 sm:space-y-4">…</div>` through the closing of the `{!voucherValid && (…)}` amber-warning block (≈ lines 1044–1102). This is the `<h3>Voucher Code *</h3>`, the code `<Input>` + Verify button, and the `voucherError` / `voucherValid` / `!voucherValid` blocks.

- [ ] **Step 6: Remove the payment/fee info block**

Delete the fee block that follows it (≈ lines 1104–1139), beginning `{/* Payment Info Section */}` and the `{paymentInfo && !voucherValid && (` motion.div through its closing `)}`. (It references the removed `voucherValid`.)

- [ ] **Step 7: Remove the now-unused `paymentInfo` state + fetch**

Delete the `paymentInfo` state declaration (≈ line 23, `const [paymentInfo, setPaymentInfo] = useState<…>(null);`) and the `fetchPaymentConfig` effect/function that calls `api.get('/payments/config')` and `setPaymentInfo(...)` (≈ lines 84–99, including its `fetchPaymentConfig();` invocation). Registration no longer shows a fee. (Leave the `/payments/config` endpoint itself — renewal still uses it.)

- [ ] **Step 8: Fix the desktop submit button**

In the desktop submit `<Button>` (≈ line 1150), change:
```typescript
                                            disabled={isLoading || paymentStep !== "form" || !voucherValid}
```
to:
```typescript
                                            disabled={isLoading || paymentStep !== "form"}
```
And in its label branches, change `Redeeming Voucher...` → `Creating Account...` and `Register with Voucher` → `Create Account` (leave the `Registration Complete!` / `Processing...` branches as-is).

- [ ] **Step 9: Fix the mobile submit button**

In the mobile sticky `<Button>` (≈ line 1189), change:
```typescript
                                            disabled={isLoading || paymentStep !== "form" || !voucherValid}
```
to:
```typescript
                                            disabled={isLoading || paymentStep !== "form"}
```
And change its labels `Redeeming...` → `Creating...` and `Register with Voucher` → `Create Account`.

- [ ] **Step 10: Clean up now-unused imports**

After the edits, remove any imports that are no longer referenced (e.g. `CreditCard` if it was only used in the fee block; `CheckCircle2`/`AlertCircle`/`Loader2`/`Shield` only if no longer used anywhere — verify each with a quick search before removing). Run `npx tsc --noEmit` from `frontend/`; it will flag unused-import/undefined-name issues. Expected after cleanup: **no errors**.

- [ ] **Step 11: Manual sanity (dev server)**

With the frontend dev server running, load `/register`: confirm there is **no voucher field**, the form submits, and on success it routes to `/dashboard`. (Backend can be local or the live API.)

- [ ] **Step 12: Commit**
```bash
git add frontend/src/app/register/page.tsx
git commit -m "feat(signup): open registration (remove mandatory voucher)"
```

---

## Task 4: Drop Razorpay columns from the schema (+ migration)

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/<timestamp>_remove_razorpay/migration.sql`

- [ ] **Step 1: Remove columns from `Payment`**

In `backend/prisma/schema.prisma`, in `model Payment`, delete these lines:
```prisma
  // Razorpay
  razorpayOrderId   String?       @unique
  razorpayPaymentId String?
  razorpaySignature String?
```
and the index line:
```prisma
  @@index([razorpayOrderId])
```

- [ ] **Step 2: Remove columns from `MerchOrder`**

In `model MerchOrder`, delete these lines:
```prisma
  razorpayOrderId String?
  razorpayPaymentId String?
```

- [ ] **Step 3: Create the migration SQL**

Create `backend/prisma/migrations/<timestamp>_remove_razorpay/migration.sql` (use a timestamp like `20260616120000`) with:
```sql
-- DropIndex
DROP INDEX IF EXISTS "Payment_razorpayOrderId_key";
DROP INDEX IF EXISTS "Payment_razorpayOrderId_idx";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "razorpayOrderId",
                      DROP COLUMN IF EXISTS "razorpayPaymentId",
                      DROP COLUMN IF EXISTS "razorpaySignature";

ALTER TABLE "MerchOrder" DROP COLUMN IF EXISTS "razorpayOrderId",
                         DROP COLUMN IF EXISTS "razorpayPaymentId";
```

- [ ] **Step 4: Regenerate the client + apply**

Run from `backend/`:
```bash
npx prisma generate
npx prisma migrate deploy
```
Expected: `prisma generate` succeeds; `migrate deploy` reports the `remove_razorpay` migration applied. (If the shell can't reach the DB, `generate` must still succeed so types update; note that `migrate deploy` should be run in an environment with DB access.)

- [ ] **Step 5: Verify the client types dropped the fields**

Run from `backend/`:
```bash
node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();const f=require('@prisma/client').Prisma.PaymentScalarFieldEnum;console.log('razorpayOrderId' in f)"
```
Expected: `false`.

- [ ] **Step 6: Commit**
```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(razorpay): drop razorpay columns from Payment and MerchOrder"
```

---

## Task 5: Remove Razorpay from backend controllers

**Files:**
- Modify: `backend/src/controllers/paymentController.ts`
- Modify: `backend/src/controllers/voucherController.ts`

- [ ] **Step 1: Remove `razorpayPaymentId` from the invoice response**

In `backend/src/controllers/paymentController.ts` (`getPaymentInvoice`, ≈ line 138), delete this property from the returned object:
```typescript
                razorpayPaymentId: payment.razorpayPaymentId || null,  // historical — kept for old records
```

- [ ] **Step 2: Update the cosmetic comment**

In `backend/src/controllers/voucherController.ts` (≈ line 156), change:
```typescript
// Creates user account with voucher instead of Razorpay payment
```
to:
```typescript
// Creates user account with a voucher
```

- [ ] **Step 3: Verify it compiles**

Run from `backend/`: `npx tsc --noEmit`
Expected: no errors referencing `razorpay*` (the Prisma types no longer have those fields, so any missed reference would surface here).

- [ ] **Step 4: Commit**
```bash
git add backend/src/controllers/paymentController.ts backend/src/controllers/voucherController.ts
git commit -m "feat(razorpay): remove razorpay refs from controllers"
```

---

## Task 6: Remove Razorpay from the frontend displays

**Files:**
- Modify: `frontend/src/app/payments/page.tsx`
- Modify: `frontend/src/components/dashboard/PaymentManagement.tsx`
- Modify: `frontend/src/components/dashboard/StoreManagement.tsx`
- Modify: `frontend/src/components/dashboard/MyOrders.tsx`

- [ ] **Step 1: `payments/page.tsx`**

- Remove `razorpayPaymentId: string;` from the invoice interface (≈ line 32).
- Remove the PDF line (≈ line 130):
```typescript
            doc.text(`Transaction ID: ${invoice.razorpayPaymentId || 'N/A'}`, 15, y);
```
(If `y` is advanced after this line, keep the surrounding spacing consistent — only remove this one `doc.text` call.)

- [ ] **Step 2: `PaymentManagement.tsx`**

- Remove from the interface (≈ lines 13–14):
```typescript
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
```
- Remove the search-filter clause (≈ line 128):
```typescript
                (p.razorpayPaymentId || "").toLowerCase().includes(lowerSearch)
```
  — adjust the surrounding boolean expression so it stays valid (drop the `||` that joined it).
- In the CSV export (≈ lines 143–145): remove the `Transaction ID` portion that emits `p.razorpayPaymentId` from both the header string and the row template, keeping the rest of the columns intact.
- Remove the table column header `Transaction ID` and the matching `<td>` cell that renders `{payment.razorpayPaymentId || '—'}` (≈ line 399).

- [ ] **Step 3: `StoreManagement.tsx`**

Remove the two display spans (≈ lines 241–242):
```typescript
                                            {order.razorpayPaymentId && <span>Payment ID: {order.razorpayPaymentId}</span>}
                                            {order.razorpayOrderId && <span>Order Ref: {order.razorpayOrderId}</span>}
```
(If `MerchOrder`'s frontend interface in this file declares those fields, remove them too.)

- [ ] **Step 4: `MyOrders.tsx`**

Remove the "Transaction ID" display block (≈ lines 179–182):
```typescript
                                    {order.razorpayPaymentId && (
                                        ...
                                            <p className="text-sm text-white">Transaction ID: {order.razorpayPaymentId}</p>
                                        ...
                                    )}
```
(Remove the full conditional block. If this file's order interface declares `razorpayPaymentId`, remove it too.)

- [ ] **Step 5: Verify it compiles + grep clean**

Run from `frontend/`:
```bash
npx tsc --noEmit
grep -rni "razorpay" src || echo "NO RAZORPAY REFS LEFT"
```
Expected: tsc clean; grep prints `NO RAZORPAY REFS LEFT`.

- [ ] **Step 6: Commit**
```bash
git add frontend/src/app/payments/page.tsx frontend/src/components/dashboard/PaymentManagement.tsx frontend/src/components/dashboard/StoreManagement.tsx frontend/src/components/dashboard/MyOrders.tsx
git commit -m "feat(razorpay): remove razorpay displays from frontend"
```

---

## Task 7: Final verification

- [ ] **Step 1: Type-check both packages**
```bash
cd backend && npx tsc --noEmit && cd ../frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 2: Frontend production build**

Run from `frontend/`: `npx next build`
Expected: success; `/register`, `/payments`, and dashboard routes compile.

- [ ] **Step 3: Backend route check (with dev server + DB)**
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8000/api/vouchers/redeem/registration -H 'Content-Type: application/json' -d '{}'
```
Expected: `404` (route removed).

- [ ] **Step 4: Manual smoke (deployed or local)**
  - `/register` → no voucher field; submitting creates a PENDING account → dashboard.
  - `/events/[id]` → voucher option still present and working.
  - `/renew-membership` → still works.
  - Admin Cash Vouchers tab + instructor register/enroll modals → still work.
  - Admin Payments / Store / `MyOrders` → render with no Razorpay fields, no errors.

---

## Spec coverage check

- Open registration (remove mandatory voucher, wire to `register`) → Tasks 1, 2, 3. ✓
- Keep event/renewal vouchers + admin tooling → untouched (no task modifies them). ✓
- Drop razorpay columns from Payment + MerchOrder (+ migration) → Task 4. ✓
- Backend razorpay refs (invoice field, comment) → Task 5. ✓
- Frontend razorpay displays (4 files) → Task 6. ✓
- `/payments/config` kept for renewal → not removed (Task 3 only removes its use in signup). ✓
- Verification (tsc, build, 404, manual) → Task 7. ✓
