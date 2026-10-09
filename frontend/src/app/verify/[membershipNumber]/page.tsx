'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BadgeCheck, Printer } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';
import KarateLoader from '@/components/KarateLoader';

import { formatDateOnly } from '@/lib/dateOnly';
interface VerifiedMember {
    name: string;
    membershipNumber: string;
    membershipStatus: string;
    membershipStartDate?: string;
    membershipEndDate?: string;
    currentBeltRank: string;
    role: string;
    profilePhotoUrl?: string;
    dojo?: { name: string; city: string } | null;
    lastPromotion?: { newBelt: string; promotionDate: string } | null;
    experience?: { years: number; months: number; display: string };
    totalPromotions?: number;
    city?: string;
    state?: string;
    createdAt?: string;
    beltHistory?: { newBelt: string; promotionDate: string }[];
    international?: InternationalRecord;
}

import InternationalHonours, { InternationalChip } from "@/components/InternationalHonours";
import { readInternational, type InternationalRecord } from "@/lib/international";

/** Cloth colours, shown only as rank swatches: the colour carries the rank. */
const BELT_SWATCH: Record<string, string> = {
    White: '#ffffff',
    Orange: '#f97316',
    Blue: '#3b82f6',
    Yellow: '#eab308',
    Green: '#22c55e',
    Brown: '#92400e',
    Black: '#161616',
};

function beltSwatch(rank: string) {
    const key = Object.keys(BELT_SWATCH).find(k => rank.includes(k));
    return key ? BELT_SWATCH[key] : '#555555';
}

const STATUS: Record<string, { label: string; tone: string }> = {
    ACTIVE: { label: 'Verified, active member', tone: 'text-white' },
    EXPIRED: { label: 'Membership expired', tone: 'text-primary-light' },
    REJECTED: { label: 'Membership rejected', tone: 'text-primary-light' },
};

const roleLabel = (role: string) => (role === 'INSTRUCTOR' ? 'Instructor' : role === 'ADMIN' ? 'Administrator' : 'Student');

/*
 * Printing: only the record itself goes to paper, in black on white. Scoped to
 * this page with a data attribute; the site chrome is left alone on screen.
 */
