"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Users, ArrowRight, ChevronRight, Star, Map, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";

export default function DojoListPage() {
    const [dojos, setDojos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        const fetchDojos = async () => {
            try {
                const response = await api.get('/dojos');
                setDojos(response.data.data.dojos);
            } catch (error) {
                console.error("Failed to fetch dojos", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDojos();
    }, []);

    const filteredDojos = dojos.filter(dojo =>
        dojo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dojo.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Initialize Leaflet map when switching to map view
    useEffect(() => {
        if (viewMode !== 'map' || isLoading || !mapRef.current) return;
        if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            return;
        }

        const initMap = async () => {
            const L = (await import('leaflet')).default;

            // Add Leaflet CSS via link tag
            if (!document.querySelector('link[href*="leaflet"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            const map = L.map(mapRef.current!, {
                center: [20.5937, 78.9629], // India center
                zoom: 5,
                scrollWheelZoom: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map);

            // Custom red marker
            const redIcon = L.divIcon({
                html: `<div style="width:32px;height:32px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:12px;">K</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
                className: '',
            });

            // Major Indian cities fallback coordinates
            const cityCoords: Record<string, [number, number]> = {
                'mumbai': [19.076, 72.8777], 'delhi': [28.6139, 77.209],
                'bangalore': [12.9716, 77.5946], 'bengaluru': [12.9716, 77.5946],
                'chennai': [13.0827, 80.2707], 'kolkata': [22.5726, 88.3639],
                'hyderabad': [17.385, 78.4867], 'pune': [18.5204, 73.8567],
                'ahmedabad': [23.0225, 72.5714], 'jaipur': [26.9124, 75.7873],
                'lucknow': [26.8467, 80.9462], 'chandigarh': [30.7333, 76.7794],
                'bhopal': [23.2599, 77.4126], 'patna': [25.6093, 85.1376],
                'guwahati': [26.1445, 91.7362], 'thiruvananthapuram': [8.5241, 76.9366],
                'kochi': [9.9312, 76.2673], 'indore': [22.7196, 75.8577],
                'nagpur': [21.1458, 79.0882], 'coimbatore': [11.0168, 76.9558],
                'visakhapatnam': [17.6868, 83.2185], 'surat': [21.1702, 72.8311],
                'vadodara': [22.3072, 73.1812], 'noida': [28.5355, 77.391],
                'gurgaon': [28.4595, 77.0266], 'gurugram': [28.4595, 77.0266],
            };

            filteredDojos.forEach(dojo => {
                const lat = dojo.latitude || cityCoords[dojo.city?.toLowerCase()]?.[0];
                const lng = dojo.longitude || cityCoords[dojo.city?.toLowerCase()]?.[1];
                if (lat && lng) {
                    L.marker([lat, lng], { icon: redIcon })
                        .addTo(map)
                        .bindPopup(`
                            <div style="min-width:200px;font-family:sans-serif;">
                                <h3 style="font-weight:900;font-size:16px;margin:0 0 4px;">${dojo.name}</h3>
                                <p style="color:#666;font-size:13px;margin:0 0 8px;">${dojo.address || dojo.city + ', ' + (dojo.state || '')}</p>
                                ${dojo.contactPhone ? `<p style="font-size:12px;margin:0;">📞 ${dojo.contactPhone}</p>` : ''}
                                <a href="/dojos/${dojo.id}" style="display:inline-block;margin-top:8px;color:#ef4444;font-weight:700;font-size:13px;text-decoration:none;">View Details →</a>
                            </div>
                        `);
                }
            });

            mapInstanceRef.current = map;
        };

        initMap();

        return () => {
            // Don't destroy map on re-renders, just when component unmounts
        };
    }, [viewMode, isLoading, filteredDojos]);

    return (
        <div className="min-h-screen w-full bg-black text-white relative overflow-hidden selection:bg-red-600 selection:text-white">
            {/* Background Elements */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black pointer-events-none" />
            <div className="fixed top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />

            <div className="container mx-auto px-4 py-24 relative z-10">
                {/* Header */}
                <div className="text-center mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-6xl md:text-8xl font-black tracking-tighter mb-6"
                    >
                        FIND YOUR <span className="text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900">DOJO</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto font-light"
                    >
                        Begin your journey. Locate the nearest Kyokushin Karate dojo and forge your spirit.
                    </motion.p>
                </div>

                {/* Floating Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="sticky top-8 z-50 max-w-2xl mx-auto mb-24"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative flex items-center bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50 transition-all group-hover:border-red-500/30">
                            <Search className="absolute left-6 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                            <Input
                                placeholder="Search by city or dojo name..."
                                className="w-full h-16 pl-16 pr-6 rounded-full bg-transparent border-none text-lg text-white placeholder:text-gray-500 focus:ring-0 focus:bg-transparent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* View Toggle */}
                <div className="flex justify-center gap-2 mb-12">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-gray-400 border border-white/10 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-4 h-4" /> Grid
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-gray-400 border border-white/10 hover:text-white'}`}
                    >
                        <Map className="w-4 h-4" /> Map View
                    </button>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 h-[50vh]">
                        <KarateLoader />
                    </div>
                ) : (
                    <>
                    {/* Map View */}
                    {viewMode === 'map' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mb-12"
                        >
                            <div
                                ref={mapRef}
                                className="w-full h-[500px] md:h-[600px] rounded-2xl border border-white/10 overflow-hidden"
                                style={{ background: '#1a1a1a' }}
                            />
                            <p className="text-center text-xs text-gray-500 mt-3">
                                Click markers to see dojo details • Dojos without coordinates shown in grid only
                            </p>
                        </motion.div>
                    )}

                    {/* Dojo Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <AnimatePresence>
                            {filteredDojos.map((dojo, index) => (
                                <Link href={`/dojos/${dojo.id}`} key={dojo.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group relative h-[500px] rounded-3xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 hover:border-red-600/50 transition-all duration-500 hover:shadow-2xl hover:shadow-red-900/20"
                                    >
                                        {/* Background Image */}
                                        <div className="absolute inset-0">
                                            <img
                                                src="/dojo-bg.png" // Fallback image
                                                alt={dojo.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale group-hover:grayscale-0"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                                        </div>

                                        {/* Content */}
                                        <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-wider">
                                                    {dojo.city}
                                                </span>
                                                <div className="flex items-center gap-1 text-yellow-500 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span className="text-xs font-bold">5.0</span>
                                                </div>
                                            </div>

                                            <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                                                <h3 className="text-3xl font-black text-white mb-2 leading-none uppercase italic">
                                                    {dojo.name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-gray-400 mb-6 group-hover:text-white transition-colors">
                                                    <MapPin className="w-4 h-4 text-red-600" />
                                                    <span className="text-sm font-medium">{dojo.address || `${dojo.city}, ${dojo.state}`}</span>
                                                </div>

                                                <div className="h-0 overflow-hidden group-hover:h-auto transition-all duration-500">
                                                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                                        Experience traditional training in a modern facility. Join us to push your limits.
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between border-t border-white/10 pt-6 mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex -space-x-2">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border border-black flex items-center justify-center text-[8px] text-white">
                                                                    {i}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-gray-400 ml-2">Active Members</span>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                                        <ArrowRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </AnimatePresence>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}
