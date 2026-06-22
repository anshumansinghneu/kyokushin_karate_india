# Attendance & Monthly Fees — Design

**Date:** 2026-06-22
**Status:** Approved (pending implementation plan)

## Summary

Add three connected capabilities for instructors to run their dojo's monthly
operations, built on the existing Express + Prisma + Next.js stack:

1. **Offline monthly fee ledger** — instructor marks each student Paid / Partial /
   Unpaid / Waived per month. No payment gateway; the system is a record of who
   has paid.
2. **Monthly attendance** — instructor records a simple count of classes attended
   per student per month.
3. **Automated fee reminders** — email + in-app notifications to unpaid students,
   personalized via a merge-field template, sent both on a schedule and on demand.

Student registration already exists (the approval flow) and is out of scope.
Everything is scoped to the instructor's own dojo via the existing role-based
access control.

## Confirmed decisions

| Decision | Choice |
| --- | --- |
| Fee model | Track offline collection (ledger), no gateway |
| Fee amount | Per-dojo flat monthly fee |
| Attendance granularity | Monthly summary — simple count of classes attended |
| Reminder channels | Email + in-app notification |
| Reminder content | One template per dojo with merge fields, global default fallback |
| Reminder timing | Auto on a schedule **and** manual instructor trigger |
| Attendance vs. fees storage | Two separate models (different lifecycles) |
| Fee due day | Per-dojo `feeDueDay`, default 10th of the month |
| Reminder throttle | At most once per ~5 days per student, via `lastReminderAt` |

## Data model (Prisma)

### Extend `Dojo`
- `monthlyFee Float?` — the per-dojo flat monthly fee.
- `feeDueDay Int @default(10)` — day of month fees are considered due.
- `feeReminderTemplate String?` — dojo-level reminder template; falls back to a
  global default constant when null.

### New model `MonthlyFee` (the ledger)
One row per student per month.

```prisma
model MonthlyFee {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  dojoId        String
  dojo          Dojo      @relation(fields: [dojoId], references: [id])
  month         Int       // 1-12
  year          Int
  amount        Float     // snapshot of dojo monthlyFee at time of record
  status        FeeStatus @default(UNPAID)
  amountPaid    Float     @default(0)
  paidAt        DateTime?
  method        String?   // free text, e.g. CASH / UPI
  markedBy      String    // instructor user id who recorded it
  notes         String?
  remindersSent Int       @default(0)
  lastReminderAt DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([userId, month, year])
  @@index([dojoId, year, month])
  @@index([status])
}

enum FeeStatus {
  UNPAID
  PARTIAL
  PAID
  WAIVED
}
```

### New model `MonthlyAttendance`
Kept separate from fees — different concern, may be marked at a different time.

```prisma
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

### Enum
Add `FEE_REMINDER` to the existing `NotificationType` enum.

## Backend

### Fee endpoints (`feeController.ts` / `feeRoutes.ts`)
- `GET /api/fees/dojo/:dojoId?month&year` — roster of the dojo's active students
  with their fee row for that month (synthesizing an UNPAID default for students
  with no row yet). Instructor restricted to own dojo.
- `POST /api/fees/mark` — upsert one student's fee for a month (status, amountPaid,
  method, notes). Idempotent on `(userId, month, year)`.
- `GET /api/fees/me` — student's own fee history.
- `POST /api/fees/remind` — manual trigger: send reminders to all unpaid/partial
  students in the dojo for a given month.

### Attendance endpoints (`attendanceController.ts` / `attendanceRoutes.ts`)
- `GET /api/attendance/dojo/:dojoId?month&year` — roster with attendance counts.
- `POST /api/attendance/mark` — bulk upsert of the dojo roster for a month.
- `GET /api/attendance/me` — student's own attendance history.

### Dojo settings
Extend `PATCH /api/dojos/:id` to accept `monthlyFee`, `feeDueDay`,
`feeReminderTemplate`.

### Fee reminder service (`feeReminderService.ts`)
Mirrors the existing `renewalReminderService.ts`:
- For each dojo with a `monthlyFee` set, find active (non-admin) students whose
  current-month `MonthlyFee` row is missing or has status `UNPAID` / `PARTIAL`,
  where today is on/after the dojo's `feeDueDay`.
- Render the dojo template (or global default) with merge fields, send the email
  via `emailService`, and create an in-app `Notification` (type `FEE_REMINDER`).
- Create the `MonthlyFee` row on first reminder if it didn't exist.
- Throttle: skip a student if `lastReminderAt` is within ~5 days. Increment
  `remindersSent`, update `lastReminderAt`.
- Per-student failures are logged and never abort the batch (same as renewals).

### Scheduling / wiring (`app.ts`)
Reuse the existing 24-hour scheduler and add a cron endpoint, identical to the
renewal-reminder pattern:
- `GET /api/cron/fee-reminders` — protected by `CRON_SECRET`.
- Add the service call to the existing daily timer.

### Email + template
- `emailService.ts`: add `sendFeeReminderEmail(...)`.
- Template render util: replaces merge fields `{name}`, `{amount}`, `{month}`,
  `{year}`, `{dojoName}`, `{dueDate}`. Global default template constant lives
  alongside the service.

## Frontend (Next.js)

### Instructor — "Attendance & Fees" page
- Month / year selector.
- Roster table of the dojo's students: name, belt, classes-attended (number input),
  fee status (dropdown), amount paid, method, notes, and a per-row "Send reminder".
- "Save" bulk-applies changes; "Send reminders to all unpaid" button.

### Dojo settings
- Inputs for monthly fee, fee due day, and the reminder template, with merge-field
  help text and a live preview of the rendered message.

### Student — "My Fees"
- Month-by-month list of status, amount, and paid date.
- Reminders also arrive via the existing in-app notification bell and email.

## Testing
Follows the existing Jest setup. Cover:
- Template render util (all merge fields, missing-field behavior).
- `feeReminderService` due/throttle logic with mocked Prisma and email
  (past-due selection, 5-day throttle, row creation on first reminder, batch
  resilience to a single failure).
- Fee status-transition validation (e.g. `PARTIAL` requires `amountPaid < amount`,
  `PAID` sets `amountPaid = amount` and `paidAt`).

## Error handling
- Validate `month` (1-12), sane `year`, and `amount >= 0`.
- Instructor actions restricted to their own dojo (existing RBAC guard).
- Idempotent upserts on `(userId, month, year)`.
- Reminder batch resilient to individual send failures.

## Reuse summary
- **Email:** extend `emailService`.
- **In-app:** existing `Notification` model.
- **Scheduler:** existing 24h timer + `CRON_SECRET` cron endpoint pattern.
- **RBAC:** existing instructor-owns-dojo authorization.
