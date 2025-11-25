"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { MapPin, Calendar, ChevronRight } from "lucide-react";

export default function SeminarsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get('/events');
                // Filter for SEMINAR type
                const seminars = res.data.data.events.filter((e: any) => e.type === 'SEMINAR');
                setEvents(seminars);
            } catch (error) {
                console.error("Failed to fetch seminars", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl md:text-6xl font-black mb-4 text-center">
                    TRAINING <span className="text-red-600">SEMINARS</span>
                </h1>
                <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
                    Master your technique with world-class instructors.
                </p>

                {isLoading ? (
                    <div className="text-center text-gray-500">Loading seminars...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.length > 0 ? (
                            events.map((event) => (
                                <Link href={`/events/${event.id}`} key={event.id} className="group">
                                    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 hover:border-red-600/50 transition-all duration-300 h-full flex flex-col">
                                        <div className="h-48 bg-zinc-800 relative flex items-center justify-center">
                                            <div className="text-zinc-700 font-black text-6xl opacity-20">OSU</div>
                                            <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                SEMINAR
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center gap-2 text-red-500 font-bold text-sm mb-2">
                                                <Calendar size={14} />
                                                {new Date(event.startDate).toLocaleDateString()}
                                            </div>
                                            <h2 className="text-xl font-bold mb-2 group-hover:text-red-500 transition-colors">
                                                {event.name}
                                            </h2>
                                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                                                <MapPin size={14} />
                                                {event.location || "TBA"}
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 text-sm font-bold text-white group-hover:translate-x-2 transition-transform">
                                                VIEW DETAILS <ChevronRight size={14} className="text-red-500" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 border border-dashed border-white/10 rounded-2xl">
                                <p className="text-gray-500">No upcoming seminars scheduled.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
