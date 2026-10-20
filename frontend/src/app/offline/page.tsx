'use client';

import SystemPage from "@/components/brand/SystemPage";

export default function OfflinePage() {
    return (
        <SystemPage mark="待" title="You are offline." body="Pages you have opened before may still work. Reconnect, then try again.">
            <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex min-h-12 items-center bg-canvas px-7 font-bold text-night transition-colors duration-500 ease-dojo hover:bg-dan-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dan-gold"
            >
                Try again
            </button>
        </SystemPage>
    );
}
