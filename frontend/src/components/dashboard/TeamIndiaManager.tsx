"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus, Trash2, Star, StarOff, Eye, EyeOff, Search, X, Plane,
    AlertTriangle, RefreshCw, ChevronLeft, Loader2, ImageOff,
} from "lucide-react";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/imageUtils";
import { formatDateOnly } from "@/lib/dateOnly";
import type { Delegation, SquadMember } from "@/app/team-india/page";

/**
 * Admin surface for "Team India" — the squads that travel when a foreign
 * federation invites KKFI to their tournament.
 *
 * Two levels: a list of trips, and the squad editor for one trip.
 */

interface EligibleUser {
    id: string;
    name: string;
    role: string;
    profilePhotoUrl: string | null;
    currentBeltRank: string | null;
    city: string | null;
    state: string | null;
    membershipNumber: string | null;
    dojo: { name: string } | null;
}

const SQUAD_ROLES = [
    { value: "LEADER", label: "Head of Delegation" },
    { value: "COACH", label: "Coach" },
    { value: "COMPETITOR", label: "Competitor" },
] as const;

const emptyForm = {
    tournamentName: "",
    hostCountry: "",
    hostCity: "",
    startDate: "",
    endDate: "",
    summary: "",
};

export default function TeamIndiaManager() {
    const [delegations, setDelegations] = useState<Delegation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [openId, setOpenId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setLoadError(false);
        try {
            const res = await api.get("/delegations/admin/all");
            setDelegations(res.data.data.delegations ?? []);
        } catch (err) {
            console.error("Failed to load delegations", err);
            setLoadError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openDelegation = delegations.find((d) => d.id === openId) ?? null;

    const createTrip = async () => {
        setError(null);
        if (!form.tournamentName.trim() || !form.hostCountry.trim() || !form.startDate) {
            setError("Tournament name, host country and start date are required.");
            return;
        }
        setSaving(true);
        try {
            await api.post("/delegations", form);
            setForm(emptyForm);
            setShowForm(false);
            await load();
        } catch (err: unknown) {
            setError(readError(err, "Could not create the trip."));
        } finally {
            setSaving(false);
        }
    };

    const patchTrip = async (id: string, body: Record<string, unknown>) => {
        setError(null);
        try {
            await api.patch(`/delegations/${id}`, body);
            await load();
        } catch (err: unknown) {
            setError(readError(err, "Could not update the trip."));
        }
    };

    const feature = async (id: string, isFeatured: boolean) => {
        setError(null);
        try {
            await api.patch(`/delegations/${id}/feature`, { isFeatured });
            await load();
        } catch (err: unknown) {
            setError(readError(err, "Could not change the featured trip."));
        }
    };

    const removeTrip = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}" and its squad? This cannot be undone.`)) return;
        try {
            await api.delete(`/delegations/${id}`);
            if (openId === id) setOpenId(null);
            await load();
        } catch (err: unknown) {
            setError(readError(err, "Could not delete the trip."));
        }
    };

    /* ── Squad editor ── */
    if (openDelegation) {
        return (
            <SquadEditor
                delegation={openDelegation}
                onBack={() => setOpenId(null)}
                onChanged={load}
            />
        );
    }

    /* ── Trip list ── */
    return (
        <div className="space-y-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-white">Team India</h2>
                    <p className="mt-0.5 text-[12px] text-zinc-400">
                        Squads travelling abroad when a foreign federation invites KKFI.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => { setShowForm((s) => !s); setError(null); }}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-[12px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-700"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" /> New trip
                </button>
            </header>

            {error && <Banner message={error} onDismiss={() => setError(null)} />}

            {showForm && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Tournament name *">
                            <input className={inputCls} value={form.tournamentName}
                                onChange={(e) => setForm({ ...form, tournamentName: e.target.value })}
                                placeholder="12th IKO World Championship" />
                        </Field>
                        <Field label="Host country *">
                            <input className={inputCls} value={form.hostCountry}
                                onChange={(e) => setForm({ ...form, hostCountry: e.target.value })}
                                placeholder="Japan" />
                        </Field>
                        <Field label="Host city">
                            <input className={inputCls} value={form.hostCity}
                                onChange={(e) => setForm({ ...form, hostCity: e.target.value })}
                                placeholder="Tokyo" />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Start date *">
                                <input type="date" className={inputCls} value={form.startDate}
                                    onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                            </Field>
                            <Field label="End date">
                                <input type="date" className={inputCls} value={form.endDate}
                                    onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                            </Field>
                        </div>
                        <div className="sm:col-span-2">
                            <Field label="About the invitation">
                                <textarea rows={2} className={inputCls} value={form.summary}
                                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                                    placeholder="Invited by the Japan Karate Organisation to compete in the open-weight division." />
                            </Field>
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <button type="button" onClick={() => { setShowForm(false); setError(null); }}
                            className="h-9 rounded-lg border border-white/[0.1] px-4 text-[12px] font-semibold text-zinc-300 hover:bg-white/[0.05]">
                            Cancel
                        </button>
                        <button type="button" onClick={createTrip} disabled={saving}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-[12px] font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-60">
                            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                            Create
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
                </div>
            ) : loadError ? (
                <ErrorState onRetry={load} />
            ) : delegations.length === 0 ? (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] py-14 text-center">
                    <Plane className="mx-auto mb-3 h-8 w-8 text-zinc-600" aria-hidden="true" />
                    <p className="text-[13px] font-bold text-zinc-200">No trips yet</p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                        Create one when an invitation arrives, then add the squad.
                    </p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {delegations.map((d) => (
                        <li key={d.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <button type="button" onClick={() => setOpenId(d.id)} className="min-w-0 flex-1 text-left">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[14px] font-bold text-white">{d.tournamentName}</span>
                                        {d.isFeatured && (
                                            <span className="rounded bg-[#FFD700] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-black">
                                                On homepage
                                            </span>
                                        )}
                                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                                            d.isPublished ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-zinc-400"
                                        }`}>
                                            {d.isPublished ? "Published" : "Draft"}
                                        </span>
                                    </div>
                                    <span className="mt-1 block text-[11px] text-zinc-400">
                                        {d.hostCity ? `${d.hostCity}, ` : ""}{d.hostCountry} ·{" "}
                                        {formatDateOnly(d.startDate)} · {d.memberCount} member{d.memberCount === 1 ? "" : "s"}
                                    </span>
                                </button>

                                <div className="flex shrink-0 items-center gap-1.5">
                                    <IconBtn
                                        title={d.isPublished ? "Unpublish" : "Publish"}
                                        onClick={() => patchTrip(d.id, { isPublished: !d.isPublished })}
                                    >
                                        {d.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </IconBtn>
                                    <IconBtn
                                        title={d.isFeatured ? "Remove from homepage" : "Feature on homepage"}
                                        onClick={() => feature(d.id, !d.isFeatured)}
                                        active={d.isFeatured}
                                    >
                                        {d.isFeatured ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                                    </IconBtn>
                                    <IconBtn title="Delete" danger onClick={() => removeTrip(d.id, d.tournamentName)}>
                                        <Trash2 className="h-4 w-4" />
                                    </IconBtn>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ─── Squad editor ───────────────────────────────────────── */

function SquadEditor({
    delegation, onBack, onChanged,
}: { delegation: Delegation; onBack: () => void; onChanged: () => Promise<void> }) {
    const [query, setQuery] = useState("");
    const [candidates, setCandidates] = useState<EligibleUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    // Debounced search so each keystroke doesn't hit the API.
    useEffect(() => {
        let cancelled = false;
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await api.get(`/delegations/admin/eligible-members?q=${encodeURIComponent(query)}`);
                if (!cancelled) setCandidates(res.data.data.users ?? []);
            } catch {
                if (!cancelled) setCandidates([]);
            } finally {
                if (!cancelled) setSearching(false);
            }
        }, 300);
        return () => { cancelled = true; clearTimeout(t); };
    }, [query]);

    const already = new Set(delegation.members.map((m) => m.userId));

    const add = async (user: EligibleUser) => {
        setError(null);
        setBusyId(user.id);
        try {
            await api.post(`/delegations/${delegation.id}/members`, { userId: user.id });
            await onChanged();
        } catch (err: unknown) {
            setError(readError(err, `Could not add ${user.name}.`));
        } finally {
            setBusyId(null);
        }
    };

    const patchMember = async (member: SquadMember, body: Record<string, unknown>) => {
        setError(null);
        try {
            await api.patch(`/delegations/${delegation.id}/members/${member.id}`, body);
            await onChanged();
        } catch (err: unknown) {
            setError(readError(err, "Could not update that member."));
        }
    };

    const removeMember = async (member: SquadMember) => {
        if (!confirm(`Remove ${member.name} from this squad?`)) return;
        try {
            await api.delete(`/delegations/${delegation.id}/members/${member.id}`);
            await onChanged();
        } catch (err: unknown) {
            setError(readError(err, "Could not remove that member."));
        }
    };

    return (
        <div className="space-y-5">
            <button type="button" onClick={onBack}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-400 hover:text-white">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> All trips
            </button>

            <header>
                <h2 className="text-lg font-black uppercase tracking-tight text-white">{delegation.tournamentName}</h2>
                <p className="mt-0.5 text-[12px] text-zinc-400">
                    {delegation.hostCity ? `${delegation.hostCity}, ` : ""}{delegation.hostCountry} ·{" "}
                    {formatDateOnly(delegation.startDate)}
                    {delegation.endDate ? ` – ${formatDateOnly(delegation.endDate)}` : ""}
                </p>
            </header>

            {error && <Banner message={error} onDismiss={() => setError(null)} />}

            {/* Current squad */}
            <section>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                    Squad · {delegation.members.length}
                </h3>
                {delegation.members.length === 0 ? (
                    <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-center text-[12px] text-zinc-400">
                        Nobody added yet. Search below to build the squad.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {delegation.members.map((m) => (
                            <li key={m.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                                <div className="flex items-start gap-3">
                                    <Avatar url={m.profilePhotoUrl} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[13px] font-bold text-white">{m.name}</span>
                                            <span className="text-[11px] text-zinc-400">{m.rankLabel}</span>
                                        </div>
                                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{m.bio}</p>

                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <select
                                                aria-label={`Squad role for ${m.name}`}
                                                value={m.squadRole}
                                                onChange={(e) => patchMember(m, { squadRole: e.target.value })}
                                                className="h-8 rounded-lg border border-white/[0.1] bg-black px-2 text-[11px] text-white"
                                            >
                                                {SQUAD_ROLES.map((r) => (
                                                    <option key={r.value} value={r.value}>{r.label}</option>
                                                ))}
                                            </select>
                                            <input
                                                aria-label={`Custom write-up for ${m.name}`}
                                                defaultValue={m.bioOverride ?? ""}
                                                onBlur={(e) => {
                                                    if ((e.target.value.trim() || null) !== (m.bioOverride ?? null)) {
                                                        patchMember(m, { bioOverride: e.target.value });
                                                    }
                                                }}
                                                placeholder="Custom write-up (blank uses the auto line above)"
                                                className="h-8 min-w-0 flex-1 rounded-lg border border-white/[0.1] bg-black px-2 text-[11px] text-white placeholder:text-zinc-600"
                                            />
                                        </div>
                                    </div>
                                    <IconBtn title={`Remove ${m.name}`} danger onClick={() => removeMember(m)}>
                                        <Trash2 className="h-4 w-4" />
                                    </IconBtn>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Add members */}
            <section>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Add members</h3>
                <p className="mb-2 text-[11px] text-zinc-500">
                    Only members with a profile photo can be selected — the public page is built around their picture.
                </p>
                <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name, city or membership number"
                        aria-label="Search members to add"
                        className="h-10 w-full rounded-lg border border-white/[0.1] bg-white/[0.04] pl-9 pr-3 text-[13px] text-white placeholder:text-zinc-500 focus:border-red-500/50 focus:outline-none"
                    />
                </div>

                {searching ? (
                    <p className="py-4 text-center text-[12px] text-zinc-500">Searching…</p>
                ) : candidates.length === 0 ? (
                    <p className="py-4 text-center text-[12px] text-zinc-500">
                        No eligible members found. They may not have uploaded a profile photo yet.
                    </p>
                ) : (
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {candidates.map((u) => {
                            const added = already.has(u.id);
                            return (
                                <li key={u.id}
                                    className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5">
                                    <Avatar url={u.profilePhotoUrl} />
                                    <div className="min-w-0 flex-1">
                                        <span className="block truncate text-[12px] font-bold text-white">{u.name}</span>
                                        <span className="block truncate text-[10px] text-zinc-400">
                                            {u.currentBeltRank ?? "—"}{u.city ? ` · ${u.city}` : ""}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={added || busyId === u.id}
                                        onClick={() => add(u)}
                                        className="h-8 shrink-0 rounded-lg bg-red-600 px-3 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:cursor-default disabled:bg-white/[0.06] disabled:text-zinc-500"
                                    >
                                        {added ? "Added" : busyId === u.id ? "…" : "Add"}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}

/* ─── Small pieces ───────────────────────────────────────── */

const inputCls =
    "w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-zinc-400">{label}</span>
            {children}
        </label>
    );
}

function Avatar({ url }: { url: string | null }) {
    const src = getImageUrl(url || null);
    if (!src) {
        return (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-600">
                <ImageOff className="h-4 w-4" aria-hidden="true" />
            </div>
        );
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover object-top" />;
}

function IconBtn({
    children, title, onClick, danger, active,
}: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean; active?: boolean }) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                danger
                    ? "border-white/[0.08] text-zinc-400 hover:border-red-600/50 hover:bg-red-600/10 hover:text-red-400"
                    : active
                        ? "border-[#FFD700]/40 bg-[#FFD700]/10 text-[#FFD700]"
                        : "border-white/[0.08] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            }`}
        >
            {children}
        </button>
    );
}

function Banner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
            <p className="flex-1 text-[12px] text-amber-100">{message}</p>
            <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-amber-300 hover:text-white">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] py-14 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" aria-hidden="true" />
            <p className="text-[13px] font-bold text-zinc-100">Couldn&apos;t load trips</p>
            <button type="button" onClick={onRetry}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-[12px] font-bold uppercase tracking-wider text-white hover:bg-red-700">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
            </button>
        </div>
    );
}

/** Surface the server's message when there is one — it explains *why*. */
function readError(err: unknown, fallback: string): string {
    if (err && typeof err === "object" && "response" in err) {
        const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
        if (msg) return msg;
    }
    return fallback;
}
