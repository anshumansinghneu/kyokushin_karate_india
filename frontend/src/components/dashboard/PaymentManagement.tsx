"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Search, Filter, Download, TrendingUp, Users, Calendar, RefreshCw, ChevronLeft, ChevronRight, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface Payment {
    id: string;
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    amount: number;
    currency: string;
    status: string;
    type: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        membershipNumber: string | null;
    };
    event?: {
        id: string;
        name: string;
        type: string;
    } | null;
}

export default function PaymentManagement() {
    const { showToast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 25;

    const [stats, setStats] = useState({
        totalRevenue: 0,
        membershipRevenue: 0,
        renewalRevenue: 0,
        tournamentRevenue: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
    });

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const params: any = { page, limit: 200 };
            const res = await api.get('/payments/all', { params });
            const allPayments: Payment[] = res.data.data.payments;
            setPayments(allPayments);
            setTotal(res.data.total || allPayments.length);

            // Calculate stats
            const successful = allPayments.filter(p => p.status === 'captured' || p.status === 'CAPTURED');
            const membershipPays = successful.filter(p => p.type === 'MEMBERSHIP');
            const renewalPays = successful.filter(p => p.type === 'RENEWAL');
            const tournamentPays = successful.filter(p => p.type === 'TOURNAMENT');

            setStats({
                totalRevenue: successful.reduce((sum, p) => sum + p.amount, 0),
                membershipRevenue: membershipPays.reduce((sum, p) => sum + p.amount, 0),
                renewalRevenue: renewalPays.reduce((sum, p) => sum + p.amount, 0),
                tournamentRevenue: tournamentPays.reduce((sum, p) => sum + p.amount, 0),
                totalTransactions: allPayments.length,
                successfulTransactions: successful.length,
                failedTransactions: allPayments.filter(p => p.status === 'failed' || p.status === 'FAILED').length,
                pendingTransactions: allPayments.filter(p => p.status === 'created' || p.status === 'CREATED').length,
            });
        } catch (error) {
            console.error("Failed to fetch payments", error);
            showToast("Failed to load payments", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    useEffect(() => {
        let filtered = [...payments];

        // Filter by type
        if (filterType !== "all") {
            filtered = filtered.filter(p => p.type === filterType);
        }

        // Filter by status
        if (filterStatus !== "all") {
            filtered = filtered.filter(p => p.status.toLowerCase() === filterStatus.toLowerCase());
        }

        // Filter by search
        if (search) {
            const lowerSearch = search.toLowerCase();
            filtered = filtered.filter(p =>
                (p.user?.name || '').toLowerCase().includes(lowerSearch) ||
                (p.user?.email || '').toLowerCase().includes(lowerSearch) ||
                (p.user?.membershipNumber || "").toLowerCase().includes(lowerSearch) ||
                (p.razorpayPaymentId || "").toLowerCase().includes(lowerSearch)
            );
        }

        setFilteredPayments(filtered);
        setPage(1);
    }, [search, filterType, filterStatus, payments]);

    const paginatedPayments = filteredPayments.slice((page - 1) * pageSize, page * pageSize);
    const totalPages = Math.ceil(filteredPayments.length / pageSize);

    const formatAmount = (amount: number) => `₹${(amount / 100).toLocaleString('en-IN')}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const handleExportCSV = () => {
        const headers = "Date,Name,Email,Membership #,Type,Amount,Status,Razorpay ID\n";
        const rows = filteredPayments.map(p =>
            `${formatDate(p.createdAt)},${p.user?.name || 'Unknown'},${p.user?.email || 'N/A'},${p.user?.membershipNumber || 'N/A'},${p.type},${(p.amount / 100).toFixed(2)},${p.status},${p.razorpayPaymentId || 'N/A'}`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payments_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const statusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'captured': return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'created': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/50';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };

    const typeColor = (type: string) => {
        switch (type) {
            case 'MEMBERSHIP': return 'bg-blue-500/20 text-blue-400';
            case 'RENEWAL': return 'bg-purple-500/20 text-purple-400';
            case 'TOURNAMENT': return 'bg-orange-500/20 text-orange-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Payment Management</h1>
                    <p className="text-gray-400">Track all payments, revenue, and transactions.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        onClick={handleExportCSV}
                    >
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                    <Button
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        onClick={fetchPayments}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Revenue", value: formatAmount(stats.totalRevenue), icon: IndianRupee, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
                    { label: "Membership", value: formatAmount(stats.membershipRevenue), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { label: "Renewals", value: formatAmount(stats.renewalRevenue), icon: RefreshCw, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                    { label: "Tournaments", value: formatAmount(stats.tournamentRevenue), icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-6 rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${stat.color} opacity-80`}>{stat.label}</p>
                                <p className="text-3xl font-black text-white">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Transaction Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-black text-green-400">{stats.successfulTransactions}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Successful</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-black text-yellow-400">{stats.pendingTransactions}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Pending</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-black text-red-400">{stats.failedTransactions}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Failed</p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="Search by name, email, or payment ID..."
                            className="pl-10 input-glass"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white text-sm"
                        >
                            <option value="all">All Types</option>
                            <option value="MEMBERSHIP">Membership</option>
                            <option value="RENEWAL">Renewal</option>
                            <option value="TOURNAMENT">Tournament</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-md h-10 px-3 text-white text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="captured">Captured</option>
                            <option value="created">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>

                {/* Payments Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold text-gray-500 uppercase border-b border-white/10">
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">User</th>
                                <th className="py-3 px-4 hidden md:table-cell">Type</th>
                                <th className="py-3 px-4">Amount</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 hidden lg:table-cell">Razorpay ID</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-300">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">Loading payments...</td>
                                </tr>
                            ) : paginatedPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">No payments found.</td>
                                </tr>
                            ) : (
                                <AnimatePresence>
                                    {paginatedPayments.map((payment) => (
                                        <motion.tr
                                            key={payment.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        >
                                            <td className="py-3 px-4 text-xs text-gray-400">
                                                {formatDate(payment.createdAt)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-bold text-white">{payment.user?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500">{payment.user?.membershipNumber || payment.user?.email || '—'}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${typeColor(payment.type)}`}>
                                                    {payment.type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-white">
                                                {formatAmount(payment.amount)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${statusColor(payment.status)}`}>
                                                    {payment.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 hidden lg:table-cell">
                                                <span className="text-xs text-gray-500 font-mono">
                                                    {payment.razorpayPaymentId || '—'}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                        <p className="text-sm text-gray-400">
                            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filteredPayments.length)} of {filteredPayments.length}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                className="h-8 px-3 text-gray-400 hover:text-white"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                            </Button>
                            <span className="flex items-center px-3 text-sm text-gray-400">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="ghost"
                                className="h-8 px-3 text-gray-400 hover:text-white"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
