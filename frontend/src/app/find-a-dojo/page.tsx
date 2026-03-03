'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Navigation,
  X,
  ChevronRight,
  ExternalLink,
  List,
  Map as MapIcon,
  Globe,
  Users,
  Building2,
  Filter,
  Clock,
  Shield,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import api from '@/lib/api';
import KarateLoader from '@/components/KarateLoader';
import Script from 'next/script';

interface Dojo {
  id: string;
  name: string;
  dojoCode: string;
  city: string;
  state?: string;
  country?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
}

// Major Indian cities fallback coordinates
const CITY_COORDS: Record<string, [number, number]> = {
  mumbai: [19.076, 72.8777],
  delhi: [28.6139, 77.209],
  'new delhi': [28.6139, 77.209],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  chandigarh: [30.7333, 76.7794],
  bhopal: [23.2599, 77.4126],
  patna: [25.6093, 85.1376],
  guwahati: [26.1445, 91.7362],
  thiruvananthapuram: [8.5241, 76.9366],
  kochi: [9.9312, 76.2673],
  indore: [22.7196, 75.8577],
  nagpur: [21.1458, 79.0882],
  coimbatore: [11.0168, 76.9558],
  visakhapatnam: [17.6868, 83.2185],
  surat: [21.1702, 72.8311],
  vadodara: [22.3072, 73.1812],
  noida: [28.5355, 77.391],
  gurgaon: [28.4595, 77.0266],
  gurugram: [28.4595, 77.0266],
  shuklaganj: [26.5123, 80.382],
  unnao: [26.5393, 80.488],
  kanpur: [26.4499, 80.3319],
  varanasi: [25.3176, 82.9739],
  agra: [27.1767, 78.0081],
  prayagraj: [25.4358, 81.8463],
  allahabad: [25.4358, 81.8463],
  gorakhpur: [26.7606, 83.3732],
  meerut: [28.9845, 77.7064],
  bareilly: [28.367, 79.4304],
  dehradun: [30.3165, 78.0322],
  bhilai: [21.2094, 81.4285],
  amritsar: [31.634, 74.8723],
  alipurduar: [26.4884, 89.5275],
  raipur: [21.2514, 81.6296],
  ludhiana: [30.901, 75.8573],
  jalandhar: [31.326, 75.5762],
  ranchi: [23.3441, 85.3096],
  bhubaneswar: [20.2961, 85.8245],
  gwalior: [26.2183, 78.1828],
  jodhpur: [26.2389, 73.0243],
  mysore: [12.2958, 76.6394],
  mysuru: [12.2958, 76.6394],
  mangalore: [12.9141, 74.856],
  mangaluru: [12.9141, 74.856],
  jammu: [32.7266, 74.857],
  srinagar: [34.0837, 74.7973],
  shimla: [31.1048, 77.1734],
  dharamsala: [32.219, 76.3234],
  siliguri: [26.7271, 88.3953],
  imphal: [24.817, 93.9368],
  shillong: [25.5788, 91.8933],
  dibrugarh: [27.4728, 94.912],
  tezpur: [26.6338, 92.8007],
};

