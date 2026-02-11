'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Receipt, Download, IndianRupee, Calendar, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import api from '@/lib/api';

interface Payment {
    id: string;
    type: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
    status: string;
    description: string | null;
    paidAt: string | null;
    createdAt: string;
    event?: { id: string; name: string; type: string } | null;
}

interface Invoice {
    invoiceNumber: string;
    paymentId: string;
    type: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
    razorpayPaymentId: string;
    paidAt: string;
    description: string;
    user: {
        name: string;
        email: string;
        phone?: string;
        membershipNumber?: string;
        city?: string;
        state?: string;
        dojo?: { name: string; city: string } | null;
    };
    event?: { name: string; type: string; startDate: string; location: string } | null;
    organization: {
        name: string;
        shortName: string;
        address: string;
        gstNote: string;
    };
}

const statusIcons: Record<string, React.ReactNode> = {
    PAID: <CheckCircle className="w-4 h-4 text-green-500" />,
    PENDING: <Clock className="w-4 h-4 text-yellow-500" />,
    FAILED: <XCircle className="w-4 h-4 text-red-500" />,
    REFUNDED: <Receipt className="w-4 h-4 text-blue-500" />,
};

const typeLabels: Record<string, string> = {
    MEMBERSHIP: 'Membership Fee',
    RENEWAL: 'Membership Renewal',
    TOURNAMENT: 'Tournament/Event Fee',
};

export default function PaymentHistoryPage() {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        api.get('/payments/my-payments')
            .then(res => setPayments(res.data.data.payments))
            .catch(err => {
                console.error('Failed to load payments:', err);
                if (err.response?.status === 401) router.push('/login');
            })
            .finally(() => setLoading(false));
    }, [router]);

    // ─── Generate & Download Invoice PDF ─────────────────────────
    const downloadInvoice = useCallback(async (paymentId: string) => {
        setDownloadingId(paymentId);
        try {
            const res = await api.get(`/payments/invoice/${paymentId}`);
            const invoice: Invoice = res.data.data.invoice;

            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const W = 210;
            let y = 15;

            // ─── Header ───
            doc.setFillColor(220, 38, 38); // red-600
            doc.rect(0, 0, W, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('KYOKUSHIN KARATE', W / 2, y + 5, { align: 'center' });
            doc.setFontSize(10);
            doc.text('FOUNDATION OF INDIA', W / 2, y + 13, { align: 'center' });

            doc.setFontSize(14);
            doc.text('PAYMENT RECEIPT', W / 2, y + 23, { align: 'center' });

            y = 50;

            // ─── Invoice Info ───
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Invoice No: ${invoice.invoiceNumber}`, 15, y);
            doc.text(`Date: ${new Date(invoice.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, W - 15, y, { align: 'right' });

            y += 5;
            doc.text(`Transaction ID: ${invoice.razorpayPaymentId || 'N/A'}`, 15, y);

            // ─── Divider ───
            y += 8;
            doc.setDrawColor(200, 200, 200);
            doc.line(15, y, W - 15, y);

            // ─── Billed To ───
            y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text('Billed To:', 15, y);
            doc.text('From:', W / 2 + 10, y);

            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(invoice.user.name, 15, y);
            doc.text(invoice.organization.name, W / 2 + 10, y);
            y += 5;
            doc.text(invoice.user.email, 15, y);
            doc.text(invoice.organization.address, W / 2 + 10, y);
            y += 5;
            if (invoice.user.membershipNumber) {
                doc.text(`ID: ${invoice.user.membershipNumber}`, 15, y);
            }
            if (invoice.user.dojo) {
                doc.text(`Dojo: ${invoice.user.dojo.name}, ${invoice.user.dojo.city}`, 15, y + 5);
            }

            // ─── Table ───
            y += 18;
            doc.setFillColor(245, 245, 245);
            doc.rect(15, y, W - 30, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
            doc.text('Description', 20, y + 5.5);
            doc.text('Amount', W - 20, y + 5.5, { align: 'right' });

            y += 12;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);

            const desc = invoice.description || typeLabels[invoice.type] || invoice.type;
            doc.text(desc, 20, y);
            doc.text(`₹${invoice.amount.toFixed(2)}`, W - 20, y, { align: 'right' });

            y += 7;
            doc.text('GST @ 18%', 20, y);
            doc.text(`₹${invoice.taxAmount.toFixed(2)}`, W - 20, y, { align: 'right' });

            y += 3;
            doc.setDrawColor(200, 200, 200);
            doc.line(15, y, W - 15, y);

            y += 7;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(30, 30, 30);
            doc.text('Total Paid', 20, y);
            doc.text(`₹${invoice.totalAmount.toFixed(2)}`, W - 20, y, { align: 'right' });

            // ─── Payment Status ───
            y += 12;
            doc.setFillColor(34, 197, 94);
            doc.roundedRect(W / 2 - 25, y, 50, 8, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text('PAID', W / 2, y + 5.5, { align: 'center' });

            // ─── Footer ───
            const footerY = 270;
            doc.setDrawColor(220, 220, 220);
            doc.line(15, footerY, W - 15, footerY);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'normal');
            doc.text('This is a computer-generated receipt and does not require a signature.', W / 2, footerY + 5, { align: 'center' });
            doc.text(`${invoice.organization.name} | ${invoice.organization.gstNote}`, W / 2, footerY + 10, { align: 'center' });
            doc.text('kyokushin-karate-india.vercel.app', W / 2, footerY + 15, { align: 'center' });

            doc.save(`KKFI-Receipt-${invoice.invoiceNumber}.pdf`);
        } catch (err) {
            console.error('Invoice download failed:', err);
            alert('Failed to download invoice. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
            <div className="max-w-4xl mx-auto px-4 pt-4 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                            <Receipt className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">Payment History</h1>
                            <p className="text-gray-400 text-sm">View receipts and download invoices</p>
                        </div>
                    </div>

                    {/* Payments List */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-20">
                            <IndianRupee className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-500 text-lg">No payments yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {payments.map((payment, i) => (
                                <motion.div
                                    key={payment.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass-card p-5 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                                                <FileText className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">
                                                    {typeLabels[payment.type] || payment.type}
                                                </h3>
                                                {payment.event && (
                                                    <p className="text-sm text-gray-400">{payment.event.name}</p>
                                                )}
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Calendar className="w-3 h-3" />
                                                        {payment.paidAt
                                                            ? new Date(payment.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                            : new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                        }
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs">
                                                        {statusIcons[payment.status]}
                                                        <span className={payment.status === 'PAID' ? 'text-green-500' : payment.status === 'FAILED' ? 'text-red-500' : 'text-yellow-500'}>
                                                            {payment.status}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-black text-white">₹{payment.totalAmount}</p>
                                                <p className="text-xs text-gray-500">₹{payment.amount} + ₹{payment.taxAmount} GST</p>
                                            </div>
                                            {payment.status === 'PAID' && (
                                                <button
                                                    onClick={() => downloadInvoice(payment.id)}
                                                    disabled={downloadingId === payment.id}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold transition-all disabled:opacity-50"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    {downloadingId === payment.id ? '...' : 'Invoice'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
