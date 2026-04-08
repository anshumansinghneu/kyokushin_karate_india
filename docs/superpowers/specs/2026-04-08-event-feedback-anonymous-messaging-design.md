# Event Feedback & Anonymous Messaging — Design Spec

**Date:** 2026-04-08
**Status:** Draft

---

## Overview

Two features:

1. **Event Feedback** — Registered participants can leave written feedback on completed events. Admin approves before it appears publicly.
2. **Anonymous Messaging** — Authenticated users (students/instructors) can send anonymous messages to admin. Frontend shows no sender identity. Backend stores `senderId` in the database for abuse investigation — never exposed via any API endpoint.

---

## Feature 1: Event Feedback

### Data Model

```prisma
model EventFeedback {
  id         String         @id @default(uuid())
  eventId    String
  event      Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId     String
  user       User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  feedback   String         @db.Text
  status     FeedbackStatus @default(PENDING)
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  @@unique([eventId, userId])
  @@index([eventId, status])
}

enum FeedbackStatus {
  PENDING
  APPROVED
  REJECTED
}
```

Add to `Event` model: `feedbacks EventFeedback[]`
Add to `User` model: `eventFeedbacks EventFeedback[]`

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/events/:eventId/feedback` | Authenticated | Submit feedback (only registered participants, only COMPLETED events) |
| GET | `/api/events/:eventId/feedback` | Public | Get approved feedback for an event |
| GET | `/api/events/:eventId/feedback/mine` | Authenticated | Get current user's feedback for an event |
| PUT | `/api/events/:eventId/feedback` | Authenticated | Edit own feedback (resets status to PENDING) |
| GET | `/api/feedback/pending` | ADMIN | Get all pending feedback across events |
| PATCH | `/api/feedback/:id/approve` | ADMIN | Approve feedback |
| PATCH | `/api/feedback/:id/reject` | ADMIN | Reject feedback |

### Validation Rules

- `feedback`: required, min 10 chars, max 2000 chars
- User must have an `EventRegistration` for the event
- Event must have `status: COMPLETED`
- One feedback per user per event (enforced by unique constraint)
- Editing resets status to `PENDING` for re-approval

### Frontend: Event Detail Page

**Location:** Below "Event Schedule" section in the left column of `/events/[id]`

**When event is COMPLETED:**
- "Feedback" section appears
- Shows list of approved feedback: user name, belt rank, date, feedback text
- If user is a registered participant and hasn't submitted feedback → "Share Your Feedback" button opens inline form
- If user already submitted → shows their feedback with status badge (Pending/Approved) and "Edit" option
- Empty state: "No feedback yet. Be the first to share your experience!"

**When event is NOT completed:**
- Section hidden entirely

### Frontend: Admin Dashboard

**New tab:** "Event Reviews" in the EVENTS section of the admin sidebar

**Layout:**
- Table/card list with columns: Event Name, User Name, Feedback Text (truncated), Status, Date, Actions
- Filter by: status (Pending/Approved/Rejected), event name search
- Actions: Approve (green), Reject (red) buttons
- Pending count badge on the sidebar tab

---

## Feature 2: Anonymous Messaging

### Data Model

```prisma
model AnonymousMessage {
  id         String   @id @default(uuid())
  senderId   String
  sender     User     @relation(fields: [senderId], references: [id], onDelete: Cascade)
  message    String   @db.Text
  isRead     Boolean  @default(false)
  isArchived Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([isRead, isArchived])
}
```

Add to `User` model: `anonymousMessages AnonymousMessage[]`

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/anonymous-messages` | Authenticated | Send anonymous message |
| GET | `/api/anonymous-messages` | ADMIN | List messages (excludes `senderId` from response) |
| PATCH | `/api/anonymous-messages/:id/read` | ADMIN | Mark as read |
| PATCH | `/api/anonymous-messages/:id/archive` | ADMIN | Archive message |
| GET | `/api/anonymous-messages/stats` | ADMIN | Unread count for badge |

### Critical Privacy Rule

The `senderId` field is **never included** in any API response. The admin endpoints use a Prisma `select` that explicitly excludes `senderId`. The only way to identify a sender is a direct database query — for abuse investigation only.

### Validation Rules

- `message`: required, min 10 chars, max 2000 chars
- Sanitize with `sanitize-html` to prevent XSS
- Rate limit: max 3 messages per user per 24 hours (checked in controller via `senderId` + `createdAt`)

### Frontend: Send Message

**Location:** Link in user dashboard sidebar labeled "Anonymous Feedback"

**Modal/Page:**
- Heading: "Send Anonymous Feedback"
- Subtext: "Your identity will not be visible to anyone. Share honest feedback, suggestions, or concerns."
- Text area (placeholder: "Write your message...")
- Character count (10-2000)
- Send button
- Success toast: "Message sent anonymously"

### Frontend: Admin Dashboard

**New tab:** "Anonymous Messages" in the CONTENT section of the admin sidebar

**Layout:**
- Card list showing: message text, date, read/unread indicator
- No sender information displayed anywhere
- Actions: Mark as read, Archive
- Unread count badge on the sidebar tab
- Filter: All / Unread / Archived

---

## Files to Create/Modify

### Backend
- `prisma/schema.prisma` — Add EventFeedback, AnonymousMessage models + enums
- `src/controllers/eventFeedbackController.ts` — New controller
- `src/controllers/anonymousMessageController.ts` — New controller
- `src/routes/eventFeedbackRoutes.ts` — New routes
- `src/routes/anonymousMessageRoutes.ts` — New routes
- `src/app.ts` — Register new routes

### Frontend
- `src/app/events/[id]/page.tsx` — Add feedback section for completed events
- `src/components/dashboard/EventReviewManager.tsx` — New admin component
- `src/components/dashboard/AnonymousMessageManager.tsx` — New admin component
- `src/components/dashboard/AdminDashboard.tsx` — Add two new tabs
- `src/components/dashboard/StudentDashboard.tsx` — Add "Anonymous Feedback" link
- `src/components/dashboard/InstructorDashboard.tsx` — Add "Anonymous Feedback" link

### Database
- New Prisma migration for both models
