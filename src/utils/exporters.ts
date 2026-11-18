import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { AuditReport } from '../types/audit';
import { formatDomainDisplay } from './urlValidation';

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsvCell(value: string | number | boolean): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildBaseFilename(report: AuditReport): string {
  const domain = formatDomainDisplay(report.input.url)
    .replace(/[^a-z0-9.-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const datePart = report.createdAt.slice(0, 10);
  return `seosolve-audit-${domain || 'site'}-${datePart}`;
}

export function exportAuditToJson(
  report: AuditReport,
  checkedChecklistIds: string[],
): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    checkedChecklistIds,
    report,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerBlobDownload(blob, `${buildBaseFilename(report)}.json`);
}

export function exportAuditToCsv(
  report: AuditReport,
  checkedChecklistIds: string[],
): void {
  const checkedSet = new Set(checkedChecklistIds);
  const rows: string[][] = [];

  rows.push(['SEOsolve Digital Marketing Audit Export']);
  rows.push(['Target URL', report.input.url]);
  rows.push(['Audited At', report.createdAt]);
  rows.push(['Target Country', report.input.targetCountry || 'Global']);
  rows.push(['Primary Language', report.input.primaryLanguage || 'English']);
  rows.push(['Business Type', report.input.businessType || 'General']);
  rows.push(['Overall Score', String(report.overallScore)]);
  rows.push([]);

  rows.push(['MODULE SCORES']);
  rows.push(['Module', 'Score (0-100)', 'Summary']);
  rows.push(['On-Page SEO', String(report.seoAudit.score), report.seoAudit.summary]);
  rows.push([
    'Technical SEO',
    String(report.technicalChecklist.score),
    report.technicalChecklist.summary,
  ]);
  rows.push([
    'Content Strategy',
    String(report.contentRecommendations.score),
    report.contentRecommendations.summary,
  ]);
  rows.push([
    'Keyword Research',
    String(report.keywordSuggestions.score),
    report.keywordSuggestions.summary,
  ]);
  rows.push([
    'AI-Search (GEO)',
    String(report.aiSearchGeo.score),
    report.aiSearchGeo.summary,
  ]);
  rows.push([]);

  rows.push(['PRIORITIZED FINDINGS']);
  rows.push(['Module', 'ID', 'Title', 'Status', 'Priority', 'Impact', 'Actionable Fix']);
  const moduleFindings = [
    ...report.seoAudit.findings.map((f) => ['On-Page SEO', f] as const),
    ...report.technicalChecklist.findings.map((f) => ['Technical SEO', f] as const),
    ...report.contentRecommendations.findings.map((f) => ['Content', f] as const),
    ...report.keywordSuggestions.findings.map((f) => ['Keywords', f] as const),
    ...report.aiSearchGeo.findings.map((f) => ['AI-Search (GEO)', f] as const),
  ];
  for (const [mod, f] of moduleFindings) {
    rows.push([mod, f.id, f.title, f.status, f.priority, f.impact, f.fix]);
  }
  rows.push([]);

  rows.push(['TECHNICAL SEO CHECKLIST']);
  rows.push([
    'ID',
    'Group',
    'Check Item',
    'Status',
    'Priority',
    'User Checked Off',
    'Details',
    'Recommended Fix',
  ]);
  for (const item of report.technicalChecklist.items) {
    rows.push([
      item.id,
      item.group,
      item.title,
      item.status,
      item.priority,
      checkedSet.has(item.id) ? 'Yes' : 'No',
      item.details,
      item.fix,
    ]);
  }
  rows.push([]);

  rows.push(['SUGGESTED CONTENT TOPICS']);
  rows.push(['Title', 'Format', 'Search Intent', 'Target Keyword', 'H2 Outline']);
  for (const topic of report.contentRecommendations.suggestedTopics) {
    rows.push([
      topic.title,
      topic.format,
      topic.searchIntent,
      topic.targetKeyword,
      topic.suggestedOutline.join(' | '),
    ]);
  }
  rows.push([]);

  rows.push([
    'KEYWORD SUGGESTIONS (Note: Volume and difficulty are AI estimates, not tool-verified data)',
  ]);
  rows.push([
    'Keyword',
    'Group',
    'Search Intent',
    'Estimated Difficulty (AI Estimate)',
    'Estimated Volume Band (AI Estimate)',
    'Relevance (1-10)',
    'Content Type to Target',
    'Quick Win',
  ]);
  for (const kw of report.keywordSuggestions.keywords) {
    rows.push([
      kw.keyword,
      kw.group,
      kw.searchIntent,
      kw.estimatedDifficulty,
      kw.estimatedVolumeBand,
      String(kw.estimatedRelevance),
      kw.contentTypeToTarget,
      kw.quickWin ? 'Yes' : 'No',
    ]);
  }

  const csvContent = rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  triggerBlobDownload(blob, `${buildBaseFilename(report)}.csv`);
}

export async function exportAuditToPdf(
  printElement: HTMLElement,
  report: AuditReport,
): Promise<void> {
  const canvas = await html2canvas(printElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (clonedDoc) => {
      // Remove Tailwind v4 stylesheets containing oklch() from cloned print document;
      // PdfReportTemplate relies solely on explicit hex/rgb inline styles.
      const styleTags = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
      styleTags.forEach((node) => {
        if (!node.hasAttribute('data-pdf-safe')) {
          node.remove();
        }
      });
      const root = clonedDoc.getElementById('seosolve-pdf-root');
      if (root) {
        root.style.display = 'block';
      }
    },
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pageCanvas = document.createElement('canvas');
  const pageCtx = pageCanvas.getContext('2d');
  if (!pageCtx) {
    throw new Error('Could not initialize canvas context for PDF rendering.');
  }

  const sliceHeightPx = Math.floor((usableHeight * canvas.width) / usableWidth);
  let yOffsetPx = 0;
  let pageIndex = 0;

  while (yOffsetPx < canvas.height) {
    const currentSlicePx = Math.min(sliceHeightPx, canvas.height - yOffsetPx);
    pageCanvas.width = canvas.width;
    pageCanvas.height = currentSlicePx;

    pageCtx.fillStyle = '#ffffff';
    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageCtx.drawImage(
      canvas,
      0,
      yOffsetPx,
      canvas.width,
      currentSlicePx,
      0,
      0,
      canvas.width,
      currentSlicePx,
    );

    const sliceDataUrl = pageCanvas.toDataURL('image/jpeg', 0.92);
    const sliceHeightMm = (currentSlicePx * imgWidth) / canvas.width;

    if (pageIndex > 0) {
      pdf.addPage();
    }
    pdf.addImage(sliceDataUrl, 'JPEG', margin, margin, imgWidth, sliceHeightMm);

    yOffsetPx += currentSlicePx;
    pageIndex += 1;

    // Safety cap in case imgHeight was tiny
    if (imgHeight <= usableHeight) break;
  }

  pdf.save(`${buildBaseFilename(report)}.pdf`);
}
