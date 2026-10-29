"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export interface ManagedDojo {
    id: string;
    name: string;
}

const STORAGE_KEY = "kkfi:managed-dojo";

/**
 * The dojo an instructor is managing on the fees and attendance pages. These pages used
 * only `user.dojoId`, which is empty for instructors linked through the dojos they teach
 * at (half of them), and showed instructors who teach at several dojos just one. The
 * choices are the home dojo plus every teaching dojo; the admin can pick any dojo. The
 * last choice is remembered across both pages.
 */
export function useManagedDojo() {
    const user = useAuthStore((s) => s.user);
    const [allDojos, setAllDojos] = useState<ManagedDojo[]>([]);
    const [picked, setPicked] = useState<string | null>(() => {
        try {
            return typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY);
        } catch {
            return null;
        }
    });

    const isAdmin = user?.role === "ADMIN";
    useEffect(() => {
        if (!isAdmin) return;
        api.get("/dojos")
            .then((res) => setAllDojos(((res.data?.data?.dojos ?? []) as ManagedDojo[]).map((d) => ({ id: d.id, name: d.name }))))
            .catch(() => {});
    }, [isAdmin]);

    const options = useMemo<ManagedDojo[]>(() => {
        const out = new Map<string, ManagedDojo>();
        if (user?.dojoId) out.set(user.dojoId, { id: user.dojoId, name: user.dojo?.name ?? "Home dojo" });
        for (const d of user?.teachingDojos ?? []) out.set(d.id, { id: d.id, name: d.name });
        if (isAdmin) for (const d of allDojos) if (!out.has(d.id)) out.set(d.id, d);
        return [...out.values()];
    }, [user, isAdmin, allDojos]);

    const dojo = options.find((d) => d.id === picked) ?? options[0] ?? null;

    const choose = (id: string) => {
        setPicked(id);
        try {
            window.localStorage.setItem(STORAGE_KEY, id);
        } catch {
            // Remembering the choice is a convenience only.
        }
    };

    return { dojo, dojoId: dojo?.id, options, choose };
}

/** A dojo select for pages that act on one dojo; hidden when there is only one choice. */
export function DojoPicker({ options, value, onChange }: { options: ManagedDojo[]; value?: string; onChange: (id: string) => void }) {
    if (options.length < 2) return null;
    return (
        <label className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-white/80">Dojo</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-[44px] rounded-none border border-white/20 bg-white/5 px-3 focus-visible:border-[#FF0000] focus-visible:outline-none"
            >
                {options.map((d) => (
                    <option key={d.id} value={d.id} className="bg-black">
                        {d.name}
                    </option>
                ))}
            </select>
        </label>
    );
}
