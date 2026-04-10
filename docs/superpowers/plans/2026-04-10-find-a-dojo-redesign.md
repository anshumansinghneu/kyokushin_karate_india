# Find a Dojo Page Redesign - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Find a Dojo page from a split-grid layout to a full-width immersive map with floating glassmorphic panels, animated pins, hover previews, and a cinematic slide-in detail panel — all in the Bold & Martial aesthetic.

**Architecture:** Single page rewrite of `frontend/src/app/find-a-dojo/page.tsx`. The Leaflet map becomes full-viewport, with all UI (title, search, dojo list, detail panel) floating on top via absolute positioning. No new dependencies — uses existing framer-motion, leaflet, lucide-react, and tailwindcss.

**Tech Stack:** Next.js 16 / React 19 / Tailwind CSS 3.4 / Framer Motion 12 / Leaflet 1.9 / TypeScript

---

## File Structure

All changes in a single file — matches the existing codebase pattern of self-contained page files:

- **Modify:** `frontend/src/app/find-a-dojo/page.tsx` — complete rewrite

Sub-components defined within the file:
1. `FindADojoPage` — main page, state, map initialization
2. `FloatingTitle` — top-left title block with badge and kanji watermark
3. `FloatingDojoList` — right-side glassmorphic panel with search and cards
4. `DojoListCard` — individual card in the list
5. `DojoDetailPanel` — cinematic slide-in panel from right
6. Pin marker HTML — Leaflet divIcon with pulse CSS

No new files created. The `layout.tsx` is unchanged (metadata only).

---

### Task 1: Foundation — Full-Viewport Map + Floating Title

Rewrite the page skeleton: map fills viewport, title floats top-left, all existing data-fetching and state preserved.

**Files:**
- Modify: `frontend/src/app/find-a-dojo/page.tsx` (full rewrite)

- [ ] **Step 1: Write the new page foundation**

Replace the entire contents of `frontend/src/app/find-a-dojo/page.tsx` with the new foundation. This preserves all existing state management, data fetching, and the Dojo interface but replaces the layout:

```tsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, X, Shield, User, Navigation, ChevronRight, Crosshair
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Types ─────────────────────────────────────────────── */
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

/* ── City coordinate fallbacks ─────────────────────────── */
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

/* ── Pin marker styles (injected once) ─────────────────── */
const PIN_STYLES = `
  .kyoku-pin {
    position: relative;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    background: #dc2626;
    border-radius: 50% 50% 50% 0;
    border: 2px solid rgba(255,255,255,0.8);
    box-shadow: 0 0 20px rgba(220,38,38,0.5);
    color: #fff; font-weight: 900; font-size: 11px;
    cursor: pointer;
    transform: rotate(-45deg);
    transition: all 0.2s;
  }
  .kyoku-pin span { transform: rotate(45deg); }
  .kyoku-pin::after {
    content: '';
    position: absolute;
    top: -8px; left: -8px;
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 1px solid rgba(220,38,38,0.25);
    animation: kyoku-pulse 2.5s ease-out infinite;
    pointer-events: none;
  }
  .kyoku-pin.active {
    transform: rotate(-45deg) scale(1.3);
    background: #991b1b;
    box-shadow: 0 0 30px rgba(220,38,38,0.7), 0 0 60px rgba(220,38,38,0.2);
    z-index: 1000 !important;
  }
  @keyframes kyoku-pulse {
    0% { opacity: 0.8; transform: scale(1); }
    100% { opacity: 0; transform: scale(2.5); }
  }
  .leaflet-marker-icon { background: none !important; border: none !important; }
