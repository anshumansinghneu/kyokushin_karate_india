# Fee Collection Summary & Auto Receipts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-student yearly fee ledger, whole-dojo collection totals, and an automatic receipt email when an instructor marks a payment Paid or Partial.

**Architecture:** A pure `computeYearLedger` util derives expected/paid/outstanding from existing `MonthlyFee` rows on read (no new tables). Two new read endpoints expose the ledger (one student) and the dojo summary (all students). `markFee` gains a fire-and-forget receipt email. Two existing frontend pages gain summary UI.

**Tech Stack:** TypeScript, Express, Prisma (PostgreSQL), Vitest (backend tests), Next.js (App Router) + React + Tailwind.

## Global Constraints

- Backend production `tsc` build excludes `**/*.test.ts` (already in `backend/tsconfig.json`); never import test files from production code.
- Backend tests run with Vitest: `cd backend && npx vitest run <path>`.
- `MonthlyFee` unique key is `@@unique([userId, month, year])`; access key in code is `userId_month_year`.
- `FeeStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'WAIVED'` (from `backend/src/utils/feeStatus.ts`).
- Currency is INR, displayed as `₹`. Amounts are `Float`.
- Stage explicit file paths in every `git add` (never `git add -A`).
- Money is never "lost": `totalOutstanding = max(totalExpected − totalPaid, 0)`.

---

### Task 1: `computeYearLedger` util

**Files:**
- Create: `backend/src/utils/feeLedger.ts`
- Test: `backend/src/utils/feeLedger.test.ts`

**Interfaces:**
- Consumes: `FeeStatus` from `./feeStatus`.
- Produces:
  - `type LedgerMonthStatus = FeeStatus | 'NOT_DUE'`
  - `interface LedgerFeeRecord { month: number; amount: number; amountPaid: number; status: FeeStatus }`
  - `interface LedgerMonth { month: number; expected: number; paid: number; status: LedgerMonthStatus }`
  - `interface YearLedger { months: LedgerMonth[]; totals: { totalExpected: number; totalPaid: number; totalOutstanding: number } }`
  - `function computeYearLedger(year: number, joinDate: Date, dojoMonthlyFee: number | null, feeRecords: LedgerFeeRecord[], today?: Date): YearLedger`

- [ ] **Step 1: Write the failing test**

```ts
// backend/src/utils/feeLedger.test.ts
import { describe, it, expect } from 'vitest';
import { computeYearLedger, LedgerFeeRecord } from './feeLedger';

const TODAY = new Date('2026-06-15T00:00:00Z'); // June 2026

describe('computeYearLedger', () => {
  it('bills only from join month through current month, in the current year', () => {
    const join = new Date('2026-03-10T00:00:00Z'); // joined March
    const l = computeYearLedger(2026, join, 1000, [], TODAY);
    // Jan, Feb = NOT_DUE; Mar..Jun billable (4 months); Jul..Dec NOT_DUE
    expect(l.months.find((m) => m.month === 2)!.status).toBe('NOT_DUE');
    expect(l.months.find((m) => m.month === 3)!.status).toBe('UNPAID');
    expect(l.months.find((m) => m.month === 3)!.expected).toBe(1000);
    expect(l.months.find((m) => m.month === 7)!.status).toBe('NOT_DUE');
    expect(l.totals.totalExpected).toBe(4000);
    expect(l.totals.totalPaid).toBe(0);
    expect(l.totals.totalOutstanding).toBe(4000);
  });

  it('honours records: paid, partial, waived', () => {
    const join = new Date('2026-01-01T00:00:00Z');
    const records: LedgerFeeRecord[] = [
      { month: 3, amount: 1000, amountPaid: 1000, status: 'PAID' },
      { month: 4, amount: 1000, amountPaid: 400, status: 'PARTIAL' },
      { month: 5, amount: 1000, amountPaid: 0, status: 'WAIVED' },
    ];
    const l = computeYearLedger(2026, join, 1000, records, TODAY);
    expect(l.months.find((m) => m.month === 3)!.paid).toBe(1000);
    expect(l.months.find((m) => m.month === 4)!.expected).toBe(1000);
    expect(l.months.find((m) => m.month === 4)!.paid).toBe(400);
    expect(l.months.find((m) => m.month === 5)!.expected).toBe(0); // waived
    expect(l.months.find((m) => m.month === 5)!.status).toBe('WAIVED');
    // Jan,Feb,Jun unpaid at 1000 each = 3000; Mar paid 1000; Apr 1000; May waived 0
    expect(l.totals.totalExpected).toBe(5000);
    expect(l.totals.totalPaid).toBe(1400);
    expect(l.totals.totalOutstanding).toBe(3600);
  });

  it('bills all 12 months for a past year', () => {
    const join = new Date('2024-01-01T00:00:00Z');
    const l = computeYearLedger(2025, join, 500, [], TODAY);
    expect(l.totals.totalExpected).toBe(6000);
    expect(l.months.every((m) => m.status !== 'NOT_DUE')).toBe(true);
  });

  it('bills nothing for a future year', () => {
    const join = new Date('2024-01-01T00:00:00Z');
    const l = computeYearLedger(2027, join, 500, [], TODAY);
    expect(l.totals.totalExpected).toBe(0);
    expect(l.months.every((m) => m.status === 'NOT_DUE')).toBe(true);
  });

  it('treats a null dojo fee as 0 expected when no record exists', () => {
    const join = new Date('2026-01-01T00:00:00Z');
    const l = computeYearLedger(2026, join, null, [], TODAY);
    expect(l.totals.totalExpected).toBe(0);
    expect(l.months.find((m) => m.month === 1)!.status).toBe('UNPAID');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/utils/feeLedger.test.ts`
