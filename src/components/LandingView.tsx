import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AuditHistoryEntry,
  AuditRequest,
  BusinessType,
} from '../types/audit';
import {
  formatDomainDisplay,
  normalizeAndValidateUrl,
} from '../utils/urlValidation';
import { getScoreTone } from './StatusIndicator';

interface LandingViewProps {
  onSubmitAudit: (request: AuditRequest) => void;
  history: AuditHistoryEntry[];
  onReopenAudit: (entry: AuditHistoryEntry) => void;
  onDeleteAudit: (auditId: string) => void;
  errorBanner?: string | null;
  historySectionRef: React.RefObject<HTMLElement | null>;
}

const COUNTRY_OPTIONS = [
  'Global',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'India',
  'Singapore',
  'Japan',
  'Netherlands',
  'Spain',
  'Brazil',
];

const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Japanese',
  'Italian',
  'Dutch',
];

const BUSINESS_TYPES: { value: BusinessType | ''; label: string }[] = [
  { value: '', label: 'Auto-detect / General' },
  { value: 'saas', label: 'SaaS / Software' },
  { value: 'ecommerce', label: 'E-Commerce / Retail' },
  { value: 'local_business', label: 'Local Business' },
  { value: 'blog_publisher', label: 'Blog / Publisher' },
  { value: 'portfolio', label: 'Portfolio / Agency' },
];

