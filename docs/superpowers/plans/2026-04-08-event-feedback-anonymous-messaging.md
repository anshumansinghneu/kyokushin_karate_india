# Event Feedback & Anonymous Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add event feedback (text-only, admin-approved) and anonymous messaging to admin (sender tracked in DB but never exposed via API).

**Architecture:** Two independent features sharing no state. Each gets its own Prisma model, backend controller/routes, and frontend component. Event feedback integrates into the existing event detail page. Anonymous messaging adds a send modal in user dashboards and an inbox tab in admin dashboard.

**Tech Stack:** Prisma (PostgreSQL), Express.js, Next.js 16, React 19, Tailwind CSS, Framer Motion, Axios, Lucide icons.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `backend/src/controllers/eventFeedbackController.ts` | CRUD + approval for event feedback |
| `backend/src/routes/eventFeedbackRoutes.ts` | Route definitions for feedback endpoints |
| `backend/src/controllers/anonymousMessageController.ts` | Send + admin inbox for anonymous messages |
| `backend/src/routes/anonymousMessageRoutes.ts` | Route definitions for anonymous message endpoints |
| `frontend/src/components/dashboard/EventReviewManager.tsx` | Admin tab: approve/reject feedback |
| `frontend/src/components/dashboard/AnonymousMessageManager.tsx` | Admin tab: read anonymous messages |
| `frontend/src/components/AnonymousFeedbackModal.tsx` | Shared modal for sending anonymous messages |

### Modified Files
| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add `EventFeedback`, `AnonymousMessage` models + `FeedbackStatus` enum |
| `backend/src/app.ts` | Register 2 new routers |
| `frontend/src/app/events/[id]/page.tsx` | Add feedback section below schedule for completed events |
| `frontend/src/components/dashboard/AdminDashboard.tsx` | Add 2 new lazy tabs + sidebar items |
| `frontend/src/components/dashboard/StudentDashboard.tsx` | Add anonymous feedback quick link |
| `frontend/src/components/dashboard/InstructorDashboard.tsx` | Add anonymous feedback menu item |

---

## Task 1: Database Schema — Add Models & Enum

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add FeedbackStatus enum after NotificationType enum (after line 94)**

In `backend/prisma/schema.prisma`, add after the closing `}` of `NotificationType` (line 94):

```prisma
enum FeedbackStatus {
  PENDING
  APPROVED
  REJECTED
}
```

- [ ] **Step 2: Add EventFeedback model at end of file (after line 793)**

```prisma
model EventFeedback {
  id        String         @id @default(uuid())
  eventId   String
  event     Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId    String
  user      User           @relation("FeedbackAuthor", fields: [userId], references: [id], onDelete: Cascade)
  feedback  String         @db.Text
  status    FeedbackStatus @default(PENDING)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@unique([eventId, userId])
  @@index([eventId, status])
}

model AnonymousMessage {
  id         String   @id @default(uuid())
  senderId   String
  sender     User     @relation("AnonymousMessageSender", fields: [senderId], references: [id], onDelete: Cascade)
  message    String   @db.Text
  isRead     Boolean  @default(false)
  isArchived Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([isRead, isArchived])
  @@index([senderId, createdAt])
}
```

- [ ] **Step 3: Add relations to Event model (after line 280)**

In the `Event` model, after the `notifications` relation line, add:

```prisma
  feedbacks             EventFeedback[]
```

- [ ] **Step 4: Add relations to User model (after line 190, before `createdAt`)**

In the `User` model, after `passwordResetTokens` line, add:

```prisma
  eventFeedbacks        EventFeedback[]  @relation("FeedbackAuthor")
  anonymousMessages     AnonymousMessage[] @relation("AnonymousMessageSender")
```

- [ ] **Step 5: Run migration**

```bash
cd /Users/anshumansingh/kyokushin_karate/backend
npx prisma migrate dev --name add-event-feedback-and-anonymous-messages
```

Expected: Migration created and applied successfully. Prisma Client regenerated.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/
git commit -m "feat: add EventFeedback and AnonymousMessage schema models"
```

---

## Task 2: Backend — Event Feedback Controller & Routes

**Files:**
- Create: `backend/src/controllers/eventFeedbackController.ts`
- Create: `backend/src/routes/eventFeedbackRoutes.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Create the feedback controller**

Create `backend/src/controllers/eventFeedbackController.ts`:

