import jsPDF from 'jspdf';

interface BeltCertificateData {
    studentName: string;
    instructorName: string;
    beltRank: string;
    dateOfApproval: string;
}

const BELT_HEX: Record<string, string> = {
    'White': '#FFFFFF',
    'Orange': '#F97316',
    'Blue': '#3B82F6',
    'Yellow': '#FACC15',
    'Green': '#22C55E',
    'Brown': '#92400E',
    'Black 1st Dan': '#000000',
    'Black 2nd Dan': '#000000',
    'Black 3rd Dan': '#000000',
    'Black 4th Dan': '#000000',
};

function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

export const generateBeltCertificate = (data: BeltCertificateData): jsPDF => {
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

    const W = pdf.internal.pageSize.getWidth();   // 297
    const H = pdf.internal.pageSize.getHeight();   // 210

    // ── Background ──
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');

    // ── Outer border (dark) ──
    pdf.setDrawColor(30, 30, 30);
    pdf.setLineWidth(2.5);
    pdf.rect(8, 8, W - 16, H - 16);

    // ── Inner border (red accent) ──
    pdf.setDrawColor(200, 30, 30);
    pdf.setLineWidth(1);
    pdf.rect(12, 12, W - 24, H - 24);

    // ── Corner decorations ──
    const cornerSize = 15;
    const corners = [
        [14, 14], [W - 14 - cornerSize, 14],
        [14, H - 14 - cornerSize], [W - 14 - cornerSize, H - 14 - cornerSize],
    ];
    pdf.setDrawColor(200, 30, 30);
    pdf.setLineWidth(0.5);
    for (const [cx, cy] of corners) {
        pdf.line(cx, cy, cx + cornerSize, cy);
        pdf.line(cx, cy, cx, cy + cornerSize);
        pdf.line(cx + cornerSize, cy, cx + cornerSize, cy + cornerSize);
        pdf.line(cx, cy + cornerSize, cx + cornerSize, cy + cornerSize);
    }

    // ── Organization name ──
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(200, 30, 30);
    pdf.text('KYOKUSHIN KARATE FEDERATION OF INDIA', W / 2, 30, { align: 'center' });

    // ── Title ──
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(32);
    pdf.setTextColor(30, 30, 30);
    pdf.text('CERTIFICATE', W / 2, 48, { align: 'center' });

    // ── Belt promotion subtitle ──
    pdf.setFontSize(14);
    pdf.setTextColor(80, 80, 80);
    pdf.text('OF BELT PROMOTION', W / 2, 57, { align: 'center' });

    // ── Thin divider ──
    pdf.setDrawColor(200, 30, 30);
    pdf.setLineWidth(0.5);
    pdf.line(W / 2 - 50, 62, W / 2 + 50, 62);

    // ── "This is to certify that" ──
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text('This is to certify that', W / 2, 74, { align: 'center' });

    // ── Student Name (large, bold) ──
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(30, 30, 30);
    pdf.text(data.studentName.toUpperCase(), W / 2, 90, { align: 'center' });

    // ── Underline under name ──
    const nameWidth = pdf.getTextWidth(data.studentName.toUpperCase());
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(W / 2 - nameWidth / 2, 93, W / 2 + nameWidth / 2, 93);

    // ── "has been promoted to the rank of" ──
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text('has been promoted to the rank of', W / 2, 105, { align: 'center' });

    // ── Belt Rank (colored) ──
    const beltColor = hexToRgb(BELT_HEX[data.beltRank] || '#333333');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    // For white/yellow belts, use dark outline text, otherwise use belt color
    if (data.beltRank === 'White' || data.beltRank === 'Yellow') {
        pdf.setTextColor(30, 30, 30);
    } else {
        pdf.setTextColor(...beltColor);
    }
    pdf.text(data.beltRank.toUpperCase(), W / 2, 120, { align: 'center' });

    // ── Small belt color bar ──
    const barWidth = 60;
    const barHeight = 4;
    if (data.beltRank === 'White') {
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.3);
        pdf.rect(W / 2 - barWidth / 2, 124, barWidth, barHeight);
    } else {
        pdf.setFillColor(...beltColor);
        pdf.rect(W / 2 - barWidth / 2, 124, barWidth, barHeight, 'F');
    }

    // ── Date of Approval ──
    const dateStr = new Date(data.dateOfApproval).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Date: ${dateStr}`, W / 2, 140, { align: 'center' });

    // ── Signature section ──
    const sigY = H - 42;

    // Instructor signature (left)
    pdf.setDrawColor(120, 120, 120);
    pdf.setLineWidth(0.3);
    pdf.line(50, sigY, 130, sigY);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(30, 30, 30);
    pdf.text(data.instructorName, 90, sigY - 4, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Instructor / Examiner', 90, sigY + 6, { align: 'center' });

    // President / Authority (right)
    pdf.setDrawColor(120, 120, 120);
    pdf.line(W - 130, sigY, W - 50, sigY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text('President, KKFI', W - 90, sigY + 6, { align: 'center' });

    // ── Footer ──
    pdf.setFontSize(7);
    pdf.setTextColor(160, 160, 160);
    pdf.text('Kyokushin Karate Federation of India — www.kyokushinkarate.in', W / 2, H - 16, { align: 'center' });

    return pdf;
};

export const downloadBeltCertificate = (data: BeltCertificateData) => {
    const pdf = generateBeltCertificate(data);
    const fileName = `${data.studentName.replace(/\s+/g, '_')}_${data.beltRank.replace(/\s+/g, '_')}_Certificate.pdf`;
    pdf.save(fileName);
};

export const downloadAllBeltCertificates = async (certificates: BeltCertificateData[]) => {
    for (const cert of certificates) {
        const pdf = generateBeltCertificate(cert);
        const fileName = `${cert.studentName.replace(/\s+/g, '_')}_${cert.beltRank.replace(/\s+/g, '_')}_Certificate.pdf`;
        pdf.save(fileName);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
};
