'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Receipt, Download, IndianRupee, Calendar, CheckCircle, XCircle, Clock, FileText, AlertCircle, RefreshCw, ArrowRight, LifeBuoy, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { getToken } from '@/lib/tokenStorage';

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

// ── Money is always rendered to 2 decimals, en-IN grouped (₹1,499.50) ──
const formatINR = (n: number): string =>
    `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Red/gold-only status vocabulary. Gold = earned (paid); red = attention. ──
type StatusKey = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
const statusConfig: Record<StatusKey, { icon: typeof CheckCircle; label: string; color: string }> = {
    PAID: { icon: CheckCircle, label: 'Paid', color: 'text-[#FFD700]' },
    PENDING: { icon: Clock, label: 'Pending', color: 'text-gray-300' },
    FAILED: { icon: XCircle, label: 'Failed', color: 'text-[#FF4D4D]' },
    REFUNDED: { icon: RefreshCw, label: 'Refunded', color: 'text-gray-300' },
};

const typeLabels: Record<string, string> = {
    MEMBERSHIP: 'Membership Fee',
    RENEWAL: 'Membership Renewal',
    TOURNAMENT: 'Tournament/Event Fee',
};

// Where a failed/pending payment can be re-attempted, if we can infer it.
const retryHref = (p: Payment): string | null => {
    if (p.type === 'RENEWAL' || p.type === 'MEMBERSHIP') return '/renew-membership';
    if (p.type === 'TOURNAMENT' && p.event?.id) return `/events/${p.event.id}`;
    return null;
};

export default function PaymentHistoryPage() {
    const router = useRouter();
    const reduceMotion = useReducedMotion();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const { showToast } = useToast();

    const fetchPayments = useCallback(() => {
        const token = getToken();
        if (!token) { router.push('/login'); return; }
        setLoading(true);
        setError(false);

        api.get('/payments/my-payments')
            .then(res => setPayments(res.data.data.payments))
            .catch(err => {
                console.error('Failed to load payments:', err);
                if (err.response?.status === 401) router.push('/login');
                else setError(true);
            })
            .finally(() => setLoading(false));
    }, [router]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // ── Derived summary: the answer users open this page to get ──
    const summary = useMemo(() => {
        const year = new Date().getFullYear();
        let paidThisYear = 0;
        let attention = 0;
        for (const p of payments) {
            if (p.status === 'PAID') {
                const when = p.paidAt || p.createdAt;
                if (new Date(when).getFullYear() === year) paidThisYear += Number(p.totalAmount) || 0;
            } else if (p.status === 'PENDING' || p.status === 'FAILED') {
                attention += 1;
            }
        }
        return { year, paidThisYear, attention, count: payments.length };
    }, [payments]);

    // Warm the jsPDF chunk before the user commits, so the first download isn't a cold stall.
    const prefetchPdf = useCallback(() => { import('jspdf').catch(() => {}); }, []);

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
            doc.text('kyokushinfoundation.com', W / 2, footerY + 15, { align: 'center' });

            doc.save(`KKFI-Receipt-${invoice.invoiceNumber}.pdf`);
        } catch (err) {
            console.error('Invoice download failed:', err);
            showToast('Failed to download invoice. Please try again.', 'error');
        } finally {
            setDownloadingId(null);
        }
    }, [showToast]);

    const enter = reduceMotion
        ? { initial: false as const }
        : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-4xl mx-auto px-4 pt-4 pb-16">
                <motion.div {...enter}>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-white/5 border border-white/10">
                            <Receipt className="w-6 h-6 text-[#FF0000]" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">Payment History</h1>
                            <p className="text-gray-300 text-sm">Your receipts and downloadable invoices</p>
                        </div>
                    </div>

                    {/* ── Summary: lead with the answer, not the list ── */}
                    {!loading && !error && payments.length > 0 && (
                        <div className="mb-8 border-b-2 border-white/10 pb-6">
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">
                                Paid in {summary.year}
                            </p>
                            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                                <span className="text-4xl font-black text-white tabular-nums">
                                    {formatINR(summary.paidThisYear)}
                                </span>
                                <span className="text-sm text-gray-300">
                                    {summary.count} {summary.count === 1 ? 'receipt' : 'receipts'} on record
                                </span>
                                {summary.attention > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF4D4D]">
                                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                                        {summary.attention} {summary.attention === 1 ? 'payment needs' : 'payments need'} attention
                                    </span>
                                )}
                            </div>
                            <Link
                                href="/dashboard/my-fees"
                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-gray-300 hover:text-white transition-colors"
                            >
                                View monthly dues <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </Link>
                        </div>
                    )}

                    {/* Payments List */}
                    {loading ? (
                        <div className="flex justify-center py-20" role="status" aria-live="polite">
                            <div className="w-8 h-8 border-2 border-[#FF0000] border-t-transparent rounded-full animate-spin" />
                            <span className="sr-only">Loading payment history…</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <AlertCircle className="w-12 h-12 mx-auto text-[#FF0000] mb-4" aria-hidden="true" />
                            <p className="text-gray-300 text-lg mb-4">Couldn&apos;t load your payment history</p>
                            <button
                                onClick={fetchPayments}
                                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 bg-[#FF0000] hover:bg-[#8B0000] text-white text-sm font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0000] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                            >
                                <RefreshCw className="w-4 h-4" aria-hidden="true" /> Try again
                            </button>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-20">
                            <IndianRupee className="w-12 h-12 mx-auto text-gray-500 mb-4" aria-hidden="true" />
                            <p className="text-gray-200 text-lg font-semibold">No payments yet</p>
                            <p className="text-gray-400 text-sm mt-1 mb-5">Your receipts will appear here after your first payment.</p>
                            <Link
                                href="/renew-membership"
                                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 bg-[#FF0000] hover:bg-[#8B0000] text-white text-sm font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0000] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                            >
                                Pay membership <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400 mb-4">Receipts</p>
                            <ul className="space-y-4">
                                {payments.map((payment, i) => {
                                    const cfg = statusConfig[(payment.status as StatusKey)] ?? statusConfig.PENDING;
                                    const StatusIcon = cfg.icon;
                                    const when = payment.paidAt || payment.createdAt;
                                    const retry = retryHref(payment);
                                    const isDownloading = downloadingId === payment.id;
                                    return (
                                        <motion.li
                                            key={payment.id}
                                            {...(reduceMotion
                                                ? { initial: false as const }
                                                : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: Math.min(i, 8) * 0.04 } })}
                                            className="glass-card p-5 hover:bg-white/[0.07] transition-colors"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-white/5 border border-white/10">
                                                        <FileText className="w-5 h-5 text-gray-300" aria-hidden="true" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white">
                                                            {typeLabels[payment.type] || payment.type}
                                                        </h3>
                                                        {payment.event && (
                                                            <p className="text-sm text-gray-300">{payment.event.name}</p>
                                                        )}
                                                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                                            <span className="flex items-center gap-1 text-xs text-gray-300">
                                                                <Calendar className="w-3 h-3" aria-hidden="true" />
                                                                {formatDate(when)}
                                                            </span>
                                                            <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
                                                                <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                                                                {cfg.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 sm:justify-end">
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-white tabular-nums">{formatINR(payment.totalAmount)}</p>
                                                        <p className="text-xs text-gray-400 tabular-nums">
                                                            {formatINR(payment.amount)} + {formatINR(payment.taxAmount)} GST
                                                        </p>
                                                    </div>
                                                    {payment.status === 'PAID' && (
                                                        <button
                                                            onClick={() => downloadInvoice(payment.id)}
                                                            onPointerEnter={prefetchPdf}
                                                            onFocus={prefetchPdf}
                                                            disabled={isDownloading}
                                                            aria-label={`Download invoice for ${typeLabels[payment.type] || payment.type}, ${formatINR(payment.totalAmount)}`}
                                                            aria-busy={isDownloading}
                                                            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 bg-transparent border border-white/20 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                                        >
                                                            {isDownloading ? (
                                                                <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Generating…</>
                                                            ) : (
                                                                <><Download className="w-3.5 h-3.5" aria-hidden="true" /> Invoice</>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Recovery paths for the non-happy states */}
                                            {payment.status === 'PENDING' && (
                                                <p className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-300">
                                                    Awaiting confirmation — this usually clears within a few minutes.
                                                </p>
                                            )}
                                            {payment.status === 'FAILED' && (
                                                <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-x-4 gap-y-2">
                                                    <p className="text-xs text-[#FF4D4D]">This payment didn&apos;t go through.</p>
                                                    {retry && (
                                                        <Link href={retry} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF4D4D] transition-colors">
                                                            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Retry payment
                                                        </Link>
                                                    )}
                                                    <Link href="/contact" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors">
                                                        <LifeBuoy className="w-3.5 h-3.5" aria-hidden="true" /> Get help
                                                    </Link>
                                                </div>
                                            )}
                                        </motion.li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