```typescript
import { Request, Response } from 'express';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errorHandler';

// POST /api/events/:eventId/feedback — Submit feedback (registered participants only, completed events only)
export const submitFeedback = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = (req as any).user.id;
    const { feedback } = req.body;

    if (!feedback || feedback.trim().length < 10) {
        throw new AppError('Feedback must be at least 10 characters', 400);
    }
    if (feedback.trim().length > 2000) {
        throw new AppError('Feedback must be under 2000 characters', 400);
    }

    // Check event exists and is completed
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.status !== 'COMPLETED') {
        throw new AppError('Feedback can only be submitted for completed events', 400);
    }

    // Check user is registered for this event
    const registration = await prisma.eventRegistration.findFirst({
        where: { eventId, userId },
    });
    if (!registration) {
        throw new AppError('You must be registered for this event to submit feedback', 403);
    }

    const entry = await prisma.eventFeedback.create({
        data: {
            eventId,
            userId,
            feedback: feedback.trim(),
        },
        include: {
            user: { select: { id: true, name: true, belt: true } },
        },
    });

    res.status(201).json({ status: 'success', data: { feedback: entry } });
});

// GET /api/events/:eventId/feedback — Public: get approved feedback
export const getApprovedFeedback = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
        prisma.eventFeedback.findMany({
            where: { eventId, status: 'APPROVED' },
            include: {
                user: { select: { id: true, name: true, belt: true, profileImageUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        }),
        prisma.eventFeedback.count({ where: { eventId, status: 'APPROVED' } }),
    ]);

    res.status(200).json({
        status: 'success',
        data: { feedbacks: items, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
});

// GET /api/events/:eventId/feedback/mine — Get current user's feedback for an event
export const getMyFeedback = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = (req as any).user.id;

    const entry = await prisma.eventFeedback.findUnique({
        where: { eventId_userId: { eventId, userId } },
    });

    res.status(200).json({ status: 'success', data: { feedback: entry } });
});

// PUT /api/events/:eventId/feedback — Edit own feedback (resets to PENDING)
export const editFeedback = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = (req as any).user.id;
    const { feedback } = req.body;

    if (!feedback || feedback.trim().length < 10) {
        throw new AppError('Feedback must be at least 10 characters', 400);
    }
    if (feedback.trim().length > 2000) {
        throw new AppError('Feedback must be under 2000 characters', 400);
    }

    const existing = await prisma.eventFeedback.findUnique({
        where: { eventId_userId: { eventId, userId } },
    });
    if (!existing) throw new AppError('No feedback found to edit', 404);

    const updated = await prisma.eventFeedback.update({
        where: { eventId_userId: { eventId, userId } },
        data: { feedback: feedback.trim(), status: 'PENDING' },
    });

    res.status(200).json({ status: 'success', data: { feedback: updated } });
});

// GET /api/feedback/pending — Admin: get all pending feedback
export const getPendingFeedback = catchAsync(async (req: Request, res: Response) => {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
        prisma.eventFeedback.findMany({
            where: { status: 'PENDING' },
            include: {
                user: { select: { id: true, name: true, belt: true } },
                event: { select: { id: true, name: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        }),
        prisma.eventFeedback.count({ where: { status: 'PENDING' } }),
    ]);

    res.status(200).json({
        status: 'success',
        data: { feedbacks: items, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
});

// GET /api/feedback/all — Admin: get all feedback with filters
export const getAllFeedback = catchAsync(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', status } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status as string)) {
        where.status = status;
    }

    const [items, total] = await Promise.all([
        prisma.eventFeedback.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, belt: true } },
                event: { select: { id: true, name: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        }),
        prisma.eventFeedback.count({ where }),
    ]);

    res.status(200).json({
        status: 'success',
        data: { feedbacks: items, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
});

// PATCH /api/feedback/:id/approve — Admin: approve feedback
export const approveFeedback = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const entry = await prisma.eventFeedback.update({
        where: { id },
        data: { status: 'APPROVED' },
    });

    res.status(200).json({ status: 'success', data: { feedback: entry } });
});

// PATCH /api/feedback/:id/reject — Admin: reject feedback
export const rejectFeedback = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const entry = await prisma.eventFeedback.update({
        where: { id },
        data: { status: 'REJECTED' },
    });

    res.status(200).json({ status: 'success', data: { feedback: entry } });
});
```

- [ ] **Step 2: Create the feedback routes**

Create `backend/src/routes/eventFeedbackRoutes.ts`:

