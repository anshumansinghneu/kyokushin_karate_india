"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Flame } from "lucide-react";
import api from "@/lib/api";

export default function TrainingLog() {
    const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalHours: 0, sessionCount: 0 });

    useEffect(() => {
        const fetchTrainingData = async () => {
            try {
                const response = await api.get('/training');
                const sessions = response.data.data.sessions;

                // Process sessions to get weekly activity (last 7 days)
                const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                const today = new Date();
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(today);
                    d.setDate(d.getDate() - (6 - i));
                    return d;
                });

                const activity = last7Days.map(date => {
                    const dateStr = date.toISOString().split('T')[0];
                    const daySessions = sessions.filter((s: any) => s.date.startsWith(dateStr));
                    const totalDuration = daySessions.reduce((acc: number, s: any) => acc + s.duration, 0) / 60; // hours

                    // Determine intensity based on max intensity of the day
                    let intensity = 'rest';
                    if (daySessions.length > 0) {
                        if (daySessions.some((s: any) => s.intensity === 'HIGH')) intensity = 'high';
                        else if (daySessions.some((s: any) => s.intensity === 'MEDIUM')) intensity = 'medium';
                        else intensity = 'low';
                    }

                    return {
                        day: days[date.getDay()],
                        hours: totalDuration,
                        intensity
                    };
                });

                setWeeklyActivity(activity);

                // Calculate totals
                const totalHours = sessions.reduce((acc: number, s: any) => acc + s.duration, 0) / 60;
                setStats({
                    totalHours: Math.round(totalHours * 10) / 10,
                    sessionCount: sessions.length
                });

            } catch (error) {
                console.error("Failed to fetch training logs", error);
            }
        };
        fetchTrainingData();
    }, []);

    const maxHours = Math.max(...weeklyActivity.map(d => d.hours), 1); // Avoid divide by zero

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Training Log
                </h3>
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full">
                    <Flame className="w-3 h-3" /> {stats.sessionCount > 0 ? "Active" : "No Activity"}
                </div>
            </div>

            <div className="flex items-end justify-between h-40 gap-2">
                {weeklyActivity.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 w-full">
                        <div className="relative w-full bg-white/5 rounded-t-lg h-32 flex items-end overflow-hidden group">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(day.hours / maxHours) * 100}% ` }}
                                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                                className={`w - full rounded - t - lg relative ${day.intensity === 'high' ? 'bg-primary' :
                                    day.intensity === 'medium' ? 'bg-blue-500' :
                                        day.intensity === 'low' ? 'bg-green-500' :
                                            'bg-transparent'
                                    } `}
                            >
                                {day.hours > 0 && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                )}
                            </motion.div>

                            {/* Tooltip */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                {day.hours.toFixed(1)} hrs
                            </div>
                        </div>
                        <span className="text-xs font-bold text-gray-500">{day.day}</span>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-gray-500 uppercase font-bold">Total Hours</p>
                    <p className="text-2xl font-black text-white">{stats.totalHours} <span className="text-sm text-gray-500 font-normal">hrs</span></p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-gray-500 uppercase font-bold">Sessions</p>
                    <p className="text-2xl font-black text-white">{stats.sessionCount} <span className="text-sm text-gray-500 font-normal">classes</span></p>
                </div>
            </div>
        </div>
    );
}
