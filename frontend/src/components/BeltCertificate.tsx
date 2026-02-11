'use client';

import { useCallback, useState } from 'react';
import { Download, Award } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface BeltCertificateProps {
    studentName: string;
    beltRank: string;
    promotionDate: string;
    promoterName: string;
    membershipNumber?: string;
    dojoName?: string;
    oldBelt?: string;
}

const BELT_HEX: Record<string, string> = {
    White: '#e5e5e5',
    Orange: '#f97316',
    Blue: '#3b82f6',
    Yellow: '#eab308',
    Green: '#22c55e',
    Brown: '#92400e',
    Black: '#111111',
};

export default function BeltCertificate({
    studentName,
    beltRank,
    promotionDate,
    promoterName,
    membershipNumber,
    dojoName,
    oldBelt,
}: BeltCertificateProps) {
    const [downloading, setDownloading] = useState(false);
    const beltColor = BELT_HEX[beltRank] || '#888';
    const verifyUrl = typeof window !== 'undefined' && membershipNumber
        ? `${window.location.origin}/verify/${membershipNumber}`
        : '';

    const formattedDate = new Date(promotionDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const downloadCertificate = useCallback(async () => {
        setDownloading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const W = 297;
            const H = 210;

            // ─── Background ───
            doc.setFillColor(15, 15, 15);
            doc.rect(0, 0, W, H, 'F');

            // ─── Border ───
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(1.5);
            doc.rect(8, 8, W - 16, H - 16);
            doc.setDrawColor(180, 30, 30);
            doc.setLineWidth(0.3);
            doc.rect(12, 12, W - 24, H - 24);

            // ─── Corner accents ───
            const corners = [[14, 14], [W - 14, 14], [14, H - 14], [W - 14, H - 14]];
            doc.setFillColor(220, 38, 38);
            corners.forEach(([cx, cy]) => doc.circle(cx, cy, 1.5, 'F'));

            // ─── Header ───
            doc.setTextColor(220, 38, 38);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('KYOKUSHIN KARATE FOUNDATION OF INDIA', W / 2, 30, { align: 'center' });

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(32);
            doc.setFont('helvetica', 'bold');
            doc.text('CERTIFICATE OF BELT PROMOTION', W / 2, 48, { align: 'center' });

            // ─── Decorative line ───
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.5);
            doc.line(W / 2 - 60, 54, W / 2 + 60, 54);

            // ─── Body text ───
            doc.setTextColor(200, 200, 200);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'normal');
            doc.text('This is to certify that', W / 2, 70, { align: 'center' });

            // ─── Student Name ───
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.text(studentName.toUpperCase(), W / 2, 85, { align: 'center' });

            // ─── Membership number ───
            if (membershipNumber) {
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Membership No: ${membershipNumber}`, W / 2, 93, { align: 'center' });
            }

            // ─── Promotion text ───
            doc.setTextColor(200, 200, 200);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'normal');
            doc.text('has been promoted to the rank of', W / 2, 105, { align: 'center' });

            // ─── Belt Rank (colored) ───
            const hex = beltColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            doc.setTextColor(r, g, b);
            doc.setFontSize(36);
            doc.setFont('helvetica', 'bold');
            doc.text(`${beltRank.toUpperCase()} BELT`, W / 2, 122, { align: 'center' });

            // ─── Belt color bar ───
            doc.setFillColor(r, g, b);
            doc.roundedRect(W / 2 - 40, 127, 80, 3, 1.5, 1.5, 'F');

            // ─── Details ───
            doc.setTextColor(170, 170, 170);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            if (dojoName) {
                doc.text(`Dojo: ${dojoName}`, W / 2, 140, { align: 'center' });
            }
            doc.text(`Date of Promotion: ${formattedDate}`, W / 2, 148, { align: 'center' });

            // ─── Signatures ───
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.3);
            doc.line(40, 175, 120, 175);
            doc.line(W - 120, 175, W - 40, 175);

            doc.setTextColor(150, 150, 150);
            doc.setFontSize(9);
            doc.text(promoterName, 80, 180, { align: 'center' });
            doc.text('Examiner / Instructor', 80, 185, { align: 'center' });

            doc.text('Shihan Vasant Kumar Singh', W - 80, 180, { align: 'center' });
            doc.text('Country Director, KKFI', W - 80, 185, { align: 'center' });

            // ─── QR Code (bottom right) ───
            if (verifyUrl) {
                // We'll add a small text note about verification
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(7);
                doc.text('Scan to verify', W - 28, H - 22, { align: 'center' });
                // QR code drawn as a placeholder box (actual QR in download)
                doc.setDrawColor(100, 100, 100);
                doc.rect(W - 40, H - 42, 24, 24);
                doc.setFontSize(5);
                doc.text('QR', W - 28, H - 28, { align: 'center' });
            }

            // ─── Footer ───
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(7);
            doc.text('Kyokushin Karate Foundation of India | kyokushin-karate-india.vercel.app', W / 2, H - 14, { align: 'center' });

            doc.save(`KKFI-Certificate-${beltRank}-${studentName.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error('Certificate download failed:', err);
        } finally {
            setDownloading(false);
        }
    }, [studentName, beltRank, promotionDate, promoterName, membershipNumber, dojoName, beltColor, verifyUrl, formattedDate]);

    return (
        <div className="space-y-4">
            {/* Preview Card */}
            <div className="relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-2xl border border-white/10 p-6 overflow-hidden">
                {/* Belt accent */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: beltColor }} />

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Award className="w-5 h-5 text-red-500" />
                            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Belt Certificate</span>
                        </div>
                        <h3 className="text-lg font-black text-white">{beltRank} Belt Promotion</h3>
                        {oldBelt && <p className="text-sm text-gray-400">From {oldBelt} Belt</p>}
                        <p className="text-sm text-gray-500 mt-1">{formattedDate} &middot; by {promoterName}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Mini QR */}
                        {membershipNumber && verifyUrl && (
                            <div className="bg-white p-1.5 rounded-lg hidden sm:block">
                                <QRCodeSVG value={verifyUrl} size={36} />
                            </div>
                        )}
                        <button
                            onClick={downloadCertificate}
                            disabled={downloading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-sm font-semibold transition-all disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            {downloading ? 'Generating...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