```typescript
import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import {
    submitFeedback,
    getApprovedFeedback,
    getMyFeedback,
    editFeedback,
    getPendingFeedback,
    getAllFeedback,
    approveFeedback,
    rejectFeedback,
} from '../controllers/eventFeedbackController';

const router = Router();

// Admin routes (must be before :eventId params to avoid conflicts)
router.get('/pending', protect, restrictTo('ADMIN'), getPendingFeedback);
router.get('/all', protect, restrictTo('ADMIN'), getAllFeedback);
router.patch('/:id/approve', protect, restrictTo('ADMIN'), approveFeedback);
router.patch('/:id/reject', protect, restrictTo('ADMIN'), rejectFeedback);

// Event-specific routes
router.get('/:eventId', getApprovedFeedback);
router.get('/:eventId/mine', protect, getMyFeedback);
router.post('/:eventId', protect, submitFeedback);
router.put('/:eventId', protect, editFeedback);

export default router;
```

- [ ] **Step 3: Register routes in app.ts**

In `backend/src/app.ts`, add import after line 30 (after `analyticsRouter`):

```typescript
import feedbackRouter from './routes/eventFeedbackRoutes';
```

Add route registration after line 132 (after analytics):

```typescript
app.use('/api/feedback', feedbackRouter);
```

- [ ] **Step 4: Verify backend compiles**

```bash
cd /Users/anshumansingh/kyokushin_karate/backend
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/eventFeedbackController.ts backend/src/routes/eventFeedbackRoutes.ts backend/src/app.ts
git commit -m "feat: add event feedback API with approval workflow"
```

---

## Task 3: Backend — Anonymous Message Controller & Routes

**Files:**
- Create: `backend/src/controllers/anonymousMessageController.ts`
- Create: `backend/src/routes/anonymousMessageRoutes.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Create the anonymous message controller**

Create `backend/src/controllers/anonymousMessageController.ts`:

```typescript
import { Request, Response } from 'express';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errorHandler';

// POST /api/anonymous-messages — Send anonymous message (authenticated users)
export const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const senderId = (req as any).user.id;
    const { message } = req.body;

    if (!message || message.trim().length < 10) {
        throw new AppError('Message must be at least 10 characters', 400);
    }
    if (message.trim().length > 2000) {
        throw new AppError('Message must be under 2000 characters', 400);
    }

    // Rate limit: max 3 messages per user per 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.anonymousMessage.count({
        where: { senderId, createdAt: { gte: oneDayAgo } },
    });
    if (recentCount >= 3) {
        throw new AppError('You can only send 3 anonymous messages per day', 429);
    }

    await prisma.anonymousMessage.create({
        data: { senderId, message: message.trim() },
    });

    // Return success with no identifying info
    res.status(201).json({ status: 'success', message: 'Message sent anonymously' });
});

// GET /api/anonymous-messages — Admin: list messages (NEVER includes senderId)
export const getMessages = catchAsync(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', filter = 'all' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (filter === 'unread') where.isRead = false;
    if (filter === 'archived') where.isArchived = true;
    if (filter === 'all') where.isArchived = false;

    const [items, total, unreadCount] = await Promise.all([
        prisma.anonymousMessage.findMany({
            where,
            select: {
                id: true,
                message: true,
                isRead: true,
                isArchived: true,
                createdAt: true,
                // CRITICAL: senderId is NEVER selected
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        }),
        prisma.anonymousMessage.count({ where }),
        prisma.anonymousMessage.count({ where: { isRead: false, isArchived: false } }),
    ]);

    res.status(200).json({
        status: 'success',
        data: { messages: items, total, unreadCount, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
});

// GET /api/anonymous-messages/stats — Admin: unread count for badge
export const getStats = catchAsync(async (req: Request, res: Response) => {
    const unreadCount = await prisma.anonymousMessage.count({
        where: { isRead: false, isArchived: false },
    });

    res.status(200).json({ status: 'success', data: { unreadCount } });
});

// PATCH /api/anonymous-messages/:id/read — Admin: mark as read
export const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.anonymousMessage.update({
        where: { id },
        data: { isRead: true },
    });

    res.status(200).json({ status: 'success' });
});

// PATCH /api/anonymous-messages/:id/archive — Admin: archive message
export const archiveMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.anonymousMessage.update({
        where: { id },
        data: { isArchived: true, isRead: true },
    });

    res.status(200).json({ status: 'success' });
});
```

- [ ] **Step 2: Create the anonymous message routes**

Create `backend/src/routes/anonymousMessageRoutes.ts`:

```typescript
import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import {
    sendMessage,
    getMessages,
    getStats,
    markAsRead,
    archiveMessage,
} from '../controllers/anonymousMessageController';

