"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy, Plus, Calendar, MapPin, Users, Edit2, Trash2,
    Eye, Medal, Target, Search, X, CheckCircle, XCircle,
    Download, ChevronDown, ChevronUp,
    UserCheck, RefreshCw, Award, ArrowRightLeft, Layers, FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { getImageUrl } from "@/lib/imageUtils";

interface Tournament {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    startDate: string;
    endDate: string;
    location: string;
    type: string;
    status: string;
    categories: any;
    registrationDeadline: string;
    maxParticipants: number | null;
    memberFee: number;
    nonMemberFee: number;
    _count?: {
        registrations: number;
        results: number;
    };
}

interface MatchData {
    id: string;
    roundNumber: number;
    roundName: string;
    matchNumber: number;
    fighterAId: string | null;
    fighterBId: string | null;
    fighterAName: string | null;
    fighterBName: string | null;
    fighterAScore: number | null;
    fighterBScore: number | null;
    winnerId: string | null;
    isBye: boolean;
    status: string;
    nextMatchId: string | null;
}

interface BracketData {
    id: string;
    eventId: string;
    categoryName: string;
    categoryAge: string;
    categoryWeight: string;
    categoryBelt: string;
    totalParticipants: number;
    status: string;
    matches: MatchData[];
}

export default function TournamentManager() {
    const { showToast } = useToast();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
    const [viewingTournament, setViewingTournament] = useState<Tournament | null>(null);

    // Participants state
    const [participants, setParticipants] = useState<any[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [participantSearch, setParticipantSearch] = useState("");
    const [approvalFilter, setApprovalFilter] = useState<string>("ALL");
    const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
    const [sortField, setSortField] = useState<string>("name");
    const [sortAsc, setSortAsc] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    // Brackets state
    const [brackets, setBrackets] = useState<BracketData[]>([]);
    const [loadingBrackets, setLoadingBrackets] = useState(false);
    const [selectedBracketId, setSelectedBracketId] = useState<string | null>(null);
    const [generatingBrackets, setGeneratingBrackets] = useState(false);
    const bracketRef = useRef<HTMLDivElement>(null);

    // Bracket generation progress state
    const [bracketProgress, setBracketProgress] = useState<{
        show: boolean;
        phase: string;
        message: string;
        current: number;
        total: number;
        categoryName?: string;
        detail?: string;
        logs: { message: string; categoryName?: string; detail?: string; time: number }[];
        done: boolean;
        error: string | null;
        resultCount: number;
        startTime: number;
    }>({
        show: false, phase: '', message: '', current: 0, total: 100,
        logs: [], done: false, error: null, resultCount: 0, startTime: 0
    });

    // Category management state
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [movingParticipant, setMovingParticipant] = useState<{
        registrationId: string; participantName: string;
        currentAge: string; currentWeight: string; currentBelt: string;
    } | null>(null);
    const [moveTarget, setMoveTarget] = useState({ categoryAge: '', categoryWeight: '', categoryBelt: '' });

    // Certificate state
    const [tournamentResults, setTournamentResults] = useState<any[]>([]);
    const [loadingResults, setLoadingResults] = useState(false);

    // Tab: 'participants' | 'brackets' | 'categories' | 'certificates'
    const [detailTab, setDetailTab] = useState<'participants' | 'brackets' | 'categories' | 'certificates'>('participants');

    const [formData, setFormData] = useState({
        name: "", description: "", startDate: "", endDate: "", location: "",
        registrationDeadline: "", maxParticipants: "", memberFee: "", nonMemberFee: "",
        categories: [] as string[],
    });

    useEffect(() => { fetchTournaments(); }, []);

    const fetchTournaments = async () => {
        try {
            const res = await api.get("/events?type=TOURNAMENT");
            setTournaments(res.data.data.events || []);
        } catch (error) {
            console.error("Failed to fetch tournaments:", error);
            showToast("Failed to load tournaments", "error");
        } finally {
            setLoading(false);
        }
    };

    // ── CRUD ──────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/events", {
                type: "TOURNAMENT", ...formData,
                maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
                memberFee: parseFloat(formData.memberFee),
                nonMemberFee: parseFloat(formData.nonMemberFee),
                categories: formData.categories.length > 0 ? formData.categories : null,
            });
            showToast("Tournament created successfully!", "success");
            setShowCreateModal(false);
            resetForm();
            fetchTournaments();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Failed to create tournament", "error");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTournament) return;
        try {
            await api.patch(`/events/${editingTournament.id}`, {
                ...formData,
                maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
                memberFee: parseFloat(formData.memberFee),
                nonMemberFee: parseFloat(formData.nonMemberFee),
                categories: formData.categories.length > 0 ? formData.categories : null,
            });
            showToast("Tournament updated successfully!", "success");
            setEditingTournament(null);
            resetForm();
            fetchTournaments();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Failed to update tournament", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tournament?")) return;
        try {
            await api.delete(`/events/${id}`);
            showToast("Tournament deleted successfully!", "success");
            fetchTournaments();
        } catch {
            showToast("Failed to delete tournament", "error");
        }
    };

    const openEditModal = (tournament: Tournament) => {
        setEditingTournament(tournament);
        setFormData({
            name: tournament.name, description: tournament.description || "",
            startDate: tournament.startDate.split('T')[0], endDate: tournament.endDate.split('T')[0],
            location: tournament.location || "",
            registrationDeadline: tournament.registrationDeadline.split('T')[0],
            maxParticipants: tournament.maxParticipants?.toString() || "",
            memberFee: tournament.memberFee.toString(), nonMemberFee: tournament.nonMemberFee.toString(),
            categories: Array.isArray(tournament.categories) ? tournament.categories : [],
        });
    };

    const resetForm = () => {
        setFormData({
            name: "", description: "", startDate: "", endDate: "", location: "",
            registrationDeadline: "", maxParticipants: "", memberFee: "", nonMemberFee: "",
            categories: [],
        });
    };

    const addCategory = () => setFormData(prev => ({ ...prev, categories: [...prev.categories, ""] }));
    const updateCategory = (i: number, v: string) => setFormData(prev => ({ ...prev, categories: prev.categories.map((c, idx) => idx === i ? v : c) }));
    const removeCategory = (i: number) => setFormData(prev => ({ ...prev, categories: prev.categories.filter((_, idx) => idx !== i) }));

    // ── Tournament detail ─────────────
    const handleViewDetails = async (tournament: Tournament) => {
        setViewingTournament(tournament);
        setDetailTab('participants');
        setParticipantSearch("");
        setApprovalFilter("ALL");
        setSelectedRegistrations(new Set());
        setBrackets([]);
        setSelectedBracketId(null);

        // Fetch participants
        setLoadingParticipants(true);
        try {
            const res = await api.get(`/events/${tournament.id}/registrations`);
            setParticipants(res.data.data.registrations || []);
        } catch {
            showToast("Failed to load participants", "error");
        } finally {
            setLoadingParticipants(false);
        }

        // Fetch brackets
        fetchBrackets(tournament.id);
        // Fetch categories
        fetchCategories(tournament.id);
        // Fetch results for certificates
        fetchTournamentResults(tournament.id);
    };

    const fetchBrackets = async (eventId: string) => {
        setLoadingBrackets(true);
        try {
            const res = await api.get(`/tournaments/${eventId}`);
            const data = res.data.data.brackets || [];
            setBrackets(data);
            if (data.length > 0) {
                setSelectedBracketId(data[0].id);
            }
        } catch {
            setBrackets([]);
        } finally {
            setLoadingBrackets(false);
        }
    };

    const fetchCategories = async (eventId: string) => {
        setLoadingCategories(true);
        try {
            const res = await api.get(`/tournaments/${eventId}/categories`);
            setCategoryData(res.data.data.categories || []);
        } catch {
            setCategoryData([]);
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchTournamentResults = async (eventId: string) => {
        setLoadingResults(true);
        try {
            const res = await api.get(`/results/${eventId}`);
            setTournamentResults(res.data.data.results || []);
        } catch {
            setTournamentResults([]);
        } finally {
            setLoadingResults(false);
        }
    };

    const handleMoveParticipant = async () => {
        if (!movingParticipant) return;
        try {
            await api.patch(`/tournaments/registrations/${movingParticipant.registrationId}/category`, moveTarget);
            showToast(`${movingParticipant.participantName} moved successfully!`, "success");
            setMovingParticipant(null);
            setMoveTarget({ categoryAge: '', categoryWeight: '', categoryBelt: '' });
            if (viewingTournament) fetchCategories(viewingTournament.id);
        } catch {
            showToast("Failed to move participant", "error");
        }
    };

    const handleDownloadCertificate = async (result: any) => {
        try {
            const { downloadCertificate } = await import('@/lib/certificateGenerator');
            downloadCertificate({
                participantName: result.user?.name || 'Unknown',
                categoryName: result.categoryName,
                position: result.finalRank,
                tournamentName: viewingTournament?.name || 'Tournament',
                date: viewingTournament?.startDate || new Date().toISOString(),
                location: viewingTournament?.location || '',
                dojoName: result.user?.dojo?.name,
            });
            showToast("Certificate downloaded!", "success");
        } catch {
            showToast("Failed to generate certificate", "error");
        }
    };

    const handleDownloadAllCertificates = async () => {
        if (tournamentResults.length === 0) return;
        try {
            const { downloadAllCertificates } = await import('@/lib/certificateGenerator');
            const certs = tournamentResults
                .filter((r: any) => r.finalRank <= 3)
                .map((r: any) => ({
                    participantName: r.user?.name || 'Unknown',
                    categoryName: r.categoryName,
                    position: r.finalRank,
                    tournamentName: viewingTournament?.name || 'Tournament',
                    date: viewingTournament?.startDate || new Date().toISOString(),
                    location: viewingTournament?.location || '',
                    dojoName: r.user?.dojo?.name,
                }));
            showToast(`Downloading ${certs.length} certificates...`, "info");
            await downloadAllCertificates(certs);
            showToast("All certificates downloaded!", "success");
        } catch {
            showToast("Failed to generate certificates", "error");
        }
    };

    // ── Generate Brackets ─────────────
    const handleGenerateBrackets = async () => {
        if (!viewingTournament) return;
        if (!confirm("Generate tournament brackets? This will create single-elimination brackets for all approved participants grouped by category. Any existing brackets will be replaced.")) return;

        setGeneratingBrackets(true);
        setBracketProgress({
            show: true, phase: 'init', message: 'Connecting...', current: 0, total: 100,
            logs: [], done: false, error: null, resultCount: 0, startTime: Date.now()
        });

        try {
            const token = localStorage.getItem('token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const url = `${baseUrl}/tournaments/${viewingTournament.id}/generate/stream`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok || !response.body) {
                throw new Error('Failed to connect to bracket generation stream');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const dataLine = line.replace(/^data: /, '').trim();
                    if (!dataLine) continue;
                    try {
                        const event = JSON.parse(dataLine);
                        if (event.type === 'progress') {
                            setBracketProgress(prev => ({
                                ...prev,
                                phase: event.phase,
                                message: event.message,
                                current: event.current,
                                total: event.total,
                                categoryName: event.categoryName || prev.categoryName,
                                detail: event.detail || prev.detail,
                                logs: [...prev.logs, {
                                    message: event.message,
                                    categoryName: event.categoryName,
                                    detail: event.detail,
                                    time: Date.now() - prev.startTime
                                }].slice(-50)
                            }));
                        } else if (event.type === 'complete') {
                            setBracketProgress(prev => ({
                                ...prev,
                                phase: 'done', message: event.message,
                                current: 100, total: 100, done: true,
                                resultCount: event.results
                            }));
                            showToast(`${event.results} bracket(s) generated successfully!`, "success");
                            await fetchBrackets(viewingTournament.id);
                            setDetailTab('brackets');
                        } else if (event.type === 'error') {
                            setBracketProgress(prev => ({
                                ...prev, error: event.message, done: true
                            }));
                            showToast(event.message || "Failed to generate brackets", "error");
                        }
                    } catch { /* ignore malformed */ }
                }
            }
        } catch (error: any) {
            console.error("Failed to generate brackets:", error);
            setBracketProgress(prev => ({
                ...prev, error: error.message || 'Failed to generate brackets', done: true
            }));
            showToast(error.message || "Failed to generate brackets", "error");
        } finally {
            setGeneratingBrackets(false);
        }
    };

    // ── PDF Download ──────────────────
    const handleDownloadPDF = async () => {
        if (!viewingTournament) return;
        const bracket = brackets.find(b => b.id === selectedBracketId);
        if (!bracket) {
            showToast("Select a bracket category first", "error");
            return;
        }

        showToast("Generating PDF... please wait", "info");

        try {
            const jsPDF = (await import('jspdf')).default;

            // Group matches by round
            const mByRound: Record<number, MatchData[]> = {};
            bracket.matches.forEach(m => {
                if (!mByRound[m.roundNumber]) mByRound[m.roundNumber] = [];
                mByRound[m.roundNumber].push(m);
            });
            const rNums = Object.keys(mByRound).map(Number).sort((a, b) => a - b);
            const totalRoundsLocal = rNums.length;

            // Layout Constants
            const MATCH_W = 52;       // mm width of each match box
            const MATCH_H = 16;       // mm height of each match box
            const COL_GAP = 14;       // mm gap between round columns
            const MARGIN = 12;        // mm page margin
            const HEADER_H = 22;      // mm header area
            const FIGHTER_ROW = 7;    // mm each fighter row height

            // Calculate required page size
            const round1Count = (mByRound[rNums[0]] || []).length;
            const baseGap = 4;
            const contentHeight = round1Count * MATCH_H + (round1Count - 1) * baseGap + HEADER_H + MARGIN * 2;
            const contentWidth = totalRoundsLocal * MATCH_W + (totalRoundsLocal - 1) * COL_GAP + MARGIN * 2;

            const pageW = Math.max(contentWidth + 10, 297);
            const pageH = Math.max(contentHeight + 10, 210);

            const pdf = new jsPDF({
                orientation: pageW > pageH ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [pageW, pageH],
            });

            // ── Background
            pdf.setFillColor(10, 10, 10);
            pdf.rect(0, 0, pageW, pageH, 'F');

            // ── Header
            pdf.setFontSize(14);
            pdf.setTextColor(255, 255, 255);
            pdf.text(viewingTournament.name, pageW / 2, MARGIN + 6, { align: 'center' });

            pdf.setFontSize(10);
            pdf.setTextColor(234, 179, 8); // yellow-500
            pdf.text(bracket.categoryName, pageW / 2, MARGIN + 12, { align: 'center' });

            pdf.setFontSize(7);
            pdf.setTextColor(120, 120, 120);
            pdf.text(
                `${bracket.totalParticipants} fighters · Single Elimination · ${new Date().toLocaleDateString()}`,
                pageW / 2, MARGIN + 17, { align: 'center' }
            );

            // Separator line
            pdf.setDrawColor(60, 60, 60);
            pdf.setLineWidth(0.3);
            pdf.line(MARGIN, MARGIN + HEADER_H, pageW - MARGIN, MARGIN + HEADER_H);

            const startY = MARGIN + HEADER_H + 4;

            // ── Draw brackets round by round
            // Store match center positions for connector lines
            const matchPositions: Record<string, { x: number; y: number; right: number }> = {};

            for (let ri = 0; ri < rNums.length; ri++) {
                const roundNum = rNums[ri];
                const matches = mByRound[roundNum];
                const colX = MARGIN + ri * (MATCH_W + COL_GAP);

                // Vertical spacing: each subsequent round doubles the spacing
                const matchCount = matches.length;
                // Calculate where matches should be positioned (centered relative to their feeders)
                const totalSlots = round1Count; // Total first-round visual slots
                const slotSpan = totalSlots / matchCount;
                const slotH = (pageH - startY - MARGIN) / totalSlots;

                // Round header
                const isLast = ri === totalRoundsLocal - 1;
                const isSecondLast = ri === totalRoundsLocal - 2;

                pdf.setFontSize(7);
                if (isLast) {
                    pdf.setTextColor(234, 179, 8);
                } else if (isSecondLast) {
                    pdf.setTextColor(96, 165, 250);
                } else {
                    pdf.setTextColor(160, 160, 160);
                }
                const roundLabel = isLast ? 'FINAL' : isSecondLast ? 'SEMI-FINALS' :
                    (matches[0]?.roundName || `Round ${roundNum}`).toUpperCase();
                pdf.text(roundLabel, colX + MATCH_W / 2, startY - 1, { align: 'center' });

                matches.forEach((match, mi) => {
                    // Center of the slot group this match covers
                    const slotStart = mi * slotSpan;
                    const centerSlot = slotStart + slotSpan / 2;
                    const matchY = startY + centerSlot * slotH - MATCH_H / 2;

                    // Store position for connectors
                    matchPositions[match.id] = {
                        x: colX,
                        y: matchY + MATCH_H / 2,
                        right: colX + MATCH_W,
                    };

                    // Match box background
                    const isBye = match.isBye;
                    const isCompleted = match.status === 'COMPLETED';
                    const isLive = match.status === 'LIVE';

                    if (isBye) {
                        pdf.setFillColor(20, 20, 20);
                        pdf.setDrawColor(40, 40, 40);
                    } else if (isCompleted) {
                        pdf.setFillColor(15, 25, 15);
                        pdf.setDrawColor(34, 120, 34);
                    } else if (isLive) {
                        pdf.setFillColor(30, 15, 15);
                        pdf.setDrawColor(200, 50, 50);
                    } else {
                        pdf.setFillColor(18, 18, 18);
                        pdf.setDrawColor(50, 50, 50);
                    }

                    pdf.setLineWidth(0.3);
                    pdf.roundedRect(colX, matchY, MATCH_W, MATCH_H, 1.5, 1.5, 'FD');

                    // Divider between fighters
                    pdf.setDrawColor(50, 50, 50);
                    pdf.setLineWidth(0.15);
                    pdf.line(colX + 1, matchY + FIGHTER_ROW + 1, colX + MATCH_W - 1, matchY + FIGHTER_ROW + 1);

                    // Fighter A
                    const isAWinner = match.winnerId && match.winnerId === match.fighterAId;
                    if (isAWinner) {
                        pdf.setFillColor(234, 179, 8, 0.15);
                        pdf.rect(colX + 0.2, matchY + 0.2, MATCH_W - 0.4, FIGHTER_ROW + 0.5, 'F');
                    }
                    pdf.setFontSize(7);
                    pdf.setTextColor(isAWinner ? 253 : (match.fighterAName ? 230 : 80),
                        isAWinner ? 224 : (match.fighterAName ? 230 : 80),
                        isAWinner ? 71 : (match.fighterAName ? 230 : 80));
                    const nameA = match.fighterAName || (isBye ? 'BYE' : 'TBD');
                    pdf.text(nameA.length > 22 ? nameA.substring(0, 21) + '…' : nameA,
                        colX + 2, matchY + 5);
                    if (match.fighterAScore !== null) {
                        pdf.setTextColor(255, 255, 255);
                        pdf.setFontSize(7);
                        pdf.text(String(match.fighterAScore), colX + MATCH_W - 3, matchY + 5, { align: 'right' });
                    }
                    // Winner trophy indicator
                    if (isAWinner) {
                        pdf.setFontSize(5);
                        pdf.setTextColor(234, 179, 8);
                        pdf.text('★', colX + MATCH_W - 2, matchY + 2.5, { align: 'right' });
                    }

                    // Fighter B
                    const isBWinner = match.winnerId && match.winnerId === match.fighterBId;
                    if (isBWinner) {
                        pdf.setFillColor(234, 179, 8, 0.15);
                        pdf.rect(colX + 0.2, matchY + FIGHTER_ROW + 1.2, MATCH_W - 0.4, FIGHTER_ROW - 0.2, 'F');
                    }
                    pdf.setFontSize(7);
                    pdf.setTextColor(isBWinner ? 253 : (match.fighterBName ? 230 : 80),
                        isBWinner ? 224 : (match.fighterBName ? 230 : 80),
                        isBWinner ? 71 : (match.fighterBName ? 230 : 80));
                    const nameB = match.fighterBName || (isBye ? 'BYE' : 'TBD');
                    pdf.text(nameB.length > 22 ? nameB.substring(0, 21) + '…' : nameB,
                        colX + 2, matchY + FIGHTER_ROW + 5.5);
                    if (match.fighterBScore !== null) {
                        pdf.setTextColor(255, 255, 255);
                        pdf.setFontSize(7);
                        pdf.text(String(match.fighterBScore), colX + MATCH_W - 3, matchY + FIGHTER_ROW + 5.5, { align: 'right' });
                    }
                    if (isBWinner) {
                        pdf.setFontSize(5);
                        pdf.setTextColor(234, 179, 8);
                        pdf.text('★', colX + MATCH_W - 2, matchY + FIGHTER_ROW + 3, { align: 'right' });
                    }

                    // Match info footer
                    if (!isBye && match.fighterAName && match.fighterBName) {
                        pdf.setFontSize(5);
                        pdf.setTextColor(isCompleted ? 80 : 60, isCompleted ? 140 : 60, isCompleted ? 80 : 60);
                        pdf.text(`Match #${match.matchNumber} · ${match.status}`, colX + 2, matchY + MATCH_H - 1);
                    }
                });

                // Draw connector lines from this round to the next
                if (ri < rNums.length - 1) {
                    const nextRoundNum = rNums[ri + 1];
                    const nextMatches = mByRound[nextRoundNum] || [];

                    pdf.setDrawColor(60, 60, 60);
                    pdf.setLineWidth(0.25);

                    for (let ni = 0; ni < nextMatches.length; ni++) {
                        const nextMatch = nextMatches[ni];
                        const nextPos = matchPositions[nextMatch.id];
                        if (!nextPos) continue;

                        // Two feeder matches
                        const feeder1 = matches[ni * 2];
                        const feeder2 = matches[ni * 2 + 1];

                        const midX = colX + MATCH_W + COL_GAP / 2;

                        if (feeder1 && matchPositions[feeder1.id]) {
                            const f1 = matchPositions[feeder1.id];
                            // Horizontal from feeder right to midpoint
                            pdf.line(f1.right, f1.y, midX, f1.y);
                            // Vertical from feeder1 to feeder2 center
                            if (feeder2 && matchPositions[feeder2.id]) {
                                const f2 = matchPositions[feeder2.id];
                                pdf.line(midX, f1.y, midX, f2.y);
                                // Horizontal from feeder2 right to midpoint
                                pdf.line(f2.right, f2.y, midX, f2.y);
                            }
                            // Horizontal from midpoint to next match
                            pdf.line(midX, nextPos.y, nextPos.x, nextPos.y);
                        }
                    }
                }
            }

            // ── Footer
            pdf.setFontSize(5);
            pdf.setTextColor(80, 80, 80);
            pdf.text('Kyokushin Karate Foundation of India · Generated on ' + new Date().toLocaleString(),
                pageW / 2, pageH - 4, { align: 'center' });

            const fileName = `${viewingTournament.name}_${bracket.categoryName}.pdf`
                .replace(/[^a-zA-Z0-9_\-\.]/g, '_');
            pdf.save(fileName);
            showToast("PDF downloaded!", "success");
        } catch (error) {
            console.error("PDF generation error:", error);
            showToast("Failed to generate PDF", "error");
        }
    };

    // ── Participant helpers ──────────────
    const getAge = (dob: string | null) => {
        if (!dob) return null;
        const d = new Date(dob);
        const now = new Date();
        let age = now.getFullYear() - d.getFullYear();
        if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
        return age;
    };

    const filteredParticipants = useMemo(() => {
        let list = [...participants];
        if (participantSearch) {
            const q = participantSearch.toLowerCase();
            list = list.filter((r: any) =>
                r.user.name.toLowerCase().includes(q) ||
                r.user.email?.toLowerCase().includes(q) ||
                r.user.membershipNumber?.toLowerCase().includes(q) ||
                r.user.dojo?.name?.toLowerCase().includes(q) ||
                r.user.city?.toLowerCase().includes(q) ||
                r.categoryAge?.toLowerCase().includes(q) ||
                r.categoryWeight?.toLowerCase().includes(q)
            );
        }
        if (approvalFilter !== "ALL") {
            list = list.filter((r: any) => r.approvalStatus === approvalFilter);
        }
        list.sort((a: any, b: any) => {
            let va: any, vb: any;
            switch (sortField) {
                case 'name': va = a.user.name; vb = b.user.name; break;
                case 'belt': va = a.user.currentBeltRank || ''; vb = b.user.currentBeltRank || ''; break;
                case 'weight': va = a.user.weight || 0; vb = b.user.weight || 0; break;
                case 'age': va = getAge(a.user.dateOfBirth) || 0; vb = getAge(b.user.dateOfBirth) || 0; break;
                case 'dojo': va = a.user.dojo?.name || ''; vb = b.user.dojo?.name || ''; break;
                case 'category': va = `${a.categoryAge || ''}${a.categoryWeight || ''}`; vb = `${b.categoryAge || ''}${b.categoryWeight || ''}`; break;
                case 'status': va = a.approvalStatus; vb = b.approvalStatus; break;
                default: va = a.user.name; vb = b.user.name;
            }
            if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortAsc ? va - vb : vb - va;
        });
        return list;
    }, [participants, participantSearch, approvalFilter, sortField, sortAsc]);

    const approvalCounts = useMemo(() => ({
        total: participants.length,
        approved: participants.filter((r: any) => r.approvalStatus === 'APPROVED').length,
        pending: participants.filter((r: any) => r.approvalStatus === 'PENDING').length,
        rejected: participants.filter((r: any) => r.approvalStatus === 'REJECTED').length,
    }), [participants]);

    const handleSort = (field: string) => {
        if (sortField === field) setSortAsc(!sortAsc);
        else { setSortField(field); setSortAsc(true); }
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return null;
        return sortAsc ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
    };

    const toggleSelection = (id: string) => {
        setSelectedRegistrations(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedRegistrations.size === filteredParticipants.length) {
            setSelectedRegistrations(new Set());
        } else {
            setSelectedRegistrations(new Set(filteredParticipants.map((r: any) => r.id)));
        }
    };

    const handleApproveRegistration = async (registrationId: string) => {
        setApprovingId(registrationId);
        try {
            await api.post(`/events/registrations/${registrationId}/approve`);
            showToast("Registration approved!", "success");
            if (viewingTournament) {
                const res = await api.get(`/events/${viewingTournament.id}/registrations`);
                setParticipants(res.data.data.registrations || []);
            }
        } catch { showToast("Failed to approve registration", "error"); }
        finally { setApprovingId(null); }
    };

    const handleRejectRegistration = async (registrationId: string) => {
        if (!confirm("Reject this registration?")) return;
        try {
            await api.post(`/events/registrations/${registrationId}/reject`);
            showToast("Registration rejected", "success");
            if (viewingTournament) {
                const res = await api.get(`/events/${viewingTournament.id}/registrations`);
                setParticipants(res.data.data.registrations || []);
            }
        } catch { showToast("Failed to reject registration", "error"); }
    };

    const handleBulkApprove = async () => {
        if (selectedRegistrations.size === 0) return;
        if (!confirm(`Approve ${selectedRegistrations.size} registration(s)?`)) return;
        try {
            await api.post("/events/registrations/bulk-approve", { registrationIds: Array.from(selectedRegistrations) });
            showToast(`${selectedRegistrations.size} registrations approved!`, "success");
            setSelectedRegistrations(new Set());
            if (viewingTournament) {
                const res = await api.get(`/events/${viewingTournament.id}/registrations`);
                setParticipants(res.data.data.registrations || []);
            }
        } catch { showToast("Failed to bulk approve", "error"); }
    };

    const handleExportCSV = () => {
        const rows = filteredParticipants.map((r: any) => ({
            Name: r.user.name, Email: r.user.email || '', Phone: r.user.phone || '',
            Age: getAge(r.user.dateOfBirth) || '', 'Weight (kg)': r.user.weight || '',
            Belt: r.user.currentBeltRank || '', 'Membership #': r.user.membershipNumber || '',
            Dojo: r.user.dojo?.name || '', City: r.user.city || '',
            'Category Age': r.categoryAge || '', 'Category Weight': r.categoryWeight || '',
            'Approval Status': r.approvalStatus, 'Payment Status': r.paymentStatus,
        }));
        const headers = Object.keys(rows[0] || {});
        const csv = [headers.join(','), ...rows.map(row => headers.map(h => `"${(row as any)[h]}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${viewingTournament?.name || 'tournament'}_registrations.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Bracket helpers ──────────────
    const selectedBracket = brackets.find(b => b.id === selectedBracketId) || null;

    const matchesByRound = useMemo(() => {
        if (!selectedBracket) return {};
        const rounds: { [key: number]: MatchData[] } = {};
        selectedBracket.matches.forEach(match => {
            if (!rounds[match.roundNumber]) rounds[match.roundNumber] = [];
            rounds[match.roundNumber].push(match);
        });
        Object.values(rounds).forEach(arr => arr.sort((a, b) => a.matchNumber - b.matchNumber));
        return rounds;
    }, [selectedBracket]);

    const roundNumbers = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
    const totalRounds = roundNumbers.length;

    const getBeltColor = (rank: string | null) => {
        if (!rank) return "bg-white/10 text-gray-300";
        if (rank.includes("Black")) return "bg-gray-800 text-white border border-gray-600";
        if (rank.includes("Brown")) return "bg-amber-900/50 text-amber-300";
        if (rank.includes("Green")) return "bg-green-900/50 text-green-300";
        if (rank.includes("Blue")) return "bg-blue-900/50 text-blue-300";
        if (rank.includes("Yellow")) return "bg-yellow-900/50 text-yellow-300";
        if (rank.includes("Orange")) return "bg-orange-900/50 text-orange-300";
        return "bg-white/10 text-gray-300";
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "UPCOMING": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "ONGOING": return "bg-green-500/20 text-green-400 border-green-500/30";
            case "COMPLETED": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
            case "CANCELLED": return "bg-red-500/20 text-red-400 border-red-500/30";
            default: return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        }
    };

    const filteredTournaments = tournaments.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // ── Render ──────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Tournament Management
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Create and manage karate tournaments</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create Tournament
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input placeholder="Search tournaments..." className="pl-10 bg-white/5 border-white/10"
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
                    <option value="ALL">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-gray-400">Total Tournaments</p>
                    <p className="text-2xl font-bold text-white mt-1">{tournaments.length}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-sm text-blue-400">Upcoming</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{tournaments.filter(t => t.status === 'UPCOMING').length}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <p className="text-sm text-green-400">Ongoing</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{tournaments.filter(t => t.status === 'ONGOING').length}</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <p className="text-sm text-yellow-400">Completed</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">{tournaments.filter(t => t.status === 'COMPLETED').length}</p>
                </div>
            </div>

            {/* Tournament List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto" />
                </div>
            ) : filteredTournaments.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No tournaments found</p>
                    <Button onClick={() => setShowCreateModal(true)}
                        className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white">
                        Create Your First Tournament
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTournaments.map((tournament, index) => (
                        <motion.div key={tournament.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all group">
                            {tournament.imageUrl ? (
                                <div className="h-40 w-full bg-gradient-to-br from-yellow-900/20 to-red-900/20 flex items-center justify-center overflow-hidden">
                                    <img src={getImageUrl(tournament.imageUrl)!} alt={tournament.name} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="h-40 w-full bg-gradient-to-br from-yellow-900/20 to-red-900/20 flex items-center justify-center">
                                    <Trophy className="w-16 h-16 text-yellow-500/50" />
                                </div>
                            )}
                            <div className="p-5">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-3 ${getStatusColor(tournament.status)}`}>
                                    {tournament.status}
                                </span>
                                <h3 className="text-lg font-bold text-white mb-2">{tournament.name}</h3>
                                <div className="space-y-2 text-sm mb-4">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                                    </div>
                                    {tournament.location && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <MapPin className="w-4 h-4" />
                                            <span>{tournament.location}</span>
                                        </div>
                                    )}
                                    {tournament._count && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Users className="w-4 h-4" />
                                            <span>{tournament._count.registrations} participants</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button onClick={() => handleViewDetails(tournament)}
                                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" size="sm">
                                        <Eye className="w-4 h-4 mr-2" /> View Details
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button onClick={() => openEditModal(tournament)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                                        </Button>
                                        <Button onClick={() => handleDelete(tournament.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/* CREATE / EDIT MODAL                         */}
            {/* ════════════════════════════════════════════ */}
            <AnimatePresence>
                {(showCreateModal || editingTournament) && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-black/95 border border-white/10 rounded-2xl w-full max-w-2xl my-8">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">
                                    {editingTournament ? "Edit Tournament" : "Create Tournament"}
                                </h3>
                                <button onClick={() => { setShowCreateModal(false); setEditingTournament(null); resetForm(); }}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                            <form onSubmit={editingTournament ? handleUpdate : handleCreate} className="p-6 space-y-4">
                                <div>
                                    <Label className="text-white">Tournament Name *</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g., KKFI National Championship 2026" />
                                </div>
                                <div>
                                    <Label className="text-white">Description</Label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white mt-1 min-h-[80px]" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><Label className="text-white">Start Date *</Label>
                                        <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required className="bg-white/5 border-white/10 text-white mt-1" /></div>
                                    <div><Label className="text-white">End Date *</Label>
                                        <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            required className="bg-white/5 border-white/10 text-white mt-1" /></div>
                                </div>
                                <div><Label className="text-white">Location *</Label>
                                    <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        required className="bg-white/5 border-white/10 text-white mt-1" placeholder="City, State" /></div>
                                <div><Label className="text-white">Registration Deadline *</Label>
                                    <Input type="date" value={formData.registrationDeadline} onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                        required className="bg-white/5 border-white/10 text-white mt-1" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><Label className="text-white">Max Participants</Label>
                                        <Input type="number" value={formData.maxParticipants} onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white mt-1" placeholder="Optional" /></div>
                                    <div><Label className="text-white">Member Fee *</Label>
                                        <Input type="number" step="0.01" value={formData.memberFee} onChange={(e) => setFormData({ ...formData, memberFee: e.target.value })}
                                            required className="bg-white/5 border-white/10 text-white mt-1" placeholder="0.00" /></div>
                                    <div><Label className="text-white">Non-Member Fee *</Label>
                                        <Input type="number" step="0.01" value={formData.nonMemberFee} onChange={(e) => setFormData({ ...formData, nonMemberFee: e.target.value })}
                                            required className="bg-white/5 border-white/10 text-white mt-1" placeholder="0.00" /></div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-white">Categories</Label>
                                        <Button type="button" onClick={addCategory} className="bg-white/10 hover:bg-white/20 text-white text-xs" size="sm">
                                            <Plus className="w-3 h-3 mr-1" /> Add
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.categories.map((category, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input value={category} onChange={(e) => updateCategory(index, e.target.value)}
                                                    className="bg-white/5 border-white/10 text-white" placeholder="e.g., Men's -70kg" />
                                                <Button type="button" onClick={() => removeCategory(index)} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" onClick={() => { setShowCreateModal(false); setEditingTournament(null); resetForm(); }}
                                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white">Cancel</Button>
                                    <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                        {editingTournament ? "Update Tournament" : "Create Tournament"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ════════════════════════════════════════════ */}
            {/* TOURNAMENT DETAIL VIEW — FULLSCREEN         */}
            {/* ════════════════════════════════════════════ */}
            <AnimatePresence>
                {viewingTournament && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                            className="min-h-screen">
                            {/* Sticky Header */}
                            <div className="sticky top-0 z-10 bg-black/95 border-b border-white/10 backdrop-blur-xl">
                                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0">
                                            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{viewingTournament.name}</h2>
                                            <p className="text-gray-400 text-sm mt-0.5">
                                                {new Date(viewingTournament.startDate).toLocaleDateString()} &bull; {viewingTournament.location}
                                            </p>
                                        </div>
                                        <button onClick={() => { setViewingTournament(null); setParticipants([]); setBrackets([]); }}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 ml-4">
                                            <X className="w-6 h-6 text-white" />
                                        </button>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex gap-1 mt-4">
                                        <button onClick={() => setDetailTab('participants')}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-sm transition-colors ${
                                                detailTab === 'participants'
                                                    ? 'bg-white/10 text-yellow-400 border-b-2 border-yellow-500'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}>
                                            <Users className="w-4 h-4" />
                                            Participants
                                            <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full">{approvalCounts.approved}</span>
                                        </button>
                                        <button onClick={() => setDetailTab('brackets')}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-sm transition-colors ${
                                                detailTab === 'brackets'
                                                    ? 'bg-white/10 text-yellow-400 border-b-2 border-yellow-500'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}>
                                            <Trophy className="w-4 h-4" />
                                            Brackets
                                            {brackets.length > 0 && (
                                                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">{brackets.length}</span>
                                            )}
                                        </button>
                                        <button onClick={() => setDetailTab('categories')}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-sm transition-colors ${
                                                detailTab === 'categories'
                                                    ? 'bg-white/10 text-yellow-400 border-b-2 border-yellow-500'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}>
                                            <Layers className="w-4 h-4" />
                                            Categories
                                        </button>
                                        <button onClick={() => setDetailTab('certificates')}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-sm transition-colors ${
                                                detailTab === 'certificates'
                                                    ? 'bg-white/10 text-yellow-400 border-b-2 border-yellow-500'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}>
                                            <FileCheck className="w-4 h-4" />
                                            Certificates
                                            {tournamentResults.filter((r: any) => r.finalRank <= 3).length > 0 && (
                                                <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                                                    {tournamentResults.filter((r: any) => r.finalRank <= 3).length}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
                                {/* ═══ PARTICIPANTS TAB ═══ */}
                                {detailTab === 'participants' && (
                                    <div className="space-y-4">
                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <button onClick={() => setApprovalFilter('ALL')}
                                                className={`rounded-xl p-3 text-center transition-all ${approvalFilter === 'ALL' ? 'bg-white/10 ring-2 ring-white/30' : 'bg-white/5 hover:bg-white/10'}`}>
                                                <div className="text-2xl font-bold text-white">{approvalCounts.total}</div>
                                                <div className="text-xs text-gray-400">Total</div>
                                            </button>
                                            <button onClick={() => setApprovalFilter('APPROVED')}
                                                className={`rounded-xl p-3 text-center transition-all ${approvalFilter === 'APPROVED' ? 'bg-green-500/20 ring-2 ring-green-500/50' : 'bg-white/5 hover:bg-white/10'}`}>
                                                <div className="text-2xl font-bold text-green-400">{approvalCounts.approved}</div>
                                                <div className="text-xs text-gray-400">Approved</div>
                                            </button>
                                            <button onClick={() => setApprovalFilter('PENDING')}
                                                className={`rounded-xl p-3 text-center transition-all ${approvalFilter === 'PENDING' ? 'bg-yellow-500/20 ring-2 ring-yellow-500/50' : 'bg-white/5 hover:bg-white/10'}`}>
                                                <div className="text-2xl font-bold text-yellow-400">{approvalCounts.pending}</div>
                                                <div className="text-xs text-gray-400">Pending</div>
                                            </button>
                                            <button onClick={() => setApprovalFilter('REJECTED')}
                                                className={`rounded-xl p-3 text-center transition-all ${approvalFilter === 'REJECTED' ? 'bg-red-500/20 ring-2 ring-red-500/50' : 'bg-white/5 hover:bg-white/10'}`}>
                                                <div className="text-2xl font-bold text-red-400">{approvalCounts.rejected}</div>
                                                <div className="text-xs text-gray-400">Rejected</div>
                                            </button>
                                        </div>

                                        {/* Actions Bar */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                            <div className="relative flex-1 w-full">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <Input placeholder="Search by name, email, membership#, dojo, city, category..."
                                                    className="pl-10 bg-white/5 border-white/10 text-sm w-full"
                                                    value={participantSearch} onChange={(e) => setParticipantSearch(e.target.value)} />
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                {selectedRegistrations.size > 0 && (
                                                    <Button size="sm" onClick={handleBulkApprove}
                                                        className="bg-green-600 hover:bg-green-700 text-white text-xs">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Approve ({selectedRegistrations.size})
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="outline" onClick={handleExportCSV}
                                                    disabled={filteredParticipants.length === 0}
                                                    className="border-white/20 text-gray-300 hover:bg-white/10 text-xs">
                                                    <Download className="w-3 h-3 mr-1" /> CSV
                                                </Button>
                                                <Button size="sm" onClick={handleGenerateBrackets}
                                                    disabled={approvalCounts.approved === 0 || generatingBrackets}
                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs">
                                                    {generatingBrackets ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Trophy className="w-3 h-3 mr-1" />}
                                                    Generate Brackets
                                                </Button>
                                            </div>
                                        </div>

                                        <p className="text-gray-500 text-xs">
                                            Showing {filteredParticipants.length} of {participants.length} participants
                                        </p>

                                        {/* Table */}
                                        {loadingParticipants ? (
                                            <div className="text-center py-12">
                                                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                                                <p className="text-gray-500 mt-3">Loading participants...</p>
                                            </div>
                                        ) : filteredParticipants.length === 0 ? (
                                            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                                                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                                <p className="text-gray-400">{participants.length === 0 ? 'No participants registered yet' : 'No matching participants'}</p>
                                            </div>
                                        ) : (
                                            <div className="border border-white/10 rounded-xl overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-white/5 border-b border-white/10">
                                                                <th className="p-3 text-left w-10">
                                                                    <input type="checkbox"
                                                                        checked={selectedRegistrations.size === filteredParticipants.length && filteredParticipants.length > 0}
                                                                        onChange={toggleSelectAll} className="rounded border-gray-600 bg-transparent" />
                                                                </th>
                                                                <th className="p-3 text-left text-gray-400 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                                                                    Name <SortIcon field="name" />
                                                                </th>
                                                                <th className="p-3 text-left text-gray-400 font-semibold cursor-pointer hover:text-white hidden md:table-cell" onClick={() => handleSort('age')}>
                                                                    Age <SortIcon field="age" />
                                                                </th>
                                                                <th className="p-3 text-left text-gray-400 font-semibold cursor-pointer hover:text-white hidden md:table-cell" onClick={() => handleSort('weight')}>
                                                                    Weight <SortIcon field="weight" />
                                                                </th>
                                                                <th className="p-3 text-left text-gray-400 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('belt')}>
                                                                    Belt <SortIcon field="belt" />
                                                                </th>
                                                                <th className="p-3 text-left text-gray-400 font-semibold cursor-pointer hover:text-white hidden lg:table-cell" onClick={() => handleSort('dojo')}>
                                                                    Dojo <SortIcon field="dojo" />
                                                                </th>
                                                                <th className="p-3 text-left text-gray-400 font-semibold cursor-pointer hover:text-white hidden lg:table-cell" onClick={() => handleSort('category')}>
                                                                    Category <SortIcon field="category" />
                                                                </th>
                                                                <th className="p-3 text-center text-gray-400 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                                                                    Status <SortIcon field="status" />
                                                                </th>
                                                                <th className="p-3 text-center text-gray-400 font-semibold">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {filteredParticipants.map((reg: any) => {
                                                                const age = getAge(reg.user.dateOfBirth);
                                                                return (
                                                                    <tr key={reg.id}
                                                                        className={`hover:bg-white/5 transition-colors ${selectedRegistrations.has(reg.id) ? 'bg-blue-500/10' : ''}`}>
                                                                        <td className="p-3">
                                                                            <input type="checkbox" checked={selectedRegistrations.has(reg.id)}
                                                                                onChange={() => toggleSelection(reg.id)} className="rounded border-gray-600 bg-transparent" />
                                                                        </td>
                                                                        <td className="p-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-600 to-red-600 flex items-center justify-center flex-shrink-0">
                                                                                    <span className="text-white text-xs font-bold">{reg.user.name.charAt(0)}</span>
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <div className="text-white font-semibold text-sm truncate">{reg.user.name}</div>
                                                                                    <div className="text-[11px] text-gray-500 truncate">
                                                                                        {reg.user.membershipNumber || reg.user.email}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3 text-gray-300 hidden md:table-cell">{age ? `${age} yrs` : '—'}</td>
                                                                        <td className="p-3 text-gray-300 hidden md:table-cell">{reg.user.weight ? `${reg.user.weight} kg` : '—'}</td>
                                                                        <td className="p-3">
                                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBeltColor(reg.user.currentBeltRank)}`}>
                                                                                {reg.user.currentBeltRank || 'White'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-3 text-gray-400 text-xs hidden lg:table-cell">
                                                                            <div className="truncate max-w-[120px]">{reg.user.dojo?.name || '—'}</div>
                                                                            <div className="text-[10px] text-gray-500">{reg.user.city || ''}</div>
                                                                        </td>
                                                                        <td className="p-3 text-gray-400 text-xs hidden lg:table-cell">
                                                                            <div>{reg.categoryAge || '—'}</div>
                                                                            <div className="text-[10px] text-gray-500">{reg.categoryWeight || ''}</div>
                                                                        </td>
                                                                        <td className="p-3 text-center">
                                                                            <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${
                                                                                reg.approvalStatus === 'APPROVED' ? 'bg-green-500/20 text-green-400'
                                                                                : reg.approvalStatus === 'REJECTED' ? 'bg-red-500/20 text-red-400'
                                                                                : 'bg-yellow-500/20 text-yellow-400'
                                                                            }`}>
                                                                                {reg.approvalStatus}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-3">
                                                                            <div className="flex items-center justify-center gap-1">
                                                                                {reg.approvalStatus === 'PENDING' && (
                                                                                    <>
                                                                                        <button onClick={() => handleApproveRegistration(reg.id)} disabled={approvingId === reg.id}
                                                                                            className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors" title="Approve">
                                                                                            <CheckCircle className="w-4 h-4" />
                                                                                        </button>
                                                                                        <button onClick={() => handleRejectRegistration(reg.id)}
                                                                                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors" title="Reject">
                                                                                            <XCircle className="w-4 h-4" />
                                                                                        </button>
                                                                                    </>
                                                                                )}
                                                                                {reg.approvalStatus === 'APPROVED' && (
                                                                                    <span className="text-green-500"><UserCheck className="w-4 h-4" /></span>
                                                                                )}
                                                                                {reg.approvalStatus === 'REJECTED' && (
                                                                                    <button onClick={() => handleApproveRegistration(reg.id)}
                                                                                        className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors" title="Re-approve">
                                                                                        <CheckCircle className="w-4 h-4" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ═══ BRACKETS TAB ═══ */}
                                {detailTab === 'brackets' && (
                                    <div className="space-y-4">
                                        {loadingBrackets ? (
                                            <div className="text-center py-12">
                                                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                                                <p className="text-gray-500 mt-3">Loading brackets...</p>
                                            </div>
                                        ) : brackets.length === 0 ? (
                                            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
                                                <Trophy className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                                                <h3 className="text-xl font-bold text-white mb-2">No Brackets Generated Yet</h3>
                                                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                                    Generate brackets to create single-elimination tournament draws for all approved participants.
                                                </p>
                                                <Button onClick={handleGenerateBrackets}
                                                    disabled={approvalCounts.approved === 0 || generatingBrackets}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-base">
                                                    {generatingBrackets ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
                                                    Generate Brackets ({approvalCounts.approved} fighters)
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Category Selector + Actions */}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                    <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                                                        {brackets.map(bracket => (
                                                            <button key={bracket.id} onClick={() => setSelectedBracketId(bracket.id)}
                                                                className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                                                                    selectedBracketId === bracket.id
                                                                        ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/20'
                                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                                }`}>
                                                                {bracket.categoryName}
                                                                <span className="ml-1.5 text-xs opacity-70">({bracket.totalParticipants})</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        <Button size="sm" onClick={handleDownloadPDF}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                                                            <Download className="w-3 h-3 mr-1" /> Download PDF
                                                        </Button>
                                                        <Button size="sm" onClick={handleGenerateBrackets} disabled={generatingBrackets}
                                                            className="bg-white/10 hover:bg-white/20 text-white text-xs">
                                                            <RefreshCw className={`w-3 h-3 mr-1 ${generatingBrackets ? 'animate-spin' : ''}`} /> Regenerate
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Selected Bracket Info */}
                                                {selectedBracket && (
                                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h3 className="text-lg font-bold text-white">{selectedBracket.categoryName}</h3>
                                                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                                                selectedBracket.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                                                selectedBracket.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                                                                selectedBracket.status === 'LOCKED' ? 'bg-purple-500/20 text-purple-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                            }`}>{selectedBracket.status}</span>
                                                        </div>
                                                        <p className="text-gray-400 text-sm">
                                                            {selectedBracket.totalParticipants} fighters &bull; {totalRounds} round{totalRounds !== 1 ? 's' : ''} &bull; {selectedBracket.matches.length} match{selectedBracket.matches.length !== 1 ? 'es' : ''}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Bracket Tree */}
                                                {selectedBracket && (
                                                    <div ref={bracketRef} className="bg-black/60 border border-white/10 rounded-xl p-6 overflow-x-auto">
                                                        {/* Title for PDF */}
                                                        <div className="text-center mb-4 pb-3 border-b border-white/10">
                                                            <h3 className="text-lg font-bold text-white">{viewingTournament.name}</h3>
                                                            <p className="text-yellow-400 text-sm font-medium">{selectedBracket.categoryName}</p>
                                                            <p className="text-gray-500 text-xs">{selectedBracket.totalParticipants} fighters &bull; Single Elimination</p>
                                                        </div>

                                                        <div className="flex gap-6 min-w-max pb-2">
                                                            {roundNumbers.map((roundNum, roundIndex) => {
                                                                const matches = matchesByRound[roundNum] || [];
                                                                const isLast = roundIndex === totalRounds - 1;
                                                                const isSecondLast = roundIndex === totalRounds - 2;
                                                                const gapMultiplier = Math.pow(2, roundIndex);

                                                                return (
                                                                    <div key={roundNum} className="flex flex-col min-w-[260px]"
                                                                        style={{ gap: `${gapMultiplier * 8}px` }}>
                                                                        {/* Round Header */}
                                                                        <div className="text-center mb-2">
                                                                            <div className={`inline-block px-4 py-1.5 rounded-lg text-sm font-bold ${
                                                                                isLast ? 'bg-yellow-600/30 text-yellow-400' :
                                                                                isSecondLast ? 'bg-blue-500/20 text-blue-400' :
                                                                                'bg-white/10 text-gray-300'
                                                                            }`}>
                                                                                {isLast ? '🏆 Final' : isSecondLast ? 'Semi-Finals' :
                                                                                    matches[0]?.roundName || `Round ${roundNum}`}
                                                                            </div>
                                                                        </div>

                                                                        {/* Matches */}
                                                                        {matches.map((match) => (
                                                                            <div key={match.id}
                                                                                className={`border rounded-lg overflow-hidden shadow-lg ${
                                                                                    match.status === 'COMPLETED' ? 'border-green-500/30 bg-black/40' :
                                                                                    match.status === 'LIVE' ? 'border-red-500 bg-red-500/5 ring-1 ring-red-500/20' :
                                                                                    match.isBye ? 'border-white/5 bg-black/20 opacity-60' :
                                                                                    'border-white/10 bg-black/40'
                                                                                }`}>
                                                                                {/* Fighter A */}
                                                                                <div className={`px-3 py-2.5 flex items-center gap-2 ${
                                                                                    match.winnerId && match.winnerId === match.fighterAId ? 'bg-yellow-500/10' : ''
                                                                                }`}>
                                                                                    {match.winnerId === match.fighterAId && match.fighterAId && (
                                                                                        <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                                                                                    )}
                                                                                    <div className="flex-1 min-w-0">
                                                                                        {match.fighterAName ? (
                                                                                            <span className={`text-sm font-medium truncate block ${
                                                                                                match.winnerId === match.fighterAId ? 'text-yellow-300' : 'text-white'
                                                                                            }`}>{match.fighterAName}</span>
                                                                                        ) : (
                                                                                            <span className="text-gray-600 text-sm italic">BYE</span>
                                                                                        )}
                                                                                    </div>
                                                                                    {match.fighterAScore !== null && (
                                                                                        <span className="text-white font-bold text-sm">{match.fighterAScore}</span>
                                                                                    )}
                                                                                </div>

                                                                                <div className="h-px bg-white/10" />

                                                                                {/* Fighter B */}
                                                                                <div className={`px-3 py-2.5 flex items-center gap-2 ${
                                                                                    match.winnerId && match.winnerId === match.fighterBId ? 'bg-yellow-500/10' : ''
                                                                                }`}>
                                                                                    {match.winnerId === match.fighterBId && match.fighterBId && (
                                                                                        <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                                                                                    )}
                                                                                    <div className="flex-1 min-w-0">
                                                                                        {match.fighterBName ? (
                                                                                            <span className={`text-sm font-medium truncate block ${
                                                                                                match.winnerId === match.fighterBId ? 'text-yellow-300' : 'text-white'
                                                                                            }`}>{match.fighterBName}</span>
                                                                                        ) : (
                                                                                            <span className="text-gray-600 text-sm italic">BYE</span>
                                                                                        )}
                                                                                    </div>
                                                                                    {match.fighterBScore !== null && (
                                                                                        <span className="text-white font-bold text-sm">{match.fighterBScore}</span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Match info */}
                                                                                {!match.isBye && match.fighterAName && match.fighterBName && (
                                                                                    <div className={`px-3 py-1 text-[10px] border-t border-white/5 ${
                                                                                        match.status === 'COMPLETED' ? 'text-green-500' :
                                                                                        match.status === 'LIVE' ? 'text-red-400' : 'text-gray-600'
                                                                                    }`}>
                                                                                        Match #{match.matchNumber} &bull; {match.status}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* All brackets summary */}
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                    <h4 className="text-sm font-bold text-gray-300 mb-3">All Categories Overview</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {brackets.map(b => {
                                                            const completedMatches = b.matches.filter(m => m.status === 'COMPLETED' && !m.isBye).length;
                                                            const totalMatches = b.matches.filter(m => !m.isBye).length;
                                                            const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

                                                            return (
                                                                <button key={b.id} onClick={() => setSelectedBracketId(b.id)}
                                                                    className={`text-left p-3 rounded-lg transition-all ${
                                                                        selectedBracketId === b.id
                                                                            ? 'bg-yellow-600/20 border border-yellow-600/30'
                                                                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                                                                    }`}>
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-white text-sm font-medium truncate">{b.categoryName}</span>
                                                                        <span className="text-gray-500 text-xs ml-2">{b.totalParticipants} fighters</span>
                                                                    </div>
                                                                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
                                                                        <div className={`h-1.5 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                                            style={{ width: `${progress}%` }} />
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-500">
                                                                        {completedMatches}/{totalMatches} matches &bull; {progress}%
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* ═══ CATEGORIES TAB ═══ */}
                                {detailTab === 'categories' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <Layers className="w-5 h-5 text-yellow-500" />
                                                Category Management
                                            </h3>
                                            <Button size="sm" onClick={() => viewingTournament && fetchCategories(viewingTournament.id)}
                                                className="bg-white/10 hover:bg-white/20 text-white text-xs">
                                                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                                            </Button>
                                        </div>
                                        <p className="text-gray-500 text-sm">
                                            View participants by category and move them between categories. Only approved participants are shown.
                                        </p>

                                        {loadingCategories ? (
                                            <div className="text-center py-12">
                                                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                                                <p className="text-gray-500 mt-3">Loading categories...</p>
                                            </div>
                                        ) : categoryData.length === 0 ? (
                                            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                                                <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                                <p className="text-gray-400">No approved participants in categories yet</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {categoryData.map((cat: any, catIndex: number) => (
                                                    <div key={catIndex} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                                        <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Target className="w-4 h-4 text-yellow-500" />
                                                                <span className="font-bold text-white text-sm">{cat.categoryName}</span>
                                                                <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                                                                    {cat.participants.length} fighter{cat.participants.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="divide-y divide-white/5">
                                                            {cat.participants.map((p: any) => (
                                                                <div key={p.registrationId} className="px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-600 to-red-600 flex items-center justify-center flex-shrink-0">
                                                                            <span className="text-white text-[10px] font-bold">{p.name.charAt(0)}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-white text-sm font-medium">{p.name}</span>
                                                                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                                                <span className={`px-1.5 py-0.5 rounded-full ${getBeltColor(p.belt)}`}>
                                                                                    {p.belt || 'White'}
                                                                                </span>
                                                                                {p.weight && <span>{p.weight}kg</span>}
                                                                                {p.dojo && <span>{p.dojo}</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            setMovingParticipant({
                                                                                registrationId: p.registrationId,
                                                                                participantName: p.name,
                                                                                currentAge: cat.categoryAge,
                                                                                currentWeight: cat.categoryWeight,
                                                                                currentBelt: cat.categoryBelt,
                                                                            });
                                                                            setMoveTarget({
                                                                                categoryAge: cat.categoryAge,
                                                                                categoryWeight: cat.categoryWeight,
                                                                                categoryBelt: cat.categoryBelt,
                                                                            });
                                                                        }}
                                                                        className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors text-xs flex items-center gap-1"
                                                                        title="Move to different category"
                                                                    >
                                                                        <ArrowRightLeft className="w-3.5 h-3.5" />
                                                                        <span className="hidden sm:inline">Move</span>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ═══ CERTIFICATES TAB ═══ */}
                                {detailTab === 'certificates' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <Award className="w-5 h-5 text-yellow-500" />
                                                Tournament Certificates
                                            </h3>
                                            {tournamentResults.filter((r: any) => r.finalRank <= 3).length > 0 && (
                                                <Button size="sm" onClick={handleDownloadAllCertificates}
                                                    className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs">
                                                    <Download className="w-3 h-3 mr-1" /> Download All ({tournamentResults.filter((r: any) => r.finalRank <= 3).length})
                                                </Button>
                                            )}
                                        </div>

                                        {loadingResults ? (
                                            <div className="text-center py-12">
                                                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                                                <p className="text-gray-500 mt-3">Loading results...</p>
                                            </div>
                                        ) : tournamentResults.length === 0 ? (
                                            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                                                <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                                <h3 className="text-xl font-bold text-white mb-2">No Results Yet</h3>
                                                <p className="text-gray-400 max-w-md mx-auto">
                                                    Tournament results will appear here after brackets are completed and results are calculated.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {/* Group by category */}
                                                {Object.entries(
                                                    tournamentResults.reduce((acc: any, r: any) => {
                                                        if (!acc[r.categoryName]) acc[r.categoryName] = [];
                                                        acc[r.categoryName].push(r);
                                                        return acc;
                                                    }, {} as Record<string, any[]>)
                                                ).map(([categoryName, results]: [string, any]) => (
                                                    <div key={categoryName} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                                        <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                                                            <span className="font-bold text-white text-sm">{categoryName}</span>
                                                        </div>
                                                        <div className="divide-y divide-white/5">
                                                            {(results as any[])
                                                                .sort((a: any, b: any) => a.finalRank - b.finalRank)
                                                                .map((result: any) => {
                                                                    const medalColor = result.medal === 'GOLD' ? 'text-yellow-400 bg-yellow-500/20' :
                                                                        result.medal === 'SILVER' ? 'text-gray-300 bg-gray-500/20' :
                                                                        result.medal === 'BRONZE' ? 'text-orange-400 bg-orange-500/20' : 'text-gray-500 bg-white/5';
                                                                    return (
                                                                        <div key={result.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                                            <div className="flex items-center gap-3">
                                                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${medalColor}`}>
                                                                                    {result.finalRank <= 3 ? (
                                                                                        <Medal className="w-4 h-4" />
                                                                                    ) : (
                                                                                        `#${result.finalRank}`
                                                                                    )}
                                                                                </span>
                                                                                <div>
                                                                                    <p className="text-white text-sm font-medium">{result.user?.name || 'Unknown'}</p>
                                                                                    <p className="text-gray-500 text-[10px]">
                                                                                        {result.medal || `Rank #${result.finalRank}`}
                                                                                        {result.user?.dojo?.name && ` • ${result.user.dojo.name}`}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            {result.finalRank <= 3 && (
                                                                                <Button size="sm" onClick={() => handleDownloadCertificate(result)}
                                                                                    className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs">
                                                                                    <Download className="w-3 h-3 mr-1" /> Certificate
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Move Participant Modal ── */}
            <AnimatePresence>
                {movingParticipant && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-black/95 border border-white/10 rounded-2xl w-full max-w-md">
                            <div className="p-5 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                                        Move Participant
                                    </h3>
                                    <p className="text-gray-400 text-sm mt-0.5">{movingParticipant.participantName}</p>
                                </div>
                                <button onClick={() => setMovingParticipant(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Current Category</p>
                                    <p className="text-white text-sm">
                                        {[movingParticipant.currentAge, movingParticipant.currentWeight, movingParticipant.currentBelt].filter(Boolean).join(', ') || 'Uncategorized'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-white text-sm">New Age Category</Label>
                                    <Input value={moveTarget.categoryAge} onChange={(e) => setMoveTarget({ ...moveTarget, categoryAge: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g., 18-35" />
                                </div>
                                <div>
                                    <Label className="text-white text-sm">New Weight Category</Label>
                                    <Input value={moveTarget.categoryWeight} onChange={(e) => setMoveTarget({ ...moveTarget, categoryWeight: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g., 60-70kg" />
                                </div>
                                <div>
                                    <Label className="text-white text-sm">New Belt Category</Label>
                                    <Input value={moveTarget.categoryBelt} onChange={(e) => setMoveTarget({ ...moveTarget, categoryBelt: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g., Brown Belt" />
                                </div>
                                {/* Quick select from existing categories */}
                                {categoryData.length > 1 && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2">Or pick an existing category:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {categoryData.map((cat: any, i: number) => (
                                                <button key={i}
                                                    onClick={() => setMoveTarget({
                                                        categoryAge: cat.categoryAge,
                                                        categoryWeight: cat.categoryWeight,
                                                        categoryBelt: cat.categoryBelt,
                                                    })}
                                                    className="px-2 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors">
                                                    {cat.categoryName}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button onClick={() => setMovingParticipant(null)}
                                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white">Cancel</Button>
                                    <Button onClick={handleMoveParticipant}
                                        className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <ArrowRightLeft className="w-4 h-4 mr-2" /> Move
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Bracket Generation Progress Overlay ── */}
            <AnimatePresence>
                {bracketProgress.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-yellow-600/20 via-zinc-900 to-zinc-900 border-b border-zinc-700/50 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${bracketProgress.done && !bracketProgress.error ? 'bg-green-500/20' : bracketProgress.error ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                                        {bracketProgress.done && !bracketProgress.error ? (
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        ) : bracketProgress.error ? (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                        ) : (
                                            <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">
                                            {bracketProgress.done && !bracketProgress.error
                                                ? 'Brackets Ready!'
                                                : bracketProgress.error
                                                    ? 'Generation Failed'
                                                    : 'Generating Brackets...'}
                                        </h3>
                                        <p className="text-zinc-400 text-xs mt-0.5">
                                            {bracketProgress.done && !bracketProgress.error
                                                ? `${bracketProgress.resultCount} brackets created in ${((Date.now() - bracketProgress.startTime) / 1000).toFixed(1)}s`
                                                : bracketProgress.error
                                                    ? bracketProgress.error
                                                    : `Elapsed: ${((Date.now() - bracketProgress.startTime) / 1000).toFixed(0)}s`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="px-6 pt-5">
                                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                                    <span>{bracketProgress.message}</span>
                                    <span className="font-mono">{bracketProgress.current}%</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${bracketProgress.error
                                            ? 'bg-red-500'
                                            : bracketProgress.done
                                                ? 'bg-green-500'
                                                : 'bg-gradient-to-r from-yellow-500 to-amber-400'}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${bracketProgress.current}%` }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>

                            {/* Current Category */}
                            {bracketProgress.categoryName && !bracketProgress.done && (
                                <div className="px-6 pt-4">
                                    <div className="bg-zinc-800/50 border border-zinc-700/30 rounded-lg p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                            <Target className="w-4 h-4 text-yellow-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{bracketProgress.categoryName}</p>
                                            {bracketProgress.detail && (
                                                <p className="text-zinc-500 text-xs truncate">{bracketProgress.detail}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Activity Log */}
                            <div className="px-6 pt-4 pb-2">
                                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Activity</p>
                                <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-zinc-700">
                                    {bracketProgress.logs.map((log, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs">
                                            <span className="text-zinc-600 font-mono w-10 flex-shrink-0 text-right">
                                                {(log.time / 1000).toFixed(1)}s
                                            </span>
                                            <span className={`${i === bracketProgress.logs.length - 1 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                                {log.categoryName ? (
                                                    <><span className="text-yellow-400/70">{log.categoryName}</span> — {log.detail || log.message}</>
                                                ) : log.message}
                                            </span>
                                        </div>
                                    ))}
                                    {!bracketProgress.done && (
                                        <div className="flex items-center gap-2 text-xs text-zinc-600">
                                            <span className="w-10 flex-shrink-0" />
                                            <div className="flex gap-1">
                                                <span className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Action */}
                            <div className="px-6 py-4 border-t border-zinc-800 mt-2">
                                {bracketProgress.done ? (
                                    <Button
                                        onClick={() => setBracketProgress(prev => ({ ...prev, show: false }))}
                                        className={`w-full ${bracketProgress.error
                                            ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                                            : 'bg-green-600 hover:bg-green-500 text-white'}`}
                                    >
                                        {bracketProgress.error ? 'Close' : 'View Brackets'}
                                    </Button>
                                ) : (
                                    <p className="text-center text-zinc-500 text-xs">
                                        Processing {approvalCounts.approved} fighters across multiple categories...
                                        <br />
                                        <span className="text-zinc-600">Estimated time: ~{Math.max(5, Math.ceil(approvalCounts.approved / 5))}s for {approvalCounts.approved} participants</span>
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
