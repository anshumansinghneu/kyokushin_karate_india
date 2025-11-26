"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Users, Calendar, ArrowLeft, Star, Loader2, Trophy, Medal } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";

interface Instructor {
    id: string;
    name: string;
    role: string;
    currentBeltRank: string;
    profilePhotoUrl: string | null;
}

interface Event {
    id: string;
    name: string;
    type: string;
    startDate: string;
    description: string;
}

interface Dojo {
    id: string;
    name: string;
    city: string;
    state: string;
    address: string;
    instructors: Instructor[];
    gallery: any[];
    events: Event[];
}

export default function DojoDetailPage() {
    const params = useParams();
    const [dojo, setDojo] = useState<Dojo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDojo = async () => {
            try {
                console.log('Fetching dojo with ID:', params.id);
                const response = await api.get(`/dojos/${params.id}`);
                console.log('Dojo response:', response.data);
                setDojo(response.data.data.dojo);
            } catch (err: any) {
                console.error("Failed to fetch dojo", err);
                console.error("Error response:", err.response?.data);
                console.error("Error status:", err.response?.status);
                const errorMessage = err.response?.data?.message || "Failed to load dojo details.";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchDojo();
        }
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <KarateLoader />
            </div>
        );
    }

    if (error || !dojo) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
                <h2 className="text-2xl font-bold mb-4 text-red-500">{error || "Dojo not found"}</h2>
                <p className="text-gray-400 mb-6 text-center max-w-md">
                    Check the browser console for more details. The dojo with ID <code className="bg-zinc-800 px-2 py-1 rounded">{params.id}</code> could not be loaded.
                </p>
                <Link href="/dojos">
                    <Button variant="outline">Back to Dojos</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-x-hidden selection:bg-red-600 selection:text-white">
            {/* IMMERSIVE HEADER */}
            <div className="relative h-[80vh] w-full">
                <div className="absolute inset-0">
                    <Image src="/dojo-bg.png" alt="Dojo training facility" fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black" />
                </div>

                <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-20 z-10">
                    <Link href="/dojos" className="absolute top-8 left-4 md:left-8 text-white/70 hover:text-white flex items-center gap-2 transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-black/40">
                        <ArrowLeft className="w-4 h-4" /> Back to Dojos
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-4 py-1.5 rounded-full bg-red-600 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-red-900/50">
                                {dojo.city}
                            </span>
                            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                <span className="font-bold">5.0</span>
                                <span className="text-white/60 text-sm ml-1">Verified Dojo</span>
                            </div>
                        </div>
                        <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-6 leading-none uppercase">
                            {dojo.name}
                        </h1>
                        <div className="flex flex-col md:flex-row md:items-center gap-6 text-lg text-gray-300">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-600" />
                                {dojo.address || `${dojo.city}, ${dojo.state}`}
                            </div>
                            <div className="hidden md:block w-1 h-1 bg-gray-500 rounded-full" />
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-red-600" />
                                <span>Active Community</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* CLEAN GRID LAYOUT */}
            <div className="container mx-auto px-4 py-12 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN - Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* About Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8"
                        >
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <span className="w-1 h-7 bg-red-600 rounded-full" />
                                About the Dojo
                            </h2>
                            <p className="text-gray-300 text-base leading-relaxed">
                                Welcome to {dojo.name}, a premier destination for Kyokushin Karate training in {dojo.city}.
                                We are dedicated to fostering strength, discipline, and spirit through traditional martial arts practice.
                                Our facility is equipped with state-of-the-art training gear while maintaining the traditional atmosphere of a true dojo.
                            </p>
                        </motion.div>

                        {/* Gallery Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8"
                        >
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-1 h-7 bg-red-600 rounded-full" />
                                Gallery
                            </h2>
                            <div className="grid grid-cols-3 gap-4">
                                {dojo.gallery.length > 0 ? (
                                    dojo.gallery.slice(0, 6).map((photo: any, index: number) => (
                                        <div key={index} className="aspect-square rounded-xl overflow-hidden bg-zinc-800">
                                            <img src={photo.url} alt={`Dojo ${index + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        <div className="aspect-square rounded-xl bg-zinc-800 flex items-center justify-center">
                                            <span className="text-gray-500 text-sm">No Img</span>
                                        </div>
                                        <div className="aspect-square rounded-xl bg-zinc-800 flex items-center justify-center">
                                            <span className="text-gray-500 text-sm">No Img</span>
                                        </div>
                                        <div className="aspect-square rounded-xl bg-zinc-800 flex items-center justify-center">
                                            <span className="text-gray-500 text-sm">No Img</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN - Sidebar */}
                    <div className="lg:col-span-1 space-y-8">

                        {/* Location Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-500" /> Location
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-300 font-semibold">{dojo.city}, {dojo.state}</p>
                                {dojo.address && (
                                    <p className="text-gray-400 leading-relaxed">{dojo.address}</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Upcoming Events Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-red-500" />
                                    <span className="font-bold">Upcoming Events</span>
                                </div>
                                <Link href="/events" className="text-xs text-red-500 hover:text-red-400 transition-colors font-semibold">View All</Link>
                            </div>

                            <div className="space-y-3">
                            {dojo.events.length > 0 ? (
                                dojo.events.slice(0, 3).map((event) => (
                                    <Link key={event.id} href={`/events/${event.id}`}>
                                        <div className="group p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 hover:border-red-600/30 transition-all cursor-pointer">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">{event.type}</span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-2">
                                                {event.name}
                                            </h4>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                    <p className="text-sm">No upcoming events</p>
                                </div>
                            )}
                        </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
