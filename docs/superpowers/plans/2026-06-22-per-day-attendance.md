# Per-Day Attendance (Month Grid) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monthly "classes attended" count with per-day Present/Absent attendance, marked via a month grid on its own page; the fees page keeps only fee columns.

**Architecture:** Drop `MonthlyAttendance`, add a per-day `AttendanceRecord` model. Rework the attendance controller to a day-keyed roster read + a single-cell mark/clear write. Split the UI into a new `/dashboard/attendance` month-grid page (optimistic per-cell auto-save) and the existing `/dashboard/fees` page with its attendance column removed. The instructor dashboard gets two Quick-Action cards. All fee logic is untouched.

**Tech Stack:** Express + TypeScript + Prisma (PostgreSQL); Next.js 14 (App Router) + TypeScript + Tailwind + Zustand; Vitest.

## Global Constraints

- Prisma client: `import prisma from '../prisma';` (default export). Controllers wrap handlers in `catchAsync`; errors via `new AppError(message, statusCode)`.
- Schema syncs via `prisma db push` (NOT migrations); always run `npx prisma generate` after editing the schema. Dropping `MonthlyAttendance` requires `--accept-data-loss` (it holds only test data).
- A calendar day is stored as `new Date(Date.UTC(year, month - 1, day))` (UTC midnight). All reads/writes key on UTC-midnight dates.
- Attendance statuses are exactly `PRESENT` and `ABSENT`. No row = unmarked.
- Instructor scoping: non-ADMIN actions are restricted to their own students (`User.primaryInstructorId === req.user.id`) AND the student's `dojoId` must match the request `dojoId`; ADMIN bypasses the instructor check.
- Frontend calls the backend via `import api from '@/lib/api'` (axios, baseURL includes `/api`); auth via `useAuthStore` from `@/store/authStore`. Backend tests run with `npm test` (vitest) in `backend/`; frontend with `npx vitest run` in `frontend/`.
- Routes are guarded by `protect`; instructor/admin endpoints add `restrictTo('ADMIN','INSTRUCTOR')`.

---

### Task 1: Schema — drop MonthlyAttendance, add AttendanceRecord

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces: enum `AttendanceStatus { PRESENT ABSENT }`; model `AttendanceRecord` with composite unique key name `userId_date`; back-relations `attendanceRecords` on `User` and `Dojo`.

- [ ] **Step 1: Remove the `MonthlyAttendance` model**

Delete the entire `MonthlyAttendance` model (currently the last model in the file, lines ~894–910):
```prisma
model MonthlyAttendance {
  id              String   @id @default(uuid())
  ...
  @@unique([userId, month, year])
  @@index([dojoId, year, month])
}
```

- [ ] **Step 2: Remove the two `monthlyAttendance` back-relations**

In the `User` model, delete the line:
```prisma
  monthlyAttendance     MonthlyAttendance[]
```
In the `Dojo` model, delete the line:
```prisma
  monthlyAttendance MonthlyAttendance[]
```

- [ ] **Step 3: Add the new enum + model at the end of the file**

Append to `backend/prisma/schema.prisma`:
```prisma
enum AttendanceStatus {
  PRESENT
  ABSENT
}

model AttendanceRecord {
  id        String           @id @default(uuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  dojoId    String
  dojo      Dojo             @relation(fields: [dojoId], references: [id])
  date      DateTime         // UTC midnight of the calendar day
  status    AttendanceStatus
  markedBy  String           // instructor user id
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  @@unique([userId, date])
  @@index([dojoId, date])
}
```

- [ ] **Step 4: Add the back-relations**

In the `User` model, where `monthlyAttendance` was, add:
```prisma
  attendanceRecords     AttendanceRecord[]
```
In the `Dojo` model, where `monthlyAttendance` was, add:
```prisma
  attendanceRecords AttendanceRecord[]
```

- [ ] **Step 5: Validate, generate, and push**

Run: `cd backend && npx prisma validate && npx prisma generate`
Expected: `valid 🚀` then `Generated Prisma Client`.