export default function FindADojoPage() {
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDojo, setSelectedDojo] = useState<Dojo | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const fetchDojos = async () => {
      try {
        const response = await api.get('/dojos');
        setDojos(response.data.data.dojos);
      } catch (err) {
        console.error('Failed to fetch dojos', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDojos();

    // Request user location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {}, // Silently fail
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const filteredDojos = useMemo(
    () =>
      dojos.filter(
        (dojo) => {
          const matchesSearch =
            dojo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dojo.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (dojo.state && dojo.state.toLowerCase().includes(searchQuery.toLowerCase()));
          const matchesState = stateFilter === 'ALL' || dojo.state === stateFilter;
          return matchesSearch && matchesState;
        }
      ),
    [dojos, searchQuery, stateFilter]
  );

  // Get coordinates for a dojo
  const getDojoCoords = (dojo: Dojo): [number, number] | null => {
    if (dojo.latitude && dojo.longitude) return [dojo.latitude, dojo.longitude];
    const fallback = CITY_COORDS[dojo.city?.toLowerCase()];
    return fallback || null;
  };

  // Calculate distance between two coordinates (Haversine)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Sort dojos by distance if user location is available
  const sortedDojos = useMemo(() => {
    if (!userLocation) return filteredDojos;
    return [...filteredDojos].sort((a, b) => {
      const aCoords = getDojoCoords(a);
      const bCoords = getDojoCoords(b);
      if (!aCoords && !bCoords) return 0;
      if (!aCoords) return 1;
      if (!bCoords) return -1;
      const aDist = getDistance(userLocation[0], userLocation[1], aCoords[0], aCoords[1]);
      const bDist = getDistance(userLocation[0], userLocation[1], bCoords[0], bCoords[1]);
      return aDist - bDist;
    });
  }, [filteredDojos, userLocation]);

  const getDistanceLabel = (dojo: Dojo): string | null => {
    if (!userLocation) return null;
    const coords = getDojoCoords(dojo);
    if (!coords) return null;
    const dist = getDistance(userLocation[0], userLocation[1], coords[0], coords[1]);
    return dist < 1 ? `${Math.round(dist * 1000)}m away` : `${Math.round(dist)} km away`;
  };

  // Unique states for filter badges
  const states = useMemo(() => {
    const stateSet = new Set(dojos.map((d) => d.state).filter(Boolean));
    return Array.from(stateSet).sort() as string[];
  }, [dojos]);

  // Unique cities count
  const cityCount = useMemo(() => {
    return new Set(dojos.map((d) => d.city?.toLowerCase()).filter(Boolean)).size;
  }, [dojos]);

  // Initialize / update map
  useEffect(() => {
    if (isLoading || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapInstanceRef.current) {
        const center: [number, number] = userLocation || [22.5, 78.9]; // center of India
        const map = L.map(mapRef.current!, {
          center,
          zoom: userLocation ? 8 : 5,
          scrollWheelZoom: true,
          zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OSM & CARTO',
          maxZoom: 19,
        }).addTo(map);

        // User location marker
        if (userLocation) {
          const userIcon = L.divIcon({
            html: `<div style="width:16px;height:16px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(59,130,246,0.6);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            className: '',
          });
          L.marker(userLocation, { icon: userIcon })
            .addTo(map)
            .bindPopup('<b>Your Location</b>');
        }

        mapInstanceRef.current = map;
      }

      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const redIcon = L.divIcon({
        html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#ef4444,#991b1b);border-radius:50%;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">K</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
        className: '',
      });

      filteredDojos.forEach((dojo) => {
        const coords = getDojoCoords(dojo);
        if (!coords) return;

        const distLabel = getDistanceLabel(dojo);
        const marker = L.marker(coords, { icon: redIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(
            `<div style="min-width:220px;font-family:system-ui,sans-serif;padding:4px;">
              <h3 style="font-weight:900;font-size:15px;margin:0 0 4px;color:#111;">${dojo.name}</h3>
              <p style="color:#666;font-size:12px;margin:0 0 4px;">
                📍 ${dojo.address || dojo.city + (dojo.state ? ', ' + dojo.state : '')}
              </p>
              ${distLabel ? `<p style="color:#ef4444;font-size:11px;font-weight:700;margin:0 0 6px;">📏 ${distLabel}</p>` : ''}
              ${dojo.contactPhone ? `<p style="font-size:12px;margin:0 0 4px;">📞 ${dojo.contactPhone}</p>` : ''}
              <a href="/dojos/${dojo.id}" style="display:inline-block;margin-top:6px;color:#ef4444;font-weight:700;font-size:12px;text-decoration:none;">View Details →</a>
            </div>`
          );

        marker.on('click', () => setSelectedDojo(dojo));
        markersRef.current.push(marker);
      });
    };

    initMap();
  }, [isLoading, filteredDojos, userLocation]);

  // Pan to dojo on selection from sidebar
  const panToDojo = (dojo: Dojo) => {
    setSelectedDojo(dojo);
    const coords = getDojoCoords(dojo);
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.setView(coords, 13, { animate: true });
      // Open the popup for this marker
      markersRef.current.forEach((marker) => {
        const pos = marker.getLatLng();
        if (Math.abs(pos.lat - coords[0]) < 0.001 && Math.abs(pos.lng - coords[1]) < 0.001) {
          marker.openPopup();
        }
      });
    }
  };

  // Build JSON-LD structured data for all dojos
  const dojoStructuredData = dojos.map((dojo) => {
    const coords = getDojoCoords(dojo);
    return {
      '@type': 'SportsActivityLocation',
      name: dojo.name,
      description: `Kyokushin Karate dojo in ${dojo.city}${dojo.state ? ', ' + dojo.state : ''} — full-contact karate training for kids and adults.`,
      url: `https://kyokushinfoundation.com/dojos/${dojo.id}`,
      telephone: dojo.contactPhone || undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: dojo.city,
        addressRegion: dojo.state || undefined,
        addressCountry: 'IN',
      },
      ...(coords && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: coords[0],
          longitude: coords[1],
        },
      }),
      sport: 'Karate',
    };
  });

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden selection:bg-red-600 selection:text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_var(--tw-gradient-stops))] from-zinc-800/10 via-transparent to-transparent" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Structured Data */}
      {dojoStructuredData.length > 0 && (
        <Script
          id="dojo-locations-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: 'Kyokushin Karate Dojos in India',
              itemListElement: dojoStructuredData.map((item, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item,
              })),
            }),
          }}
        />
      )}

      <div className="relative z-10">
        {/* Hero Header */}
        <section className="relative pt-8 pb-4 md:pt-16 md:pb-8 px-4 overflow-hidden">
          {/* Animated radial glow behind heading */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              className="w-[600px] h-[400px] md:w-[900px] md:h-[500px] rounded-full opacity-20"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.4) 0%, rgba(220,38,38,0.08) 40%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          {/* Floating decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Floating Map Pins */}
            {[
              { x: '8%', y: '20%', delay: 0, size: 20 },
              { x: '88%', y: '25%', delay: 1.5, size: 16 },
              { x: '15%', y: '75%', delay: 3, size: 14 },
              { x: '82%', y: '70%', delay: 2, size: 18 },
              { x: '5%', y: '50%', delay: 4, size: 12 },
              { x: '92%', y: '50%', delay: 0.8, size: 14 },
            ].map((pin, i) => (
              <motion.div
                key={i}
                className="absolute text-red-600/20 hidden md:block"
                style={{ left: pin.x, top: pin.y }}
                animate={{
                  y: [-8, 8, -8],
                  rotate: [-5, 5, -5],
                  opacity: [0.15, 0.3, 0.15],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  delay: pin.delay,
                  ease: 'easeInOut',
                }}
              >
                <MapPin style={{ width: pin.size, height: pin.size }} />
              </motion.div>
            ))}

            {/* Decorative Kanku mark (abstract circle with cross) */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block"
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
            >
              <svg width="500" height="500" viewBox="0 0 500 500" className="opacity-[0.03]">
                <circle cx="250" cy="250" r="200" fill="none" stroke="white" strokeWidth="1" />
                <circle cx="250" cy="250" r="150" fill="none" stroke="white" strokeWidth="0.5" />
                <circle cx="250" cy="250" r="240" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="8 8" />
                <line x1="250" y1="10" x2="250" y2="490" stroke="white" strokeWidth="0.5" />
                <line x1="10" y1="250" x2="490" y2="250" stroke="white" strokeWidth="0.5" />
              </svg>
            </motion.div>

            {/* Corner accent lines */}
            <div className="absolute top-4 left-4 w-16 h-16 border-l border-t border-red-600/20 rounded-tl-lg hidden md:block" />
            <div className="absolute top-4 right-4 w-16 h-16 border-r border-t border-red-600/20 rounded-tr-lg hidden md:block" />
          </div>

          <div className="container mx-auto text-center max-w-3xl relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Enhanced Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-red-600/15 to-red-800/10 border border-red-500/25 text-red-400 text-xs font-bold uppercase tracking-[0.2em] mb-6 backdrop-blur-sm shadow-lg shadow-red-950/20"
              >
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </motion.span>
                {dojos.length} Dojos Across India
                <Sparkles className="w-3 h-3 text-red-500/60" />
              </motion.div>

              {/* Enhanced Heading */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-2">
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-block text-white/90"
                >
                  FIND A
                </motion.span>{' '}
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.35, type: 'spring', stiffness: 200 }}
                  className="inline-block relative"
                >
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-700">
                    DOJO
                  </span>
                  {/* Glow behind DOJO */}
                  <motion.span
                    className="absolute inset-0 blur-2xl bg-red-600/30 rounded-lg -z-0"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.span>{' '}
                <motion.span
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-block text-white/90"
                >
                  NEAR YOU
                </motion.span>
              </h1>

              {/* Decorative line under heading */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mx-auto mb-5 h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent"
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
              >
                Locate the nearest <span className="text-white/70 font-medium">Kyokushin Karate</span> training center and begin your martial arts journey.
              </motion.p>

              {/* Enhanced Search */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="relative max-w-xl mx-auto group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 via-red-500/10 to-red-600/20 blur-xl rounded-3xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 group-hover:border-red-500/30 group-focus-within:border-red-500/40 transition-all duration-300">
                  <Search className="absolute left-5 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                  <Input
                    placeholder="Search by city, state, or dojo name..."
                    className="w-full h-14 pl-14 pr-6 rounded-2xl bg-transparent border-none text-lg text-white placeholder:text-gray-500 focus:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-5 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </motion.div>

              {/* State badges */}
              {states.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="flex flex-wrap justify-center gap-2 mt-5"
                >
                  <button
                    onClick={() => { setStateFilter('ALL'); setSearchQuery(''); }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                      stateFilter === 'ALL' && !searchQuery
                        ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/25 scale-105'
                        : 'bg-zinc-900/80 border-white/10 text-gray-400 hover:border-red-500/30 hover:text-white hover:scale-105'
                    }`}
                  >
                    All States
                  </button>
                  {states.map((state, i) => (
                    <motion.button
                      key={state}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.65 + i * 0.05 }}
                      onClick={() => { setStateFilter(state); setSearchQuery(''); }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                        stateFilter === state
                          ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/25 scale-105'
                          : 'bg-zinc-900/80 border-white/10 text-gray-400 hover:border-red-500/30 hover:text-white hover:scale-105'
                      }`}
                    >
                      {state}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Stats Strip */}
        {!isLoading && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="px-4 pb-6"
          >
            <div className="container mx-auto max-w-4xl">
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {[
                  { icon: Building2, label: 'Total Dojos', value: dojos.length, color: 'text-red-400' },
                  { icon: Globe, label: 'States', value: states.length, color: 'text-amber-400' },
                  { icon: MapPin, label: 'Cities', value: cityCount, color: 'text-emerald-400' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 md:p-4 text-center group hover:border-white/10 transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
                    <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1.5 opacity-70 group-hover:opacity-100 transition-opacity`} />
                    <p className="text-xl md:text-2xl font-black text-white">{stat.value}</p>
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Main Content: Map + Sidebar */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 h-[50vh]">
            <KarateLoader />
          </div>
        ) : (
          <section className="px-4 pb-16">
            <div className="container mx-auto">
              {/* Mobile View Toggle */}
              <div className="lg:hidden flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">
                  <span className="text-white font-bold">{sortedDojos.length}</span> dojos found
                </p>
                <div className="flex bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setMobileView('list')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all ${
                      mobileView === 'list'
                        ? 'bg-red-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" /> List
                  </button>
                  <button
                    onClick={() => setMobileView('map')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all ${
                      mobileView === 'map'
                        ? 'bg-red-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5" /> Map
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-0 h-auto lg:h-[620px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
                {/* Sidebar - Dojo List */}
                <div className={`w-full lg:w-[400px] bg-zinc-950/80 backdrop-blur-sm overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/10 ${
                  mobileView === 'map' ? 'hidden lg:block' : ''
                } ${mobileView === 'list' ? 'max-h-[500px] lg:max-h-none' : 'max-h-[300px] lg:max-h-none'}`}>
                  {/* Sidebar Header */}
                  <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-xl p-4 border-b border-white/10 z-10">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        <span className="text-white font-bold">{sortedDojos.length}</span>{' '}
                        {sortedDojos.length === 1 ? 'dojo' : 'dojos'} found
                      </p>
                      {userLocation && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">
                          <Navigation className="w-3 h-3" /> Nearest first
                        </span>
                      )}
                    </div>
                  </div>

                  {sortedDojos.length === 0 ? (
                    <div className="p-10 text-center">
                      <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-7 h-7 text-gray-600" />
                      </div>
                      <p className="text-gray-400 font-medium text-sm">No dojos found</p>
                      <p className="text-gray-600 text-xs mt-1">Try a different search term or state</p>
                      <button
                        onClick={() => { setSearchQuery(''); setStateFilter('ALL'); }}
                        className="mt-4 text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {sortedDojos.map((dojo, index) => {
                        const distLabel = getDistanceLabel(dojo);
                        const isSelected = selectedDojo?.id === dojo.id;
                        const initials = dojo.name
                          .split(' ')
                          .filter((w) => w.length > 0)
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')
                          .toUpperCase();

                        return (
                          <motion.button
                            key={dojo.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(index * 0.03, 0.3) }}
                            onClick={() => panToDojo(dojo)}
                            className={`w-full text-left p-4 hover:bg-white/[0.03] transition-all group relative ${
                              isSelected
                                ? 'bg-red-600/10 border-l-[3px] border-l-red-500'
                                : 'border-l-[3px] border-l-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                                isSelected
                                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                  : 'bg-zinc-800 text-gray-400 group-hover:bg-red-600/20 group-hover:text-red-400'
                              }`}>
                                {initials}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-sm text-white truncate group-hover:text-red-400 transition-colors">
                                    {dojo.name}
                                  </h3>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-red-500/60 shrink-0" />
                                  <span className="truncate">
                                    {dojo.city}
                                    {dojo.state ? `, ${dojo.state}` : ''}
                                  </span>
                                </p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  {distLabel && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                                      <Navigation className="w-3 h-3" />
                                      {distLabel}
                                    </span>
                                  )}
                                  {dojo.dojoCode && (
                                    <span className="text-[10px] text-gray-600 font-mono bg-zinc-800/80 px-1.5 py-0.5 rounded">
                                      {dojo.dojoCode}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-all ${
                                isSelected ? 'text-red-400 translate-x-0.5' : 'text-gray-700 group-hover:text-gray-400'
                              }`} />
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Map */}
                <div className={`flex-1 relative ${
                  mobileView === 'list' ? 'hidden lg:block' : ''
                } min-h-[400px] lg:min-h-0`}>
                  <div ref={mapRef} className="w-full h-full" style={{ background: '#111118' }} />

                  {/* Map legend */}
                  <div className="absolute top-3 left-3 z-[500] bg-zinc-900/90 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 hidden md:flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-800 border border-white/50"></span>
                      <span className="text-gray-400">Dojo</span>
                    </span>
                    {userLocation && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-500 border border-white/50"></span>
                        <span className="text-gray-400">You</span>
                      </span>
                    )}
                  </div>

                  {/* Selected dojo detail overlay */}
                  <AnimatePresence>
                    {selectedDojo && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-[360px] z-[1000]"
                      >
                        <div className="bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
                          {/* Accent bar */}
                          <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />

                          <div className="p-5">
                            <button
                              onClick={() => setSelectedDojo(null)}
                              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>

                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-11 h-11 rounded-xl bg-red-600/20 flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5 text-red-400" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-black text-lg text-white leading-tight pr-8">{selectedDojo.name}</h3>
                                {selectedDojo.dojoCode && (
                                  <span className="text-[10px] text-gray-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded mt-1 inline-block">
                                    {selectedDojo.dojoCode}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <p className="text-sm text-gray-400 flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                {selectedDojo.address || `${selectedDojo.city}${selectedDojo.state ? ', ' + selectedDojo.state : ''}`}
                              </p>

                              {getDistanceLabel(selectedDojo) && (
                                <p className="text-sm text-emerald-400 font-bold flex items-center gap-2">
                                  <Navigation className="w-3.5 h-3.5" />
                                  {getDistanceLabel(selectedDojo)}
                                </p>
                              )}

                              {selectedDojo.contactPhone && (
                                <a
                                  href={`tel:${selectedDojo.contactPhone}`}
                                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5 text-red-500/70" />
                                  {selectedDojo.contactPhone}
                                </a>
                              )}
                              {selectedDojo.contactEmail && (
                                <a
                                  href={`mailto:${selectedDojo.contactEmail}`}
                                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors truncate"
                                >
                                  <Mail className="w-3.5 h-3.5 text-red-500/70" />
                                  {selectedDojo.contactEmail}
                                </a>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Link
                                href={`/dojos/${selectedDojo.id}`}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.97] shadow-lg shadow-red-600/20"
                              >
                                View Details <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                              {getDojoCoords(selectedDojo) && (
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${getDojoCoords(selectedDojo)![0]},${getDojoCoords(selectedDojo)![1]}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all"
                                  title="Get Directions"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-16"
              >
                <div className="relative overflow-hidden bg-zinc-900/50 border border-white/10 rounded-2xl max-w-4xl mx-auto">
                  {/* Decorative gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-amber-600/5 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                    {/* Left: Icons */}
                    <div className="hidden md:flex flex-col gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                        <Shield className="w-7 h-7 text-red-400" />
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-amber-600/10 border border-amber-600/20 flex items-center justify-center">
                        <Users className="w-7 h-7 text-amber-400" />
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center">
                        <Clock className="w-7 h-7 text-emerald-400" />
                      </div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                        NO DOJO NEAR YOU?
                      </h2>
                      <p className="text-gray-400 mb-6 max-w-lg">
                        We&apos;re expanding across India. Contact us about opening a dojo in your city, or register to begin your journey.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                        <Link
                          href="/contact"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-[0.97] shadow-lg shadow-red-600/20"
                        >
                          Contact Us <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                          href="/register"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all"
                        >
                          Register Online
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