Expected: FAIL — `Cannot find module './feeLedger'` / `computeYearLedger is not a function`.

- [ ] **Step 3: Write minimal implementation**

```ts
// backend/src/utils/feeLedger.ts
import type { FeeStatus } from './feeStatus';

export type LedgerMonthStatus = FeeStatus | 'NOT_DUE';

export interface LedgerFeeRecord {
  month: number; // 1-12
  amount: number;
  amountPaid: number;
  status: FeeStatus;
}

export interface LedgerMonth {
  month: number; // 1-12
  expected: number;
  paid: number;
  status: LedgerMonthStatus;
}

export interface YearLedger {
  months: LedgerMonth[];
  totals: { totalExpected: number; totalPaid: number; totalOutstanding: number };
}

export function computeYearLedger(
  year: number,
  joinDate: Date,
  dojoMonthlyFee: number | null,
  feeRecords: LedgerFeeRecord[],
  today: Date = new Date()
): YearLedger {
  const fee = dojoMonthlyFee ?? 0;
  const joinYear = joinDate.getFullYear();
  const joinMonth = joinDate.getMonth() + 1;
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // First billable month within this year.
  let firstMonth: number;
  if (year < joinYear) firstMonth = 13; // nothing billable
  else if (year === joinYear) firstMonth = joinMonth;
  else firstMonth = 1;

  // Last billable month within this year.
  let lastMonth: number;
  if (year > currentYear) lastMonth = 0; // future year, nothing billable
  else if (year === currentYear) lastMonth = currentMonth;
  else lastMonth = 12;

  const recordByMonth = new Map(feeRecords.map((r) => [r.month, r]));

  const months: LedgerMonth[] = [];
  let totalExpected = 0;
  let totalPaid = 0;

  for (let m = 1; m <= 12; m++) {
    const billable = m >= firstMonth && m <= lastMonth;
    if (!billable) {
      months.push({ month: m, expected: 0, paid: 0, status: 'NOT_DUE' });
      continue;
    }
    const rec = recordByMonth.get(m);
    if (rec) {
      const expected = rec.status === 'WAIVED' ? 0 : rec.amount;
      months.push({ month: m, expected, paid: rec.amountPaid, status: rec.status });
      totalExpected += expected;
      totalPaid += rec.amountPaid;
    } else {
      months.push({ month: m, expected: fee, paid: 0, status: 'UNPAID' });
      totalExpected += fee;
    }
  }

  return {
    months,
    totals: {
      totalExpected,
      totalPaid,
      totalOutstanding: Math.max(totalExpected - totalPaid, 0),
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/utils/feeLedger.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/feeLedger.ts backend/src/utils/feeLedger.test.ts
git commit -m "feat(fees): computeYearLedger util for expected/paid/outstanding"
```

---

### Task 2: Receipt template renderer

**Files:**
- Create: `backend/src/utils/feeReceipt.ts`
- Test: `backend/src/utils/feeReceipt.test.ts`

**Interfaces:**
- Produces:
  - `const DEFAULT_FEE_RECEIPT_TEMPLATE: string`
  - `interface FeeReceiptVars { name: string; dojoName: string; month: string; year: number | string; amount: number | string; amountPaid: number | string; outstanding: number; method: string; date: string }`
  - `function renderFeeReceiptTemplate(template: string, vars: FeeReceiptVars): string`

- [ ] **Step 1: Write the failing test**