const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  [data-print-record], [data-print-record] * { visibility: visible !important; }
  [data-print-record] { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; background: #fff !important; }
  [data-print-record] * { color: #000 !important; border-color: rgba(0,0,0,0.25) !important; background: transparent !important; }
  [data-print-hide] { display: none !important; }
}`;

export default function VerifyPage() {
    const params = useParams();
    const membershipNumberFromUrl = params?.membershipNumber as string | undefined;

    const [searchQuery, setSearchQuery] = useState(membershipNumberFromUrl || '');
    const [member, setMember] = useState<VerifiedMember | null>(null);
    // Start in the loading state when a number arrives in the URL, so the page never flashes empty.
    const [loading, setLoading] = useState(!!membershipNumberFromUrl);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

    const doSearch = async (query: string) => {
        if (!query.trim()) return;
        setLoading(true);
        setError('');
        setMember(null);
        setSearched(true);

        try {
            const res = await api.get(`/belts/verify/${encodeURIComponent(query.trim())}`);
            if (res.data?.data?.member) {
                setMember(res.data.data.member);
            } else {
                setError(res.data?.message || 'No member found with this membership number');
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || 'Failed to connect to verification server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (membershipNumberFromUrl) {
            doSearch(membershipNumberFromUrl);
        }
    }, [membershipNumberFromUrl]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        doSearch(searchQuery);
    };

    const status = member ? STATUS[member.membershipStatus] ?? { label: 'Membership pending approval', tone: 'text-white/75' } : null;
    const isActive = member?.membershipStatus === 'ACTIVE';
    const history = member?.beltHistory?.length
        ? [...member.beltHistory].sort((a, b) => a.promotionDate.localeCompare(b.promotionDate))
        : [];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
            <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

            <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
                {/* Search another, quietly above the record. */}
                <div data-print-hide className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <Link href="/verify" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Membership register
                    </Link>
                    <form onSubmit={handleSubmit} role="search" aria-label="Verify another membership number" className="flex w-full items-end gap-3 sm:w-auto">
                        <div className="flex-1 sm:w-72">
                            <label htmlFor="verify-again" className="sr-only">Membership number</label>
                            <input
                                id="verify-again"
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Another membership number"
                                autoComplete="off"
                                spellCheck={false}
                                className="min-h-12 w-full rounded-none border-0 border-b-2 border-white/25 bg-transparent px-1 font-semibold uppercase tabular-nums text-white placeholder:normal-case placeholder:font-normal placeholder:text-white/45 transition-colors focus:outline-none focus-visible:border-primary"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !searchQuery.trim()}
                            className="inline-flex min-h-12 items-center gap-2 rounded-none bg-primary px-5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/50"
                        >
                            Verify <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </form>
                </div>

                <div className="mt-12" aria-live="polite">
                    {loading && (
                        <div className="flex min-h-[50svh] items-center justify-center">
                            <KarateLoader label="Checking the register" />
                        </div>
                    )}

                    {searched && !loading && error && (
                        <section className="border-y border-white/10 py-16">
                            <p className="text-sm font-semibold text-primary-light">No record found</p>
                            <h1 className="mt-3 max-w-[18ch] text-balance text-[clamp(2rem,5vw,3.5rem)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
                                Not in the register<span className="text-primary">.</span>
                            </h1>
                            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-white/75">{error}</p>
                            <p className="mt-2 max-w-[52ch] leading-relaxed text-white/60">
                                Check the number against the membership card or certificate, including every letter and dash.
                            </p>
                            <button
                                onClick={() => { setSearched(false); setError(''); setSearchQuery(''); }}
                                className="mt-8 inline-flex min-h-12 items-center rounded-none border border-white/25 px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                            >
                                Try a different ID
                            </button>
                        </section>
                    )}

                    {searched && !loading && member && status && (
                        <article data-print-record aria-labelledby="record-name" className="rounded-xl border border-white/15 bg-surface">
                            {/* Letterhead */}
                            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-10">
                                <div className="flex items-center gap-3">
                                    <Image src="/kkfi-logo.avif" alt="" width={36} height={36} className="h-9 w-9" />
                                    <div>
                                        <p className="text-sm font-bold text-white">Kyokushin Karate Foundation of India</p>
                                        <p className="text-sm text-white/60">Membership record</p>
                                    </div>
                                </div>
                                <p className={`flex items-center gap-2 text-sm font-bold ${status.tone}`}>
                                    {isActive && <BadgeCheck className="h-5 w-5 text-secondary" aria-hidden="true" />}
                                    {status.label}
                                </p>
                            </header>

                            {/* Identity */}
                            <div className="grid gap-8 px-6 py-10 sm:grid-cols-[auto_1fr] sm:items-center sm:px-10">
                                {member.profilePhotoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={member.profilePhotoUrl} alt={`Photograph of ${member.name}`} className="h-36 w-28 rounded-md object-cover ring-1 ring-white/15" />
                                ) : (
                                    <div aria-hidden="true" className="flex h-36 w-28 items-center justify-center rounded-md bg-black text-4xl font-black text-white/40 ring-1 ring-white/15">
                                        {member.name.charAt(0)}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h1 id="record-name" className="text-balance text-[clamp(2rem,5vw,3.25rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-white">
                                        {member.name}
                                    </h1>
                                    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-white/75">
                                        <span className="text-lg font-bold tabular-nums tracking-[0.04em] text-white">{member.membershipNumber}</span>
                                        <span>{roleLabel(member.role)}</span>
                                        <InternationalChip record={readInternational(member.international)} />
                                    </p>
                                </div>
                            </div>

                            {/* The facts */}
                            <dl className="grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="border-b border-white/10 px-6 py-6 sm:px-10">
                                    <dt className="text-sm font-semibold text-white/60">Rank</dt>
                                    <dd className="mt-2 flex items-center gap-3 text-xl font-extrabold text-white">
                                        <span className="h-3 w-8 rounded-sm ring-1 ring-white/30" style={{ backgroundColor: beltSwatch(member.currentBeltRank) }} aria-hidden="true" />
                                        {member.currentBeltRank}
                                    </dd>
                                </div>
                                {member.dojo && (
                                    <div className="border-b border-white/10 px-6 py-6 sm:px-10">
                                        <dt className="text-sm font-semibold text-white/60">Dojo</dt>
                                        <dd className="mt-2">
                                            <span className="block text-lg font-bold leading-snug text-white">{member.dojo.name}</span>
                                            <span className="text-white/65">{member.dojo.city}</span>
                                        </dd>
                                    </div>
                                )}
                                {member.membershipStartDate && (
                                    <div className="border-b border-white/10 px-6 py-6 sm:px-10">
                                        <dt className="text-sm font-semibold text-white/60">Member since</dt>
                                        <dd className="mt-2 text-lg font-bold text-white">
                                            {formatDateOnly(member.membershipStartDate, { month: 'long', year: 'numeric' }, 'en-IN')}
                                        </dd>
                                    </div>
                                )}
                                {member.membershipEndDate && (
                                    <div className="border-b border-white/10 px-6 py-6 sm:px-10">
                                        <dt className="text-sm font-semibold text-white/60">{isActive ? 'Valid until' : 'Expired'}</dt>
                                        <dd className={`mt-2 text-lg font-bold ${isActive ? 'text-white' : 'text-primary-light'}`}>
                                            {formatDateOnly(member.membershipEndDate, { day: 'numeric', month: 'long', year: 'numeric' }, 'en-IN')}
                                        </dd>
                                    </div>
                                )}
                                {member.experience && (
                                    <div className="border-b border-white/10 px-6 py-6 sm:px-10">
                                        <dt className="text-sm font-semibold text-white/60">Training</dt>
                                        <dd className="mt-2 text-lg font-bold text-white">{member.experience.display}</dd>
                                    </div>
                                )}
                                {typeof member.totalPromotions === 'number' && member.totalPromotions > 0 && (
                                    <div className="border-b border-white/10 px-6 py-6 sm:px-10">
                                        <dt className="text-sm font-semibold text-white/60">Promotions</dt>
                                        <dd className="mt-2 text-lg font-bold tabular-nums text-white">{member.totalPromotions}</dd>
                                    </div>
                                )}
                            </dl>

                            {/* Promotion history, oldest first: the path walked. */}
                            {(history.length > 0 || member.lastPromotion) && (
                                <section aria-labelledby="history-heading" className="px-6 py-10 sm:px-10">
                                    <h2 id="history-heading" className="text-xl font-extrabold text-white">Promotion history</h2>
                                    {history.length > 0 ? (
                                        <ol className="mt-6 divide-y divide-white/10 border-y border-white/10">
                                            {history.map((p, i) => (
                                                <li key={`${p.newBelt}-${p.promotionDate}-${i}`} className="flex items-center justify-between gap-4 py-4">
                                                    <span className="flex items-center gap-3 font-bold text-white">
                                                        <span className="h-3 w-8 rounded-sm ring-1 ring-white/30" style={{ backgroundColor: beltSwatch(p.newBelt) }} aria-hidden="true" />
                                                        {p.newBelt}
                                                    </span>
                                                    <span className="tabular-nums text-white/65">
                                                        {formatDateOnly(p.promotionDate, { day: 'numeric', month: 'short', year: 'numeric' }, 'en-IN')}
                                                    </span>
                                                </li>
                                            ))}
                                        </ol>
                                    ) : member.lastPromotion ? (
                                        <p className="mt-4 text-white/75">
                                            Last promoted to <span className="font-bold text-white">{member.lastPromotion.newBelt} Belt</span> on{' '}
                                            {formatDateOnly(member.lastPromotion.promotionDate, { day: 'numeric', month: 'long', year: 'numeric' }, 'en-IN')}.
                                        </p>
                                    ) : null}
                                </section>
                            )}

                            {/* Representing India. Renders nothing for a member who has never travelled. */}
                            <div className="px-6 sm:px-10 [&:empty]:hidden">
                                <InternationalHonours record={readInternational(member.international)} className="mb-10" />
                            </div>

                            {/* Attestation */}
                            <footer className="flex flex-col gap-4 border-t border-white/10 px-6 py-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-10">
                                <p>
                                    Checked against the KKFI register on{' '}
                                    <span className="font-semibold text-white/85">
                                        {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    . Verify again at kyokushinfoundation.com/verify.
                                </p>
                                <button
                                    type="button"
                                    data-print-hide
                                    onClick={() => window.print()}
                                    className="inline-flex min-h-11 items-center gap-2 self-start rounded-none border border-white/25 px-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10 sm:self-auto"
                                >
                                    <Printer className="h-4 w-4" aria-hidden="true" /> Print
                                </button>
                            </footer>
                        </article>
                    )}

                    {searched && !loading && member && (
                        <div data-print-hide className="mt-10">
                            <button
                                onClick={() => { setSearched(false); setMember(null); setSearchQuery(''); }}
                                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
                            >
                                Verify another member <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
