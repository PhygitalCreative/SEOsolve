import React, { useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Check, Copy } from 'lucide-react';
import type { GeoModule } from '../types/audit';
import { FindingsList } from './FindingsList';
import { getScoreTone } from './StatusIndicator';

interface GeoTabProps {
  geo: GeoModule;
}

export const GeoTab: React.FC<GeoTabProps> = ({ geo }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const tone = getScoreTone(geo.score);

  const handleCopySnippet = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      window.setTimeout(() => setCopiedIdx(null), 1800);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            AI-Search Optimization (GEO)
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">{geo.summary}</p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <div className="text-xs font-medium text-slate-500">Module Score</div>
          <div className={`font-display text-3xl font-extrabold tabular-nums ${tone.text}`}>
            {geo.score}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </div>
        </div>
      </section>

      {/* Readiness Radar + Dimensions Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Generative Engine Readiness Profile
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-2">
            Citation and answer-synthesis readiness across five GEO pillars
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="72%"
                data={geo.readinessDimensions.map((d) => ({
                  dimension: d.dimension,
                  score: d.score,
                }))}
              >
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 11, fill: '#334155' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Radar
                  name="GEO Score"
                  dataKey="score"
                  stroke="#1d4ed8"
                  fill="#2563eb"
                  fillOpacity={0.22}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              GEO Dimension Scores
            </h3>
            <div className="space-y-4">
              {geo.readinessDimensions.map((dim) => {
                const dimTone = getScoreTone(dim.score);
                return (
                  <div key={dim.dimension}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900">
                        {dim.dimension}
                      </span>
                      <span className={`font-mono font-bold tabular-nums ${dimTone.text}`}>
                        {dim.score}/100
                      </span>
                    </div>
                    <div className="mt-1.5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${dimTone.bar} rounded-full`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{dim.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* llms.txt & AI Visibility Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-slate-900">
              llms.txt & AI Crawler Readiness
            </h3>
            <span className="font-mono text-xs font-medium text-blue-700">
              {geo.llmsTxtRecommendation.status}
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {geo.llmsTxtRecommendation.recommendation}
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-2">
            AI Answer Visibility Gaps
          </h3>
          <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
            {geo.aiVisibilityGaps.map((gap, idx) => (
              <li key={idx} className="leading-relaxed">
                {gap}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Quotable Snippets */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Citation-Ready Copy Blocks
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Concise definition and direct-answer blocks formatted for Google AI Overviews, Perplexity, and ChatGPT Search citations
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {geo.quotableSnippets.map((snippet, idx) => (
            <div key={idx} className="p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {snippet.targetTopic}
                  </h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Recommended placement: {snippet.placement}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopySnippet(snippet.suggestedCopy, idx)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy block</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 leading-relaxed">
                {snippet.suggestedCopy}
              </div>

              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Why this gets cited: </span>
                {snippet.whyItWorks}
              </p>
            </div>
          ))}
        </div>
      </section>

      <FindingsList
        findings={geo.findings}
        title="AI-Search (GEO) Findings & Fixes"
      />
    </div>
  );
};
