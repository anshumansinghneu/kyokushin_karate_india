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
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet supports `duration` at runtime but @types/leaflet omits it
type AnimateOptions = L.ZoomPanOptions & { duration?: number };

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
.dojo-pin {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.dojo-pin__circle {
  position: relative;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #dc2626;
  border: 3px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 900;
  font-size: 16px;
  font-family: serif;
  box-shadow: 0 4px 14px rgba(0,0,0,0.45);
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

/* Pulsing ring behind the pin */
.dojo-pin__pulse {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  width: 36px;
  height: 36px;
  margin-top: -18px;
  margin-left: -18px;
  border-radius: 50%;
  border: 2px solid rgba(220, 38, 38, 0.5);
  animation: dojo-pulse 2.5s ease-out infinite;
}

@keyframes dojo-pulse {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

/* Active (hovered) state */
.dojo-pin.active .dojo-pin__circle {
  transform: scale(1.35);
  background: #991b1b;
  box-shadow: 0 0 24px rgba(220, 38, 38, 0.7), 0 6px 20px rgba(0,0,0,0.5);
}

.dojo-pin.active .dojo-pin__pulse {
  border-color: rgba(220, 38, 38, 0.8);
}

/* Remove leaflet default icon background */
.dojo-marker-icon {
  background: transparent !important;
  border: none !important;
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
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-red-600/[0.08] border border-red-600 shadow-[0_0_12px_rgba(220,38,38,0.15)]'
          : 'bg-red-600/[0.03] border border-transparent hover:bg-red-600/[0.06]'
      }`}
      style={{ borderLeft: '3px solid #dc2626' }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
    >
      <p
        className="font-bold uppercase tracking-wide text-white leading-tight"
        style={{ fontSize: '11px' }}
      >
        {dojo.name}
      </p>
      <div className="flex items-center gap-2 mt-1" style={{ fontSize: '9px', color: '#71717a' }}>
        <span>
          {dojo.city}
          {dojo.state ? `, ${dojo.state}` : ''}
        </span>
        {dojo.chiefInstructor && (
          <>
            <span>&middot;</span>
            <span>Sensei {dojo.chiefInstructor.split(' ')[0]}</span>
          </>
        )}
      </div>
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
      className={`absolute top-20 sm:top-24 right-4 sm:right-6 lg:right-8 bottom-6 w-[280px] lg:w-[300px] z-20 hidden md:flex flex-col bg-black/80 backdrop-blur-xl border border-red-600/[0.12] rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-300 ${isDetailOpen ? 'opacity-0 pointer-events-none' : ''}`}
    >
      {/* Search section */}
      <div className="p-3 border-b border-red-600/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search dojos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-red-600/[0.05] border border-red-600/10 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:border-red-500/30 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Header row */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span
          className="font-extrabold uppercase text-red-600"
          style={{ fontSize: '9px', letterSpacing: '3px' }}
        >
          Active Branches
        </span>
        <span
          className="px-2 py-0.5 bg-red-600/20 text-red-400 font-black rounded-md"
          style={{ fontSize: '10px' }}
        >
          {dojos.length}
        </span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
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

      {/* Slide-in panel */}
      <motion.div
        key="detail-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[380px] z-[40] bg-black/[0.92] backdrop-blur-2xl border-l border-red-600/20 shadow-[-20px_0_60px_rgba(0,0,0,0.6)]"
        role="dialog"
        aria-modal="true"
        aria-label={dojo.name}
      >
        {/* Close button – outside scroll wrapper so it stays visible */}
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-red-600 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 flex flex-col min-h-full overflow-y-auto">

          {/* Branch badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white font-extrabold uppercase tracking-[3px] rounded shadow-[0_0_20px_rgba(220,38,38,0.4)] w-fit mb-4"
            style={{ fontSize: '9px' }}
          >
            <Shield className="w-3.5 h-3.5" />
            OFFICIAL BRANCH {dojo.dojoCode}
          </div>

          {/* Dojo name */}
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight mb-5">
            {dojo.name}
          </h2>

          {/* Meta tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {/* Location pill */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-600/[0.06] border border-red-600/10 rounded-lg text-xs text-zinc-300">
              <MapPin className="w-3 h-3 text-zinc-400" />
              {dojo.city}{dojo.state ? `, ${dojo.state}` : ''}
            </span>
            {/* Instructor pill */}
            {dojo.chiefInstructor && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-600/[0.06] border border-red-600/10 rounded-lg text-xs text-zinc-300">
                <User className="w-3 h-3 text-red-500" />
                Sensei {dojo.chiefInstructor}
              </span>
            )}
          </div>

          {/* Info rows */}
          <div className="space-y-3 flex-1 mb-6">
            {/* Status row */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
              <span className="text-xs text-zinc-500">Status</span>
              <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>
                Verified &amp; Active
              </span>
            </div>

            {/* Address row */}
            {dojo.address && (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-3">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="text-xs text-zinc-300">{dojo.address}</span>
              </div>
            )}

            {/* Contact row */}
            {dojo.contactEmail && (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                <span className="text-xs text-zinc-500">Contact</span>
                <span className="text-xs text-zinc-300">{dojo.contactEmail}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3 mt-auto">
            {/* View Full Profile */}
            <Link
              href={`/dojos/${dojo.id}`}
              className="block w-full text-center py-4 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-[2px] hover:bg-zinc-200 transition-colors"
            >
              View Full Profile
            </Link>

            {/* Get Directions */}
            {coords && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 font-extrabold text-xs uppercase tracking-[2px] hover:bg-white/[0.08] transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
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
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const prevViewRef = useRef<{ center: L.LatLng; zoom: number } | null>(null);

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

  /* ---- Leaflet map init ---- */
  useEffect(() => {
    if (isLoading || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [22.5, 78.9],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isLoading]);

  /* ---- Sync markers with filteredDojos ---- */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const bounds = L.latLngBounds([]);

    filteredDojos.forEach((dojo) => {
      const coords = getDojoCoords(dojo);
      if (!coords) return;

      bounds.extend(coords);

      const pinHTML = `
        <div class="dojo-pin" data-dojo-id="${dojo.id}">
          <span class="dojo-pin__pulse"></span>
          <span class="dojo-pin__circle">\u6975</span>
        </div>
      `;

      const icon = L.divIcon({
        html: pinHTML,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
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
        if (onlyCoords) map.setView(onlyCoords, 12, { animate: true, duration: 1 } as AnimateOptions);
      } else if (searchQuery) {
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14, animate: true, duration: 1 } as AnimateOptions);
      } else {
        map.setView([22.5, 78.9], 4, { animate: true, duration: 1 } as AnimateOptions);
      }
    }
  }, [filteredDojos, searchQuery, getDojoCoords, selectedDojo]);

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
      {/*  FLOATING TITLE BLOCK                                        */}
      {/* ============================================================ */}
      <div className="absolute top-20 sm:top-24 left-4 z-30 pointer-events-none select-none">
        {/* Kanji watermark */}
        <span
          aria-hidden="true"
          className="absolute -top-8 -left-4 text-[8rem] sm:text-[10rem] lg:text-[14rem] font-black leading-none text-red-600/10"
          style={{ fontFamily: 'serif' }}
        >
          極
        </span>

        <div className="relative pointer-events-auto">
          {/* Official Registry badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded bg-red-600 text-white text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg">
            <Shield className="w-3.5 h-3.5" />
            Official Registry
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-black uppercase tracking-tight text-white leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            Find Your<br />Dojo
          </h1>
        </div>
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
