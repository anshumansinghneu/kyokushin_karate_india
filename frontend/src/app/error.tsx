"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen w-full bg-black text-white flex items-center justify-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black pointer-events-none" />
            <div className="fixed top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-2xl mx-auto"
                >
                    {/* Error Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-600/10 border-4 border-red-600/20 mb-8"
                    >
                        <AlertTriangle className="w-16 h-16 text-red-500" />
                    </motion.div>

                    {/* Message */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black mb-6">
                            Something Went Wrong
                        </h1>
                        <p className="text-xl text-gray-400 mb-12">
                            We encountered an unexpected error. Don&apos;t worry, our team has been notified
                            and we&apos;re working on fixing it.
                        </p>

                        {/* Error Details (only in development) */}
                        {process.env.NODE_ENV === "development" && error.message && (
                            <div className="mb-8 p-4 bg-zinc-900/50 border border-red-600/20 rounded-lg text-left">
                                <p className="text-sm text-red-400 font-mono break-all">
                                    {error.message}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button
                                size="lg"
                                onClick={reset}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg rounded-full"
                            >
                                <RefreshCcw className="w-5 h-5 mr-2" />
                                Try Again
                            </Button>

                            <Link href="/">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="border-white/20 hover:bg-white/5 px-8 py-6 text-lg rounded-full"
                                >
                                    <Home className="w-5 h-5 mr-2" />
                                    Go Home
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Decorative Elements */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-red-600 blur-[200px] -z-10"
                    />
                </motion.div>
            </div>
        </div>
    );
}