Run: `cd backend && npx prisma db push --accept-data-loss`
Expected: `Your database is now in sync with your Prisma schema.` (drops the `MonthlyAttendance` table, creates `AttendanceRecord`). If no DB is reachable locally, note it and continue — the deploy build applies it.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(schema): replace MonthlyAttendance with per-day AttendanceRecord"
```

---

### Task 2: Trim the fees page (remove attendance)

**Files:**
- Modify: `frontend/src/app/dashboard/fees/page.tsx`

**Interfaces:**
- Consumes: existing `/fees/*` endpoints (unchanged).
- Produces: the fees page no longer reads or writes the attendance API and has no "Classes" column.

This task runs before the attendance API changes so the fees page stops calling the attendance endpoints before their shape changes.

- [ ] **Step 1: Drop `classesAttended` from the `RosterRow` interface**

Replace the `RosterRow` interface (lines ~12–22) with:
```tsx
interface RosterRow {
  userId: string;
  name: string;
  membershipNumber?: string | null;
  currentBeltRank?: string | null;
  status: FeeStatus;
  amountPaid: number;
  method: string;
  notes: string;
}
```

- [ ] **Step 2: Remove the attendance fetch and the merge of attendance into rows**

Replace the body of `load` (lines ~52–86) with this version (drops the `/attendance/dojo` call and the `attByUser` map):
```tsx
  const load = useCallback(async () => {
    if (!dojoId) return;
    setLoading(true);
    setMessage("");
    try {
      const feeRes = await api.get(`/fees/dojo/${dojoId}`, { params: { month, year } });
      const d = feeRes.data.data;
      setMonthlyFee(d.monthlyFee);
      setFeeInput(d.monthlyFee != null ? String(d.monthlyFee) : "");
      setDueDayInput(d.feeDueDay != null ? String(d.feeDueDay) : "10");
      setTemplateInput(d.feeReminderTemplate || DEFAULT_FEE_REMINDER_TEMPLATE);
      const merged: RosterRow[] = d.roster.map((r: any) => ({
        userId: r.student.id,
        name: r.student.name,
        membershipNumber: r.student.membershipNumber,
        currentBeltRank: r.student.currentBeltRank,
        status: (r.fee?.status ?? "UNPAID") as FeeStatus,
        amountPaid: r.fee?.amountPaid ?? 0,
        method: r.fee?.method ?? "",
        notes: r.fee?.notes ?? "",
      }));
      setRows(merged);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Failed to load roster");
    } finally {
      setLoading(false);
    }
  }, [dojoId, month, year]);
```

- [ ] **Step 3: Remove the attendance POST from `saveRow`**

Replace `saveRow` (lines ~93–115) with this version (drops the `/attendance/mark` call):
```tsx
  const saveRow = async (row: RosterRow) => {
    if (!dojoId) return;
    setSavingId(row.userId);
    setMessage("");
    try {
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
```

- [ ] **Step 4: Remove the "Classes" column header and cell**

In the table header (lines ~210–219), delete the line:
```tsx
                  <th className="py-2 pr-3">Classes</th>
```
In the table body, delete the entire "Classes" `<td>` block (lines ~227–231):
```tsx
                    <td className="py-2 pr-3">
                      <input type="number" min={0} value={r.classesAttended}
                        onChange={(e) => update(r.userId, { classesAttended: Number(e.target.value) })}
                        className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1" />
                    </td>
```

- [ ] **Step 5: Update the page heading**

Change the `<h1>` (line ~156) from `Attendance &amp; Fees` to:
```tsx
        <h1 className="text-2xl font-bold mb-2">Monthly Fees</h1>
```

- [ ] **Step 6: Verify and commit**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

```bash
git add frontend/src/app/dashboard/fees/page.tsx
git commit -m "refactor(fees): remove attendance column; fees page is fees-only"
```

---

### Task 3: Backend attendance API — per-day roster read + single-cell mark

**Files:**
- Modify: `backend/src/controllers/attendanceController.ts` (full rewrite)
- `backend/src/routes/attendanceRoutes.ts` is unchanged (same paths/exports)

**Interfaces:**
- Produces:
  - `GET /api/attendance/dojo/:dojoId?month&year` → `{ status, data: { roster: Array<{ student: {id,name,membershipNumber,currentBeltRank}, days: Record<string,"PRESENT"|"ABSENT">, presentCount: number }> } }`
  - `POST /api/attendance/mark` body `{ userId, dojoId, year, month, day, status }` where `status` ∈ `"PRESENT"|"ABSENT"|null|"CLEAR"` → `{ status, data: { record: AttendanceRecord | null } }`
  - `GET /api/attendance/me` → `{ status, data: { attendance: AttendanceRecord[] } }`
  - Exports `getDojoAttendance`, `markAttendance`, `getMyAttendance` (names unchanged so routes keep working).

- [ ] **Step 1: Rewrite the controller**

Replace the entire contents of `backend/src/controllers/attendanceController.ts` with:
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

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const nextMonthStart = new Date(Date.UTC(year, month, 1));

  const records = await prisma.attendanceRecord.findMany({
    where: {
      dojoId,
      userId: { in: students.map((s) => s.id) },
      date: { gte: monthStart, lt: nextMonthStart },
    },
  });

  const daysByUser = new Map<string, Record<string, string>>();
  for (const r of records) {
    const day = String(new Date(r.date).getUTCDate());
    const m = daysByUser.get(r.userId) ?? {};
    m[day] = r.status;
    daysByUser.set(r.userId, m);
  }

  const roster = students.map((student) => {
    const days = daysByUser.get(student.id) ?? {};
    const presentCount = Object.values(days).filter((s) => s === 'PRESENT').length;
    return { student, days, presentCount };
  });

  res.status(200).json({ status: 'success', data: { roster } });
});

// POST /api/attendance/mark  — body: { userId, dojoId, year, month, day, status }
export const markAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const currentUser = req.user;
  const { userId, dojoId, year, month, day, status } = req.body;
  if (!userId || !dojoId || !year || !month || !day) {
    return next(new AppError('userId, dojoId, year, month and day are required', 400));
  }
  const y = parseInt(year);
  const m = parseInt(month);
  const d = parseInt(day);
  if (m < 1 || m > 12) return next(new AppError('month must be 1-12', 400));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d < 1 || d > daysInMonth) return next(new AppError('day is out of range for that month', 400));

  const clearing = status === null || status === 'CLEAR' || status === undefined;
  if (!clearing && status !== 'PRESENT' && status !== 'ABSENT') {
    return next(new AppError('status must be PRESENT, ABSENT, or null to clear', 400));
  }

  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: { primaryInstructorId: true, dojoId: true },
  });
  if (!student) return next(new AppError('Student not found', 404));
  if (currentUser.role !== 'ADMIN' && student.primaryInstructorId !== currentUser.id) {
    return next(new AppError('You can only manage your own students', 403));
  }
  if (student.dojoId !== dojoId) {
    return next(new AppError('Student does not belong to this dojo', 400));
  }

  const date = new Date(Date.UTC(y, m - 1, d));

  if (clearing) {
    await prisma.attendanceRecord.deleteMany({ where: { userId, date } });
    return res.status(200).json({ status: 'success', data: { record: null } });
  }

  const record = await prisma.attendanceRecord.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, dojoId, date, status, markedBy: currentUser.id },
    update: { status, markedBy: currentUser.id },
  });

  res.status(200).json({ status: 'success', data: { record } });
});

// GET /api/attendance/me
export const getMyAttendance = catchAsync(async (req: Request, res: Response) => {
  const attendance = await prisma.attendanceRecord.findMany({
    where: { userId: req.user.id },
    orderBy: { date: 'desc' },
  });
  res.status(200).json({ status: 'success', data: { attendance } });
});
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify (optional — needs a running backend + instructor token)**

Run (replace placeholders):
```bash
curl -s -X POST http://localhost:5000/api/attendance/mark -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"STUDENT_ID","dojoId":"DOJO_ID","year":2026,"month":6,"day":3,"status":"PRESENT"}' | head -c 300
curl -s "http://localhost:5000/api/attendance/dojo/DOJO_ID?month=6&year=2026" -H "Authorization: Bearer TOKEN" | head -c 500
```
Expected: first returns the record with `"status":"PRESENT"`; second shows that student with `"days":{"3":"PRESENT"}` and `"presentCount":1`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/attendanceController.ts
git commit -m "feat(attendance): per-day roster read and single-cell mark/clear API"
```

---

### Task 4: Frontend attendance grid utilities (TDD)

**Files:**
- Create: `frontend/src/lib/attendanceGrid.ts`
- Create: `frontend/src/lib/attendanceGrid.test.ts`

**Interfaces:**
- Produces:
  - `type AttendanceStatus = 'PRESENT' | 'ABSENT'`
  - `nextStatus(current: AttendanceStatus | null): AttendanceStatus | null` — cycle null→PRESENT→ABSENT→null
  - `daysInMonth(year: number, month: number): number` — month is 1–12
  - `countPresent(days: Record<string, string>): number`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/attendanceGrid.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { nextStatus, daysInMonth, countPresent } from './attendanceGrid';

describe('nextStatus', () => {
  it('cycles empty -> PRESENT -> ABSENT -> empty', () => {
    expect(nextStatus(null)).toBe('PRESENT');
    expect(nextStatus('PRESENT')).toBe('ABSENT');
    expect(nextStatus('ABSENT')).toBe(null);
  });
});

describe('daysInMonth', () => {
  it('returns 30 for June 2026', () => {
    expect(daysInMonth(2026, 6)).toBe(30);
  });
  it('returns 31 for January 2026', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
  });
  it('handles leap February', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
  });
});

describe('countPresent', () => {
  it('counts only PRESENT values', () => {
    expect(countPresent({ '1': 'PRESENT', '2': 'ABSENT', '3': 'PRESENT' })).toBe(2);
  });
  it('returns 0 for an empty map', () => {
    expect(countPresent({})).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/attendanceGrid.test.ts`
Expected: FAIL — cannot resolve `./attendanceGrid`.

- [ ] **Step 3: Implement the util**

Create `frontend/src/lib/attendanceGrid.ts`:
```ts
export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export function nextStatus(current: AttendanceStatus | null): AttendanceStatus | null {
  if (current === null) return 'PRESENT';
  if (current === 'PRESENT') return 'ABSENT';
  return null;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function countPresent(days: Record<string, string>): number {
  return Object.values(days).filter((s) => s === 'PRESENT').length;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/attendanceGrid.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/attendanceGrid.ts frontend/src/lib/attendanceGrid.test.ts
git commit -m "feat(attendance): grid utilities (nextStatus, daysInMonth, countPresent)"
```

---

### Task 5: New attendance page (month grid)

**Files:**
- Create: `frontend/src/app/dashboard/attendance/page.tsx`

**Interfaces:**
- Consumes: `nextStatus`, `daysInMonth`, `countPresent`, `AttendanceStatus` from `@/lib/attendanceGrid`; `GET /api/attendance/dojo/:dojoId`, `POST /api/attendance/mark`; `api`; `useAuthStore`.
- Produces: route `/dashboard/attendance`.

- [ ] **Step 1: Create the page**

Create `frontend/src/app/dashboard/attendance/page.tsx`:
```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { nextStatus, daysInMonth, countPresent, AttendanceStatus } from "@/lib/attendanceGrid";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface Row {
  userId: string;
  name: string;
  membershipNumber?: string | null;
  days: Record<string, AttendanceStatus>;
}

export default function AttendancePage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const dojoId = user?.dojoId;
  const dayList = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);

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
      const res = await api.get(`/attendance/dojo/${dojoId}`, { params: { month, year } });
      const next: Row[] = res.data.data.roster.map((r: any) => ({
        userId: r.student.id,
        name: r.student.name,
        membershipNumber: r.student.membershipNumber,
        days: r.days ?? {},
      }));
      setRows(next);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [dojoId, month, year]);

  useEffect(() => { load(); }, [load]);

  const toggleCell = async (row: Row, day: number) => {
    if (!dojoId) return;
    const key = String(day);
    const current = row.days[key] ?? null;
    const next = nextStatus(current);
    const prevDays = row.days;

    // optimistic update
    setRows((rs) => rs.map((r) => {
      if (r.userId !== row.userId) return r;
      const days = { ...r.days };
      if (next === null) delete days[key];
      else days[key] = next;
      return { ...r, days };
    }));

    try {
      await api.post("/attendance/mark", { userId: row.userId, dojoId, year, month, day, status: next });
    } catch (e: any) {
      // revert on failure
      setRows((rs) => rs.map((r) => (r.userId === row.userId ? { ...r, days: prevDays } : r)));
      setMessage(e?.response?.data?.message || `Failed to save ${row.name}`);
    }
  };

  const cellLabel = (status: AttendanceStatus | undefined) =>
    status === "PRESENT" ? "P" : status === "ABSENT" ? "A" : "·";
  const cellClass = (status: AttendanceStatus | undefined) =>
    status === "PRESENT"
      ? "text-green-400 hover:bg-green-500/10"
      : status === "ABSENT"
      ? "text-red-400 hover:bg-red-500/10"
      : "text-gray-700 hover:bg-white/5";

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-full">
        <h1 className="text-2xl font-bold mb-2">Attendance</h1>
        <p className="text-gray-400 mb-4">Click a cell to cycle Present → Absent → clear. Changes save automatically.</p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-28" />
        </div>

        {message && <p className="mb-3 text-sm text-amber-400">{message}</p>}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={18} /> Loading…</div>
        ) : rows.length === 0 ? (
          <p className="text-gray-500">No students found for this dojo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse">
              <thead className="text-gray-400">
                <tr>
                  <th className="sticky left-0 bg-black py-2 pr-3 text-left">Student</th>
                  {dayList.map((d) => <th key={d} className="px-1 py-2 w-7 text-center font-medium">{d}</th>)}
                  <th className="px-2 py-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.userId} className="border-t border-gray-800">
                    <td className="sticky left-0 bg-black py-2 pr-3 whitespace-nowrap">
                      <div>{r.name}</div>
                      <div className="text-xs text-gray-500">{r.membershipNumber || ""}</div>
                    </td>
                    {dayList.map((d) => {
                      const status = r.days[String(d)];
                      return (
                        <td key={d} className="p-0 text-center border border-gray-900">
                          <button
                            onClick={() => toggleCell(r, d)}
                            className={`w-7 h-8 font-bold ${cellClass(status)}`}
                            title={`Day ${d}`}
                          >
                            {cellLabel(status)}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center font-semibold">{countPresent(r.days)}</td>
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

- [ ] **Step 3: Manually verify (needs running servers)**

Log in as an instructor, go to `/dashboard/attendance`. Expected: the month grid loads; clicking a cell cycles P → A → blank and persists across a reload; the Total column reflects PRESENT counts.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/dashboard/attendance/page.tsx
git commit -m "feat(attendance): month-grid page with optimistic per-cell save"
```

---

### Task 6: Instructor dashboard — two Quick-Action cards

**Files:**
- Modify: `frontend/src/components/dashboard/InstructorDashboard.tsx`

**Interfaces:**
- Consumes: routes `/dashboard/attendance` and `/dashboard/fees`. Uses `ClipboardCheck` (attendance) and `Calendar` (fees) icons — both already imported in this file, plus `ArrowRight` and `Link` (already imported).

- [ ] **Step 1: Replace the single Attendance & Fees card with two cards**

In `frontend/src/components/dashboard/InstructorDashboard.tsx`, find the existing Quick-Action link (the single card pointing to `/dashboard/fees`):
```tsx
                            <Link href="/dashboard/fees" className="block rounded-lg border border-gray-800 bg-gray-900 p-4 hover:border-red-600">
                                <div className="font-semibold">Attendance &amp; Fees</div>
                                <div className="text-sm text-gray-400">Mark monthly attendance and fee collection</div>
                            </Link>
```
Replace it with two cards styled like the sibling Quick-Action buttons:
```tsx
                            <Link
                                href="/dashboard/attendance"
                                className="group p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-red-500/[0.05] hover:border-red-500/20 transition-all text-left block"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                        <ClipboardCheck className="w-5 h-5 text-red-400" />
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-700 ml-auto group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1">Attendance</h3>
                                <p className="text-xs text-gray-500">Mark daily present/absent</p>
                            </Link>

                            <Link
                                href="/dashboard/fees"
                                className="group p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-green-500/[0.05] hover:border-green-500/20 transition-all text-left block"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                                        <Calendar className="w-5 h-5 text-green-400" />
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-700 ml-auto group-hover:text-green-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1">Fees</h3>
                                <p className="text-xs text-gray-500">Mark monthly fee collection</p>
                            </Link>
```

- [ ] **Step 2: Verify it compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors (`ClipboardCheck`, `Calendar`, `ArrowRight`, `Link` are all already imported in this file).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/InstructorDashboard.tsx
git commit -m "feat(dashboard): split into Attendance and Fees quick-action cards"
```

---

## Final verification

- [ ] `cd backend && npm test` — existing fee utils still pass (17 tests).
- [ ] `cd frontend && npm test` — all suites pass including the new `attendanceGrid` tests.
- [ ] `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit` — no errors.
- [ ] Smoke test as an instructor: dashboard shows two cards; `/dashboard/attendance` marks per-day P/A with auto-save and a live Total; `/dashboard/fees` shows fees only (no Classes column) and still saves fees + sends reminders.

## Notes
- `AttendanceRecord` replaces `MonthlyAttendance`; `prisma db push --accept-data-loss` drops the old table (test data only). On deploy, the build's `prisma db push` applies the same change. No other model or fee logic changes.
- No backend automated tests exist for controllers (pre-existing condition); the attendance controller is verified by tsc + manual curl. The branchy UI logic is unit-tested in `attendanceGrid.ts`.
