import jsPDF from 'jspdf';

interface CertificateData {
    participantName: string;
    categoryName: string;
    position: number;
    tournamentName: string;
    date: string;
    location: string;
    dojoName?: string;
}

export const generateCertificate = (data: CertificateData) => {
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Background
    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Border
    pdf.setDrawColor(220, 38, 38); // Red
    pdf.setLineWidth(2);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Inner border
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.5);
    pdf.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(36);
    pdf.setTextColor(220, 38, 38);
    pdf.text('CERTIFICATE OF ACHIEVEMENT', pageWidth / 2, 35, { align: 'center' });

    // Subtitle
    pdf.setFontSize(16);
    pdf.setTextColor(200, 200, 200);
    pdf.text('Kyokushin Karate Tournament', pageWidth / 2, 45, { align: 'center' });

    // Awarded to
    pdf.setFontSize(14);
    pdf.setTextColor(150, 150, 150);
    pdf.text('This certificate is proudly presented to', pageWidth / 2, 65, { align: 'center' });

    // Participant Name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(32);
    pdf.setTextColor(255, 215, 0); // Gold
    pdf.text(data.participantName.toUpperCase(), pageWidth / 2, 80, { align: 'center' });

    // Position line
    pdf.setFontSize(14);
    pdf.setTextColor(150, 150, 150);
    pdf.text('for achieving', pageWidth / 2, 95, { align: 'center' });

    // Position with medal
    let positionText = '';
    let positionColor: [number, number, number] = [255, 215, 0];
    
    switch(data.position) {
        case 1:
            positionText = '🥇 FIRST PLACE';
            positionColor = [255, 215, 0]; // Gold
            break;
        case 2:
            positionText = '🥈 SECOND PLACE';
            positionColor = [192, 192, 192]; // Silver
            break;
        case 3:
            positionText = '🥉 THIRD PLACE';
            positionColor = [205, 127, 50]; // Bronze
            break;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(...positionColor);
    pdf.text(positionText, pageWidth / 2, 110, { align: 'center' });

    // Category
    pdf.setFontSize(16);
    pdf.setTextColor(200, 200, 200);
    pdf.text(`Category: ${data.categoryName}`, pageWidth / 2, 125, { align: 'center' });

    // Tournament details
    pdf.setFontSize(14);
    pdf.setTextColor(150, 150, 150);
    pdf.text(data.tournamentName, pageWidth / 2, 140, { align: 'center' });
    
    const dateStr = new Date(data.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    pdf.text(`${dateStr} • ${data.location}`, pageWidth / 2, 148, { align: 'center' });

    // Dojo name if available
    if (data.dojoName) {
        pdf.setFontSize(12);
        pdf.setTextColor(180, 180, 180);
        pdf.text(`Representing: ${data.dojoName}`, pageWidth / 2, 158, { align: 'center' });
    }

    // Signature line
    const signatureY = pageHeight - 35;
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(150, 150, 150);
    pdf.line(40, signatureY, 100, signatureY);
    
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Tournament Director', 70, signatureY + 5, { align: 'center' });

    // Date on right
    pdf.line(pageWidth - 100, signatureY, pageWidth - 40, signatureY);
    pdf.text('Date', pageWidth - 70, signatureY + 5, { align: 'center' });

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Kyokushin Karate Federation of India', pageWidth / 2, pageHeight - 15, { align: 'center' });

    return pdf;
};

export const downloadCertificate = (data: CertificateData) => {
    const pdf = generateCertificate(data);
    const fileName = `${data.participantName.replace(/\s+/g, '_')}_Certificate_${data.position}${getPositionSuffix(data.position)}_Place.pdf`;
    pdf.save(fileName);
};

export const downloadAllCertificates = async (certificates: CertificateData[]) => {
    for (const cert of certificates) {
        const pdf = generateCertificate(cert);
        const fileName = `${cert.categoryName.replace(/\s+/g, '_')}_${cert.position}${getPositionSuffix(cert.position)}_${cert.participantName.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
    }
};

const getPositionSuffix = (position: number): string => {
    if (position === 1) return 'st';
    if (position === 2) return 'nd';
    if (position === 3) return 'rd';
    return 'th';
};
