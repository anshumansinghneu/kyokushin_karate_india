'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users } from 'lucide-react';
import api from '@/lib/api';
import KarateLoader from '@/components/KarateLoader';
import { getImageUrl } from '@/lib/imageUtils';
import Reveal from '@/components/brand/Reveal';
import Section, { Heading } from '@/components/brand/Section';
import BrandLink from '@/components/brand/BrandLink';
import RankPortrait, { rankWeight } from '@/components/people/RankPortrait';

interface Instructor {
    id: string;
    name: string;
    currentBeltRank: string;
    profilePhotoUrl?: string;
    city?: string;
    state?: string;
    membershipNumber?: string;
    createdAt?: string;
    dojo?: { name: string; city: string } | null;
    teachingDojos?: { id: string; name: string; city: string }[];
}

function Portrait({ instructor, size }: { instructor: Instructor; size: 'lead' | 'base' }) {
    const dojo = instructor.teachingDojos?.[0] ?? (instructor.dojo ? { id: '', ...instructor.dojo } : null);
    return (
        <RankPortrait
            name={instructor.name}
            rank={instructor.currentBeltRank}
            photoUrl={getImageUrl(instructor.profilePhotoUrl || null)}
            detail={dojo?.name}
            location={dojo?.city ?? ([instructor.city, instructor.state].filter(Boolean).join(', ') || undefined)}
            href={dojo?.id ? `/dojos/${dojo.id}` : undefined}
            verifyHref={instructor.membershipNumber ? `/verify/${instructor.membershipNumber}` : undefined}
            size={size}
        />
    );
}

export default function InstructorsPage() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                const res = await api.get('/users/public-instructors');
                if (res.data?.data?.instructors) {
                    setInstructors(res.data.data.instructors);
                }
            } catch (err) {
                console.error('Failed to fetch instructors', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInstructors();
    }, []);

    // Rank is the layout: the most senior grade is set large, everyone else follows in order.
    const { senior, others } = useMemo(() => {
        const sorted = [...instructors].sort(
            (a, b) => rankWeight(b.currentBeltRank) - rankWeight(a.currentBeltRank) || a.name.localeCompare(b.name),
        );
        const top = sorted.length ? rankWeight(sorted[0].currentBeltRank) : 0;
        return {
            senior: sorted.filter((i) => rankWeight(i.currentBeltRank) === top),
            others: sorted.filter((i) => rankWeight(i.currentBeltRank) !== top),
        };
    }, [instructors]);

    return (
        <div className="min-h-screen text-white">
            <header data-bleed className="relative flex min-h-[60svh] overflow-hidden bg-black">
                <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-[clamp(3rem,8vh,5rem)] pt-40 sm:px-6 lg:px-8">
                    <h1 className="text-[clamp(2.75rem,8vw,6rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white">
                        Our senseis<span className="text-primary">.</span>
                    </h1>
                    <p className="mt-6 max-w-[44ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
                        Certified Kyokushin Karate instructors across India
                        {!loading && instructors.length > 0 ? `, ${instructors.length} in all, most senior first.` : '.'}
                    </p>
                </div>
            </header>

            <div className="bg-black pb-24">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <KarateLoader />
                    </div>
                ) : instructors.length === 0 ? (
                    <div className="px-4 py-20 text-center">
                        <Users className="mx-auto mb-4 h-10 w-10 text-white/40" aria-hidden="true" />
                        <h2 className="text-lg font-bold text-white">No instructors listed</h2>
                    </div>
                ) : (
                    <Section rhythm="tight" width="wide">
                        {/* One grid: the most senior grade spans two columns and two rows, everyone else flows around it. */}
                        <ul className="grid grid-flow-dense gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                            {senior.map((instructor, i) => (
                                <Reveal as="li" key={instructor.id} kind="depth" delay={i * 0.08} className="sm:col-span-2 lg:row-span-2">
                                    <Portrait instructor={instructor} size="lead" />
                                </Reveal>
                            ))}
                            {others.map((instructor, i) => (
                                <Reveal as="li" key={instructor.id} kind="depth" delay={(i % 4) * 0.06}>
                                    <Portrait instructor={instructor} size="base" />
                                </Reveal>
                            ))}
                        </ul>
                    </Section>
                )}

                <Section rhythm="base" width="wide">
                    <Reveal className="flex flex-col gap-8 border-t border-white/15 pt-12 md:flex-row md:items-end md:justify-between">
                        <Heading className="max-w-[18ch]">Train under one of them<span className="text-primary">.</span></Heading>
                        <BrandLink href="/find-a-dojo">Find a dojo</BrandLink>
                    </Reveal>
                </Section>
            </div>
        </div>
    );
}
