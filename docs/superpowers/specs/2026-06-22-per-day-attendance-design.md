# Per-Day Attendance (Month Grid) — Design

**Date:** 2026-06-22
**Status:** Approved (pending implementation plan)
**Supersedes:** the attendance half of `2026-06-22-attendance-and-monthly-fees-design.md` (monthly `classesAttended` count). Fees are unchanged.

## Summary

Replace the monthly "classes attended" count with **per-day Present/Absent
attendance**, marked through a month grid (rows = students, columns = days).
Attendance moves to its own page; the fees page keeps only fee columns. All
fee logic, reminders, the scheduler, the dojo fee-settings panel, and the
student "My Fees" page are unchanged.

## Confirmed decisions

| Decision | Choice |
| --- | --- |
| Marking UI | Month grid (students × days), click a cell to set status |
| Statuses | PRESENT / ABSENT only (no row = unmarked) |
| Page layout | Two separate pages: daily Attendance + monthly Fees |
| Cell click behavior | Cycle: empty → PRESENT → ABSENT → empty |
| Save model | Auto-save per cell (optimistic; revert on error) |
| Monthly total | Derived count of PRESENT rows for the month |

## Data model (Prisma)

**Remove** `MonthlyAttendance` and its back-relations on `User`/`Dojo`. It is
brand-new with only test data, so dropping it via `prisma db push`
(`--accept-data-loss` on that table) is safe.

**Add:**
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
  date      DateTime         // stored at UTC midnight for the calendar day
  status    AttendanceStatus
  markedBy  String           // instructor user id
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  @@unique([userId, date])
  @@index([dojoId, date])
}
```
Add back-relations `attendanceRecords AttendanceRecord[]` on `User` and `Dojo`.

Date convention: a day is `new Date(Date.UTC(year, month - 1, day))`. All
reads/writes use UTC-midnight dates so the same calendar day is keyed
identically regardless of server timezone.

## Backend (attendance only — fee endpoints untouched)

Rework `attendanceController.ts` + `attendanceRoutes.ts`:

- `GET /api/attendance/dojo/:dojoId?month&year` → `{ status, data: { roster: Array<{ student: {id,name,membershipNumber,currentBeltRank}, days: Record<string, "PRESENT"|"ABSENT">, presentCount: number }> } }`.
  Builds `days` keyed by day-of-month from the `AttendanceRecord` rows whose
  `date` falls in that month. Same scoping as before: non-ADMIN filtered by
  `primaryInstructorId`.
- `POST /api/attendance/mark` → body `{ userId, dojoId, year, month, day, status }`.
  `status` is `"PRESENT"`, `"ABSENT"`, or `null`/`"CLEAR"` to clear. Computes
  the UTC-midnight `date`. On clear → `deleteMany({ userId, date })`. Otherwise
  `upsert` on `userId_date`. Authorization: non-ADMIN must own the student
  (`primaryInstructorId`) AND `student.dojoId === dojoId`; validate
  `month` 1–12 and `day` within the month.
- `GET /api/attendance/me` → returns the caller's own `AttendanceRecord` rows
  (most recent first). Kept consistent; no student page consumes it yet.

## Frontend (Next.js)

### New page `/dashboard/attendance` (instructor/admin)
- `"use client"`, gated to INSTRUCTOR/ADMIN (others → `/dashboard`,
  unauthenticated → `/login`). `dojoId` from `user.dojoId`.
- Month/year selector. Grid: first column = student name + membership number;
  one column per day `1..daysInMonth(year, month)`; final **Total** column =
  PRESENT count (from local state).
- Each cell shows P (green) / A (red) / · (dim) for unmarked. Clicking cycles
  empty → PRESENT → ABSENT → empty, optimistically updates local state, and
  fires `POST /attendance/mark`. On failure: revert the cell and show a message.
- Horizontal scroll for wide months.

### `/dashboard/fees` (existing — trim)
- Remove the "Classes" column and all attendance fetch/save from this page.
  It keeps the fee status / amount paid / method / Save and "Send reminders"
  plus the dojo fee-settings panel.

### Instructor dashboard
- Replace the single "Attendance & Fees" Quick-Action card with **two** cards —
  "Attendance" (→ `/dashboard/attendance`) and "Fees" (→ `/dashboard/fees`) —
  both styled to match the sibling Quick-Action cards (icon tile + arrow + same
  typography). This supersedes the uncommitted single-card styling tweak.

## Testable pure logic

Small pure helpers with Vitest tests (frontend `src/lib/attendanceGrid.ts`):
- `nextStatus(current: "PRESENT" | "ABSENT" | null)` → the
  empty→PRESENT→ABSENT→empty cycle.
- `daysInMonth(year: number, month: number)` → number of days (month 1–12).
- `countPresent(days: Record<string, string>)` → PRESENT total.

## Error handling
- Backend validates `month` 1–12, `day` within the month, `status` ∈
  {PRESENT, ABSENT, null/CLEAR}; own-student + dojo-match authorization;
  idempotent upsert/delete on `(userId, date)`.
- Frontend optimistic updates revert on a failed save with a visible message.

## Out of scope / unchanged
Fee ledger, fee reminders (email + in-app), scheduler, cron endpoint, dojo
fee-settings, student "My Fees" page, and all fee domain utilities.
