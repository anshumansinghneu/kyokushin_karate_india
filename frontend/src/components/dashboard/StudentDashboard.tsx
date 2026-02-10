import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Trophy, Activity, ChevronRight, User, CheckCircle, Clock, Zap, MapPin, FileText, Edit } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/contexts/ToastContext";

import MembershipCard from "./MembershipCard";
import BlogManager from "./BlogManager";
import BlogSubmission from "./BlogSubmission";

export default function StudentDashboard({ user }: { user: any }) {
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [nextEvent, setNextEvent] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number }>({ days: 0, hours: 0, minutes: 0 });

    const { checkAuth } = useAuthStore();
    const { showToast } = useToast();

    useEffect(() => {
        checkAuth(); // Refresh user data on mount
        const fetchEvents = async () => {
            try {
                const response = await api.get('/events');
                const events = response.data.data.events;
                setUpcomingEvents(events.slice(0, 3));

                // Find next event
                const futureEvents = events.filter((e: any) => new Date(e.startDate) > new Date());
                if (futureEvents.length > 0) {
                    setNextEvent(futureEvents[0]);
                }
            } catch (error) {
                console.error("Failed to fetch events", error);
            }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (!nextEvent) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const eventTime = new Date(nextEvent.startDate).getTime();
            const distance = eventTime - now;

            if (distance < 0) {
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [nextEvent]);

    const registeredEvents = user?.registrations || [];
    const tournamentResults = user?.tournamentResults || [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'blogs' | 'submit'>('overview');

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* Welcome Section */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <p className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-1">Dojo Dashboard</p>
                    <h1 className="text-5xl font-black text-white tracking-tight">
                        OSU, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">{user?.name?.split(' ')[0]}</span>
                    </h1>
                </div>
                <div className="flex gap-3 items-center">
                    <input
                        type="file"
                        id="profile-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const formData = new FormData();
                            formData.append('image', file);

                            try {
                                // 1. Upload Image
                                const uploadRes = await api.post('/upload?folder=profiles', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                const imageUrl = uploadRes.data.data.url;

                                // 2. Update User Profile
                                await api.patch('/users/updateMe', { profilePhotoUrl: imageUrl });

                                // 3. Refresh User Data
                                checkAuth();
                                showToast("Profile picture updated successfully!", "success");
                            } catch (error) {
                                console.error("Failed to upload profile picture", error);
                                showToast("Failed to upload profile picture", "error");
                            }
                        }}
                    />
                    <Button
                        onClick={() => document.getElementById('profile-upload')?.click()}
                        className="backdrop-blur-sm bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                        <User className="w-4 h-4 mr-2" /> Update Photo
                    </Button>

                    <Button
                        onClick={() => setActiveTab('overview')}
                        className={`backdrop-blur-sm border ${activeTab === 'overview' ? 'bg-red-600 border-red-600 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <Activity className="w-4 h-4 mr-2" /> Overview
                    </Button>
                    <Button
                        onClick={() => setActiveTab('blogs')}
                        className={`backdrop-blur-sm border ${activeTab === 'blogs' ? 'bg-red-600 border-red-600 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <FileText className="w-4 h-4 mr-2" /> My Blogs
                    </Button>
                    <Button
                        onClick={() => setActiveTab('submit')}
                        className={`backdrop-blur-sm border ${activeTab === 'submit' ? 'bg-red-600 border-red-600 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <Edit className="w-4 h-4 mr-2" /> Write Blog
                    </Button>
                </div>
            </motion.div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Membership & Stats (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">
                        <motion.div variants={itemVariants}>
                            <MembershipCard user={user} />
                        </motion.div>

                        {/* Quick Stats Grid */}
                        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                            <div className="glass-card p-4 flex flex-col items-center justify-center text-center group hover:border-red-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-2 group-hover:bg-red-500/20 transition-colors">
                                    <Activity className="w-5 h-5 text-red-500" />
                                </div>
                                <p className="text-2xl font-black text-white">{user?.currentBeltRank || 'White'}</p>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Current Rank</p>
                            </div>
                            <div className="glass-card p-4 flex flex-col items-center justify-center text-center group hover:border-blue-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                                    <Trophy className="w-5 h-5 text-blue-500" />
                                </div>
                                <p className="text-2xl font-black text-white">{tournamentResults.length}</p>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Tournaments</p>
                            </div>
                            <div className="glass-card p-4 flex flex-col items-center justify-center text-center group hover:border-green-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2 group-hover:bg-green-500/20 transition-colors">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                                <p className="text-2xl font-black text-white">{registeredEvents.length}</p>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Events</p>
                            </div>
                            <div className="glass-card p-4 flex flex-col items-center justify-center text-center group hover:border-yellow-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2 group-hover:bg-yellow-500/20 transition-colors">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                </div>
                                <p className="text-2xl font-black text-white">Active</p>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Status</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Middle/Right Column: Main Content (8 cols) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Next Event Hero Card */}
                        {nextEvent && (
                            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl border border-white/10 group">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 to-black/80 z-10" />
                                <div className="absolute inset-0 bg-[url('/training-bg.png')] bg-cover bg-center opacity-50 group-hover:scale-105 transition-transform duration-700" />

                                <div className="relative z-20 p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
                                    <div className="w-full md:w-auto">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold uppercase tracking-wider mb-4">
                                            <Clock className="w-3 h-3" /> Next Event
                                        </div>
                                        <h3 className="text-2xl md:text-4xl font-black text-white mb-2 leading-tight">{nextEvent.name}</h3>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-300 text-sm font-medium">
                                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(nextEvent.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {nextEvent.location}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-start">
                                        <div className="bg-black/40 backdrop-blur-md rounded-xl p-2 sm:p-3 text-center flex-1 md:flex-none md:min-w-[70px] border border-white/10">
                                            <span className="block text-2xl sm:text-3xl font-black text-white">{timeLeft.days}</span>
                                            <span className="text-[10px] uppercase text-gray-400 font-bold">Days</span>
                                        </div>
                                        <div className="bg-black/40 backdrop-blur-md rounded-xl p-2 sm:p-3 text-center flex-1 md:flex-none md:min-w-[70px] border border-white/10">
                                            <span className="block text-2xl sm:text-3xl font-black text-white">{timeLeft.hours}</span>
                                            <span className="text-[10px] uppercase text-gray-400 font-bold">Hrs</span>
                                        </div>
                                        <div className="bg-black/40 backdrop-blur-md rounded-xl p-2 sm:p-3 text-center flex-1 md:flex-none md:min-w-[70px] border border-white/10">
                                            <span className="block text-2xl sm:text-3xl font-black text-white">{timeLeft.minutes}</span>
                                            <span className="text-[10px] uppercase text-gray-400 font-bold">Mins</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Upcoming Events List */}
                            <motion.div variants={itemVariants} className="glass-card p-6 h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-red-500" />
                                        Upcoming
                                    </h3>
                                    <Link href="/events" className="text-xs font-bold text-gray-400 hover:text-white transition-colors">View All</Link>
                                </div>
                                <div className="space-y-4">
                                    {upcomingEvents.map((event, i) => (
                                        <Link href={`/events/${event.id}`} key={i} className="block group">
                                            <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                                <div className="w-12 h-12 rounded-lg bg-white/5 flex flex-col items-center justify-center border border-white/10 group-hover:border-red-500/50 transition-colors">
                                                    <span className="text-[10px] font-bold text-red-500 uppercase">{new Date(event.startDate).toLocaleString('default', { month: 'short' })}</span>
                                                    <span className="text-lg font-black text-white leading-none">{new Date(event.startDate).getDate()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-white truncate group-hover:text-red-500 transition-colors">{event.name}</h4>
                                                    <p className="text-xs text-gray-500 truncate">{event.location}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                                            </div>
                                        </Link>
                                    ))}
                                    {upcomingEvents.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No upcoming events.</p>}
                                </div>
                            </motion.div>

                            {/* Recent Achievements / Records */}
                            <motion.div variants={itemVariants} className="glass-card p-6 h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                        Achievements
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    {tournamentResults.slice(0, 3).map((result: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-8 rounded-full ${result.medal === 'GOLD' ? 'bg-yellow-500' :
                                                    result.medal === 'SILVER' ? 'bg-gray-300' :
                                                        result.medal === 'BRONZE' ? 'bg-orange-600' : 'bg-gray-700'
                                                    }`} />
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">{result.event.name}</h4>
                                                    <p className="text-xs text-gray-500">{result.categoryName}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-white">#{result.finalRank}</span>
                                        </div>
                                    ))}
                                    {tournamentResults.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No achievements yet.</p>}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'blogs' && (
                <motion.div variants={itemVariants}>
                    <BlogManager />
                </motion.div>
            )}

            {activeTab === 'submit' && (
                <motion.div variants={itemVariants}>
                    <BlogSubmission />
                </motion.div>
            )}
        </motion.div>
    );
}