const router = Router();

// Authenticated: send message
router.post('/', protect, sendMessage);

// Admin only: inbox
router.get('/', protect, restrictTo('ADMIN'), getMessages);
router.get('/stats', protect, restrictTo('ADMIN'), getStats);
router.patch('/:id/read', protect, restrictTo('ADMIN'), markAsRead);
router.patch('/:id/archive', protect, restrictTo('ADMIN'), archiveMessage);

export default router;
```

- [ ] **Step 3: Register routes in app.ts**

In `backend/src/app.ts`, add import after the feedbackRouter import:

```typescript
import anonymousMessageRouter from './routes/anonymousMessageRoutes';
```

Add route registration after the feedback route:

```typescript
app.use('/api/anonymous-messages', anonymousMessageRouter);
```

- [ ] **Step 4: Verify backend compiles**

```bash
cd /Users/anshumansingh/kyokushin_karate/backend
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/anonymousMessageController.ts backend/src/routes/anonymousMessageRoutes.ts backend/src/app.ts
git commit -m "feat: add anonymous messaging API with rate limiting"
```

---

## Task 4: Frontend — Event Feedback Section on Event Detail Page

**Files:**
- Modify: `frontend/src/app/events/[id]/page.tsx`

- [ ] **Step 1: Add feedback state variables**

In `frontend/src/app/events/[id]/page.tsx`, add these state variables after line 20 (after the existing useState declarations):

```typescript
const [feedbacks, setFeedbacks] = useState<any[]>([]);
const [myFeedback, setMyFeedback] = useState<any>(null);
const [feedbackText, setFeedbackText] = useState('');
const [showFeedbackForm, setShowFeedbackForm] = useState(false);
const [submittingFeedback, setSubmittingFeedback] = useState(false);
const [isEditingFeedback, setIsEditingFeedback] = useState(false);
```

- [ ] **Step 2: Add feedback data fetching**

Add a new useEffect after the existing event-fetching useEffect. Place it after the closing `});` of the first useEffect:

```typescript
// Fetch feedback for completed events
useEffect(() => {
    if (!event || event.status !== 'COMPLETED') return;

    const fetchFeedback = async () => {
        try {
            const res = await api.get(`/feedback/${event.id}`);
            setFeedbacks(res.data.data.feedbacks || []);
        } catch { }

        if (user) {
            try {
                const res = await api.get(`/feedback/${event.id}/mine`);
                if (res.data.data.feedback) {
                    setMyFeedback(res.data.data.feedback);
                }
            } catch { }
        }
    };

    fetchFeedback();
}, [event?.id, event?.status, user]);
```

- [ ] **Step 3: Add feedback submit/edit handler**

Add this function after the useEffect from Step 2:

```typescript
const handleFeedbackSubmit = async () => {
    if (feedbackText.trim().length < 10) {
        showToast('Feedback must be at least 10 characters', 'error');
        return;
    }
    setSubmittingFeedback(true);
    try {
        if (isEditingFeedback) {
            await api.put(`/feedback/${event.id}`, { feedback: feedbackText });
            showToast('Feedback updated! It will be reviewed again.', 'success');
        } else {
            await api.post(`/feedback/${event.id}`, { feedback: feedbackText });
            showToast('Feedback submitted! It will appear after admin approval.', 'success');
        }
        // Refresh
        const res = await api.get(`/feedback/${event.id}/mine`);
        setMyFeedback(res.data.data.feedback);
        setShowFeedbackForm(false);
        setIsEditingFeedback(false);
        setFeedbackText('');
    } catch (err: any) {
        showToast(err?.response?.data?.message || 'Failed to submit feedback', 'error');
    } finally {
        setSubmittingFeedback(false);
    }
};
```

- [ ] **Step 4: Add feedback section JSX**

In the event detail page, insert this JSX after the Event Schedule `</motion.section>` closing tag (after line 241) and before the closing `</div>` of the left column (line 242):

```tsx
{/* Feedback Section — only for completed events */}
{event.status === 'COMPLETED' && (
    <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
    >
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-primary rounded-full" />
            Feedback
        </h2>

        {/* My feedback status */}
        {user && myFeedback && !showFeedbackForm && (
            <div className="glass-card p-4 mb-6 border-l-4 border-yellow-500/50">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Your feedback</p>
                        <p className="text-white">{myFeedback.feedback}</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                            myFeedback.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                            myFeedback.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                        }`}>
                            {myFeedback.status === 'PENDING' ? 'Awaiting Approval' : myFeedback.status}
                        </span>
                    </div>
                    <button
                        onClick={() => { setFeedbackText(myFeedback.feedback); setIsEditingFeedback(true); setShowFeedbackForm(true); }}
                        className="text-xs text-gray-500 hover:text-white transition-colors"
                    >
                        Edit
                    </button>
                </div>
            </div>
        )}

        {/* Submit/Edit form */}
        {user && showFeedbackForm && (
            <div className="glass-card p-4 mb-6">
                <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your experience... (min 10 characters)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none resize-none"
                    rows={4}
                    maxLength={2000}
                />
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">{feedbackText.length}/2000</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setShowFeedbackForm(false); setIsEditingFeedback(false); setFeedbackText(''); }}
                            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleFeedbackSubmit}
                            disabled={submittingFeedback || feedbackText.trim().length < 10}
                            className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submittingFeedback ? 'Submitting...' : isEditingFeedback ? 'Update' : 'Submit'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Write feedback button */}
        {user && !myFeedback && !showFeedbackForm && (
            <button
                onClick={() => setShowFeedbackForm(true)}
                className="glass-card p-4 mb-6 w-full text-left hover:bg-white/5 transition-colors border border-dashed border-white/10 rounded-xl"
            >
                <p className="text-gray-400 text-sm">Participated in this event? Share your feedback!</p>
            </button>
        )}

        {/* Approved feedback list */}
        {feedbacks.length > 0 ? (
            <div className="space-y-4">
                {feedbacks.map((fb: any) => (
                    <div key={fb.id} className="glass-card p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {fb.user?.name?.[0] || '?'}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{fb.user?.name}</p>
                                <p className="text-xs text-gray-500">{fb.user?.belt?.replace('_', ' ')} • {new Date(fb.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p className="text-gray-300 text-sm">{fb.feedback}</p>
                    </div>
                ))}
            </div>
        ) : (
            !showFeedbackForm && (
                <p className="text-gray-600 text-sm">No feedback yet. Be the first to share your experience!</p>
            )
        )}
    </motion.section>
)}
```

- [ ] **Step 5: Add MessageSquare icon to imports**

At line 5, update the Lucide imports to include `MessageSquare`:

Add `MessageSquare` to the import from `lucide-react` (for potential use — though the current design uses text, keep the import for the section header if desired later).

Actually, the current design doesn't need a new icon. Skip this step.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/events/\\[id\\]/page.tsx
git commit -m "feat: add feedback section to event detail page for completed events"
```

---

## Task 5: Frontend — Event Review Manager (Admin Tab)

**Files:**
- Create: `frontend/src/components/dashboard/EventReviewManager.tsx`

- [ ] **Step 1: Create the EventReviewManager component**

Create `frontend/src/components/dashboard/EventReviewManager.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, X, MessageSquare, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export default function EventReviewManager() {
    const { showToast } = useToast();
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [loading, setLoading] = useState(true);

    const fetchFeedbacks = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (statusFilter) params.set('status', statusFilter);
            const res = await api.get(`/feedback/all?${params}`);
            setFeedbacks(res.data.data.feedbacks || []);
            setTotal(res.data.data.total || 0);
            setTotalPages(res.data.data.totalPages || 1);
        } catch {
            showToast("Failed to load feedback", "error");
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            await api.patch(`/feedback/${id}/${action}`);
            showToast(`Feedback ${action}d`, "success");
            fetchFeedbacks();
        } catch {
            showToast(`Failed to ${action} feedback`, "error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Event Reviews</h2>
                    <p className="text-sm text-gray-500">{total} total feedback entries</p>
                </div>
                <div className="flex gap-2">
                    {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                statusFilter === s
                                    ? 'bg-primary text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : feedbacks.length === 0 ? (
                <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No {statusFilter.toLowerCase()} feedback</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {feedbacks.map((fb: any) => (
                        <motion.div
                            key={fb.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-white">{fb.user?.name}</span>
                                        <span className="text-xs text-gray-600">•</span>
                                        <span className="text-xs text-gray-500">{fb.user?.belt?.replace('_', ' ')}</span>
                                    </div>
                                    <p className="text-xs text-primary mb-2">{fb.event?.name}</p>
                                    <p className="text-sm text-gray-300">{fb.feedback}</p>
                                    <p className="text-xs text-gray-600 mt-2">{new Date(fb.createdAt).toLocaleDateString()}</p>
                                </div>
                                {statusFilter === 'PENDING' && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleAction(fb.id, 'approve')}
                                            className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                            title="Approve"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(fb.id, 'reject')}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                            title="Reject"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/dashboard/EventReviewManager.tsx
git commit -m "feat: add EventReviewManager admin component"
```

---

## Task 6: Frontend — Anonymous Message Manager (Admin Tab)

**Files:**
- Create: `frontend/src/components/dashboard/AnonymousMessageManager.tsx`

- [ ] **Step 1: Create the AnonymousMessageManager component**

Create `frontend/src/components/dashboard/AnonymousMessageManager.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, MailOpen, Archive, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

export default function AnonymousMessageManager() {
    const { showToast } = useToast();
    const [messages, setMessages] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20', filter });
            const res = await api.get(`/anonymous-messages?${params}`);
            setMessages(res.data.data.messages || []);
            setTotal(res.data.data.total || 0);
            setUnreadCount(res.data.data.unreadCount || 0);
            setTotalPages(res.data.data.totalPages || 1);
        } catch {
            showToast("Failed to load messages", "error");
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => { fetchMessages(); }, [fetchMessages]);

    const handleMarkRead = async (id: string) => {
        try {
            await api.patch(`/anonymous-messages/${id}/read`);
            fetchMessages();
        } catch {
            showToast("Failed to mark as read", "error");
        }
    };

    const handleArchive = async (id: string) => {
        try {
            await api.patch(`/anonymous-messages/${id}/archive`);
            showToast("Message archived", "success");
            fetchMessages();
        } catch {
            showToast("Failed to archive", "error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Anonymous Messages</h2>
                    <p className="text-sm text-gray-500">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'No unread messages'} • {total} total
                    </p>
                </div>
                <div className="flex gap-2">
                    {[
                        { key: 'all', label: 'Inbox' },
                        { key: 'unread', label: 'Unread' },
                        { key: 'archived', label: 'Archived' },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => { setFilter(f.key); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filter === f.key
                                    ? 'bg-primary text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No {filter === 'unread' ? 'unread ' : filter === 'archived' ? 'archived ' : ''}messages</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {messages.map((msg: any) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`border rounded-xl p-4 transition-colors ${
                                msg.isRead
                                    ? 'bg-white/[0.02] border-white/[0.06]'
                                    : 'bg-white/[0.05] border-primary/20'
                            }`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        {msg.isRead ? (
                                            <MailOpen className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                        ) : (
                                            <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                                        )}
                                        <span className="text-xs text-gray-500">
                                            {new Date(msg.createdAt).toLocaleDateString()} at{' '}
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {!msg.isRead && (
                                            <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px] font-bold">NEW</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    {!msg.isRead && (
                                        <button
                                            onClick={() => handleMarkRead(msg.id)}
                                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                            title="Mark as read"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    )}
                                    {!msg.isArchived && (
                                        <button
                                            onClick={() => handleArchive(msg.id)}
                                            className="p-2 rounded-lg bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 transition-colors"
                                            title="Archive"
                                        >
                                            <Archive className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/dashboard/AnonymousMessageManager.tsx
git commit -m "feat: add AnonymousMessageManager admin component"
```

---

## Task 7: Frontend — Anonymous Feedback Send Modal

**Files:**
- Create: `frontend/src/components/AnonymousFeedbackModal.tsx`

- [ ] **Step 1: Create the modal component**

Create `frontend/src/components/AnonymousFeedbackModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function AnonymousFeedbackModal({ isOpen, onClose }: Props) {
    const { showToast } = useToast();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (message.trim().length < 10) {
            showToast('Message must be at least 10 characters', 'error');
            return;
        }
        setSending(true);
        try {
            await api.post('/anonymous-messages', { message: message.trim() });
            showToast('Message sent anonymously', 'success');
            setMessage('');
            onClose();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Anonymous Feedback</h3>
                            <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                            <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-green-400/80">
                                Your identity will not be visible to anyone. Share honest feedback, suggestions, or concerns.
                            </p>
                        </div>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write your message..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:border-primary focus:outline-none resize-none text-sm"
                            rows={5}
                            maxLength={2000}
                        />
                        <div className="flex justify-between items-center mt-2 mb-4">
                            <span className="text-xs text-gray-600">{message.length}/2000</span>
                            <span className="text-xs text-gray-600">Min 10 characters</span>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={sending || message.trim().length < 10}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {sending ? 'Sending...' : 'Send Anonymously'}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AnonymousFeedbackModal.tsx
git commit -m "feat: add AnonymousFeedbackModal component"
```

---

## Task 8: Frontend — Wire Up Admin Dashboard Tabs

**Files:**
- Modify: `frontend/src/components/dashboard/AdminDashboard.tsx`

- [ ] **Step 1: Add lazy imports (after line 36)**

After the `AlbumManager` lazy import (line 36), add:

```typescript
const EventReviewManager = lazy(() => import('./EventReviewManager'));
const AnonymousMessageManager = lazy(() => import('./AnonymousMessageManager'));
```

- [ ] **Step 2: Add MessageSquare to icon imports (line 6)**

Update the Lucide import on lines 6-9 to add `MessageSquare` and `Mail`:

Add `MessageSquare` and `Mail` to the existing destructured import from `lucide-react`.

- [ ] **Step 3: Update TabId type (line 54)**

Replace the TabId type on line 54 to add `'event-reviews' | 'anonymous-messages'`:

Old:
```typescript
type TabId = 'overview' | 'dojos' | 'events' | 'seminars' | 'users' | 'blogs' | 'media' | 'recognition' | 'belt-verifications' | 'belt-promotions' | 'belt-exam-grading' | 'tournaments' | 'announcements' | 'payments' | 'live-management' | 'store' | 'vouchers' | 'analytics' | 'certificates' | 'albums';
```

New:
```typescript
type TabId = 'overview' | 'dojos' | 'events' | 'seminars' | 'users' | 'blogs' | 'media' | 'recognition' | 'belt-verifications' | 'belt-promotions' | 'belt-exam-grading' | 'tournaments' | 'announcements' | 'payments' | 'live-management' | 'store' | 'vouchers' | 'analytics' | 'certificates' | 'albums' | 'event-reviews' | 'anonymous-messages';
```

- [ ] **Step 4: Update VALID_TABS array (line 56)**

Replace the VALID_TABS on line 56 to add the new tab IDs:

Old:
```typescript
const VALID_TABS: TabId[] = ['overview', 'dojos', 'events', 'seminars', 'users', 'blogs', 'media', 'recognition', 'belt-verifications', 'belt-promotions', 'belt-exam-grading', 'tournaments', 'announcements', 'payments', 'live-management', 'store', 'vouchers', 'analytics', 'certificates', 'albums'];
```

New:
```typescript
const VALID_TABS: TabId[] = ['overview', 'dojos', 'events', 'seminars', 'users', 'blogs', 'media', 'recognition', 'belt-verifications', 'belt-promotions', 'belt-exam-grading', 'tournaments', 'announcements', 'payments', 'live-management', 'store', 'vouchers', 'analytics', 'certificates', 'albums', 'event-reviews', 'anonymous-messages'];
```

- [ ] **Step 5: Add menu items to menuSections**

In the EVENTS section (around line 152), add after `live-management`:

```typescript
{ id: 'event-reviews', label: 'Event Reviews', icon: MessageSquare },
```

In the CONTENT section (around line 162), add after `announcements`:

```typescript
{ id: 'anonymous-messages', label: 'Anonymous Messages', icon: Mail },
```

- [ ] **Step 6: Add tab renders (after line 678)**

After the `albums` tab render line, add:

```typescript
{activeTab === 'event-reviews' && <motion.div key="event-reviews" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><EventReviewManager /></Suspense></motion.div>}
{activeTab === 'anonymous-messages' && <motion.div key="anonymous-messages" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}><Suspense fallback={<TabLoader />}><AnonymousMessageManager /></Suspense></motion.div>}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/dashboard/AdminDashboard.tsx
git commit -m "feat: wire event reviews and anonymous messages into admin dashboard"
```

---

## Task 9: Frontend — Add Anonymous Feedback to Student & Instructor Dashboards

**Files:**
- Modify: `frontend/src/components/dashboard/StudentDashboard.tsx`
- Modify: `frontend/src/components/dashboard/InstructorDashboard.tsx`

- [ ] **Step 1: Add anonymous feedback link to StudentDashboard**

In `frontend/src/components/dashboard/StudentDashboard.tsx`, find the Quick Access links array (around line 236-239). Add a 4th item to the array:

After the Verify link object, add:

```typescript
{ href: '#anonymous-feedback', icon: ShieldCheck, label: 'Feedback', bg: 'bg-amber-500/10', hoverBg: 'group-hover:bg-amber-500/20', text: 'text-amber-500', border: 'hover:border-amber-500/30' },
```

Also add `ShieldCheck` to the Lucide imports at the top of the file if not already imported.

Then add modal state and the modal component. Add state after existing state declarations:

```typescript
const [showAnonFeedback, setShowAnonFeedback] = useState(false);
```

Import the modal:

```typescript
import AnonymousFeedbackModal from "@/components/AnonymousFeedbackModal";
```

Change the 4th link to use onClick instead of href. Replace the Link for the anonymous feedback item with a button:

Actually, since the Quick Access section uses `<Link>` components, it's cleaner to add the modal trigger as a separate button below the Quick Access grid. Add after the Quick Access `</div>` closing tag (around line 256):

```tsx
<button
    onClick={() => setShowAnonFeedback(true)}
    className="w-full mt-3 group relative overflow-hidden rounded-xl border border-white/[0.06] p-3 flex items-center gap-3 hover:border-amber-500/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
>
    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
        <ShieldCheck className="w-4 h-4 text-amber-500" />
    </div>
    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold group-hover:text-white transition-colors">Anonymous Feedback</p>
</button>

<AnonymousFeedbackModal isOpen={showAnonFeedback} onClose={() => setShowAnonFeedback(false)} />
```

- [ ] **Step 2: Add anonymous feedback to InstructorDashboard**

In `frontend/src/components/dashboard/InstructorDashboard.tsx`, add a new section in menuSections (after the CONTENT section, around line 149):

```typescript
{
    header: 'OTHER',
    items: [
        { id: 'anonymous-feedback', label: 'Anonymous Feedback', icon: ShieldCheck },
    ]
},
```

Add `ShieldCheck` to the Lucide imports at the top.

Add modal state:

```typescript
const [showAnonFeedback, setShowAnonFeedback] = useState(false);
```

Import the modal:

```typescript
import AnonymousFeedbackModal from "@/components/AnonymousFeedbackModal";
```

In the sidebar button click handler, add special handling for the anonymous-feedback tab. Find the onClick handler for menu items and add a condition: if `item.id === 'anonymous-feedback'`, open the modal instead of switching tabs:

In the sidebar where menu items are rendered, modify the onClick to:

```typescript
onClick={() => {
    if (item.id === 'anonymous-feedback') {
        setShowAnonFeedback(true);
        setIsSidebarOpen(false);
    } else {
        setActiveTab(item.id as any);
        setIsSidebarOpen(false);
    }
}}
```

Add the modal at the end of the component JSX (before the final closing `</div>`):

```tsx
<AnonymousFeedbackModal isOpen={showAnonFeedback} onClose={() => setShowAnonFeedback(false)} />
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/StudentDashboard.tsx frontend/src/components/dashboard/InstructorDashboard.tsx
git commit -m "feat: add anonymous feedback button to student and instructor dashboards"
```

---

## Task 10: Verify & Final Commit

- [ ] **Step 1: Run Prisma generate to ensure schema is valid**

```bash
cd /Users/anshumansingh/kyokushin_karate/backend
npx prisma generate
```

Expected: Prisma Client generated successfully.

- [ ] **Step 2: Verify backend compiles**

```bash
cd /Users/anshumansingh/kyokushin_karate/backend
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Verify frontend builds**

```bash
cd /Users/anshumansingh/kyokushin_karate/frontend
npx next build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Manual test checklist**

Start both servers and verify:

1. Visit a completed event page → feedback section appears
2. As a registered participant, submit feedback → "Awaiting Approval" badge shows
3. As admin, go to Management → Event Reviews → see pending feedback → approve it
4. Visit event page again → approved feedback visible publicly
5. As student, click "Anonymous Feedback" → modal opens → send message
6. As admin, go to Management → Anonymous Messages → message appears with no sender info
7. Mark as read, archive → both work
8. Send 3 messages rapidly → 4th is rejected with rate limit error

- [ ] **Step 5: Update feature roadmap**

In `feature_roadmap.md`, check off:
```
- [x] **Event Feedback & Reviews**
```
