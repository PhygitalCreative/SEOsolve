import React from 'react';
import type { SeoAuditModule } from '../types/audit';
import { FindingsList } from './FindingsList';
import { getScoreTone } from './StatusIndicator';

interface OnPageSeoTabProps {
  seoAudit: SeoAuditModule;
}

export const OnPageSeoTab: React.FC<OnPageSeoTabProps> = ({ seoAudit }) => {
  const tone = getScoreTone(seoAudit.score);
  const snap = seoAudit.pageSnapshot;

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              On-Page SEO Audit
            </h2>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              {seoAudit.summary}
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <div className="text-xs font-medium text-slate-500">Module Score</div>
            <div className={`font-display text-3xl font-extrabold tabular-nums ${tone.text}`}>
              {seoAudit.score}
              <span className="text-sm font-medium text-slate-400">/100</span>
            </div>
          </div>
        </div>

        {/* Detected Page Snapshot */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Title Tag</span>
              <span className="font-mono tabular-nums">
                {snap.titleLength} chars
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {snap.detectedTitle || 'Not detected'}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Primary H1 Heading</span>
              <span className="font-mono tabular-nums">
                Word depth: {snap.wordCountEstimate}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {snap.detectedH1 || 'Not detected'}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg md:col-span-2">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Meta Description</span>
              <span className="font-mono tabular-nums">
                {snap.metaDescriptionLength} chars
              </span>
            </div>
            <div className="text-sm text-slate-800">
              {snap.detectedMetaDescription || 'Not detected'}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-medium text-slate-500 mb-1">
              Canonical & Social Metadata
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="truncate">
                <span className="text-slate-500">Canonical:</span>{' '}
                <span className="font-mono">{snap.canonicalUrl || 'Not detected'}</span>
              </div>
              <div>
                <span className="text-slate-500">Open Graph:</span>{' '}
                <span className="font-medium">
                  {snap.hasOpenGraph ? 'Present' : 'Missing / Not detected'}
                </span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-slate-500">Twitter Cards:</span>{' '}
                <span className="font-medium">
                  {snap.hasTwitterCards ? 'Present' : 'Missing / Not detected'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-medium text-slate-500 mb-1">
              Observed E-E-A-T Signals
            </div>
            {snap.eeatSignals.length > 0 ? (
              <div className="text-xs text-slate-700 leading-relaxed">
                {snap.eeatSignals.join(' · ')}
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Limited trust or authorship signals detected.
              </div>
            )}
          </div>
        </div>
      </section>

      <FindingsList
        findings={seoAudit.findings}
        title="On-Page SEO Findings & Fixes"
      />
    </div>
  );
};
