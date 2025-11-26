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

            {/* BENTO GRID LAYOUT */}
            <div className="container mx-auto px-4 py-12 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

                    {/* AREA A: About (Large Text) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="md:col-span-2 lg:col-span-2 row-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-red-600/5 rounded-full blur-3xl group-hover:bg-red-600/10 transition-colors duration-700" />
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 relative z-10">
                            <span className="w-1 h-6 bg-red-600 rounded-full" />
                            About the Dojo
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed relative z-10">
                            Welcome to {dojo.name}, a premier destination for Kyokushin Karate training in {dojo.city}.
                            We are dedicated to fostering strength, discipline, and spirit through traditional martial arts practice.
                            Our facility is equipped with state-of-the-art training gear while maintaining the traditional atmosphere of a true dojo.
                        </p>
                        <div className="mt-8 flex gap-4 relative z-10">
                            <Link href="/register">
                                <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-8 font-bold">
                                    Join Now
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* AREA B: Head Instructor */}
                    {dojo.instructors.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="md:col-span-1 lg:col-span-1 row-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden relative group"
                        >
                            <img
                                src={dojo.instructors[0].profilePhotoUrl || "/instructor-placeholder.jpg"}
                                alt={dojo.instructors[0].name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <p className="text-red-500 font-bold text-sm uppercase tracking-wider mb-1">Head Instructor</p>
                                <h3 className="text-2xl font-black text-white leading-tight mb-2">{dojo.instructors[0].name}</h3>
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md w-fit px-3 py-1 rounded-full border border-white/10">
                                    <Medal className="w-3 h-3 text-yellow-500" />
                                    <span className="text-xs font-bold">{dojo.instructors[0].currentBeltRank}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* AREA C: Location Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="md:col-span-1 lg:col-span-1 bg-red-900/20 border border-red-500/20 rounded-3xl p-6 flex flex-col justify-center"
                    >
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-500" /> Location
                        </h3>
                        <div className="space-y-3 text-sm">
                            <p className="text-gray-300">{dojo.city}, {dojo.state}</p>
                            {dojo.address && <p className="text-gray-300 break-all">{dojo.address}</p>}
                        </div>
                    </motion.div>

                    {/* AREA D: Upcoming Events */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-2 lg:col-span-2 row-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-8 overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-red-600" />
                                Upcoming Events
                            </h2>
                            <Link href="/events" className="text-sm text-gray-400 hover:text-white transition-colors">View All</Link>
                        </div>

                        <div className="space-y-4">
                            {dojo.events.length > 0 ? (
                                dojo.events.slice(0, 3).map((event) => (
                                    <Link key={event.id} href={`/events/${event.id}`}>
                                        <div className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-red-600/30 transition-all cursor-pointer">
                                            <div className="bg-zinc-800 rounded-xl p-3 text-center min-w-[60px]">
                                                <span className="block text-xs text-gray-400 uppercase">
                                                    {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                                                </span>
                                                <span className="block text-xl font-bold text-white">
                                                    {new Date(event.startDate).getDate()}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">{event.type}</span>
                                                <h3 className="text-lg font-bold text-white group-hover:text-red-500 transition-colors">{event.name}</h3>
                                            </div>
                                            <ArrowLeft className="w-5 h-5 text-gray-500 rotate-180 group-hover:text-white transition-colors" />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                    No upcoming events.
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* AREA E: Gallery Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="md:col-span-1 lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-6"
                    >
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-red-500" /> Gallery
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {dojo.gallery.length > 0 ? (
                                dojo.gallery.slice(0, 3).map((item, i) => (
                                    <div key={item.id || i} className="aspect-square rounded-lg overflow-hidden bg-zinc-800">
                                        <img src={item.imageUrl} alt="Gallery" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                                    </div>
                                ))
                            ) : (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                                        <span className="text-xs text-gray-600">No Img</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
