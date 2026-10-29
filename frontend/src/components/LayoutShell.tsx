"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import MobileBottomNav from "@/components/ui/MobileBottomNav";
import BackToTop from "@/components/ui/BackToTop";
import PageTransition from "@/components/PageTransition";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useDeviceTierInit } from "@/hooks/useDeviceTier";
import CanvasHost from "@/components/three/CanvasHost";
import SmoothScroll from "@/components/brand/SmoothScroll";
import BeltWipe from "@/components/brand/BeltWipe";
import FilmFooter from "@/components/home/film/FilmFooter";
import { isMemberApp } from "@/lib/routes";

// The logged-in app keeps plain native scrolling and no route theatrics.
const APP_PREFIXES = ['/dashboard', '/profile', '/payments', '/renew-membership', '/login', '/register', '/forgot-password', '/reset-password'];

export default function LayoutShell({ children, cities = [] }: { children: React.ReactNode; cities?: { city: string; slug: string }[] }) {
    const pathname = usePathname();
    const isFullscreen = pathname === '/management' || pathname.startsWith('/management/');

    // Track page visits for analytics
    usePageTracking();
    useDeviceTierInit();
    const isApp = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
    // The public site wears the dojo system (docs/superpowers/specs/2026-10-19-full-site-redesign-design.md):
    // its own nav and footer, no red progress bar or back-to-top. The member app keeps its look.
    const isPublic = !isMemberApp(pathname);

    // Keep the palette in step on client navigation (first paint is handled by SKIN_SCRIPT).
    useEffect(() => {
        document.documentElement.classList.toggle('skin-app', !isPublic);
    }, [isPublic]);

    if (isFullscreen) {
        return <>{children}</>;
    }

    return (
        <>
            <CanvasHost />
            {!isApp && <SmoothScroll />}
            {!isApp && <BeltWipe pathname={pathname} />}
            {!isPublic && <ScrollProgress />}
            <Navbar />
            {/* Sits above the fixed WebGL canvas (z-0); scene slots are transparent holes in it. */}
            {/* Pages that open with a full-bleed hero mark it data-bleed; main then drops its
                navbar padding. Done in CSS (not a negative margin) so nothing moves on load. */}
            <main className="relative z-[1] min-h-screen pt-24 md:pt-32 pb-20 md:pb-0 [&:has([data-bleed])]:pt-0">
                <PageTransition pathname={pathname}>{children}</PageTransition>
            </main>
            {isPublic ? <FilmFooter cities={cities} /> : <Footer />}
            <MobileBottomNav />
            {!isPublic && <BackToTop />}
        </>
    );
}
