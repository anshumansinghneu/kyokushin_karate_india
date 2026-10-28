'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Navigation, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { CITY_INDEX, normalizeCity } from '@/lib/cityCoords';
import SceneSlot from '@/components/three/SceneSlot';
import BrandLink from '@/components/brand/BrandLink';
import { Heading } from '@/components/brand/Section';
import CityRun from '@/components/dojo/CityRun';
import 'leaflet/dist/leaflet.css';

import KarateLoader from '@/components/KarateLoader';
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

/**
 * Popups are built as HTML strings for Leaflet, so every interpolated value has
 * to be escaped. Dojo names are admin-entered free text and previously went
 * into an inline `onclick` attribute unescaped.
 */
const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));

/**
 * Most dojos are named "Mas Oyama Karate Academy, <place>" or
 * "Mas Oyama Karate Academy - <place>, <city>". In a list of 22 where 15 share
 * that prefix, repeating it on every row costs two lines of height and tells
 * the reader nothing — the place is the only part that distinguishes them.
 * Returns the distinguishing tail, falling back to the full name.
 */
const stripAcademyPrefix = (name: string): string => {
  const tail = name.replace(/^mas oyama karate academy\s*[-–,]\s*/i, '').trim();
  return tail && tail.toLowerCase() !== name.toLowerCase() ? tail : name;
};

const dojoHref = (id: string): string => `/dojos/${encodeURIComponent(id)}`;

const formatKm = (km: number): string => (km < 1 ? '<1 km' : `${Math.round(km).toLocaleString('en-IN')} km`);

/* ------------------------------------------------------------------ */
/*  Map pin + popup CSS (injected once on mount)                       */
/* ------------------------------------------------------------------ */

