"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "TOURNAMENT" | "CAMP">("ALL");

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await api.get('/events');
                setEvents(response.data.data.events);
            } catch (error) {
                console.error("Failed to fetch events", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event => filter === "ALL" || event.type === filter);

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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />

            <div className="container mx-auto px-4 py-12 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl md:text-5xl font-black tracking-tighter mb-2"
                        >
                            UPCOMING <span className="text-transparent stroke-text" style={{ WebkitTextStroke: '2px #3b82f6' }}>EVENTS</span>
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
                    <div className="flex flex-col items-center justify-center py-20 gap-4 h-[50vh]">
                        <KarateLoader />
                    </div>
                ) : (
                    /* Events Grid */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        {filteredEvents.map((event, index) => {
                            const dateObj = formatDate(event.startDate);
                            return (
                                <Link href={`/events/${event.id}`} key={event.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group relative min-h-[280px] md:h-[300px] rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary/50 transition-colors active:scale-[0.98]"
                                >
                                    {/* Background Image */}
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

                                    {/* Content */}
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
                )}
            </div>
        </div>
    );
}
