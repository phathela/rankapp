import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const CERTIFICATES_DIR = path.resolve(__dirname, '../../certificates');

function ensureCertificatesDir(): void {
  if (!fs.existsSync(CERTIFICATES_DIR)) {
    fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
  }
}

export async function generateCertificate(
  rankingTitle: string,
  winnerName: string,
  date: Date
): Promise<{ buffer: Buffer; filename: string; filePath: string }> {
  ensureCertificatesDir();

  return new Promise((resolve, reject) => {
    const sanitizedTitle = rankingTitle
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    const timestamp = Date.now();
    const filename = `certificate_${sanitizedTitle}_${timestamp}.pdf`;
    const filePath = path.join(CERTIFICATES_DIR, filename);

    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      info: {
        Title: `Certificate - ${rankingTitle}`,
        Author: 'RankApp',
        Subject: 'Ranking Winner Certificate',
      },
    });

    const stream = fs.createWriteStream(filePath);

    stream.on('finish', () => {
      const buffer = fs.readFileSync(filePath);
      resolve({ buffer, filename, filePath });
    });

    stream.on('error', reject);

    doc.pipe(stream);

    // --- Border ---
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#1a1a2e');

    // --- Inner border ---
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke('#16213e');

    // --- Decorative top line ---
    doc.moveTo(80, 70).lineTo(doc.page.width - 80, 70).stroke('#e94560');

    // --- Title ---
    doc.fontSize(42).font('Helvetica-Bold').fillColor('#1a1a2e').text('RankApp', { align: 'center' });

    doc.moveDown(0.5);

    // --- Subtitle ---
    doc.fontSize(22).font('Helvetica').fillColor('#555555').text('Official Certificate', { align: 'center' });

    doc.moveDown(1.5);

    // --- Decorative divider ---
    doc.moveTo(doc.page.width / 2 - 100, doc.y).lineTo(doc.page.width / 2 + 100, doc.y).stroke('#e94560');

    doc.moveDown(1.5);

    // --- Awarded text ---
    doc.fontSize(16).font('Helvetica').fillColor('#333333').text('This certificate is proudly awarded to', { align: 'center' });

    doc.moveDown(1);

    // --- Winner name ---
    doc.fontSize(36).font('Helvetica-Bold').fillColor('#1a1a2e').text(winnerName, { align: 'center' });

    doc.moveDown(1);

    // --- Ranking title ---
    doc.fontSize(18).font('Helvetica').fillColor('#555555').text(`For winning the ranking:`, { align: 'center' });

    doc.moveDown(0.5);

    doc.fontSize(22).font('Helvetica-BoldOblique').fillColor('#16213e').text(rankingTitle, { align: 'center' });

    doc.moveDown(1.5);

    // --- Date ---
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.fontSize(14).font('Helvetica').fillColor('#777777').text(`Issued on ${formattedDate}`, { align: 'center' });

    doc.moveDown(3);

    // --- Bottom website ---
    doc.fontSize(12).font('Helvetica').fillColor('#999999').text('www.rankapp.com', { align: 'center' });

    // --- Decorative bottom line ---
    const bottomY = doc.page.height - 50;
    doc.moveTo(80, bottomY).lineTo(doc.page.width - 80, bottomY).stroke('#e94560');

    doc.end();
  });
}
