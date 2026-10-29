import prisma from '../prisma';
import { sendMembershipRenewalEmail } from './emailService';

// Days before expiry to send reminders
const REMINDER_DAYS = [30, 15, 7, 3, 1, 0];

// The check runs at boot as well as daily, and Render restarts often, so each reminder
// is recorded as a notification and not sent again inside this window.
const RESEND_GUARD_MS = 20 * 60 * 60 * 1000;

export const renewalReminderTitle = (daysLeft: number) =>
    daysLeft === 0
        ? 'Your membership expires today'
        : `Your membership expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;

/**
 * Check all active members and send renewal reminders
 * for memberships expiring within the configured windows.
 *
 * Call this daily via cron or a scheduled endpoint.
 */
export async function sendRenewalReminders(): Promise<{
    checked: number;
    reminders: number;
    errors: number;
}> {
    const now = new Date();
    const result = { checked: 0, reminders: 0, errors: 0 };

    // Find all active members with an expiry date
    const members = await prisma.user.findMany({
        where: {
            membershipStatus: 'ACTIVE',
            membershipEndDate: { not: null },
            role: { not: 'ADMIN' }, // Admins don't need reminders
        },
        select: {
            id: true,
            name: true,
            email: true,
            membershipEndDate: true,
        },
    });

    result.checked = members.length;

    for (const member of members) {
        if (!member.membershipEndDate) continue;

        const endDate = new Date(member.membershipEndDate);
        const diffMs = endDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Only send on exact reminder days
        if (REMINDER_DAYS.includes(daysLeft)) {
            const title = renewalReminderTitle(daysLeft);
            const alreadySent = await prisma.notification.findFirst({
                where: { userId: member.id, type: 'GENERAL', title, createdAt: { gte: new Date(now.getTime() - RESEND_GUARD_MS) } },
                select: { id: true },
            });
            if (alreadySent) continue;

            try {
                const expiryDateStr = endDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                });

                await sendMembershipRenewalEmail(
                    member.email,
                    member.name,
                    daysLeft,
                    expiryDateStr
                );

                await prisma.notification.create({
                    data: {
                        userId: member.id,
                        type: 'GENERAL',
                        title,
                        message: `Renew before ${expiryDateStr} to keep your membership active.`,
                        emailSent: true,
                        emailSentAt: new Date(),
                    },
                });

                console.log(`[RENEWAL] Sent ${daysLeft}-day reminder to ${member.email}`);
                result.reminders++;
            } catch (err) {
                console.error(`[RENEWAL] Failed for ${member.email}:`, err);
                result.errors++;
            }
        }
    }

    console.log(`[RENEWAL] Checked ${result.checked} members, sent ${result.reminders} reminders, ${result.errors} errors`);
    return result;
}