```ts
// backend/src/utils/feeReceipt.test.ts
import { describe, it, expect } from 'vitest';
import { renderFeeReceiptTemplate, DEFAULT_FEE_RECEIPT_TEMPLATE } from './feeReceipt';

const base = {
  name: 'Riku', dojoName: 'Honbu Dojo', month: 'June', year: 2026,
  amountPaid: 1000, amount: 1000, method: 'UPI', date: '15 June 2026',
};

describe('renderFeeReceiptTemplate', () => {
  it('renders a full-payment receipt with no pending note', () => {
    const msg = renderFeeReceiptTemplate(DEFAULT_FEE_RECEIPT_TEMPLATE, { ...base, outstanding: 0 });
    expect(msg).toContain('Riku');
    expect(msg).toContain('₹1000');
    expect(msg).toContain('June 2026');
    expect(msg).not.toContain('pending');
  });

  it('renders a partial-payment receipt with the pending note', () => {
    const msg = renderFeeReceiptTemplate(DEFAULT_FEE_RECEIPT_TEMPLATE, {
      ...base, amountPaid: 400, outstanding: 600,
    });
    expect(msg).toContain('₹400');
    expect(msg).toContain('₹600');
    expect(msg).toContain('pending');
  });

  it('substitutes custom merge fields and leaves unknown braces intact', () => {
    const msg = renderFeeReceiptTemplate('{name} paid {amountPaid} via {method} {unknown}', {
      ...base, amountPaid: 250, outstanding: 0,
    });
    expect(msg).toBe('Riku paid 250 via UPI {unknown}');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/utils/feeReceipt.test.ts`
Expected: FAIL — `Cannot find module './feeReceipt'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// backend/src/utils/feeReceipt.ts
export const DEFAULT_FEE_RECEIPT_TEMPLATE =
  'Osu {name}, we have recorded your {month} {year} training fee payment of ₹{amountPaid} ' +
  'for {dojoName} (method: {method}) on {date}.{pendingNote} Thank you! Osu!';

export interface FeeReceiptVars {
  name: string;
  dojoName: string;
  month: string;
  year: number | string;
  amount: number | string;
  amountPaid: number | string;
  outstanding: number;
  method: string;
  date: string;
}

export function renderFeeReceiptTemplate(template: string, vars: FeeReceiptVars): string {
  const pendingNote =
    vars.outstanding > 0 ? ` You still have ₹${vars.outstanding} pending for this month.` : '';
  const map: Record<string, string> = {
    name: String(vars.name),
    dojoName: String(vars.dojoName),
    month: String(vars.month),
    year: String(vars.year),
    amount: String(vars.amount),
    amountPaid: String(vars.amountPaid),
    outstanding: String(vars.outstanding),
    method: String(vars.method),
    date: String(vars.date),
    pendingNote,
  };
  return template.replace(/\{(\w+)\}/g, (full, key) => (key in map ? map[key] : full));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/utils/feeReceipt.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/feeReceipt.ts backend/src/utils/feeReceipt.test.ts
git commit -m "feat(fees): receipt template renderer with pending-amount note"
```

---

### Task 3: `FEE_RECEIPT` notification type + `sendFeeReceiptEmail`

**Files:**
- Modify: `backend/prisma/schema.prisma` (NotificationType enum, ~line 88-95)
- Modify: `backend/src/services/emailService.ts` (add export near `sendFeeReminderEmail`, ~line 701-712)
- Migration: generated under `backend/prisma/migrations/`

**Interfaces:**
- Consumes: existing private `send(to, subject, html, text)`, `wrapHtml`, `btn`, `getSiteUrl` in `emailService.ts`.
- Produces: `export const sendFeeReceiptEmail: (email: string, name: string, message: string) => Promise<void>`; new enum value `FEE_RECEIPT`.

- [ ] **Step 1: Add `FEE_RECEIPT` to the NotificationType enum**

In `backend/prisma/schema.prisma`, change:

```prisma
enum NotificationType {
  APPROVAL
  REJECTION
  BELT_PROMOTION
  EVENT_REMINDER
  FEE_REMINDER
  GENERAL
}
```

to:

```prisma
enum NotificationType {
  APPROVAL
  REJECTION
  BELT_PROMOTION
  EVENT_REMINDER
  FEE_REMINDER
  FEE_RECEIPT
  GENERAL
}
```

- [ ] **Step 2: Generate the migration**

Run: `cd backend && npx prisma migrate dev --name add_fee_receipt_notification_type`
Expected: a new migration folder is created and applied to the local DB; `prisma generate` runs. Confirm the printed SQL contains `ALTER TYPE "NotificationType" ADD VALUE 'FEE_RECEIPT'`.

