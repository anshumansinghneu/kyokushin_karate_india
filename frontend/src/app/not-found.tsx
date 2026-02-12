"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
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
                    className="text-center"
                >
                    {/* 404 Text */}
                    <motion.h1
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-[120px] sm:text-[200px] md:text-[300px] font-black leading-none mb-4 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900"
                    >
                        404
                    </motion.h1>

                    {/* Message */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
                            Page Not Found
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-400 mb-8 md:mb-12 max-w-2xl mx-auto px-2">
                            The page you&apos;re looking for doesn&apos;t exist or has been moved.
                            Let&apos;s get you back on track.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link href="/">
                                <Button
                                    size="lg"
                                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg rounded-full"
                                >
                                    <Home className="w-5 h-5 mr-2" />
                                    Go Home
                                </Button>
                            </Link>

                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => window.history.back()}
                                className="border-white/20 hover:bg-white/5 px-8 py-6 text-lg rounded-full"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Go Back
                            </Button>
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
