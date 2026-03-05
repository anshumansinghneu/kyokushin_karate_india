import jsPDF from 'jspdf';

// Embedded logos (small JPEG, base64)
const KKFI_LOGO_B64 = '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';

const LOW_KICK_LOGO_B64 = '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';

export interface BeltCertificateData {
    studentName: string;
    instructorName: string;
    beltRank: string;
    dateOfApproval: string;
    district?: string;
    state?: string;
    city?: string;
    certificateId?: string;
}

const BELT_HEX: Record<string, string> = {
    'White': '#FFFFFF',
    'Orange': '#F97316',
    'Blue': '#3B82F6',
    'Yellow': '#EAB308',
    'Green': '#22C55E',
    'Brown': '#78350F',
    'Black 1st Dan': '#1a1a1a',
    'Black 2nd Dan': '#1a1a1a',
    'Black 3rd Dan': '#1a1a1a',
    'Black 4th Dan': '#1a1a1a',
};

function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

/** Generate a deterministic certificate ID from data */
export function generateCertificateId(data: { studentName: string; beltRank: string; dateOfApproval: string }): string {
    const dateStr = new Date(data.dateOfApproval).toISOString().slice(0, 10).replace(/-/g, '');
    const nameHash = data.studentName.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    const beltCode = data.beltRank.slice(0, 3).toUpperCase();
    const seq = String(nameHash % 10000).padStart(4, '0');
    return 'KKFI-' + beltCode + '-' + dateStr + '-' + seq;
}

/** Draw Kanku watermark (Kyokushin symbol) */
function drawKanku(pdf: jsPDF, cx: number, cy: number, size: number) {
    const r = size;
    pdf.setDrawColor(200, 180, 180);
    pdf.setLineWidth(0.4);
    pdf.circle(cx, cy, r);
    pdf.circle(cx, cy, r * 0.55);
    pdf.circle(cx, cy, r * 0.2);
    pdf.setLineWidth(0.3);
    pdf.line(cx - r * 0.7, cy, cx + r * 0.7, cy);
    pdf.line(cx, cy - r * 0.7, cx, cy + r * 0.7);
}