- [ ] **Step 3: Add `sendFeeReceiptEmail` to emailService**

Insert immediately after the `sendFeeReminderEmail` export (after ~line 712):

```ts
export const sendFeeReceiptEmail = async (email: string, name: string, message: string) => {
    const SITE_URL = getSiteUrl();
    const subject = '✅ KKFI Training Fee Receipt';
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Payment Received</h2>
<p style="white-space:pre-line;">${message}</p>
${btn('View My Fees', SITE_URL + '/dashboard/my-fees')}
<p style="color:#888;font-size:13px;">This is a confirmation of a fee payment recorded by your instructor. Osu!</p>
`);
    const text = `${message}\n\nView your fees: ${SITE_URL}/dashboard/my-fees\n\nOsu!`;
    await send(email, subject, html, text);
};
```

- [ ] **Step 4: Verify it compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations backend/src/services/emailService.ts
git commit -m "feat(fees): FEE_RECEIPT notification type and receipt email sender"
```

---

### Task 4: Auto-send receipt on Paid/Partial in `markFee`

**Files:**
- Modify: `backend/src/controllers/feeController.ts` (`markFee`, lines 40-96)

**Interfaces:**
- Consumes: `renderFeeReceiptTemplate`, `DEFAULT_FEE_RECEIPT_TEMPLATE` (Task 2); `sendFeeReceiptEmail` (Task 3); `monthName` from `../utils/feeReminder`.
- Produces: no new exports; side effect (email + notification) after a Paid/Partial upsert.

- [ ] **Step 1: Add imports**

At the top of `backend/src/controllers/feeController.ts`, add after the existing imports:

```ts
import { renderFeeReceiptTemplate, DEFAULT_FEE_RECEIPT_TEMPLATE } from '../utils/feeReceipt';
import { monthName } from '../utils/feeReminder';
import { sendFeeReceiptEmail } from '../services/emailService';
```

- [ ] **Step 2: Send the receipt after the upsert**

In `markFee`, the block currently ends:

```ts
  const fee = await prisma.monthlyFee.upsert({
    where: { userId_month_year: { userId, month: m, year: y } },
    create: {
      userId, dojoId, month: m, year: y,
      ...normalized,
      method: method ?? null,
      notes: notes ?? null,
      markedBy: currentUser.id,
    },
    update: {
      ...normalized,
      method: method ?? null,
      notes: notes ?? null,
      markedBy: currentUser.id,
    },
  });

  res.status(200).json({ status: 'success', data: { fee } });
});
```

Insert the receipt logic between the `upsert` and the `res.status(200)` call:

```ts
  // Auto receipt: confirm Paid/Partial payments to the student (fire-and-forget).
  if (normalized.status === 'PAID' || normalized.status === 'PARTIAL') {
    try {
      const [recipient, dojo] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
        prisma.dojo.findUnique({ where: { id: dojoId }, select: { name: true } }),
      ]);
      if (recipient?.email) {
        const outstanding = Math.max(normalized.amount - normalized.amountPaid, 0);
        const message = renderFeeReceiptTemplate(DEFAULT_FEE_RECEIPT_TEMPLATE, {
          name: recipient.name,
          dojoName: dojo?.name ?? 'your dojo',
          month: monthName(m),
          year: y,
          amount: normalized.amount,
          amountPaid: normalized.amountPaid,
          outstanding,
          method: method || '—',
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        });
        await sendFeeReceiptEmail(recipient.email, recipient.name, message);
        await prisma.notification.create({
          data: {
            userId,
            type: 'FEE_RECEIPT',
            title: `Payment received — ${monthName(m)} ${y}`,
            message,
            emailSent: true,
            emailSentAt: new Date(),
          },
        });
      }
    } catch (err) {
      console.error('[FEE-RECEIPT] Failed to send receipt:', err);
    }
  }

  res.status(200).json({ status: 'success', data: { fee } });
});
```

- [ ] **Step 3: Verify it compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke (optional but recommended)**