// Pins are quiet by default: a white dot for one dojo, a dark pill with a
// count for a location holding several. Only the hovered or selected pin
// takes the Kyokushin red, so red marks the one thing being looked at.
const MARKER_STYLES = `
/* At fractional zoom Leaflet's plus-lighter tile blending draws bright
   hairlines along every tile edge on this dark basemap. Normal blending with a
   sub-pixel overlap closes the seams instead. */
.kkfi-dark-map.leaflet-container { background: #1f1f1f; }
.kkfi-dark-map .leaflet-tile-container img.leaflet-tile {
  mix-blend-mode: normal;
  width: 256.6px !important;
  height: 256.6px !important;
}
.dojo-marker-icon {
  background: transparent !important;
  border: none !important;
}
.dojo-pin {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.dojo-pin__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #0a0a0a;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.35);
  transition: transform 0.2s ease, background-color 0.2s ease;
}
.dojo-pin__pill {
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  border: 1px solid rgba(255,255,255,0.45);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}
.dojo-pin.active .dojo-pin__dot {
  background: #B3261E;
  transform: scale(1.3);
}
.dojo-pin.active .dojo-pin__pill {
  background: #B3261E;
  border-color: #B3261E;
  transform: scale(1.12);
}
/* Keyboard focus for map pins — they are real controls. */
.dojo-marker-icon:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
  border-radius: 9999px;
}
.kkfi-user-pin {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: rgba(255,255,255,0.25);
}

@media (prefers-reduced-motion: reduce) {
  .dojo-pin__dot, .dojo-pin__pill { transition: none; }
}

/* Popups: dark, hairline, no glow. */
.kyoku-popup .leaflet-popup-content-wrapper {
  background: #0a0a0a;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  box-shadow: none;
  padding: 0;
  color: #fff;
}
.kyoku-popup .leaflet-popup-content {
  margin: 0;
  min-width: 200px;
  font-family: inherit;
}
.kyoku-popup .leaflet-popup-tip {
  background: #0a0a0a;
  border-right: 1px solid rgba(255,255,255,0.12);
  border-bottom: 1px solid rgba(255,255,255,0.12);
  box-shadow: none;
}
.kyoku-popup .leaflet-popup-close-button {
  color: rgba(255,255,255,0.5) !important;
  padding: 8px 10px 0 0 !important;
  font-size: 18px !important;
}
.kyoku-popup .leaflet-popup-close-button:hover { color: #fff !important; }
.kyoku-popup-inner { padding: 12px 14px; }
.kyoku-popup-eyebrow {
  font-size: 12px; font-weight: 600;
  color: rgba(255,255,255,0.55);
  margin: 0 18px 8px 0;
}
.kyoku-popup-name {
  font-size: 14px; font-weight: 600; line-height: 1.3;
  margin-bottom: 2px;
}
.kyoku-popup-loc {
  font-size: 12px; color: rgba(255,255,255,0.55);
  margin-bottom: 10px;
}
.kyoku-popup a.kyoku-popup-link {
  font-size: 12px; font-weight: 600;
  color: #fff;
  text-decoration: underline;
  text-decoration-color: rgba(255,255,255,0.35);
  text-underline-offset: 3px;
}
.kyoku-popup a.kyoku-popup-link:hover { text-decoration-color: #fff; }
.kyoku-popup-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
}
.kyoku-popup-list li + li { border-top: 1px solid rgba(255,255,255,0.1); }
.kyoku-popup a.kyoku-popup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  text-decoration: none;
}
.kyoku-popup a.kyoku-popup-item span:last-child { color: rgba(255,255,255,0.4); }
.kyoku-popup a.kyoku-popup-item:hover span:last-child { color: #fff; }
.kyoku-popup a:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Zoom controls: translucent, hairline, no colour. */
.leaflet-control-zoom.leaflet-bar {
  border: 1px solid rgba(255,255,255,0.12) !important;
  border-radius: 8px !important;
  overflow: hidden;
  box-shadow: none !important;
}
.leaflet-control-zoom a {
  position: relative;
  background: rgba(0,0,0,0.75) !important;
  color: #fff !important;
  border-color: rgba(255,255,255,0.1) !important;
  width: 34px !important;
  height: 34px !important;
  border-radius: 0 !important;
  /* Leaflet labels zoom-out with U+2212 MINUS SIGN. Font coverage for it is not
     guaranteed (the Montserrat stack misses it, and it renders as a tofu box),
     so the glyphs are drawn as CSS bars instead — identical on every platform.
     The accessible name still comes from the title/aria-label Leaflet sets. */
  font-size: 0 !important;
}
.leaflet-control-zoom a::before,
.leaflet-control-zoom a::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: currentColor;
  transform: translate(-50%, -50%);
}
/* Horizontal bar: present on both buttons. */
.leaflet-control-zoom a::before { width: 12px; height: 2px; }
/* Vertical bar: turns the zoom-in button into a plus. */
.leaflet-control-zoom-in::after { width: 2px; height: 12px; }
.leaflet-control-zoom a:hover { background: rgba(38,38,38,0.9) !important; }
.leaflet-control-zoom a:focus-visible {
  outline: 2px solid #fff;
  outline-offset: -2px;
}
/* Leaflet marks a disabled control at min/max zoom; show that honestly. */
.leaflet-control-zoom a.leaflet-disabled {
  opacity: 0.4;
  cursor: default;
}
`;

/* ------------------------------------------------------------------ */
/*  Dojo list                                                          */
/* ------------------------------------------------------------------ */

/** Groups dojos by state so 22 rows read as a handful of regions. */
function groupByState(dojos: Dojo[]): { state: string; dojos: Dojo[] }[] {
  const map = new Map<string, Dojo[]>();
  for (const d of dojos) {
    const key = d.state?.trim() || 'Other';
    const list = map.get(key);
    if (list) list.push(d);
    else map.set(key, [d]);
  }
  return [...map.entries()]
    .map(([state, list]) => ({
      state,
      dojos: [...list].sort((a, b) => a.city.localeCompare(b.city)),
    }))
    .sort((a, b) => b.dojos.length - a.dojos.length || a.state.localeCompare(b.state));
}

