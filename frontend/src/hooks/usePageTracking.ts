'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Generates a simple browser fingerprint for uniqueness tracking.
 * Not a tracking ID — just screen + timezone + language + platform hash.
 */
function generateFingerprint(): string {
    const raw = [
        navigator.language,
        navigator.platform,
        screen.width,
        screen.height,
        screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        new Date().getTimezoneOffset(),
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'fp_' + Math.abs(hash).toString(36);
}

import { API_URL } from '@/lib/config';

/**
 * Hook that records a page visit on every route change.
 * Sends fingerprint + path to the backend. Debounced to prevent spamming.
 */
export function usePageTracking() {
    const pathname = usePathname();
    const lastPath = useRef<string>('');
    const lastTime = useRef<number>(0);

    useEffect(() => {
        // Skip if same path visited within 5 seconds (debounce)
        const now = Date.now();
        if (pathname === lastPath.current && now - lastTime.current < 5000) return;

        lastPath.current = pathname;
        lastTime.current = now;

        // Fire and forget — don't block rendering
        const fingerprint = generateFingerprint();
        fetch(`${API_URL}/analytics/visit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fingerprint,
                path: pathname,
                referrer: document.referrer || null,
            }),
            keepalive: true,
        }).catch(() => {
            // Silently fail — analytics should never break the site
        });
    }, [pathname]);
}
