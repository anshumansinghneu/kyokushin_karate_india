import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowUpRight, MapPin, Navigation } from 'lucide-react';
import Section, { Heading } from '@/components/brand/Section';
import BrandLink from '@/components/brand/BrandLink';
import KankuMark from '@/components/KankuMark';
import { SITE, chiefInstructor, dojoJsonLd, getDojos, getRegister, groupByCity, shortName, type PublicDojo } from '@/lib/dojoSeo';

/*
 * One landing page per city KKFI teaches in: "Kyokushin karate classes in Kanpur".
 * Server-rendered from the live register so search engines read every dojo, its
 * address and instructor; refreshed hourly.
 */

export const revalidate = 3600;

export async function generateStaticParams() {
    return groupByCity(await getDojos()).map((g) => ({ city: g.slug }));
}

async function cityFor(slug: string) {
    return groupByCity(await getRegister()).find((g) => g.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
    const g = await cityFor((await params).city);
    // Decided here, before the response starts streaming, so an unknown city is a real 404.
    if (!g) notFound();
    const n = g.dojos.length;
    const where = g.state ? `${g.city}, ${g.state}` : g.city;
    const title = `Kyokushin Karate Classes in ${g.city}`;
    const description = `${n} KKFI Kyokushin karate ${n === 1 ? 'dojo' : 'dojos'} in ${where}: full-contact karate for children and adults. Addresses, instructors and directions for every dojo, and how to join.`;
    return {
        title,
        description,
        alternates: { canonical: `${SITE}/karate/${g.slug}` },
        openGraph: { title: `${title} | KKFI`, description, url: `${SITE}/karate/${g.slug}`, type: 'website' },
    };
}

const directionsUrl = (d: PublicDojo) =>
    d.latitude && d.longitude
        ? `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([d.name, d.address, d.city, d.state].filter(Boolean).join(', '))}`;

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
    const slug = (await params).city;
    const all = groupByCity(await getRegister());
    const g = all.find((c) => c.slug === slug);
    if (!g) notFound();

    const n = g.dojos.length;
    const where = g.state ? `${g.city}, ${g.state}` : g.city;
    const instructors = [...new Set(g.dojos.map(chiefInstructor).filter(Boolean))] as string[];
    const others = all.filter((c) => c.slug !== slug);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
                    { '@type': 'ListItem', position: 2, name: 'Find a dojo', item: `${SITE}/find-a-dojo` },
                    { '@type': 'ListItem', position: 3, name: `Karate in ${g.city}`, item: `${SITE}/karate/${g.slug}` },
                ],
            },
            {
                '@type': 'ItemList',
                name: `KKFI Kyokushin karate dojos in ${g.city}`,
                numberOfItems: n,
                itemListElement: g.dojos.map((d, i) => ({ '@type': 'ListItem', position: i + 1, item: dojoJsonLd(d) })),
            },
        ],
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

            <header className="relative overflow-hidden px-4 pb-16 pt-40 sm:px-6 lg:px-8">
                <KankuMark className="pointer-events-none absolute -right-[12vw] top-1/2 h-[80vw] max-h-[760px] w-[80vw] max-w-[760px] -translate-y-1/2 text-white/[0.04]" />
                <div className="relative mx-auto max-w-[1400px]">
                    <nav aria-label="Breadcrumb" className="text-sm font-semibold text-white/55">
                        <Link href="/find-a-dojo" className="transition-colors hover:text-white">Find a dojo</Link>
                        <span aria-hidden="true" className="mx-2 text-white/30">/</span>
                        <span className="text-white/80">{g.city}</span>
                    </nav>
                    <h1 className="mt-8 max-w-[16ch] text-balance font-mincho text-[clamp(2.75rem,7vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
                        Kyokushin karate in {g.city}<span className="text-primary">.</span>
                    </h1>
                    <p className="mt-6 max-w-[56ch] text-pretty text-lg leading-relaxed text-white/75 md:text-xl">
                        {n === 1 ? 'One Kyokushin Karate Foundation of India dojo teaches' : `${n} Kyokushin Karate Foundation of India dojos teach`} in{' '}
                        {where}: full-contact karate, the same KKFI syllabus and gradings as every dojo in India, for children and adults.
                        {instructors.length > 0 && <> Classes are led by {listOf(instructors)}.</>}
                    </p>
                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                        <BrandLink href="/register">
                            Join KKFI <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </BrandLink>
                        <BrandLink href="/find-a-dojo#finder" variant="outline">Every dojo in India</BrandLink>
                    </div>
                </div>
            </header>

            <Section rhythm="base" width="wide" aria-labelledby="dojos-heading">
                <Heading>
                    <span id="dojos-heading">{n === 1 ? `The dojo in ${g.city}` : `${n} dojos in ${g.city}`}</span>
                </Heading>
                <ol className="mt-8 divide-y divide-white/10 border-y border-white/10">
                    {g.dojos.map((d) => {
                        const instructor = chiefInstructor(d);
                        return (
                            <li key={d.id} className="grid gap-4 py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-10">
                                <div className="min-w-0">
                                    <h2 className="text-balance font-mincho text-[clamp(1.5rem,2.6vw,2.25rem)] font-extrabold leading-[1.08] tracking-[-0.015em]">
                                        <Link href={`/dojos/${d.id}`} className="transition-colors hover:text-primary-light">
                                            {shortName(d.name)}
                                        </Link>
                                    </h2>
                                    {d.address && (
                                        <p className="mt-3 flex max-w-[60ch] items-start gap-2 leading-relaxed text-white/65">
                                            <MapPin className="mt-1 h-4 w-4 shrink-0 text-white/45" aria-hidden="true" />
                                            <span>{withState(d.address.trim(), d.state)}</span>
                                        </p>
                                    )}
                                    {instructor && <p className="mt-2 text-sm font-semibold text-white/80">Instructor: {instructor}</p>}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <a
                                        href={directionsUrl(d)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex min-h-11 items-center gap-2 border border-white/20 px-4 text-sm font-semibold text-white/85 transition-colors hover:border-white/50 hover:text-white"
                                    >
                                        <Navigation className="h-4 w-4" aria-hidden="true" /> Directions
                                    </a>
                                    <Link
                                        href={`/register?dojo=${encodeURIComponent(d.id)}`}
                                        className="inline-flex min-h-11 items-center gap-2 bg-white px-4 text-sm font-semibold text-black transition-colors hover:bg-white/85"
                                    >
                                        Join this dojo <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </Section>

            <Section rhythm="tight" width="wide" aria-labelledby="about-heading">
                <div className="grid gap-10 border-t border-white/15 pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
                    <div>
                        <Heading>
                            <span id="about-heading">Training in {g.city}</span>
                        </Heading>
                        <p className="mt-6 max-w-[60ch] text-pretty leading-relaxed text-white/75">
                            Kyokushin is full-contact karate, founded by Sosai Masutatsu Oyama in 1964: real strikes to the body and
                            legs, demanding conditioning, and the Osu spirit. Every KKFI dojo teaches one syllabus, from white belt to
                            the dan grades, and records each grading on the national register.
                        </p>
                        <ul className="mt-6 space-y-2 text-white/80">
                            <li><Link href="/what-is-kyokushin" className="underline decoration-white/30 underline-offset-4 hover:decoration-white">What is Kyokushin?</Link></li>
                            <li><Link href="/belt-system" className="underline decoration-white/30 underline-offset-4 hover:decoration-white">The belt system</Link></li>
                            <li><Link href="/syllabus" className="underline decoration-white/30 underline-offset-4 hover:decoration-white">The KKFI syllabus</Link></li>
                        </ul>
                    </div>
                    {others.length > 0 && (
                        <nav aria-labelledby="cities-heading">
                            <h2 id="cities-heading" className="font-mincho text-2xl font-extrabold text-white">Kyokushin karate in other cities</h2>
                            <ul className="mt-5 flex flex-wrap gap-2">
                                {others.map((c) => (
                                    <li key={c.slug}>
                                        <Link
                                            href={`/karate/${c.slug}`}
                                            className="inline-flex min-h-10 items-center gap-2 border border-white/15 px-3.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white"
                                        >
                                            {c.city} <span className="text-white/45">{c.dojos.length}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}
                </div>
            </Section>
        </div>
    );
}

/** The address, with the state added only when the address does not already end on it. */
function withState(address: string, state?: string | null) {
    if (!state || address.toLowerCase().includes(state.toLowerCase())) return address;
    return `${address}, ${state}`;
}

function listOf(names: string[]) {
    if (names.length <= 1) return names[0] ?? '';
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
