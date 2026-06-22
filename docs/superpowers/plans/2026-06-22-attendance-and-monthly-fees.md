# Attendance & Monthly Fees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let instructors record monthly attendance counts and an offline fee ledger per student, and automatically remind unpaid students by email + in-app notification.

**Architecture:** Add two new Prisma models (`MonthlyFee`, `MonthlyAttendance`) plus three fee fields on `Dojo`. Backend exposes fee/attendance REST controllers scoped to the instructor's own students via the existing `primaryInstructorId` pattern. A new `feeReminderService` (mirroring the existing `renewalReminderService`) renders a per-dojo merge-field template and sends email + creates a `Notification`, wired into the existing 24h scheduler and a `CRON_SECRET`-protected endpoint. Pure logic (template render, reminder decision, status normalization) is extracted into unit-tested utilities. The frontend adds an instructor "Attendance & Fees" page, a dojo fee-settings panel, and a student "My Fees" page.

**Tech Stack:** Express + TypeScript + Prisma (PostgreSQL) backend; Next.js 14 (App Router) + TypeScript + Tailwind + Zustand frontend; Nodemailer/Brevo email; Vitest for unit tests.

## Global Constraints

- Prisma client is imported as `import prisma from '../prisma';` (default export, `backend/src/prisma.ts`).
- Controllers wrap handlers in `catchAsync` and throw via `new AppError(message, statusCode)` (`backend/src/utils/`).
- Routes apply `protect` from `../middleware/authMiddleware`; role gating uses `restrictTo('ADMIN','INSTRUCTOR')`. `req.user` carries `{ id, role, ... }`.
- Instructor → student scoping uses `User.primaryInstructorId === instructor.id`. `ADMIN` bypasses scoping.
- Schema changes are applied to the DB by the existing build step (`npx prisma db push`), NOT migrations. Always run `npx prisma generate` after editing the schema.
- Money is `Float`, currency INR, amounts must be `>= 0`.
- All new instructor endpoints are restricted to the instructor's own dojo/students; never expose another instructor's roster.
- Frontend calls the backend through `import api from '@/lib/api'` (axios instance that attaches the bearer token). Auth state via `useAuthStore` from `@/store/authStore`.
- Email helpers `send`, `wrapHtml`, `btn`, `getSiteUrl` are private inside `backend/src/services/emailService.ts`; new email functions live in that same file.

---

### Task 1: Database schema — models, enum, dojo fields, relations

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma models `MonthlyFee`, `MonthlyAttendance`; enum `FeeStatus { UNPAID PARTIAL PAID WAIVED }`; `Dojo.monthlyFee`, `Dojo.feeDueDay`, `Dojo.feeReminderTemplate`; `NotificationType.FEE_REMINDER`. Composite unique key name `userId_month_year` for both new models.

- [ ] **Step 1: Add `FEE_REMINDER` to the NotificationType enum**

In `backend/prisma/schema.prisma`, change the `NotificationType` enum (currently `APPROVAL REJECTION BELT_PROMOTION EVENT_REMINDER GENERAL`) to add the new value:

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

- [ ] **Step 2: Add the three fee fields and back-relations to the `Dojo` model**

In the `Dojo` model, add these fields just after the existing `longitude Float?` line:

```prisma
  monthlyFee          Float?    // Per-dojo flat monthly training fee (INR)
  feeDueDay           Int       @default(10)  // Day of month fees are considered due
  feeReminderTemplate String?   // Merge-field template; null falls back to default
```

And add these two relation fields alongside the existing `members`/`instructors` relations in `Dojo`:

```prisma
  monthlyFees       MonthlyFee[]
  monthlyAttendance MonthlyAttendance[]
```

- [ ] **Step 3: Add back-relations to the `User` model**

In the `User` model, alongside the existing `notifications Notification[]` line, add:

```prisma
  monthlyFees       MonthlyFee[]
  monthlyAttendance MonthlyAttendance[]
```

- [ ] **Step 4: Add the `FeeStatus` enum and the two new models**

Append to the end of `backend/prisma/schema.prisma`:

```prisma
enum FeeStatus {
  UNPAID
  PARTIAL
  PAID
  WAIVED
}

model MonthlyFee {
  id             String    @id @default(uuid())
  userId         String
  user           User      @relation(fields: [userId], references: [id])
  dojoId         String
  dojo           Dojo      @relation(fields: [dojoId], references: [id])
  month          Int       // 1-12
  year           Int
  amount         Float     // snapshot of dojo monthlyFee at time of record
  status         FeeStatus @default(UNPAID)
  amountPaid     Float     @default(0)
  paidAt         DateTime?
  method         String?   // free text: CASH / UPI / etc
  markedBy       String    // instructor user id, or "SYSTEM" for auto rows
  notes          String?
  remindersSent  Int       @default(0)
  lastReminderAt DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([userId, month, year])
  @@index([dojoId, year, month])
  @@index([status])
}

model MonthlyAttendance {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  dojoId          String
  dojo            Dojo     @relation(fields: [dojoId], references: [id])
  month           Int      // 1-12
  year            Int
  classesAttended Int      @default(0)
  markedBy        String   // instructor user id
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, month, year])
  @@index([dojoId, year, month])
}
```

- [ ] **Step 5: Validate the schema and regenerate the client**

Run: `cd backend && npx prisma validate && npx prisma generate`
Expected: `The schema at prisma/schema.prisma is valid 🚀` followed by `Generated Prisma Client`.

- [ ] **Step 6: Apply to the local dev database**

Run: `cd backend && npx prisma db push`
Expected: `Your database is now in sync with your Prisma schema.` (If no local DB is configured, note it and continue — the build step applies it in deploy.)

- [ ] **Step 7: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(schema): add MonthlyFee, MonthlyAttendance, dojo fee fields"
```

---

### Task 2: Backend test setup + fee domain utilities

**Files:**
- Modify: `backend/package.json`
- Create: `backend/src/utils/feeStatus.ts`
- Create: `backend/src/utils/feeStatus.test.ts`
- Create: `backend/src/utils/feeReminder.ts`
- Create: `backend/src/utils/feeReminder.test.ts`

**Interfaces:**
- Produces:
  - `normalizeFeeUpdate(input: { status: FeeStatus; amount: number; amountPaid?: number }, now?: Date): { status: FeeStatus; amount: number; amountPaid: number; paidAt: Date | null }`
  - `type FeeStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'WAIVED'`
  - `renderFeeReminderTemplate(template: string, vars: { name: string; amount: number|string; month: string; year: number|string; dojoName: string; dueDate: string }): string`
  - `DEFAULT_FEE_REMINDER_TEMPLATE: string`
  - `monthName(month: number): string`
  - `shouldRemindStudent(input: { status: FeeStatus; lastReminderAt: Date | null; feeDueDay: number; today: Date; throttleDays?: number }): boolean`

- [ ] **Step 1: Add Vitest to the backend**

In `backend/package.json`, change the `"test"` script and add the dev dependency. Set:

```json
"test": "vitest run"
```

Then run: `cd backend && npm install -D vitest@^2.1.9`
Expected: vitest added to devDependencies. (Vitest runs `*.test.ts` zero-config via esbuild; no config file needed.)

- [ ] **Step 2: Write the failing test for `normalizeFeeUpdate`**

Create `backend/src/utils/feeStatus.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeFeeUpdate } from './feeStatus';

