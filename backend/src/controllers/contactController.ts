import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errorHandler';
import { sendContactMessageEmail } from '../services/emailService';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * POST /api/contact — the public contact form. Validates, drops obvious bots
 * (a filled honeypot gets a silent success), and emails the foundation with
 * the visitor as reply-to. Delivery failures surface as a 500 so the page can
 * tell the visitor to call instead of pretending the message went through.
 */
export const submitContact = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (clean(req.body?.website, 200)) {
        return res.status(200).json({ status: 'success' });
    }

    const name = clean(req.body?.name, 120);
    const email = clean(req.body?.email, 200);
    const phone = clean(req.body?.phone, 40);
    const subject = clean(req.body?.subject, 160) || 'General enquiry';
    const message = clean(req.body?.message, 5000);

    if (!name || !email || !message) return next(new AppError('Please fill in your name, email and message.', 400));
    if (!EMAIL.test(email)) return next(new AppError('Please enter a valid email address.', 400));
    if (message.length < 10) return next(new AppError('Please write a little more so we can help.', 400));

    try {
        await sendContactMessageEmail({ name, email, phone: phone || undefined, subject, message });
    } catch (err) {
        console.error('[CONTACT] delivery failed:', err);
        // 500, not 502/503: the frontend auto-retries those for Render cold starts,
        // which would make the visitor wait ~20s before hearing it failed.
        return next(new AppError('We could not send your message just now. Please call us or try again later.', 500));
    }

    res.status(200).json({ status: 'success' });
});