export const generateBeltCertificate = (data: BeltCertificateData): jsPDF => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();

    const certId = data.certificateId || generateCertificateId(data);

    // Colors
    const NAVY: [number, number, number] = [25, 40, 85];
    const RED: [number, number, number] = [200, 35, 35];
    const GOLD: [number, number, number] = [180, 140, 20];
    const LIGHT_NAVY: [number, number, number] = [50, 65, 120];
    const GREY: [number, number, number] = [120, 120, 120];

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');

    // Decorative outer border (triple line)
    pdf.setDrawColor(...NAVY);
    pdf.setLineWidth(2.5);
    pdf.rect(6, 6, W - 12, H - 12);
    pdf.setDrawColor(...RED);
    pdf.setLineWidth(1.2);
    pdf.rect(9, 9, W - 18, H - 18);
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.4);
    pdf.rect(11, 11, W - 22, H - 22);

    // Corner ornaments
    const cs = 12;
    const corners = [[13, 13], [W - 13 - cs, 13], [13, H - 13 - cs], [W - 13 - cs, H - 13 - cs]];
    pdf.setDrawColor(...RED);
    pdf.setLineWidth(0.8);
    for (const [cx, cy] of corners) {
        pdf.line(cx, cy, cx + cs, cy);
        pdf.line(cx, cy, cx, cy + cs);
        pdf.line(cx + cs, cy, cx + cs, cy + cs);
        pdf.line(cx, cy + cs, cx + cs, cy + cs);
        pdf.setLineWidth(0.3);
        pdf.line(cx, cy, cx + cs, cy + cs);
        pdf.line(cx + cs, cy, cx, cy + cs);
        pdf.setLineWidth(0.8);
    }

    // Kanku watermark (center, very light)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gstate = new (pdf as any).GState({ opacity: 0.07 });
    pdf.setGState(gstate);
    drawKanku(pdf, W / 2, H / 2 + 5, 55);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

    // KKFI Logo (top-left)
    try { pdf.addImage(KKFI_LOGO_B64, 'JPEG', 18, 14, 18, 18); } catch { /* silent */ }

    // Low Kick Logo (top-right)
    try { pdf.addImage(LOW_KICK_LOGO_B64, 'JPEG', W - 36, 15, 14, 12); } catch { /* silent */ }

    // Organization Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(...NAVY);
    pdf.text('KYOKUSHIN KARATE FEDERATION OF INDIA', W / 2, 24, { align: 'center' });

    // Affiliation line
    pdf.setFontSize(7);
    pdf.setTextColor(...RED);
    pdf.text('Aff. to - International Karate Organisation, World Kyokushinkai-Kan (Japan)', W / 2, 30, { align: 'center' });

    // Certifications line
    pdf.setFontSize(5.5);
    pdf.setTextColor(...GREY);
    pdf.text('ISO 9001 Certified  |  ISO 45001 Certified  |  FIT India  |  NITI Aayog Recognised', W / 2, 34.5, { align: 'center' });

    // Gold dividers
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.6);
    pdf.line(40, 37, W - 40, 37);
    pdf.setLineWidth(0.2);
    pdf.line(50, 38.5, W - 50, 38.5);

    // Certificate Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(30);
    pdf.setTextColor(...NAVY);
    pdf.text('CERTIFICATE', W / 2, 50, { align: 'center' });

    // Belt Promotion Subtitle
    pdf.setFontSize(13);
    pdf.setTextColor(...LIGHT_NAVY);
    pdf.text('OF BELT PROMOTION', W / 2, 57, { align: 'center' });

    // Certificate ID (top right)
    pdf.setFontSize(7);
    pdf.setTextColor(...GREY);
    pdf.text('Cert. No: ' + certId, W - 18, 42, { align: 'right' });

    // Body: "This is to certify that"
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(...NAVY);
    pdf.text('This is to certify that', W / 2, 68, { align: 'center' });

    // Student Name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(26);
    pdf.setTextColor(...NAVY);
    const dispName = data.studentName.toUpperCase();
    pdf.text(dispName, W / 2, 82, { align: 'center' });

    // Underline
    const nameW = pdf.getTextWidth(dispName);
    pdf.setDrawColor(...NAVY);
    pdf.setLineWidth(0.4);
    pdf.line(W / 2 - nameW / 2 - 5, 85, W / 2 + nameW / 2 + 5, 85);

    // Location line
    if (data.district || data.state || data.city) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(...LIGHT_NAVY);
        const locParts = [data.city, data.district, data.state].filter(Boolean);
        if (locParts.length > 0) {
            pdf.text('of ' + locParts.join(', '), W / 2, 91, { align: 'center' });
        }
    }

    // Exam description
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(...NAVY);
    const descY = (data.district || data.state || data.city) ? 98 : 93;
    pdf.text(
        'has appeared for Grading Test and has successfully completed the basic methods of',
        W / 2, descY, { align: 'center' }
    );
    pdf.text(
        'Kyokushin Karate - Kihons, Ido-kihon, Kata, Kumite and passed the test.',
        W / 2, descY + 5, { align: 'center' }
    );

    // Promoted to rank
    const rankY = descY + 15;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(...LIGHT_NAVY);
    pdf.text('and has been promoted to the rank of', W / 2, rankY, { align: 'center' });

    // Belt Rank (large, colored)
    const beltColor = hexToRgb(BELT_HEX[data.beltRank] || '#1a1a1a');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    if (data.beltRank === 'White' || data.beltRank === 'Yellow') {
        pdf.setTextColor(40, 40, 40);
    } else {
        pdf.setTextColor(...beltColor);
    }
    pdf.text(data.beltRank.toUpperCase(), W / 2, rankY + 11, { align: 'center' });

    // Belt color bar
    const barW = 50;
    const barH = 3.5;
    const barY = rankY + 14;
    if (data.beltRank === 'White') {
        pdf.setDrawColor(...GREY);
        pdf.setLineWidth(0.3);
        pdf.rect(W / 2 - barW / 2, barY, barW, barH);
    } else {
        pdf.setFillColor(...beltColor);
        pdf.rect(W / 2 - barW / 2, barY, barW, barH, 'F');
    }

    // Promise text
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...LIGHT_NAVY);
    pdf.text(
        'Hereafter he/she promises to continue to improve himself/herself Physically, mentally, and morally,',
        W / 2, barY + 9, { align: 'center' }
    );
    pdf.text(
        'through daily training of this Martial art. This certificate does not authorize the person to teach or grade Kyokushinkai-kan in India.',
        W / 2, barY + 13, { align: 'center' }
    );

    // Date of Approval
    const dateStr = new Date(data.dateOfApproval).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
    const sigY = H - 46;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(...NAVY);
    pdf.text('Awarded on: ' + dateStr, W / 2, sigY - 6, { align: 'center' });

    // Signature: Instructor (left)
    pdf.setDrawColor(...NAVY);
    pdf.setLineWidth(0.3);
    pdf.line(30, sigY + 8, 115, sigY + 8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...NAVY);
    pdf.text(data.instructorName, 72.5, sigY + 5, { align: 'center' });
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(...RED);
    pdf.text('INSTRUCTOR NAME / SIGNATURE', 72.5, sigY + 13, { align: 'center' });

    // Signature: Country Director (right)
    pdf.setDrawColor(...NAVY);
    pdf.line(W - 115, sigY + 8, W - 30, sigY + 8);
    pdf.setFont('helvetica', 'bolditalic');
    pdf.setFontSize(10);
    pdf.setTextColor(...NAVY);
    pdf.text('Country Director', W - 72.5, sigY - 2, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Shihan Vasant Kumar Singh', W - 72.5, sigY + 5, { align: 'center' });
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(...RED);
    pdf.text('5th Dan Black Belt (Japan)', W - 72.5, sigY + 13, { align: 'center' });

    // Footer
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.3);
    pdf.line(40, H - 22, W - 40, H - 22);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(...GREY);
    pdf.text('Kyokushin Karate Federation of India  |  www.kyokushinkarate.in', W / 2, H - 18, { align: 'center' });
    pdf.text('Certificate ID: ' + certId, W / 2, H - 14, { align: 'center' });

    return pdf;
};

export const downloadBeltCertificate = (data: BeltCertificateData) => {
    const pdf = generateBeltCertificate(data);
    const fileName = data.studentName.replace(/\s+/g, '_') + '_' + data.beltRank.replace(/\s+/g, '_') + '_Certificate.pdf';
    pdf.save(fileName);
};

export const downloadAllBeltCertificates = async (certificates: BeltCertificateData[]) => {
    for (const cert of certificates) {
        const pdf = generateBeltCertificate(cert);
        const fileName = cert.studentName.replace(/\s+/g, '_') + '_' + cert.beltRank.replace(/\s+/g, '_') + '_Certificate.pdf';
        pdf.save(fileName);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
};
