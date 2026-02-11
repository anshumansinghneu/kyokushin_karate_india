"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Users, Building, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface Dojo {
    id: string;
    name: string;
    city: string;
}

export default function AnnouncementManager() {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [targetAudience, setTargetAudience] = useState<string>("all");
    const [dojoId, setDojoId] = useState("");
    const [dojos, setDojos] = useState<Dojo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDojos = async () => {
            try {
                const res = await api.get("/dojos");
                setDojos(res.data.data.dojos || []);
            } catch {
                console.error("Failed to fetch dojos");
            }
        };
        fetchDojos();
    }, []);

    const audienceOptions = [
        { value: "all", label: "All Members", description: "Send to every registered user", icon: Users },
        { value: "students", label: "Students Only", description: "All users with Student role", icon: Users },
        { value: "instructors", label: "Instructors Only", description: "All users with Instructor role", icon: Users },
        { value: "active", label: "Active Members", description: "Only users with ACTIVE membership", icon: CheckCircle },
        { value: "dojo", label: "Specific Dojo", description: "Members of a specific dojo", icon: Building },
    ];

    const handleSend = async () => {
        setError("");
        setResult(null);
        if (!subject.trim() || !body.trim()) {
            setError("Subject and body are required.");
            return;
        }
        if (targetAudience === "dojo" && !dojoId) {
            setError("Please select a dojo.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.post("/announcements/send", {
                subject,
                body,
                targetAudience,
                dojoId: targetAudience === "dojo" ? dojoId : undefined,
            });
            setResult(res.data.data);
            setSubject("");
            setBody("");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to send announcement.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-white mb-2">Announcements</h1>
                <p className="text-gray-400">Send bulk email announcements to members.</p>
            </div>

            {/* Result Banner */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3"
                >
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div>
                        <p className="text-green-400 font-bold">Announcement Sent!</p>
                        <p className="text-green-400/80 text-sm">
                            {result.sent} delivered, {result.failed} failed out of {result.total} recipients.
                        </p>
                    </div>
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                >
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-400 font-medium text-sm">{error}</p>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Compose */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-1 bg-red-600 rounded-full" />
                            <h2 className="text-lg font-bold text-white">Compose Message</h2>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Subject</label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g. Important: Upcoming Tournament Information"
                                className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-red-500/50 focus:ring-red-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Message Body</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Write your announcement message here..."
                                rows={8}
                                className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-red-500/50 focus:ring-red-500/20 focus:outline-none resize-none p-4 text-sm"
                            />
                        </div>

                        <Button
                            onClick={handleSend}
                            disabled={isLoading}
                            className="h-12 px-8 text-base font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transition-all"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send className="w-5 h-5" />
                                    Send Announcement
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Right: Audience Selection */}
                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-1 bg-red-600 rounded-full" />
                            <h2 className="text-lg font-bold text-white">Target Audience</h2>
                        </div>

                        <div className="space-y-2">
                            {audienceOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTargetAudience(opt.value)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                                        targetAudience === opt.value
                                            ? "bg-red-500/10 border-red-500/30 text-white"
                                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <opt.icon className={`w-4 h-4 ${targetAudience === opt.value ? "text-red-500" : "text-gray-500"}`} />
                                        <div>
                                            <p className="text-sm font-bold">{opt.label}</p>
                                            <p className="text-xs text-gray-500">{opt.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Dojo selector (conditional) */}
                        {targetAudience === "dojo" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-2 pt-2"
                            >
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Select Dojo</label>
                                <select
                                    value={dojoId}
                                    onChange={(e) => setDojoId(e.target.value)}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm px-3 focus:border-red-500/50 focus:outline-none"
                                >
                                    <option value="" className="bg-black">Choose a dojo...</option>
                                    {dojos.map((d) => (
                                        <option key={d.id} value={d.id} className="bg-black">
                                            {d.name} — {d.city}
                                        </option>
                                    ))}
                                </select>
                            </motion.div>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5">
                        <h3 className="text-sm font-bold text-blue-400 mb-3">Tips</h3>
                        <ul className="space-y-2 text-xs text-gray-400">
                            <li className="flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                Emails are sent individually — recipients can't see other addresses.
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                Each email is personalized with the member's name.
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                Gmail allows ~500 emails/day. Use wisely for large lists.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