Run the dev server, mark a test student PARTIAL with `amountPaid` < `amount`, and confirm the server logs no `[FEE-RECEIPT] Failed` error and a `Notification` row of type `FEE_RECEIPT` is created.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/feeController.ts
git commit -m "feat(fees): auto-send receipt email on Paid/Partial mark"
```

---

### Task 5: `GET /api/fees/ledger/:userId` endpoint

**Files:**
- Modify: `backend/src/controllers/feeController.ts` (add `getStudentLedger`)
- Modify: `backend/src/routes/feeRoutes.ts` (add route)

**Interfaces:**
- Consumes: `computeYearLedger`, `YearLedger`, `LedgerFeeRecord` (Task 1).
- Produces: `export const getStudentLedger` (catchAsync handler). Response shape:
  `{ status: 'success', data: { year: number, student: { id, name, membershipNumber }, dojoMonthlyFee: number | null, ledger: YearLedger } }`.

- [ ] **Step 1: Add import**

At the top of `backend/src/controllers/feeController.ts`, add:

```ts
import { computeYearLedger, LedgerFeeRecord } from '../utils/feeLedger';
```

- [ ] **Step 2: Add the controller**

Append to `backend/src/controllers/feeController.ts`:

```ts
// GET /api/fees/ledger/:userId?year=
export const getStudentLedger = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { userId } = req.params;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, membershipNumber: true, dojoId: true,
      primaryInstructorId: true, membershipStartDate: true, createdAt: true,
    },
  });
  if (!student) return next(new AppError('Student not found', 404));

  const isSelf = currentUser.id === userId;
  const isOwnInstructor = student.primaryInstructorId === currentUser.id;
  if (currentUser.role !== 'ADMIN' && !isSelf && !isOwnInstructor) {
    return next(new AppError('You are not allowed to view this ledger', 403));
  }

  const dojo = student.dojoId
    ? await prisma.dojo.findUnique({ where: { id: student.dojoId }, select: { monthlyFee: true } })
    : null;

  const fees = await prisma.monthlyFee.findMany({
    where: { userId, year },
    select: { month: true, amount: true, amountPaid: true, status: true },
  });
  const records: LedgerFeeRecord[] = fees.map((f) => ({
    month: f.month, amount: f.amount, amountPaid: f.amountPaid, status: f.status as any,
  }));

  const joinDate = student.membershipStartDate ?? student.createdAt;
  const ledger = computeYearLedger(year, joinDate, dojo?.monthlyFee ?? null, records);

  res.status(200).json({
    status: 'success',
    data: {
      year,
      student: { id: student.id, name: student.name, membershipNumber: student.membershipNumber },
      dojoMonthlyFee: dojo?.monthlyFee ?? null,
      ledger,
    },
  });
});
```

- [ ] **Step 3: Register the route**

In `backend/src/routes/feeRoutes.ts`, update the import line and add the route. Change:

```ts
import { getDojoFees, markFee, getMyFees, remindUnpaid, updateDojoFeeSettings } from '../controllers/feeController';
```

to:

```ts
import { getDojoFees, markFee, getMyFees, remindUnpaid, updateDojoFeeSettings, getStudentLedger } from '../controllers/feeController';
```

and add this line after `router.get('/me', getMyFees);`:

```ts
router.get('/ledger/:userId', getStudentLedger);
```

(No `restrictTo` — the handler authorizes self/instructor/admin internally.)

- [ ] **Step 4: Verify it compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/feeController.ts backend/src/routes/feeRoutes.ts
git commit -m "feat(fees): GET /fees/ledger/:userId yearly student ledger endpoint"
```

---

### Task 6: `GET /api/fees/summary/dojo/:dojoId` endpoint

**Files:**
- Modify: `backend/src/controllers/feeController.ts` (add `getDojoFeeSummary`)
- Modify: `backend/src/routes/feeRoutes.ts` (add route)

**Interfaces:**
- Consumes: `computeYearLedger`, `LedgerFeeRecord` (Task 1).
- Produces: `export const getDojoFeeSummary` (catchAsync handler). Response shape:
  `{ status: 'success', data: { year, dojoMonthlyFee: number | null, totals: { expected, collected, outstanding }, rows: Array<{ userId, name, membershipNumber, expected, paid, outstanding }> } }`.

- [ ] **Step 1: Add the controller**

Append to `backend/src/controllers/feeController.ts`:

