import prisma from '../prisma';
import { sendMembershipRenewalEmail } from './emailService';

// Days before expiry to send reminders
const REMINDER_DAYS = [30, 15, 7, 3, 1, 0];

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
