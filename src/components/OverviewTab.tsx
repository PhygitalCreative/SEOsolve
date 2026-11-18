import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import type { AuditReport } from '../types/audit';
import type { DashboardTab } from './Header';
import { PriorityLabel, getScoreTone } from './StatusIndicator';

interface OverviewTabProps {
  report: AuditReport;
  checkedChecklistCount: number;
  onSelectTab: (tab: DashboardTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  report,
  checkedChecklistCount,
  onSelectTab,
}) => {
  const modules: {
    id: DashboardTab;
    name: string;
    shortName: string;
    score: number;
    summary: string;
    meta: string;
  }[] = [
    {
      id: 'seo',
      name: 'On-Page SEO',
      shortName: 'On-Page',
      score: report.seoAudit.score,
      summary: report.seoAudit.summary,
      meta: `${report.seoAudit.findings.length} findings`,
    },
    {
      id: 'technical',
      name: 'Technical SEO',
      shortName: 'Technical',
      score: report.technicalChecklist.score,
      summary: report.technicalChecklist.summary,
      meta: `${checkedChecklistCount}/${report.technicalChecklist.items.length} checked`,
    },
    {
      id: 'content',
      name: 'Content Strategy',
      shortName: 'Content',
      score: report.contentRecommendations.score,
      summary: report.contentRecommendations.summary,
      meta: `${report.contentRecommendations.suggestedTopics.length} topics`,
    },
    {
      id: 'keywords',
      name: 'Keyword Research',
      shortName: 'Keywords',
      score: report.keywordSuggestions.score,
      summary: report.keywordSuggestions.summary,
      meta: `${report.keywordSuggestions.keywords.length} keywords`,
    },
    {
      id: 'geo',
      name: 'AI-Search (GEO)',
      shortName: 'AI Search',
      score: report.aiSearchGeo.score,
      summary: report.aiSearchGeo.summary,
      meta: `${report.aiSearchGeo.quotableSnippets.length} snippet blocks`,
    },
  ];

  const findingsBreakdownData = [
    {
      name: 'On-Page',
      findings: report.seoAudit.findings,
    },
    {
      name: 'Technical',
      findings: report.technicalChecklist.findings,
    },
    {
      name: 'Content',
      findings: report.contentRecommendations.findings,
    },
    {
      name: 'Keywords',
      findings: report.keywordSuggestions.findings,
    },
    {
      name: 'AI Search',
      findings: report.aiSearchGeo.findings,
    },
  ].map((group) => ({
    name: group.name,
    Pass: group.findings.filter((f) => f.status === 'pass').length,
    Warning: group.findings.filter((f) => f.status === 'warning').length,
    Fail: group.findings.filter((f) => f.status === 'fail').length,
  }));

  const overallTone = getScoreTone(report.overallScore);

  return (
    <div className="space-y-8">
      {/* Top Row: Overall Score + Executive Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              Composite Audit Score
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`font-display text-5xl font-extrabold tabular-nums ${overallTone.text}`}
              >
                {report.overallScore}
              </span>
              <span className="text-lg font-medium text-slate-400 tabular-nums">
                / 100
              </span>
            </div>
            <div className={`mt-1 text-sm font-semibold ${overallTone.text}`}>
              {overallTone.label} health baseline
            </div>
          </div>

          <div className="mt-6">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${overallTone.bar} rounded-full`}
                style={{ width: `${report.overallScore}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500 tabular-nums">
              <span>0</span>
              <span>Target benchmark: 80+</span>
              <span>100</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Executive Summary
            </h2>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              {report.executiveSummary}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-500">Total Findings</div>
              <div className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">
                {findingsBreakdownData.reduce(
                  (acc, d) => acc + d.Pass + d.Warning + d.Fail,
                  0,
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Critical Fails</div>
              <div className="mt-0.5 text-lg font-bold text-red-700 tabular-nums">
                {findingsBreakdownData.reduce((acc, d) => acc + d.Fail, 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Checklist Items</div>
              <div className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">
                {report.technicalChecklist.items.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Quick-Win Keywords</div>
              <div className="mt-0.5 text-lg font-bold text-blue-700 tabular-nums">
                {report.keywordSuggestions.keywords.filter((k) => k.quickWin).length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Module Score Cards */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Module Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {modules.map((mod) => {
            const tone = getScoreTone(mod.score);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onSelectTab(mod.id)}
                className="text-left bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 transition-colors flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                      {mod.name}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 transition-colors shrink-0" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span
                      className={`font-display text-2xl font-bold tabular-nums ${tone.text}`}
                    >
                      {mod.score}
                    </span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      /100
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {mod.summary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-slate-500 tabular-nums">
                  {mod.meta}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recharts Visualizations */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">
              Module Scores vs. 80-Point Benchmark
            </h3>
            <p className="text-xs text-slate-500">
              Scores across all five audit dimensions (0–100 scale)
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modules.map((m) => ({ name: m.shortName, score: m.score }))}
                margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={80}
                  stroke="#15803d"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Target 80',
                    position: 'insideTopRight',
                    fill: '#15803d',
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {modules.map((m) => (
                    <Cell
                      key={m.id}
                      fill={
                        m.score >= 80
                          ? '#16a34a'
                          : m.score >= 60
                            ? '#2563eb'
                            : '#dc2626'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">
              Findings Status Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Pass, warning, and fail counts per module
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={findingsBreakdownData}
                margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Pass" stackId="a" fill="#16a34a" maxBarSize={44} />
                <Bar dataKey="Warning" stackId="a" fill="#d97706" maxBarSize={44} />
                <Bar
                  dataKey="Fail"
                  stackId="a"
                  fill="#dc2626"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Top Priority Action Plan */}
      <section className="bg-white border border-slate-200 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Top Priority Action Plan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Highest-impact improvements sequenced across SEO, technical, content, and AI search
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {report.topPriorities.map((item, idx) => (
            <div key={idx} className="p-5 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                    0{idx + 1}.
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <span className="text-xs text-slate-400" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    {item.module}
                  </span>
                </div>
                <PriorityLabel priority={item.priority} />
              </div>
              <p className="text-sm text-slate-700">{item.action}</p>
              <p className="text-xs text-slate-500">
                Expected impact: {item.expectedImpact}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Grounding Sources */}
      {report.groundingSources.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Verified Live Page & Search Sources
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            URLs inspected via URL Context and Google Search grounding during this audit
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.groundingSources.map((src, i) => (
              <a
                key={`${src.url}-${i}`}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-900 truncate">
                    {src.title}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {src.sourceType === 'url_context'
                      ? 'Direct URL Context'
                      : 'Google Search Grounding'}{' '}
                    · {src.url}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