`;

/* ── Floating Title ────────────────────────────────────── */
function FloatingTitle() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute top-20 sm:top-24 left-4 sm:left-6 lg:left-8 z-[25] pointer-events-none select-none"
    >
      <div className="relative">
        {/* Kanji watermark */}
        <span className="absolute -top-8 -left-4 text-[120px] sm:text-[160px] font-black leading-none text-red-600/[0.03] pointer-events-none select-none">
          極
        </span>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 rounded text-white text-[9px] font-extrabold tracking-[3px] uppercase mb-3 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
            <Shield className="w-3 h-3" /> Official Registry
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-none drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
            Find Your<br />Dojo
          </h1>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Page Component ───────────────────────────────── */
export default function FindADojoPage() {
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredDojoId, setHoveredDojoId] = useState<string | null>(null);
  const [selectedDojo, setSelectedDojo] = useState<Dojo | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const prevViewRef = useRef<{ center: L.LatLng; zoom: number } | null>(null);

  /* Inject pin styles once */
  useEffect(() => {
    const id = 'kyoku-pin-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = PIN_STYLES;
      document.head.appendChild(style);
    }
    document.documentElement.style.background = '#000';
    return () => { document.documentElement.style.background = ''; };
  }, []);

  /* Fetch dojos */
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
    [dojos, searchQuery]
  );

  const getDojoCoords = useCallback((dojo: Dojo): [number, number] | null => {
    if (dojo.latitude && dojo.longitude) return [dojo.latitude, dojo.longitude];
    return CITY_COORDS[dojo.city?.toLowerCase()] || null;
  }, []);

  /* Initialize map — full viewport */
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

  /* Sync markers */
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    filteredDojos.forEach((dojo) => {
      const coords = getDojoCoords(dojo);
      if (!coords) return;

      const icon = L.divIcon({
        html: `<div class="kyoku-pin"><span>極</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        className: '',
      });

      const marker = L.marker(coords, { icon }).addTo(map);
      marker.on('mouseover', () => setHoveredDojoId(dojo.id));
      marker.on('mouseout', () => setHoveredDojoId(null));
      marker.on('click', () => setSelectedDojo(dojo));
      markersRef.current[dojo.id] = marker;
    });

    if (!selectedDojo) {
      if (searchQuery && Object.keys(markersRef.current).length > 0) {
        const bounds = L.latLngBounds(
          filteredDojos
            .map((d) => getDojoCoords(d))
            .filter(Boolean) as [number, number][]
        );
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14, animate: true, duration: 1 });
      } else {
        map.setView([22.5, 78.9], 4, { animate: true, duration: 1 });
      }
    }
  }, [filteredDojos, searchQuery, getDojoCoords, selectedDojo]);

  /* Hover sync — highlight active pin */
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      if (!el) return;
      const pin = el.querySelector('.kyoku-pin') as HTMLElement;
      if (!pin) return;
      const isActive = id === hoveredDojoId || id === selectedDojo?.id;
      pin.classList.toggle('active', isActive);
    });
  }, [hoveredDojoId, selectedDojo]);

  /* Fly-to on dojo select */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedDojo) {
      prevViewRef.current = { center: map.getCenter(), zoom: map.getZoom() };
      const coords = getDojoCoords(selectedDojo);
      if (coords) map.setView(coords, 14, { animate: true, duration: 1.5 });
    } else if (prevViewRef.current) {
      map.setView(prevViewRef.current.center, prevViewRef.current.zoom, { animate: true, duration: 1 });
      prevViewRef.current = null;
    }
  }, [selectedDojo, getDojoCoords]);

  return (
    <div className="relative w-full h-screen text-white font-sans selection:bg-red-600 overflow-hidden">
      {/* Full-viewport map */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Floating title — top left */}
      <FloatingTitle />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-12 h-12 border-[3px] border-white/10 border-t-red-500 rounded-full animate-spin" />
        </div>
      )}

      {/* TASK 2: FloatingDojoList will go here */}
      {/* TASK 3: DojoDetailPanel will go here */}
    </div>
  );
}
```

- [ ] **Step 2: Verify the foundation works**

Run: `cd /Users/anshumansingh/kyokushin_karate/frontend && npm run dev`

Open http://localhost:3000/find-a-dojo in the browser. Verify:
- Map fills the entire viewport
- Dark CartoDB tiles load
- Title "FIND YOUR DOJO" floats top-left with red badge and kanji watermark
- Red pins with 極 appear for each dojo
- Pins pulse with ring animation
- Hovering a pin scales it up (active class)
- No page scrolling — map is the page

- [ ] **Step 3: Commit the foundation**

```bash
git add frontend/src/app/find-a-dojo/page.tsx
git commit -m "feat(find-a-dojo): rewrite to full-viewport immersive map layout

