"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Trophy, Users, Zap, RefreshCw, Award } from "lucide-react";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";
import Link from "next/link";

interface LiveMatch {
  id: string;
  fighterAName: string;
  fighterBName: string;
  fighterAScore: number;
  fighterBScore: number;
  roundName: string;
  matchNumber: number;
  categoryName?: string;
  eventName?: string;
  eventId?: string;
  status: string;
}

interface RecentResult {
  id: string;
  fighterA: { id: string; name: string; currentBeltRank: string };
  fighterB: { id: string; name: string; currentBeltRank: string };
  fighterAScore: number;
  fighterBScore: number;
  winnerId: string;
  roundName: string;
  completedAt: string;
  bracket?: { categoryName: string; event?: { name: string } };
}

interface Champion {
  category: string;
  weight: string;
  belt: string;
  winner: { id: string; name: string; beltRank: string; photo: string | null; dojo: string | null };
  score: string;
}

export default function LivePage() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [tournamentName, setTournamentName] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const [liveRes, resultsRes, champRes] = await Promise.allSettled([
          api.get("/matches/live"),
          api.get("/matches/results/recent?limit=10"),
          api.get("/matches/results/champions"),
        ]);

        if (liveRes.status === 'fulfilled') {
          const matches = liveRes.value.data.data.matches.map((m: any) => ({
            id: m.id,
            fighterAName: m.fighterAName || m.fighterA?.name || "TBD",
            fighterBName: m.fighterBName || m.fighterB?.name || "TBD",
            fighterAScore: m.fighterAScore || 0,
            fighterBScore: m.fighterBScore || 0,
            roundName: m.roundName,
            matchNumber: m.matchNumber,
            categoryName: m.bracket?.categoryName,
            eventName: m.bracket?.event?.name,
            eventId: m.bracket?.event?.id,
            status: m.status,
          }));
          setLiveMatches(matches);
        }

        if (resultsRes.status === 'fulfilled') {
          setRecentResults(resultsRes.value.data.data.matches || []);
        }

        if (champRes.status === 'fulfilled') {
          const data = champRes.value.data.data;
          setChampions(data.champions || []);
          setTournamentName(data.tournament?.name || "");
        }
      } catch (err) {
        console.error("Failed to fetch live matches", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLive();

    const newSocket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
    );
    setSocket(newSocket);

    newSocket.on("match:started", (data: any) => {
      setLiveMatches((prev) => [
        ...prev,
        {
          id: data.matchId,
          fighterAName: data.fighterA?.name || "TBD",
          fighterBName: data.fighterB?.name || "TBD",
          fighterAScore: 0,
          fighterBScore: 0,
          roundName: data.round || "",
          matchNumber: 0,
          status: "LIVE",
        },
      ]);
      setLastUpdate(new Date());
    });

    newSocket.on("match:update", (data: any) => {
      setLiveMatches((prev) =>
        prev.map((m) =>
          m.id === data.matchId
            ? {
                ...m,
                fighterAScore: data.fighterAScore ?? m.fighterAScore,
                fighterBScore: data.fighterBScore ?? m.fighterBScore,
              }
            : m
        )
      );
      setLastUpdate(new Date());
    });

    newSocket.on("match:ended", (data: any) => {
      setLiveMatches((prev) => prev.filter((m) => m.id !== data.matchId));
      setLastUpdate(new Date());
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.get("/matches/live");
      const matches = res.data.data.matches.map((m: any) => ({
        id: m.id,
        fighterAName: m.fighterAName || m.fighterA?.name || "TBD",
        fighterBName: m.fighterBName || m.fighterB?.name || "TBD",
        fighterAScore: m.fighterAScore || 0,
        fighterBScore: m.fighterBScore || 0,
        roundName: m.roundName,
        matchNumber: m.matchNumber,
        categoryName: m.bracket?.categoryName,
        eventName: m.bracket?.event?.name,
        eventId: m.bracket?.event?.id,
        status: m.status,
      }));
      setLiveMatches(matches);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 text-sm font-bold uppercase tracking-widest">
                Live Now
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
              LIVE <span className="text-red-600">SCORING</span>
            </h1>
            <p className="text-gray-400 mt-2">
              Real-time tournament matches • Auto-updating scores
            </p>
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="glass-card p-4 text-center">
            <Radio className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-black">{liveMatches.length}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Live Matches
            </p>
          </div>
          <div className="glass-card p-4 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-black">{liveMatches.length * 2}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Fighters
            </p>
          </div>
          <div className="glass-card p-4 text-center">
            <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-black">
              {lastUpdate.toLocaleTimeString()}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Last Update
            </p>
          </div>
        </div>

        {/* Live Matches Grid */}
        {loading && liveMatches.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-zinc-900 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : liveMatches.length === 0 ? (
          <div className="space-y-8">
            {/* Last Tournament Champions */}
            {champions.length > 0 ? (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-bold text-yellow-500 uppercase tracking-widest">Tournament Champions</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-white mb-2">{tournamentName}</h3>
                  <p className="text-gray-500">No live matches right now. Here are the champions from the last tournament.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {champions.map((champ, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-gradient-to-b from-yellow-500/5 to-transparent border border-yellow-500/20 rounded-2xl p-6 text-center relative overflow-hidden group hover:border-yellow-500/40 transition-colors"
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-yellow-500/10 rounded-full blur-3xl" />
                      <div className="relative">
                        <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                        <h4 className="text-lg font-black text-white mb-1">{champ.winner.name}</h4>
                        <p className="text-sm text-gray-400 mb-3">{champ.winner.dojo || "Independent"}</p>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                            {champ.category}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          Final Score: {champ.score}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-6 text-zinc-700" />
                <h3 className="text-2xl font-bold mb-2">No Live Matches</h3>
                <p className="text-gray-500 mb-8">
                  Check back during tournament events for real-time scoring
                </p>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
                >
                  View Upcoming Events
                </Link>
              </div>
            )}

            {/* Recent Results */}
            {recentResults.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Recent Results
                </h3>
                <div className="space-y-3">
                  {recentResults.map((result) => {
                    const winnerName = result.winnerId === result.fighterA?.id ? result.fighterA.name : result.fighterB.name;
                    const loserName = result.winnerId === result.fighterA?.id ? result.fighterB.name : result.fighterA.name;
                    const winnerScore = result.winnerId === result.fighterA?.id ? result.fighterAScore : result.fighterBScore;
                    const loserScore = result.winnerId === result.fighterA?.id ? result.fighterBScore : result.fighterAScore;

                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <span>{result.bracket?.event?.name}</span>
                            <span>•</span>
                            <span>{result.bracket?.categoryName}</span>
                            <span>•</span>
                            <span>{result.roundName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">{winnerName}</span>
                            <span className="text-green-500 font-mono font-bold">{winnerScore}</span>
                            <span className="text-gray-600">-</span>
                            <span className="text-red-400 font-mono font-bold">{loserScore}</span>
                            <span className="text-gray-400">{loserName}</span>
                          </div>
                        </div>
                        {result.completedAt && (
                          <span className="text-[10px] text-gray-600 flex-shrink-0">
                            {new Date(result.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {liveMatches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-zinc-900 border border-red-500/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                >
                  {/* Live Header */}
                  <div className="bg-red-600 px-4 py-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      LIVE
                    </span>
                    <span className="text-xs text-white/80">
                      {match.categoryName || match.roundName}
                    </span>
                  </div>

                  {/* Event Info */}
                  {match.eventName && (
                    <div className="px-4 py-2 border-b border-white/5 bg-zinc-900/50">
                      <p className="text-xs text-gray-400 truncate">
                        {match.eventName} • {match.roundName}
                      </p>
                    </div>
                  )}

                  {/* Scoreboard */}
                  <div className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                        <motion.div
                          key={`a-${match.fighterAScore}`}
                          initial={{ scale: 1.3, color: "#ef4444" }}
                          animate={{ scale: 1, color: "#ffffff" }}
                          className="text-4xl font-mono font-black mb-2"
                        >
                          {match.fighterAScore}
                        </motion.div>
                        <div className="text-sm text-zinc-400 truncate px-1">
                          {match.fighterAName}
                        </div>
                      </div>

                      <div className="flex flex-col items-center px-4">
                        <div className="text-zinc-600 font-black text-xl">
                          VS
                        </div>
                      </div>

                      <div className="text-center flex-1">
                        <motion.div
                          key={`b-${match.fighterBScore}`}
                          initial={{ scale: 1.3, color: "#ef4444" }}
                          animate={{ scale: 1, color: "#ffffff" }}
                          className="text-4xl font-mono font-black mb-2"
                        >
                          {match.fighterBScore}
                        </motion.div>
                        <div className="text-sm text-zinc-400 truncate px-1">
                          {match.fighterBName}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