```ts
// GET /api/fees/summary/dojo/:dojoId?year=
export const getDojoFeeSummary = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { dojoId } = req.params;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const where: any = { role: 'STUDENT', dojoId };
  if (currentUser.role !== 'ADMIN') where.primaryInstructorId = currentUser.id;

  const students = await prisma.user.findMany({
    where,
    select: {
      id: true, name: true, membershipNumber: true,
      membershipStartDate: true, createdAt: true,
    },
    orderBy: { name: 'asc' },
  });

  const dojo = await prisma.dojo.findUnique({ where: { id: dojoId }, select: { monthlyFee: true } });
  const dojoMonthlyFee = dojo?.monthlyFee ?? null;

  const fees = await prisma.monthlyFee.findMany({
    where: { dojoId, year, userId: { in: students.map((s) => s.id) } },
    select: { userId: true, month: true, amount: true, amountPaid: true, status: true },
  });
  const feesByUser = new Map<string, LedgerFeeRecord[]>();
  for (const f of fees) {
    const arr = feesByUser.get(f.userId) ?? [];
    arr.push({ month: f.month, amount: f.amount, amountPaid: f.amountPaid, status: f.status as any });
    feesByUser.set(f.userId, arr);
  }

  let expectedTotal = 0;
  let collectedTotal = 0;
  const rows = students.map((s) => {
    const joinDate = s.membershipStartDate ?? s.createdAt;
    const ledger = computeYearLedger(year, joinDate, dojoMonthlyFee, feesByUser.get(s.id) ?? []);
    expectedTotal += ledger.totals.totalExpected;
    collectedTotal += ledger.totals.totalPaid;
    return {
      userId: s.id,
      name: s.name,
      membershipNumber: s.membershipNumber,
      expected: ledger.totals.totalExpected,
      paid: ledger.totals.totalPaid,
      outstanding: ledger.totals.totalOutstanding,
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      year,
      dojoMonthlyFee,
      totals: {
        expected: expectedTotal,
        collected: collectedTotal,
        outstanding: Math.max(expectedTotal - collectedTotal, 0),
      },
      rows,
    },
  });
});
```

- [ ] **Step 2: Register the route**

In `backend/src/routes/feeRoutes.ts`, add `getDojoFeeSummary` to the import list (alongside `getStudentLedger`), and add after the `getDojoFees` route:

```ts
router.get('/summary/dojo/:dojoId', restrictTo('ADMIN', 'INSTRUCTOR'), getDojoFeeSummary);
```

- [ ] **Step 3: Verify it compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/feeController.ts backend/src/routes/feeRoutes.ts
git commit -m "feat(fees): GET /fees/summary/dojo/:dojoId collection summary endpoint"
```

---

### Task 7: Student `/my-fees` — yearly summary + month grid

**Files:**
- Modify: `frontend/src/app/dashboard/my-fees/page.tsx`

**Interfaces:**
- Consumes: `GET /fees/ledger/:userId?year=` (Task 5). The student's own id is `user.id` from `useAuthStore`.

- [ ] **Step 1: Add ledger state and fetch**

Replace the imports and component body so the page fetches the ledger for the student's own id and the selected year. Replace the whole file contents with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type LedgerStatus = "UNPAID" | "PARTIAL" | "PAID" | "WAIVED" | "NOT_DUE";

interface LedgerMonth { month: number; expected: number; paid: number; status: LedgerStatus; }
interface Ledger {
  months: LedgerMonth[];
  totals: { totalExpected: number; totalPaid: number; totalOutstanding: number };
}

interface Fee {
  id: string; month: number; year: number; amount: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "WAIVED"; amountPaid: number;
  paidAt: string | null; method: string | null;
}

const STATUS_STYLE: Record<Fee["status"], string> = {
  PAID: "text-green-400",
  PARTIAL: "text-amber-400",
  UNPAID: "text-red-400",
  WAIVED: "text-gray-400",
};

const CELL_STYLE: Record<LedgerStatus, string> = {
  PAID: "bg-green-500/20 border-green-500/40 text-green-300",
  PARTIAL: "bg-amber-500/20 border-amber-500/40 text-amber-300",
  UNPAID: "bg-red-500/20 border-red-500/40 text-red-300",
  WAIVED: "bg-gray-600/20 border-gray-600/40 text-gray-400",
  NOT_DUE: "bg-white/[0.02] border-white/[0.06] text-gray-600",
};

export default function MyFeesPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [fees, setFees] = useState<Fee[]>([]);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user) checkAuth(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (!isLoading && !isAuthenticated) router.push("/login"); }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const [feeRes, ledgerRes] = await Promise.all([
          api.get("/fees/me"),
          api.get(`/fees/ledger/${user.id}`, { params: { year } }),
        ]);
        setFees(feeRes.data.data.fees);
        setLedger(ledgerRes.data.data.ledger);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, year]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">My Fees</h1>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-28"
          />
        </div>

        {ledger && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-xs text-gray-500">Expected ({year})</div>
                <div className="text-xl font-bold">₹{ledger.totals.totalExpected}</div>
              </div>
              <div className="rounded-xl border border-green-500/20 bg-green-500/[0.05] p-4">
                <div className="text-xs text-gray-500">Paid</div>
                <div className="text-xl font-bold text-green-400">₹{ledger.totals.totalPaid}</div>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4">
                <div className="text-xs text-gray-500">Outstanding</div>
                <div className="text-xl font-bold text-red-400">₹{ledger.totals.totalOutstanding}</div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 mb-6">
              {ledger.months.map((m) => (
                <div key={m.month} className={`rounded-lg border p-2 text-center text-xs ${CELL_STYLE[m.status]}`}>
                  <div className="font-semibold">{MONTHS[m.month - 1]}</div>
                  <div className="mt-1">{m.status === "NOT_DUE" ? "—" : `₹${m.paid}/${m.expected}`}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={18} /> Loading…</div>
        ) : fees.length === 0 ? (
          <p className="text-gray-500">No fee records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-left">
                <tr>
                  <th className="py-2 pr-3">Month</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Paid on</th>
                  <th className="py-2 pr-3">Method</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id} className="border-t border-gray-800">
                    <td className="py-2 pr-3">{FULL_MONTHS[f.month - 1]} {f.year}</td>
                    <td className="py-2 pr-3">₹{f.amount}{f.status === "PARTIAL" ? ` (paid ₹${f.amountPaid})` : ""}</td>
                    <td className={`py-2 pr-3 font-medium ${STATUS_STYLE[f.status]}`}>{f.status}</td>
                    <td className="py-2 pr-3">{f.paidAt ? new Date(f.paidAt).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="py-2 pr-3">{f.method || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/dashboard/my-fees/page.tsx
git commit -m "feat(fees): student my-fees yearly summary banner and month grid"
```

