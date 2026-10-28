"use client";

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const subscribe = () => () => {};

export default function Portal({ children }: { children: React.ReactNode }) {
    // false during SSR and hydration, true once on the client (replaces a
    // mounted flag set in an effect).
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);

    if (!mounted) return null;

    return createPortal(children, document.body);
}
