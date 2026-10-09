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
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { CITY_INDEX, normalizeCity } from '@/lib/cityCoords';
import SceneSlot from '@/components/three/SceneSlot';
import BrandLink from '@/components/brand/BrandLink';
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

/** True when the name carried the shared academy prefix. */
const hasAcademyPrefix = (name: string): boolean =>
  /^mas oyama karate academy\s*[-–,]\s*/i.test(name);

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
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
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

/* Grouped pin: several dojos at one location. Larger, and it states the count
   instead of silently hiding the others underneath. */
.dojo-pin--cluster,
.dojo-pin--cluster .dojo-pin__core {
  width: 30px;
  height: 30px;
}
.dojo-pin--cluster .dojo-pin__pulse {
  width: 30px;
  height: 30px;
  margin-top: -15px;
  margin-left: -15px;
}
.dojo-pin--cluster .dojo-pin__core::after { content: none; }
.dojo-pin__count {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
}

/* Remove leaflet default icon background */
.dojo-marker-icon {
  background: transparent !important;
  border: none !important;
}
/* Keyboard focus for map pins — they are real controls. */
.dojo-marker-icon:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: 3px;
  border-radius: 50%;
}

@media (prefers-reduced-motion: reduce) {
  .dojo-pin, .dojo-pin__core { transition: none; }
  .dojo-pin__pulse { animation: none; opacity: 0; }
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
/* Single-dojo popups follow the cursor and need no close affordance; grouped
   popups stay open so their list can be clicked, so they keep one. */
.kyoku-popup .leaflet-popup-close-button {
  color: #a1a1aa !important;
  padding: 10px 12px 0 0 !important;
  font-size: 18px !important;
}
.kyoku-popup .leaflet-popup-close-button:hover { color: #fff !important; }

/* Grouped-pin dojo list */
.kyoku-popup-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 190px;
  overflow-y: auto;
}
.kyoku-popup-list li + li { margin-top: 4px; }
.kyoku-popup-listitem {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.kyoku-popup-listitem:hover {
  background: rgba(220,38,38,0.16);
  border-color: rgba(220,38,38,0.45);
}
.kyoku-popup-listitem:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: 1px;
}
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
  border-radius: 8px; border: none; cursor: pointer;
  transition: background 0.2s;
}
.kyoku-popup-cta:hover { background: #b91c1c; }

/* Zoom controls */
.leaflet-control-zoom {
  border: 1px solid rgba(220,38,38,0.15) !important;
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
}
.leaflet-control-zoom a {
  position: relative;
  background: rgba(0,0,0,0.8) !important;
  color: #fff !important;
  border-color: rgba(255,255,255,0.08) !important;
  backdrop-filter: blur(10px);
  width: 36px !important;
  height: 36px !important;
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
.leaflet-control-zoom a::before { width: 13px; height: 2px; }
/* Vertical bar: turns the zoom-in button into a plus. */
.leaflet-control-zoom-in::after { width: 2px; height: 13px; }
.leaflet-control-zoom a:hover {
  background: rgba(220,38,38,0.15) !important;
  color: #ff4d4d !important;
}
.leaflet-control-zoom a:focus-visible {
  outline: 2px solid #ff4d4d;
  outline-offset: -2px;
}
/* Leaflet marks a disabled control at min/max zoom; show that honestly. */
.leaflet-control-zoom a.leaflet-disabled {
  opacity: 0.4;
  cursor: default;
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
  // 15 of the 22 dojos are named "Mas Oyama Karate Academy, <place>". Leading
  // every row with that shared prefix pushed the only distinguishing word onto
  // a second line and made the list unscannable, so the place leads instead and
  // the affiliation is stated once in the panel header.
  const place = stripAcademyPrefix(dojo.name);
  const affiliated = hasAcademyPrefix(dojo.name);

  return (
    <button
      type="button"
      // A full border, not a coloured side-stripe: the active state is carried
      // by border colour and a background lift.
      className={`group relative w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-150 border focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
        isActive
          ? 'bg-white/[0.07] border-red-600/40'
          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
      }`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      onClick={onClick}
      aria-label={`${dojo.name}, ${dojo.city}${dojo.state ? `, ${dojo.state}` : ''}`}
    >
      <div className="pr-5">
        <p className="text-[13px] font-bold text-white leading-snug">
          {place}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-400">
          <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{dojo.city}</span>
          {affiliated && (
            <>
              <span className="text-zinc-600" aria-hidden="true">&middot;</span>
              <span className="truncate text-zinc-500">Mas Oyama</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight
        aria-hidden="true"
        className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
          isActive ? 'text-red-500' : 'text-zinc-600 group-hover:text-zinc-300'
        }`}
      />
    </button>
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
  unmappedCount: number;
  onLocateMe: () => void;
  locateState: 'idle' | 'locating' | 'done' | 'denied';
  loadError: boolean;
  onRetry: () => void;
}

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
  unmappedCount,
  onLocateMe,
  locateState,
  loadError,
  onRetry,
}: FloatingDojoListProps) {
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      // Widened from 280px: at readable type sizes the old width forced dojo
      // names onto three lines.
      className={`absolute top-20 sm:top-24 right-4 sm:right-6 lg:right-8 bottom-6 w-[310px] lg:w-[330px] z-20 hidden md:flex flex-col bg-black/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-opacity duration-300 ${isDetailOpen ? 'opacity-0 pointer-events-none' : ''}`}
    >
      {/* Search + locate */}
      <div className="p-3 space-y-2">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none"
          />
          <input
            type="search"
            aria-label="Search dojos by city, state or instructor"
            placeholder="Search city, state, or instructor"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-zinc-400 focus:border-red-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 transition-colors"
          />
        </div>

        {/* The page asks "find your dojo" — offer the obvious answer. */}
        <button
          type="button"
          onClick={onLocateMe}
          disabled={locateState === 'locating'}
          className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[12px] font-semibold text-zinc-200 hover:bg-white/[0.07] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:opacity-60 transition-colors"
        >
          <Navigation
            aria-hidden="true"
            className={`w-3.5 h-3.5 ${locateState === 'locating' ? 'animate-pulse' : ''}`}
          />
          {locateState === 'locating'
            ? 'Finding you…'
            : locateState === 'done'
              ? 'Sorted by distance'
              : locateState === 'denied'
                ? 'Location unavailable'
                : 'Find dojos near me'}
        </button>
      </div>

      {/* Header row */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-white/[0.06]">
        <span className="text-[11px] font-semibold text-zinc-300">
          {dojos.length} {dojos.length === 1 ? 'dojo' : 'dojos'}
          {locateState === 'done' ? ' · nearest first' : ''}
        </span>
        {unmappedCount > 0 && (
          <span
            className="text-[11px] text-amber-400"
            title={`${unmappedCount} dojo(s) have no coordinates yet and do not appear as pins`}
          >
            {unmappedCount} unmapped
          </span>
        )}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-white/10 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : loadError ? (
          // Distinct from the empty-search state below: nothing was loaded, so
          // telling the visitor to change their search would be misleading.
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <AlertTriangle className="w-8 h-8 mb-3 text-amber-400" aria-hidden="true" />
            <p className="text-[13px] font-semibold text-zinc-100">Couldn&apos;t load the dojo list</p>
            <p className="mt-1 text-[11px] text-zinc-400">
              The server didn&apos;t respond. It may be waking up — this usually takes a few seconds.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : dojos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Shield className="w-8 h-8 mb-3 text-zinc-600" aria-hidden="true" />
            <p className="text-[13px] font-semibold text-zinc-200">No dojos match that search</p>
            <p className="mt-1 text-[11px] text-zinc-400">
              Try a city or state name, or clear the search to see all branches.
            </p>
          </div>
        ) : locateState === 'done' ? (
          // Distance order is the point of this mode; don't re-group it by state.
          <div className="space-y-1.5">
            {dojos.map((dojo) => (
              <DojoListCard
                key={dojo.id}
                dojo={dojo}
                isActive={dojo.id === hoveredDojoId || dojo.id === selectedDojoId}
                onHoverStart={() => onHoverStart(dojo.id)}
                onHoverEnd={onHoverEnd}
                onClick={() => onSelect(dojo)}
              />
            ))}
          </div>
        ) : (
          groupByState(dojos).map(({ state, dojos: stateDojos }) => (
            <section key={state} className="mb-3 last:mb-0">
              <h3 className="sticky top-0 z-[1] -mx-2.5 px-4 py-1.5 bg-black/85 backdrop-blur-sm flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-300 truncate">{state}</span>
                <span className="text-[11px] font-semibold text-zinc-500 tabular-nums">
                  {stateDojos.length}
                </span>
              </h3>
              <div className="mt-1.5 space-y-1.5">
                {stateDojos.map((dojo) => (
                  <DojoListCard
                    key={dojo.id}
                    dojo={dojo}
                    isActive={dojo.id === hoveredDojoId || dojo.id === selectedDojoId}
                    onHoverStart={() => onHoverStart(dojo.id)}
                    onHoverEnd={onHoverEnd}
                    onClick={() => onSelect(dojo)}
                  />
                ))}
              </div>
            </section>
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
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center text-zinc-200 hover:bg-red-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
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
              <span className="text-[10px] text-zinc-400">Status</span>
              <span className="text-[10px] font-semibold text-emerald-400">Verified & Active</span>
            </div>
            {dojo.address && (
              <div className="px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center gap-2">
                <MapPin className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                <span className="text-[10px] text-zinc-300">{dojo.address}</span>
              </div>
            )}
            {dojo.contactEmail && (
              <div className="px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">Contact</span>
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
  /* ---- State (all existing state preserved) ---- */
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
  /** Keyed by location group ("lat,lng"), since one pin can hold many dojos. */
  const markersRef = useRef<Record<string, LeafletType>>({});
  /** dojoId -> the group marker that represents it, for hover/fly-to sync. */
  const markerByDojoRef = useRef<Record<string, LeafletType>>({});
  const prevViewRef = useRef<{ center: LeafletType; zoom: number } | null>(null);
  const leafletRef = useRef<LeafletType>(null);

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
    setFocusCity(city?.key ?? null);
    setSearchQuery(city ? city.label : '');
  }, []);

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

      // Zoom was previously disabled on every axis (wheel, double-click, touch,
      // box, keyboard) with no zoom control either, so a visitor could pan but
      // never actually get closer to a city — on a page whose whole job is
      // "find the dojo near me", and with several cities holding multiple
      // dojos, that made the map unusable. All of it is restored, and keyboard
      // is on because this is the page's primary control (WCAG 2.1.1).
      const map = L.map(mapRef.current, {
        center: [22.5, 82.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 17,
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        maxBounds: indiaBounds,
        maxBoundsViscosity: 1.0,
        // Leaflet's default zoomSnap of 1 floors the value fitBounds computes.
        // For this pin spread that meant 5.75 became 5, so India sat small in
        // the middle of the frame with Oman and Thailand in view. Quarter steps
        // let the fit actually fill the canvas.
        zoomSnap: 0.25,
        zoomDelta: 0.5,
      });

      // Both go bottom-left: the dojo panel is an opaque layer above the map
      // on the right, so Leaflet's default bottom-right attribution was
      // rendered behind it — and the tile provider requires it be visible.
      L.control.zoom({ position: 'bottomleft' }).addTo(map);
      map.attributionControl.setPosition('bottomleft');

      // Esri's Dark Gray Canvas: a genuinely dark, neutral basemap with English
      // labels, served without an API key.
      //
      // CARTO's dark_all now watermarks every tile with "API KEY REQUIRED"
      // (as HTTP 200, so no status check catches it). Plain OpenStreetMap was
      // the first replacement, but it only ships a light style — inverting it
      // in CSS produced muddy olive terrain and surfaced Chinese, Arabic and
      // Cyrillic place names on a page about dojos in India. This layer needs
      // no filtering and suits the Black Belt palette directly.
      L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        },
      ).addTo(map);

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
    markerByDojoRef.current = {};

    const bounds = L.latLngBounds([]);

    locationGroups.forEach((group) => {
      const { coords, dojos: groupDojos } = group;
      const count = groupDojos.length;
      bounds.extend(coords);

      // A grouped pin states its own count, so seven Kanpur dojos read as
      // seven rather than as one arbitrary winner.
      const pinHTML = `
        <div class="dojo-pin${count > 1 ? ' dojo-pin--cluster' : ''}">
          <span class="dojo-pin__pulse"></span>
          <div class="dojo-pin__core">${count > 1 ? `<span class="dojo-pin__count">${count}</span>` : ''}</div>
        </div>
      `;

      const size = count > 1 ? 30 : 22;
      const icon = L.divIcon({
        html: pinHTML,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
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
          <div class="kyoku-popup-badge">Branch ${escapeHtml(groupDojos[0].dojoCode || 'N/A')}</div>
          <div class="kyoku-popup-name">${escapeHtml(groupDojos[0].name)}</div>
          <div class="kyoku-popup-loc">${escapeHtml(place)}</div>
          <button class="kyoku-popup-cta" data-dojo-id="${escapeHtml(groupDojos[0].id)}">
            View Dojo &rarr;
          </button>
        </div>
      `
        : `
        <div class="kyoku-popup-inner">
          <div class="kyoku-popup-badge">${count} Dojos</div>
          <div class="kyoku-popup-name">${escapeHtml(place)}</div>
          <ul class="kyoku-popup-list">
            ${groupDojos.map((d) => `
              <li>
                <button class="kyoku-popup-listitem" data-dojo-id="${escapeHtml(d.id)}">
                  ${escapeHtml(stripAcademyPrefix(d.name))}
                </button>
              </li>`).join('')}
          </ul>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'kyoku-popup',
        closeButton: count > 1,
        offset: [0, -(size / 2) - 8],
        autoPan: count > 1,
        maxHeight: 260,
      });

      if (count === 1) {
        const only = groupDojos[0];
        marker.on('mouseover', () => {
          setHoveredDojoId(only.id);
          marker.openPopup();
        });
        marker.on('mouseout', () => {
          setHoveredDojoId(null);
          marker.closePopup();
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

    // Frame the pins, not the subcontinent.
    //
    // The old code fit a fixed India bounding box into the full container. On a
    // wide viewport the latitude constraint dominates, so longitude overshot
    // and the frame filled with Turkmenistan, western China and Arabia while
    // India sat small in the middle. Fitting the actual pins — and padding for
    // the title on the left and the dojo panel on the right so nothing lands
    // underneath them — makes India the subject of its own map.
    if (locationGroups.length > 0 && !selectedDojo) {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;
      // Just enough to clear the panel and headline. Larger insets shrink the
      // usable canvas so much that the fit zooms out past India again.
      const panelInset = isDesktop ? 300 : 16;
      const titleInset = isDesktop ? 120 : 16;
      // On mobile the headline block sits over the top of the map and the
      // sheet over the bottom, so reserve for both or pins land underneath.
      const topInset = isDesktop ? 110 : 210;
      const bottomInset = isDesktop ? 110 : 300;

      if (locationGroups.length === 1) {
        map.setView(locationGroups[0].coords, 11, { animate: true, duration: 0.9 });
      } else {
        // Vertical padding is kept symmetric: an asymmetric pair shifts the
        // projected centre and pushed the southernmost pin below the fold.
        map.fitBounds(bounds, {
          paddingTopLeft: [titleInset, topInset],
          paddingBottomRight: [panelInset, bottomInset],
          maxZoom: searchQuery ? 13 : 9,
          animate: true,
          duration: 0.9,
        });
      }
    }
  }, [locationGroups, filteredDojos, searchQuery, getDojoCoords, selectedDojo, mapReady]);

  /* ---- Hover sync: add/remove .active class on pin ---- */
  useEffect(() => {
    // Markers are keyed by location now, so resolve the active dojo to its
    // group marker rather than comparing marker keys to dojo ids (which would
    // never match and left hover highlighting dead).
    const activeMarkers = new Set(
      [hoveredDojoId, selectedDojo?.id]
        .filter(Boolean)
        .map((id) => markerByDojoRef.current[id as string])
        .filter(Boolean),
    );

    Object.values(markersRef.current).forEach((marker: LeafletType) => {
      const el = marker.getElement();
      if (!el) return;
      const pin = el.querySelector('.dojo-pin') as HTMLElement | null;
      if (!pin) return;
      pin.classList.toggle('active', activeMarkers.has(marker));
    });
  }, [hoveredDojoId, selectedDojo]);

  /* ---- Popup actions (delegated; no inline onclick) ---- */
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('[data-dojo-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-dojo-id');
      const dojo = dojos.find((d) => d.id === id);
      if (dojo) setSelectedDojo(dojo);
    };
    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, [dojos]);

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

  // The old global 'dojo-select' listener is gone: popup buttons no longer
  // carry inline onclick handlers, they are handled by the delegated
  // [data-dojo-id] listener on the map container above.

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
    {/* The working finder: a full-viewport street map below the opener.
        data-lenis-prevent keeps wheel and trackpad gestures on the map. */}
    <div id="finder" data-lenis-prevent className="relative w-full h-[100svh] scroll-mt-0 overflow-hidden text-white font-sans selection:bg-primary bg-black">
      {/* ============================================================ */}
      {/*  FULL-VIEWPORT MAP                                           */}
      {/* ============================================================ */}
      <div ref={mapRef} className="kkfi-dark-map absolute inset-0 z-0 w-full h-full" />

      {/* Map edge scrims.
          The title and tagline sit directly on the map, and the previous fades
          (black/40 over 240px) were too weak — the tagline landed on country
          labels and became unreadable. These are strong enough to guarantee
          contrast for the overlaid type at any map position. */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        {/* Corner wedge anchoring the headline */}
        <div className="absolute top-0 left-0 w-[36rem] h-[34rem] max-w-[75vw] bg-[radial-gradient(ellipse_at_top_left,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.75)_38%,transparent_72%)]" />
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
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
            <KarateLoader label="Finding dojos" />
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
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            Every dojo<span className="text-primary">.</span>
          </h2>

          {/* Tagline — zinc-400 over live map tiles failed contrast; zinc-200
              on the scrim above clears AA comfortably. Now also states the
              scale of the network, which is the reassurance a parent wants. */}
          <p className="mt-3 max-w-[22ch] text-[13px] text-zinc-200 font-medium leading-relaxed">
            {isLoading ? (
              'Locating dojos across India…'
            ) : loadError ? (
              // Never state a branch count we could not load — "0 official
              // branches across India" is a false claim about the organisation.
              'We could not load the dojo list just now.'
            ) : (
              <>
                {dojos.length} official {dojos.length === 1 ? 'branch' : 'branches'} across India.
                {/* Kept to one line on phones, where the map area is short and a
                    three-line tagline collided with the northern pins. */}
                <span className="hidden sm:inline"> Search, or find the one nearest you.</span>
              </>
            )}
          </p>

        </motion.div>
      </div>

      {/* ============================================================ */}
      {/*  FLOATING DOJO LIST PANEL                                    */}
      {/* ============================================================ */}
      <FloatingDojoList
        dojos={listedDojos}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hoveredDojoId={hoveredDojoId}
        selectedDojoId={selectedDojo?.id ?? null}
        onHoverStart={setHoveredDojoId}
        onHoverEnd={() => setHoveredDojoId(null)}
        onSelect={setSelectedDojo}
        isLoading={isLoading}
        isDetailOpen={!!selectedDojo}
        unmappedCount={unmappedCount}
        onLocateMe={handleLocateMe}
        locateState={locateState}
        loadError={loadError}
        onRetry={fetchDojos}
      />

      {/* ============================================================ */}
      {/*  MOBILE BOTTOM SHEET — DOJO LIST                             */}
      {/* ============================================================ */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 z-[20]">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search dojos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-red-500/30 transition-colors"
              />
            </div>
          </div>

          {/* Locate control, mirroring the desktop panel */}
          <div className="px-4 pb-3">
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locateState === 'locating'}
              className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[12px] font-semibold text-zinc-200 active:scale-[0.98] disabled:opacity-60 transition-transform"
            >
              <Navigation aria-hidden="true" className={`w-3.5 h-3.5 ${locateState === 'locating' ? 'animate-pulse' : ''}`} />
              {locateState === 'locating'
                ? 'Finding you…'
                : locateState === 'done'
                  ? 'Sorted by distance'
                  : locateState === 'denied'
                    ? 'Location unavailable'
                    : 'Find dojos near me'}
            </button>
          </div>

          {/* Vertically scrollable list.
              Was a horizontal strip capped at .slice(0, 10), which made 12 of
              the 22 dojos unreachable on a phone — the device most prospective
              students actually use. */}
          {/* 38vh of list plus the search and locate controls left only a
              ~230px sliver of map on a 844px phone. Capped so the map stays
              the dominant element it is meant to be. */}
          <div className="max-h-[24vh] overflow-y-auto px-4 pb-3 space-y-1.5">
            {loadError ? (
              <div className="py-5 text-center">
                <p className="text-[12px] font-semibold text-zinc-100">Couldn&apos;t load the dojo list</p>
                <p className="mt-1 text-[11px] text-zinc-400">The server didn&apos;t respond.</p>
                <button
                  type="button"
                  onClick={fetchDojos}
                  className="mt-3 h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-red-600 text-white text-[12px] font-bold uppercase tracking-wider active:scale-[0.98] transition-transform"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  Try again
                </button>
              </div>
            ) : listedDojos.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-zinc-400">
                No dojos match that search.
              </p>
            ) : (
              listedDojos.map((dojo) => (
                <button
                  key={dojo.id}
                  type="button"
                  onClick={() => setSelectedDojo(dojo)}
                  className="w-full text-left p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg active:scale-[0.98] transition-transform"
                >
                  <span className="block text-[13px] font-bold text-white leading-snug">
                    {stripAcademyPrefix(dojo.name)}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-zinc-400">
                    {dojo.city}{dojo.state ? `, ${dojo.state}` : ''}
                  </span>
                </button>
              ))
            )}
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
    </>
  );
}