---

### Task 8: Instructor `/dashboard/fees` — year totals + outstanding column + expandable ledger

**Files:**
- Modify: `frontend/src/app/dashboard/fees/page.tsx`

**Interfaces:**
- Consumes: `GET /fees/summary/dojo/:dojoId?year=` (Task 6) and `GET /fees/ledger/:userId?year=` (Task 5).

- [ ] **Step 1: Add year, summary, and expand state**

In `frontend/src/app/dashboard/fees/page.tsx`, add these state declarations after the existing `const [year, setYear] = useState(now.getFullYear());` line (year state already exists):

```tsx
  const [summary, setSummary] = useState<{
    totals: { expected: number; collected: number; outstanding: number };
    rows: { userId: string; expected: number; paid: number; outstanding: number }[];
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ledgerByUser, setLedgerByUser] = useState<Record<string, {
    months: { month: number; expected: number; paid: number; status: string }[];
  }>>({});
```

- [ ] **Step 2: Fetch the dojo summary inside `load`**

In the `load` callback, after `setRows(merged);`, add a parallel summary fetch (still inside the `try`):

```tsx
      const summaryRes = await api.get(`/fees/summary/dojo/${dojoId}`, { params: { year } });
      setSummary(summaryRes.data.data);
```

- [ ] **Step 3: Add an expand handler that lazy-loads a student's ledger**

Add this function after the `saveRow` function:

```tsx
  const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const toggleExpand = async (userId: string) => {
    if (expandedId === userId) { setExpandedId(null); return; }
    setExpandedId(userId);
    if (!ledgerByUser[userId]) {
      try {
        const res = await api.get(`/fees/ledger/${userId}`, { params: { year } });
        setLedgerByUser((m) => ({ ...m, [userId]: res.data.data.ledger }));
      } catch { /* ignore; cell just won't expand */ }
    }
  };
```

- [ ] **Step 4: Add a year selector beside the month selector**

In the filter row (the `div` containing the month `<select>` and year `<input>`), the year `<input>` already exists; ensure changing it also reloads — it does, because `year` is a dependency of `load`. No change needed if `year` is already wired. If the year input is missing, add it after the month select:

```tsx
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-28" />
```

- [ ] **Step 5: Render the year totals banner**

Immediately after the `{message && ...}` line (before the `loading ?` block), add:

```tsx
        {summary && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-xs text-gray-500">Expected ({year})</div>
              <div className="text-xl font-bold">₹{summary.totals.expected}</div>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/[0.05] p-4">
              <div className="text-xs text-gray-500">Collected</div>
              <div className="text-xl font-bold text-green-400">₹{summary.totals.collected}</div>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4">
              <div className="text-xs text-gray-500">Outstanding</div>
              <div className="text-xl font-bold text-red-400">₹{summary.totals.outstanding}</div>
            </div>
          </div>
        )}
```

- [ ] **Step 6: Add an Outstanding column header**

In the table `<thead>` row, add a header cell before the empty action `<th>`:

