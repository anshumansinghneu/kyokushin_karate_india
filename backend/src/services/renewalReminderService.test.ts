import { beforeEach, describe, expect, it, vi } from 'vitest';

// An in-memory stand-in for the two tables the reminder run touches.
const db = vi.hoisted(() => ({ users: [] as any[], notifications: [] as any[] }));

vi.mock('../prisma', () => ({
    default: {
        user: { findMany: vi.fn(async () => db.users) },
        notification: {
            findFirst: vi.fn(async ({ where }: any) =>
                db.notifications.find((n) => n.userId === where.userId && n.title === where.title && n.createdAt >= where.createdAt.gte) ?? null,
            ),
            create: vi.fn(async ({ data }: any) => {
                db.notifications.push({ ...data, createdAt: new Date() });
                return data;
            }),
        },
    },
}));

const sent = vi.hoisted(() => [] as string[]);
vi.mock('./emailService', () => ({
    sendMembershipRenewalEmail: vi.fn(async (email: string) => {
        sent.push(email);
    }),
}));

import { sendRenewalReminders } from './renewalReminderService';

const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000 - 60_000);

describe('sendRenewalReminders', () => {
    beforeEach(() => {
        db.users = [
            { id: 'a', name: 'A', email: 'a@example.com', membershipEndDate: inDays(7) },
            { id: 'b', name: 'B', email: 'b@example.com', membershipEndDate: inDays(10) },
        ];
        db.notifications = [];
        sent.length = 0;
    });

    it('reminds only members on a reminder day', async () => {
        const result = await sendRenewalReminders();
        expect(sent).toEqual(['a@example.com']);
        expect(result.reminders).toBe(1);
    });

    it('does not email again when the server restarts the same day', async () => {
        await sendRenewalReminders();
        await sendRenewalReminders();
        expect(sent).toEqual(['a@example.com']);
    });
});
