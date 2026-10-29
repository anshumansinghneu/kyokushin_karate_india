import type { Prisma } from '@prisma/client';
import { AppError } from './errorHandler';

/**
 * Mark a voucher redeemed, only if it is still unused and active, in one statement.
 * Every redeem path checked `isRedeemed` first and then updated unconditionally, so two
 * requests at the same moment could both spend one voucher. Called inside the redeeming
 * transaction: if another request got there first, this throws and everything the
 * transaction did (a new account, a registration, a payment) is rolled back.
 */
export async function claimVoucher(tx: Prisma.TransactionClient, voucherId: string, redeemedBy: string): Promise<void> {
    const claimed = await tx.cashVoucher.updateMany({
        where: { id: voucherId, isRedeemed: false, isActive: true },
        data: { isRedeemed: true, redeemedBy, redeemedAt: new Date() },
    });
    if (claimed.count !== 1) {
        throw new AppError('This voucher has already been used.', 409);
    }
}
