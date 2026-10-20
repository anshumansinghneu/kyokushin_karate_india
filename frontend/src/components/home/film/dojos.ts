import api from "@/lib/api";

export interface PublicDojo {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

let pending: Promise<PublicDojo[]> | null = null;

/** The live dojo list, fetched once per page for every section that needs it. */
export function loadDojos(): Promise<PublicDojo[]> {
    pending ??= api
        .get("/dojos", { params: { limit: 500 } })
        .then((res) => (res.data.data.dojos ?? []) as PublicDojo[])
        .catch((err) => {
            pending = null; // let a later caller retry
            throw err;
        });
    return pending;
}