```tsx
                  <th className="py-2 pr-3">Outstanding (yr)</th>
```

- [ ] **Step 7: Add the outstanding cell + expand toggle + ledger row in the table body**

Wrap each student in a fragment so an expandable ledger row can follow. Replace the `{rows.map((r) => ( ... ))}` body with:

```tsx
                {rows.map((r) => {
                  const summaryRow = summary?.rows.find((s) => s.userId === r.userId);
                  const led = ledgerByUser[r.userId];
                  return (
                    <>
                      <tr key={r.userId} className="border-t border-gray-800">
                        <td className="py-2 pr-3">
                          <button onClick={() => toggleExpand(r.userId)} className="text-left hover:text-red-400">
                            <div>{r.name}</div>
                            <div className="text-xs text-gray-500">{r.membershipNumber || r.currentBeltRank || ""}</div>
                          </button>
                        </td>
                        <td className="py-2 pr-3">
                          <select value={r.status} onChange={(e) => update(r.userId, { status: e.target.value as FeeStatus })}
                            className="bg-gray-900 border border-gray-700 rounded px-2 py-1">
                            <option value="UNPAID">Unpaid</option>
                            <option value="PARTIAL">Partial</option>
                            <option value="PAID">Paid</option>
                            <option value="WAIVED">Waived</option>
                          </select>
                        </td>
                        <td className="py-2 pr-3">
                          <input type="number" min={0} value={r.amountPaid} disabled={r.status !== "PARTIAL"}
                            onChange={(e) => update(r.userId, { amountPaid: Number(e.target.value) })}
                            className="w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1 disabled:opacity-40" />
                        </td>
                        <td className="py-2 pr-3">
                          <input value={r.method} placeholder="CASH / UPI"
                            onChange={(e) => update(r.userId, { method: e.target.value })}
                            className="w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1" />
                        </td>
                        <td className="py-2 pr-3 text-red-400 font-medium">
                          {summaryRow ? `₹${summaryRow.outstanding}` : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <button onClick={() => saveRow(r)} disabled={savingId === r.userId}
                            className="bg-gray-700 hover:bg-gray-600 rounded px-3 py-1 disabled:opacity-50">
                            {savingId === r.userId ? "…" : "Save"}
                          </button>
                        </td>
                      </tr>
                      {expandedId === r.userId && (
                        <tr className="border-t border-gray-900 bg-white/[0.01]">
                          <td colSpan={6} className="py-3 px-3">
                            {!led ? (
                              <span className="text-xs text-gray-500">Loading ledger…</span>
                            ) : (
                              <div className="grid grid-cols-6 gap-2">
                                {led.months.map((m) => (
                                  <div key={m.month} className="rounded border border-white/[0.06] p-2 text-center text-xs">
                                    <div className="font-semibold text-gray-300">{MONTHS_SHORT[m.month - 1]}</div>
                                    <div className="mt-1 text-gray-400">
                                      {m.status === "NOT_DUE" ? "—" : `₹${m.paid}/${m.expected}`}
                                    </div>
                                    <div className="text-[10px] text-gray-500">{m.status === "NOT_DUE" ? "" : m.status}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
```

- [ ] **Step 8: Verify it compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors. (If React warns about a missing `key` on the fragment, change `<>` to `<Fragment key={r.userId}>` and import `Fragment` from `react`, removing the `key` from the inner `<tr>`.)

- [ ] **Step 9: Commit**

```bash
git add frontend/src/app/dashboard/fees/page.tsx
git commit -m "feat(fees): instructor year totals, outstanding column, expandable ledger"
```

---

## Self-Review

**Spec coverage:**
- Per-student yearly ledger (instructor + student) → Tasks 1, 5, 7, 8 ✓
- Whole-dojo collection total → Tasks 6, 8 ✓
- Per-student summary row in roster → Tasks 6, 8 (Outstanding column) ✓
- Auto receipt email on Paid/Partial → Tasks 2, 3, 4 ✓
- Billable-window rule (join date → current month) → Task 1 ✓
- No new tables (compute on read) → Tasks 1, 5, 6 ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `computeYearLedger` / `LedgerFeeRecord` / `YearLedger` names consistent across Tasks 1, 5, 6. `sendFeeReceiptEmail`, `renderFeeReceiptTemplate`, `DEFAULT_FEE_RECEIPT_TEMPLATE` consistent across Tasks 2, 3, 4. `FEE_RECEIPT` enum value matches between schema (Task 3) and controller (Task 4). Response shapes consumed by frontend (Tasks 7, 8) match what Tasks 5, 6 produce. ✓
