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
  Crosshair,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
`;

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

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
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

      marker.on('mouseover', () => setHoveredDojoId(dojo.id));
      marker.on('mouseout', () => setHoveredDojoId(null));
      marker.on('click', () => setSelectedDojo(dojo));

      markersRef.current[dojo.id] = marker;
    });

    // Fit map to markers
    if (Object.keys(markersRef.current).length > 0 && !selectedDojo) {
      if (Object.keys(markersRef.current).length === 1) {
        const onlyCoords = getDojoCoords(filteredDojos[0]);
        if (onlyCoords) map.setView(onlyCoords, 12, { animate: true, duration: 1 } as any);
      } else if (searchQuery) {
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14, animate: true, duration: 1 } as any);
      } else {
        map.setView([22.5, 78.9], 4, { animate: true, duration: 1 } as any);
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
          className="absolute -top-8 -left-4 text-[10rem] sm:text-[14rem] font-black leading-none text-red-600/10"
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
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            Find Your<br />Dojo
          </h1>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Task 2 Placeholder — FloatingDojoList                       */}
      {/*  Will render the search bar + scrollable dojo list panel     */}
      {/*  positioned on the left side of the viewport.                */}
      {/* ============================================================ */}

      {/* ============================================================ */}
      {/*  Task 3 Placeholder — DojoDetailPanel                        */}
      {/*  Will render the selected dojo detail slide-in panel         */}
      {/*  with full info, directions, and profile link.               */}
      {/* ============================================================ */}
    </div>
  );
}
