'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Eye, Users, TrendingUp, RefreshCw, Clock, ExternalLink, BarChart3, Activity } from 'lucide-react';
import api from '@/lib/api';

interface AnalyticsData {
    period: { days: number; since: string };
    totalVisits: number;
    uniqueVisitors: number;
    visitsByDay: { date: string; count: number }[];
    topCountries: { country: string; visitors: number }[];
    topCities: { city: string; country: string; visitors: number }[];
    topPages: { path: string; views: number }[];
    recentVisitors: {
        id: string;
        fingerprint: string;
        country: string | null;
        city: string | null;
        region: string | null;
        path: string | null;
        referrer: string | null;
        createdAt: string;
    }[];
}

const PERIOD_OPTIONS = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
    { label: '365 days', value: 365 },
];

// Simple bar chart component (no external dependency)
function MiniBarChart({ data, maxBars = 30 }: { data: { label: string; value: number }[]; maxBars?: number }) {
    const sliced = data.slice(-maxBars);
    const max = Math.max(...sliced.map(d => d.value), 1);

    return (
        <div className="flex items-end gap-[2px] h-32 w-full">
            {sliced.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div
                        className="w-full bg-red-500/80 rounded-t-sm transition-all duration-200 group-hover:bg-red-400 min-h-[2px]"
                        style={{ height: `${(d.value / max) * 100}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {d.label}: <span className="font-bold">{d.value}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-[11px] font-mono tracking-wider text-white/30 uppercase">{label}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
        </div>
    );
}

function RankList({ items, labelKey, valueKey, valueLabel, icon: Icon }: {
    items: any[];
    labelKey: string;
    valueKey: string;
    valueLabel: string;
    icon: any;
}) {
    const max = items.length > 0 ? items[0][valueKey] : 1;
    return (
        <div className="space-y-2">
            {items.length === 0 && (
                <p className="text-white/20 text-sm text-center py-6">No data yet</p>
            )}
            {items.map((item, i) => (
                <div key={i} className="group relative">
                    {/* Background bar */}
                    <div
                        className="absolute inset-y-0 left-0 bg-red-500/[0.06] rounded-lg transition-all"
                        style={{ width: `${(item[valueKey] / max) * 100}%` }}
                    />
                    <div className="relative flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[10px] font-mono text-white/20 w-5 text-right flex-shrink-0">{i + 1}</span>
                            <Icon className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                            <span className="text-sm text-white/80 truncate">{item[labelKey]}</span>
                        </div>
                        <span className="text-xs font-mono text-white/50 flex-shrink-0 ml-2">
                            {item[valueKey].toLocaleString()} {valueLabel}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function SiteAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(30);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/analytics/stats?days=${days}`);
            setData(res.data.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white/[0.06] border-t-red-500 animate-spin" />
                    <span className="text-xs text-white/30 font-mono">LOADING ANALYTICS</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-sm text-white hover:bg-white/[0.1] transition-all">
                    <RefreshCw className="w-4 h-4" /> Retry
                </button>
            </div>
        );
    }

    if (!data) return null;

    const avgPerDay = data.visitsByDay.length > 0
        ? Math.round(data.totalVisits / data.visitsByDay.length)
        : 0;

    const chartData = data.visitsByDay.map(d => ({
        label: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        value: d.count,
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-400" />
                        Site Analytics
                    </h2>
                    <p className="text-xs text-white/30 mt-1">Visitor tracking &amp; geographical insights</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Period selector */}
                    <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-lg overflow-hidden">
                        {PERIOD_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setDays(opt.value)}
                                className={`px-3 py-1.5 text-xs font-medium transition-all ${
                                    days === opt.value
                                        ? 'bg-red-500/20 text-red-400 border-r border-white/[0.06]'
                                        : 'text-white/40 hover:text-white/60 border-r border-white/[0.06] last:border-r-0'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchData} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard icon={Eye} label="Total Visits" value={data.totalVisits} sub={`Last ${days} days`} />
                <StatCard icon={Users} label="Unique Visitors" value={data.uniqueVisitors} sub="By browser fingerprint" />
                <StatCard icon={TrendingUp} label="Avg / Day" value={avgPerDay} sub="Average daily visits" />
                <StatCard icon={Globe} label="Countries" value={data.topCountries.length} sub="Distinct countries" />
            </div>

            {/* Traffic Chart */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-red-400" />
                    <h3 className="text-sm font-semibold text-white">Daily Traffic</h3>
                </div>
                {chartData.length > 0 ? (
                    <MiniBarChart data={chartData} />
                ) : (
                    <p className="text-white/20 text-sm text-center py-8">No visits recorded yet</p>
                )}
                {chartData.length > 0 && (
                    <div className="flex justify-between mt-2">
                        <span className="text-[10px] text-white/20">{chartData[0]?.label}</span>
                        <span className="text-[10px] text-white/20">{chartData[chartData.length - 1]?.label}</span>
                    </div>
                )}
            </motion.div>

            {/* Two-column: Countries & Cities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4 text-red-400" />
                        <h3 className="text-sm font-semibold text-white">Top Countries</h3>
                    </div>
                    <RankList items={data.topCountries} labelKey="country" valueKey="visitors" valueLabel="visitors" icon={Globe} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-4 h-4 text-red-400" />
                        <h3 className="text-sm font-semibold text-white">Top Cities</h3>
                    </div>
                    <RankList
                        items={data.topCities.map(c => ({ ...c, label: `${c.city}, ${c.country}` }))}
                        labelKey="label" valueKey="visitors" valueLabel="visitors" icon={MapPin}
                    />
                </motion.div>
            </div>

            {/* Top Pages */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <ExternalLink className="w-4 h-4 text-red-400" />
                    <h3 className="text-sm font-semibold text-white">Top Pages</h3>
                </div>
                <RankList items={data.topPages} labelKey="path" valueKey="views" valueLabel="views" icon={ExternalLink} />
            </motion.div>

            {/* Recent Visitors */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-red-400" />
                    <h3 className="text-sm font-semibold text-white">Recent Visitors</h3>
                    <span className="text-[10px] text-white/20 ml-auto">Last 50</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                <th className="text-[10px] font-mono text-white/30 uppercase tracking-wider pb-2 pr-4">Time</th>
                                <th className="text-[10px] font-mono text-white/30 uppercase tracking-wider pb-2 pr-4">Country</th>
                                <th className="text-[10px] font-mono text-white/30 uppercase tracking-wider pb-2 pr-4">City</th>
                                <th className="text-[10px] font-mono text-white/30 uppercase tracking-wider pb-2 pr-4">Page</th>
                                <th className="text-[10px] font-mono text-white/30 uppercase tracking-wider pb-2">Visitor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentVisitors.length === 0 && (
                                <tr><td colSpan={5} className="text-center text-white/20 text-sm py-8">No visitors yet</td></tr>
                            )}
                            {data.recentVisitors.map((v) => (
                                <tr key={v.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                    <td className="py-2 pr-4 text-xs text-white/50 whitespace-nowrap">
                                        {new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                                        <span className="text-white/25">{new Date(v.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="py-2 pr-4 text-xs text-white/60">{v.country || '—'}</td>
                                    <td className="py-2 pr-4 text-xs text-white/50">{v.city || '—'}{v.region ? `, ${v.region}` : ''}</td>
                                    <td className="py-2 pr-4 text-xs text-white/40 font-mono max-w-[200px] truncate">{v.path || '/'}</td>
                                    <td className="py-2 text-[10px] text-white/20 font-mono">{v.fingerprint.slice(0, 10)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
