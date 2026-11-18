import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { AuditStepId } from '../types/audit';
import { formatDomainDisplay } from '../utils/urlValidation';

export const AUDIT_STEPS: { id: AuditStepId; label: string; detail: string }[] = [
  {
    id: 'reading_page',
    label: 'Reading page',
    detail: 'Fetching live page context, metadata, and search competitors',
  },
  {
    id: 'on_page_seo',
    label: 'Analyzing on-page SEO',
    detail: 'Inspecting headings, meta tags, internal links, and E-E-A-T signals',
  },
  {
    id: 'technical_signals',
    label: 'Checking technical signals',
    detail: 'Auditing crawlability, Core Web Vitals risks, security, and schema',
  },
  {
    id: 'researching_keywords',
    label: 'Researching keywords',
    detail: 'Mapping intent groups, content topics, and quick-win keyword gaps',
  },
  {
    id: 'ai_search_readiness',
    label: 'Evaluating AI-search readiness',
    detail: 'Scoring entity clarity, quotable structure, and GEO visibility',
  },
  {
    id: 'building_report',
    label: 'Building report',
    detail: 'Compiling module scores, action priorities, and export datasets',
  },
];

interface AuditProgressViewProps {
  targetUrl: string;
  currentStep: AuditStepId;
  onCancel: () => void;
}

export const AuditProgressView: React.FC<AuditProgressViewProps> = ({
  targetUrl,
  currentStep,
  onCancel,
}) => {
  const activeIndex = Math.max(
    0,
    AUDIT_STEPS.findIndex((s) => s.id === currentStep),
  );

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <p className="text-xs font-semibold text-blue-700">
              Live Website Audit in Progress
            </p>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-900 break-all">
              {formatDomainDisplay(targetUrl)}
            </h1>
          </div>
          <span className="font-mono text-xs font-medium text-slate-500 tabular-nums shrink-0">
            Step {activeIndex + 1} of {AUDIT_STEPS.length}
          </span>
        </div>

        <ol className="mt-6 space-y-4">
          {AUDIT_STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            return (
              <li
                key={step.id}
                className={`flex items-start gap-3.5 p-3 rounded-xl transition-colors ${
                  isActive ? 'bg-blue-50/70' : ''
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : isActive ? (
                    <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full border border-slate-300 text-slate-400 text-xs font-mono flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div
                    className={`text-sm font-semibold ${
                      isCompleted
                        ? 'text-slate-900'
                        : isActive
                          ? 'text-blue-900'
                          : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${
                      isActive
                        ? 'text-blue-700'
                        : isCompleted
                          ? 'text-slate-500'
                          : 'text-slate-400'
                    }`}
                  >
                    {step.detail}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Analyzing live URL context and search results typically takes 15–30 seconds.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
};
