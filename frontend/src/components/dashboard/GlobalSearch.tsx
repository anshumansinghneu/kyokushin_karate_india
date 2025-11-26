"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, User, Phone, Mail, Hash, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";

interface SearchResult {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    membershipId: string;
    currentBeltRank: string;
    role: string;
    status: string;
    dojoName?: string;
}

interface GlobalSearchProps {
    onResultClick: (userId: string) => void;
}

export default function GlobalSearch({ onResultClick }: GlobalSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    // Handle search with debouncing
    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.trim().length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
            setResults(response.data.data.users || []);
            setIsOpen(true);
            setSelectedIndex(0);
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [query, performSearch]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K to focus search
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
                return;
            }

            // ESC to close
            if (e.key === "Escape") {
                setIsOpen(false);
                inputRef.current?.blur();
                return;
            }

            // Arrow keys for navigation
            if (isOpen && results.length > 0) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev + 1) % results.length);
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    handleResultClick(results[selectedIndex]);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleResultClick = (result: SearchResult) => {
        onResultClick(result.id);
        setQuery("");
        setIsOpen(false);
        setResults([]);
    };

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const getBeltColor = (rank: string) => {
        const colors: { [key: string]: string } = {
            WHITE: "bg-gray-100",
            YELLOW: "bg-yellow-400",
            ORANGE: "bg-orange-500",
            BLUE: "bg-blue-600",
            GREEN: "bg-green-600",
            BROWN: "bg-amber-800",
            BLACK: "bg-black",
        };
        return colors[rank] || "bg-gray-400";
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-2xl">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder="Search students... (⌘K)"
                    className="pl-12 pr-12 py-6 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-2xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                />
                {isLoading && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                )}
                {!isLoading && query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
                {isOpen && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-2 w-full bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                        <div className="p-2 max-h-[400px] overflow-y-auto">
                            {results.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleResultClick(result)}
                                    className={`w-full text-left p-4 rounded-xl transition-all ${
                                        index === selectedIndex
                                            ? "bg-red-500/20 border border-red-500/30"
                                            : "hover:bg-white/5 border border-transparent"
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-white" />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-white font-semibold truncate">{result.name}</h4>
                                                <div className={`w-3 h-3 rounded-full ${getBeltColor(result.currentBeltRank)} flex-shrink-0`} title={result.currentBeltRank} />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Hash className="w-3.5 h-3.5" />
                                                    <span>{result.membershipId}</span>
                                                </div>
                                                {result.email && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span className="truncate max-w-[200px]">{result.email}</span>
                                                    </div>
                                                )}
                                                {result.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        <span>{result.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {result.dojoName && (
                                                <div className="mt-1 text-xs text-gray-500">
                                                    {result.dojoName}
                                                </div>
                                            )}

                                            {/* Status Badge */}
                                            <div className="mt-2">
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full ${
                                                        result.status === "ACTIVE"
                                                            ? "bg-green-500/20 text-green-400"
                                                            : result.status === "PENDING"
                                                            ? "bg-yellow-500/20 text-yellow-400"
                                                            : "bg-gray-500/20 text-gray-400"
                                                    }`}
                                                >
                                                    {result.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer hint */}
                        <div className="px-4 py-2 bg-white/5 border-t border-white/10 text-xs text-gray-500 flex items-center justify-between">
                            <span>↑↓ Navigate • Enter Select • ESC Close</span>
                            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* No Results */}
            <AnimatePresence>
                {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 w-full bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center z-50"
                    >
                        <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No students found for &quot;{query}&quot;</p>
                        <p className="text-sm text-gray-600 mt-1">Try searching by name, email, phone, or membership ID</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
