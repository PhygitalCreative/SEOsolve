import React, { useRef, useState } from 'react';
import {
  Download,
  ExternalLink,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react';
import type { AuditReport } from '../types/audit';
import {
  exportAuditToCsv,
  exportAuditToJson,
  exportAuditToPdf,
} from '../utils/exporters';
import { formatDomainDisplay } from '../utils/urlValidation';
import { ContentTab } from './ContentTab';
import { GeoTab } from './GeoTab';
import type { DashboardTab } from './Header';
import { KeywordsTab } from './KeywordsTab';
import { OnPageSeoTab } from './OnPageSeoTab';
import { OverviewTab } from './OverviewTab';
import { PdfReportTemplate } from './PdfReportTemplate';
import { TechnicalChecklistTab } from './TechnicalChecklistTab';

interface DashboardViewProps {
  report: AuditReport;
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  checkedChecklistIds: string[];
  onToggleChecklistItem: (itemId: string) => void;
}

const TAB_ITEMS: { id: DashboardTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'seo', label: 'On-Page SEO' },
  { id: 'technical', label: 'Technical Checklist' },
  { id: 'content', label: 'Content' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'geo', label: 'AI-Search (GEO)' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  report,
  activeTab,
  onSelectTab,
  checkedChecklistIds,
  onToggleChecklistItem,
}) => {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  const auditedDate = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleExportPdf = async () => {
    if (!pdfContainerRef.current || exportingPdf) return;
    setExportingPdf(true);
    setExportError(null);
    try {
      await exportAuditToPdf(pdfContainerRef.current, report);
    } catch (err) {
      setExportError(
        err instanceof Error
          ? `PDF export failed: ${err.message}`
          : 'PDF export failed. Try CSV or JSON export.',
      );
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <main className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Workspace Toolbar */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 truncate">
              {formatDomainDisplay(report.input.url)}
            </h1>
            <a
              href={report.input.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${report.input.url} in new tab`}
              className="text-slate-400 hover:text-blue-700 transition-colors shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Audited {auditedDate}</span>
            <span aria-hidden="true">·</span>
            <span>{report.input.targetCountry || 'Global'}</span>
            <span aria-hidden="true">·</span>
            <span>{report.input.primaryLanguage || 'English'}</span>
            {report.input.businessType && (
              <>
                <span aria-hidden="true">·</span>
                <span className="capitalize">
                  {report.input.businessType.replace('_', ' ')}
                </span>
              </>
            )}
            {report.input.competitorUrls &&
              report.input.competitorUrls.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {report.input.competitorUrls.length} competitor
                    {report.input.competitorUrls.length > 1 ? 's' : ''} compared
                  </span>
                </>
              )}
          </div>
        </div>

        {/* Export Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {exportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{exportingPdf ? 'Building PDF...' : 'Export PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportAuditToCsv(report, checkedChecklistIds)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => exportAuditToJson(report, checkedChecklistIds)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <FileJson className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </section>

      {exportError && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between gap-4"
        >
          <span>{exportError}</span>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Secondary Mobile/Tablet Tab Bar (also helpful as quick switcher on smaller screens) */}
      <div className="md:hidden flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Module Viewport */}
      {activeTab === 'overview' && (
        <OverviewTab
          report={report}
          checkedChecklistCount={checkedChecklistIds.length}
          onSelectTab={onSelectTab}
        />
      )}
      {activeTab === 'seo' && <OnPageSeoTab seoAudit={report.seoAudit} />}
      {activeTab === 'technical' && (
        <TechnicalChecklistTab
          technical={report.technicalChecklist}
          checkedIds={checkedChecklistIds}
          onToggleItem={onToggleChecklistItem}
        />
      )}
      {activeTab === 'content' && (
        <ContentTab content={report.contentRecommendations} />
      )}
      {activeTab === 'keywords' && (
        <KeywordsTab keywordsModule={report.keywordSuggestions} />
      )}
      {activeTab === 'geo' && <GeoTab geo={report.aiSearchGeo} />}

      {/* Quiet Footer Export Reminder */}
      <footer className="pt-4 pb-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
        <div>SEOsolve · Live Page & Search Diagnostics</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1 hover:text-slate-900"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Full PDF</span>
          </button>
        </div>
      </footer>

      {/* Off-screen Printable Executive Report for jsPDF + html2canvas */}
      <PdfReportTemplate
        report={report}
        checkedChecklistIds={checkedChecklistIds}
        containerRef={pdfContainerRef}
      />
    </main>
  );
};
