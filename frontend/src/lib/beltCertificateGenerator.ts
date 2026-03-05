import jsPDF from 'jspdf';

/** Load an image from a URL and return as base64 data URI */
function loadImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('No canvas context')); return; }
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Image load failed: ' + url));
        img.src = url;
    });
}

// Cache loaded logo data URIs
let kkfiLogoCache: string | null = null;
let lowKickLogoCache: string | null = null;

async function getLogos(): Promise<{ kkfi: string | null; lowKick: string | null }> {
    if (!kkfiLogoCache) {
        try { kkfiLogoCache = await loadImageAsBase64('/kkfi-logo.png'); } catch { kkfiLogoCache = null; }
    }
    if (!lowKickLogoCache) {
        try { lowKickLogoCache = await loadImageAsBase64('/low-kick-logo.png'); } catch { lowKickLogoCache = null; }
    }
    return { kkfi: kkfiLogoCache, lowKick: lowKickLogoCache };
}

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

export const generateBeltCertificate = async (data: BeltCertificateData): Promise<jsPDF> => {
    const logos = await getLogos();
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
    if (logos.kkfi) {
        try { pdf.addImage(logos.kkfi, 'PNG', 18, 14, 18, 18); } catch { /* silent */ }
    }

    // Low Kick Logo (top-right)
    if (logos.lowKick) {
        try { pdf.addImage(logos.lowKick, 'PNG', W - 36, 15, 14, 12); } catch { /* silent */ }
    }

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

export const downloadBeltCertificate = async (data: BeltCertificateData) => {
    const pdf = await generateBeltCertificate(data);
    const fileName = data.studentName.replace(/\s+/g, '_') + '_' + data.beltRank.replace(/\s+/g, '_') + '_Certificate.pdf';
    pdf.save(fileName);
};

export const downloadAllBeltCertificates = async (certificates: BeltCertificateData[]) => {
    for (const cert of certificates) {
        const pdf = await generateBeltCertificate(cert);
        const fileName = cert.studentName.replace(/\s+/g, '_') + '_' + cert.beltRank.replace(/\s+/g, '_') + '_Certificate.pdf';
        pdf.save(fileName);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
};
