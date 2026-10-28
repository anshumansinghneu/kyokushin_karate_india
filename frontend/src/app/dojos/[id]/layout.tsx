import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE, chiefInstructor, citySlug, dojoJsonLd, getDojo, getRegister, shortName } from '@/lib/dojoSeo';

// The page itself renders in the browser; its title, description and structured data
// are set here on the server so each dojo reads as its own page to search engines.
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const id = (await params).id;
    // A loaded register without this dojo is a real 404, decided before streaming starts.
    // If the register did not load, fall back to plain metadata and let the page try.
    const register = await getRegister().catch(() => null);
    const dojo = register?.find((d) => d.id === id) ?? null;
    if (register && !dojo) notFound();
    if (!dojo) {
        return { title: 'Dojo', description: 'A Kyokushin Karate Foundation of India dojo.' };
    }
    const name = shortName(dojo.name);
    const place = [dojo.city.trim(), dojo.state].filter(Boolean).join(', ');
    const instructor = chiefInstructor(dojo);
    const title = `${name}: Kyokushin Karate in ${dojo.city.trim()}`;
    const description = [
        `Kyokushin karate classes at ${dojo.name.trim()}, ${place}.`,
        dojo.address ? `Address: ${dojo.address.trim()}.` : null,
        instructor ? `Instructor: ${instructor}.` : null,
        'Full-contact karate for children and adults, part of the Kyokushin Karate Foundation of India.',
    ]
        .filter(Boolean)
        .join(' ');
    return {
        // Absolute: the /dojos layout's plain title would otherwise drop the site suffix.
        title: { absolute: `${title} | KKFI – Kyokushin Karate Foundation of India` },
        description,
        alternates: { canonical: `${SITE}/dojos/${dojo.id}` },
        openGraph: { title: `${title} | KKFI`, description, url: `${SITE}/dojos/${dojo.id}`, type: 'website' },
    };
}

export default async function DojoDetailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
    const dojo = await getDojo((await params).id);
    const jsonLd = dojo
        ? {
              '@context': 'https://schema.org',
              '@graph': [
                  dojoJsonLd(dojo),
                  {
                      '@type': 'BreadcrumbList',
                      itemListElement: [
                          { '@type': 'ListItem', position: 1, name: 'Find a dojo', item: `${SITE}/find-a-dojo` },
                          { '@type': 'ListItem', position: 2, name: `Karate in ${dojo.city.trim()}`, item: `${SITE}/karate/${citySlug(dojo.city)}` },
                          { '@type': 'ListItem', position: 3, name: shortName(dojo.name), item: `${SITE}/dojos/${dojo.id}` },
                      ],
                  },
              ],
          }
        : null;
    return (
        <>
            {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />}
            {children}
        </>
    );
}