Replaces split-grid layout with full-viewport Leaflet map.
Title and badge float on map. Custom kyoku pins with pulse animation."
```

---

### Task 2: Floating Dojo List Panel

Add the glassmorphic right-side panel with search bar, dojo count, and scrollable card list.

**Files:**
- Modify: `frontend/src/app/find-a-dojo/page.tsx`

- [ ] **Step 1: Add DojoListCard component**

Add this component above the `FindADojoPage` function:

```tsx
/* ── Dojo List Card ────────────────────────────────────── */
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
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
      className={`
        p-3 rounded-lg border-l-[3px] border-l-red-600 cursor-pointer
        transition-all duration-200
        ${isActive
          ? 'bg-red-600/[0.08] border border-red-600/20 shadow-[0_0_12px_rgba(220,38,38,0.06)]'
          : 'bg-red-600/[0.03] border border-red-600/[0.06] hover:bg-red-600/[0.06]'
        }
      `}
    >
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-white mb-1 leading-tight">
        {dojo.name}
      </h4>
      <div className="flex items-center gap-2 text-[9px] text-zinc-500">
        <span>{dojo.city}{dojo.state ? `, ${dojo.state}` : ''}</span>
        {dojo.chiefInstructor && (
          <>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span className="text-red-500/70">Sensei {dojo.chiefInstructor.split(' ')[0]}</span>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add FloatingDojoList component**

Add this component after `DojoListCard`:

```tsx
/* ── Floating Dojo List Panel ──────────────────────────── */
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
}: {
  dojos: Dojo[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  hoveredDojoId: string | null;
  selectedDojoId: string | null;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
  onSelect: (dojo: Dojo) => void;
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="absolute top-20 sm:top-24 right-4 sm:right-6 lg:right-8 bottom-6 w-[280px] lg:w-[300px] z-[20] hidden md:flex flex-col bg-black/80 backdrop-blur-xl border border-red-600/[0.12] rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Search */}
      <div className="p-3 border-b border-red-600/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input
            type="text"
            placeholder="Search dojos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-red-600/[0.05] border border-red-600/10 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[9px] font-extrabold uppercase tracking-[3px] text-red-600">
          Active Branches
        </span>
        <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-[10px] font-black rounded-md">
          {dojos.length}
        </span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 scrollbar-thin scrollbar-thumb-red-900/30 scrollbar-track-transparent">
        {isLoading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-white/10 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : dojos.length === 0 ? (
          <div className="py-10 text-center">
            <Shield className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-xs text-zinc-600">No dojos found</p>
          </div>
        ) : (
          dojos.map((dojo) => (
            <DojoListCard
              key={dojo.id}
              dojo={dojo}
              isActive={hoveredDojoId === dojo.id || selectedDojoId === dojo.id}
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
```

- [ ] **Step 3: Wire FloatingDojoList into the page**

In the `FindADojoPage` return JSX, replace the `{/* TASK 2: FloatingDojoList will go here */}` comment with:

```tsx
      {/* Floating dojo list — right side */}
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
      />
```

- [ ] **Step 4: Verify the floating panel**

Refresh http://localhost:3000/find-a-dojo. Verify:
- Glassmorphic panel appears on the right with blur background
- Search bar filters the dojo list
- Dojo count badge shows correct number
- Cards have red left-border accent
- Hovering a card highlights it AND the corresponding map pin
- Hovering a map pin highlights the corresponding list card
- Clicking a card triggers selection (pin scales up, map zooms)
- Panel scrolls independently, not the page

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/find-a-dojo/page.tsx
git commit -m "feat(find-a-dojo): add floating glassmorphic dojo list panel

Right-side panel with search, dojo count, scrollable card list.
Hover sync between list cards and map pins."
```

---

### Task 3: Cinematic Slide-In Detail Panel

Replace the old center modal with a right-side slide-in panel triggered on dojo selection. Map zooms in, gradient dim fades in, panel slides from right with spring physics.

**Files:**
- Modify: `frontend/src/app/find-a-dojo/page.tsx`

- [ ] **Step 1: Add DojoDetailPanel component**

Add this component after `FloatingDojoList`:

```tsx
/* ── Cinematic Slide-In Detail Panel ───────────────────── */
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

  return (
    <>
      {/* Gradient dim overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[35] bg-gradient-to-l from-black/60 via-black/20 to-transparent pointer-events-auto"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[380px] z-[40] bg-black/[0.92] backdrop-blur-2xl border-l border-red-600/20 shadow-[-20px_0_60px_rgba(0,0,0,0.6)] overflow-y-auto"
      >
        <div className="p-6 sm:p-8 flex flex-col min-h-full">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-500 hover:bg-red-600 hover:text-white hover:border-red-500 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Branch badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 rounded text-white text-[9px] font-extrabold tracking-[3px] uppercase mb-4 shadow-[0_0_20px_rgba(220,38,38,0.4)] w-fit">
            <Shield className="w-3.5 h-3.5" /> Official Branch {dojo.dojoCode || 'N/A'}
          </div>

          {/* Dojo name */}
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight mb-5">
            {dojo.name}
          </h2>

          {/* Meta tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/[0.06] border border-red-600/10 rounded-lg text-xs text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              {dojo.city}{dojo.state ? `, ${dojo.state}` : ''}
            </span>
            {dojo.chiefInstructor && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/[0.06] border border-red-600/10 rounded-lg text-xs text-zinc-300">
                <User className="w-3.5 h-3.5 text-red-500" />
                Sensei {dojo.chiefInstructor}
              </span>
            )}
          </div>

          {/* Info rows */}
          <div className="space-y-3 flex-1 mb-6">
            <div className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Status</span>
              <span className="text-sm font-bold text-emerald-400">Verified & Active</span>
            </div>
            {dojo.address && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <MapPin className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                <span className="text-sm text-zinc-400">{dojo.address}</span>
              </div>
            )}
            {dojo.contactEmail && (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Contact</span>
                <span className="text-sm text-zinc-300">{dojo.contactEmail}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3 mt-auto">
            <Link
              href={`/dojos/${dojo.id}`}
              className="block w-full bg-white text-black py-4 rounded-xl font-extrabold text-center text-xs uppercase tracking-[2px] hover:bg-zinc-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              View Full Profile
            </Link>
            {coords && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-white/[0.04] border border-white/10 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-[2px] hover:bg-white/[0.08] transition-colors"
              >
                <Navigation className="w-4 h-4" /> Get Directions
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
```

- [ ] **Step 2: Wire DojoDetailPanel into the page**

In the `FindADojoPage` return JSX, replace the `{/* TASK 3: DojoDetailPanel will go here */}` comment with:

```tsx
      {/* Cinematic slide-in detail panel */}
      <AnimatePresence>
        {selectedDojo && (
          <DojoDetailPanel
            dojo={selectedDojo}
            onClose={() => setSelectedDojo(null)}
            getCoords={getDojoCoords}
          />
        )}
      </AnimatePresence>
```

- [ ] **Step 3: Verify the detail panel**

Refresh the page. Click a dojo pin or list card. Verify:
- Map smoothly zooms into the selected dojo (fly-to animation)
- Gradient dim fades in from the right side
- Detail panel slides in from right with spring physics (slight overshoot)
- Panel shows: branch badge, dojo name, meta tags, status, action buttons
- "View Full Profile" links to /dojos/:id
- "Get Directions" opens Google Maps
- Clicking the dim overlay or X button closes the panel
- Map zooms back to previous view on close
- On mobile width, panel takes full width

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/find-a-dojo/page.tsx
git commit -m "feat(find-a-dojo): add cinematic slide-in detail panel

Right-side panel with spring animation, gradient dim overlay,
map fly-to zoom on dojo selection. Replaces center modal."
```

---

### Task 4: Mobile Bottom Sheet Responsiveness

On screens < 768px, convert the floating list panel to a bottom sheet and the detail panel to a bottom slide-up.

**Files:**
- Modify: `frontend/src/app/find-a-dojo/page.tsx`

- [ ] **Step 1: Add mobile bottom sheet for dojo list**

In the `FindADojoPage` return JSX, add this after the `FloatingDojoList` component (which is `hidden md:flex`):

```tsx
      {/* Mobile bottom sheet — dojo list */}
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
```

- [ ] **Step 2: Make detail panel responsive**

In the `DojoDetailPanel` component, the panel already uses `w-full sm:w-[380px]` which makes it full-width on mobile. No changes needed for the panel itself.

Update the `FloatingTitle` component to be smaller on mobile — change the h1 classes:

```tsx
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black uppercase tracking-tight text-white leading-none drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
            Find Your<br />Dojo
          </h1>
```

And reduce the kanji watermark on mobile:

```tsx
        <span className="absolute -top-8 -left-4 text-[80px] sm:text-[120px] lg:text-[160px] font-black leading-none text-red-600/[0.03] pointer-events-none select-none">
          極
        </span>
```

- [ ] **Step 3: Verify mobile responsiveness**

Resize the browser to < 768px width (or use DevTools mobile emulation). Verify:
- Floating list panel is hidden
- Bottom sheet appears with search bar and horizontal scrollable dojo cards
- Tapping a card opens the detail panel (full-width slide-in from right)
- Title is smaller but still readable
- Map is fully visible as the main content
- Detail panel has proper touch scrolling

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/find-a-dojo/page.tsx
git commit -m "feat(find-a-dojo): add mobile bottom sheet for dojo list

Horizontal scrollable cards on mobile, responsive title sizing,
full-width detail panel on small screens."
```

---

### Task 5: Pin Hover Preview Cards

Show a floating preview card when hovering a map pin (desktop only). Uses Leaflet's `bindPopup` with custom HTML, styled to match the martial theme.

**Files:**
- Modify: `frontend/src/app/find-a-dojo/page.tsx`

- [ ] **Step 1: Add hover preview popup styles to PIN_STYLES**

Append these styles to the `PIN_STYLES` constant string:

```css
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
  .kyoku-popup-inner {
    padding: 14px;
  }
  .kyoku-popup-badge {
    font-size: 8px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 2px;
    color: #dc2626;
    margin-bottom: 6px;
  }
  .kyoku-popup-name {
    font-size: 14px; font-weight: 800;
    text-transform: uppercase;
    margin-bottom: 4px;
    line-height: 1.2;
  }
  .kyoku-popup-loc {
    font-size: 11px; color: #888;
    margin-bottom: 10px;
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
```

- [ ] **Step 2: Bind popups to markers**

In the marker sync `useEffect` (the one that iterates `filteredDojos`), after `marker.on('click', ...)`, add the popup binding:

```tsx
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
```

Note: Remove the previous `marker.on('mouseover')` and `marker.on('mouseout')` lines since we're replacing them above.

- [ ] **Step 3: Add custom event listener for popup CTA clicks**

In the `FindADojoPage` component, add this useEffect after the existing ones:

```tsx
  /* Listen for popup CTA clicks */
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail;
      const dojo = dojos.find((d) => d.id === id);
      if (dojo) setSelectedDojo(dojo);
    };
    document.addEventListener('dojo-select', handler);
    return () => document.removeEventListener('dojo-select', handler);
  }, [dojos]);
```

- [ ] **Step 4: Verify pin hover previews**

Refresh the page. Hover over a map pin. Verify:
- Dark glassmorphic popup appears above the pin
- Shows branch code, dojo name, and location
- Red "View Dojo →" button at the bottom
- Clicking the button opens the slide-in detail panel
- Popup disappears on mouseout
- Popup styling matches the martial theme (dark bg, red accents)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/find-a-dojo/page.tsx
git commit -m "feat(find-a-dojo): add hover preview cards on map pins

Leaflet popups with custom martial styling. Shows branch code,
name, location, and CTA button on pin hover."
```

---

### Task 6: Final Polish & Cleanup

Add the floating search bar for mobile, ensure zoom controls don't overlap panels, and clean up any remaining issues.

**Files:**
- Modify: `frontend/src/app/find-a-dojo/page.tsx`

- [ ] **Step 1: Reposition Leaflet zoom controls**

In the map initialization `useEffect`, change the zoom control position so it doesn't overlap with the floating panel:

```tsx
    L.control.zoom({ position: 'bottomright' }).addTo(map);
```

Wait — this conflicts with the mobile bottom sheet. Change to `bottomleft` instead:

```tsx
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
```

- [ ] **Step 2: Add custom zoom control styling**

Append to `PIN_STYLES`:

```css
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
```

- [ ] **Step 3: Hide floating list when detail panel is open**

In the `FloatingDojoList` component's outer div, add a conditional class to hide it when a dojo is selected. Update the `FindADojoPage` to pass `isDetailOpen`:

Add `isDetailOpen: boolean` to the `FloatingDojoList` props interface:

```tsx
  isDetailOpen: boolean;
```

In the component's outer div, add the conditional:

```tsx
      className={`absolute top-20 sm:top-24 right-4 sm:right-6 lg:right-8 bottom-6 w-[280px] lg:w-[300px] z-[20] hidden md:flex flex-col bg-black/80 backdrop-blur-xl border border-red-600/[0.12] rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-300 ${isDetailOpen ? 'opacity-0 pointer-events-none' : ''}`}
```

Pass the prop from `FindADojoPage`:

```tsx
      <FloatingDojoList
        ...existing props...
        isDetailOpen={!!selectedDojo}
      />
```

- [ ] **Step 4: Verify everything together**

Full end-to-end check:
1. Page loads → map fills viewport, title top-left, list panel top-right
2. Search filters both list and map pins
3. Hover on pin → preview popup + list card highlights
4. Hover on list card → map pin highlights
5. Click pin or card → map zooms in, panel slides in, list fades out
6. Close panel → map zooms back, list fades in
7. Mobile: bottom sheet with horizontal cards, full-width detail panel
8. Zoom controls are styled and don't overlap panels

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/find-a-dojo/page.tsx
git commit -m "feat(find-a-dojo): final polish - zoom controls, panel transitions

Style Leaflet zoom controls, hide list panel when detail is open,
reposition controls to avoid overlap."
```

---

## Summary

| Task | What it builds | Estimated steps |
|------|---------------|-----------------|
| 1 | Full-viewport map + floating title + pins | 3 steps |
| 2 | Floating glassmorphic dojo list panel | 5 steps |
| 3 | Cinematic slide-in detail panel | 4 steps |
| 4 | Mobile bottom sheet responsiveness | 4 steps |
| 5 | Pin hover preview cards | 5 steps |
| 6 | Final polish & cleanup | 5 steps |
| **Total** | **Complete Find a Dojo redesign** | **26 steps** |
