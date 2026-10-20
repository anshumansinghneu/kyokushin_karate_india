"use client";

import { useEffect } from "react";
import BrandLink from "@/components/brand/BrandLink";
import SystemPage from "@/components/brand/SystemPage";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <SystemPage
            mark="障"
            title="Something broke."
            body={
                <>
                    This page hit an error. Try again, or go back to the start.
                    {process.env.NODE_ENV === "development" && error.message && (
                        <span className="mt-4 block break-words text-[0.8rem] text-ash">{error.message}</span>
                    )}
                </>
            }
        >
            <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-12 items-center bg-canvas px-7 font-bold text-night transition-colors duration-500 ease-dojo hover:bg-dan-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dan-gold"
            >
                Try again
            </button>
            <BrandLink href="/" variant="outline">Back to the start</BrandLink>
        </SystemPage>
    );
}
