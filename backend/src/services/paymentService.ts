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
    };
};
