'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';

interface Event {
    id: string;
    type: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    location?: string;
    status: string;
    memberFee: number;
    nonMemberFee: number;
    registrationDeadline: string;
    dojo?: { name: string; city: string } | null;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    TOURNAMENT: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500', border: 'border-red-500/30' },
    CAMP: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500', border: 'border-blue-500/30' },
    SEMINAR: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-500', border: 'border-purple-500/30' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    useEffect(() => {
        api.get('/events')
            .then(res => setEvents(res.data.data.events))
            .catch(err => console.error('Failed to load events:', err))
            .finally(() => setLoading(false));
    }, []);

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
        setSelectedDate(null);
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
        setSelectedDate(null);
    };

    const goToToday = () => {
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
        setSelectedDate(null);
    };

    // Group events by date
    const eventsByDate = useMemo(() => {
        const map: Record<string, Event[]> = {};
        events.forEach(event => {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            // Spread multi-day events across all days
            const d = new Date(start);
            while (d <= end) {
                const key = d.toISOString().slice(0, 10);
                if (!map[key]) map[key] = [];
                if (!map[key].find(e => e.id === event.id)) {
                    map[key].push(event);
                }
                d.setDate(d.getDate() + 1);
            }
        });
        return map;
    }, [events]);

    // Events for selected date
    const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

    // Upcoming events (for list view)
    const upcomingEvents = useMemo(() => {
        return events
            .filter(e => new Date(e.startDate) >= new Date(today.toISOString().slice(0, 10)))
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [events, today]);

    // Calendar grid
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const todayStr = today.toISOString().slice(0, 10);

    const calendarDays = useMemo(() => {
        const days: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);
        return days;
    }, [firstDay, daysInMonth]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 pt-28 pb-16">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                                <CalendarIcon className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black">Event Calendar</h1>
                                <p className="text-gray-400 text-sm">Tournaments, camps & seminars</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* View toggle */}
                            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'calendar' ? 'bg-red-500 text-white' : 'text-gray-400'}`}
                                >
                                    Calendar
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'list' ? 'bg-red-500 text-white' : 'text-gray-400'}`}
                                >
                                    List
                                </button>
                            </div>
                            {/* Legend */}
                            <div className="hidden sm:flex items-center gap-3 ml-2">
                                {Object.entries(TYPE_COLORS).map(([type, colors]) => (
                                    <span key={type} className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                                        {type.charAt(0) + type.slice(1).toLowerCase()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : viewMode === 'calendar' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Calendar */}
                            <div className="lg:col-span-2 glass-card p-6">
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between mb-6">
                                    <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="text-center">
                                        <h2 className="text-xl font-bold">{MONTHS[currentMonth]} {currentYear}</h2>
                                        <button onClick={goToToday} className="text-xs text-red-400 hover:text-red-300 mt-1">
                                            Today
                                        </button>
                                    </div>
                                    <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {DAYS.map(day => (
                                        <div key={day} className="text-center text-xs font-bold text-gray-500 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((day, i) => {
                                        if (day === null) {
                                            return <div key={`empty-${i}`} className="aspect-square" />;
                                        }
                                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const dayEvents = eventsByDate[dateStr] || [];
                                        const isToday = dateStr === todayStr;
                                        const isSelected = dateStr === selectedDate;

                                        return (
                                            <button
                                                key={dateStr}
                                                onClick={() => setSelectedDate(dateStr)}
                                                className={`aspect-square rounded-xl p-1 sm:p-2 flex flex-col items-center justify-start gap-0.5 transition-all relative
                                                    ${isToday ? 'ring-2 ring-red-500' : ''}
                                                    ${isSelected ? 'bg-red-500/20 border border-red-500/40' : 'hover:bg-white/5 border border-transparent'}
                                                `}
                                            >
                                                <span className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-red-400' : 'text-gray-300'}`}>
                                                    {day}
                                                </span>
                                                {/* Event dots */}
                                                {dayEvents.length > 0 && (
                                                    <div className="flex gap-0.5 flex-wrap justify-center">
                                                        {dayEvents.slice(0, 3).map((event, j) => (
                                                            <span
                                                                key={j}
                                                                className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[event.type]?.dot || 'bg-gray-500'}`}
                                                            />
                                                        ))}
                                                        {dayEvents.length > 3 && (
                                                            <span className="text-[8px] text-gray-500">+{dayEvents.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Event Details Sidebar */}
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold mb-4">
                                    {selectedDate
                                        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
                                        : 'Select a date'
                                    }
                                </h3>
                                <AnimatePresence mode="wait">
                                    {selectedDate && selectedEvents.length > 0 ? (
                                        <motion.div
                                            key={selectedDate}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-3"
                                        >
                                            {selectedEvents.map(event => {
                                                const colors = TYPE_COLORS[event.type] || TYPE_COLORS.TOURNAMENT;
                                                return (
                                                    <Link href={`/events/${event.id}`} key={event.id}>
                                                        <div className={`p-4 rounded-xl ${colors.bg} border ${colors.border} hover:scale-[1.02] transition-transform cursor-pointer`}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                                                <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                                                                    {event.type}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-bold text-white text-sm">{event.name}</h4>
                                                            {event.location && (
                                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                                    <MapPin className="w-3 h-3" /> {event.location}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                                {event.startDate !== event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </motion.div>
                                    ) : selectedDate ? (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-gray-500 text-sm text-center py-8"
                                        >
                                            No events on this day
                                        </motion.p>
                                    ) : (
                                        <p className="text-gray-500 text-sm text-center py-8">
                                            Click a date to see events
                                        </p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : (
                        /* List View */
                        <div className="space-y-4">
                            {upcomingEvents.length === 0 ? (
                                <div className="text-center py-20">
                                    <CalendarIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                                    <p className="text-gray-500 text-lg">No upcoming events</p>
                                </div>
                            ) : (
                                upcomingEvents.map((event, i) => {
                                    const colors = TYPE_COLORS[event.type] || TYPE_COLORS.TOURNAMENT;
                                    const startDate = new Date(event.startDate);

                                    return (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                        >
                                            <Link href={`/events/${event.id}`}>
                                                <div className="glass-card p-5 hover:bg-white/5 transition-colors flex items-center gap-4">
                                                    {/* Date Badge */}
                                                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                                                        <span className="text-xs text-gray-400 font-bold uppercase">
                                                            {startDate.toLocaleDateString('en-IN', { month: 'short' })}
                                                        </span>
                                                        <span className="text-2xl font-black text-white">
                                                            {startDate.getDate()}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                                            <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                                                                {event.type}
                                                            </span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${event.status === 'UPCOMING' ? 'bg-green-500/10 text-green-400' : event.status === 'ONGOING' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                                                {event.status}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-white truncate">{event.name}</h3>
                                                        {event.location && (
                                                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1 truncate">
                                                                <MapPin className="w-3 h-3 flex-shrink-0" /> {event.location}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-sm font-bold text-white">₹{event.memberFee}</p>
                                                        <p className="text-xs text-gray-500">Member Fee</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
