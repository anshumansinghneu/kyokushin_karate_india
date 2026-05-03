'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  X,
  Shield,
  User,
  Navigation,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import 'leaflet/dist/leaflet.css';

// Leaflet JS is loaded dynamically to avoid SSR "window is not defined" errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletType = any;

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */

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
  chiefInstructor?: string;
}

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
  shuklaganj: [26.4799, 80.2932],
  unnao: [26.5477, 80.4878],
  kanpur: [26.4499, 80.3319],
  varanasi: [25.3176, 82.9739],
  agra: [27.1767, 78.0081],
  prayagraj: [25.4358, 81.8463],
  gorakhpur: [26.7606, 83.3732],
  meerut: [28.9845, 77.7064],
  bareilly: [28.3670, 79.4304],
  dehradun: [30.3165, 78.0322],
  bhilai: [21.2094, 81.3784],
  amritsar: [31.6340, 74.8723],
  alipurduar: [26.4900, 89.5271],
  raipur: [21.2514, 81.6296],
  ludhiana: [30.9010, 75.8573],
  jalandhar: [31.3260, 75.5762],
  ranchi: [23.3441, 85.3096],
  bhubaneswar: [20.2961, 85.8245],
  gwalior: [26.2183, 78.1828],
  jodhpur: [26.2389, 73.0243],
  mysore: [12.2958, 76.6394],
  mangalore: [12.9141, 74.8560],
  jammu: [32.7266, 74.8570],
  srinagar: [34.0837, 74.7973],
  shimla: [31.1048, 77.1734],
  dharamsala: [32.2190, 76.3234],
  siliguri: [26.7271, 88.3953],
  imphal: [24.8170, 93.9368],
  shillong: [25.5788, 91.8933],
  dibrugarh: [27.4728, 94.9120],
  tezpur: [26.6528, 92.7926],
};

/* ------------------------------------------------------------------ */
/*  Custom pin marker CSS (injected once on mount)                     */
/* ------------------------------------------------------------------ */

const MARKER_STYLES = `
/* Base dojo pin */
/* Clean branded pin */
.dojo-pin {
  position: relative;
  width: 22px;
  height: 22px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Outer circle — red with white border */
.dojo-pin__core {
  position: relative;
  z-index: 2;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #ef4444, #b91c1c);
  border: 2.5px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 12px rgba(220,38,38,0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* Inner white dot for depth */
.dojo-pin__core::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: rgba(255,255,255,0.85);
}

/* Single subtle pulse ring */
.dojo-pin__pulse {
  position: absolute;
  z-index: 0;
  top: 50%;
  left: 50%;
  width: 22px;
  height: 22px;
  margin-top: -11px;
  margin-left: -11px;
  border-radius: 50%;
  border: 1.5px solid rgba(220, 38, 38, 0.3);
  animation: pin-pulse 3s ease-out infinite;
}

@keyframes pin-pulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(3); opacity: 0; }
}

/* Hover / active */
.dojo-pin.active {
  transform: scale(1.4);
  z-index: 1000 !important;
}
.dojo-pin.active .dojo-pin__core {
  box-shadow: 0 0 16px rgba(220,38,38,0.7), 0 0 32px rgba(220,38,38,0.3), 0 2px 8px rgba(0,0,0,0.5);
}
.dojo-pin.active .dojo-pin__pulse {
  border-color: rgba(220,38,38,0.5);
  animation-duration: 1.5s;
}

/* Remove leaflet default icon background */
.dojo-marker-icon {
  background: transparent !important;
  border: none !important;
}

/* Ctrl+scroll hint overlay */
.scroll-zoom-hint {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(2px);
}
.scroll-zoom-hint.visible {
  opacity: 1;
}

/* Hover preview popup */
.kyoku-popup .leaflet-popup-content-wrapper {
  background: rgba(0,0,0,0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(220,38,38,0.25);
  border-radius: 12px;
  box-shadow: 0 15px 40px rgba(0,0,0,0.6), 0 0 25px rgba(220,38,38,0.08);
  padding: 0;
  color: #fff;
}
.kyoku-popup .leaflet-popup-content {
  margin: 0;
  min-width: 200px;
}
.kyoku-popup .leaflet-popup-tip {
  background: rgba(0,0,0,0.92);
  border-right: 1px solid rgba(220,38,38,0.25);
  border-bottom: 1px solid rgba(220,38,38,0.25);
}
.kyoku-popup .leaflet-popup-close-button { display: none; }
.kyoku-popup-inner { padding: 14px; }
.kyoku-popup-badge {
  font-size: 8px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 2px;
  color: #dc2626; margin-bottom: 6px;
}
.kyoku-popup-name {
  font-size: 14px; font-weight: 800;
  text-transform: uppercase; margin-bottom: 4px; line-height: 1.2;
}
.kyoku-popup-loc {
  font-size: 11px; color: #888; margin-bottom: 10px;
}
.kyoku-popup-cta {
  display: block; width: 100%;
  padding: 8px; background: #dc2626; color: #fff;
  text-align: center; font-size: 10px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 2px;
  border-radius: 6px; border: none; cursor: pointer;
  transition: background 0.2s;
}
.kyoku-popup-cta:hover { background: #b91c1c; }

/* Zoom controls */
.leaflet-control-zoom {
  border: 1px solid rgba(220,38,38,0.15) !important;
  border-radius: 10px !important;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
}
.leaflet-control-zoom a {
  background: rgba(0,0,0,0.8) !important;
  color: #fff !important;
  border-color: rgba(220,38,38,0.1) !important;
  backdrop-filter: blur(10px);
  width: 36px !important;
  height: 36px !important;
  line-height: 36px !important;
  font-size: 16px !important;
}
.leaflet-control-zoom a:hover {
  background: rgba(220,38,38,0.15) !important;
  color: #dc2626 !important;
}
`;

