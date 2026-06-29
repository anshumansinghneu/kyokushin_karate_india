# Fee Collection Summary & Auto Receipts — Design

**Date:** 2026-06-29
**Status:** Approved, ready for implementation plan

## Problem

The system already records per-student monthly fees (`MonthlyFee`: status, amount,
amountPaid, method, notes) with an instructor marking page and a student list page.
What's missing:

1. **Collection summary** — no way to see "₹15,000 expected this year, ₹5,000
   collected, ₹10,000 outstanding" or which months a student hasn't paid.
2. **Year-at-a-glance** per student (paid vs unpaid by month).
3. **Payment confirmation** — email today only goes out as a *reminder* for unpaid
   students. Nothing confirms a payment when an instructor marks Paid/Partial.

## Goals

- Per-student yearly ledger: total expected / paid / outstanding + a 12-month
  paid/unpaid breakdown. Visible to **both** the instructor (per student) and the
  student themselves.
- Whole-dojo collection total for a year (expected / collected / outstanding) plus a
  per-student summary row, for instructors/admins.
- Auto receipt email + in-app notification when an instructor saves a student as
  **Paid** or **Partial** (auto on every save; skipped for Unpaid/Waived).

## Non-Goals (YAGNI)

- No new database tables — `MonthlyFee` already holds everything; the ledger is
  computed on read.
- No backfilling of historical `MonthlyFee` rows — months with no record are treated
  as "expected at the dojo's current monthly rate, ₹0 paid."
- No de-duplication of receipt sends. Per the user's explicit choice (auto on every
  save), re-saving an already-paid row will re-send the receipt.

## Core Logic: `computeYearLedger`

A pure, unit-tested backend util — the only genuinely new logic.

```
computeYearLedger(year, joinDate, dojoMonthlyFee, feeRecords, today) => {
  months: Array<{ month: 1..12, expected: number, paid: number, status: FeeStatus | 'NOT_DUE' }>,
  totals: { totalExpected: number, totalPaid: number, totalOutstanding: number }
}
```

`joinDate` = the student's `membershipStartDate ?? createdAt`.
`feeRecords` = that student's `MonthlyFee` rows for `year`.

Rules:

- **Billable window** = months from `max(January, monthOf(joinDate within year))`
  through:
  - the **current month** when `year === today's year`, or
  - **December** for any past year.
  - For a **future year**, no months are billable (everything `NOT_DUE`).
  - If `joinDate` is in a year *after* `year`, no months are billable.
- For a **billable month**:
  - `expected` = `record.amount` if a record exists, else `dojoMonthlyFee` (treat a
    null dojo fee as 0).
  - `WAIVED` → `expected = 0`, status `WAIVED`.
  - `paid` = `record.amountPaid` (0 if no record).
  - status = `record.status` if a record exists, else `'UNPAID'`.
- For a **non-billable month** (before join, or in the future): `expected = 0`,
  `paid = 0`, status `'NOT_DUE'`.
- `totalExpected` / `totalPaid` = sums; `totalOutstanding = max(totalExpected − totalPaid, 0)`.

Edge cases the tests must cover: mid-year join, waived months, future months not
billed, partial months, no records at all, past year vs current year, null dojo fee.

## Backend Changes

All under the existing `feeRoutes` / `feeController` / a new util + email helper.

1. **`GET /api/fees/ledger/:userId?year=`**
   - Access: `ADMIN`; the student's own `primaryInstructor`; or the student
     themselves (`req.user.id === userId`).
   - Loads the student (`membershipStartDate`, `createdAt`, `dojoId`), the dojo's
     `monthlyFee`, and the student's `MonthlyFee` rows for the year.
   - Returns `computeYearLedger(...)` output plus `{ student: {name, ...}, year, dojoMonthlyFee }`.
   - Powers the instructor's per-student expand AND the student's `/my-fees`.

2. **`GET /api/fees/summary/dojo/:dojoId?year=`**
   - Access: `ADMIN`, or `INSTRUCTOR` restricted to their own students
     (`primaryInstructorId === currentUser.id`), mirroring `getDojoFees`.
   - Computes each student's ledger totals for the year, returns:
     `{ year, dojoMonthlyFee, totals: {expected, collected, outstanding}, rows: [{userId, name, membershipNumber, expected, paid, outstanding}] }`.
   - Powers both the whole-dojo banner and the roster summary column.

3. **Auto receipt email in `markFee`**
   - After the `upsert`, if `normalized.status` is `PAID` or `PARTIAL`:
     - Send `sendFeeReceiptEmail(student.email, student.name, message)`.
     - Create a `Notification` (`type: 'FEE_RECEIPT'` or reuse existing fee type;
       confirm enum value during planning) with `emailSent: true`.
   - Fire-and-forget: wrap in try/catch, log on failure, **never** fail the save.
   - New `sendFeeReceiptEmail` in `emailService` + a receipt template renderer
     (merge fields: `{name} {dojoName} {month} {year} {amount} {amountPaid}
     {outstanding} {method} {date}`), following the `feeReminder` template pattern.

## Frontend Changes

1. **Instructor `/dashboard/fees`**
   - Add a **year selector** alongside the month selector.
   - Totals banner for the selected year: Expected / Collected / Outstanding
     (from the dojo summary endpoint).
   - Add an **Outstanding (year)** column to the roster table.
   - Clicking a student row expands their 12-month ledger grid (from the ledger
     endpoint), so the instructor sees which months are unpaid.

2. **Student `/dashboard/my-fees`**
   - Totals header: Expected / Paid / Outstanding this year (ledger endpoint).
   - A **12-month grid** above the existing list:
     green = paid, amber = partial, red = unpaid, grey = waived / not-yet-due.

## Testing

- **TDD** `computeYearLedger` covering every edge case listed above.
- **TDD** the receipt template renderer (merge-field substitution, partial vs paid
  wording).
- Keep `*.test.ts` excluded from the backend production `tsc` build (existing
  constraint).

## Out-of-scope risks noted

- Re-send on every save is intentional (user's choice). If it becomes noisy, a future
  "only on change" guard can compare prior status/amountPaid before sending.
