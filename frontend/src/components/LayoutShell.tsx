"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import MobileBottomNav from "@/components/ui/MobileBottomNav";
import BackToTop from "@/components/ui/BackToTop";
import PageTransition from "@/components/PageTransition";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullscreen = pathname === '/management';

    if (isFullscreen) {
        return <>{children}</>;
    }

    return (
        <>
            <ScrollProgress />
            <Navbar />
            <main className="min-h-screen pt-14 md:pt-24 pb-20 md:pb-0">
                <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
            <MobileBottomNav />
            <BackToTop />
        </>
    );
}