const NOW = new Date('2026-06-22T00:00:00Z');

describe('normalizeFeeUpdate', () => {
  it('PAID sets amountPaid to full amount and stamps paidAt', () => {
    const r = normalizeFeeUpdate({ status: 'PAID', amount: 800 }, NOW);
    expect(r).toEqual({ status: 'PAID', amount: 800, amountPaid: 800, paidAt: NOW });
  });

  it('UNPAID zeroes amountPaid and clears paidAt', () => {
    const r = normalizeFeeUpdate({ status: 'UNPAID', amount: 800, amountPaid: 500 }, NOW);
    expect(r).toEqual({ status: 'UNPAID', amount: 800, amountPaid: 0, paidAt: null });
  });

  it('WAIVED zeroes amountPaid and clears paidAt', () => {
    const r = normalizeFeeUpdate({ status: 'WAIVED', amount: 800 }, NOW);
    expect(r).toEqual({ status: 'WAIVED', amount: 800, amountPaid: 0, paidAt: null });
  });

  it('PARTIAL keeps a valid partial payment and stamps paidAt', () => {
    const r = normalizeFeeUpdate({ status: 'PARTIAL', amount: 800, amountPaid: 300 }, NOW);
    expect(r).toEqual({ status: 'PARTIAL', amount: 800, amountPaid: 300, paidAt: NOW });
  });

  it('PARTIAL rejects amountPaid >= amount', () => {
    expect(() => normalizeFeeUpdate({ status: 'PARTIAL', amount: 800, amountPaid: 800 }, NOW)).toThrow();
  });

  it('PARTIAL rejects amountPaid <= 0', () => {
    expect(() => normalizeFeeUpdate({ status: 'PARTIAL', amount: 800, amountPaid: 0 }, NOW)).toThrow();
  });

  it('rejects negative amount', () => {
    expect(() => normalizeFeeUpdate({ status: 'PAID', amount: -1 }, NOW)).toThrow();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd backend && npx vitest run src/utils/feeStatus.test.ts`
Expected: FAIL — cannot resolve `./feeStatus`.

- [ ] **Step 4: Implement `feeStatus.ts`**

Create `backend/src/utils/feeStatus.ts`:

```ts
export type FeeStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'WAIVED';

export interface FeeUpdateInput {
  status: FeeStatus;
  amount: number;
  amountPaid?: number;
}

export interface NormalizedFee {
  status: FeeStatus;
  amount: number;
  amountPaid: number;
  paidAt: Date | null;
}

export function normalizeFeeUpdate(input: FeeUpdateInput, now: Date = new Date()): NormalizedFee {
  const { status, amount } = input;
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) {
    throw new Error('amount must be a number >= 0');
  }
  switch (status) {
    case 'PAID':
      return { status, amount, amountPaid: amount, paidAt: now };
    case 'UNPAID':
    case 'WAIVED':
      return { status, amount, amountPaid: 0, paidAt: null };
    case 'PARTIAL': {
      const amountPaid = input.amountPaid ?? 0;
      if (amountPaid <= 0 || amountPaid >= amount) {
        throw new Error('PARTIAL requires 0 < amountPaid < amount');
      }
      return { status, amount, amountPaid, paidAt: now };
    }
    default:
      throw new Error(`Unknown fee status: ${status}`);
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd backend && npx vitest run src/utils/feeStatus.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Write the failing test for the reminder utilities**

Create `backend/src/utils/feeReminder.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderFeeReminderTemplate, shouldRemindStudent, monthName, DEFAULT_FEE_REMINDER_TEMPLATE } from './feeReminder';

describe('renderFeeReminderTemplate', () => {
  it('substitutes all known merge fields', () => {
    const out = renderFeeReminderTemplate('Hi {name}, ₹{amount} for {month} {year} at {dojoName} due {dueDate}', {
      name: 'Riku', amount: 800, month: 'June', year: 2026, dojoName: 'Mumbai Dojo', dueDate: '10 June 2026',
    });
    expect(out).toBe('Hi Riku, ₹800 for June 2026 at Mumbai Dojo due 10 June 2026');
  });

  it('leaves unknown placeholders untouched', () => {
    const out = renderFeeReminderTemplate('Hi {name} {unknown}', {
      name: 'Riku', amount: 1, month: 'June', year: 2026, dojoName: 'D', dueDate: 'x',
    });
    expect(out).toBe('Hi Riku {unknown}');
  });

  it('default template references name and amount', () => {
    expect(DEFAULT_FEE_REMINDER_TEMPLATE).toContain('{name}');
    expect(DEFAULT_FEE_REMINDER_TEMPLATE).toContain('{amount}');
  });
});

describe('monthName', () => {
  it('maps 1-12 to names', () => {
    expect(monthName(1)).toBe('January');
    expect(monthName(6)).toBe('June');
    expect(monthName(12)).toBe('December');
  });
});

describe('shouldRemindStudent', () => {
  const base = { feeDueDay: 10, today: new Date('2026-06-15T00:00:00Z'), lastReminderAt: null as Date | null };

  it('reminds an unpaid student past the due day with no prior reminder', () => {
    expect(shouldRemindStudent({ ...base, status: 'UNPAID' })).toBe(true);
  });

  it('reminds a partial payer', () => {
    expect(shouldRemindStudent({ ...base, status: 'PARTIAL' })).toBe(true);
  });

  it('never reminds PAID or WAIVED', () => {
    expect(shouldRemindStudent({ ...base, status: 'PAID' })).toBe(false);
    expect(shouldRemindStudent({ ...base, status: 'WAIVED' })).toBe(false);
  });

  it('does not remind before the due day', () => {
    expect(shouldRemindStudent({ ...base, status: 'UNPAID', today: new Date('2026-06-05T00:00:00Z') })).toBe(false);
  });

  it('throttles within the throttle window', () => {
    expect(shouldRemindStudent({ ...base, status: 'UNPAID', lastReminderAt: new Date('2026-06-13T00:00:00Z') })).toBe(false);
  });

  it('reminds again after the throttle window', () => {
    expect(shouldRemindStudent({ ...base, status: 'UNPAID', lastReminderAt: new Date('2026-06-08T00:00:00Z') })).toBe(true);
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `cd backend && npx vitest run src/utils/feeReminder.test.ts`
Expected: FAIL — cannot resolve `./feeReminder`.

- [ ] **Step 8: Implement `feeReminder.ts`**

Create `backend/src/utils/feeReminder.ts`:

```ts
import type { FeeStatus } from './feeStatus';

export const DEFAULT_FEE_REMINDER_TEMPLATE =
  'Osu {name}, your {month} {year} training fee of ₹{amount} for {dojoName} is due (by {dueDate}). ' +
  'Please clear it at your earliest convenience. Osu!';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

export interface FeeReminderVars {
  name: string;
  amount: number | string;
  month: string;
  year: number | string;
  dojoName: string;
  dueDate: string;
}

export function renderFeeReminderTemplate(template: string, vars: FeeReminderVars): string {
  const map: Record<string, string> = {
    name: String(vars.name),
    amount: String(vars.amount),
    month: String(vars.month),
    year: String(vars.year),
    dojoName: String(vars.dojoName),
    dueDate: String(vars.dueDate),
  };
  return template.replace(/\{(\w+)\}/g, (full, key) => (key in map ? map[key] : full));
}

export interface RemindDecisionInput {
  status: FeeStatus;
  lastReminderAt: Date | null;
  feeDueDay: number;
  today: Date;
  throttleDays?: number;
}

export function shouldRemindStudent(i: RemindDecisionInput): boolean {
  if (i.status === 'PAID' || i.status === 'WAIVED') return false;
  if (i.today.getDate() < i.feeDueDay) return false;
  if (i.lastReminderAt) {
    const days = (i.today.getTime() - i.lastReminderAt.getTime()) / 86_400_000;
    if (days < (i.throttleDays ?? 5)) return false;
  }
  return true;
}
```

- [ ] **Step 9: Run both util test files to verify they pass**

Run: `cd backend && npx vitest run src/utils/feeStatus.test.ts src/utils/feeReminder.test.ts`
Expected: PASS (all tests, two files).

- [ ] **Step 10: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/utils/feeStatus.ts backend/src/utils/feeStatus.test.ts backend/src/utils/feeReminder.ts backend/src/utils/feeReminder.test.ts
git commit -m "feat(fees): add vitest + fee status/reminder domain utilities"
```

---

### Task 3: Dojo fee settings API

**Files:**
- Modify: `backend/src/controllers/dojoController.ts:179-220` (the `updateDojo` handler)

**Interfaces:**
- Consumes: existing `updateDojo` handler.
- Produces: `PATCH /api/dojos/:id` additionally accepts `{ monthlyFee?: number|null, feeDueDay?: number, feeReminderTemplate?: string|null }`.

- [ ] **Step 1: Destructure the new fields**

In `updateDojo`, extend the destructuring on line 180 to include the new fields:

```ts
    const { name, city, state, country, address, contactEmail, contactPhone, latitude, longitude, instructorId, monthlyFee, feeDueDay, feeReminderTemplate } = req.body;
```

- [ ] **Step 2: Map the new fields into `updateData`**

Immediately after the existing `if (longitude !== undefined) ...` line, add:

```ts
    if (monthlyFee !== undefined) updateData.monthlyFee = monthlyFee === null || monthlyFee === '' ? null : parseFloat(monthlyFee);
    if (feeDueDay !== undefined) {
        const d = parseInt(feeDueDay);
        if (Number.isNaN(d) || d < 1 || d > 28) return next(new AppError('feeDueDay must be between 1 and 28', 400));
        updateData.feeDueDay = d;
    }
    if (feeReminderTemplate !== undefined) updateData.feeReminderTemplate = feeReminderTemplate === '' ? null : feeReminderTemplate;
```

- [ ] **Step 3: Build the backend to verify it compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify (optional, requires running backend + admin token)**

Run (replace `TOKEN`, `DOJO_ID`):
```bash
curl -s -X PATCH http://localhost:5000/api/dojos/DOJO_ID \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"monthlyFee":800,"feeDueDay":10}' | head -c 400
```
Expected: JSON `"status":"success"` with the dojo showing `"monthlyFee":800,"feeDueDay":10`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/dojoController.ts
git commit -m "feat(dojo): accept monthlyFee, feeDueDay, feeReminderTemplate in updateDojo"
```

---

### Task 4: Fee ledger API

**Files:**
- Create: `backend/src/controllers/feeController.ts`
- Create: `backend/src/routes/feeRoutes.ts`
- Modify: `backend/src/app.ts` (import + mount, near line 33 and line 138)

**Interfaces:**
- Consumes: `normalizeFeeUpdate` from `../utils/feeStatus`; Prisma `monthlyFee` model with composite key `userId_month_year`.
- Produces:
  - `GET /api/fees/dojo/:dojoId?month&year` → `{ status, data: { monthlyFee, roster: Array<{ student: {id,name,membershipNumber,currentBeltRank,membershipStatus}, fee: MonthlyFee | null }> } }`
  - `POST /api/fees/mark` body `{ userId, dojoId, month, year, status, amount?, amountPaid?, method?, notes? }` → `{ status, data: { fee } }`
  - `GET /api/fees/me` → `{ status, data: { fees: MonthlyFee[] } }`
  - Exports `markFee`, `getDojoFees`, `getMyFees` (and `remindUnpaid`, added in Task 6).

- [ ] **Step 1: Create the controller**

Create `backend/src/controllers/feeController.ts`:

```ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { normalizeFeeUpdate, FeeStatus } from '../utils/feeStatus';

// GET /api/fees/dojo/:dojoId?month=&year=
export const getDojoFees = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { dojoId } = req.params;
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);
  if (!month || !year || month < 1 || month > 12) {
    return next(new AppError('Valid month (1-12) and year query params are required', 400));
  }

  const where: any = { role: 'STUDENT', dojoId };
  if (currentUser.role !== 'ADMIN') where.primaryInstructorId = currentUser.id;

  const students = await prisma.user.findMany({
    where,
    select: { id: true, name: true, membershipNumber: true, currentBeltRank: true, membershipStatus: true },
    orderBy: { name: 'asc' },
  });

  const fees = await prisma.monthlyFee.findMany({
    where: { dojoId, month, year, userId: { in: students.map((s) => s.id) } },
  });
  const feeByUser = new Map(fees.map((f) => [f.userId, f]));

  const dojo = await prisma.dojo.findUnique({ where: { id: dojoId }, select: { monthlyFee: true } });

  const roster = students.map((student) => ({ student, fee: feeByUser.get(student.id) ?? null }));

  res.status(200).json({ status: 'success', data: { monthlyFee: dojo?.monthlyFee ?? null, roster } });
});

// POST /api/fees/mark
export const markFee = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { userId, dojoId, month, year, status, amount, amountPaid, method, notes } = req.body;
  if (!userId || !dojoId || !month || !year || !status) {
    return next(new AppError('userId, dojoId, month, year and status are required', 400));
  }
  const m = parseInt(month);
  const y = parseInt(year);
  if (m < 1 || m > 12) return next(new AppError('month must be 1-12', 400));

  if (currentUser.role !== 'ADMIN') {
    const student = await prisma.user.findUnique({ where: { id: userId }, select: { primaryInstructorId: true } });
    if (!student || student.primaryInstructorId !== currentUser.id) {
      return next(new AppError('You can only manage your own students', 403));
    }
  }

  let feeAmount: number;
  if (amount !== undefined && amount !== null && amount !== '') {
    feeAmount = parseFloat(amount);
  } else {
    const dojo = await prisma.dojo.findUnique({ where: { id: dojoId }, select: { monthlyFee: true } });
    feeAmount = dojo?.monthlyFee ?? 0;
  }

  let normalized;
  try {
    normalized = normalizeFeeUpdate({
      status: status as FeeStatus,
      amount: feeAmount,
      amountPaid: amountPaid !== undefined && amountPaid !== null && amountPaid !== '' ? parseFloat(amountPaid) : undefined,
    });
  } catch (e: any) {
    return next(new AppError(e.message, 400));
  }

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

// GET /api/fees/me
export const getMyFees = catchAsync(async (req: Request, res: Response) => {
  const fees = await prisma.monthlyFee.findMany({
    where: { userId: req.user.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  res.status(200).json({ status: 'success', data: { fees } });
});
```

- [ ] **Step 2: Create the routes**

Create `backend/src/routes/feeRoutes.ts`:

```ts
import express from 'express';
import { getDojoFees, markFee, getMyFees } from '../controllers/feeController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/me', getMyFees);
router.get('/dojo/:dojoId', restrictTo('ADMIN', 'INSTRUCTOR'), getDojoFees);
router.post('/mark', restrictTo('ADMIN', 'INSTRUCTOR'), markFee);

export default router;
```

- [ ] **Step 3: Mount the router in `app.ts`**

In `backend/src/app.ts`, add the import alongside the other route imports (near line 33):

```ts
import feeRouter from './routes/feeRoutes';
```

And mount it alongside the other `app.use('/api/...')` lines (near line 138):

```ts
app.use('/api/fees', feeRouter);  // Monthly fee ledger
```

- [ ] **Step 4: Build to verify it compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manually verify the mark + read round-trip (requires running backend + instructor token)**

Run (replace `TOKEN`, `STUDENT_ID`, `DOJO_ID`):
```bash
curl -s -X POST http://localhost:5000/api/fees/mark -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"STUDENT_ID","dojoId":"DOJO_ID","month":6,"year":2026,"status":"PAID","method":"CASH"}' | head -c 400
curl -s "http://localhost:5000/api/fees/dojo/DOJO_ID?month=6&year=2026" -H "Authorization: Bearer TOKEN" | head -c 600
```
Expected: first call returns the created fee with `"status":"PAID"`, `"amountPaid"` equal to the dojo fee, and a `paidAt`. Second call lists the roster with that student's `fee` populated.

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/feeController.ts backend/src/routes/feeRoutes.ts backend/src/app.ts
git commit -m "feat(fees): fee ledger API (dojo roster, mark, my-fees)"
```

---

### Task 5: Attendance API

**Files:**
- Create: `backend/src/controllers/attendanceController.ts`
- Create: `backend/src/routes/attendanceRoutes.ts`
- Modify: `backend/src/app.ts` (import + mount)

**Interfaces:**
- Produces:
  - `GET /api/attendance/dojo/:dojoId?month&year` → `{ status, data: { roster: Array<{ student: {id,name,membershipNumber,currentBeltRank}, attendance: MonthlyAttendance | null }> } }`
  - `POST /api/attendance/mark` body `{ dojoId, month, year, entries: Array<{ userId, classesAttended, notes? }> }` → `{ status, results, data: { attendance: MonthlyAttendance[] } }`
  - `GET /api/attendance/me` → `{ status, data: { attendance: MonthlyAttendance[] } }`

- [ ] **Step 1: Create the controller**

Create `backend/src/controllers/attendanceController.ts`:

```ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

// GET /api/attendance/dojo/:dojoId?month=&year=
export const getDojoAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { dojoId } = req.params;
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);
  if (!month || !year || month < 1 || month > 12) {
    return next(new AppError('Valid month (1-12) and year query params are required', 400));
  }

  const where: any = { role: 'STUDENT', dojoId };
  if (currentUser.role !== 'ADMIN') where.primaryInstructorId = currentUser.id;

  const students = await prisma.user.findMany({
    where,
    select: { id: true, name: true, membershipNumber: true, currentBeltRank: true },
    orderBy: { name: 'asc' },
  });

  const records = await prisma.monthlyAttendance.findMany({
    where: { dojoId, month, year, userId: { in: students.map((s) => s.id) } },
  });
  const byUser = new Map(records.map((r) => [r.userId, r]));

  const roster = students.map((student) => ({ student, attendance: byUser.get(student.id) ?? null }));
  res.status(200).json({ status: 'success', data: { roster } });
});

// POST /api/attendance/mark
export const markAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { dojoId, month, year, entries } = req.body;
  if (!dojoId || !month || !year || !Array.isArray(entries)) {
    return next(new AppError('dojoId, month, year and entries[] are required', 400));
  }
  const m = parseInt(month);
  const y = parseInt(year);
  if (m < 1 || m > 12) return next(new AppError('month must be 1-12', 400));
  if (entries.length === 0) return next(new AppError('entries[] must not be empty', 400));

  const ids: string[] = entries.map((e: any) => e.userId);

  if (currentUser.role !== 'ADMIN') {
    const owned = await prisma.user.findMany({
      where: { id: { in: ids }, primaryInstructorId: currentUser.id },
      select: { id: true },
    });
    const ownedSet = new Set(owned.map((o) => o.id));
    if (!ids.every((id) => ownedSet.has(id))) {
      return next(new AppError('You can only manage your own students', 403));
    }
  }

  const attendance = await prisma.$transaction(
    entries.map((e: any) =>
      prisma.monthlyAttendance.upsert({
        where: { userId_month_year: { userId: e.userId, month: m, year: y } },
        create: {
          userId: e.userId, dojoId, month: m, year: y,
          classesAttended: parseInt(e.classesAttended) || 0,
          notes: e.notes ?? null,
          markedBy: currentUser.id,
        },
        update: {
          classesAttended: parseInt(e.classesAttended) || 0,
          notes: e.notes ?? null,
          markedBy: currentUser.id,
        },
      })
    )
  );

  res.status(200).json({ status: 'success', results: attendance.length, data: { attendance } });
});

// GET /api/attendance/me
export const getMyAttendance = catchAsync(async (req: Request, res: Response) => {
  const attendance = await prisma.monthlyAttendance.findMany({
    where: { userId: req.user.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  res.status(200).json({ status: 'success', data: { attendance } });
});
```

- [ ] **Step 2: Create the routes**

Create `backend/src/routes/attendanceRoutes.ts`:

```ts
import express from 'express';
import { getDojoAttendance, markAttendance, getMyAttendance } from '../controllers/attendanceController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/me', getMyAttendance);
router.get('/dojo/:dojoId', restrictTo('ADMIN', 'INSTRUCTOR'), getDojoAttendance);
router.post('/mark', restrictTo('ADMIN', 'INSTRUCTOR'), markAttendance);

export default router;
```

- [ ] **Step 3: Mount the router in `app.ts`**

Add the import near the other route imports:

```ts
import attendanceRouter from './routes/attendanceRoutes';
```

And mount it near the other `app.use` lines:

```ts
app.use('/api/attendance', attendanceRouter);  // Monthly attendance
```

- [ ] **Step 4: Build to verify it compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manually verify (requires running backend + instructor token)**

Run (replace placeholders):
```bash
curl -s -X POST http://localhost:5000/api/attendance/mark -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dojoId":"DOJO_ID","month":6,"year":2026,"entries":[{"userId":"STUDENT_ID","classesAttended":12}]}' | head -c 400
curl -s "http://localhost:5000/api/attendance/dojo/DOJO_ID?month=6&year=2026" -H "Authorization: Bearer TOKEN" | head -c 500
```
Expected: first returns `"results":1` and the record with `"classesAttended":12`; second lists the roster with that student's `attendance` populated.

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/attendanceController.ts backend/src/routes/attendanceRoutes.ts backend/src/app.ts
git commit -m "feat(attendance): monthly attendance API (dojo roster, bulk mark, my-attendance)"
```

---

### Task 6: Fee reminder email, service, manual endpoint, and scheduler

**Files:**
- Modify: `backend/src/services/emailService.ts` (add `sendFeeReminderEmail`)
- Create: `backend/src/services/feeReminderService.ts`
- Modify: `backend/src/controllers/feeController.ts` (add `remindUnpaid`)
- Modify: `backend/src/routes/feeRoutes.ts` (add `POST /remind`)
- Modify: `backend/src/app.ts` (cron endpoint + scheduler)

**Interfaces:**
- Consumes: `renderFeeReminderTemplate`, `shouldRemindStudent`, `monthName`, `DEFAULT_FEE_REMINDER_TEMPLATE` from `../utils/feeReminder`; `send/wrapHtml/btn/getSiteUrl` inside emailService.
- Produces:
  - `sendFeeReminderEmail(email: string, name: string, message: string): Promise<void>`
  - `remindDojo(dojoId: string, month: number, year: number, today?: Date): Promise<{ sent: number; skipped: number; errors: number }>`
  - `sendFeeRemindersAllDojos(today?: Date): Promise<{ dojos: number; sent: number; skipped: number; errors: number }>`
  - `POST /api/fees/remind` body `{ dojoId, month, year }` → `{ status, data: { sent, skipped, errors } }`
  - `GET /api/cron/fee-reminders?secret=` → `{ status, data }`

- [ ] **Step 1: Add `sendFeeReminderEmail` to emailService**

Append to `backend/src/services/emailService.ts` (after `sendMembershipRenewalEmail`, reusing the existing private `getSiteUrl`, `wrapHtml`, `btn`, `send` helpers):

```ts
export const sendFeeReminderEmail = async (email: string, name: string, message: string) => {
    const SITE_URL = getSiteUrl();
    const subject = '📬 KKFI Training Fee Reminder';
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Training Fee Reminder</h2>
<p style="white-space:pre-line;">${message}</p>
${btn('View My Fees', SITE_URL + '/dashboard/my-fees')}
<p style="color:#888;font-size:13px;">If you have already paid, please ignore this message. Osu!</p>
`);
    const text = `${message}\n\nView your fees: ${SITE_URL}/dashboard/my-fees\n\nOsu!`;
    await send(email, subject, html, text);
};
```

- [ ] **Step 2: Create the reminder service**

Create `backend/src/services/feeReminderService.ts`:

```ts
import prisma from '../prisma';
import { sendFeeReminderEmail } from './emailService';
import {
  renderFeeReminderTemplate,
  shouldRemindStudent,
  monthName,
  DEFAULT_FEE_REMINDER_TEMPLATE,
} from '../utils/feeReminder';
import type { FeeStatus } from '../utils/feeStatus';

/** Send reminders to unpaid/partial active students of one dojo for a given month. */
export async function remindDojo(
  dojoId: string,
  month: number,
  year: number,
  today: Date = new Date()
): Promise<{ sent: number; skipped: number; errors: number }> {
  const result = { sent: 0, skipped: 0, errors: 0 };

  const dojo = await prisma.dojo.findUnique({ where: { id: dojoId } });
  if (!dojo || dojo.monthlyFee == null) return result;

  const students = await prisma.user.findMany({
    where: { dojoId, role: 'STUDENT', membershipStatus: 'ACTIVE' },
    select: { id: true, name: true, email: true },
  });

  const fees = await prisma.monthlyFee.findMany({ where: { dojoId, month, year } });
  const feeByUser = new Map(fees.map((f) => [f.userId, f]));

  const dueDateStr = new Date(year, month - 1, dojo.feeDueDay).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const template = dojo.feeReminderTemplate || DEFAULT_FEE_REMINDER_TEMPLATE;

  for (const student of students) {
    const fee = feeByUser.get(student.id) ?? null;
    const status = (fee?.status ?? 'UNPAID') as FeeStatus;

    if (!shouldRemindStudent({ status, lastReminderAt: fee?.lastReminderAt ?? null, feeDueDay: dojo.feeDueDay, today })) {
      result.skipped++;
      continue;
    }

    try {
      const message = renderFeeReminderTemplate(template, {
        name: student.name,
        amount: dojo.monthlyFee,
        month: monthName(month),
        year,
        dojoName: dojo.name,
        dueDate: dueDateStr,
      });

      await sendFeeReminderEmail(student.email, student.name, message);

      await prisma.notification.create({
        data: {
          userId: student.id,
          type: 'FEE_REMINDER',
          title: `Fee due — ${monthName(month)} ${year}`,
          message,
          emailSent: true,
          emailSentAt: new Date(),
        },
      });

      await prisma.monthlyFee.upsert({
        where: { userId_month_year: { userId: student.id, month, year } },
        create: {
          userId: student.id, dojoId, month, year,
          amount: dojo.monthlyFee, status: 'UNPAID', markedBy: 'SYSTEM',
          remindersSent: 1, lastReminderAt: today,
        },
        update: { remindersSent: { increment: 1 }, lastReminderAt: today },
      });

      console.log(`[FEE-REMINDER] Sent to ${student.email}`);
      result.sent++;
    } catch (err) {
      console.error(`[FEE-REMINDER] Failed for ${student.email}:`, err);
      result.errors++;
    }
  }

  return result;
}

/** Cron entry point: remind across all dojos with a configured fee, for the current month. */
export async function sendFeeRemindersAllDojos(
  today: Date = new Date()
): Promise<{ dojos: number; sent: number; skipped: number; errors: number }> {
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const dojos = await prisma.dojo.findMany({ where: { monthlyFee: { not: null } }, select: { id: true } });
  const totals = { dojos: dojos.length, sent: 0, skipped: 0, errors: 0 };

  for (const d of dojos) {
    const r = await remindDojo(d.id, month, year, today);
    totals.sent += r.sent;
    totals.skipped += r.skipped;
    totals.errors += r.errors;
  }

  console.log(`[FEE-REMINDER] dojos=${totals.dojos} sent=${totals.sent} skipped=${totals.skipped} errors=${totals.errors}`);
  return totals;
}
```

- [ ] **Step 3: Add the manual `remindUnpaid` handler to feeController**

Append to `backend/src/controllers/feeController.ts`, and add the import at the top:

```ts
import { remindDojo } from '../services/feeReminderService';
```

```ts
// POST /api/fees/remind
export const remindUnpaid = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { dojoId, month, year } = req.body;
  if (!dojoId || !month || !year) {
    return next(new AppError('dojoId, month and year are required', 400));
  }

  if (currentUser.role !== 'ADMIN') {
    const teaches = await prisma.user.findFirst({
      where: { dojoId, primaryInstructorId: currentUser.id },
      select: { id: true },
    });
    if (!teaches) return next(new AppError('You can only send reminders for your own dojo', 403));
  }

  const result = await remindDojo(dojoId, parseInt(month), parseInt(year));
  res.status(200).json({ status: 'success', data: result });
});
```

- [ ] **Step 4: Add the `/remind` route**

In `backend/src/routes/feeRoutes.ts`, add `remindUnpaid` to the import and add the route:

```ts
import { getDojoFees, markFee, getMyFees, remindUnpaid } from '../controllers/feeController';
```
```ts
router.post('/remind', restrictTo('ADMIN', 'INSTRUCTOR'), remindUnpaid);
```

- [ ] **Step 5: Add the cron endpoint and scheduler wiring in `app.ts`**

Add the import near the existing `renewalReminderService` import (line 34):

```ts
import { sendFeeRemindersAllDojos } from './services/feeReminderService';
```

Add a cron endpoint immediately after the existing `/api/cron/renewal-reminders` handler (after line 167):

```ts
// ─── Cron Endpoint: Fee Reminders ────────────────────────────────────
app.get('/api/cron/fee-reminders', async (req, res) => {
    const secret = req.query.secret || req.headers['x-cron-secret'];
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ status: 'fail', message: 'Invalid cron secret' });
    }
    try {
        const result = await sendFeeRemindersAllDojos();
        res.status(200).json({ status: 'success', data: result });
    } catch (err) {
        console.error('[CRON] Fee reminder error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to send fee reminders' });
    }
});
```

In `startRenewalReminderScheduler`, add the fee-reminder call alongside the existing renewal calls — inside both the startup `setTimeout` and the 24h `setInterval`:

```ts
    setTimeout(() => {
        sendRenewalReminders().catch(err => console.error('[CRON] Auto reminder error:', err));
        sendFeeRemindersAllDojos().catch(err => console.error('[CRON] Auto fee reminder error:', err));
    }, 60_000);
    _reminderInterval = setInterval(() => {
        sendRenewalReminders().catch(err => console.error('[CRON] Auto reminder error:', err));
        sendFeeRemindersAllDojos().catch(err => console.error('[CRON] Auto fee reminder error:', err));
    }, TWENTY_FOUR_HOURS);
```

- [ ] **Step 6: Build to verify it compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manually verify a manual reminder send (requires running backend + instructor token; email goes to console if SMTP/Brevo unset)**

Run (replace placeholders):
```bash
curl -s -X POST http://localhost:5000/api/fees/remind -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dojoId":"DOJO_ID","month":6,"year":2026}' | head -c 300
```
Expected: `"status":"success"` with `{ sent, skipped, errors }`. Backend logs show `[FEE-REMINDER] Sent to ...` for unpaid active students (or the console-email block when no mail provider is configured). PAID/WAIVED students are skipped.

- [ ] **Step 8: Commit**

```bash
git add backend/src/services/emailService.ts backend/src/services/feeReminderService.ts backend/src/controllers/feeController.ts backend/src/routes/feeRoutes.ts backend/src/app.ts
git commit -m "feat(fees): automated + manual fee reminders (email, in-app, scheduler)"
```

---

### Task 7: Frontend — instructor Attendance & Fees page

**Files:**
- Create: `frontend/src/app/dashboard/fees/page.tsx`
- Modify: the instructor dashboard component to add a nav link (see Step 4)

**Interfaces:**
- Consumes: backend `GET/POST /api/fees/*`, `GET/POST /api/attendance/*`; `api` from `@/lib/api`; `useAuthStore`.
- Produces: route `/dashboard/fees` (instructor view).

- [ ] **Step 1: Create the page**

Create `frontend/src/app/dashboard/fees/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

type FeeStatus = "UNPAID" | "PARTIAL" | "PAID" | "WAIVED";

interface RosterRow {
  userId: string;
  name: string;
  membershipNumber?: string | null;
  currentBeltRank?: string | null;
  status: FeeStatus;
  amountPaid: number;
  method: string;
  classesAttended: number;
  notes: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function InstructorFeesPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [monthlyFee, setMonthlyFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reminding, setReminding] = useState(false);
  const [message, setMessage] = useState("");

  const dojoId = user?.dojoId;

  useEffect(() => { if (!user) checkAuth(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (user && user.role !== "INSTRUCTOR" && user.role !== "ADMIN") router.push("/dashboard");
  }, [isLoading, isAuthenticated, user, router]);

  const load = useCallback(async () => {
    if (!dojoId) return;
    setLoading(true);
    setMessage("");
    try {
      const [feeRes, attRes] = await Promise.all([
        api.get(`/fees/dojo/${dojoId}`, { params: { month, year } }),
        api.get(`/attendance/dojo/${dojoId}`, { params: { month, year } }),
      ]);
      setMonthlyFee(feeRes.data.data.monthlyFee);
      const attByUser = new Map<string, number>(
        attRes.data.data.roster.map((r: any) => [r.student.id, r.attendance?.classesAttended ?? 0])
      );
      const merged: RosterRow[] = feeRes.data.data.roster.map((r: any) => ({
        userId: r.student.id,
        name: r.student.name,
        membershipNumber: r.student.membershipNumber,
        currentBeltRank: r.student.currentBeltRank,
        status: (r.fee?.status ?? "UNPAID") as FeeStatus,
        amountPaid: r.fee?.amountPaid ?? 0,
        method: r.fee?.method ?? "",
        classesAttended: attByUser.get(r.student.id) ?? 0,
        notes: r.fee?.notes ?? "",
      }));
      setRows(merged);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Failed to load roster");
    } finally {
      setLoading(false);
    }
  }, [dojoId, month, year]);

  useEffect(() => { load(); }, [load]);

  const update = (userId: string, patch: Partial<RosterRow>) =>
    setRows((rs) => rs.map((r) => (r.userId === userId ? { ...r, ...patch } : r)));

  const saveRow = async (row: RosterRow) => {
    if (!dojoId) return;
    setSavingId(row.userId);
    setMessage("");
    try {
      await api.post("/attendance/mark", {
        dojoId, month, year,
        entries: [{ userId: row.userId, classesAttended: row.classesAttended, notes: row.notes }],
      });
      await api.post("/fees/mark", {
        userId: row.userId, dojoId, month, year,
        status: row.status,
        amountPaid: row.status === "PARTIAL" ? row.amountPaid : undefined,
        method: row.method || undefined,
        notes: row.notes || undefined,
      });
      setMessage(`Saved ${row.name}`);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || `Failed to save ${row.name}`);
    } finally {
      setSavingId(null);
    }
  };

  const sendReminders = async () => {
    if (!dojoId) return;
    setReminding(true);
    setMessage("");
    try {
      const res = await api.post("/fees/remind", { dojoId, month, year });
      const { sent, skipped, errors } = res.data.data;
      setMessage(`Reminders: ${sent} sent, ${skipped} skipped, ${errors} errors`);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Failed to send reminders");
    } finally {
      setReminding(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Attendance &amp; Fees</h1>
        <p className="text-gray-400 mb-4">
          {monthlyFee != null ? `Monthly fee: ₹${monthlyFee}` : "No monthly fee set for this dojo yet."}
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-28" />
          <button onClick={sendReminders} disabled={reminding} className="ml-auto bg-red-600 hover:bg-red-700 rounded px-4 py-2 disabled:opacity-50">
            {reminding ? "Sending…" : "Send reminders to all unpaid"}
          </button>
        </div>

        {message && <p className="mb-3 text-sm text-amber-400">{message}</p>}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={18} /> Loading…</div>
        ) : rows.length === 0 ? (
          <p className="text-gray-500">No students found for this dojo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-left">
                <tr>
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Classes</th>
                  <th className="py-2 pr-3">Fee status</th>
                  <th className="py-2 pr-3">Amount paid</th>
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.userId} className="border-t border-gray-800">
                    <td className="py-2 pr-3">
                      <div>{r.name}</div>
                      <div className="text-xs text-gray-500">{r.membershipNumber || r.currentBeltRank || ""}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" min={0} value={r.classesAttended}
                        onChange={(e) => update(r.userId, { classesAttended: Number(e.target.value) })}
                        className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1" />
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
                    <td className="py-2 pr-3">
                      <button onClick={() => saveRow(r)} disabled={savingId === r.userId}
                        className="bg-gray-700 hover:bg-gray-600 rounded px-3 py-1 disabled:opacity-50">
                        {savingId === r.userId ? "…" : "Save"}
                      </button>
                    </td>
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

- [ ] **Step 2: Build the frontend to verify it compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify in the browser (requires running backend + frontend)**

Log in as an instructor, navigate to `/dashboard/fees`. Expected: the page loads the dojo roster for the current month; editing classes/status/method and clicking Save shows a "Saved <name>" message; "Send reminders to all unpaid" shows a sent/skipped/errors summary.

- [ ] **Step 4: Add a navigation link from the instructor dashboard**

Open `frontend/src/components/dashboard/InstructorDashboard.tsx`. Locate the quick-links / tab area where existing instructor actions are listed. Add a link to the new page:

```tsx
<Link href="/dashboard/fees" className="block rounded-lg border border-gray-800 bg-gray-900 p-4 hover:border-red-600">
  <div className="font-semibold">Attendance &amp; Fees</div>
  <div className="text-sm text-gray-400">Mark monthly attendance and fee collection</div>
</Link>
```

Ensure `import Link from "next/link";` is present at the top of the file (add it if missing).

- [ ] **Step 5: Verify compile and commit**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

```bash
git add frontend/src/app/dashboard/fees/page.tsx frontend/src/components/dashboard/InstructorDashboard.tsx
git commit -m "feat(frontend): instructor attendance & fees page + nav link"
```

---

### Task 8: Frontend — dojo fee settings panel with live preview

**Files:**
- Create: `frontend/src/lib/feePreview.ts`
- Create: `frontend/src/lib/feePreview.test.ts`
- Modify: `frontend/src/app/dashboard/fees/page.tsx` (add a settings panel)

**Interfaces:**
- Consumes: backend `PATCH /api/dojos/:id` (Task 3).
- Produces: `renderFeePreview(template: string, vars: { name; amount; month; year; dojoName; dueDate }): string` and `DEFAULT_FEE_REMINDER_TEMPLATE` (frontend mirror).

- [ ] **Step 1: Write the failing test for the preview util**

Create `frontend/src/lib/feePreview.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderFeePreview, DEFAULT_FEE_REMINDER_TEMPLATE } from './feePreview';

describe('renderFeePreview', () => {
  it('substitutes merge fields', () => {
    const out = renderFeePreview('Hi {name}, ₹{amount} for {month}', {
      name: 'Riku', amount: 800, month: 'June', year: 2026, dojoName: 'D', dueDate: 'x',
    });
    expect(out).toBe('Hi Riku, ₹800 for June');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(renderFeePreview('{name} {nope}', { name: 'A', amount: 1, month: 'm', year: 1, dojoName: 'd', dueDate: 'x' }))
      .toBe('A {nope}');
  });

  it('default template mentions name and amount', () => {
    expect(DEFAULT_FEE_REMINDER_TEMPLATE).toContain('{name}');
    expect(DEFAULT_FEE_REMINDER_TEMPLATE).toContain('{amount}');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/feePreview.test.ts`
Expected: FAIL — cannot resolve `./feePreview`.

- [ ] **Step 3: Implement the preview util**

Create `frontend/src/lib/feePreview.ts`:

```ts
export const DEFAULT_FEE_REMINDER_TEMPLATE =
  'Osu {name}, your {month} {year} training fee of ₹{amount} for {dojoName} is due (by {dueDate}). ' +
  'Please clear it at your earliest convenience. Osu!';

export interface FeePreviewVars {
  name: string;
  amount: number | string;
  month: string;
  year: number | string;
  dojoName: string;
  dueDate: string;
}

export function renderFeePreview(template: string, vars: FeePreviewVars): string {
  const map: Record<string, string> = {
    name: String(vars.name),
    amount: String(vars.amount),
    month: String(vars.month),
    year: String(vars.year),
    dojoName: String(vars.dojoName),
    dueDate: String(vars.dueDate),
  };
  return template.replace(/\{(\w+)\}/g, (full, key) => (key in map ? map[key] : full));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/feePreview.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the settings panel to the instructor fees page**

In `frontend/src/app/dashboard/fees/page.tsx`, add these imports at the top:

```tsx
import { renderFeePreview, DEFAULT_FEE_REMINDER_TEMPLATE } from "@/lib/feePreview";
```

Add settings state inside the component (near the other `useState` hooks):

```tsx
  const [feeInput, setFeeInput] = useState<string>("");
  const [dueDayInput, setDueDayInput] = useState<string>("10");
  const [templateInput, setTemplateInput] = useState<string>(DEFAULT_FEE_REMINDER_TEMPLATE);
  const [savingSettings, setSavingSettings] = useState(false);
```

After `setMonthlyFee(feeRes.data.data.monthlyFee);` inside `load`, seed the input:

```tsx
      setFeeInput(feeRes.data.data.monthlyFee != null ? String(feeRes.data.data.monthlyFee) : "");
```

Add a save handler (near `sendReminders`):

```tsx
  const saveSettings = async () => {
    if (!dojoId) return;
    setSavingSettings(true);
    setMessage("");
    try {
      await api.patch(`/dojos/${dojoId}`, {
        monthlyFee: feeInput === "" ? null : Number(feeInput),
        feeDueDay: Number(dueDayInput),
        feeReminderTemplate: templateInput,
      });
      setMessage("Dojo fee settings saved");
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };
```

Add this settings panel JSX just below the `<h1>`/intro `<p>` and above the month selector row:

```tsx
        <details className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <summary className="cursor-pointer font-semibold">Dojo fee settings</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Monthly fee (₹)
              <input type="number" min={0} value={feeInput} onChange={(e) => setFeeInput(e.target.value)}
                className="mt-1 w-full bg-black border border-gray-700 rounded px-2 py-1" />
            </label>
            <label className="text-sm">Fee due day (1-28)
              <input type="number" min={1} max={28} value={dueDayInput} onChange={(e) => setDueDayInput(e.target.value)}
                className="mt-1 w-full bg-black border border-gray-700 rounded px-2 py-1" />
            </label>
          </div>
          <label className="mt-3 block text-sm">Reminder template
            <textarea value={templateInput} onChange={(e) => setTemplateInput(e.target.value)} rows={3}
              className="mt-1 w-full bg-black border border-gray-700 rounded px-2 py-1" />
          </label>
          <p className="mt-1 text-xs text-gray-500">Merge fields: {"{name} {amount} {month} {year} {dojoName} {dueDate}"}</p>
          <div className="mt-2 rounded bg-black border border-gray-800 p-3 text-sm text-gray-300">
            <div className="text-xs text-gray-500 mb-1">Preview</div>
            {renderFeePreview(templateInput, {
              name: "Riku", amount: feeInput || "800", month: MONTHS[month - 1], year,
              dojoName: user?.dojo?.name || "your dojo", dueDate: `${dueDayInput} ${MONTHS[month - 1]} ${year}`,
            })}
          </div>
          <button onClick={saveSettings} disabled={savingSettings}
            className="mt-3 bg-red-600 hover:bg-red-700 rounded px-4 py-2 disabled:opacity-50">
            {savingSettings ? "Saving…" : "Save settings"}
          </button>
        </details>
```

- [ ] **Step 6: Verify compile + tests**

Run: `cd frontend && npx tsc --noEmit && npx vitest run src/lib/feePreview.test.ts`
Expected: no TS errors; preview tests pass.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/feePreview.ts frontend/src/lib/feePreview.test.ts frontend/src/app/dashboard/fees/page.tsx
git commit -m "feat(frontend): dojo fee settings panel with live reminder preview"
```

---

### Task 9: Frontend — student "My Fees" page

**Files:**
- Create: `frontend/src/app/dashboard/my-fees/page.tsx`
- Modify: the student dashboard component to add a nav link (see Step 4)

**Interfaces:**
- Consumes: backend `GET /api/fees/me`.
- Produces: route `/dashboard/my-fees` (student view). This is the URL the reminder email/notification links to.

- [ ] **Step 1: Create the page**

Create `frontend/src/app/dashboard/my-fees/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface Fee {
  id: string;
  month: number;
  year: number;
  amount: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "WAIVED";
  amountPaid: number;
  paidAt: string | null;
  method: string | null;
}

const STATUS_STYLE: Record<Fee["status"], string> = {
  PAID: "text-green-400",
  PARTIAL: "text-amber-400",
  UNPAID: "text-red-400",
  WAIVED: "text-gray-400",
};

export default function MyFeesPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user) checkAuth(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (!isLoading && !isAuthenticated) router.push("/login"); }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/fees/me");
        setFees(res.data.data.fees);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Fees</h1>
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
                    <td className="py-2 pr-3">{MONTHS[f.month - 1]} {f.year}</td>
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

- [ ] **Step 2: Build the frontend to verify it compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify (requires running backend + frontend)**

Log in as a student who has a fee record (created in Task 4 verification) and visit `/dashboard/my-fees`. Expected: the table lists each month with amount, colored status, paid date, and method.

- [ ] **Step 4: Add a navigation link from the student dashboard**

Open `frontend/src/components/dashboard/StudentDashboard.tsx`. Locate the existing quick-links / cards grid and add:

```tsx
<Link href="/dashboard/my-fees" className="block rounded-lg border border-gray-800 bg-gray-900 p-4 hover:border-red-600">
  <div className="font-semibold">My Fees</div>
  <div className="text-sm text-gray-400">View your monthly fee status</div>
</Link>
```

Ensure `import Link from "next/link";` is present (add it if missing).

- [ ] **Step 5: Verify compile and commit**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

```bash
git add frontend/src/app/dashboard/my-fees/page.tsx frontend/src/components/dashboard/StudentDashboard.tsx
git commit -m "feat(frontend): student My Fees page + nav link"
```

---

## Final verification

- [ ] Run the full backend unit suite: `cd backend && npm test` — Expected: all `feeStatus` + `feeReminder` tests pass.
- [ ] Run the frontend unit suite: `cd frontend && npm test` — Expected: all tests pass including `feePreview`.
- [ ] Typecheck both: `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit` — Expected: no errors.
- [ ] Smoke test end-to-end as an instructor: set a monthly fee in settings, mark a student PAID and another UNPAID, send reminders, confirm the unpaid student receives an in-app notification + email (console if no provider) and the paid student is skipped.

## Notes on testing approach

The backend has no integration-test harness or test database, so controllers and the reminder service are verified manually (curl/browser steps above) rather than with automated DB tests. All genuinely branchy pure logic — fee status normalization, template rendering, and the reminder decision — is extracted into utilities with real Vitest unit tests (Tasks 2 and 8), which is where regressions are most likely. Vitest is the test runner already used by the frontend; Task 2 adds it to the backend identically.

## Deployment (after all tasks pass)

Per existing project process: build applies the schema via `prisma db push`. Deploy backend (Render) and frontend (Vercel) as usual. To enable scheduled fee reminders via external cron, point a daily job at `GET /api/cron/fee-reminders?secret=$CRON_SECRET` (mirrors the existing renewal-reminders cron). The in-server 24h timer also triggers them automatically.
