"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Calendar } from "lucide-react";

export default function EventHistory({ user }: { user: any }) {
    // Combine registrations and tournament results if available
    // For now, we'll just use registrations as a proxy for history
    const history = user?.registrations?.map((reg: any) => ({
        id: reg.id,
        date: reg.event.startDate,
        title: reg.event.name,
        type: reg.event.type,
        result: reg.approvalStatus === 'APPROVED' ? 'Participated' : reg.approvalStatus,
        icon: reg.event.type === 'TOURNAMENT' ? Trophy : Calendar
    })) || [];

    // Sort by date desc
    history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="glass-card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Medal className="w-5 h-5 text-primary" />
                    Event History
                </h3>
            </div>

            <div className="relative border-l border-white/10 ml-3 space-y-8">
                {history.length === 0 ? (
                    <p className="text-gray-500 pl-6">No event history yet.</p>
                ) : (
                    history.map((event: any, i: number) => {
                        const Icon = event.icon;
                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative pl-6"
                            >
                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-black" />
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                                            {new Date(event.date).toLocaleDateString()} • {event.type}
                                        </p>
                                        <h4 className="font-bold text-white">{event.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {event.result === 'Participated' && <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">Participated</span>}
                                        {event.result === 'PENDING' && <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">Pending</span>}
                                        {event.result === 'REJECTED' && <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">Rejected</span>}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
