"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, ArrowLeft, ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";
import KankuMark from "@/components/KankuMark";
import KarateLoader from "@/components/KarateLoader";
import BrandLink from "@/components/brand/BrandLink";
import Reveal from "@/components/brand/Reveal";
import SceneSlot from "@/components/three/SceneSlot";
import type { Ticket } from "@/components/three/scenes/TicketsScene";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { getEventStatus } from "@/lib/eventStatus";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/contexts/ToastContext";

import { dateOnlyParts, formatDateOnly } from '@/lib/dateOnly';

interface EventCategory { name: string; age: string; weight: string }
interface EventDetail {
    id: string;
    name: string;
    type: string;
    status?: string;
    description?: string;
    imageUrl?: string | null;
    startDate: string;
    endDate?: string | null;
    registrationDeadline?: string | null;
    location?: string | null;
    memberFee: number;
    categories?: EventCategory[] | unknown;
    dojo?: { city?: string } | null;
}
interface Feedback {
    id: string;
    feedback: string;
    status?: string;
    createdAt: string;
    user?: { name?: string; currentBeltRank?: string };
}
type ApiError = { response?: { data?: { message?: string } } };

const typeLabel = (type: string) =>
    type === "BELT_EXAM" ? "Grading" : type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ");

/** Sharp, uppercase action button matching BrandLink, for in-page actions. */
function ActionButton({ children, onClick, disabled, variant = "primary", className = "" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "outline" | "ghost"; className?: string }) {
    const styles = {
        primary: "bg-primary text-white hover:bg-primary-dark",
        outline: "border border-white/25 text-white hover:border-white/60 hover:bg-white/10",
        ghost: "text-white/70 hover:text-white",
    };
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 text-sm font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

/** Still composition for reduced motion and slow devices: the event's ticket, squared up. */
function TicketPoster({ ticket, imageUrl }: { ticket: Ticket; imageUrl?: string | null }) {
    return (
        <div className="absolute inset-0 bg-black">
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-md grayscale-[0.4]"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
            ) : (
                <KankuMark className="absolute -right-[12vw] top-1/2 h-[90vh] w-[90vh] -translate-y-1/2 text-white/[0.05]" />
            )}
            <div className="absolute inset-x-0 top-[14%] flex justify-center md:inset-y-0 md:left-auto md:right-[7vw] md:top-0 md:items-center">
                <div className="flex aspect-[2.3/1] w-[min(80vw,30rem)] -rotate-6 rounded-lg border border-white/20 bg-[#0c0c0c] text-white">
                    <div className="flex flex-1 flex-col justify-between border-r border-dashed border-white/30 p-[5%]">
                        <p className="text-[clamp(0.6rem,1.4vw,0.8rem)] font-bold text-primary-light">
                            {ticket.type.toUpperCase()} · {ticket.status === "COMPLETED" ? "COMPLETED" : ticket.status === "ONGOING" ? "IN PROGRESS" : "ADMIT ONE"}
                        </p>
                        <p className="line-clamp-3 text-[clamp(0.9rem,2.2vw,1.45rem)] font-black uppercase leading-tight">{ticket.title}</p>
                        <p className="truncate text-[clamp(0.6rem,1.3vw,0.8rem)] font-semibold text-white/60">{ticket.location}</p>
                    </div>
                    <div className="flex w-[27%] flex-col items-center justify-center">
                        <span className="text-[clamp(0.6rem,1.3vw,0.8rem)] font-bold">{ticket.month}</span>
                        <span className="text-[clamp(1.75rem,5vw,3.25rem)] font-black leading-none">{ticket.day}</span>
                        <span className="text-[clamp(0.6rem,1.3vw,0.8rem)] font-bold text-white/60">{ticket.year}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function EventDetailPage() {
    const { id } = useParams();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationStep, setRegistrationStep] = useState(1);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [eventType, setEventType] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);

    // Voucher state
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherValidating, setVoucherValidating] = useState(false);
    const [voucherValid, setVoucherValid] = useState<{ amount: number; code: string } | null>(null);
    const [voucherError, setVoucherError] = useState("");

    // Feedback state
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [myFeedback, setMyFeedback] = useState<Feedback | null>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [isEditingFeedback, setIsEditingFeedback] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${id}`);
                setEvent(res.data.data.event);
            } catch (err) {
                console.error("Failed to fetch event", err);
                setError("Failed to load event details.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchEvent();
    }, [id]);

    // Fetch feedback once the event has finished (derived from dates; the backend
    // gate matches). CANCELLED events never accept feedback.
    useEffect(() => {
        if (!event || event.status === 'CANCELLED' || getEventStatus(event) !== 'COMPLETED') return;
        const fetchFeedback = async () => {
            try {
                const res = await api.get(`/feedback/${event.id}`);
                setFeedbacks(res.data.data.feedbacks || []);
            } catch { /* feedback is optional */ }
            if (user) {
                try {
                    const res = await api.get(`/feedback/${event.id}/mine`);
                    if (res.data.data.feedback) setMyFeedback(res.data.data.feedback);
                } catch { /* none yet */ }
            }
        };
        fetchFeedback();
    }, [event, user]);

    const handleFeedbackSubmit = async () => {
        if (feedbackText.trim().length < 10) {
            showToast('Feedback must be at least 10 characters', 'error');
            return;
        }
        setSubmittingFeedback(true);
        try {
            if (isEditingFeedback) {
                await api.put(`/feedback/${event!.id}`, { feedback: feedbackText });
                showToast('Feedback updated! It will be reviewed again.', 'success');
            } else {
                await api.post(`/feedback/${event!.id}`, { feedback: feedbackText });
                showToast('Feedback submitted! It will appear after admin approval.', 'success');
            }
            const res = await api.get(`/feedback/${event!.id}/mine`);
            setMyFeedback(res.data.data.feedback);
            setShowFeedbackForm(false);
            setIsEditingFeedback(false);
            setFeedbackText('');
        } catch (err) {
            showToast((err as ApiError)?.response?.data?.message || 'Failed to submit feedback', 'error');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleRegister = () => {
        if (!user) {
            showToast("Please login to register for this event.", "error");
            return;
        }
        if (user.membershipStatus !== 'ACTIVE') {
            showToast("Only active members can register. Please renew your membership.", "error");
            return;
        }
        setIsRegistering(true);
    };

    const handleValidateEventVoucher = async () => {
        if (!voucherCode.trim()) {
            setVoucherError("Please enter a voucher code");
            return;
        }
        setVoucherValidating(true);
        setVoucherError("");
        setVoucherValid(null);
        try {
            const res = await api.post('/vouchers/validate', {
                code: voucherCode.trim(),
                type: event?.type || 'TOURNAMENT',
                eventId: id,
            });
            setVoucherValid({
                amount: res.data.data.voucher.amount,
                code: res.data.data.voucher.code,
            });
        } catch (err) {
            setVoucherError((err as ApiError).response?.data?.message || "Invalid voucher code");
        } finally {
            setVoucherValidating(false);
        }
    };

    const handleVoucherRedemption = async () => {
        if (!voucherValid) return;
        setPaymentProcessing(true);
        try {
            await api.post(`/vouchers/redeem/event/${id}`, {
                voucherCode: voucherValid.code,
                eventType,
            });
            setRegistrationStep(3);
            showToast("Registration successful! Voucher redeemed.", "success");
        } catch (err) {
            showToast((err as ApiError).response?.data?.message || "Voucher redemption failed.", "error");
        } finally {
            setPaymentProcessing(false);
        }
    };

    // Direct registration for free events
    const handleFreeRegistration = async () => {
        setPaymentProcessing(true);
        try {
            await api.post(`/events/${id}/register`, {
                eventType,
                categoryAge: selectedCategory?.age || null,
                categoryWeight: selectedCategory?.weight || null,
            });
            setRegistrationStep(3);
            showToast("Registration successful!", "success");
        } catch (err) {
            showToast((err as ApiError).response?.data?.message || "Registration failed.", "error");
        } finally {
            setPaymentProcessing(false);
        }
    };

    // The hero's 3D ticket. Built before the early returns so hook order never changes.
    const ticket = useMemo<Ticket | null>(() => {
        if (!event) return null;
        const d = dateOnlyParts(event.startDate);
        return {
            id: event.id,
            title: event.name,
            type: typeLabel(event.type),
            dates: "",
            day: d.day,
            month: d.month,
            year: d.year,
            location: event.location || event.dojo?.city || "",
            status: getEventStatus(event),
        };
    }, [event]);
    // Phones: the ticket gets its own band above the copy, centred (decided after mount; the
    // scene only renders on the client, so this cannot cause a hydration mismatch).
    const [narrow, setNarrow] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const sync = () => setNarrow(mq.matches);
        const raf = requestAnimationFrame(sync);
        mq.addEventListener("change", sync);
        return () => {
            cancelAnimationFrame(raf);
            mq.removeEventListener("change", sync);
        };
    }, []);
    const ticketSceneProps = useMemo(
        () => ({ tickets: ticket ? [ticket] : [], single: true, centered: narrow, backdropImage: event?.imageUrl || undefined }),
        [ticket, event?.imageUrl, narrow],
    );

    if (loading) {
        return (
            <div className="flex min-h-[70dvh] items-center justify-center bg-black">
                <KarateLoader label="Loading event" />
            </div>
        );
    }
    if (error || !event) {
        return (
            <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-start justify-center gap-6 px-4 text-white sm:px-6">
                <h1 className="text-3xl font-black uppercase tracking-[-0.02em]">{error ? "Could not load this event" : "Event not found"}<span className="text-primary">.</span></h1>
                <p className="leading-relaxed text-white/70">{error ? "The server did not answer. Try again in a moment." : "It may have been removed or is no longer public."}</p>
                <BrandLink href="/events" variant="outline"><ArrowLeft className="h-4 w-4" /> All events</BrandLink>
            </div>
        );
    }

    const categories: EventCategory[] = Array.isArray(event.categories) ? event.categories : [];
    // Display status is derived from dates (the DB status field goes stale).
    const status = getEventStatus(event);
    const finished = status === "COMPLETED";
    const cancelled = event.status === "CANCELLED";
    const isTournament = event.type === "TOURNAMENT";
    const venue = event.location || event.dojo?.city;
    const longDate = (d: string) => formatDateOnly(d, { weekday: "short", day: "numeric", month: "long", year: "numeric" }, "en-IN");
    const multiDay = !!event.endDate && event.endDate !== event.startDate;

    const startRegistration = () => {
        handleRegister();
        document.getElementById("register")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        // Transparent: the hero's 3D ticket is painted by the canvas behind <main>.
        <div className="min-h-dvh w-full text-white">
            {/* Opener: the event's own printed ticket turning in the dark, its poster carried in the ink. */}
            <header data-bleed className="relative flex min-h-[78svh] overflow-hidden">
                {ticket && (
                    <SceneSlot
                        scene="tickets"
                        sceneProps={ticketSceneProps}
                        className="absolute inset-x-0 top-0 h-[46svh] md:inset-0 md:h-auto"
                        fallback={<TicketPoster ticket={ticket} imageUrl={event.imageUrl} />}
                    />
                )}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,black_38%,rgba(0,0,0,0.6)_58%,transparent_78%)] md:bg-[linear-gradient(to_right,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.72)_45%,transparent_70%)]" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
                {/* Phones: feather the bottom edge of the ticket band into the page. */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[calc(46svh-7rem)] h-28 bg-gradient-to-b from-transparent to-black md:hidden" />

                <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-[clamp(2.5rem,7vh,5rem)] pt-[48svh] sm:px-6 md:pt-40 lg:px-8">
                    <Link href="/events" className="mb-8 inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All events
                    </Link>
                    <p className="text-sm font-semibold text-white/75">
                        {typeLabel(event.type)}
                        <span className="mx-2 text-white/30" aria-hidden="true">·</span>
                        <span className={cancelled ? "text-white/60" : finished ? "text-white/60" : "text-primary-light"}>
                            {cancelled ? "Cancelled" : status === "ONGOING" ? "In progress" : finished ? "Completed" : "Upcoming"}
                        </span>
                    </p>
                    <h1 className="mt-4 max-w-[22ch] text-balance md:max-w-[18ch] text-[clamp(2.25rem,6vw,4.75rem)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
                        {event.name}
                    </h1>
                    <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-5 text-sm">
                        <div>
                            <dt className="text-white/60">{multiDay ? "Starts" : "Date"}</dt>
                            <dd className="mt-1 font-bold">{longDate(event.startDate)}</dd>
                        </div>
                        {multiDay && (
                            <div>
                                <dt className="text-white/60">Ends</dt>
                                <dd className="mt-1 font-bold">{longDate(event.endDate!)}</dd>
                            </div>
                        )}
                        {venue && (
                            <div>
                                <dt className="text-white/60">Venue</dt>
                                <dd className="mt-1 font-bold">{venue}</dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-white/60">Fee</dt>
                            <dd className="mt-1 font-bold tabular-nums">{event.memberFee > 0 ? `₹${event.memberFee}` : "Free"}</dd>
                        </div>
                    </dl>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        {!finished && !cancelled && (
                            <button
                                type="button"
                                onClick={startRegistration}
                                className="inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                            >
                                Register
                            </button>
                        )}
                        {isTournament && (
                            <>
                                <BrandLink href={`/tournaments/${event.id}/view`} variant="outline">Brackets <ArrowUpRight className="h-4 w-4" /></BrandLink>
                                <BrandLink href={`/tournaments/${event.id}/results`} variant="outline">Results <ArrowUpRight className="h-4 w-4" /></BrandLink>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-4 py-[clamp(3.5rem,8vw,6rem)] sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-20 lg:px-8">
                <div className="space-y-16">
                    {/* The event's own poster, shown whole: the hero only uses it as atmosphere. */}
                    {event.imageUrl && (
                        <Reveal as="section" kind="depth">
                            <figure>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={event.imageUrl}
                                    alt={`Poster for ${event.name}`}
                                    loading="lazy"
                                    className="w-full max-w-2xl rounded-lg border border-white/10"
                                    onError={(e) => { (e.currentTarget.closest("section") as HTMLElement | null)?.style.setProperty("display", "none"); }}
                                />
                            </figure>
                        </Reveal>
                    )}

                    {event.description && (
                        <Reveal as="section">
                            <h2 className="text-2xl font-extrabold md:text-3xl">About this event</h2>
                            <p className="mt-6 max-w-[65ch] whitespace-pre-line text-pretty text-lg leading-relaxed text-white/80">{event.description}</p>
                        </Reveal>
                    )}

                    {categories.length > 0 && (
                        <Reveal as="section">
                            <h2 className="text-2xl font-extrabold md:text-3xl">Categories</h2>
                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full min-w-[28rem] text-left">
                                    <thead>
                                        <tr className="border-b border-white/20 text-sm text-white/60">
                                            <th scope="col" className="py-3 pr-6 font-semibold">Category</th>
                                            <th scope="col" className="py-3 pr-6 font-semibold">Age</th>
                                            <th scope="col" className="py-3 font-semibold">Weight</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {categories.map((cat, i) => (
                                            <tr key={i}>
                                                <th scope="row" className="py-4 pr-6 font-bold">{cat.name}</th>
                                                <td className="py-4 pr-6 text-white/75 tabular-nums">{cat.age || "Open"}</td>
                                                <td className="py-4 text-white/75 tabular-nums">{cat.weight || "Open"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Reveal>
                    )}

                    <Reveal as="section">
                        <h2 className="text-2xl font-extrabold md:text-3xl">Key dates</h2>
                        <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
                            <div className="flex flex-wrap justify-between gap-2 py-4">
                                <dt className="font-semibold text-white/70">Starts</dt>
                                <dd className="font-bold">{longDate(event.startDate)}</dd>
                            </div>
                            <div className="flex flex-wrap justify-between gap-2 py-4">
                                <dt className="font-semibold text-white/70">Ends</dt>
                                <dd className="font-bold">{longDate(event.endDate || event.startDate)}</dd>
                            </div>
                            {event.registrationDeadline && (
                                <div className="flex flex-wrap justify-between gap-2 py-4">
                                    <dt className="font-semibold text-white/70">Registration closes</dt>
                                    <dd className="font-bold">{longDate(event.registrationDeadline)}</dd>
                                </div>
                            )}
                        </dl>
                    </Reveal>

                    {/* Feedback — only for completed events */}
                    {!cancelled && finished && (
                        <Reveal as="section">
                            <h2 className="text-2xl font-extrabold md:text-3xl">From those who were there</h2>

                            {user && myFeedback && !showFeedbackForm && (
                                <div className="mt-6 rounded-lg border border-white/15 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm text-white/60">Your feedback</p>
                                            <p className="mt-1 text-white">{myFeedback.feedback}</p>
                                            <p className="mt-3 text-sm font-semibold text-white/70">
                                                {myFeedback.status === "PENDING" ? "Awaiting approval" : myFeedback.status === "APPROVED" ? "Published" : myFeedback.status === "REJECTED" ? "Not published" : myFeedback.status}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { setFeedbackText(myFeedback.feedback); setIsEditingFeedback(true); setShowFeedbackForm(true); }}
                                            className="min-h-11 px-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            )}

                            {user && showFeedbackForm && (
                                <div className="mt-6">
                                    <label htmlFor="feedback" className="text-sm font-semibold text-white/70">Your experience</label>
                                    <textarea
                                        id="feedback"
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="At least 10 characters"
                                        className="mt-2 w-full resize-none rounded-none border-b-2 border-white/20 bg-transparent p-3 text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
                                        rows={4}
                                        maxLength={2000}
                                    />
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                        <span className="text-sm text-white/50 tabular-nums">{feedbackText.length}/2000</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setShowFeedbackForm(false); setIsEditingFeedback(false); setFeedbackText(''); }}
                                                className="min-h-11 px-4 text-sm font-semibold text-white/70 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleFeedbackSubmit}
                                                disabled={submittingFeedback || feedbackText.trim().length < 10}
                                                className="min-h-11 bg-primary px-5 text-sm font-bold uppercase tracking-[0.1em] text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {submittingFeedback ? "Sending…" : isEditingFeedback ? "Update" : "Submit"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {user && !myFeedback && !showFeedbackForm && (
                                <button
                                    onClick={() => setShowFeedbackForm(true)}
                                    className="mt-6 inline-flex min-h-12 items-center border border-white/25 px-5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10"
                                >
                                    Were you there? Share your feedback
                                </button>
                            )}

                            {feedbacks.length > 0 ? (
                                <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
                                    {feedbacks.map((fb) => (
                                        <li key={fb.id} className="py-6">
                                            <blockquote className="max-w-[60ch] text-pretty text-lg leading-relaxed text-white/85">&ldquo;{fb.feedback}&rdquo;</blockquote>
                                            <p className="mt-3 text-sm text-white/60">
                                                <span className="font-semibold text-white">{fb.user?.name}</span>
                                                {fb.user?.currentBeltRank && <> · {fb.user.currentBeltRank.replace('_', ' ').toLowerCase()}</>}
                                                {" · "}{new Date(fb.createdAt).toLocaleDateString("en-IN")}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                !showFeedbackForm && <p className="mt-6 text-white/60">No feedback yet.</p>
                            )}
                        </Reveal>
                    )}
                </div>

                {/* Registration */}
                <aside id="register" className="scroll-mt-28 lg:sticky lg:top-28 lg:self-start">
                    <div className="rounded-lg border border-white/15 bg-surface p-6">
                        {cancelled || finished ? (
                            <>
                                <p className="text-sm font-semibold text-white/60">Registration</p>
                                <p className="mt-2 text-2xl font-extrabold">{cancelled ? "This event was cancelled." : "This event has finished."}</p>
                                <p className="mt-3 leading-relaxed text-white/70">See what is coming up next on the calendar.</p>
                                <div className="mt-6 grid gap-3">
                                    <BrandLink href="/events">Upcoming events</BrandLink>
                                    <BrandLink href="/gallery" variant="outline">Photos</BrandLink>
                                </div>
                            </>
                        ) : !isRegistering ? (
                            <>
                                <p className="text-sm font-semibold text-white/60">Registration fee</p>
                                <p className="mt-1 text-4xl font-black tabular-nums">{event.memberFee > 0 ? `₹${event.memberFee}` : "Free"}</p>
                                {isTournament && (
                                    <ul className="mt-5 space-y-2 border-t border-white/10 pt-5 text-sm text-white/75">
                                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 shrink-0 text-white/60" aria-hidden="true" /> Official tournament T-shirt</li>
                                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 shrink-0 text-white/60" aria-hidden="true" /> Participation certificate</li>
                                    </ul>
                                )}
                                <ActionButton onClick={handleRegister} className="mt-6">Register now</ActionButton>
                                {event.registrationDeadline && (
                                    <p className="mt-4 text-center text-sm text-white/60">Closes {formatDateOnly(event.registrationDeadline)}</p>
                                )}
                                <p className="mt-2 text-center text-sm text-white/50">Active members only.</p>
                            </>
                        ) : (
                            <div>
                                {registrationStep === 1 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <h3 className="text-xl font-extrabold">How will you compete?</h3>
                                        <fieldset className="mt-5">
                                            <legend className="text-sm font-semibold text-white/70">Event type</legend>
                                            <div className="mt-2 grid grid-cols-3 gap-2">
                                                {['Kata', 'Kumite', 'Both'].map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        aria-pressed={eventType === type}
                                                        onClick={() => setEventType(type)}
                                                        className={`min-h-11 border text-sm font-bold transition-colors ${eventType === type ? 'border-white bg-white text-black' : 'border-white/20 text-white/75 hover:bg-white/10'}`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </fieldset>

                                        {categories.length > 0 && (
                                            <fieldset className="mt-6">
                                                <legend className="text-sm font-semibold text-white/70">Category</legend>
                                                <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1" data-lenis-prevent>
                                                    {categories.map((cat, i) => {
                                                        const on = selectedCategory?.name === cat.name && selectedCategory?.age === cat.age;
                                                        return (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                aria-pressed={on}
                                                                onClick={() => setSelectedCategory(cat)}
                                                                className={`w-full border p-3 text-left transition-colors ${on ? 'border-white bg-white/10' : 'border-white/15 hover:bg-white/5'}`}
                                                            >
                                                                <span className="block font-bold">{cat.name}</span>
                                                                <span className="mt-1 flex gap-3 text-sm text-white/60 tabular-nums">
                                                                    {cat.age && <span>Age {cat.age}</span>}
                                                                    {cat.weight && <span>{cat.weight}</span>}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </fieldset>
                                        )}

                                        <ActionButton
                                            onClick={() => setRegistrationStep(2)}
                                            disabled={!eventType || (categories.length > 0 && !selectedCategory)}
                                            className="mt-6"
                                        >
                                            Continue
                                        </ActionButton>
                                        <ActionButton variant="ghost" onClick={() => setIsRegistering(false)} className="mt-1">Cancel</ActionButton>
                                    </motion.div>
                                )}

                                {registrationStep === 2 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <h3 className="text-xl font-extrabold">Confirm registration</h3>
                                        <dl className="mt-5 divide-y divide-white/10 border-y border-white/10 text-sm">
                                            <div className="flex justify-between gap-4 py-3">
                                                <dt className="text-white/60">Event</dt>
                                                <dd className="text-right font-semibold">{event.name}</dd>
                                            </div>
                                            <div className="flex justify-between gap-4 py-3">
                                                <dt className="text-white/60">Type</dt>
                                                <dd className="font-bold">{eventType}</dd>
                                            </div>
                                            {selectedCategory && (
                                                <div className="flex justify-between gap-4 py-3">
                                                    <dt className="text-white/60">Category</dt>
                                                    <dd className="text-right font-bold">{selectedCategory.name}{selectedCategory.weight ? ` (${selectedCategory.weight})` : ''}</dd>
                                                </div>
                                            )}
                                            {!voucherValid && (
                                                <div className="flex justify-between gap-4 py-3">
                                                    <dt className="text-white/60">Total</dt>
                                                    <dd className="text-lg font-black tabular-nums">₹{event.memberFee}</dd>
                                                </div>
                                            )}
                                        </dl>

                                        {event.memberFee > 0 ? (
                                            <div className="mt-6">
                                                <label htmlFor="voucher" className="text-sm font-semibold text-white/70">Cash voucher code</label>
                                                <p className="mt-1 text-sm text-white/55">From your instructor.</p>
                                                <div className="mt-2 flex gap-2">
                                                    <input
                                                        id="voucher"
                                                        placeholder="KKFI-XXXX-XXXX"
                                                        value={voucherCode}
                                                        onChange={(e) => {
                                                            setVoucherCode(e.target.value.toUpperCase());
                                                            setVoucherError("");
                                                            setVoucherValid(null);
                                                        }}
                                                        disabled={!!voucherValid}
                                                        className="h-12 min-w-0 flex-1 rounded-none border-b-2 border-white/20 bg-transparent px-3 font-mono text-sm tracking-wider text-white outline-none placeholder:text-white/50 focus:border-primary"
                                                    />
                                                    {voucherValid ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => { setVoucherValid(null); setVoucherCode(""); setVoucherError(""); }}
                                                            className="min-h-12 border border-white/25 px-4 text-sm font-bold text-white hover:bg-white/10"
                                                        >
                                                            Change
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={handleValidateEventVoucher}
                                                            disabled={voucherValidating || !voucherCode.trim()}
                                                            className="min-h-12 border border-white/25 px-4 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"
                                                        >
                                                            {voucherValidating ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Checking" /> : "Check"}
                                                        </button>
                                                    )}
                                                </div>
                                                {voucherError && (
                                                    <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-primary-light">
                                                        <AlertCircle className="h-4 w-4" aria-hidden="true" /> {voucherError}
                                                    </p>
                                                )}
                                                {voucherValid && (
                                                    <p className="mt-3 flex items-center gap-2 text-sm text-white">
                                                        <CheckCircle className="h-4 w-4 text-secondary" aria-hidden="true" />
                                                        Voucher accepted: covers ₹{voucherValid.amount}.
                                                    </p>
                                                )}
                                            </div>
                                        ) : null}

                                        {event.memberFee > 0 ? (
                                            <ActionButton onClick={handleVoucherRedemption} disabled={paymentProcessing || !voucherValid} className="mt-6">
                                                {paymentProcessing ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Registering…</> : "Register with voucher"}
                                            </ActionButton>
                                        ) : (
                                            <ActionButton onClick={handleFreeRegistration} disabled={paymentProcessing} className="mt-6">
                                                {paymentProcessing ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Registering…</> : "Register (free)"}
                                            </ActionButton>
                                        )}
                                        <ActionButton variant="ghost" onClick={() => setRegistrationStep(1)} className="mt-1">Back</ActionButton>
                                    </motion.div>
                                )}

                                {registrationStep === 3 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4">
                                        <CheckCircle className="h-10 w-10 text-secondary" aria-hidden="true" />
                                        <h3 className="mt-4 text-2xl font-extrabold">You&apos;re registered.</h3>
                                        <p className="mt-2 text-white/70">Your place is confirmed. Osu, and good luck.</p>
                                        <div className="mt-6">
                                            <BrandLink href="/dashboard" className="w-full">Go to dashboard</BrandLink>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
