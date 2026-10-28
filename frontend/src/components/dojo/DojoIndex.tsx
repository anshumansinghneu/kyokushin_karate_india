'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Navigation } from 'lucide-react';
import api from '@/lib/api';
import { normalizeCity } from '@/lib/cityCoords';
import { sizedImageUrl } from '@/lib/imageUtils';
import KankuMark from '@/components/KankuMark';
import { DanBars, danName, ordinal, parseDan, rankWeight } from '@/components/people/RankPortrait';

export interface IndexDojo {
  id: string;
  name: string;
  city: string;
  state?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface DojoInstructor {
  name: string;
  currentBeltRank?: string;
  profilePhotoUrl?: string | null;
}

export interface Sensei {
  name: string;
  rank: string;
  photo: string | null;
}

/** KKFI's headquarters is in Shuklaganj (the sourced founding facts); its dojo carries the mark. */
const isHeadquarters = (d: IndexDojo) => /shuklaganj/i.test(`${d.name} ${d.address ?? ''}`);

const directionsUrl = (d: IndexDojo) =>
  d.latitude && d.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([d.name, d.address, d.city, d.state].filter(Boolean).join(', '))}`;

/**
 * The most senior instructor at each dojo. The dojo list carries instructors' photos and
 * ranks once the backend serves them; until then each dojo's own record is read instead.
 */
function useSenseiByDojo(ids: string[]) {
  const [byDojo, setByDojo] = useState<Record<string, Sensei>>({});
  // Fetched once: the first list the index renders is the whole register, and filtering
  // afterwards only hides entries.
  const fetched = useRef(false);
  const done = useRef(false);
  const key = ids.join(',');
  useEffect(() => {
    if (!key || fetched.current) return;
    fetched.current = true;
    let alive = true;
    const pick = (list: DojoInstructor[] = []): Sensei | undefined => {
      const best = [...list].sort((a, b) => rankWeight(b.currentBeltRank) - rankWeight(a.currentBeltRank))[0];
      return best ? { name: best.name.trim(), rank: best.currentBeltRank ?? '', photo: best.profilePhotoUrl ?? null } : undefined;
    };
    (async () => {
      const out: Record<string, Sensei> = {};
      const list = await api.get('/dojos').then((r) => r.data?.data?.dojos ?? []).catch(() => []);
      const rich = list.some((d: { instructors?: DojoInstructor[] }) => d.instructors?.some((i) => 'currentBeltRank' in i));
      if (rich) {
        for (const d of list) {
          const s = pick(d.instructors);
          if (s) out[d.id] = s;
        }
      } else {
        await Promise.all(
          key.split(',').map((id) =>
            api
              .get(`/dojos/${encodeURIComponent(id)}`)
              .then((r) => {
                const s = pick(r.data?.data?.dojo?.instructors);
                if (s) out[id] = s;
              })
              .catch(() => {}),
          ),
        );
      }
      // An instructor registered at a dojo (their home dojo) teaches there too, even when
      // nobody has linked them as its teacher yet: fill the dojos still without a sensei.
      const instructors = await api.get('/users/public-instructors').then((r) => r.data?.data?.instructors ?? []).catch(() => []);
      const idByName = new Map<string, string>(list.map((d: { id: string; name: string }) => [d.name.trim().toLowerCase(), d.id]));
      for (const inst of instructors as (DojoInstructor & { dojo?: { name: string } | null })[]) {
        const id = inst.dojo ? idByName.get(inst.dojo.name.trim().toLowerCase()) : undefined;
        const s = pick([inst]);
        if (id && s && (!out[id] || rankWeight(inst.currentBeltRank) > rankWeight(out[id].rank))) out[id] = s;
      }
      if (alive) {
        done.current = true;
        setByDojo(out);
      }
    })();
    return () => {
      // A run cancelled before it finished (React's development double-run) frees the next.
      alive = false;
      if (!done.current) fetched.current = false;
    };
  }, [key]);
  return byDojo;
}

function RankLine({ rank }: { rank: string }) {
  const dan = parseDan(rank);
  if (dan > 0) {
    return (
      <span className="inline-flex items-center gap-2 text-secondary">
        <DanBars dan={dan} />
        {ordinal(dan)} Dan · {danName(dan)}
      </span>
    );
  }
  return <span className="text-white/55">{rank} belt</span>;
}

/** The sensei's print: their photograph, or the dojo's city set large over a faint Kanku. */
function Print({ sensei, city, compact = false, className = '' }: { sensei?: Sensei; city: string; compact?: boolean; className?: string }) {
  const src = sizedImageUrl(sensei?.photo, 320);
  return (
    <div className={`relative overflow-hidden bg-[#0b0b0b] ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top grayscale" />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 flex items-end overflow-hidden">
          <KankuMark className={compact ? 'absolute inset-[12%] text-white/[0.12]' : 'absolute -right-[18%] -top-[12%] h-[90%] w-[90%] text-white/[0.05]'} />
          {/* A thumbnail is too small to set the city in; the Kanku alone holds it. */}
          {!compact && <span className="break-words px-3 pb-3 font-mincho text-[clamp(1.25rem,3.2vw,3rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-white/[0.16]">
            {city}
          </span>}
        </div>
      )}
    </div>
  );
}

