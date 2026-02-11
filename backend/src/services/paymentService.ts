import Razorpay from 'razorpay';
import crypto from 'crypto';

// Payment configuration
export const PAYMENT_CONFIG = {
    MEMBERSHIP_FEE: 250,           // ₹250 base
    GST_RATE: 0.18,                // 18% GST
    CURRENCY: 'INR',
    MEMBERSHIP_DURATION_DAYS: 365, // 1 year
};

// Calculate total with GST
export const calculateTotal = (baseAmount: number) => {
    const taxAmount = Math.round(baseAmount * PAYMENT_CONFIG.GST_RATE * 100) / 100;
    const totalAmount = baseAmount + taxAmount;
    return {
        amount: baseAmount,
        taxAmount,
        totalAmount,
        // Razorpay expects amount in paise (smallest currency unit)
        totalAmountPaise: Math.round(totalAmount * 100),
    };
};

// Initialize Razorpay instance
const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
    }

    return new Razorpay({
        key_id,
        key_secret,
    });
};

// Create a Razorpay order
export const createRazorpayOrder = async (options: {
    amount: number;       // in paise
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
}) => {
    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
        amount: options.amount,
        currency: options.currency || PAYMENT_CONFIG.CURRENCY,
        receipt: options.receipt,
        notes: options.notes || {},
    });

    return order;
};

// Verify Razorpay payment signature
export const verifyRazorpaySignature = (
    orderId: string,
    paymentId: string,
    signature: string
): boolean => {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) throw new Error('RAZORPAY_KEY_SECRET not configured');

    const expectedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    return expectedSignature === signature;
};

// Fetch payment details from Razorpay
export const fetchRazorpayPayment = async (paymentId: string) => {
    const razorpay = getRazorpayInstance();
    return await razorpay.payments.fetch(paymentId);
};
