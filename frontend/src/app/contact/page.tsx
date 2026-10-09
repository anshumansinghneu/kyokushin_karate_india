'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, Loader2 } from 'lucide-react';
import Section from '@/components/brand/Section';
import Reveal from '@/components/brand/Reveal';
import KankuMark from '@/components/KankuMark';

const GOOGLE_MAPS_LINK = 'https://maps.app.goo.gl/o8ttnRaNuRAPqA3H9';
const GOOGLE_MAPS_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3558.5!2d80.78!3d26.84!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDUwJzI0LjAiTiA4MMKwNDYnNDguMCJF!5e0!3m2!1sen!2sin!4v1700000000000';

const HOURS = [
    { days: 'Monday to Friday', time: '6:00 AM – 8:00 PM' },
    { days: 'Saturday', time: '7:00 AM – 5:00 PM' },
    { days: 'Sunday', time: '8:00 AM – 12:00 PM' },
];

/** DESIGN.md underline field: a line to write on, label always visible above it. */
function Field({
    id,
    label,
    children,
}: {
    id: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-2 block text-sm font-semibold text-white/80">
                {label}
            </label>
            {children}
        </div>
    );
}

const inputClass =
    'peer w-full min-h-12 rounded-none border-0 border-b-2 border-white/25 bg-transparent px-1 text-base text-white placeholder:text-white/45 transition-colors focus:outline-none focus-visible:border-primary [&:user-invalid]:border-primary-light';

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        await new Promise(r => setTimeout(r, 1500));
        setSending(false);
        setSent(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSent(false), 4000);
    };

    return (
        <div className="min-h-screen text-white selection:bg-primary selection:text-white">
            {/* Opener: typographic, with the Kanku as a quiet watermark. */}
            <header data-bleed className="relative flex min-h-[62svh] overflow-hidden bg-black">
                <KankuMark className="pointer-events-none absolute -right-[12vw] top-1/2 h-[80vh] w-[80vh] -translate-y-1/2 text-white/[0.05]" />
                <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-[clamp(3rem,8vh,5rem)] pt-36 sm:px-6 md:pt-44 lg:px-8">
                    <h1 className="max-w-[14ch] text-balance text-[clamp(2.75rem,8vw,6rem)] font-black uppercase leading-[0.92] tracking-[-0.035em]">
                        Talk to the dojo<span className="text-primary">.</span>
                    </h1>
                    <p className="mt-6 max-w-[48ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
                        Questions about training, gradings, events or membership. Write to us, call, or come and
                        watch a class at the headquarters in Shuklaganj.
                    </p>
                </div>
            </header>

            <Section rhythm="tight" width="wide" className="bg-black">
                <div className="grid gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
                    {/* Details: a directory, not a stack of cards. */}
                    <Reveal>
                        <dl className="divide-y divide-white/10 border-y border-white/10">
                            <div className="py-7">
                                <dt className="text-sm font-semibold text-white/60">Headquarters</dt>
                                <dd className="mt-2">
                                    <a
                                        href={GOOGLE_MAPS_LINK}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group inline-flex items-start gap-2 text-xl font-bold leading-snug text-white transition-colors hover:text-primary-light"
                                    >
                                        <span>
                                            Shuklaganj Bypass Rd, Poni Road,<br />
                                            Shuklaganj, Netua Grameen,<br />
                                            Uttar Pradesh 209861, India
                                        </span>
                                        <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-white/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-light" aria-hidden="true" />
                                        <span className="sr-only">(opens Google Maps)</span>
                                    </a>
                                </dd>
                            </div>
                            <div className="grid gap-7 py-7 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-semibold text-white/60">Phone</dt>
                                    <dd className="mt-2">
                                        <a href="tel:+919956745114" className="text-xl font-bold tabular-nums text-white transition-colors hover:text-primary-light">
                                            +91 99567 45114
                                        </a>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-semibold text-white/60">Email</dt>
                                    <dd className="mt-2">
                                        <a href="mailto:contact@kyokushin.in" className="break-all text-xl font-bold text-white transition-colors hover:text-primary-light">
                                            contact@kyokushin.in
                                        </a>
                                    </dd>
                                </div>
                            </div>
                            <div className="py-7">
                                <dt className="text-sm font-semibold text-white/60">Training hours</dt>
                                <dd className="mt-3">
                                    <table className="w-full text-left">
                                        <caption className="sr-only">Training hours at headquarters</caption>
                                        <tbody>
                                            {HOURS.map((h) => (
                                                <tr key={h.days}>
                                                    <th scope="row" className="py-1.5 pr-6 font-semibold text-white/85">{h.days}</th>
                                                    <td className="py-1.5 text-right tabular-nums text-white/70">{h.time}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-surface">
                            <iframe
                                src={GOOGLE_MAPS_EMBED}
                                width="100%"
                                height="260"
                                style={{ border: 0, filter: 'grayscale(1) invert(0.92) contrast(0.9)' }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Map of the KKFI headquarters in Shuklaganj"
                                className="block"
                            />
                        </div>
                    </Reveal>

                    {/* The form. */}
                    <Reveal delay={0.1}>
                        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-[1.05] tracking-[-0.02em]">
                            Send a message
                        </h2>
                        <p className="mt-3 max-w-[48ch] text-white/70">
                            Every field is needed. We usually reply within two working days.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-10 space-y-9">
                            <div className="grid gap-9 sm:grid-cols-2">
                                <Field id="contact-name" label="Name">
                                    <input
                                        id="contact-name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Your full name"
                                        className={inputClass}
                                    />
                                </Field>
                                <Field id="contact-email" label="Email">
                                    <input
                                        id="contact-email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="you@example.com"
                                        className={inputClass}
                                    />
                                </Field>
                            </div>
                            <Field id="contact-subject" label="Subject">
                                <input
                                    id="contact-subject"
                                    name="subject"
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Training, gradings, events, membership…"
                                    className={inputClass}
                                />
                            </Field>
                            <Field id="contact-message" label="Message">
                                <textarea
                                    id="contact-message"
                                    name="message"
                                    required
                                    rows={6}
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Tell us what you need"
                                    className={`${inputClass} resize-none py-2 leading-relaxed`}
                                />
                            </Field>

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-none bg-primary px-8 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-60 active:scale-[0.98]"
                                >
                                    {sending ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending</>
                                    ) : (
                                        'Send message'
                                    )}
                                </button>
                                <p role="status" aria-live="polite" className="text-sm font-semibold text-white/80">
                                    {sent && (
                                        <span className="inline-flex items-center gap-2">
                                            <Check className="h-4 w-4 text-secondary" aria-hidden="true" />
                                            Message sent. Osu, we will be in touch.
                                        </span>
                                    )}
                                </p>
                            </div>
                        </form>
                    </Reveal>
                </div>
            </Section>

            <Section rhythm="base" width="wide" className="bg-black">
                <Reveal kind="mask">
                    <p className="max-w-[18ch] text-balance text-[clamp(2rem,5vw,4rem)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
                        The best introduction is a class<span className="text-primary">.</span>
                    </p>
                </Reveal>
                <Reveal delay={0.1} className="mt-8">
                    <p className="max-w-[52ch] text-lg leading-relaxed text-white/75">
                        Beginners and experienced martial artists alike are welcome to visit. Come and watch, or
                        join in.
                    </p>
                    <a
                        href={GOOGLE_MAPS_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group mt-8 inline-flex min-h-12 items-center gap-2 rounded-none border border-white/25 px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                        Get directions
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                    </a>
                </Reveal>
            </Section>
        </div>
    );
}