function Entry({
  dojo,
  label,
  sensei,
  distance,
  active,
  onPoint,
  onShowOnMap,
}: {
  dojo: IndexDojo;
  label: string;
  sensei?: Sensei;
  distance?: string;
  active: boolean;
  onPoint: () => void;
  onShowOnMap: () => void;
}) {
  const hq = isHeadquarters(dojo);
  return (
    <li
      onMouseEnter={onPoint}
      onFocus={onPoint}
      className="group relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8"
    >
      {/* Phones carry the print in the row; desktop shows it in the sensei panel. */}
      <Print sensei={sensei} city={dojo.city} compact className="row-span-2 aspect-[4/5] w-14 rounded-sm sm:hidden" />
      <div className="min-w-0">
        <h4 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Link
            href={`/dojos/${encodeURIComponent(dojo.id)}`}
            className={`text-balance font-mincho text-[clamp(1.4rem,2.4vw,2.1rem)] font-extrabold leading-[1.08] tracking-[-0.015em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? 'text-white' : 'text-white/85'} group-hover:text-white`}
          >
            {/* The whole row is the link's target area, so the row hovers as one. */}
            <span className="absolute inset-0" aria-hidden="true" />
            {label}
          </Link>
          {hq && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70">
              <span aria-hidden="true" className="h-1.5 w-1.5 bg-primary" /> KKFI headquarters
            </span>
          )}
        </h4>
        {dojo.address && <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-white/55">{dojo.address}</p>}
        {sensei && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold text-white/85">{sensei.name}</span>
            <RankLine rank={sensei.rank} />
          </p>
        )}
      </div>
      <div className="relative z-10 col-start-2 flex items-center gap-1 sm:col-start-auto sm:row-span-1 sm:flex-col sm:items-end sm:justify-between sm:gap-3">
        {distance && <span className="font-mincho text-2xl font-extrabold tabular-nums text-white sm:text-3xl">{distance}</span>}
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={onShowOnMap}
            className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" /> Map
          </button>
          <a
            href={directionsUrl(dojo)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" /> Directions
          </a>
          <ArrowRight aria-hidden="true" className="ml-1 hidden h-5 w-5 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white sm:block" />
        </span>
      </div>
    </li>
  );
}