export const LandingView: React.FC<LandingViewProps> = ({
  onSubmitAudit,
  history,
  onReopenAudit,
  onDeleteAudit,
  errorBanner,
  historySectionRef,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const [targetCountry, setTargetCountry] = useState('Global');
  const [primaryLanguage, setPrimaryLanguage] = useState('English');
  const [businessType, setBusinessType] = useState<BusinessType | ''>('');
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [competitorError, setCompetitorError] = useState<string | null>(null);

  const handleUrlBlur = () => {
    if (!urlInput.trim()) return;
    const result = normalizeAndValidateUrl(urlInput);
    if (result.valid) {
      setUrlInput(result.normalizedUrl);
      setUrlError(null);
    }
  };

  const handleCompetitorChange = (index: number, value: string) => {
    setCompetitors((prev) => prev.map((item, i) => (i === index ? value : item)));
    setCompetitorError(null);
  };

  const handleAddCompetitor = () => {
    if (competitors.length >= 3) return;
    setCompetitors((prev) => [...prev, '']);
  };

  const handleRemoveCompetitor = (index: number) => {
    setCompetitors((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [''] : next;
    });
    setCompetitorError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urlCheck = normalizeAndValidateUrl(urlInput);
    if (!urlCheck.valid) {
      setUrlError(urlCheck.error ?? 'Please enter a valid URL.');
      return;
    }

    const validCompetitors: string[] = [];
    for (const rawComp of competitors) {
      const trimmed = rawComp.trim();
      if (!trimmed) continue;
      const compCheck = normalizeAndValidateUrl(trimmed);
      if (!compCheck.valid) {
        setShowOptions(true);
        setCompetitorError(`Invalid competitor URL "${trimmed}": ${compCheck.error}`);
        return;
      }
      validCompetitors.push(compCheck.normalizedUrl);
    }

    setUrlError(null);
    setCompetitorError(null);
    setUrlInput(urlCheck.normalizedUrl);

    onSubmitAudit({
      url: urlCheck.normalizedUrl,
      targetCountry,
      primaryLanguage,
      businessType,
      competitorUrls: validCompetitors,
    });
  };

  return (
    <main className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
      {/* Hero + Audit Form */}
      <section id="audit-form" className="max-w-3xl mx-auto">
        <div className="text-center space-y-4 mb-8">
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
            Complete SEO, technical, content, and AI-search audits in one report.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Enter any live website URL to inspect on-page signals, technical readiness, keyword opportunities, and Generative Engine Optimization.
          </p>
        </div>

        {errorBanner && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800"
          >
            <strong className="font-semibold">Audit could not complete: </strong>
            {errorBanner}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="audit-url-input" className="sr-only">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="audit-url-input"
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (urlError) setUrlError(null);
                  }}
                  onBlur={handleUrlBlur}
                  placeholder="Enter website URL (e.g., stripe.com or https://example.com)"
                  className={`w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-colors ${
                    urlError
                      ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600'
                  }`}
                />
              </div>
              {urlError && (
                <p className="mt-2 text-xs font-medium text-red-700" role="alert">
                  {urlError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <span>Run Audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Optional Context */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setShowOptions((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {showOptions ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span>
                {showOptions
                  ? 'Hide targeting & competitor options'
                  : 'Add target country, language, business type, or competitors (optional)'}
              </span>
            </button>

            <span className="text-xs text-slate-400 hidden sm:inline">
              Live page + search analysis
            </span>
          </div>

          {showOptions && (
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="target-country"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Target Country
                  </label>
                  <select
                    id="target-country"
                    value={targetCountry}
                    onChange={(e) => setTargetCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="primary-language"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Primary Language
                  </label>
                  <select
                    id="primary-language"
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="business-type"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Business Type
                  </label>
                  <select
                    id="business-type"
                    value={businessType}
                    onChange={(e) =>
                      setBusinessType(e.target.value as BusinessType | '')
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  >
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt.label} value={bt.value}>
                        {bt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Competitor URLs (up to 3)
                  </label>
                  {competitors.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddCompetitor}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add competitor</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {competitors.map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="url"
                        value={comp}
                        onChange={(e) => handleCompetitorChange(idx, e.target.value)}
                        placeholder={`Competitor ${idx + 1} URL (e.g., competitor.com)`}
                        aria-label={`Competitor ${idx + 1} URL`}
                        className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                      {(competitors.length > 1 || comp.trim() !== '') && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCompetitor(idx)}
                          aria-label={`Remove competitor ${idx + 1}`}
                          className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {competitorError && (
                  <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
                    {competitorError}
                  </p>
                )}
              </div>
            </div>
          )}
        </form>
      </section>

      {/* Saved Audit History */}
      {history.length > 0 && (
        <section
          ref={historySectionRef}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">
                Recent Audits
              </h2>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              {history.length} of 10 saved locally
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {history.map((entry) => {
              const tone = getScoreTone(entry.report.overallScore);
              const dateLabel = new Date(entry.report.createdAt).toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric', year: 'numeric' },
              );
              const checkedCount = entry.checkedChecklistIds.length;
              const totalChecklist = entry.report.technicalChecklist.items.length;

              return (
                <div
                  key={entry.report.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-sm font-bold tabular-nums ${tone.text}`}
                      >
                        {entry.report.overallScore}/100
                      </span>
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {formatDomainDisplay(entry.report.input.url)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{dateLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.report.input.targetCountry || 'Global'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.report.input.primaryLanguage || 'English'}</span>
                      {entry.report.input.businessType && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">
                            {entry.report.input.businessType.replace('_', ' ')}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {checkedCount}/{totalChecklist} checklist items done
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onReopenAudit(entry)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      Open Report
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAudit(entry.report.id)}
                      aria-label={`Delete audit for ${entry.report.input.url}`}
                      className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Audit Scope Overview */}
      <section id="modules-included" className="pt-4 border-t border-slate-200">
        <div className="mb-8">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Five-module diagnostic coverage
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Every audit evaluates your live page and search landscape across traditional search and generative AI engines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              index: '01',
              title: 'On-Page SEO Audit',
              desc: 'Evaluates title tags, meta descriptions, H1-H6 hierarchy, URL structure, canonicals, image alt text, Open Graph cards, and E-E-A-T trust signals.',
            },
            {
              index: '02',
              title: 'Technical SEO Checklist',
              desc: '25+ grouped checks across crawlability, Core Web Vitals likelihood, mobile UX, HTTPS security, Schema.org markup, and hreflang with saved check-off progress.',
            },
            {
              index: '03',
              title: 'Content Recommendations',
              desc: 'Identifies competitor content gaps, 10 outlined blog or landing page topics, topic clusters, refresh targets, and internal linking paths.',
            },
            {
              index: '04',
              title: 'Keyword Suggestions',
              desc: 'Produces 25 to 40 keywords grouped into primary, secondary, long-tail, and question-based terms with intent, AI-estimated difficulty, and quick wins.',
            },
            {
              index: '05',
              title: 'AI-Search Optimization (GEO)',
              desc: 'Assesses entity clarity, direct-answer formatting, citation density, llms.txt readiness, and provides copy-ready quotable blocks for AI engines.',
            },
            {
              index: '06',
              title: 'Multi-Format Exports',
              desc: 'Download the scored executive report as a multi-page PDF, structured CSV workbook, or complete JSON dataset.',
            },
          ].map((mod) => (
            <div
              key={mod.index}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                {mod.index}
              </div>
              <h3 className="mt-2 text-base font-semibold text-slate-900">
                {mod.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                {mod.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