function DojoRow({
  dojo,
  isActive,
  distanceKm,
  onHoverStart,
  onHoverEnd,
  onSelect,
}: {
  dojo: Dojo;
  isActive: boolean;
  distanceKm?: number;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onSelect: () => void;
}) {
  const place = [dojo.city, dojo.state].filter(Boolean).join(', ');
  return (
    <li
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className={`flex items-start gap-4 px-3 py-4 transition-colors motion-reduce:transition-none ${isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'}`}
    >
      {/* Selecting a row flies the map to its pin; the link opens the dojo. */}
      <button
        type="button"
        onClick={onSelect}
        onFocus={onHoverStart}
        onBlur={onHoverEnd}
        aria-pressed={isActive}
        aria-label={`Show ${dojo.name} on the map`}
        title={dojo.name}
        className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
      >
        <span className="block text-base font-semibold leading-snug text-white">
          {stripAcademyPrefix(dojo.name)}
        </span>
        <span className="mt-1 block text-sm text-white/55">{place}</span>
        {dojo.chiefInstructor && (
          <span className="mt-0.5 block text-sm text-white/45">{dojo.chiefInstructor}</span>
        )}
      </button>
      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        {distanceKm !== undefined && (
          <span className="text-sm tabular-nums text-white/70">{formatKm(distanceKm)}</span>
        )}
        <Link
          href={dojoHref(dojo.id)}
          onFocus={onHoverStart}
          onBlur={onHoverEnd}
          aria-label={`View ${dojo.name}`}
          className="whitespace-nowrap text-sm font-semibold text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline focus:outline-none focus-visible:text-white focus-visible:underline motion-reduce:transition-none"
        >
          View dojo <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul aria-hidden="true" className="divide-y divide-white/10">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="px-3 py-4">
          <div className="h-4 w-2/5 rounded bg-white/10 animate-pulse motion-reduce:animate-none" />
          <div className="mt-2.5 h-3 w-1/3 rounded bg-white/[0.06] animate-pulse motion-reduce:animate-none" />
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Network opener: the country in 3D, a beam per dojo city            */
/* ------------------------------------------------------------------ */

interface CityGroup {
  key: string;
  label: string;
  lat: number;
  lon: number;
  count: number;
}

function NetworkHero({
  cities,
  total,
  isLoading,
  loadError,
  focus,
  onChooseCity,
}: {
  cities: CityGroup[];
  total: number;
  isLoading: boolean;
  loadError: boolean;
  focus: string | null;
  onChooseCity: (city: CityGroup | null) => void;
}) {
  const sceneProps = useMemo(
    () => ({ cities: cities.map(({ key, lat, lon, count }) => ({ key, lat, lon, count })), focus }),
    [cities, focus],
  );
  const top = cities.slice(0, 10);

  return (
    <header data-bleed className="relative flex min-h-[100svh] overflow-hidden">
      <SceneSlot
        scene="india-map"
        sceneProps={sceneProps}
        className="absolute inset-x-0 top-0 h-[56svh] md:inset-0 md:h-auto"
        fallback={
          <div className="absolute inset-0 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/geo/india-poster.svg" alt="" className="absolute right-[4%] top-1/2 h-[80%] -translate-y-1/2 opacity-60" />
          </div>
        }
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,black_44%,transparent_62%)] md:bg-gradient-to-r md:from-black/85 md:via-black/30 md:via-45% md:to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-24 pt-[50svh] sm:px-6 md:justify-center md:pb-16 md:pt-40 lg:px-8">
        <h1 className="text-[clamp(3rem,9vw,6rem)] font-black uppercase leading-[0.9] tracking-[-0.035em] text-white">
          Find your<br />dojo<span className="text-primary">.</span>
        </h1>
        <p className="mt-6 max-w-[40ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
          {isLoading
            ? 'Locating dojos across India…'
            : loadError
              ? 'We could not load the dojo list just now. The map below will retry.'
              : `${total} official ${total === 1 ? 'branch' : 'branches'} in ${cities.length} ${cities.length === 1 ? 'city' : 'cities'}. Each beam of light is a city where Kyokushin is taught.`}
        </p>

        {/* Space is reserved while loading so the copy above does not jump when cities arrive. */}
        {(isLoading || top.length > 0) && (
          <div className="mt-10 max-w-xl md:min-h-[10.5rem]">
            <p className="text-sm font-semibold text-white/60">Choose a city</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {top.map((city) => {
                const active = focus === city.key;
                return (
                  <li key={city.key}>
                    <button
                      type="button"
                      onClick={() => onChooseCity(active ? null : city)}
                      aria-pressed={active}
                      className={`inline-flex min-h-11 items-center gap-2 border px-4 text-sm font-bold transition-colors ${active ? 'border-primary bg-primary text-white' : 'border-white/20 text-white hover:border-white/50 hover:bg-white/10'}`}
                    >
                      {city.label}
                      <span className={active ? 'text-white/80' : 'text-white/50'}>{city.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <BrandLink href="#finder">Search every dojo</BrandLink>
        </div>
      </div>
    </header>
  );
}

export default function FindADojoPage() {
  const router = useRouter();

  /* ---- State ---- */
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  /** True when the dojo fetch failed outright, as distinct from "no matches". */
  const [loadError, setLoadError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredDojoId, setHoveredDojoId] = useState<string | null>(null);
  const [selectedDojo, setSelectedDojo] = useState<Dojo | null>(null);
  const filteredDojos = useMemo(
    () =>
      dojos.filter((dojo) => {
        const q = searchQuery.trim().toLowerCase();
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
  const mapFrameRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType>(null);
  /** Keyed by location group ("lat,lng"), since one pin can hold many dojos. */
  const markersRef = useRef<Record<string, LeafletType>>({});
  /** dojoId -> the group marker that represents it, for hover/fly-to sync. */
  const markerByDojoRef = useRef<Record<string, LeafletType>>({});
  const userMarkerRef = useRef<LeafletType>(null);
  const prevViewRef = useRef<{ center: LeafletType; zoom: number } | null>(null);
  const leafletRef = useRef<LeafletType>(null);
  /** Read by the marker effect so a selection does not rebuild every pin. */
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedDojo?.id ?? null;
  }, [selectedDojo]);

  /** Drops the selection without flying back to a view the new filter replaces. */
  const clearSelection = useCallback(() => {
    prevViewRef.current = null;
    setSelectedDojo(null);
  }, []);

  /* ---- Coord helper (city fallback, whitespace-tolerant) ---- */
  const getDojoCoords = useCallback((dojo: Dojo): [number, number] | null => {
    if (dojo.latitude && dojo.longitude) return [dojo.latitude, dojo.longitude];
    return CITY_INDEX[normalizeCity(dojo.city)] ?? null;
  }, []);

  /**
   * One pin per distinct location, not per dojo.
   *
   * Seven of the registered dojos share Kanpur, three share Guwahati and two
   * share Bengaluru, so per-dojo markers stacked on identical coordinates: the
   * map showed 8 pins for 22 dojos and a click could only ever reach whichever
   * marker happened to be on top. Grouping makes the count visible and lets the
   * popup list every dojo at that point.
   */
  const locationGroups = useMemo(() => {
    const groups = new Map<string, { coords: [number, number]; dojos: Dojo[] }>();
    for (const dojo of filteredDojos) {
      const coords = getDojoCoords(dojo);
      if (!coords) continue;
      const key = `${coords[0].toFixed(4)},${coords[1].toFixed(4)}`;
      const existing = groups.get(key);
      if (existing) existing.dojos.push(dojo);
      else groups.set(key, { coords, dojos: [dojo] });
    }
    return [...groups.entries()].map(([key, v]) => ({ key, ...v }));
  }, [filteredDojos, getDojoCoords]);

  /** Dojos we cannot place. Surfaced rather than silently dropped. */
  const unmappedCount = useMemo(
    () => filteredDojos.filter((d) => !getDojoCoords(d)).length,
    [filteredDojos, getDojoCoords],
  );

  /* ---- Cities for the 3D opener (all dojos, independent of search) ---- */
  const cityGroups = useMemo<CityGroup[]>(() => {
    const groups = new Map<string, CityGroup>();
    for (const dojo of dojos) {
      const coords = getDojoCoords(dojo);
      if (!coords) continue;
      const key = normalizeCity(dojo.city) || `${coords[0]},${coords[1]}`;
      const existing = groups.get(key);
      if (existing) existing.count += 1;
      else groups.set(key, { key, label: dojo.city.trim(), lat: coords[0], lon: coords[1], count: 1 });
    }
    return [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [dojos, getDojoCoords]);
  const [focusCity, setFocusCity] = useState<string | null>(null);
  const chooseCity = useCallback((city: CityGroup | null) => {
    clearSelection();
    setFocusCity(city?.key ?? null);
    setSearchQuery(city ? city.label : '');
  }, [clearSelection]);

  /* ---- "Near me": the obvious answer to "find your dojo" ---- */
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locateState, setLocateState] = useState<'idle' | 'locating' | 'done' | 'denied'>('idle');

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateState('denied');
      return;
    }
    setLocateState('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLocateState('done');
      },
      () => setLocateState('denied'),
      { timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  /** Great-circle distance in km. */
  const haversineKm = useCallback((a: [number, number], b: [number, number]): number => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const [lat1, lon1] = a;
    const [lat2, lon2] = b;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }, []);

  /** Nearest-first when we have a fix; otherwise the fetch order. */
  const listedDojos = useMemo(() => {
    if (!userPos || locateState !== 'done') return filteredDojos;
    return [...filteredDojos].sort((a, b) => {
      const ca = getDojoCoords(a);
      const cb = getDojoCoords(b);
      if (!ca && !cb) return 0;
      if (!ca) return 1;
      if (!cb) return -1;
      return haversineKm(userPos, ca) - haversineKm(userPos, cb);
    });
  }, [filteredDojos, userPos, locateState, getDojoCoords, haversineKm]);

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

  /* ---- Fetch dojos ---- */
  //
  // The failure used to be swallowed: a console.error, an empty list, and a
  // panel reading "No dojos match that search" — which blames the visitor's
  // search for what is actually the API not responding (the backend sleeps when
  // idle and a cold start can outlast the client retries). Track the failure so
  // the UI can say what really happened and offer a retry.
  const fetchDojos = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const response = await api.get('/dojos');
      setDojos(response.data.data.dojos);
      setLoadError(false);
    } catch (err) {
      console.error('Failed to fetch dojos', err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDojos();
  }, [fetchDojos]);

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

      // Zoom on every axis, keyboard included: this map is the page's primary
      // control (WCAG 2.1.1), and several cities hold more than one dojo.
      const map = L.map(mapRef.current, {
        center: [22.5, 82.0],
        zoom: 4.5,
        minZoom: 4,
        maxZoom: 17,
        zoomControl: false,
        // The map is a panel inside the page now: the wheel scrolls the page past it until
        // the visitor clicks into the map, and hands back when the pointer leaves.
        scrollWheelZoom: false,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        maxBounds: indiaBounds,
        maxBoundsViscosity: 1.0,
        // Leaflet's default zoomSnap of 1 floors the value fitBounds computes,
        // leaving India small in the frame. Quarter steps let the fit fill it.
        zoomSnap: 0.25,
        zoomDelta: 0.5,
      });

      L.control.zoom({ position: 'bottomleft' }).addTo(map);
      map.attributionControl.setPosition('bottomright');

      // Esri's Dark Gray Canvas: a genuinely dark, neutral basemap with English
      // labels, served without an API key. (CARTO's dark_all watermarks every
      // tile with "API KEY REQUIRED"; inverted OpenStreetMap was muddy and
      // surfaced non-English labels.)
      L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        },
      ).addTo(map);

      // data-lenis-prevent keeps the site's smooth scroll from taking the wheel meanwhile.
      map.on('click', () => {
        map.scrollWheelZoom.enable();
        map.getContainer().setAttribute('data-lenis-prevent', '');
      });
      map.on('mouseout', () => {
        map.scrollWheelZoom.disable();
        map.getContainer().removeAttribute('data-lenis-prevent');
      });

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

  /* ---- Sync markers with the filtered dojos ---- */
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    Object.values(markersRef.current).forEach((m: LeafletType) => m.remove());
    markersRef.current = {};
    markerByDojoRef.current = {};

    const bounds = L.latLngBounds([]);

    locationGroups.forEach((group) => {
      const { coords, dojos: groupDojos } = group;
      const count = groupDojos.length;
      bounds.extend(coords);

      // A grouped pin states its own count, so seven Kanpur dojos read as
      // seven rather than as one arbitrary winner.
      const pinHTML = count > 1
        ? `<div class="dojo-pin"><span class="dojo-pin__pill">${count}</span></div>`
        : '<div class="dojo-pin"><span class="dojo-pin__dot"></span></div>';
      const size: [number, number] = count > 1 ? [34, 24] : [20, 20];
      const icon = L.divIcon({
        html: pinHTML,
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1] / 2],
        className: 'dojo-marker-icon',
      });

      const marker = L.marker(coords, {
        icon,
        keyboard: true,
        title: count > 1
          ? `${count} dojos in ${groupDojos[0].city}`
          : groupDojos[0].name,
      }).addTo(map);

      const place = `${groupDojos[0].city}${groupDojos[0].state ? `, ${groupDojos[0].state}` : ''}`;
      const popupContent = count === 1
        ? `
        <div class="kyoku-popup-inner">
          <div class="kyoku-popup-name">${escapeHtml(stripAcademyPrefix(groupDojos[0].name))}</div>
          <div class="kyoku-popup-loc">${escapeHtml(place)}</div>
          <a class="kyoku-popup-link" href="${escapeHtml(dojoHref(groupDojos[0].id))}" data-dojo-link>View dojo &rarr;</a>
        </div>
      `
        : `
        <div class="kyoku-popup-inner">
          <div class="kyoku-popup-eyebrow">${count} dojos &middot; ${escapeHtml(place)}</div>
          <ul class="kyoku-popup-list">
            ${groupDojos.map((d) => `
              <li>
                <a class="kyoku-popup-item" href="${escapeHtml(dojoHref(d.id))}" data-dojo-link>
                  <span>${escapeHtml(stripAcademyPrefix(d.name))}</span><span aria-hidden="true">&rarr;</span>
                </a>
              </li>`).join('')}
          </ul>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'kyoku-popup',
        closeButton: count > 1,
        offset: [0, -(size[1] / 2) - 4],
        autoPan: count > 1,
        maxHeight: 260,
      });

      if (count === 1) {
        const only = groupDojos[0];
        // Hover previews; a click selects and keeps the popup open so its
        // link can be reached.
        marker.on('mouseover', () => {
          setHoveredDojoId(only.id);
          marker.openPopup();
        });
        marker.on('mouseout', () => {
          setHoveredDojoId(null);
          if (selectedIdRef.current !== only.id) marker.closePopup();
        });
        marker.on('click', () => setSelectedDojo(only));
      } else {
        // Clusters open on click and stay open, so the list is clickable.
        marker.on('click', () => marker.openPopup());
      }

      markersRef.current[group.key] = marker;
      groupDojos.forEach((d) => {
        markerByDojoRef.current[d.id] = marker;
      });
    });

    // Frame the pins, not the subcontinent. The map has its own frame now, so
    // nothing overlays it and the padding can be even.
    if (locationGroups.length > 0 && !selectedIdRef.current) {
      if (locationGroups.length === 1) {
        map.setView(locationGroups[0].coords, 11, { animate: true, duration: 0.9 });
      } else {
        map.fitBounds(bounds, {
          padding: [36, 36],
          maxZoom: searchQuery ? 13 : 9,
          animate: true,
          duration: 0.9,
        });
      }
    }
  }, [locationGroups, searchQuery, mapReady]);

  /* ---- Hover sync: the active pin turns red and rises above the rest ---- */
  useEffect(() => {
    // Markers are keyed by location, so resolve the active dojo to its group
    // marker rather than comparing marker keys to dojo ids.
    const activeMarkers = new Set(
      [hoveredDojoId, selectedDojo?.id]
        .filter(Boolean)
        .map((id) => markerByDojoRef.current[id as string])
        .filter(Boolean),
    );

    Object.values(markersRef.current).forEach((marker: LeafletType) => {
      const active = activeMarkers.has(marker);
      marker.setZIndexOffset(active ? 1000 : 0);
      const el = marker.getElement();
      const pin = el?.querySelector('.dojo-pin') as HTMLElement | null;
      if (pin) pin.classList.toggle('active', active);
    });
  }, [hoveredDojoId, selectedDojo, locationGroups, mapReady]);

  /* ---- Popup links: client-side navigation (delegated; no inline onclick) ---- */
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[data-dojo-link]');
      if (!link) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = link.getAttribute('href');
      if (!href) return;
      e.preventDefault();
      router.push(href);
    };
    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, [router]);

  /* ---- Fly-to on selectedDojo change ---- */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedDojo) {
      if (!prevViewRef.current) {
        prevViewRef.current = { center: map.getCenter(), zoom: map.getZoom() };
      }
      const coords = getDojoCoords(selectedDojo);
      if (coords) {
        const marker = markerByDojoRef.current[selectedDojo.id];
        map.once('moveend', () => marker?.openPopup());
        map.flyTo(coords, 13, { animate: true, duration: 1.1 });
      }
    } else if (prevViewRef.current) {
      map.closePopup();
      map.flyTo(prevViewRef.current.center, prevViewRef.current.zoom, {
        animate: true,
        duration: 1.1,
      });
      prevViewRef.current = null;
    }
  }, [selectedDojo, getDojoCoords]);

  /* ---- Escape clears a selection ---- */
  useEffect(() => {
    if (!selectedDojo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDojo(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedDojo]);

  /* ---- "Near me": mark the visitor and frame them with the nearest dojo ---- */
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    if (!userPos || locateState !== 'done') return;

    userMarkerRef.current = L.marker(userPos, {
      icon: L.divIcon({ html: '<div class="kkfi-user-pin"></div>', iconSize: [16, 16], iconAnchor: [8, 8], className: 'dojo-marker-icon' }),
      keyboard: false,
      title: 'Your location',
      interactive: false,
    }).addTo(map);

    const nearest = listedDojos[0] && getDojoCoords(listedDojos[0]);
    if (nearest) {
      map.fitBounds(L.latLngBounds([userPos, nearest]), { padding: [60, 60], maxZoom: 11, animate: true });
    }
    // Only when a fresh fix arrives, not on every list change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos, locateState, mapReady]);

  /** Distance per dojo once we have a fix. */
  const distances = useMemo(() => {
    const out: Record<string, number> = {};
    if (!userPos || locateState !== 'done') return out;
    for (const d of listedDojos) {
      const c = getDojoCoords(d);
      if (c) out[d.id] = haversineKm(userPos, c);
    }
    return out;
  }, [listedDojos, userPos, locateState, getDojoCoords, haversineKm]);

  const cityCount = useMemo(
    () => new Set(dojos.map((d) => normalizeCity(d.city)).filter(Boolean)).size,
    [dojos],
  );

  const onSearchChange = (q: string) => {
    setFocusCity(null);
    clearSelection();
    setSearchQuery(q);
  };

  const selectFromList = (dojo: Dojo) => {
    if (selectedDojo?.id === dojo.id) {
      setSelectedDojo(null);
      return;
    }
    setSelectedDojo(dojo);
    // On phones the map sits above the list; bring it back into view.
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      mapFrameRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const isFiltered = searchQuery.trim() !== '';
  const nearMode = locateState === 'done' && !!userPos;
  const showListBar = !isLoading && !loadError && (isFiltered || nearMode || unmappedCount > 0);

  const renderRow = (dojo: Dojo) => (
    <DojoRow
      key={dojo.id}
      dojo={dojo}
      isActive={dojo.id === hoveredDojoId || dojo.id === selectedDojo?.id}
      distanceKm={distances[dojo.id]}
      onHoverStart={() => setHoveredDojoId(dojo.id)}
      onHoverEnd={() => setHoveredDojoId(null)}
      onSelect={() => selectFromList(dojo)}
    />
  );

  /* ---- Render ---- */
  return (
    <>
    <NetworkHero
      cities={cityGroups}
      total={dojos.length}
      isLoading={isLoading}
      loadError={loadError}
      focus={focusCity}
      onChooseCity={chooseCity}
    />
    <CityRun
      cities={cityGroups}
      onChoose={(key) => {
        chooseCity(cityGroups.find((c) => c.key === key) ?? null);
        document.getElementById('finder')?.scrollIntoView({ behavior: 'smooth' });
      }}
    />

    {/* The working finder: header and controls, then list and map side by side. */}
    <section id="finder" aria-labelledby="finder-heading" className="relative scroll-mt-16 bg-black py-16 text-white selection:bg-primary sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <header>
          <Heading>
            <span id="finder-heading">Every dojo</span>
          </Heading>
          <p className="mt-3 text-lg text-white/70" aria-live="polite">
            {isLoading
              ? 'Loading dojos…'
              : loadError
                ? 'The dojo list did not load.'
                : `${dojos.length} ${dojos.length === 1 ? 'dojo' : 'dojos'} in ${cityCount} ${cityCount === 1 ? 'city' : 'cities'}`}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" aria-hidden="true" />
              <label htmlFor="dojo-search" className="sr-only">Search dojos by name, city, state or instructor</label>
              <input
                id="dojo-search"
                type="search"
                placeholder="Search city, state or instructor"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-12 w-full border-b-2 border-white/20 bg-transparent pl-8 pr-2 text-base text-white placeholder:text-white/55 transition-colors focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locateState === 'locating'}
              aria-pressed={nearMode}
              className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 border px-5 text-sm font-semibold transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${nearMode ? 'border-white bg-white text-black' : 'border-white/20 text-white hover:border-white/50 hover:bg-white/10'}`}
            >
              <Navigation aria-hidden="true" className={`h-4 w-4 ${locateState === 'locating' ? 'animate-pulse motion-reduce:animate-none' : ''}`} />
              {locateState === 'locating'
                ? 'Finding you…'
                : locateState === 'denied'
                  ? 'Location unavailable'
                  : 'Near me'}
            </button>
          </div>

          {cityGroups.length > 0 && (
            <ul aria-label="Filter by city" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              <li className="shrink-0">
                <button
                  type="button"
                  onClick={() => chooseCity(null)}
                  aria-pressed={!focusCity && !isFiltered}
                  className={`inline-flex min-h-10 items-center gap-2 border px-3.5 text-sm font-semibold transition-colors motion-reduce:transition-none ${!focusCity && !isFiltered ? 'border-white bg-white text-black' : 'border-white/15 text-white/75 hover:border-white/40 hover:text-white'}`}
                >
                  All
                  <span className={!focusCity && !isFiltered ? 'text-black/55' : 'text-white/45'}>{dojos.length}</span>
                </button>
              </li>
              {cityGroups.map((city) => {
                const active = focusCity === city.key;
                return (
                  <li key={city.key} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => chooseCity(active ? null : city)}
                      aria-pressed={active}
                      className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap border px-3.5 text-sm font-semibold transition-colors motion-reduce:transition-none ${active ? 'border-white bg-white text-black' : 'border-white/15 text-white/75 hover:border-white/40 hover:text-white'}`}
                    >
                      {city.label}
                      <span className={active ? 'text-black/55' : 'text-white/45'}>{city.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </header>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-12 lg:gap-8">
          {/* Map: first on phones, right-hand column on desktop.
              data-lenis-prevent keeps wheel and trackpad gestures on the map. */}
          <div
            ref={mapFrameRef}
            data-lenis-prevent
            className="relative h-[45svh] scroll-mt-20 overflow-hidden rounded-xl bg-white/[0.03] ring-1 ring-white/10 lg:sticky lg:top-24 lg:order-last lg:col-span-7 lg:h-[calc(100svh-8rem)] lg:self-start"
          >
            <div ref={mapRef} className="kkfi-dark-map absolute inset-0 z-0 h-full w-full bg-black" />
            {isLoading && (
              <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/70">
                <KarateLoader label="Finding dojos" />
              </div>
            )}
          </div>

          {/* List: scrolls inside its column on desktop, with the page on phones. */}
          <div
            data-lenis-prevent
            className="lg:col-span-5 lg:h-[calc(100svh-8rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2"
          >
            {showListBar && (
              <div className="flex items-baseline justify-between gap-4 border-b border-white/10 px-3 pb-3 text-sm">
                <span className="text-white/60">
                  {isFiltered || nearMode
                    ? `${listedDojos.length} of ${dojos.length}${nearMode ? ' · nearest first' : ''}`
                    : ''}
                </span>
                {unmappedCount > 0 && (
                  <span className="text-white/50" title="These dojos have no coordinates yet, so they have no pin">
                    {unmappedCount} not on the map yet
                  </span>
                )}
              </div>
            )}

            {isLoading ? (
              <ListSkeleton />
            ) : loadError ? (
              // Distinct from the empty-search state below: nothing was loaded, so
              // telling the visitor to change their search would be misleading.
              <div className="px-3 py-12">
                <p className="text-base font-semibold text-white">Couldn&apos;t load the dojo list</p>
                <p className="mt-1 max-w-[44ch] text-sm text-white/60">
                  The server didn&apos;t respond. It may be waking up — this usually takes a few seconds.
                </p>
                <button
                  type="button"
                  onClick={fetchDojos}
                  className="mt-5 inline-flex h-11 items-center gap-2 bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
              </div>
            ) : listedDojos.length === 0 ? (
              <div className="px-3 py-12">
                <p className="text-base font-semibold text-white">No dojos match that search</p>
                <p className="mt-1 text-sm text-white/60">
                  Try a city or state name, or{' '}
                  <button type="button" onClick={() => chooseCity(null)} className="font-semibold text-white underline underline-offset-4">
                    show every dojo
                  </button>.
                </p>
              </div>
            ) : nearMode ? (
              // Distance order is the point of this mode; don't re-group it by state.
              <ul className="divide-y divide-white/10">{listedDojos.map(renderRow)}</ul>
            ) : (
              groupByState(listedDojos).map(({ state, dojos: stateDojos }, i) => (
                <section key={state} aria-label={state}>
                  <div role="heading" aria-level={3} className={`px-3 pb-1 text-sm font-semibold text-white/50 ${i === 0 && !showListBar ? 'pt-0' : 'pt-6'}`}>
                    {state}
                  </div>
                  <ul className="divide-y divide-white/10">{stateDojos.map(renderRow)}</ul>
                </section>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