/* ------------------------------------------------------------------ */
/*  DojoListCard                                                       */
/* ------------------------------------------------------------------ */

function DojoListCard({
  dojo,
  isActive,
  onHoverStart,
  onHoverEnd,
  onClick,
}: {
  dojo: Dojo;
  isActive: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
        isActive
          ? 'bg-white/[0.06] border-red-600/30 shadow-[0_0_15px_rgba(220,38,38,0.1)]'
          : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08]'
      }`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
    >
      {/* Red accent line */}
      <div className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-full transition-colors ${isActive ? 'bg-red-500' : 'bg-red-600/30 group-hover:bg-red-500/50'}`} />

      <div className="pl-2.5">
        <p className="text-[11px] font-semibold text-white leading-tight mb-1">
          {dojo.name}
        </p>
        <div className="flex items-center gap-1.5 text-[9px] text-zinc-500">
          <MapPin className="w-2.5 h-2.5 text-zinc-600" />
          <span>{dojo.city}{dojo.state ? `, ${dojo.state}` : ''}</span>
          {dojo.chiefInstructor && (
            <>
              <span className="text-zinc-700">&middot;</span>
              <span className="text-red-500/60">{dojo.chiefInstructor.split(' ')[0]}</span>
            </>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all ${isActive ? 'text-red-500 translate-x-0' : 'text-zinc-700 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FloatingDojoList                                                   */
/* ------------------------------------------------------------------ */

interface FloatingDojoListProps {
  dojos: Dojo[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  hoveredDojoId: string | null;
  selectedDojoId: string | null;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
  onSelect: (dojo: Dojo) => void;
  isLoading: boolean;
  isDetailOpen: boolean;
}

function FloatingDojoList({
  dojos,
  searchQuery,
  onSearchChange,
  hoveredDojoId,
  selectedDojoId,
  onHoverStart,
  onHoverEnd,
  onSelect,
  isLoading,
  isDetailOpen,
}: FloatingDojoListProps) {
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      className={`absolute top-20 sm:top-24 right-4 sm:right-6 lg:right-8 bottom-6 w-[280px] lg:w-[300px] z-20 hidden md:flex flex-col bg-black/70 backdrop-blur-2xl border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-opacity duration-300 ${isDetailOpen ? 'opacity-0 pointer-events-none' : ''}`}
    >
      {/* Search section */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search city, state, or instructor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[11px] text-white placeholder:text-zinc-600 focus:border-red-500/30 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Header row */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-white/[0.04]">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
          Dojos
        </span>
        <span className="text-[10px] font-bold text-red-500">
          {dojos.length} found
        </span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-white/10 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : dojos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Shield className="w-8 h-8 mb-2 opacity-40" />
            <span className="text-xs">No dojos found</span>
          </div>
        ) : (
          dojos.map((dojo) => (
            <DojoListCard
              key={dojo.id}
              dojo={dojo}
              isActive={dojo.id === hoveredDojoId || dojo.id === selectedDojoId}
              onHoverStart={() => onHoverStart(dojo.id)}
              onHoverEnd={onHoverEnd}
              onClick={() => onSelect(dojo)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  DojoDetailPanel                                                    */
/* ------------------------------------------------------------------ */

function DojoDetailPanel({
  dojo,
  onClose,
  getCoords,
}: {
  dojo: Dojo;
  onClose: () => void;
  getCoords: (d: Dojo) => [number, number] | null;
}) {
  const coords = getCoords(dojo);

  /* Close panel on Escape key */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Gradient dim overlay */}
      <motion.div
        key="detail-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[35] bg-gradient-to-l from-black/60 via-black/20 to-transparent pointer-events-auto"
        onClick={onClose}
      />

      {/* Slide-in card panel */}
      <motion.div
        key="detail-panel"
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-20 sm:top-24 right-4 sm:right-6 z-[40] w-[300px] sm:w-[320px] bg-black/[0.92] backdrop-blur-2xl border border-red-600/15 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(220,38,38,0.05)] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={dojo.name}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-red-600 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Card content — compact, no flex stretch */}
        <div className="p-4">
          {/* Branch badge */}
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-600 text-white font-extrabold uppercase tracking-[2px] rounded shadow-[0_0_12px_rgba(220,38,38,0.3)] w-fit mb-2.5"
            style={{ fontSize: '8px' }}
          >
            <Shield className="w-2.5 h-2.5" />
            Branch {dojo.dojoCode}
          </div>

          {/* Dojo name */}
          <h2 className="text-base font-black uppercase tracking-tight text-white leading-snug mb-2 pr-6">
            {dojo.name}
          </h2>

          {/* Meta — inline */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-[10px] text-zinc-400">
              <MapPin className="w-2.5 h-2.5" />
              {dojo.city}{dojo.state ? `, ${dojo.state}` : ''}
            </span>
            {dojo.chiefInstructor && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-[10px] text-zinc-400">
                <User className="w-2.5 h-2.5 text-red-500" />
                {dojo.chiefInstructor}
              </span>
            )}
          </div>

          {/* Info rows — tight */}
          <div className="space-y-1.5 mb-4">
            <div className="px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">Status</span>
              <span className="text-[10px] font-semibold text-emerald-400">Verified & Active</span>
            </div>
            {dojo.address && (
              <div className="px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center gap-2">
                <MapPin className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                <span className="text-[10px] text-zinc-300">{dojo.address}</span>
              </div>
            )}
            {dojo.contactEmail && (
              <div className="px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">Contact</span>
                <span className="text-[10px] text-zinc-300 truncate ml-2">{dojo.contactEmail}</span>
              </div>
            )}
          </div>

          {/* Action buttons — right below content */}
          <div className="space-y-2">
            <Link
              href={`/dojos/${dojo.id}`}
              className="block w-full text-center py-2.5 rounded-xl bg-white text-black font-extrabold text-[10px] uppercase tracking-[2px] hover:bg-zinc-200 transition-colors"
            >
              View Full Profile
            </Link>
            {coords && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 font-bold text-[10px] uppercase tracking-[2px] hover:bg-white/[0.08] transition-colors"
              >
                <Navigation className="w-3 h-3" />
                Directions
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function FindADojoPage() {
  /* ---- State (all existing state preserved) ---- */
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredDojoId, setHoveredDojoId] = useState<string | null>(null);
  const [selectedDojo, setSelectedDojo] = useState<Dojo | null>(null);
  const filteredDojos = useMemo(
    () =>
      dojos.filter((dojo) => {
        const q = searchQuery.toLowerCase();
        return (
          dojo.name.toLowerCase().includes(q) ||
          dojo.city.toLowerCase().includes(q) ||
          (dojo.state && dojo.state.toLowerCase().includes(q)) ||
          (dojo.chiefInstructor && dojo.chiefInstructor.toLowerCase().includes(q))
        );
      }),
    [dojos, searchQuery],
  );

  /* ---- Refs ---- */
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType>(null);
  const markersRef = useRef<Record<string, LeafletType>>({});
  const prevViewRef = useRef<{ center: LeafletType; zoom: number } | null>(null);
  const leafletRef = useRef<LeafletType>(null);

  /* ---- Coord helper (CITY_COORDS fallback preserved) ---- */
  const getDojoCoords = useCallback((dojo: Dojo): [number, number] | null => {
    if (dojo.latitude && dojo.longitude) return [dojo.latitude, dojo.longitude];
    const fallback = CITY_COORDS[dojo.city?.toLowerCase()];
    return fallback || null;
  }, []);

  /* ---- Inject marker styles once ---- */
  useEffect(() => {
    const id = 'dojo-pin-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = MARKER_STYLES;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  /* ---- Dark body background ---- */
  useEffect(() => {
    document.documentElement.style.background = '#000';
    return () => {
      document.documentElement.style.background = '';
    };
  }, []);

  /* ---- Fetch dojos (preserved) ---- */
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
  }, []);

  /* ---- Leaflet map init (dynamic import to avoid SSR window error) ---- */
  useEffect(() => {
    if (isLoading || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      leafletRef.current = L;

      if (!mapRef.current || mapInstanceRef.current) return;

      const indiaBounds = L.latLngBounds(
        [6.5, 68.0],
        [37.0, 97.5],
      );

      const map = L.map(mapRef.current, {
        center: [22.5, 82.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 17,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        dragging: true,
        maxBounds: indiaBounds,
        maxBoundsViscosity: 1.0,
      });

      map.fitBounds(indiaBounds, { padding: [20, 20] });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 17,
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setMapReady(false);
    };
  }, [isLoading]);

  /* ---- Sync markers with filteredDojos ---- */
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m: LeafletType) => m.remove());
    markersRef.current = {};

    const bounds = L.latLngBounds([]);

    filteredDojos.forEach((dojo) => {
      const coords = getDojoCoords(dojo);
      if (!coords) return;

      bounds.extend(coords);

      const pinHTML = `
        <div class="dojo-pin">
          <span class="dojo-pin__pulse"></span>
          <div class="dojo-pin__core"></div>
        </div>
      `;

      const icon = L.divIcon({
        html: pinHTML,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        className: 'dojo-marker-icon',
      });

      const marker = L.marker(coords, { icon }).addTo(map);

      const popupContent = `
        <div class="kyoku-popup-inner">
          <div class="kyoku-popup-badge">Branch ${dojo.dojoCode || 'N/A'}</div>
          <div class="kyoku-popup-name">${dojo.name}</div>
          <div class="kyoku-popup-loc">${dojo.city}${dojo.state ? `, ${dojo.state}` : ''}</div>
          <button class="kyoku-popup-cta" onclick="document.dispatchEvent(new CustomEvent('dojo-select', { detail: '${dojo.id}' }))">
            View Dojo →
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'kyoku-popup',
        closeButton: false,
        offset: [0, -20],
        autoPan: false,
      });

      marker.on('mouseover', () => {
        setHoveredDojoId(dojo.id);
        marker.openPopup();
      });
      marker.on('mouseout', () => {
        setHoveredDojoId(null);
        marker.closePopup();
      });
      marker.on('click', () => setSelectedDojo(dojo));

      markersRef.current[dojo.id] = marker;
    });

    // Fit map to markers
    if (Object.keys(markersRef.current).length > 0 && !selectedDojo) {
      if (Object.keys(markersRef.current).length === 1) {
        const onlyCoords = getDojoCoords(filteredDojos[0]);
        if (onlyCoords) map.setView(onlyCoords, 12, { animate: true, duration: 1 });
      } else if (searchQuery) {
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14, animate: true, duration: 1 });
      } else {
        map.fitBounds(L.latLngBounds([6.5, 68.0], [37.0, 97.5]), { padding: [20, 20], animate: true, duration: 1 });
      }
    }
  }, [filteredDojos, searchQuery, getDojoCoords, selectedDojo, mapReady]);

  /* ---- Hover sync: add/remove .active class on pin ---- */
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      if (!el) return;
      const pin = el.querySelector('.dojo-pin') as HTMLElement | null;
      if (!pin) return;

      const isActive = id === hoveredDojoId || id === selectedDojo?.id;
      pin.classList.toggle('active', isActive);
    });
  }, [hoveredDojoId, selectedDojo]);

  /* ---- Fly-to on selectedDojo change ---- */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedDojo) {
      // Save current view before flying
      prevViewRef.current = { center: map.getCenter(), zoom: map.getZoom() };

      const coords = getDojoCoords(selectedDojo);
      if (coords) {
        map.flyTo(coords, 14, { animate: true, duration: 1.2 });
      }
    } else if (prevViewRef.current) {
      // Restore previous view when deselecting
      map.flyTo(prevViewRef.current.center, prevViewRef.current.zoom, {
        animate: true,
        duration: 1.2,
      });
      prevViewRef.current = null;
    }
  }, [selectedDojo, getDojoCoords]);

  /* ---- Listen for popup CTA custom event ---- */
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail;
      const dojo = dojos.find((d) => d.id === id);
      if (dojo) setSelectedDojo(dojo);
    };
    document.addEventListener('dojo-select', handler);
    return () => document.removeEventListener('dojo-select', handler);
  }, [dojos]);

  /* ---- Render ---- */
  return (
    <div className="relative w-full h-screen overflow-hidden text-white font-sans selection:bg-red-600">
      {/* ============================================================ */}
      {/*  FULL-VIEWPORT MAP                                           */}
      {/* ============================================================ */}
      <div ref={mapRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Map edge vignettes for depth */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        {/* Top fade — helps title readability */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />
        {/* Left fade — helps title readability */}
        <div className="absolute top-0 bottom-0 left-0 w-60 bg-gradient-to-r from-black/40 to-transparent" />
        {/* Bottom subtle fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* ============================================================ */}
      {/*  LOADING OVERLAY                                             */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
          >
            <div className="w-14 h-14 border-[3px] border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/*  MASSIVE TITLE OVERLAY                                       */}
      {/* ============================================================ */}
      {/* ============================================================ */}
      {/*  TOP-LEFT TITLE                                              */}
      {/* ============================================================ */}
      <div className="absolute top-20 sm:top-24 left-4 sm:left-8 z-[8] pointer-events-none select-none">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="relative"
        >
          {/* Heading */}
          <h1
            className="font-black uppercase leading-[0.85]"
            style={{
              fontSize: 'clamp(2.2rem, 7vw, 5rem)',
              letterSpacing: '-0.03em',
            }}
          >
            <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">FIND</span><br />
            <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">YOUR</span><br />
            <span
              className="drop-shadow-[0_4px_25px_rgba(220,38,38,0.5)]"
              style={{
                background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >DOJO</span>
          </h1>

          {/* Red underglow behind DOJO */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 font-black uppercase leading-[0.85]"
            style={{
              fontSize: 'clamp(2.2rem, 7vw, 5rem)',
              letterSpacing: '-0.03em',
              color: 'rgba(220,38,38,0.1)',
              filter: 'blur(30px)',
              transform: 'translateY(5px)',
            }}
          >
            DOJO
          </div>

          {/* Tagline */}
          <p className="mt-3 text-[11px] sm:text-xs text-zinc-500 font-medium tracking-wide">
            Locate a Kyokushin dojo across India
          </p>

          {/* Red accent line */}
          <div className="mt-3 w-10 h-[2px] rounded-full bg-gradient-to-r from-red-600 to-red-600/0" />
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/*  FLOATING DOJO LIST PANEL                                    */}
      {/* ============================================================ */}
      <FloatingDojoList
        dojos={filteredDojos}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hoveredDojoId={hoveredDojoId}
        selectedDojoId={selectedDojo?.id ?? null}
        onHoverStart={setHoveredDojoId}
        onHoverEnd={() => setHoveredDojoId(null)}
        onSelect={setSelectedDojo}
        isLoading={isLoading}
        isDetailOpen={!!selectedDojo}
      />

      {/* ============================================================ */}
      {/*  MOBILE BOTTOM SHEET — DOJO LIST                             */}
      {/* ============================================================ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[20]">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-black/90 backdrop-blur-xl border-t border-red-600/15 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder="Search dojos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-red-600/[0.05] border border-red-600/10 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/30 transition-colors"
              />
            </div>
          </div>

          {/* Horizontal scrollable cards */}
          <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-none">
            {filteredDojos.slice(0, 10).map((dojo) => (
              <div
                key={dojo.id}
                onClick={() => setSelectedDojo(dojo)}
                className="flex-shrink-0 w-[200px] p-3 bg-red-600/[0.04] border border-red-600/[0.08] border-l-[3px] border-l-red-600 rounded-lg cursor-pointer active:scale-95 transition-transform"
              >
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-white mb-1 leading-tight line-clamp-2">
                  {dojo.name}
                </h4>
                <span className="text-[9px] text-zinc-500">
                  {dojo.city}{dojo.state ? `, ${dojo.state}` : ''}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/*  DOJO DETAIL SLIDE-IN PANEL                                  */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selectedDojo && (
          <DojoDetailPanel
            dojo={selectedDojo}
            onClose={() => setSelectedDojo(null)}
            getCoords={getDojoCoords}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
