"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Crown } from "lucide-react";
import { io } from "socket.io-client";
import api from "@/lib/api";
import BrandLink from "@/components/brand/BrandLink";
import Reveal from "@/components/brand/Reveal";

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

interface ApiLiveMatch {
  id: string;
  fighterAName?: string | null;
  fighterBName?: string | null;
  fighterA?: { name?: string } | null;
  fighterB?: { name?: string } | null;
  fighterAScore?: number | null;
  fighterBScore?: number | null;
  roundName: string;
  matchNumber: number;
  status: string;
  bracket?: { categoryName?: string; event?: { id?: string; name?: string } };
}

interface SocketMatchEvent {
  matchId: string;
  fighterA?: { name?: string };
  fighterB?: { name?: string };
  round?: string;
  fighterAScore?: number;
  fighterBScore?: number;
}

const toLive = (m: ApiLiveMatch): LiveMatch => ({
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
});

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
  const [loading, setLoading] = useState(true);
  // Set on the client only: a server-rendered clock never matches the browser's.
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const [liveRes, resultsRes, champRes] = await Promise.allSettled([
          api.get("/matches/live"),
          api.get("/matches/results/recent?limit=10"),
          api.get("/matches/results/champions"),
        ]);

        if (liveRes.status === 'fulfilled') {
          const matches = (liveRes.value.data.data.matches as ApiLiveMatch[]).map(toLive);
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
        setLastUpdate(new Date());
      }
    };

    fetchLive();

    const newSocket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
    );

    newSocket.on("match:started", (data: SocketMatchEvent) => {
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

    newSocket.on("match:update", (data: SocketMatchEvent) => {
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

    newSocket.on("match:ended", (data: SocketMatchEvent) => {
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
      const matches = (res.data.data.matches as ApiLiveMatch[]).map(toLive);
      setLiveMatches(matches);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const live = liveMatches.length > 0;

  return (
    <div className="min-h-dvh bg-black text-white">
      <header className="mx-auto max-w-[1400px] px-4 pb-12 pt-10 sm:px-6 md:pt-16 lg:px-8">
        <p className={`flex items-center gap-2 text-sm font-semibold ${live ? "text-primary-light" : "text-white/60"}`}>
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${live ? "bg-primary animate-pulse" : "bg-white/30"}`} />
          {live ? `${liveMatches.length} ${liveMatches.length === 1 ? "match" : "matches"} on the mat` : "Nothing on the mat right now"}
        </p>
        <h1 className="mt-4 text-[clamp(2.75rem,8vw,5.5rem)] font-black uppercase leading-[0.92] tracking-[-0.035em]">
          Live scoring<span className="text-primary">.</span>
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="max-w-[46ch] text-pretty text-lg leading-relaxed text-white/75">
            Real-time scores from KKFI tournaments, updating as the referees enter them.
          </p>
          <button
            onClick={refresh}
            className="inline-flex min-h-11 items-center gap-2 border border-white/25 px-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh
          </button>
          {lastUpdate && <span className="text-sm text-white/50 tabular-nums">Updated {lastUpdate.toLocaleTimeString()}</span>}
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-20 px-4 pb-24 sm:px-6 lg:px-8">
        {loading && !live ? (
          <div aria-busy="true" className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        ) : live ? (
          <section aria-label="Live matches">
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(19rem,1fr))] gap-4">
              <AnimatePresence>
                {liveMatches.map((match) => (
                  <motion.li
                    key={match.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden rounded-lg border border-primary/60 bg-surface"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 font-bold text-primary-light">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
                      </span>
                      <span className="truncate text-white/60">{[match.eventName, match.categoryName, match.roundName].filter(Boolean).join(" · ")}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-6 text-center">
                      <div className="min-w-0">
                        <motion.div
                          key={`a-${match.fighterAScore}`}
                          initial={{ scale: 1.25 }}
                          animate={{ scale: 1 }}
                          className="text-5xl font-black tabular-nums"
                        >
                          {match.fighterAScore}
                        </motion.div>
                        <div className="mt-2 truncate text-sm text-white/75">{match.fighterAName}</div>
                      </div>
                      <span className="text-sm font-bold text-white/35">vs</span>
                      <div className="min-w-0">
                        <motion.div
                          key={`b-${match.fighterBScore}`}
                          initial={{ scale: 1.25 }}
                          animate={{ scale: 1 }}
                          className="text-5xl font-black tabular-nums"
                        >
                          {match.fighterBScore}
                        </motion.div>
                        <div className="mt-2 truncate text-sm text-white/75">{match.fighterBName}</div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        ) : champions.length > 0 ? (
          <section aria-labelledby="champions-heading">
            <p className="text-sm font-semibold text-secondary">Last tournament</p>
            <h2 id="champions-heading" className="mt-3 max-w-[24ch] text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight">
              {tournamentName || "Champions"}
            </h2>
            <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {champions.map((champ, i) => (
                <Reveal as="li" key={i} delay={Math.min(i * 0.04, 0.3)} className="grid items-baseline gap-x-8 gap-y-1 py-5 sm:grid-cols-[1fr_14rem_8rem]">
                  <div className="flex min-w-0 items-center gap-2">
                    <Crown className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-extrabold">{champ.winner.name}</p>
                      <p className="truncate text-sm text-white/60">{champ.winner.dojo || "Independent"}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white/75">{champ.category}</p>
                  <p className="text-sm text-white/60 tabular-nums sm:text-right">Final {champ.score}</p>
                </Reveal>
              ))}
            </ul>
          </section>
        ) : (
          <section className="border-y border-white/10 py-16">
            <p className="text-2xl font-extrabold">No live matches.</p>
            <p className="mt-3 max-w-[46ch] leading-relaxed text-white/70">During a tournament, every match appears here the moment it starts, with scores updating in real time.</p>
            <div className="mt-8">
              <BrandLink href="/events" variant="outline">Upcoming events</BrandLink>
            </div>
          </section>
        )}

        {!live && recentResults.length > 0 && (
          <section aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="mb-6 text-2xl font-extrabold md:text-3xl">Recent results</h2>
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {recentResults.map((result) => {
                const aWon = result.winnerId === result.fighterA?.id;
                const winnerName = aWon ? result.fighterA.name : result.fighterB.name;
                const loserName = aWon ? result.fighterB.name : result.fighterA.name;
                const winnerScore = aWon ? result.fighterAScore : result.fighterBScore;
                const loserScore = aWon ? result.fighterBScore : result.fighterAScore;
                return (
                  <li key={result.id} className="grid gap-x-8 gap-y-1 py-4 sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white/55">
                        {[result.bracket?.event?.name, result.bracket?.categoryName, result.roundName].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                        <span className="font-bold">{winnerName}</span>
                        <span className="font-black tabular-nums text-secondary">{winnerScore}</span>
                        <span className="text-white/40">–</span>
                        <span className="font-semibold tabular-nums text-white/60">{loserScore}</span>
                        <span className="text-white/70">{loserName}</span>
                      </p>
                    </div>
                    {result.completedAt && (
                      <span className="text-sm text-white/50 tabular-nums">{new Date(result.completedAt).toLocaleDateString("en-IN")}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
