import Link from "next/link";
import FilmLink from "./FilmLink";
import { focusRing, h2, panelTitle, section, wrap } from "./ui";

export interface ChroniclePost {
    id: string;
    slug?: string;
    title: string;
    excerpt?: string;
    publishedAt: string;
}

const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

/** The latest stories as a plain list: date, title, one line. */
export default function Chronicles({ posts }: { posts: ChroniclePost[] }) {
    if (posts.length === 0) return null;
    return (
        <section aria-labelledby="chronicles-heading" className={section}>
            <div className={wrap}>
                <h2 id="chronicles-heading" className={h2}>Dojo chronicles</h2>
                <ul className="mt-12 border-t border-worn-belt">
                    {posts.map((post) => (
                        <li key={post.id} className="border-b border-worn-belt">
                            <Link href={`/blog/${post.slug}`} className={`group grid gap-2 py-8 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-10 ${focusRing}`}>
                                <span className="font-gothic text-ash">{date(post.publishedAt)}</span>
                                <span>
                                    <span className={`font-mincho text-[1.563rem] font-medium leading-snug text-canvas md:text-[1.953rem] ${panelTitle}`}>
                                        {post.title}
                                    </span>
                                    {post.excerpt && <span className="mt-3 block max-w-[62ch] font-gothic leading-[1.6] text-ash line-clamp-2">{post.excerpt}</span>}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="mt-8">
                    <FilmLink href="/blog" variant="quiet">All stories</FilmLink>
                </div>
            </div>
        </section>
    );
}
