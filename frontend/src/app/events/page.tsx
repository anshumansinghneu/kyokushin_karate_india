"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Calendar, RefreshCw } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";
import { SkeletonGrid } from "@/components/SkeletonCard";

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"ALL" | "TOURNAMENT" | "CAMP">("ALL");

    const fetchEvents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/events');
            setEvents(response.data.data.events);
        } catch (err) {
            console.error("Failed to fetch events", err);
            setError("Failed to load events. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event => filter === "ALL" || event.type === filter);

    const now = new Date();
    const upcomingEvents = filteredEvents.filter(e => new Date(e.startDate) >= now);
    const pastEvents = filteredEvents.filter(e => new Date(e.startDate) < now);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            day: date.getDate(),
            month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
            full: date.toLocaleDateString()
        };
    };

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black" />

            <div className="container mx-auto px-4 py-12 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl md:text-5xl font-black tracking-tighter mb-2"
                        >
                            UPCOMING <span className="text-transparent stroke-text" style={{ WebkitTextStroke: '2px #dc2626' }}>EVENTS</span>
                        </motion.h1>
                        <p className="text-gray-400 text-lg">Compete, Train, Evolve.</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md overflow-x-auto">
                        {["ALL", "TOURNAMENT", "CAMP"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab as any)}
                                className={`px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 min-h-[44px] whitespace-nowrap active:scale-95 ${filter === tab
                                    ? "bg-primary text-white shadow-lg"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <SkeletonGrid count={4} variant="event" />
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Something went wrong</h3>
                        <p className="text-gray-400 text-center max-w-md">{error}</p>
                        <button
                            onClick={fetchEvents}
                            className="mt-4 flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" /> Try Again
                        </button>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">No events found</h3>
                        <p className="text-gray-400 text-center">Check back soon for upcoming {filter !== "ALL" ? filter.toLowerCase() + "s" : "events"}</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                    {/* Upcoming Events */}
                    {upcomingEvents.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-red-600 rounded-full" />
                                Upcoming Events
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                {upcomingEvents.map((event, index) => {
                                    const dateObj = formatDate(event.startDate);
                                    return (
                                        <Link href={`/events/${event.id}`} key={event.id}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, amount: 0.2 }}
                                            transition={{ delay: index * 0.1, duration: 0.5 }}
                                            className="group relative min-h-[280px] md:h-[300px] rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary/50 transition-colors active:scale-[0.98]"
                                        >
                                            <div className="absolute inset-0 bg-gray-900">
                                                <div className={`absolute inset-0 bg-gradient-to-br ${event.type === 'TOURNAMENT' ? 'from-red-900/50 via-zinc-900 to-black' : 'from-green-900/50 via-zinc-900 to-black'}`} />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
                                                    <svg viewBox="0 0 100 100" className="w-40 h-40" fill="currentColor">
                                                        <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="24" fontWeight="900" className="text-white">OSU</text>
                                                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                                    </svg>
                                                </div>
                                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:20px_20px]" />
                                            </div>
                                            <div className="absolute inset-0 p-4 sm:p-8 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${event.type === 'TOURNAMENT'
                                                        ? 'bg-red-500/20 text-red-400 border-red-500/20'
                                                        : 'bg-green-500/20 text-green-400 border-green-500/20'
                                                        }`}>
                                                        {event.type}
                                                    </span>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-2xl font-black text-white">{dateObj.day}</span>
                                                        <span className="text-sm font-bold text-gray-400 uppercase">{dateObj.month}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl sm:text-3xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{event.name}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-400 text-sm mb-4 sm:mb-6">
                                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                        <span className="text-white font-bold">₹{event.memberFee}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-primary uppercase tracking-wider">{event.status}</span>
                                                        <span className="rounded-full bg-white/10 px-4 py-2 text-white border border-white/10 backdrop-blur-md group-hover:bg-primary group-hover:border-primary transition-all text-sm font-semibold inline-flex items-center gap-2">
                                                            View Details <ArrowRight className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Past Events */}
                    {pastEvents.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-zinc-400 mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-zinc-600 rounded-full" />
                                Past Events
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 opacity-70">
                                {pastEvents.map((event, index) => {
                                    const dateObj = formatDate(event.startDate);
                                    return (
                                        <Link href={`/events/${event.id}`} key={event.id}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, amount: 0.2 }}
                                            transition={{ delay: index * 0.05, duration: 0.5 }}
                                            className="group relative min-h-[280px] md:h-[300px] rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-zinc-600/50 transition-colors active:scale-[0.98]"
                                        >
                                            <div className="absolute inset-0 bg-gray-900">
                                                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-900 to-black" />
                                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:20px_20px]" />
                                            </div>
                                            <div className="absolute inset-0 p-4 sm:p-8 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-zinc-700/30 text-zinc-400 border-zinc-600/30">
                                                        {event.type}
                                                    </span>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-2xl font-black text-zinc-400">{dateObj.day}</span>
                                                        <span className="text-sm font-bold text-zinc-500 uppercase">{dateObj.month}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl sm:text-3xl font-bold text-zinc-300 mb-2 group-hover:text-white transition-colors">{event.name}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-zinc-500 text-sm mb-4 sm:mb-6">
                                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Completed</span>
                                                        <span className="rounded-full bg-white/5 px-4 py-2 text-zinc-400 border border-white/5 group-hover:bg-white/10 transition-all text-sm font-semibold inline-flex items-center gap-2">
                                                            View Results <ArrowRight className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    </div>
                )}
            </div>
        </div>
    );
}
