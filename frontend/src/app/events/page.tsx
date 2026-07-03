"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Calendar, RefreshCw } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getEventStatus, type EventStatus } from "@/lib/eventStatus";

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
        day: date.getDate(),
        month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
        full: date.toLocaleDateString()
    };
};

function EventCard({ event, index, status = 'UPCOMING' }: { event: any; index: number, status?: EventStatus }) {
    const dateObj = formatDate(event.startDate);
    const isPast = status === 'COMPLETED';
    const statusLabel = status === 'COMPLETED' ? 'COMPLETED' : status === 'ONGOING' ? 'ONGOING' : 'UPCOMING';
    
    const getPillStyle = (type: string) => {
        switch(type) {
            case 'CAMP': return 'bg-green-500/10 text-green-500';
            case 'TOURNAMENT': return 'bg-red-500/10 text-red-500';
            case 'BELT_EXAM': return 'bg-blue-500/10 text-blue-500';
            case 'SEMINAR': return 'bg-purple-500/10 text-purple-500';
            default: return 'bg-zinc-500/10 text-zinc-400';
        }
    }

    return (
        <Link href={`/events/${event.id}`} className="block w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.08 }}
                className="group relative w-full rounded-xl bg-white/5 border border-white/10 overflow-hidden transition-colors hover:bg-white/10 flex flex-col h-[320px] sm:h-[280px]"
            >
                {/* Subtle Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                
                {/* Central OSU Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
                    <svg viewBox="0 0 100 100" className="w-full h-full sm:w-[150%] sm:h-[150%] object-contain">
                        <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="30" fontWeight="900" fill="white">OSU</text>
                        <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2" fill="none" />
                    </svg>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between relative z-10">
                    {/* Top Row: Pill & Date */}
                    <div className="flex justify-between items-start">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getPillStyle(event.type)}`}>
                            {event.type.replace('_', ' ')}
                        </span>
                        
                        <div className="flex flex-col items-end text-right">
                            <span className={`text-3xl font-black leading-none ${isPast ? 'text-gray-500' : 'text-white'}`}>{dateObj.day}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{dateObj.month}</span>
                        </div>
                    </div>

                    {/* Middle: Title & Location */}
                    <div className="mb-4">
                        <h3 className={`text-2xl font-bold tracking-tight mb-3 line-clamp-2 ${isPast ? 'text-gray-400' : 'text-white'}`}>
                            {event.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{event.location}</span>
                            {!isPast && (
                                <>
                                    <span className="hidden sm:inline mx-2">•</span>
                                    <span className="hidden sm:inline font-bold text-white">₹{event.memberFee}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bottom: Status & Details Link */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-white/10 gap-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isPast ? 'text-gray-400' : 'text-[#FF0000]'}`}>
                            {statusLabel}
                        </span>

                        <span className="px-5 py-2.5 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 group-hover:bg-white/20 transition-colors w-full sm:w-auto">
                            View Details <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"ALL" | "TOURNAMENT" | "CAMP" | "SEMINAR" | "BELT_EXAM">("ALL");

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
    const upcomingEvents = filteredEvents.filter(e => getEventStatus(e, now) !== 'COMPLETED');
    const pastEvents = filteredEvents.filter(e => getEventStatus(e, now) === 'COMPLETED');

    return (
        <div className="min-h-screen w-full bg-black text-white relative">
            <div className="container-responsive pt-28 md:pt-32 pb-16 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 pb-6 relative">
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="font-black tracking-tighter uppercase mb-2" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}>
                            <span className="text-white">UPCOMING </span>
                            <span className="text-[#FF0000]">EVENTS</span>
                        </h1>
                        <p className="text-gray-400 text-sm">Compete. Train. Evolve.</p>
                    </motion.div>

                    {/* Filter Tabs */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex p-1 bg-white/[0.02] border border-white/[0.04] rounded-xl w-full md:w-auto overflow-x-auto whitespace-nowrap scrollbar-hide"
                    >
                        {(["ALL", "TOURNAMENT", "CAMP", "SEMINAR", "BELT_EXAM"] as const).map((tab) => {
                            const label = tab === 'BELT_EXAM' ? 'BELT EXAM' : tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab as any)}
                                    className={`px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0000] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                                        filter === tab
                                        ? "bg-[#FF0000] hover:bg-[#8B0000] text-white"
                                        : "text-gray-400 hover:text-white hover:bg-white/10"
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </motion.div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="py-32 flex justify-center">
                        <div className="w-12 h-12 border-4 border-white/10 border-t-[#FF0000] rounded-full animate-spin motion-reduce:animate-none" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">System Error</h3>
                        <p className="text-gray-400 text-center max-w-md">{error}</p>
                        <button
                            onClick={fetchEvents}
                            className="mt-4 flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-none border border-white/20 hover:bg-white/10 text-white transition-colors text-sm font-bold uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0000] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            <RefreshCw className="w-4 h-4" /> Try Again
                        </button>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-70">
                        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white/5 mb-2">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">No events scheduled</h3>
                        <p className="text-gray-400 text-center font-medium">There are currently no {filter !== "ALL" ? filter.toLowerCase().replace('_', ' ') + "s" : "events"} matching your criteria.</p>
                        <button onClick={() => setFilter("ALL")} className="mt-4 text-white hover:text-[#FF4D4D] text-sm font-bold flex items-center gap-2 transition-colors">
                            View All Events <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-20">
                        {/* Upcoming Events List */}
                        {upcomingEvents.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-1.5 h-6 bg-[#FF0000] rounded-full" />
                                    <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                    {upcomingEvents.map((event, index) => (
                                        <EventCard key={event.id} event={event} index={index} status={getEventStatus(event, now)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past Events List */}
                        {pastEvents.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-1.5 h-6 bg-white/20 rounded-full" />
                                    <h2 className="text-xl font-bold text-white">Past Events</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                    {pastEvents.map((event, index) => (
                                        <EventCard key={event.id} event={event} index={index} status="COMPLETED" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