/** Desktop: the sensei of the dojo being pointed at, held beside the city's list. */
function SenseiPanel({ dojo, sensei }: { dojo?: IndexDojo; sensei?: Sensei }) {
  if (!dojo) return null;
  return (
    <figure className="sticky top-28 hidden lg:block">
      <div key={dojo.id} className="animate-[kkfi-print_600ms_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none">
        <Print sensei={sensei} city={dojo.city} className="aspect-[4/5] w-full rounded-lg ring-1 ring-white/10" />
      </div>
      <figcaption className="mt-4 text-sm">
        {sensei ? (
          <>
            <span className="block font-semibold text-white">{sensei.name}</span>
            <span className="mt-1 block"><RankLine rank={sensei.rank} /></span>
          </>
        ) : (
          <span className="text-white/50">Instructor not yet listed</span>
        )}
      </figcaption>
    </figure>
  );
}

/**
 * The dojo index: every dojo as an entry under its city, the city set large, with the
 * sensei's portrait held beside the list on desktop. "Near me" flattens it into one list,
 * nearest first, with the distance set as large as the name. Live data only.
 */
export default function DojoIndex({
  dojos,
  labelOf,
  distances,
  nearMode,
  onShowOnMap,
}: {
  dojos: IndexDojo[];
  labelOf: (d: IndexDojo) => string;
  distances: Record<string, string>;
  nearMode: boolean;
  onShowOnMap: (d: IndexDojo) => void;
}) {
  const allIds = useMemo(() => dojos.map((d) => d.id).sort(), [dojos]);
  const senseiByDojo = useSenseiByDojo(allIds);
  const [pointed, setPointed] = useState<Record<string, string>>({});

  const cities = useMemo(() => {
    const groups = new Map<string, { label: string; state?: string; dojos: IndexDojo[] }>();
    for (const d of dojos) {
      const key = normalizeCity(d.city) || d.city;
      const g = groups.get(key);
      if (g) g.dojos.push(d);
      else groups.set(key, { label: d.city.trim(), state: d.state, dojos: [d] });
    }
    // Headquarters first within its city; cities by size.
    for (const g of groups.values()) g.dojos.sort((a, b) => Number(isHeadquarters(b)) - Number(isHeadquarters(a)));
    return [...groups.entries()].sort((a, b) => b[1].dojos.length - a[1].dojos.length || a[1].label.localeCompare(b[1].label));
  }, [dojos]);

  const entry = (d: IndexDojo, groupKey: string) => (
    <Entry
      key={d.id}
      dojo={d}
      label={labelOf(d)}
      sensei={senseiByDojo[d.id]}
      distance={distances[d.id]}
      active={(pointed[groupKey] ?? '') === d.id}
      onPoint={() => setPointed((p) => (p[groupKey] === d.id ? p : { ...p, [groupKey]: d.id }))}
      onShowOnMap={() => onShowOnMap(d)}
    />
  );

  if (nearMode) {
    const first = dojos.find((d) => d.id === pointed.near) ?? dojos[0];
    return (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
        <ul className="divide-y divide-white/10 border-y border-white/10">{dojos.map((d) => entry(d, 'near'))}</ul>
        <SenseiPanel dojo={first} sensei={first ? senseiByDojo[first.id] : undefined} />
      </div>
    );
  }

  return (
    <div className="space-y-24 lg:space-y-32">
      {cities.map(([key, g]) => {
        const shown = g.dojos.find((d) => d.id === pointed[key]) ?? g.dojos[0];
        return (
          <section key={key} aria-labelledby={`city-${key}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-white/15 pb-5">
              <h3 id={`city-${key}`} className="font-mincho text-[clamp(3rem,7vw,6rem)] font-extrabold leading-[0.9] tracking-[-0.035em] text-white">
                {g.label}
              </h3>
              <p className="text-sm font-semibold text-white/55">
                <span className="tabular-nums text-white">{g.dojos.length}</span> {g.dojos.length === 1 ? 'dojo' : 'dojos'}
                {g.state ? ` · ${g.state}` : ''}
              </p>
            </div>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
              <ul className="divide-y divide-white/10">{g.dojos.map((d) => entry(d, key))}</ul>
              <div className="pt-7">
                <SenseiPanel dojo={shown} sensei={shown ? senseiByDojo[shown.id] : undefined} />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
